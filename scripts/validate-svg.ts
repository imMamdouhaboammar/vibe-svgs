import type { SvgIssue } from "./svg-contracts";
import { validateManifest } from "./svg-contracts";

const manifestPath = process.argv[2] ?? "asset-manifest.json";
const issues: SvgIssue[] = [];

issues.push(...(await validateManifest(manifestPath)));



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
