import { readFile } from "node:fs/promises";
import { isManifestEntry, type AssetManifest } from "./svg-contracts";

export type ReducedMotionIssue = {
  path: string;
  rule: string;
  message: string;
};

const SAFE_ASSET_PATH =
  /^(?:svgs\/(?:badges|banners|logos|mascots|scenes)\/[a-z0-9][a-z0-9._-]*\.svg|svgs\/packs\/[a-z0-9-]+\/[a-z0-9][a-z0-9._-]*\.svg)$/;

const issue = (path: string, message: string): ReducedMotionIssue => ({
  path,
  rule: "motion.reduced-effective",
  message,
});

const splitSelectors = (selector: string): string[] =>
  selector.split(",").map((part) => part.trim()).filter(Boolean);

const reducedMotionBlock = (source: string): string | null => {
  const media = /@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)\s*\{/gi;
  const match = media.exec(source);
  if (!match) return null;

  let depth = 1;
  let cursor = match.index + match[0].length;
  const start = cursor;
  while (cursor < source.length && depth > 0) {
    if (source[cursor] === "{") depth += 1;
    if (source[cursor] === "}") depth -= 1;
    cursor += 1;
  }
  return depth === 0 ? source.slice(start, cursor - 1) : null;
};

const usesCssAnimation = (source: string): boolean =>
  /@(?:-webkit-)?keyframes\b|\banimation(?:-name)?\s*:/i.test(source);

const usesAnyAnimation = (source: string): boolean =>
  usesCssAnimation(source) || /<(?:animate|animateTransform|animateMotion|set)\b/i.test(source);

const cssRuleBodies = (block: string): Array<{ selector: string; body: string }> => {
  const rules: Array<{ selector: string; body: string }> = [];
  for (const match of block.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = (match[1] ?? "").trim();
    const body = match[2] ?? "";
    if (!selector || selector.startsWith("@")) continue;
    rules.push({ selector, body });
  }
  return rules;
};

const bodyDisablesAnimation = (body: string): boolean =>
  /\banimation\s*:\s*none\b/i.test(body) ||
  /\banimation-name\s*:\s*none\b/i.test(body);

const animatedCssSelectors = (source: string): Set<string> => {
  const selectors = new Set<string>();
  const withoutReducedMotion = source.replace(
    /@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)\s*\{[\s\S]*?\}\s*\}/gi,
    "",
  );

  for (const match of withoutReducedMotion.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = (match[1] ?? "").trim();
    const body = match[2] ?? "";
    if (!selector || selector.startsWith("@")) continue;
    if (!/\banimation(?:-name)?\s*:/i.test(body)) continue;
    for (const part of splitSelectors(selector)) selectors.add(part);
  }
  return selectors;
};

const disablesCssAnimation = (source: string, block: string): boolean => {
  const shutdownRules = cssRuleBodies(block).filter(({ body }) => bodyDisablesAnimation(body));
  if (shutdownRules.length === 0) return false;

  const shutdownSelectors = new Set(
    shutdownRules.flatMap(({ selector }) => splitSelectors(selector)),
  );

  if (/\bdata-animated\b/i.test(source) && shutdownSelectors.has("[data-animated]")) {
    return true;
  }

  const animatedSelectors = animatedCssSelectors(source);
  if (animatedSelectors.size === 0) return true;
  return [...animatedSelectors].every((selector) => shutdownSelectors.has(selector));
};

export function validateReducedMotionSource(path: string, source: string): ReducedMotionIssue[] {
  if (!usesAnyAnimation(source)) return [];

  const block = reducedMotionBlock(source);
  if (!block) {
    return [issue(path, "Animated SVGs must define a prefers-reduced-motion: reduce fallback.")];
  }

  if (usesCssAnimation(source) && !disablesCssAnimation(source, block)) {
    return [
      issue(
        path,
        "The reduced-motion block must disable every CSS-animated selector with animation: none or animation-name: none.",
      ),
    ];
  }

  return [];
}

export async function validateReducedMotionManifest(
  manifestPath: string,
): Promise<ReducedMotionIssue[]> {
  let manifest: AssetManifest;
  try {
    manifest = JSON.parse(await readFile(manifestPath, "utf8")) as AssetManifest;
  } catch {
    return [];
  }

  if (!Array.isArray(manifest.assets)) return [];
  const issues: ReducedMotionIssue[] = [];

  for (const rawEntry of manifest.assets) {
    if (!isManifestEntry(rawEntry)) continue;
    if (rawEntry.contractVersion !== 1 || rawEntry.animated !== true) continue;
    if (!SAFE_ASSET_PATH.test(rawEntry.path)) continue;

    try {
      const source = await readFile(rawEntry.path, "utf8");
      issues.push(...validateReducedMotionSource(rawEntry.path, source));
    } catch {
      // Missing files remain owned by the primary manifest validator.
    }
  }

  return issues;
}
