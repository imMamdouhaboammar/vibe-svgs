import { describe, expect, test } from "bun:test";
import {
  hasCssAnimationSource,
  selectRuntimeAuditAssets,
} from "../scripts/reduced-motion-runtime";
import type { AssetManifest } from "../scripts/svg-contracts";

const entry = (
  id: string,
  animated: boolean,
  contractVersion: 0 | 1,
) => ({
  id,
  path: `svgs/scenes/${id}.svg`,
  category: "scenes",
  type: "scene" as const,
  animated,
  communityArtwork: false,
  contractVersion,
  title: id,
  description: id,
});

describe("reduced-motion runtime audit model", () => {
  test("detects active CSS animation declarations in style blocks", () => {
    expect(hasCssAnimationSource(`
      <svg><style>
        @keyframes bob { to { transform: translateY(-1px) } }
        .actor { animation: bob 1s infinite }
      </style></svg>
    `)).toBe(true);
  });

  test("detects inline CSS animation declarations", () => {
    expect(hasCssAnimationSource(
      '<svg><g style="opacity:1; animation-name:bob; animation-duration:1s" /></svg>',
    )).toBe(true);
  });

  test("does not treat unused keyframes or animation none as active CSS animation", () => {
    expect(hasCssAnimationSource(`
      <svg><style>
        @keyframes unused { to { opacity: .5 } }
        .actor { animation: none !important }
      </style></svg>
    `)).toBe(false);
  });

  test("selects only animated contract-v1 assets", () => {
    const manifest: AssetManifest = {
      version: 1,
      assets: [
        entry("animated-v1", true, 1),
        entry("static-v1", false, 1),
        entry("animated-v0", true, 0),
      ],
    };

    expect(selectRuntimeAuditAssets(manifest).map((asset) => asset.id)).toEqual([
      "animated-v1",
    ]);
  });
});
