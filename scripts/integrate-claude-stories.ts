import { readFile, writeFile } from "node:fs/promises";

const stories = [
  {
    id: "claude-orchestrating",
    path: "svgs/scenes/claude-orchestrating.svg",
    title: "Claude Orchestrating Story",
    description: "Fan-made Claude workflow scene conducting task cards through an agent pipeline.",
  },
  {
    id: "claude-context-overflow",
    path: "svgs/scenes/claude-context-overflow.svg",
    title: "Claude Context Overflow Story",
    description: "Fan-made Claude workflow scene balancing context cards while one slips away.",
  },
  {
    id: "claude-refactoring",
    path: "svgs/scenes/claude-refactoring.svg",
    title: "Claude Refactoring Story",
    description: "Fan-made Claude workflow scene pulling tangled code into a clean module.",
  },
  {
    id: "claude-deep-thinking",
    path: "svgs/scenes/claude-deep-thinking.svg",
    title: "Claude Deep Thinking Story",
    description: "Fan-made Claude reasoning scene with orbiting tokens converging into an insight.",
  },
  {
    id: "claude-pair-programming",
    path: "svgs/scenes/claude-pair-programming.svg",
    title: "Claude Pair Programming Story",
    description: "Fan-made Claude collaboration scene working beside a Codex terminal companion.",
  },
  {
    id: "claude-shipping",
    path: "svgs/scenes/claude-shipping.svg",
    title: "Claude Shipping Story",
    description: "Fan-made Claude delivery scene launching a small release rocket.",
  },
  {
    id: "claude-code-review",
    path: "svgs/scenes/claude-code-review.svg",
    title: "Claude Code Review Story",
    description: "Fan-made Claude review scene scanning a diff and applying an approval check.",
  },
  {
    id: "claude-coffee-break",
    path: "svgs/scenes/claude-coffee-break.svg",
    title: "Claude Coffee Break Story",
    description: "Fan-made Claude break scene lifting a warm cup with drifting steam.",
  },
] as const;

type Manifest = {
  version: 1;
  assets: Array<Record<string, unknown> & { id: string }>;
};

const manifestPath = "asset-manifest.json";
const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as Manifest;
const storyIds = new Set(stories.map((story) => story.id));
manifest.assets = manifest.assets.filter((entry) => !storyIds.has(entry.id as (typeof stories)[number]["id"]));
const anchorIndex = manifest.assets.findIndex((entry) => entry.id === "claude-speaking");
if (anchorIndex < 0) throw new Error("Cannot find claude-speaking manifest anchor");
manifest.assets.splice(
  anchorIndex + 1,
  0,
  ...stories.map((story) => ({
    ...story,
    category: "claude",
    type: "scene",
    animated: true,
    communityArtwork: true,
    contractVersion: 1,
  })),
);
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

const storyPathsCode = `const claudeStoryPaths = [\n${stories
  .map((story) => `  "${story.path}",`)
  .join("\n")}\n] as const;\n`;

const testsPath = "tests/svg-contracts.test.ts";
let tests = await readFile(testsPath, "utf8");
if (!tests.includes("const claudeStoryPaths")) {
  const pilotEnd = "];\n\ndescribe(\"SVG contracts\"";
  if (!tests.includes(pilotEnd)) throw new Error("Cannot find pilotPaths test anchor");
  tests = tests.replace(pilotEnd, `];\n\n${storyPathsCode}\ndescribe(\"SVG contracts\"`);
}

if (!tests.includes("Claude Stories satisfy the complete contract")) {
  const manifestTestAnchor = '  test("manifest entries resolve and use community artwork language", async () => {';
  const collectionTests = `  test("Claude Stories satisfy the complete contract", async () => {\n    for (const path of claudeStoryPaths) {\n      const source = await readFile(path, "utf8");\n      expect(validateSvgSource(path, source)).toEqual([]);\n    }\n  });\n\n  test("manifest registers the complete Claude Stories pack", async () => {\n    const manifest = JSON.parse(await readFile("asset-manifest.json", "utf8"));\n    const registered = manifest.assets.filter(\n      (entry: { category: string; path: string }) =>\n        entry.category === "claude" && entry.path.startsWith("svgs/scenes/claude-"),\n    );\n\n    expect(registered.map((entry: { path: string }) => entry.path).sort()).toEqual(\n      [...claudeStoryPaths].sort(),\n    );\n    expect(registered).toHaveLength(8);\n    for (const entry of registered) {\n      expect(entry.type).toBe("scene");\n      expect(entry.animated).toBe(true);\n      expect(entry.communityArtwork).toBe(true);\n      expect(entry.contractVersion).toBe(1);\n    }\n  });\n\n  test("README showcases every Claude Story", async () => {\n    const readme = await readFile("README.md", "utf8");\n    expect(readme).toContain("### Claude Stories");\n    for (const path of claudeStoryPaths) expect(readme).toContain(path);\n  });\n\n`;
  if (!tests.includes(manifestTestAnchor)) throw new Error("Cannot find manifest test anchor");
  tests = tests.replace(manifestTestAnchor, `${collectionTests}${manifestTestAnchor}`);
}
await writeFile(testsPath, tests);

const readmePath = "README.md";
let readme = await readFile(readmePath, "utf8");
const startMarker = "<!-- claude-stories:start -->";
const endMarker = "<!-- claude-stories:end -->";
const rows = stories
  .map((story) => {
    const label = story.title.replace(" Story", "");
    const raw = `https://raw.githubusercontent.com/imMamdouhaboammar/vibe-svgs/main/${story.path}`;
    return `| **${label}** | <img src="${story.path}" width="140" alt="${label}"> | \`![${label}](${raw})\` |`;
  })
  .join("\n");
const gallery = `${startMarker}\n### Claude Stories\n\n| Story | Preview | Raw Markdown |\n| :--- | :---: | :--- |\n${rows}\n${endMarker}\n\n`;
const existingStart = readme.indexOf(startMarker);
if (existingStart >= 0) {
  const existingEnd = readme.indexOf(endMarker, existingStart);
  if (existingEnd < 0) throw new Error("Claude Stories README marker is incomplete");
  readme = `${readme.slice(0, existingStart)}${gallery}${readme.slice(existingEnd + endMarker.length).replace(/^\n+/, "")}`;
} else {
  const claudeHeading = "### 🧡 Claude Family";
  const claudeStart = readme.indexOf(claudeHeading);
  if (claudeStart < 0) throw new Error("Cannot find Claude Family README section");
  const separator = readme.indexOf("\n---\n", claudeStart);
  if (separator < 0) throw new Error("Cannot find Claude Family section boundary");
  readme = `${readme.slice(0, separator + 1)}\n${gallery}${readme.slice(separator + 1)}`;
}
await writeFile(readmePath, readme);

console.log(`Integrated ${stories.length} Claude Stories.`);
