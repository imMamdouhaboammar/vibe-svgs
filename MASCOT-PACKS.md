# Mascot Animation Packs

The collection contains 66 animated SVGs generated from the supplied pixel mascot artwork.

- 61 independent scenes with component-aware actor and prop motion
- 5 hybrid sprite stories built from 15 supplied artboard frames
- 8 packs: Reactions, Work, Systems, Security, Growth, Celebration, Daily, and Sprite Stories

Every output is a standalone SVG. The browser does not need Anime.js or another runtime dependency to display the animation.

## Pack structure

```text
svgs/packs/
  reactions/
  work/
  systems/
  security/
  growth/
  celebration/
  daily/
  sprite-stories/
```

`mascot-packs-manifest.json` contains the 66 pack entries. The same entries are synchronized into `asset-manifest.json` for the web gallery.

## Source preservation

The supplied source artwork remains under `svgs/mascots/`. Generation reads those files but does not rewrite them.

`references/mascot-motion/source-inventory.json` stores the SHA-256 digest of every supplied SVG and MP4 reference. The source-preservation test compares current bytes with that inventory. SVGO skips the supplied source paths and processes only maintained or generated SVG files.

## Motion model

Independent scenes identify the terracotta actor assembly and nearby facial details while preserving the original pixel order. Shared viewBox-space pivots move the actor as one rigid assembly. Props receive static, counter, pulse, orbit, or secondary motion according to the story registry.

The motion presets cover:

- anticipation and committed movement
- sampled jump arcs
- contact squash and spring recovery
- effort holds and load response
- harmonic sway and breathing
- attached prop counter-motion
- contact shadows linked to actor height

Hybrid sprite stories preserve three complete supplied frames. Frame holds are intentionally unequal so effort, failure, and payoff poses remain readable.

## Generate the packs

```bash
bun run generate:mascot-packs
bun run svgo:write
bun run sync:mascot-packs
```

Generate only one independent pack:

```bash
bun svg-mascot-animator/scripts/generate-mascot-packs.mjs --pack celebration
```

Generate only the five sprite stories:

```bash
bun svg-mascot-animator/scripts/generate-mascot-packs.mjs --sprite
```

## Verify motion and files

```bash
bun test tests/generated-mascot-packs.test.ts
bun test tests/sprite-mascot-stories.test.ts
bun test tests/mascot-pack-manifest.test.ts
bun run motion:bounds:packs
bun run svgo:check
bun run typecheck
```

The motion-bounds audit samples every animation over its loop, checks actor movement, and rejects moving elements that cross the SVG frame.

## Use an SVG in Markdown

```markdown
![Lifting Heavy Barbell](https://raw.githubusercontent.com/imMamdouhaboammar/vibe-svgs/main/svgs/packs/daily/lifting-heavy-barbell.svg)
```

The same raw URL can be used in HTML image elements, documentation sites, or project pages that allow animated SVG images.

## Reduced motion

Every generated file includes a `prefers-reduced-motion` fallback. Independent scenes stop in their neutral pose. Sprite stories stop on the third supplied payoff frame.

## Add a new supplied source

1. Place the source SVG under `svgs/mascots/`.
2. Add its digest to the supplied source inventory.
3. Add one complete story entry to `svg-mascot-animator/config/mascot-pack-stories.json`.
4. Run the generator and manifest synchronization.
5. Run source, contract, bounds, and visual tests before committing.
