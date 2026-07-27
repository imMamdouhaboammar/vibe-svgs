# Mascot Animation Packs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Install the local animation engine, preserve all supplied pixel sources, and generate 66 tested standalone animated SVG pack assets from 76 static source files.

**Architecture:** A component-aware generator parses rectangle-only pixel SVGs, marks the terracotta actor and nearby details without changing element order, applies filename-selected physics presets, and emits self-contained CSS-animated SVGs. Five artboard triplets use discrete sprite frames plus a shared transform rig. Anime.js 4.5.0 supplies spring and easing samples during authoring, while final SVGs contain no JavaScript.

**Tech Stack:** Bun 1.3.14, Anime.js 4.5.0, JavaScript ES modules, Python 3 for existing physics helpers, SVG/CSS keyframes, Playwright, Bun test, SVGO 4.

## Global Constraints

- Work directly on `main` because the user explicitly requested it.
- After each tested logical unit, commit and push immediately.
- Use Bun for dependency installation and scripts.
- Do not alter the supplied source artwork.
- Do not invent logos or replacement mascots.
- Every output must move the actor itself.
- No moving element may leave the viewBox at any sampled point.
- Every output must include reduced-motion fallback, title, description, intrinsic size, namespaced IDs, and namespaced keyframes.
- Keep final SVGs self-contained with no scripts, external images, remote fonts, or absolute URLs.
- Do not stage the unrelated local deletion of `svgs/mascots/deepseek-suite-hd.svg`.

---

### Task 1: Install and verify the animation engine

**Files:**
- Modify: `package.json`
- Modify: `bun.lock`
- Modify: `svg-mascot-animator/scripts/setup.sh`
- Create: `tests/animator-engine.test.ts`

**Interfaces:**
- Produces: installed `animejs@4.5.0`
- Produces: `bun run animator:setup`
- Produces: verified exports `animate`, `createTimeline`, `spring`, `svg`, and `utils`

- [ ] **Step 1: Write the failing engine test**

Create a Bun test that imports Anime.js, reads its package version, verifies `4.5.0`, and checks the required exports.

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun test tests/animator-engine.test.ts`

Expected: failure because `animejs` is not installed.

- [ ] **Step 3: Install Anime.js with Bun and update setup**

Run: `bun add animejs@4.5.0`

Change `setup.sh` from `npm install` to `bun add`, keep the pin, and add `animator:setup` to `package.json`.

- [ ] **Step 4: Run engine verification**

Run: `bun test tests/animator-engine.test.ts && bun run animator:setup`

Expected: test pass and printed spring solver duration.

- [ ] **Step 5: Commit and push**

Commit message: `feat: install mascot animation engine`

### Task 2: Commit the supplied sources without modification

**Files:**
- Add: 76 static SVG files under `svgs/mascots/`
- Add: two MP4 reference files under `svgs/mascots/`
- Create: `references/mascot-motion/README.md`
- Create: `tests/supplied-pixel-sources.test.ts`

**Interfaces:**
- Produces: a stable source inventory consumed by later generators
- Produces: `SUPPLIED_PIXEL_SOURCE_NAMES`

- [ ] **Step 1: Write the source inventory test**

The test must assert 76 static `2000 2000` rectangle-only SVG sources, 15 artboard frames, and two MP4 references.

- [ ] **Step 2: Run the test before staging sources**

Run: `bun test tests/supplied-pixel-sources.test.ts`

Expected: failure because the files are untracked and no inventory module exists.

- [ ] **Step 3: Add an exact inventory fixture**

Create `references/mascot-motion/README.md` describing both MP4s and the source split. Add only the supplied files and the test. Do not add generated output.

- [ ] **Step 4: Verify source bytes and structure**

Run: `bun test tests/supplied-pixel-sources.test.ts`

Run: `git diff --cached --check`

Expected: 76 sources accounted for and no source content rewritten.

- [ ] **Step 5: Commit and push**

Commit message: `assets: add supplied pixel mascot sources`

### Task 3: Build source inventory and actor classification

**Files:**
- Create: `svg-mascot-animator/scripts/pixel-source-model.mjs`
- Create: `svg-mascot-animator/scripts/inventory-pixel-sources.mjs`
- Create: `tests/pixel-source-model.test.ts`

**Interfaces:**
- Produces: `parsePixelSource(source, filename): PixelSource`
- Produces: `classifyActorRects(pixelSource): ActorClassification`
- Produces: `inventoryPixelSources(directory): Promise<PixelSource[]>`

`PixelSource` contains filename, viewBox, root attributes, ordered rectangle records, and source hash. `ActorClassification` contains actor indexes, prop indexes, actor bounds, prop bounds, and safe margins.

- [ ] **Step 1: Write failing parser tests**

Test a supplied source for 2000 by 2000 geometry, ordered rectangle extraction, fill normalization, and actor detection from `#d97757`.

