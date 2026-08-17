# SVG Quality Contract

Every new or migrated asset must pass `bun run check` and receive a visual review.

## Artwork

- Use rounded, readable silhouettes that remain clear around 96 to 160 pixels wide.
- Keep one primary light source from the upper left.
- Connect limbs to the body with visible overlap. Do not leave accidental gaps at shoulders, hips, wrists, or ankles.
- Attach held objects inside the hand or limb group that controls their motion.
- Use gradients to describe volume, not as decoration. Two or three deliberate stops are usually enough.
- Keep filters restrained and size their regions to avoid clipping.

## Semantic depth groups

Use a structure that makes depth and motion ownership explicit:

```text
scene
  shadow
  character-position
    character-rotation
      character-squash
        rear-limbs
        body
        face
        front-limbs
        props
        highlights
  effects
```

Not every static asset needs every group, but the order should remain understandable.

## Motion

- One animated node owns one transform animation.
- Split translation, rotation, squash, limbs, props, and shadow behavior across nested groups.
- Set `transform-box` and an explicit `transform-origin` for every transform animation.
- Add anticipation before jumps or strikes.
- Reduce and soften the contact shadow as the body rises.
- Add a brief landing compression before returning to idle.
- Avoid several simultaneous high-amplitude loops.
- Add a static, intentionally composed reduced-motion frame.

Every animated SVG must include:

```css
@media (prefers-reduced-motion: reduce) {
  [data-animated] { animation: none !important; }
}
```

## Accessibility

Meaningful reusable assets must include:

```xml
<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 120 120"
  role="img"
  aria-labelledby="asset-title asset-desc"
>
  <title id="asset-title">Concise title</title>
  <desc id="asset-desc">Useful visual description.</desc>
</svg>
```

Decorative use can set `aria-hidden="true"` at the embedding site.

## IDs and references

- Prefix every reusable ID with the filename stem.
- Do not use generic names such as `gradient`, `shadow`, or `clip`.
- Keep every `url(#...)`, `href="#..."`, and ARIA reference resolvable inside the file.
- When raw SVG markup is inserted more than once in one document, call `namespaceSvg(source, instanceId)` for each instance.

Example IDs for `claude-jumping.svg`:

```text
claude-jumping-title
claude-jumping-body-gradient
claude-jumping-soft-shadow
```

## Security and portability

Reusable assets may not include:

- `<script>` elements;
- remote images or resources;
- browser-specific transform assumptions;
- misleading claims that community artwork is an official mascot.

The browser visual QA runner also blocks HTTP and HTTPS requests while rendering. A blocked request fails the capture instead of silently depending on a remote font, image, stylesheet, or other resource.

Avoid live `<text>` where exact typography matters. Prefer vector geometry for fixed badges, icons, and visual equations.

## File budgets

Initial budgets:

- simple logo: under 15 KB;
- badge: under 25 KB;
- standalone mascot: under 70 KB;
- animated scene or suite: under 140 KB.

A justified exception must be documented during review.

## Validation

Run the contract and static checks:

```bash
bun run check
```

Run a bounded browser smoke review covering a mascot, scene, banner, and badge:

```bash
bun run visual:smoke
```

Run the full migrated-asset snapshot matrix when changing shared rendering behavior or several visual families:

```bash
bun run snapshots
```

Browser snapshots use each SVG's native `viewBox` aspect ratio instead of forcing a square canvas. Animated assets are captured in both normal and `prefers-reduced-motion: reduce` modes. Static assets are captured once to avoid duplicate work.

Each snapshot directory includes `visual-report.json`. The report records the source asset path, requested width, actual viewport dimensions, background, motion profile, screenshot filename, and blocked-request diagnostics. Screenshot paths are stored as relative filenames so CI artifacts remain portable.

The validator should report the asset path, rule, and a concise repair instruction. Do not bypass a failing contract by changing the test unless the design specification itself has changed.

## Human visual review

Automation cannot approve artistic quality. Review the generated PNGs, not only the source markup or a passing test run.

Review at minimum:

- balance and silhouette;
- connected anatomy;
- correct joint pivots;
- prop attachment;
- shadow timing;
- clipping throughout the loop;
- readability on light, dark, and transparent backgrounds;
- native aspect-ratio composition for scenes and banners;
- normal and reduced-motion captures for animated assets;
- resemblance and trademark risk;
- static reduced-motion composition.

The `SVG Quality` GitHub Actions workflow uploads the representative smoke captures as the `visual-smoke` artifact for review.
