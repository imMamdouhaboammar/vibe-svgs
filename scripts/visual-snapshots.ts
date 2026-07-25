import { chromium } from "playwright";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { AssetManifest } from "./svg-contracts";

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
