import { basename } from "node:path";
import { readFile } from "node:fs/promises";
import { validateSvgSafety } from "./svg-safety";

export type SvgIssue = {
  path: string;
  rule: string;
  message: string;
};

export type AssetManifestEntry = {
  id: string;
  path: string;
  category: string;
  type: "mascot" | "scene" | "logo" | "badge" | "banner" | "suite" | "pack-scene" | "sprite-story";
  animated: boolean;
  communityArtwork: boolean;
  contractVersion: 0 | 1;
  title: string;
  description: string;
  pack?: string;
  motionPreset?: string;
};

export type AssetManifest = {
  version: 1;
  assets: AssetManifestEntry[];
};

const ASSET_TYPES = new Set([
  "mascot",
  "scene",
  "logo",
  "badge",
  "banner",
  "suite",
  "pack-scene",
  "sprite-story",
]);

const SAFE_ASSET_PATH =
  /^(?:svgs\/(?:badges|banners|logos|mascots|scenes)\/[a-z0-9][a-z0-9._-]*\.svg|svgs\/packs\/[a-z0-9-]+\/[a-z0-9][a-z0-9._-]*\.svg)$/;

export const isSafeAssetPath = (path: string): boolean => SAFE_ASSET_PATH.test(path);

const issue = (path: string, rule: string, message: string): SvgIssue => ({
  path,
  rule,
  message,
});

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const stemFor = (path: string): string =>
  basename(path, ".svg")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

const collectMatches = (source: string, pattern: RegExp): string[] => {
  const values: string[] = [];
  for (const match of source.matchAll(pattern)) {
    if (match[1]) values.push(match[1]);
  }
  return values;
};

const localReferences = (source: string): string[] => {
  const references = new Set<string>();

  for (const value of collectMatches(source, /url\(\s*#([A-Za-z_][\w:.-]*)\s*\)/g)) {
    references.add(value);
  }

  for (const match of source.matchAll(/(?:href|xlink:href)\s*=\s*["']#([^"']+)["']/g)) {
    if (match[1]) references.add(match[1]);
  }

  for (const match of source.matchAll(/aria-(?:labelledby|describedby)\s*=\s*["']([^"']+)["']/g)) {
    for (const value of (match[1] ?? "").trim().split(/\s+/)) {
      if (value) references.add(value);
    }
  }

  return [...references];
};

const transformKeyframes = (source: string): Set<string> => {
  const names = new Set<string>();
  const pattern = /@(?:-webkit-)?keyframes\s+([\w-]+)\s*\{/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(source)) !== null) {
    const name = match[1];
    const startIndex = match.index + match[0].length;
    let depth = 1;
    let endIndex = startIndex;

    while (depth > 0 && endIndex < source.length) {
      if (source[endIndex] === "{") depth++;
      else if (source[endIndex] === "}") depth--;
      endIndex++;
    }

    const body = source.slice(startIndex, endIndex - 1);
    if (/\btransform\s*:/.test(body) && name) {
      names.add(name);
    }
  }

  return names;
};

const animationNames = (value: string, knownNames: Set<string>): string[] => {
  const found: string[] = [];
  for (const segment of value.split(",")) {
    for (const token of segment.trim().split(/\s+/)) {
      if (knownNames.has(token)) {
        found.push(token);
        break;
      }
    }
  }
  return found;
};

const competingTransformSelectors = (source: string): string[] => {
  const keyframes = transformKeyframes(source);
  if (keyframes.size === 0) return [];
  const selectors = new Set<string>();
  const rules = /([^{}]+)\{([^{}]*)\}/g;

  for (const match of source.matchAll(rules)) {
    const selector = (match[1] ?? "").trim();
    const body = match[2] ?? "";
    if (
      selector.startsWith("@") ||
      selector === "from" ||
      selector === "to" ||
      /^\d+(?:\.\d+)?%$/.test(selector)
    ) {
      continue;
    }

    const shorthand = body.match(/\banimation\s*:\s*([^;}]*)/);
    const named = body.match(/\banimation-name\s*:\s*([^;}]*)/);
    const candidates = [shorthand?.[1], named?.[1]].filter(
      (value): value is string => Boolean(value),
    );

    for (const candidate of candidates) {
      if (animationNames(candidate, keyframes).length > 1) selectors.add(selector);
    }
  }

  return [...selectors];
};

