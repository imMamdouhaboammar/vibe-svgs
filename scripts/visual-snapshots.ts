import { chromium } from "playwright";
import { basename, join } from "node:path";
import { mkdir, readFile, writeFile } from "node:fs/promises";
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

export type SnapshotBackground = {
  name: string;
  color: string;
};

export type CaptureVisualSnapshotsOptions = {
  assetIds?: readonly string[];
  sizes?: readonly number[];
  backgrounds?: readonly SnapshotBackground[];
  motionModes?: readonly MotionMode[];
};

export type VisualCaptureResult = {
  assetId: string;
  assetPath: string;
  targetWidth: number;
  width: number;
  height: number;
  bg: string;
  motion: MotionMode;
  screenshot: string;
  blockedRequests: string[];
  success: true;
};

const DEFAULT_SIZES = [96, 160, 320] as const;
const DEFAULT_BACKGROUNDS = [
  { name: "transparent", color: "transparent" },
  { name: "light", color: "#FFFFFF" },
  { name: "dark", color: "#0F172A" },
] as const;
const DEFAULT_MOTION_MODES = ["normal", "reduce"] as const;

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
  requested: readonly MotionMode[] = DEFAULT_MOTION_MODES,
): MotionMode[] {
  if (!animated) return ["normal"];
  return [...new Set(requested)];
}

export function assertSafeSvgForBrowser(source: string): void {
  if (/<\s*script\b/i.test(source)) {
    throw new Error("SVG browser render safety rejected script content.");
  }

  if (/<[^>]*\son[a-z][\w:-]*\s*=/i.test(source)) {
    throw new Error("SVG browser render safety rejected inline event handler.");
  }

  if (/\b(?:href|xlink:href)\s*=\s*["']\s*javascript:/i.test(source)) {
    throw new Error("SVG browser render safety rejected javascript URL.");
  }
}

function selectAssets(
  manifest: AssetManifest,
  assetIds?: readonly string[],
) {
  const migrated = manifest.assets.filter((asset) => asset.contractVersion === 1);
  if (!assetIds?.length) return migrated;

  const requested = new Set(assetIds);
  const selected = migrated.filter((asset) => requested.has(asset.id));
  const found = new Set(selected.map((asset) => asset.id));
  const missing = assetIds.filter((id) => !found.has(id));

  if (missing.length > 0) {
    throw new Error(`Unknown visual snapshot asset IDs: ${missing.join(", ")}`);
  }

  return selected;
}

export async function captureVisualSnapshots(
  manifestPath: string = "asset-manifest.json",
  outputDir: string = "tests/snapshots",
  options: CaptureVisualSnapshotsOptions = {},
): Promise<VisualCaptureResult[]> {
  const manifestContent = await readFile(manifestPath, "utf8");
  const manifest: AssetManifest = JSON.parse(manifestContent);
  const assets = selectAssets(manifest, options.assetIds);
  const sizes = options.sizes ?? DEFAULT_SIZES;
  const backgrounds = options.backgrounds ?? DEFAULT_BACKGROUNDS;
  const motionModes = options.motionModes ?? DEFAULT_MOTION_MODES;

  await mkdir(outputDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  let activeBlockedRequests: string[] | null = null;

  await context.route("**/*", async (route) => {
    const url = route.request().url();
    if (/^https?:\/\//i.test(url)) {
      activeBlockedRequests?.push(url);
      await route.abort("blockedbyclient");
      return;
    }
    await route.continue();
  });

  const results: VisualCaptureResult[] = [];

  try {
    for (const asset of assets) {
      const svgSource = await readFile(asset.path, "utf8");
      assertSafeSvgForBrowser(svgSource);
      const profiles = buildCaptureProfiles(asset.animated, motionModes);

      for (const targetWidth of sizes) {
        const viewport = deriveSnapshotViewport(svgSource, targetWidth);

        for (const bg of backgrounds) {
          for (const motion of profiles) {
            const blockedRequests: string[] = [];
            activeBlockedRequests = blockedRequests;

            await page.emulateMedia({
              reducedMotion: motion === "reduce" ? "reduce" : "no-preference",
            });
            await page.setViewportSize(viewport);

            const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      html, body {
        margin: 0;
        padding: 0;
        width: ${viewport.width}px;
        height: ${viewport.height}px;
        overflow: hidden;
        background: ${bg.color};
      }
      body {
        display: flex;
        align-items: center;
        justify-content: center;
      }
      svg {
        display: block;
        width: 100%;
        height: 100%;
      }
    </style>
  </head>
  <body>${svgSource}</body>
</html>`;

            await page.setContent(html, { waitUntil: "load" });
            activeBlockedRequests = null;

            if (blockedRequests.length > 0) {
              throw new Error(
                `Visual snapshot blocked external request for ${asset.id}: ${blockedRequests.join(", ")}`,
              );
            }

            const screenshotName = `${asset.id}-${targetWidth}px-${bg.name}-${motion}.png`;
            const screenshotPath = join(outputDir, screenshotName);
            await page.screenshot({
              path: screenshotPath,
              omitBackground: bg.name === "transparent",
              animations: "allow",
            });

            results.push({
              assetId: asset.id,
              assetPath: asset.path,
              targetWidth,
              width: viewport.width,
              height: viewport.height,
              bg: bg.name,
              motion,
              screenshot: basename(screenshotPath),
              blockedRequests,
              success: true,
            });
          }
        }
      }
    }
  } finally {
    activeBlockedRequests = null;
    await browser.close();
  }

  const report = {
    version: 1,
    manifest: manifestPath,
    captures: results,
  };
  await writeFile(
    join(outputDir, "visual-report.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );

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
