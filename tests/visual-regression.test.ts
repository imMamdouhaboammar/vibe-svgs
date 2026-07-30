import { describe, expect, test } from "bun:test";
import { captureVisualSnapshots } from "../scripts/visual-snapshots";
import { readdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("Visual Regression Pipeline", () => {
  test("renders PNG snapshots at 96px, 160px, and 320px for migrated assets", async () => {
    const testOutputDir = join(tmpdir(), `vibe-snapshots-${Date.now()}`);

    try {
      const results = await captureVisualSnapshots("asset-manifest.json", testOutputDir);
      expect(results.length).toBeGreaterThan(0);

      const files = await readdir(testOutputDir);
      expect(files.some((f) => f.includes("claude-mascot-96px-dark.png"))).toBe(true);
      expect(files.some((f) => f.includes("claude-mascot-160px-light.png"))).toBe(true);
      expect(files.some((f) => f.includes("cursor-mascot-320px-transparent.png"))).toBe(true);
    } finally {
      await rm(testOutputDir, { recursive: true, force: true });
    }
  }, 120000);
});
