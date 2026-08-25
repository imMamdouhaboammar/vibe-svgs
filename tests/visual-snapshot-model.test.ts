import { describe, expect, test } from "bun:test";
import {
  assertSafeSvgForBrowser,
  buildCaptureProfiles,
  deriveSnapshotViewport,
  parseSvgViewBox,
} from "../scripts/visual-snapshots";

describe("visual snapshot geometry", () => {
  test("parses a valid SVG viewBox", () => {
    expect(parseSvgViewBox('<svg viewBox="0 0 1200 400"></svg>')).toEqual({
      minX: 0,
      minY: 0,
      width: 1200,
      height: 400,
    });
  });

  test("preserves a banner's native aspect ratio", () => {
    expect(
      deriveSnapshotViewport('<svg viewBox="0 0 1200 400"></svg>', 300),
    ).toEqual({ width: 300, height: 100 });
  });

  test("keeps square assets square", () => {
    expect(
      deriveSnapshotViewport('<svg viewBox="0 0 256 256"></svg>', 160),
    ).toEqual({ width: 160, height: 160 });
  });

  test("rejects missing, malformed, and non-positive viewBoxes", () => {
    expect(() => parseSvgViewBox("<svg></svg>")).toThrow("viewBox");
    expect(() => parseSvgViewBox('<svg viewBox="0 0 nope 100"></svg>')).toThrow(
      "viewBox",
    );
    expect(() => parseSvgViewBox('<svg viewBox="0 0 0 100"></svg>')).toThrow(
      "viewBox",
    );
  });
});

describe("visual capture profiles", () => {
  test("uses normal and reduced-motion profiles for animated assets", () => {
    expect(buildCaptureProfiles(true, ["normal", "reduce"])).toEqual([
      "normal",
      "reduce",
    ]);
  });

  test("does not duplicate static captures for reduced motion", () => {
    expect(buildCaptureProfiles(false, ["normal", "reduce"])).toEqual([
      "normal",
    ]);
  });
});

describe("browser render safety", () => {
  test("accepts ordinary declarative SVG markup", () => {
    expect(() =>
      assertSafeSvgForBrowser(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4"/></svg>',
      ),
    ).not.toThrow();
  });

  test("rejects scripts and inline event handlers before Chromium sees them", () => {
    expect(() =>
      assertSafeSvgForBrowser(
        '<svg viewBox="0 0 10 10"><script>alert(1)</script></svg>',
      ),
    ).toThrow("script");
    expect(() =>
      assertSafeSvgForBrowser(
        '<svg viewBox="0 0 10 10"><circle onload="alert(1)"/></svg>',
      ),
    ).toThrow("event handler");
  });

  test("enforces the full reusable SVG safety contract before browser rendering", () => {
    const unsafe = [
      '<svg viewBox="0 0 10 10"><foreignObject><div>html</div></foreignObject></svg>',
      '<svg viewBox="0 0 10 10"><image href="data:image/png;base64,AA"/></svg>',
      '<svg viewBox="0 0 10 10"><style>@import "https://fonts.example.com/css";</style></svg>',
      '<svg viewBox="0 0 10 10"><rect style="fill:url(/tracker.svg)"/></svg>',
      '<svg viewBox="0 0 10 10"><use href="sub/asset.svg#shape"/></svg>',
    ];

    for (const source of unsafe) {
      expect(() => assertSafeSvgForBrowser(source)).toThrow("SVG browser render safety rejected");
    }
  });

  test("does not describe embedded data URLs as external requests", () => {
    try {
      assertSafeSvgForBrowser(
        '<svg viewBox="0 0 10 10"><image href="data:image/png;base64,AA"/></svg>',
      );
      throw new Error("expected data URL safety rejection");
    } catch (error) {
      expect(String(error)).toContain("security.data-url");
      expect(String(error)).not.toContain("blocked external request");
    }
  });
});
