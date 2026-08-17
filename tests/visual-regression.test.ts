import { describe, expect, test } from "bun:test";
import { captureVisualSnapshots } from "../scripts/visual-snapshots";
import { readdir, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("Visual Regression Pipeline", () => {
  test("renders native-ratio normal and reduced-motion snapshots with a report", async () => {
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
