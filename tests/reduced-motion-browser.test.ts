import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { chromium, type Browser, type Page } from "playwright";
import {
  probeReducedMotionFinalPose,
  probeReducedMotionSource,
} from "../scripts/reduced-motion-runtime";

let browser: Browser;
let page: Page;

beforeAll(async () => {
  browser = await chromium.launch({ headless: true });
  page = await browser.newPage();
});

afterAll(async () => {
  await browser.close();
});

const scene = (css: string, body: string) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="200" height="200">
  <style>
    @keyframes bob { from { transform: translateY(0) } to { transform: translateY(2px) } }
    ${css}
  </style>
  ${body}
</svg>`;

describe("browser reduced-motion behavior", () => {
  test("combines separate reduced-motion media blocks through the real cascade", async () => {
    const source = scene(`
      .actor,.prop { animation: bob 1s infinite }
      @media (prefers-reduced-motion: reduce) { .actor { animation: none !important } }
      @media (prefers-reduced-motion: reduce) { .prop { animation: none !important } }
    `, '<g class="actor"/><g class="prop"/>');

    expect(await probeReducedMotionSource(page, source)).toEqual([]);
  });

  test("rejects a shutdown that loses to an important active declaration", async () => {
    const source = scene(`
      .actor { animation: bob 1s infinite !important }
      @media (prefers-reduced-motion: reduce) { .actor { animation: none } }
    `, '<g class="actor"/>');

    const animations = await probeReducedMotionSource(page, source);
    expect(animations).toHaveLength(1);
    expect(animations[0]).toMatchObject({ target: "g.actor", playState: "running" });
  });

  test("rejects a later important declaration that overrides the fallback", async () => {
    const source = scene(`
      .actor { animation: bob 1s infinite }
      @media (prefers-reduced-motion: reduce) { .actor { animation: none !important } }
      .actor { animation: bob 1s infinite !important }
    `, '<g class="actor"/>');

    expect(await probeReducedMotionSource(page, source)).toHaveLength(1);
  });

  test("does not let a data-animated marker on the wrong element hide child motion", async () => {
    const source = scene(`
      .actor { animation: bob 1s infinite }
      @media (prefers-reduced-motion: reduce) { [data-animated] { animation: none !important } }
    `, '<g data-animated="true"><g class="actor"/></g>');

    const animations = await probeReducedMotionSource(page, source);
    expect(animations).toHaveLength(1);
    expect(animations[0]?.target).toBe("g.actor");
  });

  test("accepts a data-animated shutdown when the animated element owns the marker", async () => {
    const source = scene(`
      .actor { animation: bob 1s infinite }
      @media (prefers-reduced-motion: reduce) { [data-animated] { animation: none !important } }
    `, '<g class="actor" data-animated="true"/>');

    expect(await probeReducedMotionSource(page, source)).toEqual([]);
  });

  test("accepts a frozen pose that remains visible", async () => {
    const source = scene(`
      .actor { animation: bob 1s infinite }
      @media (prefers-reduced-motion: reduce) { .actor { animation: none !important } }
    `, '<rect class="actor" x="4" y="4" width="8" height="8"/>');

    expect(await probeReducedMotionFinalPose(page, source)).toEqual([]);
  });

  test("rejects a reduced-motion fallback that hides a normally visible target", async () => {
    const source = scene(`
      .actor { animation: bob 1s infinite }
      @media (prefers-reduced-motion: reduce) {
        .actor { animation: none !important; opacity: 0 }
      }
    `, '<rect class="actor" x="4" y="4" width="8" height="8"/>');

    const poses = await probeReducedMotionFinalPose(page, source);
    expect(poses).toHaveLength(1);
    expect(poses[0]).toMatchObject({ target: "rect.actor", reason: "hidden", opacity: 0 });
  });

  test("samples beyond the startup frame before deciding a target was never visible", async () => {
    const source = scene(`
      @keyframes reveal { 0% { opacity: 0 } 50%,100% { opacity: 1 } }
      .actor { animation: reveal 1s linear infinite }
      @media (prefers-reduced-motion: reduce) {
        .actor { animation: none !important; opacity: 0 }
      }
    `, '<rect class="actor" x="4" y="4" width="8" height="8"/>');

    const poses = await probeReducedMotionFinalPose(page, source);
    expect(poses).toHaveLength(1);
    expect(poses[0]).toMatchObject({ target: "rect.actor", reason: "hidden" });
  });

  test("rejects a frozen target moved outside the SVG", async () => {
    const source = scene(`
      .actor { animation: bob 1s infinite }
      @media (prefers-reduced-motion: reduce) {
        .actor { animation: none !important; transform: translateX(200px) }
      }
    `, '<rect class="actor" x="4" y="4" width="8" height="8"/>');

    const poses = await probeReducedMotionFinalPose(page, source);
    expect(poses).toHaveLength(1);
    expect(poses[0]).toMatchObject({ target: "rect.actor", reason: "outside-svg" });
  });

  test("preserves an intentional reduced-motion sprite frame selection", async () => {
    const source = scene(`
      @keyframes frame0 { 0%,30% { opacity: 1 } 31%,100% { opacity: 0 } }
      @keyframes frame1 { 0%,30%,70%,100% { opacity: 0 } 31%,69% { opacity: 1 } }
      @keyframes frame2 { 0%,69% { opacity: 0 } 70%,100% { opacity: 1 } }
      [data-frame] { opacity: 0 }
      .frame-0 { animation: frame0 1s steps(1,end) infinite }
      .frame-1 { animation: frame1 1s steps(1,end) infinite }
      .frame-2 { animation: frame2 1s steps(1,end) infinite }
      @media (prefers-reduced-motion: reduce) {
        [data-frame] { animation: none !important }
        .frame-0,.frame-1 { opacity: 0 !important }
        .frame-2 { opacity: 1 !important }
      }
    `, `
      <g>
        <g class="frame-0" data-frame="0"><rect x="4" y="4" width="8" height="8"/></g>
        <g class="frame-1" data-frame="1"><rect x="4" y="4" width="8" height="8"/></g>
        <g class="frame-2" data-frame="2"><rect x="4" y="4" width="8" height="8"/></g>
      </g>
    `);

    expect(await probeReducedMotionFinalPose(page, source)).toEqual([]);
  });

  test("allows an explicitly intentional reduced-motion hide", async () => {
    const source = scene(`
      .actor { animation: bob 1s infinite }
      @media (prefers-reduced-motion: reduce) {
        .actor { animation: none !important; display: none }
      }
    `, '<rect class="actor" data-reduced-motion-hidden="true" x="4" y="4" width="8" height="8"/>');

    expect(await probeReducedMotionFinalPose(page, source)).toEqual([]);
  });
});
