import { readFile } from "node:fs/promises";

type ManifestEntry = {
  path: string;
  animated?: boolean;
  contractVersion?: number;
};

type Manifest = {
  assets?: ManifestEntry[];
};

export type ReducedMotionIssue = {
  path: string;
  rule: string;
  message: string;
};

const issue = (path: string, rule: string, message: string): ReducedMotionIssue => ({
  path,
  rule,
  message,
});

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

const usesSmilAnimation = (source: string): boolean =>
  /<(?:animate|animateTransform|animateMotion|set)\b/i.test(source);

const disablesCssAnimation = (block: string): boolean =>
  /\banimation\s*:\s*none\b/i.test(block) ||
  /\banimation-name\s*:\s*none\b/i.test(block);

export function validateReducedMotionSource(
  path: string,
  source: string,
): ReducedMotionIssue[] {
  const cssAnimated = usesCssAnimation(source);
  const smilAnimated = usesSmilAnimation(source);
  if (!cssAnimated && !smilAnimated) return [];

  const block = reducedMotionBlock(source);
  if (!block) {
    return [
      issue(
        path,
        "motion.reduced-effective",
        "Animated SVGs must define a prefers-reduced-motion: reduce fallback.",
      ),
    ];
  }

  const issues: ReducedMotionIssue[] = [];

  if (cssAnimated && !disablesCssAnimation(block)) {
    issues.push(
      issue(
        path,
        "motion.reduced-effective",
        "The reduced-motion block must disable CSS animation with animation: none or animation-name: none.",
      ),
    );
  }

  if (smilAnimated) {
    issues.push(
      issue(
        path,
        "motion.reduced-smil",
        "SMIL animation cannot be proven disabled by the current reduced-motion contract; use CSS animation with an explicit reduced-motion fallback.",
      ),
    );
  }

  return issues;
}

export async function validateReducedMotionManifest(
  manifestPath: string,
): Promise<ReducedMotionIssue[]> {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as Manifest;
  if (!Array.isArray(manifest.assets)) return [];

  const issues: ReducedMotionIssue[] = [];

  for (const entry of manifest.assets) {
    if (!entry?.path || entry.contractVersion !== 1 || entry.animated !== true) continue;

    try {
      const source = await readFile(entry.path, "utf8");
      issues.push(...validateReducedMotionSource(entry.path, source));
    } catch {
      // Missing files are reported by the primary manifest validator.
    }
  }

  return issues;
}
