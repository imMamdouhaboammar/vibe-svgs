export type SvgSafetyIssue = {
  rule: string;
  message: string;
};

const issue = (rule: string, message: string): SvgSafetyIssue => ({ rule, message });

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

  for (const match of source.matchAll(/(?:href|xlink:href)\s*=\s*["']\s*([^"']+)["']/gi)) {
    const target = (match[1] ?? "").trim();
    if (/^(?:https?:|\/\/)/i.test(target)) {
      issues.push(issue("security.remote-reference", `Remove remote reference: ${target}`));
    } else if (/^javascript:/i.test(target)) {
      issues.push(issue("security.javascript-url", "Remove javascript: references."));
    } else if (/^data:/i.test(target)) {
      issues.push(issue("security.data-url", "Embed reusable SVG resources as local markup, not data URLs."));
    }
  }

  for (const match of source.matchAll(/url\(\s*["']?([^)'"\s]+)["']?\s*\)/gi)) {
    const target = (match[1] ?? "").trim();
    if (target.startsWith("#")) continue;
    if (/^(?:https?:|\/\/|data:|javascript:)/i.test(target)) {
      issues.push(issue("security.css-url", `Remove non-local CSS resource: ${target}`));
    }
  }

  return issues;
}
