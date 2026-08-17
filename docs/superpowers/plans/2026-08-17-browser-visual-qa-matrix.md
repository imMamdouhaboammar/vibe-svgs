# Browser Visual QA Matrix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing snapshot script into a browser-grade visual QA gate that preserves each SVG's native aspect ratio, verifies reduced-motion behavior, blocks unexpected network access, and emits reviewable capture metadata.

**Architecture:** Keep `scripts/visual-snapshots.ts` as the browser runner, extract deterministic viewport/profile helpers, render a configurable matrix, emit JSON diagnostics, and run a small representative smoke matrix in CI.

**Tech Stack:** Bun 1.3.14, TypeScript 7, Playwright 1.62, existing SVG manifests and Bun test runner.

## Global Constraints

- Do not add SVGs merely to increase asset count.
- Every visual decision must be rendered before approval.
- Animated assets must support `prefers-reduced-motion`.
- Reusable SVGs must not fetch unexpected external resources.
- Preserve public asset paths and current API defaults where practical.
- Add no image-analysis runtime dependency.

## Candidate improvements considered

1. Preserve native aspect ratio in snapshots.
2. Add normal and reduced-motion capture profiles.
3. Deny and report network access during browser rendering.
4. Emit machine-readable visual QA metadata.
5. Add a representative CI visual smoke matrix.
6. Detect CSS remote resources and inline event handlers in contracts.
7. Detect animations still running in reduced-motion mode.
8. Remove and prevent checked-in Python bytecode/cache artifacts.
9. Allow focused snapshot selection by asset ID.
10. Document visual QA and copy/paste safety.

**Selected initiative:** 1-5 and 9 form one coherent Browser Visual QA Matrix. Items 6-8 remain follow-on hardening candidates after the matrix is green.

### Task 1: Pure viewport and capture-profile model

**Files:** `scripts/visual-snapshots.ts`, `tests/visual-regression.test.ts`

- [ ] Write failing tests proving a 3:1 banner keeps its ratio, square assets remain square, invalid viewBoxes fail clearly, and animated assets receive normal plus reduced-motion profiles.
- [ ] Run `bun test tests/visual-regression.test.ts` and verify RED because the helpers do not exist.
- [ ] Implement `parseSvgViewBox`, `deriveSnapshotViewport`, and deterministic capture profile construction.
- [ ] Run the focused test and verify GREEN.
- [ ] Commit the test-backed helper model.

### Task 2: Browser runner matrix and network isolation

**Files:** `scripts/visual-snapshots.ts`, `tests/visual-regression.test.ts`

- [ ] Write failing tests for native viewport dimensions and motion-profile filenames using a temporary manifest/fixture.
- [ ] Verify RED.
- [ ] Implement `page.emulateMedia`, aspect-ratio-preserving viewports, request interception, and focused `assetIds`, `sizes`, `backgrounds`, `motionModes` options.
- [ ] Verify GREEN and no unexpected requests.
- [ ] Commit browser matrix behavior.

### Task 3: Machine-readable visual QA report

**Files:** `scripts/visual-snapshots.ts`, `tests/visual-regression.test.ts`

- [ ] Write failing assertions for `visual-report.json`, schema version, and capture count.
- [ ] Verify RED.
- [ ] Write a stable portable report after captures complete.
- [ ] Verify GREEN by parsing the report.
- [ ] Commit report generation.

### Task 4: Fast representative CI visual smoke gate

**Files:** `package.json`, `.github/workflows/svg-quality.yml`, `scripts/visual-smoke.ts`, `tests/visual-regression.test.ts`

- [ ] Write a failing selection test proving smoke assets resolve and span at least four categories.
- [ ] Verify RED.
- [ ] Implement `bun run visual:smoke` and install Playwright Chromium in the SVG Quality job.
- [ ] Verify through GitHub Actions when local Chromium is unavailable.
- [ ] Commit CI integration.

### Task 5: Repository hygiene and documentation

**Files:** `.gitignore`, `svg-mascot-animator/scripts/__pycache__/physics.cpython-314.pyc`, `docs/contributing/svg-quality.md`

- [ ] Ignore Python caches/bytecode and remove the tracked bytecode file.
- [ ] Document focused/full visual QA, reduced motion, network isolation, aspect ratio, and report semantics.
- [ ] Run `bun run check`, `bun test`, and `bun run visual:smoke` with fresh evidence.
- [ ] Commit hygiene/documentation independently.

### Task 6: Independent review and final verification

- [ ] Compare the branch against `main` and review every changed path for scope creep, compatibility breaks, weak abstractions, and generated artifacts.
- [ ] Require fresh zero-failure evidence from tests, SVG validation, typecheck, SVGO check, motion bounds, and browser smoke.
- [ ] Fix CI regressions before any completion claim.
- [ ] Create/update the pull request with evidence, risks, and follow-on candidates without merging `main`.
