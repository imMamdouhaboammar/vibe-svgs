# Mascot Animation Packs Design

## Goal

Turn every newly supplied pixel-art mascot source in `svgs/mascots` into a reusable animated asset, grouped into clear packs, while keeping the original artwork unchanged and keeping every moving element inside its SVG frame.

## Current inventory

The repository contains 96 mascot SVG files.

- 20 existing animated vector mascots already follow the repository contract.
- 61 newly supplied static pixel-art scenes use a `2000 2000` viewBox and are built entirely from rectangles.
- 15 `artboard-*` files form five groups of three alternate illustrations.
- Two MP4 references show the intended motion language: short readable stories, pixel-frame swaps, body weight, anticipation, impact, prop attachment, and unequal frame holds.

## Reference findings

The Codrops reverse-engineering article describes three useful animation tracks:

1. Continuous transform animation for looking, leaning, jumping, and walking.
2. Sprite-frame playback for poses that cannot be interpolated cleanly.
3. Hybrid animation where sprite frames handle shape changes and transforms handle body sway, attachment, and secondary motion.

The supplied MP4 references reinforce the same rules:

- The character performs the action. Props do not carry the scene alone.
- Anticipation happens before committed movement.
- Horizontal and vertical motion use separate timing.
- Impact has a short squash followed by spring recovery.
- Attached props counter-move so they remain visually connected.
- Some frames hold longer at effort, contact, or payoff moments.
- The story stays readable at small sizes and within a fixed frame.

## Approaches considered

### Generic wrapper per source

Animate the complete source artwork as one object.

Pros: quick, small implementation surface, covers every file.

Cons: mascot and props move together, weak acting, repeated motion, and poor physical attachment.

### Manual animation per source

Hand-rig every rectangle and create a custom timeline for all 76 sources.

Pros: highest control.

Cons: too slow, inconsistent, difficult to maintain, and not suitable for future additions.

### Hybrid component-aware pack engine

Parse each pixel source, identify the terracotta actor rectangles and nearby facial details, keep original DOM order, apply shared transforms to actor rectangles around one viewBox-space pivot, and select story presets from filename metadata. Combine the five artboard triplets as sprite-frame stories with unequal hold times.

Pros: covers the full library, the mascot itself moves, stories differ by domain, future sources use the same pipeline, and the output stays self-contained.

Cons: source classification needs tests and conservative fallbacks.

This is the selected approach.

## Output structure

```text
svgs/
  mascots/                  original supplied source SVGs
  packs/
    reactions/
    work/
    systems/
    security/
    growth/
    celebration/
    daily/
    sprite-stories/
mascot-packs-manifest.json
```

The 61 independent static sources produce 61 standalone animated SVGs. The 15 artboard sources produce five sprite-story SVGs. Total initial pack output: 66 animated SVGs.

## Pack taxonomy

### Reactions

Anger, sadness, confusion, failure, critical errors, and pressure. Motion uses recoil, jitter, slump, breathing, sparks, and short alert pulses.

### Work

Coding, documentation, review, pair programming, tracking, and multi-window workflows. Motion uses focus lean, typing recoil, scanning, cursor rhythm, and attached-tool lag.

### Systems

API, data, servers, monitoring, infrastructure, and refresh states. Motion uses push, scan, rack pulse, progress travel, and status feedback.

### Security

Padlocks, malware detection, stealth, and recovery. Motion uses guarded stance, scan sweeps, shield response, and restrained impact.

### Growth

Ideas, loops, leaves, trees, mushrooms, trends, and visualized data. Motion uses harmonic sway, orbit, staged growth, and spring arrival.

### Celebration

Success, milestones, checkmarks, rockets, and happy reactions. Motion uses anticipation, sampled jump arcs, contact squash, burst timing, and payoff holds.

### Daily

Sleep, coffee, baking, lifting, and tool repair. Motion uses breathing, steam drift, effort holds, load response, and mechanical follow-through.

### Sprite stories

Five artboard triplets become hybrid sprite animations. Frame opacity changes use discrete timing. A shared body rig adds sway, lift, or recoil without morphing the pixel drawings.

## Engine architecture

### Source inventory

`svg-mascot-animator/scripts/inventory-pixel-sources.mjs` reads static sources and reports geometry, colors, actor bounds, margins, and classification.

### Actor classifier

The supplied pixel sources all contain `#d97757`. Those rectangles define the actor set. Nearby dark, white, and peach rectangles inside an expanded actor bound are included as face and body details. Original source order remains unchanged. Each actor rectangle receives the same animation class and the same viewBox-space transform origin, so the actor moves as one rigid pixel assembly without regrouping the SVG.

### Story registry

`svg-mascot-animator/config/mascot-pack-stories.json` maps every source file to:

- pack
- motion preset
- prop selection mode
- title
- description
- loop duration

The generator fails when any source is unclassified.

### Physics sampler

Anime.js 4.5.0 is installed with Bun. The existing `bake.mjs` samples Anime.js easing and spring solvers. Ballistic movement uses sampled parabolas with linear interpolation. Pendulum and breathing motion use sinusoidal timing. Contact shadows read from the same height samples as the actor.

### Static generator

`svg-mascot-animator/scripts/generate-mascot-packs.mjs` produces standalone SVG files with no external references and no JavaScript. It adds accessibility metadata, namespaced keyframes, dark-safe neutral variables, reduced-motion payoff poses, actor motion, optional prop motion, and secondary effects.

### Sprite generator

The same generator combines each artboard triplet into one SVG. Each full frame stays intact. Discrete frame visibility uses unequal hold times, while an outer transform rig handles movement shared by all frames.

### Bounds and contract checks

Generated outputs are registered in `mascot-packs-manifest.json` and the main asset manifest. Tests verify:

- all 76 static sources are accounted for
- exactly 66 outputs are generated
- actor rectangles exist and move in every independent scene
- every sprite story contains three source frames
- no moving element crosses the viewBox during sampled playback
- no duplicate IDs or transform-owner conflicts exist
- every file has title, description, intrinsic size, reduced-motion fallback, and no external references

## Motion safety

The generator computes actor bounds and available margins before choosing amplitude. Movement values are clamped to safe ranges. Rotation and scale stay conservative for large pixel silhouettes. `overflow="hidden"` is an additional rendering guard, not a substitute for bounds tests.

For each actor:

- translations use available left, right, and top margins
- jumps use no more than 35 percent of top margin
- rotations stay between 1.5 and 4 degrees
- anticipation squash stays above 0.80 vertical scale
- contact squash stays above 0.70 vertical scale
- recovery uses a sampled spring and settles before the loop restarts

## Gallery and documentation

The gallery gains a `Mascot Packs` category and displays pack names in descriptions. README documentation explains source preservation, pack directories, generation commands, and how to use raw SVG links.

## Commit policy

Every independently tested unit is committed and pushed to `main` immediately. No broad `git add -A` is used while supplied untracked sources are being incorporated.

## Success criteria

- Anime.js is pinned and verified through Bun.
- All supplied static sources are committed without altering their artwork.
- 66 animated pack assets are generated and registered.
- Every generated asset moves the actor itself.
- All generated assets remain inside frame throughout playback.
- Full tests, SVG validation, TypeScript, SVGO, visual regression, and GitHub Actions pass.
