import { describe, expect, test } from "bun:test";
import { validateSvgSafety } from "../scripts/svg-safety";

const rules = (source: string) => validateSvgSafety(source).map((entry) => entry.rule);

describe("reusable SVG safety", () => {
  test("accepts local fragment references", () => {
    expect(validateSvgSafety(`<svg><defs><linearGradient id="g"/></defs><rect fill="url(#g)"/><use href="#shape"/></svg>`)).toEqual([]);
  });

  test("rejects executable content", () => {
    expect(rules(`<svg onload="run()"><script>alert(1)</script><foreignObject><div/></foreignObject></svg>`)).toEqual(
      expect.arrayContaining(["security.script", "security.foreign-object", "security.event-handler"]),
    );
  });

  test("rejects javascript, data and remote href targets", () => {
    expect(rules(`<svg><a href="javascript:alert(1)"/><image href="data:image/png;base64,AA"/><use href="https://example.com/a.svg#x"/></svg>`)).toEqual(
      expect.arrayContaining(["security.javascript-url", "security.data-url", "security.remote-reference"]),
    );
  });

  test("rejects protocol-relative and CSS remote resources", () => {
    expect(rules(`<svg><image href="//cdn.example.com/a.svg"/><rect style="fill:url(https://example.com/a.svg)"/></svg>`)).toEqual(
      expect.arrayContaining(["security.remote-reference", "security.css-url"]),
    );
  });
});
