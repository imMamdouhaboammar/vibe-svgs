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

export type ReducedMotionPoseIssue = {
  target: string;
  reason: "hidden" | "collapsed" | "outside-svg";
  display: string;
  visibility: string;
  opacity: number;
  rect: { x: number; y: number; width: number; height: number };
};

export type ReducedMotionRuntimeIssue = {
  assetId: string;
  assetPath: string;
  rule: "motion.reduced-runtime";
  animations: ReducedMotionRuntimeAnimation[];
};

export type ReducedMotionPoseAssetIssue = {
  assetId: string;
  assetPath: string;
  rule: "motion.reduced-final-pose";
  poses: ReducedMotionPoseIssue[];
};

export type ReducedMotionRuntimeReport = {
  version: 1;
  manifest: string;
  checked: number;
  skippedSmilOnly: number;
  issues: ReducedMotionRuntimeIssue[];
  poseIssues: ReducedMotionPoseAssetIssue[];
};

const hasActiveAnimationDeclaration = (
  css: string,
  inline: boolean,
): boolean => {
  const pattern = inline
    ? /(?:^|;)\s*(?:-webkit-)?animation(?:-name)?\s*:\s*([^;}]+)/gi
    : /(?:^|[;{])\s*(?:-webkit-)?animation(?:-name)?\s*:\s*([^;}]+)/gi;

  for (const match of css.matchAll(pattern)) {
    const value = (match[1] ?? "")
      .replace(/!important\b/gi, "")
      .trim();
    if (!value) continue;
    if (value.split(",").some((segment) => !/\bnone\b/i.test(segment))) {
      return true;
    }
  }

  return false;
};

