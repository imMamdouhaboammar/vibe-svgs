import { chromium } from "playwright";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { AssetManifest } from "./svg-contracts";

export type SvgViewBox = {
  minX: number;
  minY: number;
  width: number;
  height: number;
};

export type SnapshotViewport = {
  width: number;
  height: number;
};

export type MotionMode = "normal" | "reduce";

export function parseSvgViewBox(source: string): SvgViewBox {
  const match = source.match(/\bviewBox\s*=\s*["']([^"']+)["']/i);
  if (!match?.[1]) {
    throw new Error("SVG viewBox is missing.");
  }

  const values = match[1]
    .trim()
    .split(/[\s,]+/)
    .map((value) => Number(value));

  if (values.length !== 4 || values.some((value) => !Number.isFinite(value))) {
    throw new Error(`SVG viewBox must contain four finite numbers: ${match[1]}`);
  }

  const [minX, minY, width, height] = values;
  if (width <= 0 || height <= 0) {
    throw new Error(`SVG viewBox dimensions must be positive: ${match[1]}`);
  }

  return { minX, minY, width, height };
}

export function deriveSnapshotViewport(
  source: string,
  targetWidth: number,
): SnapshotViewport {
  if (!Number.isFinite(targetWidth) || targetWidth <= 0) {
    throw new Error("Snapshot target width must be a positive finite number.");
  }

  const viewBox = parseSvgViewBox(source);
  const width = Math.max(1, Math.round(targetWidth));
  const height = Math.max(1, Math.round(width * (viewBox.height / viewBox.width)));
  return { width, height };
}

export function buildCaptureProfiles(
  animated: boolean,
  requested: readonly MotionMode[] = ["normal", "reduce"],
): MotionMode[] {
  if (!animated) return ["normal"];
  return [...new Set(requested)];
}

export async function captureVisualSnapshots(
  manifestPath: string = "asset-manifest.json",
  outputDir: string = "tests/snapshots"
) {
  const manifestContent = await readFile(manifestPath, "utf8");
  const manifest: AssetManifest = JSON.parse(manifestContent);
  const migratedAssets = manifest.assets.filter((a) => a.contractVersion === 1);

  await mkdir(outputDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results: { assetId: string; size: number; bg: string; success: boolean }[] = [];

  const sizes = [96, 160, 320];
  const backgrounds = [
    { name: "transparent", color: "transparent" },
    { name: "light", color: "#FFFFFF" },
    { name: "dark", color: "#0F172A" },
  ];

  for (const asset of migratedAssets) {
    const svgSource = await readFile(asset.path, "utf8");

    for (const size of sizes) {
      for (const bg of backgrounds) {
        const html = `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body {
                  margin: 0;
                  padding: 0;
                  background-color: ${bg.color};
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  width: ${size}px;
                  height: ${size}px;
                  overflow: hidden;
                }
                svg {
                  width: ${size}px;
                  height: ${size}px;
                }
              </style>
            </head>
            <body>
              ${svgSource}
            </body>
          </html>
        `;

        await page.setViewportSize({ width: size, height: size });
        await page.setContent(html, { waitUntil: "domcontentloaded" });

        const snapshotPath = join(
          outputDir,
          `${asset.id}-${size}px-${bg.name}.png`
        );
        const screenshotBuffer = await page.screenshot({
          omitBackground: bg.name === "transparent",
        });

        await writeFile(snapshotPath, screenshotBuffer);
        results.push({ assetId: asset.id, size, bg: bg.name, success: true });
      }
    }
  }

  await browser.close();
  return results;
}

if (import.meta.main) {
  captureVisualSnapshots()
    .then((results) => {
      console.log(`Successfully captured ${results.length} visual snapshots.`);
    })
    .catch((err) => {
      console.error("Failed to capture visual snapshots:", err);
      process.exit(1);
    });
}
