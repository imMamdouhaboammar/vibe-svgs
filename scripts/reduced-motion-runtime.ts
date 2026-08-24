// @ts-nocheck
import { chromium, type Page } from "playwright";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { AssetManifest, AssetManifestEntry } from "./svg-contracts";
import { assertSafeSvgForBrowser } from "./visual-snapshots";

export type ReducedMotionRuntimeAnimation = {
  kind: string;
  name: string | null;
  playState: string;
  target: string;
};

export type ReducedMotionRuntimeIssue = {
  assetId: string;
  assetPath: string;
  rule: "motion.reduced-runtime";
  animations: ReducedMotionRuntimeAnimation[];
};

export type ReducedMotionRuntimeReport = {
  version: 1;
  manifest: string;
  checked: number;
  skippedSmilOnly: number;
  issues: ReducedMotionRuntimeIssue[];
};

export const hasCssAnimationSource = (source: string): boolean => {
  for (const match of source.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) {
    if (/(?:^|[;{])\s*(?:-webkit-)?animation(?:-name)?\s*:\s*(?!none\b)/i.test(match[1] ?? "")) {
      return true;
    }
  }

  for (const match of source.matchAll(/\bstyle\s*=\s*(["'])([\s\S]*?)\1/gi)) {
    if (/(?:^|;)\s*(?:-webkit-)?animation(?:-name)?\s*:\s*(?!none\b)/i.test(match[2] ?? "")) {
      return true;
    }
  }

  return false;
};

export const selectRuntimeAuditAssets = (
  manifest: AssetManifest,
): AssetManifestEntry[] =>
  manifest.assets.filter(
    (asset) => asset.contractVersion === 1 && asset.animated === true,
  );

export async function probeReducedMotionSource(
  page: Page,
  source: string,
): Promise<ReducedMotionRuntimeAnimation[]> {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setContent(`<!doctype html><html><body>${source}</body></html>`, {
    waitUntil: "load",
  });
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  }));

  return page.evaluate(() => {
    const svg = document.querySelector("svg");
    if (!svg) return [];

    const targetLabel = (element: Element | null): string => {
      if (!element) return "unknown";
      const id = element.getAttribute("id");
      if (id) return `#${id}`;
      const classes = element.getAttribute("class")?.trim().split(/\s+/).filter(Boolean) ?? [];
      if (classes.length > 0) return `${element.tagName.toLowerCase()}.${classes.join(".")}`;
      if (element.hasAttribute("data-animated")) return `${element.tagName.toLowerCase()}[data-animated]`;
      return element.tagName.toLowerCase();
    };

    return svg
      .getAnimations({ subtree: true })
      .filter((animation) => animation.playState === "running" || animation.playState === "pending")
      .map((animation) => {
        const effect = animation.effect;
        const target = effect instanceof KeyframeEffect ? effect.target : null;
        const cssAnimation = animation as Animation & { animationName?: string };
        return {
          kind: animation.constructor?.name ?? "Animation",
          name: typeof cssAnimation.animationName === "string" ? cssAnimation.animationName : null,
          playState: animation.playState,
          target: targetLabel(target),
        };
      });
  });
}

export async function auditReducedMotionRuntime(
  manifestPath = "asset-manifest.json",
  reportPath = "tests/reduced-motion-runtime/report.json",
): Promise<ReducedMotionRuntimeReport> {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as AssetManifest;
  const assets = selectRuntimeAuditAssets(manifest);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const issues: ReducedMotionRuntimeIssue[] = [];
  let checked = 0;
  let skippedSmilOnly = 0;
  let blockedRequests: string[] = [];

  await context.route("**/*", async (route) => {
    const url = route.request().url();
    if (/^https?:\/\//i.test(url)) {
      blockedRequests.push(url);
      await route.abort("blockedbyclient");
      return;
    }
    await route.continue();
  });

  try {
    for (const asset of assets) {
      const source = await readFile(asset.path, "utf8");
      assertSafeSvgForBrowser(source);

      if (!hasCssAnimationSource(source)) {
        skippedSmilOnly += 1;
        continue;
      }

      blockedRequests = [];
      const animations = await probeReducedMotionSource(page, source);

      if (blockedRequests.length > 0) {
        throw new Error(
          `Reduced-motion runtime audit blocked external request for ${asset.id}: ${blockedRequests.join(", ")}`,
        );
      }

      checked += 1;
      if (animations.length > 0) {
        issues.push({
          assetId: asset.id,
          assetPath: asset.path,
          rule: "motion.reduced-runtime",
          animations,
        });
      }
    }
  } finally {
    await browser.close();
  }

  const report: ReducedMotionRuntimeReport = {
    version: 1,
    manifest: manifestPath,
    checked,
    skippedSmilOnly,
    issues,
  };

  await mkdir(dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  return report;
}

if (import.meta.main) {
  auditReducedMotionRuntime()
    .then((report) => {
      if (report.issues.length > 0) {
        console.error(`Reduced-motion runtime audit found ${report.issues.length} asset(s) with active browser animations.`);
        for (const issue of report.issues) {
          console.error(`- ${issue.assetId} (${issue.assetPath})`);
          for (const animation of issue.animations) {
            console.error(`  ${animation.kind} ${animation.name ?? "unnamed"} on ${animation.target} is ${animation.playState}`);
          }
        }
        process.exit(1);
      }

      console.log(
        `Reduced-motion runtime audit passed for ${report.checked} CSS-animated asset(s); ${report.skippedSmilOnly} SMIL-only asset(s) skipped.`,
      );
    })
    .catch((error) => {
      console.error("Reduced-motion runtime audit failed:", error);
      process.exit(1);
    });
}
