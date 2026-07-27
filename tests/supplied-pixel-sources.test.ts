import { expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const inventoryPath = "references/mascot-motion/source-inventory.json";

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

test("records every supplied pixel source and MP4 reference without modification", async () => {
  const inventoryExists = await Bun.file(inventoryPath).exists();
  expect(inventoryExists).toBe(true);
  if (!inventoryExists) return;

  const inventory = JSON.parse(await readFile(inventoryPath, "utf8"));
  expect(inventory.version).toBe(1);
  expect(inventory.svgSources).toHaveLength(76);
  expect(inventory.videoReferences).toHaveLength(2);
  expect(inventory.svgSources.filter((entry: { kind: string }) => entry.kind === "artboard-frame")).toHaveLength(15);
  expect(new Set(inventory.svgSources.map((entry: { path: string }) => entry.path)).size).toBe(76);

  for (const entry of inventory.svgSources) {
    const source = await readFile(entry.path);
    const text = source.toString("utf8");
    expect(sha256(source)).toBe(entry.sha256);
    expect(text).toContain('viewBox="0 0 2000 2000"');
    expect(text).toContain("<rect");
    expect(text).not.toMatch(/<(?:path|circle|ellipse|polyline)\b/);
    expect((text.match(/<polygon\b/g) ?? []).length).toBe(entry.polygonCount);
  }

  expect(inventory.svgSources.filter((entry: { polygonCount: number }) => entry.polygonCount > 0)).toEqual([
    expect.objectContaining({ path: "svgs/mascots/secure-access-padlock.svg", polygonCount: 1 }),
  ]);

  for (const entry of inventory.videoReferences) {
    const source = await readFile(entry.path);
    expect(sha256(source)).toBe(entry.sha256);
    expect(source.byteLength).toBe(entry.bytes);
  }
});
