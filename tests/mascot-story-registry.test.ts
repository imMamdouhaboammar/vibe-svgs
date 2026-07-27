import { expect, test } from "bun:test";
import { readFile } from "node:fs/promises";

import {
  loadStoryRegistry,
  resolveStory,
} from "../svg-mascot-animator/scripts/story-registry.mjs";

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

const allowedPropModes = new Set([
  "static",
  "counter",
  "pulse",
  "orbit",
  "secondary",
]);

test("maps every supplied source to exactly one pack story", async () => {
  const sourceInventory = JSON.parse(
    await readFile("references/mascot-motion/source-inventory.json", "utf8"),
  );
  const registry = await loadStoryRegistry();
  const independentSources = sourceInventory.svgSources
    .filter((entry: { kind: string }) => entry.kind === "scene-source")
    .map((entry: { path: string }) => entry.path)
    .sort();

  expect(registry.independent).toHaveLength(61);
  expect(registry.spriteStories).toHaveLength(5);
  expect(registry.independent.map((story) => story.source).sort()).toEqual(
    independentSources,
  );

  const spriteFrames = registry.spriteStories
    .flatMap((story) => story.frames)
    .sort();
  const expectedFrames = sourceInventory.svgSources
    .filter((entry: { kind: string }) => entry.kind === "artboard-frame")
    .map((entry: { path: string }) => entry.path)
    .sort();
  expect(spriteFrames).toEqual(expectedFrames);
  expect(new Set(spriteFrames).size).toBe(15);
});

test("defines 66 unique bounded animation outputs with complete metadata", async () => {
  const registry = await loadStoryRegistry();
  const stories = [...registry.independent, ...registry.spriteStories];
  const outputs = stories.map((story) => story.output);

  expect(stories).toHaveLength(66);
  expect(new Set(outputs).size).toBe(66);
  for (const story of stories) {
    expect(allowedPacks.has(story.pack)).toBe(true);
    expect(story.output).toMatch(new RegExp(`^svgs/packs/${story.pack}/[a-z0-9-]+\\.svg$`));
    expect(story.preset).toMatch(/^[a-z][a-z0-9-]+$/);
    expect(allowedPropModes.has(story.propMode)).toBe(true);
    expect(story.title.length).toBeGreaterThan(5);
    expect(story.description.length).toBeGreaterThan(30);
    expect(story.durationMs).toBeGreaterThanOrEqual(3200);
    expect(story.durationMs).toBeLessThanOrEqual(6800);
  }
});

test("resolves independent stories by filename and rejects unknown sources", async () => {
  const story = await resolveStory("lifting-heavy-barbell.svg");
  expect(story.pack).toBe("daily");
  expect(story.preset).toBe("lift");
  expect(story.output).toBe("svgs/packs/daily/lifting-heavy-barbell.svg");

  await expect(resolveStory("not-supplied.svg")).rejects.toThrow(
    "No mascot story registered",
  );
});
