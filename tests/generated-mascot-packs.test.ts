import { expect, test } from "bun:test";
import { readFile } from "node:fs/promises";

import {
  classifyActorShapes,
  parsePixelSource,
} from "../svg-mascot-animator/scripts/pixel-source-model.mjs";
import { generateIndependentStory } from "../svg-mascot-animator/scripts/generate-mascot-packs.mjs";
import {
  loadStoryRegistry,
  resolveStory,
} from "../svg-mascot-animator/scripts/story-registry.mjs";

const representatives = [
  "angry-at-laptop.svg",
  "debugging-system-bugs.svg",
  "api-success-pixel.svg",
  "secure-access-padlock.svg",
  "idea-lightbulb-pixel.svg",
  "happy-pixel-celebrating.svg",
  "lifting-heavy-barbell.svg",
];

function signature(model: ReturnType<typeof parsePixelSource>) {
  return model.shapes.map((shape) => ({
    type: shape.type,
    fill: shape.fill,
    bounds: shape.bounds,
  }));
}

test("generates one source-preserving animated story from every pack family", async () => {
  for (const filename of representatives) {
    const path = `svgs/mascots/${filename}`;
    const source = await readFile(path, "utf8");
    const model = parsePixelSource(source, path);
    const classification = classifyActorShapes(model);
    const story = await resolveStory(filename);
    const generated = generateIndependentStory(model, classification, story);
    const outputModel = parsePixelSource(generated, story.output);

    expect(signature(outputModel)).toEqual(signature(model));
    expect((generated.match(/data-actor="true"/g) ?? []).length).toBe(
      classification.actorIndexes.length,
    );
    expect(generated).toContain(`data-source-sha256="${model.sourceHash}"`);
    expect(generated).toContain(`aria-labelledby="${story.id}-title ${story.id}-desc"`);
    expect(generated).toContain('width="400" height="400" viewBox="0 0 2000 2000"');
    expect(generated).toContain("shape-rendering=\"crispEdges\"");
    expect(generated).toContain(`@keyframes ${story.id}-actor-motion`);
    expect(generated).toContain(`@keyframes ${story.id}-shadow-motion`);
    expect(generated).toContain("prefers-reduced-motion:reduce");
    expect(generated).not.toContain("<script");
    expect(generated).not.toMatch(/(?:href|src)=["']https?:\/\//);
    expect(generated).not.toMatch(/url\(https?:\/\//);
    expect(generated).not.toContain("javascript:");
    const ids = [...generated.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
    expect(new Set(ids).size).toBe(ids.length);

    if (story.propMode !== "static" && classification.propIndexes.length > 0) {
      expect(generated).toContain('data-prop="true"');
    }
  }
});

test("uses common viewBox-space pivots so actor pixels move as one rigid assembly", async () => {
  const filename = "lifting-heavy-barbell.svg";
  const path = `svgs/mascots/${filename}`;
  const model = parsePixelSource(await readFile(path, "utf8"), path);
  const classification = classifyActorShapes(model);
  const story = await resolveStory(filename);
  const generated = generateIndependentStory(model, classification, story);
  const originX = Number((classification.actorBounds.x + classification.actorBounds.width / 2).toFixed(3));
  const originY = Number((classification.actorBounds.y + classification.actorBounds.height).toFixed(3));
  const expectedOrigin = `${originX}px ${originY}px`;

  expect(generated).toContain(`transform-origin:${expectedOrigin}`);
  expect(generated).toContain("transform-box:view-box");
  expect(generated).toContain(`data-motion-preset="${story.preset}"`);
});


test("generates every registered independent story with actor motion", async () => {
  const registry = await loadStoryRegistry();
  expect(registry.independent).toHaveLength(61);

  for (const story of registry.independent) {
    const source = await readFile(story.source, "utf8");
    const model = parsePixelSource(source, story.source);
    const classification = classifyActorShapes(model);
    const generated = generateIndependentStory(model, classification, story);
    const outputModel = parsePixelSource(generated, story.output);

    expect(outputModel.shapes).toHaveLength(model.shapes.length);
    expect((generated.match(/data-actor="true"/g) ?? []).length).toBeGreaterThan(0);
    expect(generated).toContain(`animation:${story.id}-actor-motion`);
    expect(generated.length).toBeGreaterThan(source.length);
  }
});
