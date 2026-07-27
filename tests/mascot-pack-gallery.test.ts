import { expect, test } from "bun:test";
import { readFile } from "node:fs/promises";

const expectedPackLabels = [
  "Reactions",
  "Work",
  "Systems",
  "Security",
  "Growth",
  "Celebration",
  "Daily",
  "Sprite Stories",
];

test("exposes mascot packs through a safe dedicated gallery filter", async () => {
  const [app, index, styles] = await Promise.all([
    readFile("src/app.js", "utf8"),
    readFile("index.html", "utf8"),
    readFile("src/styles.css", "utf8"),
  ]);

  expect(app).toContain("'mascot-packs': { label: 'Mascot Packs' }");
  expect(app).toContain("/^svgs\\/packs\\/[a-z0-9-]+\\/[a-z0-9][a-z0-9._-]*\\.svg$/");
  expect(app).toContain("pack: asset.pack || ''");
  expect(app).toContain("packLabels[item.pack]");
  expect(app).toContain("item.packLabel.toLowerCase().includes(normalizedQuery)");
  expect(index).toContain('<button class="filter-btn" data-category="mascot-packs">Mascot Packs</button>');
  expect(styles).toContain(".pack-preview img");
  expect(styles).toContain("image-rendering: pixelated");

  for (const label of expectedPackLabels) {
    expect(app).toContain(label);
  }
});

test("documents pack structure, generation, verification, and raw usage", async () => {
  const [docs, readme] = await Promise.all([
    readFile("MASCOT-PACKS.md", "utf8"),
    readFile("README.md", "utf8"),
  ]);

  expect(docs).toContain("66 animated SVGs");
  expect(docs).toContain("61 independent scenes");
  expect(docs).toContain("5 hybrid sprite stories");
  expect(docs).toContain("bun run generate:mascot-packs");
  expect(docs).toContain("bun run sync:mascot-packs");
  expect(docs).toContain("bun run motion:bounds:packs");
  expect(docs).toContain("Source preservation");
  expect(docs).toContain("raw.githubusercontent.com/imMamdouhaboammar/vibe-svgs/main/svgs/packs/");
  expect(readme).toContain("MASCOT-PACKS.md");
  expect(readme).toContain("66 physics-driven pixel mascot animations");
});