export const hasCssAnimationSource = (source: string): boolean => {
  for (const match of source.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) {
    if (hasActiveAnimationDeclaration(match[1] ?? "", false)) return true;
  }

  for (const match of source.matchAll(/\bstyle\s*=\s*(["'])([\s\S]*?)\1/gi)) {
    if (hasActiveAnimationDeclaration(match[2] ?? "", true)) return true;
  }

  return false;
};

export const selectRuntimeAuditAssets = (
  manifest: AssetManifest,
): AssetManifestEntry[] =>
  manifest.assets.filter(
    (asset) => asset.contractVersion === 1 && asset.animated === true,
  );

const waitForPaint = (page: Page) => page.evaluate(() => new Promise<void>((resolve) => {
  requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
}));

export async function probeReducedMotionSource(
  page: Page,
  source: string,
): Promise<ReducedMotionRuntimeAnimation[]> {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setContent(`<!doctype html><html><body>${source}</body></html>`, {
    waitUntil: "load",
  });
  await waitForPaint(page);

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

export async function probeReducedMotionFinalPose(
  page: Page,
  source: string,
): Promise<ReducedMotionPoseIssue[]> {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setContent(`<!doctype html><html><body>${source}</body></html>`, {
    waitUntil: "load",
  });
  await waitForPaint(page);

  await page.evaluate(() => {
    const svg = document.querySelector("svg");
    if (!svg) return;

    const targets = new Set<Element>();
    for (const animation of svg.getAnimations({ subtree: true })) {
      const effect = animation.effect;
      if (effect instanceof KeyframeEffect && effect.target instanceof Element) {
        targets.add(effect.target);
      }
    }

    let index = 0;
    for (const target of targets) {
      target.setAttribute("data-vibe-motion-probe", String(index++));
    }
  });

  const baseline = await page.evaluate(() => {
    const svg = document.querySelector("svg");
    if (!svg) return [];
    const rootRect = svg.getBoundingClientRect();

    const opacityThroughAncestors = (element: Element): number => {
      let opacity = 1;
      let current: Element | null = element;
      while (current) {
        const value = Number.parseFloat(getComputedStyle(current).opacity || "1");
        opacity *= Number.isFinite(value) ? value : 1;
        if (current === svg) break;
        current = current.parentElement;
      }
      return opacity;
    };

    const isVisible = (element: Element): boolean => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      const intersectsRoot = rect.right > rootRect.left
        && rect.left < rootRect.right
        && rect.bottom > rootRect.top
        && rect.top < rootRect.bottom;
      return style.display !== "none"
        && style.visibility !== "hidden"
        && opacityThroughAncestors(element) > 0.01
        && rect.width > 0.5
        && rect.height > 0.5
        && intersectsRoot;
    };

    const animations = svg.getAnimations({ subtree: true });
    const visibility = new Map<string, boolean>();
    const targets = Array.from(svg.querySelectorAll("[data-vibe-motion-probe]"));
    for (const target of targets) {
      visibility.set(target.getAttribute("data-vibe-motion-probe") ?? "", false);
    }

    for (const fraction of [0, 0.25, 0.5, 0.75]) {
      for (const animation of animations) {
        animation.pause();
        const timing = animation.effect?.getTiming();
        const duration = timing && typeof timing.duration === "number" ? timing.duration : 0;
        if (duration > 0) animation.currentTime = duration * fraction;
      }
      for (const target of targets) {
        const probe = target.getAttribute("data-vibe-motion-probe") ?? "";
        if (!visibility.get(probe) && isVisible(target)) visibility.set(probe, true);
      }
    }

    return Array.from(visibility, ([probe, visible]) => ({ probe, visible }));
  });

  const visibleBaseline = new Set(
    baseline.filter((entry) => entry.visible).map((entry) => entry.probe),
  );
  if (visibleBaseline.size === 0) return [];

  await page.emulateMedia({ reducedMotion: "reduce" });
  await waitForPaint(page);

  return page.evaluate((baselineProbes) => {
    const svg = document.querySelector("svg");
    if (!svg) return [];
    const rootRect = svg.getBoundingClientRect();

    const opacityThroughAncestors = (element: Element): number => {
      let opacity = 1;
      let current: Element | null = element;
      while (current) {
        const value = Number.parseFloat(getComputedStyle(current).opacity || "1");
        opacity *= Number.isFinite(value) ? value : 1;
        if (current === svg) break;
        current = current.parentElement;
      }
      return opacity;
    };

    const isVisible = (element: Element): boolean => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      const intersectsRoot = rect.right > rootRect.left
        && rect.left < rootRect.right
        && rect.bottom > rootRect.top
        && rect.top < rootRect.bottom;
      return style.display !== "none"
        && style.visibility !== "hidden"
        && opacityThroughAncestors(element) > 0.01
        && rect.width > 0.5
        && rect.height > 0.5
        && intersectsRoot;
    };

    const isIntentionalSpriteFrameHide = (element: Element): boolean => {
      const frame = element.closest("[data-frame]");
      if (!frame || !svg.contains(frame) || isVisible(frame)) return false;
      const parent = frame.parentElement;
      if (!parent) return false;
      return Array.from(parent.children).some(
        (sibling) => sibling !== frame && sibling.hasAttribute("data-frame") && isVisible(sibling),
      );
    };

    const targetLabel = (element: Element): string => {
      const id = element.getAttribute("id");
      if (id) return `#${id}`;
      const classes = element.getAttribute("class")?.trim().split(/\s+/).filter(Boolean) ?? [];
      if (classes.length > 0) return `${element.tagName.toLowerCase()}.${classes.join(".")}`;
      if (element.hasAttribute("data-animated")) return `${element.tagName.toLowerCase()}[data-animated]`;
      return element.tagName.toLowerCase();
    };

    return Array.from(svg.querySelectorAll("[data-vibe-motion-probe]"))
      .filter((element) => baselineProbes.includes(element.getAttribute("data-vibe-motion-probe") ?? ""))
      .filter((element) => element.getAttribute("data-reduced-motion-hidden") !== "true")
      .filter((element) => !isIntentionalSpriteFrameHide(element))
      .flatMap((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        const opacity = opacityThroughAncestors(element);
        const common = {
          target: targetLabel(element),
          display: style.display,
          visibility: style.visibility,
          opacity,
          rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        };

        if (style.display === "none" || style.visibility === "hidden" || opacity <= 0.01) {
          return [{ ...common, reason: "hidden" as const }];
        }
        if (rect.width <= 0.5 || rect.height <= 0.5) {
          return [{ ...common, reason: "collapsed" as const }];
        }

        const intersectsRoot = rect.right > rootRect.left
          && rect.left < rootRect.right
          && rect.bottom > rootRect.top
          && rect.top < rootRect.bottom;
        if (!intersectsRoot) {
          return [{ ...common, reason: "outside-svg" as const }];
        }
        return [];
      });
  }, Array.from(visibleBaseline));
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
  const poseIssues: ReducedMotionPoseAssetIssue[] = [];
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
      const poses = await probeReducedMotionFinalPose(page, source);

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
      if (poses.length > 0) {
        poseIssues.push({
          assetId: asset.id,
          assetPath: asset.path,
          rule: "motion.reduced-final-pose",
          poses,
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
    poseIssues,
  };

  await mkdir(dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  return report;
}

if (import.meta.main) {
  auditReducedMotionRuntime()
    .then((report) => {
      if (report.issues.length > 0 || report.poseIssues.length > 0) {
        if (report.issues.length > 0) {
          console.error(`Reduced-motion runtime audit found ${report.issues.length} asset(s) with active browser animations.`);
          for (const issue of report.issues) {
            console.error(`- ${issue.assetId} (${issue.assetPath})`);
            for (const animation of issue.animations) {
              console.error(`  ${animation.kind} ${animation.name ?? "unnamed"} on ${animation.target} is ${animation.playState}`);
            }
          }
        }
        if (report.poseIssues.length > 0) {
          console.error(`Reduced-motion final-pose audit found ${report.poseIssues.length} asset(s) with unreadable frozen states.`);
          for (const issue of report.poseIssues) {
            console.error(`- ${issue.assetId} (${issue.assetPath})`);
            for (const pose of issue.poses) {
              console.error(`  ${pose.target} is ${pose.reason} under reduced motion`);
            }
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
