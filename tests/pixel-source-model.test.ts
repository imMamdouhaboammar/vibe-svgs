import { expect, test } from "bun:test";
import { readFile } from "node:fs/promises";

import {
  classifyActorShapes,
  inventoryPixelSources,
  parsePixelSource,
} from "../svg-mascot-animator/scripts/pixel-source-model.mjs";

test("parses supplied pixel sources without changing shape order", async () => {
  const path = "svgs/mascots/lifting-heavy-barbell.svg";
  const source = await readFile(path, "utf8");
  const model = parsePixelSource(source, path);

  expect(model.filename).toBe("lifting-heavy-barbell.svg");
  expect(model.viewBox).toEqual({ x: 0, y: 0, width: 2000, height: 2000 });
  expect(model.shapes.length).toBeGreaterThan(100);
  expect(model.shapes.every((shape) => shape.type === "rect")).toBe(true);
  expect(model.shapes.map((shape) => shape.sourceIndex)).toEqual(
    model.shapes.map((_, index) => index),
  );
  expect(model.sourceHash).toMatch(/^[a-f0-9]{64}$/);
});

test("preserves the supplied padlock polygon alongside rectangles", async () => {
  const path = "svgs/mascots/secure-access-padlock.svg";
  const source = await readFile(path, "utf8");
  const model = parsePixelSource(source, path);

  expect(model.shapes.filter((shape) => shape.type === "polygon")).toHaveLength(1);
  expect(model.shapes.find((shape) => shape.type === "polygon")?.raw).toContain("<polygon");
  expect(model.suffix).toContain("</svg>");
});

test("classifies a bounded actor assembly and leaves props separate", async () => {
  const path = "svgs/mascots/lifting-heavy-barbell.svg";
  const model = parsePixelSource(await readFile(path, "utf8"), path);
  const classification = classifyActorShapes(model);

  expect(classification.actorIndexes.length).toBeGreaterThan(20);
  expect(classification.actorIndexes.length).toBeLessThan(model.shapes.length);
  expect(classification.propIndexes.length).toBeGreaterThan(0);
  expect(classification.actorBounds.width).toBeGreaterThan(200);
  expect(classification.actorBounds.height).toBeGreaterThan(200);
  expect(classification.safeMargins.left).toBeGreaterThanOrEqual(0);
  expect(classification.safeMargins.right).toBeGreaterThanOrEqual(0);
  expect(classification.safeMargins.top).toBeGreaterThanOrEqual(0);
  expect(classification.safeMargins.bottom).toBeGreaterThanOrEqual(0);
});

test("inventories all supplied pixel sources with detectable actors", async () => {
  const inventory = await inventoryPixelSources("svgs/mascots");

  expect(inventory).toHaveLength(76);
  expect(inventory.filter((entry) => entry.filename.startsWith("artboard-"))).toHaveLength(15);
  for (const entry of inventory) {
    const classification = classifyActorShapes(entry);
    expect(classification.actorIndexes.length).toBeGreaterThan(0);
    expect(Number.isFinite(classification.actorBounds.x)).toBe(true);
    expect(Number.isFinite(classification.actorBounds.y)).toBe(true);
  }
});
