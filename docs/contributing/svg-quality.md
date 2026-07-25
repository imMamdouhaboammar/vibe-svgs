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

Avoid live `<text>` where exact typography matters. Prefer vector geometry for fixed badges, icons, and visual equations.

## File budgets

Initial budgets:

- simple logo: under 15 KB;
- badge: under 25 KB;
- standalone mascot: under 70 KB;
- animated scene or suite: under 140 KB.

A justified exception must be documented during review.

## Validation

Run:

```bash
bun run check
```

The validator should report the asset path, rule, and a concise repair instruction. Do not bypass a failing contract by changing the test unless the design specification itself has changed.

## Human visual review

Automation cannot approve artistic quality. Review at minimum:

- balance and silhouette;
- connected anatomy;
- correct joint pivots;
- prop attachment;
- shadow timing;
- clipping throughout the loop;
- readability on light, dark, and transparent backgrounds;
- resemblance and trademark risk;
- static reduced-motion composition.
