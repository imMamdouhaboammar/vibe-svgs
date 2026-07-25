# Vibe SVGs Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the Phase 1 foundation and pilot rebuild for Claude and Codex with test-first SVG contracts, accurate community-artwork language, and physically coherent 2.5D motion.

**Architecture:** A dependency-light Bun validation layer reads `asset-manifest.json`, checks each SVG as text, and exposes a deterministic `namespaceSvg()` helper for safe repeated inline embedding. Pilot artwork uses semantic nested SVG groups so translation, rotation, squash, limbs, props, and shadows each own one transform animation. GitHub Actions runs contract tests and the full repository validator on every pull request.

**Tech Stack:** Bun 1.3+, TypeScript, `bun:test`, SVG/CSS, GitHub Actions.

## Global Constraints

- Target style: rounded 2.5D cartoon illustration, not pixel art and not photoreal 3D.
- Pilot scope: `claude-mascot.svg`, `claude-jumping.svg`, `codex-mascot.svg`, and `codex-hallucinating.svg` only.
- Use community-created or fan-made language; never call a mascot official.
- Animated nodes may not have multiple animations that write `transform`.
- Every animated SVG must include a `prefers-reduced-motion` fallback.
- Every reusable ID must use a filename-derived prefix.
- Same-file repeated inline embedding must be supported through `namespaceSvg(source, instanceId)`.
- Keep stable public filenames.
- Do not delete unrelated Dokion files until separately inventoried and reviewed.

---

### Task 1: Establish the failing SVG contract suite

**Files:**
- Create: `tests/svg-contracts.test.ts`
- Create: `.github/workflows/svg-quality.yml`

**Interfaces:**
- Consumes: pilot SVG files and the future `scripts/svg-contracts.ts` API.
- Produces: executable tests for `validateSvgSource`, `validateManifest`, and `namespaceSvg`.

- [ ] **Step 1: Write failing tests**

```ts
import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import {
  namespaceSvg,
  validateManifest,
  validateSvgSource,
} from "../scripts/svg-contracts";

const pilotPaths = [
  "svgs/mascots/claude-mascot.svg",
  "svgs/mascots/claude-jumping.svg",
  "svgs/mascots/codex-mascot.svg",
  "svgs/mascots/codex-hallucinating.svg",
];

describe("SVG contracts", () => {
  test("namespaces duplicate IDs and every local reference", () => {
    const source = `<svg aria-labelledby="sample-title"><title id="sample-title">Sample</title><defs><linearGradient id="sample-gradient" /></defs><rect fill="url(#sample-gradient)" /></svg>`;
    const first = namespaceSvg(source, "card-one");
    const second = namespaceSvg(source, "card-two");

    expect(first).toContain("sample-title--card-one");
    expect(first).toContain("url(#sample-gradient--card-one)");
    expect(second).toContain("sample-title--card-two");
    expect(second).not.toContain("sample-title--card-one");
  });

  test("rejects competing transform animations", () => {
    const source = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" role="img" aria-labelledby="bad-title bad-desc"><title id="bad-title">Bad</title><desc id="bad-desc">Bad motion</desc><style>.body { animation: bounce 1s infinite, tilt 1s infinite; } @keyframes bounce { to { transform: translateY(-1px); } } @keyframes tilt { to { transform: rotate(4deg); } } @media (prefers-reduced-motion: reduce) { [data-animated] { animation: none !important; } }</style><g id="bad-body" class="body" data-animated="true" /></svg>`;
    const issues = validateSvgSource("bad.svg", source);
    expect(issues.some((issue) => issue.rule === "motion.transform-owner")).toBe(true);
  });

  test("pilot assets satisfy the complete contract", async () => {
    for (const path of pilotPaths) {
      const source = await readFile(path, "utf8");
      expect(validateSvgSource(path, source)).toEqual([]);
    }
  });

  test("manifest entries resolve and use community artwork language", async () => {
    expect(await validateManifest("asset-manifest.json")).toEqual([]);
  });
});
```

- [ ] **Step 2: Add a CI workflow that runs the focused test**

```yaml
name: SVG Quality
on:
  pull_request:
  push:
    branches: [main, "feat/**"]

jobs:
  contracts:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: 1.3.14
      - run: bun test tests/svg-contracts.test.ts
