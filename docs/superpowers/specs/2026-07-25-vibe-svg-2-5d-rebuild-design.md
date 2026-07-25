# Vibe SVGs 2.5D Rebuild Design

Date: 2026-07-25
Status: Approved direction, implementation pending
Owner: Mamdouh Aboammar

## 1. Problem statement

The repository presents itself as an open-source SVG library for AI coding products, but the current assets have recurring visual, motion, structural, and project-level defects:

- Character anatomy is built mainly from disconnected rectangles with weak joints, weight distribution, and contact points.
- Props such as swords, tools, and accessories do not consistently attach to hands or follow the same pivot.
- Multiple CSS animations compete for the same `transform` property on a single element.
- Shadows, squash, stretch, and contact timing do not match the character movement.
- Assets described as 3D are visually closer to unfinished block art.
- Brand logos and mascot artwork are mixed without a clear legal or naming boundary.
- SVG files do not follow a shared system for proportions, lighting, IDs, accessibility, or motion.
- The root package metadata still describes Dokion rather than Vibe SVGs.
- There is no automated SVG quality gate or visual regression workflow.

The rebuild must improve the visual quality without turning the repository into a heavy animation framework.

## 2. Goal

Rebuild Vibe SVGs as a coherent 2.5D mascot and badge library that is:

- visually consistent across platforms;
- physically believable within a stylized cartoon language;
- readable at small README and documentation sizes;
- safe to embed multiple times on one page;
- accessible when motion is reduced;
- testable through static checks and rendered snapshots;
- clearly presented as community artwork, not official brand assets.

## 3. Success criteria

The first implementation milestone is successful when:

1. A shared mascot construction system is documented and used by the pilot assets.
2. Claude, Codex, Gemini, Cursor, DeepSeek, and Copilot each have one rebuilt standalone mascot.
3. Claude jumping and Codex hallucinating are rebuilt as motion reference assets.
4. No animated element has competing declarations that overwrite the same `transform` property.
5. Props remain visibly attached to the intended hand throughout the animation cycle.
6. Contact shadows react to jump height, body compression, and horizontal movement.
7. All SVG IDs are unique after the same asset is embedded more than once.
8. Every animated SVG contains a reduced-motion fallback.
9. The project includes automated SVG validation and rendered snapshot checks.
10. Repository metadata, documentation, and claims match the actual project.

## 4. Considered approaches

### Approach A: Repair each existing file in place

Keep every current asset and patch local defects.

Advantages:
- smallest immediate diff;
- preserves all current filenames;
- faster for isolated syntax errors.

Disadvantages:
- preserves inconsistent geometry and duplicated drawing logic;
- makes visual consistency difficult;
- repeated animation defects will continue to appear;
- creates a large maintenance burden.

### Approach B: Rebuild the library around a shared 2.5D system

Create a documented visual grammar, rebuild representative assets, then migrate the remaining collection in controlled batches.

Advantages:
- fixes the source of repeated problems;
- creates consistent proportions and movement;
- supports automated checks;
- keeps assets lightweight and editable.

Disadvantages:
- requires deliberate migration work;
- some old artwork will be replaced rather than patched.

### Approach C: Replace SVG illustration with raster or external 3D renders

Generate polished character art elsewhere and embed images.

Advantages:
- can produce richer surface detail;
- avoids complex SVG geometry.

Disadvantages:
- loses true vector behavior;
- increases file size;
- weakens editability and accessibility;
- does not suit an SVG-first open-source library.

### Decision

Use Approach B. Preserve stable public filenames where practical, but treat the artwork as a controlled rebuild rather than a patch set.

## 5. Visual system

### 5.1 Style

The target style is rounded 2.5D cartoon illustration, not pixel art and not photoreal 3D.

Core traits:

- rounded silhouettes;
- simple readable volumes;
- one dominant light source from the upper left;
- restrained gradients with two or three meaningful stops;
- soft contact shadows;
- limited highlights;
- expressive eyes and body poses;
- clean shapes that remain readable around 96 to 160 pixels wide.

### 5.2 Shared proportions

Each humanoid mascot uses a normalized 100 by 110 coordinate frame:

- body mass: roughly 50 to 62 percent of total character height;
- eye line: roughly 34 to 43 percent from the top;
- arm root: aligned to the upper middle of the body volume;
- leg root: aligned to the lower body mass, not directly to the canvas;
- minimum joint overlap: 2 SVG units to prevent visual gaps;
- minimum limb corner radius: 35 percent of limb thickness;
- ground contact baseline: shared within each scene.

Non-humanoid mascots such as DeepSeek may depart from these values but must follow the same lighting and motion rules.

### 5.3 Shape hierarchy

Each mascot is assembled into semantic groups:

```text
scene
  shadow
  character
    rear-limbs
    body
    face
    front-limbs
    props
    highlights
  effects
```

The grouping order controls depth and makes movement easier to reason about.

