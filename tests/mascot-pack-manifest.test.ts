import { expect, test } from "bun:test";
import { readFile } from "node:fs/promises";

import { isManifestEntry } from "../scripts/svg-contracts";
import { loadStoryRegistry } from "../svg-mascot-animator/scripts/story-registry.mjs";

const manifestPath = "mascot-packs-manifest.json";
const allowedPacks = new Set([
  "reactions",
  "work",
  "systems",
  "security",
  "growth",
  "celebration",
  "daily",
  "sprite-stories",
]);

test("publishes all 66 generated stories through a dedicated manifest", async () => {
  expect(await Bun.file(manifestPath).exists()).toBe(true);
  if (!(await Bun.file(manifestPath).exists())) return;

  const registry = await loadStoryRegistry();
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const stories = [...registry.independent, ...registry.spriteStories];

  expect(manifest.assets.every(isManifestEntry)).toBe(true);
  expect(manifest.version).toBe(1);
  expect(manifest.assets).toHaveLength(66);
  expect(new Set(manifest.assets.map((asset: { id: string }) => asset.id)).size).toBe(66);
  expect(manifest.assets.map((asset: { path: string }) => asset.path).sort()).toEqual(
    stories.map((story) => story.output).sort(),
  );

  for (const asset of manifest.assets) {
    expect(asset.id).toMatch(/^mascot-pack-[a-z0-9-]+$/);
    expect(asset.path).toMatch(/^svgs\/packs\/[a-z0-9-]+\/[a-z0-9-]+\.svg$/);
    expect(await Bun.file(asset.path).exists()).toBe(true);
    expect(asset.category).toBe("mascot-packs");
    expect(["pack-scene", "sprite-story"]).toContain(asset.type);
    expect(asset.animated).toBe(true);
    expect(asset.communityArtwork).toBe(true);
    expect(asset.contractVersion).toBe(1);
    expect(allowedPacks.has(asset.pack)).toBe(true);
    expect(asset.motionPreset).toMatch(/^[a-z][a-z0-9-]+$/);
    expect(asset.title.length).toBeGreaterThan(5);
    expect(asset.description.length).toBeGreaterThan(30);
  }
});

test("registers the dedicated pack manifest exactly once in the canonical asset manifest", async () => {
  expect(await Bun.file(manifestPath).exists()).toBe(true);
  if (!(await Bun.file(manifestPath).exists())) return;

  const packManifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const canonical = JSON.parse(await readFile("asset-manifest.json", "utf8"));
  const canonicalPacks = canonical.assets.filter(
    (asset: { category: string }) => asset.category === "mascot-packs",
  );

  expect(canonicalPacks).toEqual(packManifest.assets);
});
