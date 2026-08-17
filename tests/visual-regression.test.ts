import { describe, expect, test } from "bun:test";
import {
  buildCaptureProfiles,
  captureVisualSnapshots,
  deriveSnapshotViewport,
  parseSvgViewBox,
} from "../scripts/visual-snapshots";
import { readdir, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("visual snapshot geometry", () => {
  test("parses a valid SVG viewBox", () => {
    expect(parseSvgViewBox('<svg viewBox="0 0 1200 400"></svg>')).toEqual({
      minX: 0,
      minY: 0,
      width: 1200,
      height: 400,
    });
  });

  test("preserves a banner's native aspect ratio", () => {
    expect(
      deriveSnapshotViewport('<svg viewBox="0 0 1200 400"></svg>', 300),
    ).toEqual({ width: 300, height: 100 });
  });

  test("keeps square assets square", () => {
    expect(
      deriveSnapshotViewport('<svg viewBox="0 0 256 256"></svg>', 160),
    ).toEqual({ width: 160, height: 160 });
  });

  test("rejects missing, malformed, and non-positive viewBoxes", () => {
    expect(() => parseSvgViewBox("<svg></svg>")).toThrow("viewBox");
    expect(() => parseSvgViewBox('<svg viewBox="0 0 nope 100"></svg>')).toThrow(
      "viewBox",
    );
    expect(() => parseSvgViewBox('<svg viewBox="0 0 0 100"></svg>')).toThrow(
      "viewBox",
    );
  });
});

describe("visual capture profiles", () => {
  test("uses normal and reduced-motion profiles for animated assets", () => {
    expect(buildCaptureProfiles(true, ["normal", "reduce"])).toEqual([
      "normal",
      "reduce",
    ]);
  });

  test("does not duplicate static captures for reduced motion", () => {
    expect(buildCaptureProfiles(false, ["normal", "reduce"])).toEqual([
      "normal",
    ]);
  });
});

describe("Visual Regression Pipeline", () => {
  test("renders PNG snapshots at 96px, 160px, and 320px for migrated assets", async () => {
    const testOutputDir = join(tmpdir(), `vibe-snapshots-${Date.now()}`);

    try {
      const results = await captureVisualSnapshots(
        "asset-manifest.json",
        testOutputDir,
      );
      expect(results.length).toBeGreaterThan(0);

      const files = await readdir(testOutputDir);
      expect(files.some((f) => f.includes("claude-mascot-96px-dark-normal.png"))).toBe(
        true,
      );
      expect(files.some((f) => f.includes("claude-mascot-160px-light-reduce.png"))).toBe(
        true,
      );
      expect(
        files.some((f) => f.includes("cursor-mascot-320px-transparent-normal.png")),
      ).toBe(true);

      const report = JSON.parse(
        await readFile(join(testOutputDir, "visual-report.json"), "utf8"),
      ) as { version: number; captures: unknown[] };
      expect(report.version).toBe(1);
      expect(report.captures).toHaveLength(results.length);
    } finally {
      await rm(testOutputDir, { recursive: true, force: true });
    }
  }, 120000);
});
