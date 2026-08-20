import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  validateReducedMotionManifest,
  validateReducedMotionSource,
} from "../scripts/reduced-motion-contract";

const tempDirs: string[] = [];

const makeTempDir = async (): Promise<string> => {
  const path = await mkdtemp(join(tmpdir(), "vibe-svg-motion-"));
  tempDirs.push(path);
  return path;
};

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

const svg = (motion: string, fallback: string, animatedMarker = true) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" role="img">
  <style>
    ${motion}
    ${fallback}
  </style>
  <g ${animatedMarker ? 'data-animated="true" ' : ""}class="actor"><rect width="10" height="10" /></g>
</svg>`;

describe("reduced motion contract", () => {
  test("accepts an explicit contract-wide CSS animation shutdown", () => {
    const source = svg(
      "@keyframes bob { to { transform: translateY(-1px); } } .actor { animation: bob 1s infinite; }",
      "@media (prefers-reduced-motion: reduce) { [data-animated] { animation: none !important; } }",
    );

    expect(validateReducedMotionSource("safe.svg", source)).toEqual([]);
  });

  test("accepts selector-specific shutdown when no data-animated contract marker exists", () => {
    const source = svg(
      "@keyframes bob { to { transform: translateY(-1px); } } .actor { animation: bob 1s infinite; }",
      "@media (prefers-reduced-motion: reduce) { .actor { animation-name: none; } }",
      false,
    );

    expect(validateReducedMotionSource("selector-safe.svg", source)).toEqual([]);
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

  test("rejects animation shutdown applied only to an unrelated selector", () => {
    const source = svg(
      "@keyframes bob { to { transform: translateY(-1px); } } .actor { animation: bob 1s infinite; }",
      "@media (prefers-reduced-motion: reduce) { .unrelated { animation: none; } }",
    );

    expect(validateReducedMotionSource("unrelated.svg", source)).toEqual([
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

  test("does not throw when the primary validator owns manifest parse errors", async () => {
    const dir = await makeTempDir();
    const manifestPath = join(dir, "invalid.json");
    await writeFile(manifestPath, "{ invalid json", "utf8");

    await expect(validateReducedMotionManifest(manifestPath)).resolves.toEqual([]);
    await expect(validateReducedMotionManifest(join(dir, "missing.json"))).resolves.toEqual([]);
  });

  test("skips unsafe manifest paths before attempting to read them", async () => {
    const dir = await makeTempDir();
    const manifestPath = join(dir, "manifest.json");
    await writeFile(
      manifestPath,
      JSON.stringify({
        version: 1,
        assets: [
          {
            id: "unsafe",
            path: "../../dev/zero",
            category: "scenes",
            type: "scene",
            animated: true,
            communityArtwork: true,
            contractVersion: 1,
            title: "Unsafe fixture",
            description: "Must never be read",
          },
        ],
      }),
      "utf8",
    );

    await expect(validateReducedMotionManifest(manifestPath)).resolves.toEqual([]);
  });
});
