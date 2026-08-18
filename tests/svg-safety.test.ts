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

  test("rejects relative href targets and unquoted targets", () => {
    expect(rules(`<svg><image href="/tracker.svg"/><use href=sub/asset.svg#x/></svg>`)).toEqual(
      expect.arrayContaining(["security.remote-reference"]),
    );
  });

  test("decodes XML entity references in href attributes", () => {
    expect(rules(`<svg><a href="java&#x73;cript:alert(1)"/><image href="&#x68;ttps://evil.com/leak.png"/></svg>`)).toEqual(
      expect.arrayContaining(["security.javascript-url", "security.remote-reference"]),
    );
  });

  test("rejects CSS @import rules in both url() and string forms", () => {
    expect(rules(`<svg><style>@import url('https://fonts.example.com/css');</style></svg>`)).toEqual(
      expect.arrayContaining(["security.css-import"]),
    );
    expect(rules(`<svg><style>@import "https://fonts.example.com/css";</style></svg>`)).toEqual(
      expect.arrayContaining(["security.css-import"]),
    );
  });

  test("rejects relative CSS url references", () => {
    expect(rules(`<svg><rect style="fill:url(/tracker.svg)"/></svg>`)).toEqual(
      expect.arrayContaining(["security.css-url"]),
    );
  });
});

