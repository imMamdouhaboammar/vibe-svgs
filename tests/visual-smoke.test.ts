import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { VISUAL_SMOKE_ASSET_IDS } from "../scripts/visual-smoke";

type ManifestAsset = {
  id: string;
  type: string;
  contractVersion?: number;
};

describe("visual smoke selection", () => {
  test("resolves representative migrated assets across four visual types", async () => {
    const manifest = JSON.parse(
      await readFile("asset-manifest.json", "utf8"),
    ) as { assets: ManifestAsset[] };
    const assetsById = new Map(manifest.assets.map((asset) => [asset.id, asset]));

    const selected = VISUAL_SMOKE_ASSET_IDS.map((id) => assetsById.get(id));
    expect(selected.every(Boolean)).toBe(true);
    expect(selected.every((asset) => asset?.contractVersion === 1)).toBe(true);

    const types = new Set(selected.map((asset) => asset?.type));
    expect(types).toEqual(new Set(["mascot", "scene", "banner", "badge"]));
  });
});
