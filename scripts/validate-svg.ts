import { readFile } from "node:fs/promises";
import type { AssetManifest, SvgIssue } from "./svg-contracts";
import { validateManifest, validateSvgSource } from "./svg-contracts";

const manifestPath = process.argv[2] ?? "asset-manifest.json";
const issues: SvgIssue[] = [];

issues.push(...(await validateManifest(manifestPath)));

try {
  const manifest = JSON.parse(
    await readFile(manifestPath, "utf8"),
  ) as AssetManifest;

  for (const asset of manifest.assets ?? []) {
    if (asset.contractVersion !== 1) continue;
    try {
      const source = await readFile(asset.path, "utf8");
      issues.push(...validateSvgSource(asset.path, source));
    } catch {
      // validateManifest already reports unreadable files.
    }
  }
} catch {
  // validateManifest already reports JSON and shape failures.
}

const uniqueIssues = [...new Map(
  issues.map((entry) => [
    `${entry.path}\u0000${entry.rule}\u0000${entry.message}`,
    entry,
  ]),
).values()];

if (uniqueIssues.length === 0) {
  console.log("SVG validation passed.");
  process.exit(0);
}

console.error(`SVG validation found ${uniqueIssues.length} issue(s):`);
for (const entry of uniqueIssues) {
  console.error(`- ${entry.path} [${entry.rule}] ${entry.message}`);
}

process.exit(1);
