import { basename, resolve } from "node:path";
import { readFile } from "node:fs/promises";

const DEFAULT_REGISTRY_PATH = "svg-mascot-animator/config/mascot-pack-stories.json";
let registryPromise;

function validateRegistry(registry) {
  if (registry.version !== 1) throw new Error(`Unsupported mascot story registry version: ${registry.version}`);
  if (!Array.isArray(registry.independent) || !Array.isArray(registry.spriteStories)) {
    throw new Error("Mascot story registry must contain independent and spriteStories arrays");
  }
  const outputs = [...registry.independent, ...registry.spriteStories].map((story) => story.output);
  if (new Set(outputs).size !== outputs.length) throw new Error("Mascot story registry contains duplicate output paths");
  return registry;
}

export async function loadStoryRegistry(path = DEFAULT_REGISTRY_PATH) {
  const absolute = resolve(path);
  if (!registryPromise || path !== DEFAULT_REGISTRY_PATH) {
    const loading = readFile(absolute, "utf8").then((source) => validateRegistry(JSON.parse(source)));
    if (path === DEFAULT_REGISTRY_PATH) registryPromise = loading;
    return loading;
  }
  return registryPromise;
}

export async function resolveStory(filename, path = DEFAULT_REGISTRY_PATH) {
  const registry = await loadStoryRegistry(path);
  const requested = basename(filename);
  const story = registry.independent.find((entry) => basename(entry.source) === requested);
  if (!story) throw new Error(`No mascot story registered for ${requested}`);
  return story;
}

export function clearStoryRegistryCache() {
  registryPromise = undefined;
}