- [ ] **Step 2: Run tests and confirm failure**

Run: `bun test tests/pixel-source-model.test.ts`

- [ ] **Step 3: Implement parser and actor classifier**

Parse only root-level `<rect />` nodes. Mark every terracotta rectangle as actor. Include nearby dark, white, and peach details when their centers fall within the actor bounds expanded by one source grid step. Keep indexes so output order remains unchanged.

- [ ] **Step 4: Verify all 76 sources**

Run: `bun run svg-mascot-animator/scripts/inventory-pixel-sources.mjs`

Expected: every source has actor rectangles, finite bounds, positive safe margins, and no unsupported elements.

- [ ] **Step 5: Commit and push**

Commit message: `feat: classify pixel mascot source geometry`

### Task 4: Define complete pack stories

**Files:**
- Create: `svg-mascot-animator/config/mascot-pack-stories.json`
- Create: `svg-mascot-animator/scripts/story-registry.mjs`
- Create: `tests/mascot-story-registry.test.ts`

**Interfaces:**
- Produces: `loadStoryRegistry(): Promise<StoryRegistry>`
- Produces: `resolveStory(filename): StoryDefinition`

Each `StoryDefinition` contains source, output, pack, preset, propMode, title, description, and durationMs.

- [ ] **Step 1: Write failing coverage tests**

Assert that all 61 independent sources have one story and all 15 artboards appear in exactly five sprite groups. Assert exactly 66 output paths and no duplicate IDs.

- [ ] **Step 2: Run tests and confirm failure**

Run: `bun test tests/mascot-story-registry.test.ts`

- [ ] **Step 3: Add the registry and resolver**

Assign sources to reactions, work, systems, security, growth, celebration, daily, or sprite-stories. Select motion presets from rage, sad, celebrate, think, focus, systems, repair, nature, lift, speed, sleep, aura, ninja, sign, and generic.

- [ ] **Step 4: Run registry tests**

Run: `bun test tests/mascot-story-registry.test.ts`

Expected: 76 sources accounted for and 66 outputs defined.

- [ ] **Step 5: Commit and push**

Commit message: `feat: define mascot animation pack stories`

### Task 5: Generate independent animated pack assets

**Files:**
- Create: `svg-mascot-animator/scripts/motion-presets.mjs`
- Create: `svg-mascot-animator/scripts/generate-mascot-packs.mjs`
- Create: `tests/generated-mascot-packs.test.ts`
- Create: `svgs/packs/reactions/*.svg`
- Create: `svgs/packs/work/*.svg`
- Create: `svgs/packs/systems/*.svg`
- Create: `svgs/packs/security/*.svg`
- Create: `svgs/packs/growth/*.svg`
- Create: `svgs/packs/celebration/*.svg`
- Create: `svgs/packs/daily/*.svg`

**Interfaces:**
- Produces: `generateIndependentStory(source, story): string`
- Consumes: `parsePixelSource`, `classifyActorRects`, `resolveStory`, and Anime.js spring samples

- [ ] **Step 1: Write failing generation tests**

Test one source from each pack. Assert source rectangle count is preserved, actor rectangles receive animation classes, original order is preserved, root metadata exists, and output includes reduced-motion CSS.

- [ ] **Step 2: Run tests and confirm failure**

Run: `bun test tests/generated-mascot-packs.test.ts`

- [ ] **Step 3: Implement conservative motion presets**

Build separate keyframes for translation, rotation, scale, shadow, prop movement, and effects. Clamp amplitudes from safe margins. Sample jump parabolas and spring recovery. Use one transform concern per nested CSS owner or one shared viewBox-space transform per actor rectangle.

- [ ] **Step 4: Generate all 61 independent outputs**

Run: `bun run generate:mascot-packs`

Expected: 61 SVG files across seven pack directories.

- [ ] **Step 5: Verify generated independent outputs**

Run: `bun test tests/generated-mascot-packs.test.ts`

Run: `python3 svg-mascot-animator/scripts/check_asset.py <each generated file>` through a batch script.

- [ ] **Step 6: Commit and push by pack**

Create one tested commit per pack, using messages such as `feat: add reactions mascot animation pack`.

### Task 6: Generate five hybrid sprite stories

