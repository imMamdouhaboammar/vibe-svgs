# Claude Stories Motion Pack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add eight contract-compliant animated Claude workflow stories and expose them through the manifest, tests, and README gallery.

**Architecture:** Each story is a standalone SVG in `svgs/scenes/` with namespaced definitions, nested transform ownership, a deliberate static reduced-motion frame, and a 160 by 140 scene canvas. Registration stays centralized in `asset-manifest.json`; tests validate both individual SVG contracts and collection-level completeness.

**Tech Stack:** SVG, CSS keyframes, Bun test, TypeScript contract validator, JSON manifest, Markdown gallery.

## Global Constraints

- Bun remains the only runtime and package manager.
- No animated selector may own more than one transform-writing animation.
- Every reusable ID uses the filename stem as its prefix.
- Every story includes title, description, ARIA references, and reduced-motion handling.
- Story files must remain below 140 KB and use no scripts or remote resources.
- Artwork must be described as community-created or fan-made, never official.

---

## File structure

- Create eight focused scene files in `svgs/scenes/`, one workflow story per file.
- Modify `asset-manifest.json` to register each story as a Claude scene.
- Modify `tests/svg-contracts.test.ts` to verify SVG contracts and collection completeness.
- Modify `README.md` to add a Claude Stories gallery.

### Task 1: Workflow and reasoning stories

**Files:**
- Create: `svgs/scenes/claude-orchestrating.svg`
- Create: `svgs/scenes/claude-context-overflow.svg`
- Create: `svgs/scenes/claude-refactoring.svg`
- Create: `svgs/scenes/claude-deep-thinking.svg`

**Interfaces:**
- Produces four standalone contract-version-1 SVG files consumed by the manifest and tests.

- [ ] Write each SVG with a unique title and description, prefixed gradients and filters, semantic character and effect groups, and one transform animation per animated node.
- [ ] Add reduced-motion rules that freeze all `[data-animated]` nodes in an intentional static composition.
- [ ] Confirm the scenes fit inside `viewBox="0 0 160 140"` at every animation extreme.
- [ ] Commit as `feat: add Claude workflow reasoning stories`.

### Task 2: Delivery and collaboration stories

**Files:**
- Create: `svgs/scenes/claude-pair-programming.svg`
- Create: `svgs/scenes/claude-shipping.svg`
- Create: `svgs/scenes/claude-code-review.svg`
- Create: `svgs/scenes/claude-coffee-break.svg`

**Interfaces:**
- Produces four standalone contract-version-1 SVG files consumed by the manifest and tests.

- [ ] Write each SVG with connected anatomy and props attached to the controlling hand group.
- [ ] Synchronize shadows with body movement, especially the shipping launch and cup-lift cycles.
- [ ] Add reduced-motion rules and ensure no asset relies on a transient first keyframe to look complete.
- [ ] Commit as `feat: add Claude delivery and collaboration stories`.

### Task 3: Collection contract tests

**Files:**
- Modify: `tests/svg-contracts.test.ts`

**Interfaces:**
- Consumes the eight paths under `svgs/scenes/`.
- Produces failing assertions until the manifest and README integration are complete.

- [ ] Add a `claudeStoryPaths` constant containing all eight exact paths.
- [ ] Add a test that calls `validateSvgSource` for every story and expects no issues.
- [ ] Add a test that parses `asset-manifest.json`, filters Claude entries under `svgs/scenes/`, expects exactly eight entries, and verifies `type`, `animated`, and `contractVersion`.
- [ ] Add a test that verifies README contains `### Claude Stories` and every story filename.
- [ ] Commit as `test: define Claude Stories collection contract`.

### Task 4: Manifest registration

**Files:**
- Modify: `asset-manifest.json`

**Interfaces:**
- Produces eight safe local entries used by the gallery and manifest validator.

- [ ] Add eight entries after the existing Claude speaking scene.
- [ ] Use category `claude`, type `scene`, `animated: true`, `communityArtwork: true`, and `contractVersion: 1` for every entry.
- [ ] Use concise fan-made descriptions that state the distinct workflow action.
- [ ] Commit as `feat: register Claude Stories assets`.

### Task 5: README gallery

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes the exact story paths registered in the manifest.
- Produces a copy-ready gallery for repository visitors.

- [ ] Insert `### Claude Stories` after the Claude Family section.
- [ ] Add one row per story with a 140-pixel preview and raw GitHub Markdown URL.
- [ ] Keep scene names concise and avoid official-brand claims.
- [ ] Commit as `docs: showcase Claude Stories motion pack`.

### Task 6: Verification and review

**Files:**
- Review all files changed by Tasks 1 through 5.

**Interfaces:**
- Produces a PR-ready branch with evidence from all repository gates.

- [ ] Run `bun run test` and confirm all contract tests pass.
- [ ] Run `bun run validate` and confirm every manifest asset passes.
- [ ] Run `bun run typecheck`.
- [ ] Run `bun run svgo:check` and fix optimization drift without removing accessibility or reduced-motion rules.
- [ ] Run `bun run check` as the final combined gate.
- [ ] Review the diff for clipping risk, duplicate IDs, disconnected props, and misleading copy.
- [ ] Open a pull request describing the eight stories and verification results.
