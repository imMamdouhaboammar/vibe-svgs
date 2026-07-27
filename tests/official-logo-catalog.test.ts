import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";

const coreLogos = {
  "claude-code": "svgs/logos/claudecode-color.svg",
  openai: "svgs/logos/openai.svg",
  codex: "svgs/logos/codex-color.svg",
  cursor: "svgs/logos/cursor.svg",
  gemini: "svgs/logos/geminicli-color.svg",
  deepseek: "svgs/logos/deepseek-color.svg",
  copilot: "svgs/logos/githubcopilot.svg",
} as const;

describe("supplied platform logo catalog", () => {
  test("registers all supplied logos without mascot substitution", async () => {
    const manifest = JSON.parse(await readFile("asset-manifest.json", "utf8"));
    const logos = manifest.assets.filter((entry: { type: string }) => entry.type === "logo");
    expect(logos).toHaveLength(32);
    for (const entry of logos) {
      expect(entry.animated).toBe(false);
      expect(entry.communityArtwork).toBe(false);
      expect(await readFile(entry.path, "utf8")).not.toBeEmpty();
      expect(entry.description.toLowerCase()).toContain("no mascot artwork");
    }
  });

  test("uses supplied logos in gallery filters and category cards", async () => {
    const html = await readFile("index.html", "utf8");
    const app = await readFile("src/app.js", "utf8");
    for (const [category, path] of Object.entries(coreLogos)) {
      expect(html).toContain(`data-category="${category}"`);
      expect(html).toContain(path);
      expect(app).toContain(path);
    }
    expect(html).not.toContain("🟠");
    expect(html).not.toContain("🤖");
    expect(app).not.toContain("📋");
    expect(app).not.toContain("📥");
  });
});
