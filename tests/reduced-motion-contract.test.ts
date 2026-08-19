import { describe, expect, test } from "bun:test";
import { validateReducedMotionSource } from "../scripts/reduced-motion-contract";

const svg = (motion: string, fallback: string) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" role="img">
  <style>
    ${motion}
    ${fallback}
  </style>
  <g data-animated="true" class="actor"><rect width="10" height="10" /></g>
</svg>`;

describe("reduced motion contract", () => {
  test("accepts an explicit CSS animation shutdown", () => {
    const source = svg(
      "@keyframes bob { to { transform: translateY(-1px); } } .actor { animation: bob 1s infinite; }",
      "@media (prefers-reduced-motion: reduce) { [data-animated] { animation: none !important; } }",
    );

    expect(validateReducedMotionSource("safe.svg", source)).toEqual([]);
  });

  test("rejects a decorative reduced-motion media query that leaves animation running", () => {
    const source = svg(
      "@keyframes bob { to { transform: translateY(-1px); } } .actor { animation: bob 1s infinite; }",
      "@media (prefers-reduced-motion: reduce) { .actor { opacity: 1; } }",
    );

    expect(validateReducedMotionSource("ineffective.svg", source)).toEqual([
      expect.objectContaining({ rule: "motion.reduced-effective" }),
    ]);
  });

  test("rejects animated SVGs without a reduced-motion block", () => {
    const source = svg(
      "@keyframes bob { to { transform: translateY(-1px); } } .actor { animation: bob 1s infinite; }",
      "",
    );

    expect(validateReducedMotionSource("missing.svg", source)).toEqual([
      expect.objectContaining({ rule: "motion.reduced-effective" }),
    ]);
  });

  test("preserves SMIL as a supported animation path when a reduced-motion block exists", () => {
    const source = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" role="img">
        <style>@media (prefers-reduced-motion: reduce) { .fallback { opacity: 1; } }</style>
        <circle data-animated="true" r="2"><animate attributeName="cx" values="2;8;2" dur="1s" repeatCount="indefinite" /></circle>
      </svg>`;

    expect(validateReducedMotionSource("smil.svg", source)).toEqual([]);
  });

  test("ignores static SVGs", () => {
    expect(
      validateReducedMotionSource(
        "static.svg",
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" /></svg>',
      ),
    ).toEqual([]);
  });
});