export function namespaceSvg(source: string, instanceId: string): string {
  const safeInstance = instanceId
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!safeInstance) {
    throw new Error("instanceId must contain at least one letter or number");
  }

  const ids = collectMatches(source, /\bid\s*=\s*["']([^"']+)["']/g);
  let output = source;

  for (const id of ids.sort((a, b) => b.length - a.length)) {
    const namespaced = `${id}--${safeInstance}`;
    const escaped = escapeRegExp(id);

    output = output.replace(
      new RegExp(`(\\bid\\s*=\\s*["'])${escaped}(["'])`, "g"),
      `$1${namespaced}$2`,
    );
    output = output.replace(
      new RegExp(`#${escaped}(?![A-Za-z0-9_.:-])`, "g"),
      `#${namespaced}`,
    );
    output = output.replace(
      new RegExp(`(aria-(?:labelledby|describedby)\\s*=\\s*["'][^"']*)\\b${escaped}\\b`, "g"),
      `$1${namespaced}`,
    );
  }

  return output;
}

export function validateSvgSource(path: string, source: string): SvgIssue[] {
  const issues: SvgIssue[] = [];
  const root = source.match(/<svg\b([^>]*)>/i);
  const rootAttributes = root?.[1] ?? "";
  const stem = stemFor(path);

  if (!root) {
    issues.push(issue(path, "svg.root", "Add one SVG root element."));
    return issues;
  }

  if (!/\bxmlns\s*=\s*["']http:\/\/www\.w3\.org\/2000\/svg["']/.test(rootAttributes)) {
    issues.push(issue(path, "svg.root", "Declare the SVG namespace on the root element."));
  }

  if (!/\bviewBox\s*=\s*["'][^"']+["']/.test(rootAttributes)) {
    issues.push(issue(path, "svg.viewbox", "Add a non-empty viewBox."));
  }

  if (!/\brole\s*=\s*["']img["']/.test(rootAttributes)) {
    issues.push(issue(path, "accessibility.role", 'Set role="img" on meaningful assets.'));
  }

  const ids = collectMatches(source, /\bid\s*=\s*["']([^"']+)["']/g);
  const idSet = new Set(ids);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);

  for (const id of [...new Set(duplicateIds)]) {
    issues.push(issue(path, "ids.duplicate", `Rename duplicate ID "${id}".`));
  }

  for (const id of ids) {
    if (!id.startsWith(`${stem}-`)) {
      issues.push(
        issue(path, "ids.prefix", `Prefix ID "${id}" with "${stem}-".`),
      );
    }
  }

  const title = source.match(/<title\b[^>]*\bid\s*=\s*["']([^"']+)["'][^>]*>/i)?.[1];
  const desc = source.match(/<desc\b[^>]*\bid\s*=\s*["']([^"']+)["'][^>]*>/i)?.[1];
  const labelledBy = rootAttributes.match(/\baria-labelledby\s*=\s*["']([^"']+)["']/)?.[1]
    ?.trim()
    .split(/\s+/) ?? [];

  if (!title || !labelledBy.includes(title)) {
    issues.push(
      issue(path, "accessibility.title", "Add a titled ID and reference it from aria-labelledby."),
    );
  }

  if (!desc || !labelledBy.includes(desc)) {
    issues.push(
      issue(path, "accessibility.desc", "Add a description ID and reference it from aria-labelledby."),
    );
  }

  for (const safety of validateSvgSafety(source)) {
    issues.push(issue(path, safety.rule, safety.message));
  }

  for (const reference of localReferences(source)) {
    if (!idSet.has(reference)) {
      issues.push(
        issue(path, "ids.reference", `Reference "${reference}" does not resolve to a local ID.`),
      );
    }
  }

  const animated = /@(?:-webkit-)?keyframes\b|\banimation\s*:|<(?:animate|animateTransform)\b/i.test(source);
  if (animated && !/@media\s*\(prefers-reduced-motion:\s*reduce\)/.test(source)) {
    issues.push(
      issue(path, "motion.reduced", "Add a prefers-reduced-motion fallback."),
    );
  }

  for (const selector of competingTransformSelectors(source)) {
    issues.push(
      issue(
        path,
        "motion.transform-owner",
        `Selector "${selector}" runs several transform-writing animations; split them across nested groups.`,
      ),
    );
  }

  if (/official\s+(?:3d\s+)?mascot/i.test(source)) {
    issues.push(
      issue(path, "claims.official-mascot", "Describe the artwork as community-created or fan-made."),
    );
  }

  return issues;
}

export const isManifestEntry = (value: unknown): value is AssetManifestEntry => {
  if (!value || typeof value !== "object") return false;
  const entry = value as Record<string, unknown>;
  const packMetadataValid = entry.category !== "mascot-packs" || (
    typeof entry.pack === "string" &&
    /^[a-z0-9-]+$/.test(entry.pack) &&
    typeof entry.motionPreset === "string" &&
    /^[a-z][a-z0-9-]+$/.test(entry.motionPreset) &&
    (entry.type === "pack-scene" || entry.type === "sprite-story")
  );
  return (
    typeof entry.id === "string" &&
    typeof entry.path === "string" &&
    typeof entry.category === "string" &&
    typeof entry.type === "string" &&
    ASSET_TYPES.has(entry.type) &&
    typeof entry.animated === "boolean" &&
    typeof entry.communityArtwork === "boolean" &&
    (entry.contractVersion === 0 || entry.contractVersion === 1) &&
    typeof entry.title === "string" &&
    typeof entry.description === "string" &&
    packMetadataValid
  );
};

export async function validateManifest(manifestPath: string): Promise<SvgIssue[]> {
  const issues: SvgIssue[] = [];
  let manifest: AssetManifest;

  try {
    manifest = JSON.parse(await readFile(manifestPath, "utf8")) as AssetManifest;
  } catch (error) {
    return [
      issue(
        manifestPath,
        "manifest.parse",
        `Read valid JSON: ${error instanceof Error ? error.message : String(error)}`,
      ),
    ];
  }

  if (manifest.version !== 1 || !Array.isArray(manifest.assets)) {
    return [
      issue(manifestPath, "manifest.shape", "Use version 1 with an assets array."),
    ];
  }

  const ids = new Set<string>();
  const paths = new Set<string>();

  const entryPromises = manifest.assets.map(async (rawEntry) => {
    const entryIssues: SvgIssue[] = [];

    if (!isManifestEntry(rawEntry)) {
      entryIssues.push(
        issue(manifestPath, "manifest.entry", "Every asset entry must satisfy the version 1 schema."),
      );
      return entryIssues;
    }

    if (!isSafeAssetPath(rawEntry.path)) {
      entryIssues.push(
        issue(
          manifestPath,
          "manifest.path-format",
          `Asset "${rawEntry.id}" must use a local svgs/<category>/<file>.svg path.`,
        ),
      );
      return entryIssues;
    }

    if (/official\s+(?:3d\s+)?mascot/i.test(`${rawEntry.title} ${rawEntry.description}`)) {
      entryIssues.push(
        issue(
          manifestPath,
          "claims.official-mascot",
          `Asset "${rawEntry.id}" uses misleading official-mascot language.`,
        ),
      );
    }

    if (rawEntry.type === "mascot" && !rawEntry.communityArtwork) {
      entryIssues.push(
        issue(
          manifestPath,
          "manifest.community-artwork",
          `Mascot "${rawEntry.id}" must be marked as community artwork.`,
        ),
      );
    }

    try {
      const source = await readFile(rawEntry.path, "utf8");
      if (rawEntry.contractVersion === 1) {
        entryIssues.push(...validateSvgSource(rawEntry.path, source));
      }
    } catch (error) {
      entryIssues.push(
        issue(
          manifestPath,
          "manifest.missing-file",
          `Asset "${rawEntry.id}" cannot read ${rawEntry.path}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        ),
      );
    }

    return entryIssues;
  });

  for (const rawEntry of manifest.assets) {
    if (!isManifestEntry(rawEntry)) continue;
    if (ids.has(rawEntry.id)) {
      issues.push(issue(manifestPath, "manifest.id", `Duplicate asset ID "${rawEntry.id}".`));
    }
    ids.add(rawEntry.id);

    if (paths.has(rawEntry.path)) {
      issues.push(
        issue(manifestPath, "manifest.path", `Duplicate asset path "${rawEntry.path}".`),
      );
    }
    paths.add(rawEntry.path);
  }

  const asyncResults = await Promise.all(entryPromises);
  for (const result of asyncResults) {
    issues.push(...result);
  }

  return issues;
}
