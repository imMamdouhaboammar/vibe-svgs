import { expect, test } from "bun:test";
import { readFile } from "node:fs/promises";

const expectedExports = ["animate", "createTimeline", "spring", "svg", "utils"] as const;

test("pins Anime.js 4.5.0 as the mascot authoring engine", async () => {
  const packageJson = JSON.parse(await readFile("package.json", "utf8"));
  expect(packageJson.dependencies?.animejs).toBe("4.5.0");
  expect(packageJson.scripts?.["animator:setup"]).toBe(
    "bash svg-mascot-animator/scripts/setup.sh",
  );

  const animePackage = JSON.parse(
    await readFile("node_modules/animejs/package.json", "utf8"),
  );
  expect(animePackage.version).toBe("4.5.0");

  const anime = await import("animejs");
  for (const name of expectedExports) {
    expect(typeof anime[name]).not.toBe("undefined");
  }
});

test("the animator setup script installs with Bun rather than npm", async () => {
  const setup = await readFile("svg-mascot-animator/scripts/setup.sh", "utf8");
  expect(setup).toContain('bun add "animejs@${PIN}"');
  expect(setup).not.toContain("npm install");
});


test("keeps the bake CLI inert when imported by pack generators", async () => {
  const bake = await readFile("svg-mascot-animator/scripts/bake.mjs", "utf8");
  expect(bake).toContain("if (import.meta.main && argv.length)");
});
