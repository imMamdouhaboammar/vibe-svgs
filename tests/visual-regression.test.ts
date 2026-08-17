import { describe, expect, test } from "bun:test";
import { captureVisualSnapshots } from "../scripts/visual-snapshots";
import { readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("Visual Regression Pipeline", () => {
  test("renders native-ratio normal and reduced-motion snapshots with a report", async () => {
    const testRoot = join(tmpdir(), `vibe-snapshots-${Date.now()}`);
    const manifestPath = join(testRoot, "manifest.json");
    const outputDir = join(testRoot, "output");

    await Bun.write(
      manifestPath,
      JSON.stringify({
        version: 1,
        assets: [
          {
            id: "claude-mascot",
            path: "svgs/mascots/claude-mascot.svg",
            category: "claude",
            type: "mascot",
            animated: true,
            communityArtwork: true,
            contractVersion: 1,
            title: "Claude Community Mascot",
            description: "Focused browser fixture.",
          },
        ],
      }),
    );

    try {
      const results = await captureVisualSnapshots(manifestPath, outputDir, {
        sizes: [160],
        backgrounds: [{ name: "dark", color: "#0F172A" }],
        motionModes: ["normal", "reduce"],
      });

      expect(results).toHaveLength(2);
      expect(results.map((result) => result.motion)).toEqual(["normal", "reduce"]);
      expect(results.every((result) => result.width === 160)).toBe(true);
      expect(results.every((result) => result.height > 0)).toBe(true);
      expect(results.every((result) => result.blockedRequests.length === 0)).toBe(true);

      const report = JSON.parse(
        await readFile(join(outputDir, "visual-report.json"), "utf8"),
      ) as { version: number; captures: unknown[] };
      expect(report.version).toBe(1);
      expect(report.captures).toHaveLength(results.length);
    } finally {
      await rm(testRoot, { recursive: true, force: true });
    }
  }, 120000);

  test("blocks external resources instead of fetching them", async () => {
    const testRoot = join(tmpdir(), `vibe-network-${Date.now()}`);
    const svgPath = join(testRoot, "network-fixture.svg");
    const manifestPath = join(testRoot, "manifest.json");
    const outputDir = join(testRoot, "output");

    await Bun.write(
      svgPath,
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100"><image href="https://example.com/image.png" width="200" height="100"/></svg>',
    );
    await writeFile(
      manifestPath,
      JSON.stringify({
        version: 1,
        assets: [
          {
            id: "network-fixture",
            path: svgPath,
            category: "tests",
            type: "scene",
            animated: false,
            communityArtwork: true,
            contractVersion: 1,
            title: "Network fixture",
            description: "Test-only network fixture.",
          },
        ],
      }),
    );

    try {
      await expect(
        captureVisualSnapshots(manifestPath, outputDir, {
          sizes: [160],
          backgrounds: [{ name: "light", color: "#FFFFFF" }],
        }),
      ).rejects.toThrow("blocked external request");
    } finally {
      await rm(testRoot, { recursive: true, force: true });
    }
  }, 30000);
});