**Files:**
- Modify: `svg-mascot-animator/scripts/generate-mascot-packs.mjs`
- Create: `svgs/packs/sprite-stories/*.svg`
- Modify: `tests/generated-mascot-packs.test.ts`

**Interfaces:**
- Produces: `generateSpriteStory(frames, story): string`

- [ ] **Step 1: Write failing sprite tests**

Assert each sprite output includes exactly three complete frame groups, discrete visibility timing, unequal holds, shared actor transform, and reduced-motion payoff frame.

- [ ] **Step 2: Run tests and confirm failure**

Run: `bun test tests/generated-mascot-packs.test.ts -t sprite`

- [ ] **Step 3: Implement hybrid sprite generation**

Preserve each source frame intact. Switch opacity with step timing. Wrap frames in one movement rig for sway, lift, recoil, or bounce. Use longer holds at effort and payoff beats.

- [ ] **Step 4: Generate and verify five outputs**

Run: `bun run generate:mascot-packs`

Run: `bun test tests/generated-mascot-packs.test.ts`

- [ ] **Step 5: Commit and push**

Commit message: `feat: add hybrid sprite mascot stories`

### Task 7: Add manifests, gallery support, and docs

**Files:**
- Create: `mascot-packs-manifest.json`
- Modify: `asset-manifest.json`
- Modify: `src/app.js`
- Modify: `index.html`
- Modify: `src/styles.css`
- Modify: `README.md`
- Create: `MASCOT-PACKS.md`
- Create: `tests/mascot-pack-manifest.test.ts`

**Interfaces:**
- Produces: gallery category `mascot-packs`
- Produces: manifest entries for all 66 generated outputs

- [ ] **Step 1: Write failing manifest and gallery tests**

Assert 66 pack entries resolve, use safe local paths, and the gallery exposes a Mascot Packs filter.

- [ ] **Step 2: Run tests and confirm failure**

Run: `bun test tests/mascot-pack-manifest.test.ts`

- [ ] **Step 3: Generate manifests and update gallery**

Allow safe paths under `svgs/packs/<pack>/<file>.svg`. Add one gallery filter and show pack labels from manifest metadata.

- [ ] **Step 4: Add usage documentation**

Document source preservation, pack taxonomy, generator commands, raw Markdown examples, and reduced-motion behavior.

- [ ] **Step 5: Verify and commit**

Run: `bun test tests/mascot-pack-manifest.test.ts tests/svg-contracts.test.ts`

Commit message: `feat: publish mascot animation packs`

### Task 8: Extend bounds, snapshots, and CI gates

**Files:**
- Modify: `scripts/audit-motion-bounds.ts`
- Modify: `scripts/visual-snapshots.ts`
- Modify: `package.json`
- Modify: `.github/workflows/ci.yml`
- Create: `tests/mascot-pack-motion.test.ts`

**Interfaces:**
- Produces: `bun run motion:bounds:packs`
- Produces: `bun run check:packs`

- [ ] **Step 1: Write failing motion gate tests**

Assert every pack output has measurable actor movement and that sampled bounding boxes remain within its viewBox.

- [ ] **Step 2: Run tests and confirm failure**

Run: `bun test tests/mascot-pack-motion.test.ts`

- [ ] **Step 3: Extend bounds and snapshot scripts**

Teach the bounds audit to identify actor classes in pack files. Render representative assets from every pack at 96, 160, and 320 pixels.

- [ ] **Step 4: Run all local gates**

Run: `bun run test:all`

Run: `bun run check`

Run: `bun run check:packs`

Run: `bun run motion:bounds:all`

Expected: zero failures and zero out-of-frame elements.

- [ ] **Step 5: Commit and push**

Commit message: `test: enforce mascot pack motion quality`

### Task 9: Verify remote CI and repository state

**Files:**
- No source changes unless CI finds a real defect.

- [ ] **Step 1: Confirm working tree scope**

Run: `git status --short --branch`

Expected: no generated or documentation changes remain unstaged. The unrelated deletion of `deepseek-suite-hd.svg` must remain outside commits unless the user resolves it.

- [ ] **Step 2: Check GitHub Actions**

Run: `gh run list --branch main --limit 10`

Run: `gh run watch <latest-ci-run> --exit-status`

- [ ] **Step 3: Fix any real CI defect in a small commit**

Reproduce locally, write or update the relevant test, commit, push, and watch CI again.

- [ ] **Step 4: Report exact counts**

Report source count, generated count, pack count, test count, motion-bounds count, visual-regression result, commit SHAs, and CI status.
