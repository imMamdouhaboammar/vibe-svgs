import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import {
  namespaceSvg,
  validateManifest,
  validateSvgSource,
} from "../scripts/svg-contracts";

const pilotPaths = [
  "svgs/mascots/claude-mascot.svg",
  "svgs/mascots/claude-jumping.svg",
  "svgs/mascots/codex-mascot.svg",
  "svgs/mascots/codex-hallucinating.svg",
];

describe("SVG contracts", () => {
  test("namespaces duplicate IDs and every local reference", () => {
    const source = `<svg aria-labelledby="sample-title"><title id="sample-title">Sample</title><defs><linearGradient id="sample-gradient" /></defs><rect fill="url(#sample-gradient)" /></svg>`;
    const first = namespaceSvg(source, "card-one");
    const second = namespaceSvg(source, "card-two");

    expect(first).toContain("sample-title--card-one");
    expect(first).toContain("url(#sample-gradient--card-one)");
    expect(second).toContain("sample-title--card-two");
    expect(second).not.toContain("sample-title--card-one");
  });

  test("rejects competing transform animations", () => {
    const source = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" role="img" aria-labelledby="bad-title bad-desc"><title id="bad-title">Bad</title><desc id="bad-desc">Bad motion</desc><style>.body { animation: bounce 1s infinite, tilt 1s infinite; } @keyframes bounce { to { transform: translateY(-1px); } } @keyframes tilt { to { transform: rotate(4deg); } } @media (prefers-reduced-motion: reduce) { [data-animated] { animation: none !important; } }</style><g id="bad-body" class="body" data-animated="true" /></svg>`;
    const issues = validateSvgSource("bad.svg", source);
    expect(
      issues.some((issue) => issue.rule === "motion.transform-owner"),
    ).toBe(true);
  });

  test("pilot assets satisfy the complete contract", async () => {
    for (const path of pilotPaths) {
      const source = await readFile(path, "utf8");
      expect(validateSvgSource(path, source)).toEqual([]);
    }
  });

  test("manifest entries resolve and use community artwork language", async () => {
    expect(await validateManifest("asset-manifest.json")).toEqual([]);
  });

  test("package and README identify a community SVG project", async () => {
    const pkg = JSON.parse(await readFile("package.json", "utf8"));
    const readme = await readFile("README.md", "utf8");

    expect(pkg.name).toBe("vibe-svgs");
    expect(pkg.private).toBe(true);
    expect(pkg.scripts.validate).toBe("bun run scripts/validate-svg.ts");
    expect(readme).toContain("community-created");
    expect(readme.toLowerCase()).not.toContain("official 3d mascot");
  });
});
