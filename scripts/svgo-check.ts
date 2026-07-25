import { readFile, writeFile } from "node:fs/promises";
import { optimize } from "svgo";
// @ts-ignore
import svgoConfig from "../svgo.config.js";

async function runSvgo(writeMode: boolean = false) {
  const svgFiles: string[] = [];
  const glob = new Bun.Glob("svgs/**/*.svg");
  for await (const file of glob.scan(".")) {
    svgFiles.push(file);
  }

  let unoptimizedCount = 0;

  for (const filePath of svgFiles) {
    const original = await readFile(filePath, "utf8");
    const result = optimize(original, {
      path: filePath,
      ...svgoConfig,
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
    console.log(`SVGO check complete. All ${svgFiles.length} SVG files satisfy SVGO configuration.`);
  }
}

const isWrite = process.argv.includes("--write");
runSvgo(isWrite);
