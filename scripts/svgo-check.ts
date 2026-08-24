import { readFile, writeFile } from "node:fs/promises";
import { optimize } from "svgo";
// @ts-ignore
import svgoConfig from "../svgo.config.js";


async function loadSuppliedSourcePaths(): Promise<Set<string>> {
  const inventoryPath = "references/mascot-motion/source-inventory.json";
  if (!(await Bun.file(inventoryPath).exists())) return new Set();
  const inventory = JSON.parse(await readFile(inventoryPath, "utf8"));
  return new Set((inventory.svgSources ?? []).map((entry: { path: string }) => entry.path));
}

const preserveAnimatedPackPath = (filePath: string): boolean => filePath.startsWith("svgs/packs/");

const preserveClaudeCodePath = (filePath: string): boolean =>
  filePath.startsWith("svgs/scenes/claude-code-") &&
  filePath !== "svgs/scenes/claude-code-review.svg";

export const configForFile = (filePath: string) => ({
  ...svgoConfig,
  plugins: (svgoConfig.plugins ?? []).map((plugin: any) => {
    const preserveAnimationSelectors = preserveAnimatedPackPath(filePath);
    if (
      (!preserveClaudeCodePath(filePath) && !preserveAnimationSelectors) ||
      typeof plugin === "string" ||
      plugin.name !== "preset-default"
    ) {
      return plugin;
    }

    return {
      ...plugin,
      params: {
        ...(plugin.params ?? {}),
        overrides: {
          ...(plugin.params?.overrides ?? {}),
          convertPathData: false,
          convertShapeToPath: false,
          convertTransform: false,
          moveElemsAttrsToGroup: false,
          moveGroupAttrsToElems: false,
          removeHiddenElems: false,
          removeEmptyContainers: false,
          ...(preserveAnimationSelectors ? { inlineStyles: false } : {}),
        },
      },
    };
  }),
});

async function runSvgo(writeMode: boolean = false) {
  const suppliedSourcePaths = await loadSuppliedSourcePaths();
  const svgFiles: string[] = [];
  const glob = new Bun.Glob("svgs/**/*.svg");
  for await (const file of glob.scan(".")) {
    svgFiles.push(file);
  }

  let unoptimizedCount = 0;
  let checkedCount = 0;

  for (const filePath of svgFiles) {
    if (suppliedSourcePaths.has(filePath)) continue;
    checkedCount++;
    const original = await readFile(filePath, "utf8");
    const result = optimize(original, {
      path: filePath,
      ...configForFile(filePath),
    });

    if (result.data !== original) {
      unoptimizedCount++;
      if (writeMode) {
        await writeFile(filePath, result.data, "utf8");
        console.log(`Optimized: ${filePath}`);
      } else {
        console.warn(`Unoptimized file found: ${filePath}`);
      }
    }
  }

  if (!writeMode && unoptimizedCount > 0) {
    console.error(
      `SVGO Check failed: ${unoptimizedCount} files can be optimized. Run 'bun run svgo:write' to format.`
    );
    process.exit(1);
  } else {
    console.log(`SVGO check complete. ${checkedCount} generated or maintained SVG files satisfy configuration; ${suppliedSourcePaths.size} supplied source SVGs were preserved.`);
  }
}

if (import.meta.main) {
  const isWrite = process.argv.includes("--write");
  await runSvgo(isWrite);
}