### 5.4 Platform identity

Each mascot keeps a distinct visual cue without copying or falsely claiming an official mascot:

- Claude: terracotta, warm square-like rounded body, asterisk-inspired detail.
- Codex: violet-to-cyan cloud or loop-inspired body, terminal cue.
- Cursor: dark graphite or olive body, cursor or cube cue.
- Gemini: blue-violet sparkle core and orbital detail.
- DeepSeek: blue whale character with ocean and reasoning cues.
- Copilot: dark rounded robot with cyan visor cue.

Descriptions must use phrases such as "community mascot" or "fan-made vector artwork" rather than "official mascot".

## 6. Motion system

### 6.1 Motion architecture

Never place several animations that each write `transform` on the same node.

Movement is split across nested groups:

```text
character-position
  character-rotation
    character-squash
      body-and-limbs
```

Each group owns one responsibility:

- position group: translate X and Y;
- rotation group: body lean;
- squash group: scale X and Y;
- limb groups: local rotation around defined joints;
- prop group: follows the hand joint and may add a local offset.

### 6.2 Transform rules

Each animated group must define:

- `transform-box: view-box` or `fill-box`, selected deliberately;
- an explicit `transform-origin` in SVG coordinates;
- one animation that owns its transform;
- a static fallback position that still looks correct.

### 6.3 Physical cues

Stylized movement follows these rules:

- anticipation occurs before a jump or strike;
- the body compresses before takeoff;
- the shadow becomes smaller and lighter as height increases;
- limbs trail slightly behind the main body direction;
- landing includes a brief compression, not an immediate reset;
- held props share the hand pivot and remain attached;
- fast motion uses arcs rather than abrupt endpoint switching.

### 6.4 Timing tokens

Initial motion tokens:

- idle breathing: 2.4 to 3.6 seconds;
- blink: irregular 3.2 to 5.5 seconds;
- jump cycle: 0.9 to 1.2 seconds;
- gesture cycle: 1.2 to 1.8 seconds;
- panic or comedy loop: no faster than 0.55 seconds unless the movement is a small secondary tremble.

The same asset should not loop several high-amplitude movements at different short intervals.

### 6.5 Reduced motion

Every animated asset must include:

```css
@media (prefers-reduced-motion: reduce) {
  [data-animated] {
    animation: none !important;
  }
}
```

The static frame must be intentionally composed, not an arbitrary first keyframe.

## 7. SVG engineering rules

### 7.1 Required root attributes

Each asset must include:

- `xmlns`;
- a valid `viewBox`;
- `role="img"` when embedded as meaningful content;
- `<title>` and optional `<desc>` with stable IDs;
- `aria-labelledby` that references the title and description.

Decorative use can be documented separately with `aria-hidden="true"` at the embedding site.

### 7.2 ID safety

Generic IDs such as `bodyGrad`, `shadowGrad`, and `dropShadow` can collide when inline SVGs are used together.

Each file must use a filename-derived prefix, for example:

```text
claude-mascot-v2-body-gradient
claude-mascot-v2-shadow-filter
```

Validation must reject duplicate IDs inside a file and unprefixed reusable IDs.

### 7.3 Filters and gradients

- filter regions must be large enough to prevent clipping but not excessively large;
- gradients must represent an intended light direction;
- blur values must remain proportional to the viewBox;
- avoid glow filters on every asset;
- avoid filters for details that can be drawn with simpler shapes.

### 7.4 Text

Avoid live `<text>` inside reusable logos and badges when exact typography is required, because rendering depends on installed fonts.

For editable badge generation, live text is allowed in the web tool, but exported assets must either:

- declare a documented font stack;
- or offer an outlined export path in a later milestone.

### 7.5 File size

Initial budgets:

- simple logo: under 15 KB;
- badge: under 25 KB;
- standalone mascot: under 70 KB;
- animated scene or suite: under 140 KB.

Budgets can be raised for a justified asset, but CI must report the exception.

## 8. Repository structure

Target structure:

```text
svgs/
  badges/
  banners/
  logos/
  mascots/
  scenes/
src/
  app.js
  styles.css
scripts/
  validate-svg.mjs
  render-snapshots.mjs
  check-asset-manifest.mjs
tests/
  fixtures/
  snapshots/
docs/
  contributing/
  superpowers/specs/
asset-manifest.json
package.json
```

The first pass should not introduce a component framework. The gallery can remain a static web application.

## 9. Asset manifest

Add a single manifest as the source of truth for gallery metadata and validation.

Each entry contains:

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

`src/app.js` should consume generated or directly loaded manifest data rather than maintaining a separate hard-coded catalog.

## 10. Quality pipeline

### 10.1 Static validation

The validation script checks:

