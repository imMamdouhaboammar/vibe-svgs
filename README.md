<p align="center">
  <img src="svgs/banners/banner-pills.svg" alt="AI coding tools banner" width="100%">
</p>

<h1 align="center">Vibe SVGs</h1>

<p align="center">
  A community-created collection of animated SVG mascots, scenes, badges, and banners for developer documentation and project pages.
</p>

<p align="center">
  <img src="svgs/badges/vibe-certified.svg" alt="Vibe Certified">
  <img src="svgs/badges/zero-human-code.svg" alt="Zero Human Code">
  <img src="svgs/badges/prompt-and-pray.svg" alt="Prompt and Pray">
  <img src="svgs/badges/ai-reviewer-approved.svg" alt="AI Reviewer Approved">
</p>

## Phase 1 rebuild

The first quality-focused rebuild introduces a shared rounded 2.5D visual system and an automated SVG contract.

Rebuilt pilot assets:

| Asset | Preview | Raw Markdown |
| :--- | :---: | :--- |
| Claude Community Mascot | <img src="svgs/mascots/claude-mascot.svg" width="150" alt="Claude community mascot"> | `![Claude community mascot](https://raw.githubusercontent.com/imMamdouhaboammar/vibe-svgs/main/svgs/mascots/claude-mascot.svg)` |
| Claude Jumping | <img src="svgs/mascots/claude-jumping.svg" width="150" alt="Claude jumping community mascot"> | `![Claude jumping](https://raw.githubusercontent.com/imMamdouhaboammar/vibe-svgs/main/svgs/mascots/claude-jumping.svg)` |
| Codex Community Mascot | <img src="svgs/mascots/codex-mascot.svg" width="150" alt="Codex community mascot"> | `![Codex community mascot](https://raw.githubusercontent.com/imMamdouhaboammar/vibe-svgs/main/svgs/mascots/codex-mascot.svg)` |
| Codex Hallucination Scene | <img src="svgs/mascots/codex-hallucinating.svg" width="210" alt="Codex hallucination scene"> | `![Codex hallucination](https://raw.githubusercontent.com/imMamdouhaboammar/vibe-svgs/main/svgs/mascots/codex-hallucinating.svg)` |

The remaining assets are still available under their stable paths and will migrate in later phases.

## What changed in the pilot

The pilot SVGs now use:

- connected rounded limbs and deliberate joint overlap;
- one upper-left lighting direction;
- semantic depth groups for rear limbs, body, face, front limbs, props, and effects;
- nested transform ownership so animations do not overwrite each other;
- contact shadows that respond to jump height and landing compression;
- filename-prefixed IDs;
- `<title>`, `<desc>`, `role="img"`, and `aria-labelledby`;
- `prefers-reduced-motion` fallbacks;
- a namespacing helper for repeated inline SVG use.

## Browse the collection

### Claude

- [`claude-mascot.svg`](svgs/mascots/claude-mascot.svg)
- [`claude-jumping.svg`](svgs/mascots/claude-jumping.svg)
- [`claude-sleeping.svg`](svgs/mascots/claude-sleeping.svg)
- [`claude-debugging.svg`](svgs/mascots/claude-debugging.svg)
- [`claude-speaking.svg`](svgs/mascots/claude-speaking.svg)

### Codex and OpenAI-related artwork

- [`codex-mascot.svg`](svgs/mascots/codex-mascot.svg)
- [`codex-hallucinating.svg`](svgs/mascots/codex-hallucinating.svg)
- [`codex-jumping.svg`](svgs/mascots/codex-jumping.svg)
- [`codex-speaking.svg`](svgs/mascots/codex-speaking.svg)

### Other platform-inspired community artwork

- [`cursor-mascot.svg`](svgs/mascots/cursor-mascot.svg)
- [`gemini-mascot.svg`](svgs/mascots/gemini-mascot.svg)
- [`deepseek-mascot.svg`](svgs/mascots/deepseek-mascot.svg)
- [`copilot-mascot.svg`](svgs/mascots/copilot-mascot.svg)

### Banners and badges

- [`svgs/banners`](svgs/banners)
- [`svgs/badges`](svgs/badges)

The complete catalog and migration status live in [`asset-manifest.json`](asset-manifest.json).

## Local development

Requires Bun 1.3.14 or later.

```bash
bun run serve
```

Run the contract suite and repository validator:

```bash
bun run check
```

The validator reports all detected issues before exiting, including broken references, duplicate IDs, unprefixed reusable IDs, missing accessibility metadata, unsafe external content, missing reduced-motion handling, and competing transform animations.

## Inline use without ID collisions

Referencing an SVG through `<img>` isolates its internal IDs. When inserting the raw SVG markup directly into HTML, use `namespaceSvg()` from `scripts/svg-contracts.ts` for every instance:

```ts
import { namespaceSvg } from "./scripts/svg-contracts";

const first = namespaceSvg(svgSource, "card-one");
const second = namespaceSvg(svgSource, "card-two");
```

## Contributing

Read [`docs/contributing/svg-quality.md`](docs/contributing/svg-quality.md) before changing or adding artwork. New or migrated assets must pass `bun run check`.

## Trademark and endorsement notice

This repository contains original community artwork inspired by developer tools and AI products. Product names, logos, and trademarks belong to their respective owners.

Fan-made mascots and scenes in this repository are not endorsed by Anthropic, OpenAI, Cursor, Google, DeepSeek, GitHub, or other referenced companies. The MIT license applies to original repository code and artwork; it does not grant rights to third-party trademarks.

## License

Code and original artwork are released under the [MIT License](LICENSE).
