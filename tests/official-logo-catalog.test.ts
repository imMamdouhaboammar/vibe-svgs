import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";

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
});