- valid XML parsing;
- required `viewBox`;
- no external scripts;
- no remote image references;
- unique and prefixed IDs;
- valid ID references;
- title and accessibility metadata;
- reduced-motion support for animated assets;
- no conflicting transform animations on the same selector;
- known file size budgets;
- manifest path integrity;
- absence of misleading "official mascot" claims.

### 10.2 SVG cleanup

Use SVGO with a repository-owned configuration. The configuration must preserve:

- `viewBox`;
- title and description;
- animation styles;
- deliberate IDs;
- CSS classes used by animations.

Cleanup must run in check mode in CI. It must not silently rewrite contributor files during validation.

### 10.3 Rendered snapshots

Use a headless browser to render assets at fixed sizes and selected animation times:

- static frame at 0 milliseconds;
- anticipation or early action frame;
- peak action frame;
- landing or recovery frame.

Snapshots should cover light, dark, and transparent backgrounds for the pilot assets.

The initial implementation may store approved PNG baselines in the repository. CI reports visual diffs as artifacts.

### 10.4 Browser coverage

Primary rendering target:

- Chromium for CI snapshots;
- manual smoke test in Firefox and Safari for release candidates.

SVG behavior must not depend on browser-specific transform defaults.

## 11. Package and project cleanup

Replace Dokion metadata with Vibe SVGs metadata.

Expected package direction:

- name: `vibe-svgs` or an available scoped package name;
- description: open-source animated SVG mascot, badge, and banner library;
- private status decided before publishing;
- scripts for serve, validate, test, snapshot, and format;
- remove Dokion CLI and contract scripts from the SVG project package metadata.

Do not delete unrelated Dokion source files blindly. First inventory whether they were accidentally committed or intentionally included. Removal becomes a separate reviewed change if the files are substantial.

## 12. Documentation and legal presentation

The README must clearly state:

- the project is community-created;
- product names and trademarks belong to their respective owners;
- logos should only be described as official when the exact official artwork and permitted usage are verified;
- mascots are fan-made and are not endorsed by the named companies;
- contributors should avoid deceptive brand claims.

The repository can remain MIT licensed for original code and artwork, but trademark rights are separate from copyright licensing.

## 13. Migration plan

### Phase 1: Foundation and pilot

- repair package metadata;
- add manifest;
- add validation scripts;
- add CI workflow;
- document the visual and motion system;
- rebuild Claude mascot;
- rebuild Codex mascot;
- rebuild Claude jumping;
- rebuild Codex hallucinating.

### Phase 2: Core platform mascots

- rebuild Cursor;
- rebuild Gemini;
- rebuild DeepSeek;
- rebuild Copilot;
- update gallery metadata and previews;
- add snapshots for all standalone mascots.

### Phase 3: Scenes, suites, and badges

- migrate speaking, sleeping, debugging, diving, ninja, and rage scenes;
- rebuild suite banners from approved mascot components;
- clean badge typography and motion;
- remove or archive assets that cannot meet the system.

### Phase 4: Contributor workflow

- contributor design checklist;
- asset template files;
- PR snapshot artifacts;
- documented review criteria;
- release and versioning policy.

## 14. Testing strategy

Tests are grouped by failure type:

### Structural tests

Catch malformed XML, missing attributes, broken references, duplicate IDs, and missing assets.

### Motion contract tests

Inspect CSS rules and reject known patterns such as several animations writing transform on one node.

### Manifest tests

Ensure every public asset has one manifest record and every manifest path exists.

### Snapshot tests

Detect visual changes in silhouette, placement, clipping, and animation keyframes.

### Manual visual review

Required for:

- character balance;
- prop attachment;
- expression quality;
- small-size readability;
- brand resemblance risk;
- physical believability.

Automated tests cannot approve artistic quality by themselves.

## 15. Error handling

Validation output must identify:

- asset path;
- failed rule;
- relevant ID or selector;
- concise repair guidance.

One invalid asset should not prevent the validator from reporting defects in the remaining files. The command exits non-zero after producing the complete report.

Snapshot failures should preserve expected, actual, and diff images as CI artifacts.

## 16. Non-goals

The first rebuild does not include:

- a full JavaScript animation runtime;
- Lottie conversion;
- photoreal 3D rendering;
- a React component package;
- a public badge-generation API;
- replacement of every current asset in one commit;
- claims that community mascots are official company assets.

## 17. Acceptance checklist for each rebuilt mascot

A mascot is accepted only when:

- silhouette is readable at 96 pixels wide;
- limbs visually connect to the body;
- joint pivots match the drawn anatomy;
- held props remain attached;
- lighting direction is consistent;
- no filter clipping appears;
- the shadow matches body movement;
- the static reduced-motion frame is composed correctly;
- IDs are prefixed and valid;
- XML and manifest validation pass;
- all approved snapshots match;
- documentation uses accurate community-artwork language.

## 18. Implementation boundary

The first implementation plan should cover Phase 1 only. Later phases must be planned after the pilot assets demonstrate that the system works in actual rendering and review.