```

- [ ] **Step 3: Open the implementation PR and verify RED**

Expected: workflow fails because `scripts/svg-contracts.ts` does not exist.

- [ ] **Step 4: Commit**

```bash
git add tests/svg-contracts.test.ts .github/workflows/svg-quality.yml
git commit -m "test: define SVG quality contracts"
```

---

### Task 2: Implement validation, manifest checks, and inline namespacing

**Files:**
- Create: `scripts/svg-contracts.ts`
- Create: `scripts/validate-svg.ts`
- Create: `asset-manifest.json`
- Modify: `.github/workflows/svg-quality.yml`

**Interfaces:**
- Produces: `type SvgIssue = { path: string; rule: string; message: string }`.
- Produces: `validateSvgSource(path: string, source: string): SvgIssue[]`.
- Produces: `validateManifest(manifestPath: string): Promise<SvgIssue[]>`.
- Produces: `namespaceSvg(source: string, instanceId: string): string`.

- [ ] **Step 1: Implement only the contract API required by the tests**

Validation checks:

```text
svg.root                 root element and xmlns
svg.viewbox              non-empty viewBox
accessibility.title      title element and referenced title ID
accessibility.desc       desc element and referenced desc ID
security.script          no script element
security.remote-image    no remote href or xlink:href
ids.duplicate            no duplicate ID inside one file
ids.prefix               reusable IDs use the filename stem as prefix
ids.reference            every local URL, href, and aria-labelledby reference resolves
motion.reduced           animated files contain prefers-reduced-motion
motion.transform-owner   reject multiple transform-writing animations on one selector
claims.official-mascot   reject "official mascot" text
```

- [ ] **Step 2: Implement deterministic namespacing**

Sanitize `instanceId` to `[a-z0-9_-]`, append `--<instanceId>` to every ID, and rewrite:

```text
id="..."
url(#...)
href="#..."
xlink:href="#..."
aria-labelledby="... ..."
aria-describedby="... ..."
```

- [ ] **Step 3: Add the manifest source of truth**

Each pilot entry must include:

```json
{
  "id": "claude-mascot",
  "path": "svgs/mascots/claude-mascot.svg",
  "category": "claude",
  "type": "mascot",
  "animated": true,
  "communityArtwork": true,
  "title": "Claude Community Mascot",
  "description": "Fan-made terracotta coding mascot inspired by Claude workflows."
}
```

All other currently public paths referenced by the gallery must also have one manifest record, even if their artwork is not migrated in Phase 1.

- [ ] **Step 4: Add the CLI**

`scripts/validate-svg.ts` loads the manifest, validates every referenced SVG, prints all issues, and exits with code 1 only after reporting the complete list.

- [ ] **Step 5: Run GREEN verification**

```bash
bun test tests/svg-contracts.test.ts
bun run scripts/validate-svg.ts
```

Expected: contract unit tests pass after the pilot files are rebuilt in Tasks 3 and 4; manifest-only checks pass now.

- [ ] **Step 6: Expand CI**

Add:

```yaml
- run: bun run scripts/validate-svg.ts
```

- [ ] **Step 7: Commit**

```bash
git add scripts asset-manifest.json .github/workflows/svg-quality.yml
git commit -m "feat: add SVG validation and namespacing"
```

---

### Task 3: Rebuild the Claude pilot assets

**Files:**
- Modify: `svgs/mascots/claude-mascot.svg`
- Modify: `svgs/mascots/claude-jumping.svg`

**Interfaces:**
- Consumes: filename-prefix rules and motion ownership rules from Task 2.
- Produces: one idle/tool-bearing Claude mascot and one jump reference animation.

- [ ] **Step 1: Confirm the pilot contract still fails on the old files**

```bash
bun test tests/svg-contracts.test.ts -t "pilot assets"
```

Expected: FAIL for missing accessibility, generic IDs, transform conflicts, or missing reduced-motion behavior.

- [ ] **Step 2: Rebuild `claude-mascot.svg`**

Use a `120 120` viewBox, rounded terracotta body, overlapping shoulder and hip joints, upper-left lighting, one grounded contact shadow, expressive eyes, and a short tool whose prop group is nested under the hand group.

- [ ] **Step 3: Rebuild `claude-jumping.svg`**

Required nesting:

```text
claude-jumping-character-position
  claude-jumping-character-rotation
    claude-jumping-character-squash
      rear-limbs
      body
      face
      front-limbs
```

The shadow owns only its own scale and opacity animation. Takeoff, apex, landing compression, and recovery must be present in a 1.05 second cycle.

- [ ] **Step 4: Run focused GREEN verification**

```bash
bun test tests/svg-contracts.test.ts -t "pilot assets"
bun run scripts/validate-svg.ts
```

- [ ] **Step 5: Commit**

```bash
git add svgs/mascots/claude-mascot.svg svgs/mascots/claude-jumping.svg
git commit -m "feat: rebuild Claude pilot mascots"
```

---

### Task 4: Rebuild the Codex pilot assets

**Files:**
- Modify: `svgs/mascots/codex-mascot.svg`
- Modify: `svgs/mascots/codex-hallucinating.svg`

**Interfaces:**
- Consumes: the same semantic group and animation contracts used by Claude.
- Produces: one grounded Codex community mascot and one comedic hallucination reference animation.

- [ ] **Step 1: Keep the pilot test RED until both Codex files are replaced**

```bash
bun test tests/svg-contracts.test.ts -t "pilot assets"
```

- [ ] **Step 2: Rebuild `codex-mascot.svg`**

Use a rounded violet-to-cyan loop/cloud volume, dark face inset, terminal chevron cue, connected limbs, a cyan visor highlight, and a physically attached wrench or keyboard-key prop.

- [ ] **Step 3: Rebuild `codex-hallucinating.svg`**

Use nested position, rotation, and squash groups. Animate floating equation symbols on separate opacity/translation groups. The party hat follows the body group. Do not use live text for the equations.

- [ ] **Step 4: Run GREEN verification**

```bash
bun test tests/svg-contracts.test.ts
bun run scripts/validate-svg.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add svgs/mascots/codex-mascot.svg svgs/mascots/codex-hallucinating.svg
git commit -m "feat: rebuild Codex pilot mascots"
```

---

### Task 5: Align project metadata and public claims

**Files:**
- Modify: `package.json`
- Modify: `README.md`
- Modify: `src/app.js`
- Create: `docs/contributing/svg-quality.md`

**Interfaces:**
- Consumes: `asset-manifest.json` as the public catalog source.
- Produces: accurate package identity, contributor rules, and no misleading mascot claims.

- [ ] **Step 1: Add a failing metadata assertion**

Extend the test file:

```ts
test("package and README identify a community SVG project", async () => {
  const pkg = JSON.parse(await readFile("package.json", "utf8"));
  const readme = await readFile("README.md", "utf8");
  expect(pkg.name).toBe("vibe-svgs");
  expect(pkg.private).toBe(true);
  expect(readme).toContain("community-created");
  expect(readme.toLowerCase()).not.toContain("official 3d mascot");
});
```

- [ ] **Step 2: Verify RED**

```bash
bun test tests/svg-contracts.test.ts -t "package and README"
```

- [ ] **Step 3: Replace Dokion package metadata**

Use:

```json
{
  "name": "vibe-svgs",
  "version": "0.1.0",
  "description": "Open-source animated SVG mascot, badge, and banner library.",
  "type": "module",
  "private": true,
  "license": "MIT",
  "packageManager": "bun@1.3.14",
  "scripts": {
    "serve": "bunx serve .",
    "test": "bun test",
    "validate": "bun run scripts/validate-svg.ts",
    "check": "bun test && bun run validate"
  },
  "devDependencies": {
    "@types/bun": "^1.3.14",
    "typescript": "^7.0.2"
  },
  "engines": {
    "bun": ">=1.3.14"
  }
}
```

- [ ] **Step 4: Correct README and gallery claims**

Replace `Official 3D Mascot` with `Community 2.5D Mascot`, add a trademark notice, and keep existing stable asset URLs.

- [ ] **Step 5: Document contributor quality rules**

Cover ID prefixes, semantic groups, one-transform-owner motion, reduced motion, accessibility, file budgets, and the required validation command.

- [ ] **Step 6: Run the complete verification suite**

```bash
bun run check
```

Expected: PASS with no warnings.

- [ ] **Step 7: Commit**

```bash
git add package.json README.md src/app.js docs/contributing/svg-quality.md tests/svg-contracts.test.ts
git commit -m "chore: align Vibe SVGs metadata and claims"
```

---

### Task 6: Final review and PR readiness

**Files:**
- Review all Phase 1 changes.

**Interfaces:**
- Produces: verified implementation PR ready for visual review.

- [ ] **Step 1: Run all checks in CI**

```bash
bun run check
```

- [ ] **Step 2: Inspect GitHub Actions logs**

Expected: `SVG Quality / contracts` succeeds.

- [ ] **Step 3: Review the final diff for scope**

Confirm no unrelated Dokion source files were deleted and no Phase 2 mascot was silently redesigned.

- [ ] **Step 4: Update PR summary with completed checks and known limits**

Known limit allowed in this slice: PNG visual baselines remain a follow-up after the pilot artwork receives human visual approval.

- [ ] **Step 5: Request final code review**

Run CodeRabbit or an equivalent focused review against the committed diff, repair valid findings, and re-run `bun run check`.
