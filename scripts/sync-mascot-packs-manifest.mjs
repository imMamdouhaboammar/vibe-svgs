import { readFile, writeFile } from "node:fs/promises";

import { loadStoryRegistry } from "../svg-mascot-animator/scripts/story-registry.mjs";

const PACK_MANIFEST_PATH = "mascot-packs-manifest.json";
const CANONICAL_MANIFEST_PATH = "asset-manifest.json";

function toManifestAsset(story, spriteStoryIds) {
  return {
    id: `mascot-pack-${story.id}`,
    path: story.output,
    category: "mascot-packs",
    type: spriteStoryIds.has(story.id) ? "sprite-story" : "pack-scene",
    animated: true,
    communityArtwork: true,
    contractVersion: 1,
    title: story.title,
    description: story.description,
    pack: story.pack,
    motionPreset: story.preset,
  };
}

export async function buildMascotPackManifest() {
  const registry = await loadStoryRegistry();
  const spriteStoryIds = new Set(registry.spriteStories.map((story) => story.id));
  const stories = [...registry.independent, ...registry.spriteStories];
  return {
    version: 1,
    assets: stories.map((story) => toManifestAsset(story, spriteStoryIds)),
  };
}

export async function syncMascotPackManifests() {
  const packManifest = await buildMascotPackManifest();
  const canonical = JSON.parse(await readFile(CANONICAL_MANIFEST_PATH, "utf8"));
  if (canonical.version !== 1 || !Array.isArray(canonical.assets)) {
    throw new Error("The canonical asset manifest does not match version 1");
  }

  const retained = canonical.assets.filter((asset) => asset.category !== "mascot-packs");
  const nextCanonical = {
    ...canonical,
    assets: [...retained, ...packManifest.assets],
  };

  await Promise.all([
    writeFile(PACK_MANIFEST_PATH, `${JSON.stringify(packManifest, null, 2)}\n`, "utf8"),
    writeFile(CANONICAL_MANIFEST_PATH, `${JSON.stringify(nextCanonical, null, 2)}\n`, "utf8"),
  ]);
  return packManifest;
}

if (import.meta.main) {
  const manifest = await syncMascotPackManifests();
  console.log(`Registered ${manifest.assets.length} mascot pack assets.`);
}
