export type SvgSafetyIssue = {
  rule: string;
  message: string;
};

const issue = (rule: string, message: string): SvgSafetyIssue => ({ rule, message });

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#([0-9]+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&");
}

/**
 * Reject active or remotely-resolved content in SVGs intended for inline reuse.
 * This is deliberately conservative: library assets should be self-contained.
 */
export function validateSvgSafety(source: string): SvgSafetyIssue[] {
  const issues: SvgSafetyIssue[] = [];

  if (/<script\b/i.test(source)) {
    issues.push(issue("security.script", "Remove script elements."));
  }

  if (/<foreignObject\b/i.test(source)) {
    issues.push(issue("security.foreign-object", "Remove foreignObject content from reusable assets."));
  }

  if (/\son[a-z][\w:-]*\s*=/i.test(source)) {
    issues.push(issue("security.event-handler", "Remove inline event-handler attributes."));
  }

  // Detect and reject CSS @import rules (both @import url(...) and @import "...")
  for (const match of source.matchAll(/@import\s+(?:url\(\s*(?:"([^"]*)"|'([^']*)'|([^)'"\s]+))\s*\)|(?:"([^"]*)"|'([^']*)'))/gi)) {
    const rawTarget = match[1] ?? match[2] ?? match[3] ?? match[4] ?? match[5] ?? "";
    const target = decodeXmlEntities(rawTarget).trim();
    if (target) {
      issues.push(issue("security.css-import", `Remove external stylesheet import: ${target}`));
    }
  }

  // Validate href / xlink:href targets (quoted and unquoted, entity-decoded)
  for (const match of source.matchAll(/(?:href|xlink:href)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi)) {
    const rawTarget = match[1] ?? match[2] ?? match[3] ?? "";
    const target = decodeXmlEntities(rawTarget).trim();
    if (!target) continue;

    if (/^javascript:/i.test(target)) {
      issues.push(issue("security.javascript-url", "Remove javascript: references."));
    } else if (/^data:/i.test(target)) {
      issues.push(issue("security.data-url", "Embed reusable SVG resources as local markup, not data URLs."));
    } else if (!target.startsWith("#")) {
      issues.push(issue("security.remote-reference", `Remove non-fragment reference target: ${target}`));
    }
  }

  // Validate CSS url(...) references
  for (const match of source.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)'"\s]+))\s*\)/gi)) {
    const rawTarget = match[1] ?? match[2] ?? match[3] ?? "";
    const target = decodeXmlEntities(rawTarget).trim();
    if (!target) continue;
    if (target.startsWith("#")) continue;

    issues.push(issue("security.css-url", `Remove non-local CSS resource: ${target}`));
  }

  return issues;
}
