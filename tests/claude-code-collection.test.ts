import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { validateManifest, validateSvgSource } from "../scripts/svg-contracts";

const claudeCodePath =
  "M20.998 10.949H24v3.102h-3v3.028h-1.487V20H18v-2.921h-1.487V20H15v-2.921H9V20H7.488v-2.921H6V20H4.487v-2.921H3V14.05H0V10.95h3V5h17.998v5.949zM6 10.949h1.488V8.102H6v2.847zm10.51 0H18V8.102h-1.49v2.847z";

const claudeCodeScenePaths = [
  "svgs/scenes/claude-code-terminal-sprint.svg",
  "svgs/scenes/claude-code-bug-hunt.svg",
  "svgs/scenes/claude-code-git-merge.svg",
  "svgs/scenes/claude-code-context-juggle.svg",
  "svgs/scenes/claude-code-release-launch.svg",
  "svgs/scenes/claude-code-review-pass.svg",
  "svgs/scenes/claude-code-pair-session.svg",
  "svgs/scenes/claude-code-refactor-pull.svg",
  "svgs/scenes/claude-code-test-lab.svg",
  "svgs/scenes/claude-code-coffee-compile.svg",
  "svgs/scenes/claude-code-focus-lock.svg",
  "svgs/scenes/claude-code-memory-search.svg",
  "svgs/scenes/claude-code-package-drop.svg",
  "svgs/scenes/claude-code-incident-response.svg",
  "svgs/scenes/claude-code-branch-swing.svg",
  "svgs/scenes/claude-code-token-rain.svg",
  "svgs/scenes/claude-code-prompt-fishing.svg",
  "svgs/scenes/claude-code-agent-conductor.svg",
  "svgs/scenes/claude-code-build-sleep.svg",
  "svgs/scenes/claude-code-victory-dance.svg",
  "svgs/scenes/claude-code-trampoline-bounce.svg",
  "svgs/scenes/claude-code-skate-grind.svg",
  "svgs/scenes/claude-code-jack-in-the-box.svg",
  "svgs/scenes/claude-code-weightlifter.svg",
  "svgs/scenes/claude-code-dj-scratch.svg",
  "svgs/scenes/claude-code-ninja-dash.svg",
  "svgs/scenes/claude-code-balloon-float.svg",
  "svgs/scenes/claude-code-magician-hat.svg",
  "svgs/scenes/claude-code-pinball-bumper.svg",
  "svgs/scenes/claude-code-breakdance-windmill.svg"
] as const;

describe("Claude Code motion collection", () => {
  test("contains registered scenes", async () => {
    const manifest = JSON.parse(
      await readFile("claude-code-manifest.json", "utf8"),
    );

    expect(manifest.assets).toHaveLength(30);
    expect(manifest.assets.map((entry: { path: string }) => entry.path)).toEqual(
      claudeCodeScenePaths,
    );

    const canonical = JSON.parse(await readFile("asset-manifest.json", "utf8"));
    const registered = canonical.assets
      .filter((entry: { category: string; type: string }) => entry.category === "claude-code" && entry.type === "scene")
      .map((entry: { path: string }) => entry.path);
    expect(registered).toEqual(claudeCodeScenePaths);
  });

  test("every scene preserves the supplied mascot path and SVG contract", async () => {
    for (const path of claudeCodeScenePaths) {
      const source = await readFile(path, "utf8");
      expect(source).toContain('width="360"');
      expect(source).toContain('height="240"');
      expect(source).toContain('viewBox="0 0 360 240"');
      expect(source).toContain('data-mascot="true"');
      expect(source).toContain(claudeCodePath);
      expect(source.match(new RegExp(claudeCodePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"))).toHaveLength(1);
      expect(validateSvgSource(path, source)).toEqual([]);
    }
  });

  test("uses the shared physics generator and motion bounds gate", async () => {
    const generator = await readFile("scripts/generate_claude_code_scenes.py", "utf8");
    const audit = await readFile("scripts/audit-motion-bounds.ts", "utf8");
    expect(generator).toContain("svg-mascot-animator/scripts/physics.py");
    expect(generator).toContain("physics.projectile");
    expect(generator).toContain("physics.pendulum_period");
    expect(audit).toContain("mascot motion");
    expect(audit).toContain("overflow");
  });

  test("collection manifest resolves every scene", async () => {
    expect(await validateManifest("claude-code-manifest.json")).toEqual([]);
  });

  test("collection documentation showcases every scene", async () => {
    const docs = await readFile("CLAUDE-CODE-COLLECTION.md", "utf8");
    for (const path of claudeCodeScenePaths) expect(docs).toContain(path);
  });
});
