import { captureVisualSnapshots } from "./visual-snapshots";

export const VISUAL_SMOKE_ASSET_IDS = [
  "claude-mascot",
  "claude-orchestrating",
  "banner-pills",
  "zero-human",
] as const;

export async function runVisualSmoke(
  outputDir: string = process.env.VISUAL_SMOKE_OUTPUT ?? "tests/visual-smoke",
) {
  return captureVisualSnapshots("asset-manifest.json", outputDir, {
    assetIds: VISUAL_SMOKE_ASSET_IDS,
    sizes: [160],
    backgrounds: [
      { name: "light", color: "#FFFFFF" },
      { name: "dark", color: "#0F172A" },
    ],
    motionModes: ["normal", "reduce"],
  });
}

if (import.meta.main) {
  runVisualSmoke()
    .then((results) => {
      console.log(
        `Visual smoke captured ${results.length} snapshots across ${VISUAL_SMOKE_ASSET_IDS.length} representative assets.`,
      );
    })
    .catch((error) => {
      console.error("Visual smoke failed:", error);
      process.exit(1);
    });
}
