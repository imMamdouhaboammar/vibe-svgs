import { expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { optimize } from "svgo";

import { configForFile } from "../scripts/svgo-check.ts";

import {
  classifyActorShapes,
  parsePixelSource,
} from "../svg-mascot-animator/scripts/pixel-source-model.mjs";
import { generateSpriteStory } from "../svg-mascot-animator/scripts/generate-mascot-packs.mjs";
import { loadStoryRegistry } from "../svg-mascot-animator/scripts/story-registry.mjs";

async function loadFrames(paths: string[]) {
  return Promise.all(paths.map(async (path) => {
    const model = parsePixelSource(await readFile(path, "utf8"), path);
    return { model, classification: classifyActorShapes(model) };
  }));
}

test("builds five hybrid sprite stories from all fifteen supplied artboards", async () => {
  const registry = await loadStoryRegistry();
  expect(registry.spriteStories).toHaveLength(5);

  for (const story of registry.spriteStories) {
    const frames = await loadFrames(story.frames);
    const generated = generateSpriteStory(frames, story);
    const sourceShapeCount = frames.reduce((sum, frame) => sum + frame.model.shapes.length, 0);
    const outputModel = parsePixelSource(generated, story.output);

    expect(outputModel.shapes).toHaveLength(sourceShapeCount);
    expect((generated.match(/data-frame="[0-2]"/g) ?? []).length).toBe(3);
    expect((generated.match(/data-actor="true"/g) ?? []).length).toBeGreaterThan(0);
    expect(generated).toContain(`@keyframes ${story.id}-frame-0`);
    expect(generated).toContain(`@keyframes ${story.id}-frame-1`);
    expect(generated).toContain(`@keyframes ${story.id}-frame-2`);
    expect(generated).toContain("steps(1,end)");
    expect(generated).toContain('data-frame-holds="20,42,30,8"');
    expect(generated).toContain(`@keyframes ${story.id}-actor-motion`);
    expect(generated).toContain("prefers-reduced-motion:reduce");
    expect(generated).not.toContain("<script");

    for (const frame of frames) {
      expect(generated).toContain(`data-frame-sha256="${frame.model.sourceHash}"`);
    }
  }
});

test("uses the third frame as the reduced-motion payoff pose", async () => {
  const registry = await loadStoryRegistry();
  const story = registry.spriteStories[0];
  const generated = generateSpriteStory(await loadFrames(story.frames), story);

  expect(generated).toContain(`.${story.id}-frame-0,.${story.id}-frame-1{opacity:0!important}`);
  expect(generated).toContain(`.${story.id}-frame-2{opacity:1!important}`);
});


test("survives SVGO without deleting initially hidden sprite frames", async () => {
  const registry = await loadStoryRegistry();
  const story = registry.spriteStories[0];
  const generated = generateSpriteStory(await loadFrames(story.frames), story);
  const optimized = optimize(generated, {
    path: story.output,
    ...configForFile(story.output),
  }).data;

  expect((optimized.match(/data-frame="[0-2]"/g) ?? []).length).toBe(3);
  expect((optimized.match(/data-actor="true"/g) ?? []).length).toBeGreaterThan(0);
  expect(optimized).toContain(`${story.id}-frame-0`);
  expect(parsePixelSource(optimized, story.output).shapes.length).toBeGreaterThan(0);
});
