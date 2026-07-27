# Claude Stories Motion Pack Design

Date: 2026-07-27
Status: Approved for implementation
Owner: Mamdouh Aboammar

## Goal

Add eight animated Claude community-mascot story SVGs that expand the library beyond idle poses into recognizable developer-workflow moments.

## Story set

1. `claude-orchestrating.svg`: Claude conducts three task cards moving through an agent workflow.
2. `claude-context-overflow.svg`: Claude balances context cards while one card slips from the stack.
3. `claude-refactoring.svg`: Claude pulls a tangled code line through a clean modular frame.
4. `claude-pair-programming.svg`: Claude types beside a small terminal companion with alternating cursor activity.
5. `claude-deep-thinking.svg`: Claude pauses while reasoning tokens orbit and converge into one insight spark.
6. `claude-shipping.svg`: Claude launches a small deploy rocket with anticipation, ignition, lift, and recovery.
7. `claude-code-review.svg`: Claude scans a diff panel and applies an animated approval check.
8. `claude-coffee-break.svg`: Claude lifts a warm cup while steam curls and the body relaxes.

## Visual direction

The pack follows the repository 2.5D community-mascot system:

- rounded terracotta body with warm upper-left lighting;
- connected limbs with visible shoulder and hip overlap;
- restrained two-to-three-stop gradients;
- soft contact shadows that react to body movement;
- readable silhouettes at 96 to 160 pixels;
- no official-mascot language;
- no remote resources, scripts, or live text.

Each story uses `viewBox="0 0 160 140"` to provide enough room for props and effects while keeping a compact README footprint.

## Motion architecture

Every story splits transform ownership across nested groups:

```text
shadow
character-position
  character-rotation
    body
    face
    limb groups
    prop groups
effects
```

One animated node owns one transform animation. No selector runs multiple transform-writing animations. Scene loops remain between 2.4 and 4.8 seconds, except the shipping launch cycle, which may run at 2.2 seconds.

Primary motion by scene:

- Orchestrating: arm-conducting arc and card routing.
- Context Overflow: stack sway and one controlled falling card.
- Refactoring: code-knot pulse and line draw-through.
- Pair Programming: alternating hand taps and terminal cursor blink.
- Deep Thinking: token orbit and convergence.
- Shipping: body anticipation, rocket lift, flame pulse, shadow response.
- Code Review: scanning lens travel and check-stamp compression.
- Coffee Break: cup lift, sip pause, steam drift, relaxed breathing.

All animated assets include a static, intentionally composed reduced-motion state.

## Engineering contract

Each file must:

- live in `svgs/scenes/`;
- use a filename-derived ID prefix;
- include `xmlns`, `viewBox`, `role="img"`, `<title>`, `<desc>`, and `aria-labelledby`;
- use only local SVG resources;
- include `@media (prefers-reduced-motion: reduce)`;
- remain below the 140 KB animated-scene budget;
- pass `validateSvgSource` and manifest validation;
- be listed in `asset-manifest.json` with `type: "scene"`, `category: "claude"`, and `contractVersion: 1`.

## Gallery integration

README gains a dedicated `Claude Stories` table with previews and raw Markdown links. The existing Claude Family table remains unchanged so standalone mascot assets and narrative story scenes stay distinct.

## Test coverage

Add all eight story paths to the SVG contract test suite and add assertions that:

- exactly eight `claude-*` files from `svgs/scenes/` are registered in the manifest;
- every registered story has category `claude`, type `scene`, `animated: true`, and contract version `1`;
- the README includes the Claude Stories section and every filename.

## Acceptance criteria

The pack is complete when all eight SVGs exist, pass automated checks, render without clipping at their full animation extremes, appear in the manifest and README, and preserve meaningful static frames when reduced motion is enabled.
