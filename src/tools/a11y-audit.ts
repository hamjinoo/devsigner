import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { parseColor, contrastRatio, type RGB } from "../utils/color-utils.js";
import { detectFramework, type Framework } from "../parsers/framework-detector.js";
import { parseCSSValue, toPx } from "../utils/css-value-parser.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type WcagLevel = "A" | "AA" | "AAA";
type Severity = "error" | "warning" | "info";

interface A11yIssue {
  category: string;
  severity: Severity;
  wcagCriterion: string;
  description: string;
  element: string;
  suggestion: string;
}

interface CategoryResult {
  name: string;
  passed: boolean;
  issueCount: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Truncate a snippet for display. */
function snippet(el: string, max = 120): string {
  const s = el.replace(/\s+/g, " ").trim();
  return s.length > max ? s.slice(0, max) + "..." : s;
}

/**
 * Find all HTML-like tag occurrences matching a regex.
 * Returns the full match strings.
 */
function findTags(code: string, tagRegex: RegExp): string[] {
  const results: string[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(tagRegex.source, tagRegex.flags.includes("g") ? tagRegex.flags : tagRegex.flags + "g");
  while ((m = re.exec(code)) !== null) {
    results.push(m[0]);
  }
  return results;
}

/** Normalise an attribute name for the detected framework. */
function attr(name: string, fw: Framework): string[] {
  switch (name) {
    case "class":
      if (fw === "react") return ["className"];
      return ["class", ":class"];
    case "for":
      if (fw === "react") return ["htmlFor"];
      return ["for"];
    case "onclick":
      if (fw === "react") return ["onClick"];
      if (fw === "vue") return ["@click", "v-on:click"];
      if (fw === "svelte") return ["on:click"];
      return ["onclick"];
    case "onkeydown":
      if (fw === "react") return ["onKeyDown", "onKeyUp", "onKeyPress"];
      if (fw === "vue") return ["@keydown", "@keyup", "@keypress", "v-on:keydown", "v-on:keyup"];
      if (fw === "svelte") return ["on:keydown", "on:keyup", "on:keypress"];
      return ["onkeydown", "onkeyup", "onkeypress"];
    default:
      return [name];
  }
}

function hasAttr(tag: string, attrName: string): boolean {
  const escaped = attrName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}(?:\\s*=|\\s|>|\\/)`, "i").test(tag);
}

function hasAnyAttr(tag: string, names: string[]): boolean {
  return names.some((n) => hasAttr(tag, n));
}

function getAttrValue(tag: string, attrName: string): string | null {
  const escaped = attrName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`${escaped}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|\\{([^}]*)\\})`, "i");
  const m = tag.match(re);
  if (!m) return null;
  return m[1] ?? m[2] ?? m[3] ?? null;
}

function getTagName(tag: string): string {
  const m = tag.match(/^<\/?([a-zA-Z][a-zA-Z0-9.-]*)/);
  return m ? m[1].toLowerCase() : "";
}

const INTERACTIVE_TAGS = new Set(["button", "a", "input", "select", "textarea", "details", "summary"]);

// ---------------------------------------------------------------------------
// 1. Color Contrast
// ---------------------------------------------------------------------------

function checkColorContrast(code: string, level: WcagLevel): A11yIssue[] {
  const issues: A11yIssue[] = [];

  // Extract inline style color/background pairs
  const colorPairs: { fg: string; bg: string; context: string }[] = [];

  // Look for style attributes with color + background
  const styleRegex = /style\s*=\s*(?:"([^"]*)"|'([^']*)'|\{(?:\{([^}]*)\}|([^}]*))\})/gi;
  let sm: RegExpExecArray | null;
  while ((sm = styleRegex.exec(code)) !== null) {
    const styleStr = sm[1] ?? sm[2] ?? sm[3] ?? sm[4] ?? "";
    const colorMatch = styleStr.match(/(?:^|;|\s|,)color\s*:\s*['"]?([^;,"']+)/i);
    const bgMatch = styleStr.match(/background(?:-color)?\s*:\s*['"]?([^;,"']+)/i);
    if (colorMatch && bgMatch) {
      colorPairs.push({
        fg: colorMatch[1].trim(),
        bg: bgMatch[1].trim(),
        context: snippet(sm[0]),
      });
    }
  }

  // Also look for CSS rule blocks
  const cssBlockRegex = /\{([^}]*color\s*:[^}]*background(?:-color)?\s*:[^}]*|[^}]*background(?:-color)?\s*:[^}]*color\s*:[^}]*)\}/gi;
  let cbm: RegExpExecArray | null;
  while ((cbm = cssBlockRegex.exec(code)) !== null) {
    const block = cbm[1];
    const colorMatch = block.match(/(?:^|;|\s)color\s*:\s*([^;]+)/i);
    const bgMatch = block.match(/background(?:-color)?\s*:\s*([^;]+)/i);
    if (colorMatch && bgMatch) {
      colorPairs.push({
        fg: colorMatch[1].trim(),
        bg: bgMatch[1].trim(),
        context: snippet(cbm[0]),
      });
    }
  }

  for (const pair of colorPairs) {
    const fg = parseColor(pair.fg);
    const bg = parseColor(pair.bg);
    if (!fg || !bg) continue;

    const ratio = contrastRatio(fg, bg);
    const ratioStr = ratio.toFixed(2);

    let requiredNormal: number;
    let requiredLarge: number;
    switch (level) {
      case "A":
        requiredNormal = 3;
        requiredLarge = 3;
        break;
      case "AAA":
        requiredNormal = 7;
        requiredLarge = 4.5;
        break;
      default: // AA
        requiredNormal = 4.5;
        requiredLarge = 3;
        break;
    }

    if (ratio < requiredLarge) {
      issues.push({
        category: "Color Contrast",
        severity: "error",
        wcagCriterion: "1.4.3",
        description: `Contrast ratio ${ratioStr}:1 between "${pair.fg}" and "${pair.bg}" fails even for large text (requires ${requiredLarge}:1).`,
        element: pair.context,
        suggestion: `Increase the contrast between foreground and background colors to at least ${requiredLarge}:1 for large text or ${requiredNormal}:1 for normal text.`,
      });
    } else if (ratio < requiredNormal) {
      issues.push({
        category: "Color Contrast",
        severity: "warning",
        wcagCriterion: level === "AAA" ? "1.4.6" : "1.4.3",
        description: `Contrast ratio ${ratioStr}:1 between "${pair.fg}" and "${pair.bg}" passes for large text but fails for normal text (requires ${requiredNormal}:1).`,
        element: pair.context,
        suggestion: `Increase contrast to at least ${requiredNormal}:1 for normal-sized text, or ensure text is large (18pt+ or 14pt+ bold).`,
      });
    }
  }

  return issues;
}

// ---------------------------------------------------------------------------
// 2. Touch Target Size
// ---------------------------------------------------------------------------

function checkTouchTargetSize(code: string, fw: Framework): A11yIssue[] {
  const issues: A11yIssue[] = [];
  const interactiveRegex = /<(button|a|input|select|textarea|summary)\b[^>]*>/gi;
  const tags = findTags(code, interactiveRegex);

  for (const tag of tags) {
    const styleVal = getAttrValue(tag, "style") ?? "";
    const widthMatch = styleVal.match(/width\s*:\s*([^;]+)/i);
    const heightMatch = styleVal.match(/height\s*:\s*([^;]+)/i);
    const paddingMatch = styleVal.match(/padding\s*:\s*([^;]+)/i);

    if (widthMatch && heightMatch) {
      const wParsed = parseCSSValue(widthMatch[1].trim());
      const hParsed = parseCSSValue(heightMatch[1].trim());
      if (wParsed && hParsed) {
        const wPx = toPx(wParsed);
        const hPx = toPx(hParsed);
        if (wPx !== null && hPx !== null) {
          if (wPx < 24 || hPx < 24) {
            issues.push({
              category: "Touch Target Size",
              severity: "error",
              wcagCriterion: "2.5.8",
              description: `Interactive element has a target size of ${wPx}x${hPx}px, below the WCAG 2.2 minimum of 24x24px.`,
              element: snippet(tag),
              suggestion: "Increase the element's width and height to at least 24x24px (44x44px recommended for WCAG 2.1).",
            });
          } else if (wPx < 44 || hPx < 44) {
            issues.push({
              category: "Touch Target Size",
              severity: "warning",
              wcagCriterion: "2.5.5",
              description: `Interactive element has a target size of ${wPx}x${hPx}px, below the WCAG 2.1 recommended 44x44px.`,
              element: snippet(tag),
              suggestion: "Increase the element's clickable area to at least 44x44px for comfortable touch interaction.",
            });
          }
        }
      }
    }

    // Check for very small padding-only sizing (no explicit w/h but tiny padding)
    if (!widthMatch && !heightMatch && paddingMatch) {
      const pParsed = parseCSSValue(paddingMatch[1].trim().split(/\s+/)[0]);
      if (pParsed) {
        const pPx = toPx(pParsed);
        if (pPx !== null && pPx < 6) {
          issues.push({
            category: "Touch Target Size",
            severity: "info",
            wcagCriterion: "2.5.5",
            description: `Interactive element has very small padding (${pPx}px) which may result in a touch target smaller than 44x44px.`,
            element: snippet(tag),
            suggestion: "Ensure the total clickable area is at least 44x44px. Consider adding min-width/min-height or more padding.",
          });
        }
      }
    }
  }

  // Also check for elements made interactive via onClick etc. (divs/spans)
  const clickAttrNames = attr("onclick", fw);
  const divSpanRegex = /<(div|span)\b[^>]*>/gi;
  const divSpanTags = findTags(code, divSpanRegex);

  for (const tag of divSpanTags) {
    if (!hasAnyAttr(tag, clickAttrNames)) continue;
    const styleVal = getAttrValue(tag, "style") ?? "";
    const widthMatch = styleVal.match(/width\s*:\s*([^;]+)/i);
    const heightMatch = styleVal.match(/height\s*:\s*([^;]+)/i);

    if (widthMatch && heightMatch) {
      const wParsed = parseCSSValue(widthMatch[1].trim());
      const hParsed = parseCSSValue(heightMatch[1].trim());
      if (wParsed && hParsed) {
        const wPx = toPx(wParsed);
        const hPx = toPx(hParsed);
        if (wPx !== null && hPx !== null && (wPx < 44 || hPx < 44)) {
          issues.push({
            category: "Touch Target Size",
            severity: "warning",
            wcagCriterion: "2.5.5",
            description: `Clickable <${getTagName(tag)}> has a target size of ${wPx}x${hPx}px, below the recommended 44x44px.`,
            element: snippet(tag),
            suggestion: "Increase the element's clickable area to at least 44x44px.",
          });
        }
      }
    }
  }

  return issues;
}

// ---------------------------------------------------------------------------
// 3. Image Alt Text
// ---------------------------------------------------------------------------

function checkImageAltText(code: string): A11yIssue[] {
  const issues: A11yIssue[] = [];
  const imgRegex = /<img\b[^>]*\/?>/gi;
  const tags = findTags(code, imgRegex);

  const GENERIC_ALTS = new Set([
    "image", "photo", "picture", "icon", "logo", "graphic",
    "img", "banner", "placeholder", "thumbnail",
  ]);

  for (const tag of tags) {
    const altVal = getAttrValue(tag, "alt");

    if (!hasAttr(tag, "alt")) {
      // Check if it is explicitly decorative via role="presentation" or aria-hidden
      if (hasAttr(tag, "role") && getAttrValue(tag, "role") === "presentation") continue;
      if (getAttrValue(tag, "aria-hidden") === "true") continue;

      issues.push({
        category: "Image Alt Text",
        severity: "error",
        wcagCriterion: "1.1.1",
        description: "Image is missing the alt attribute.",
        element: snippet(tag),
        suggestion: 'Add a descriptive alt attribute. If decorative, use alt="" or role="presentation".',
      });
      continue;
    }

    if (altVal === null || altVal === "") {
      // Empty alt is fine for decorative images; flag it as info
      // unless it has no role=presentation and looks non-decorative
      const src = getAttrValue(tag, "src") ?? "";
      const isLikelyDecorative = /decorat|spacer|divider|bg|background/i.test(src);
      if (!isLikelyDecorative && !hasAttr(tag, "role")) {
        issues.push({
          category: "Image Alt Text",
          severity: "info",
          wcagCriterion: "1.1.1",
          description: 'Image has an empty alt attribute. Verify this is intentionally decorative.',
          element: snippet(tag),
          suggestion: 'If the image conveys information, add descriptive alt text. If decorative, add role="presentation" to be explicit.',
        });
      }
      continue;
    }

    if (GENERIC_ALTS.has(altVal.trim().toLowerCase())) {
      issues.push({
        category: "Image Alt Text",
        severity: "warning",
        wcagCriterion: "1.1.1",
        description: `Image alt text "${altVal}" is too generic.`,
        element: snippet(tag),
        suggestion: "Replace with descriptive text that conveys the image's purpose or content.",
      });
    }
  }

  return issues;
}

// ---------------------------------------------------------------------------
// 4. Form Labels
// ---------------------------------------------------------------------------

function checkFormLabels(code: string, fw: Framework): A11yIssue[] {
  const issues: A11yIssue[] = [];
  const formControlRegex = /<(input|select|textarea)\b[^>]*\/?>/gi;
  const tags = findTags(code, formControlRegex);

  // Collect all label for= values
  const forAttrNames = attr("for", fw);
  const labelRegex = /<label\b[^>]*>/gi;
  const labelTags = findTags(code, labelRegex);
  const labelForIds = new Set<string>();
  for (const lt of labelTags) {
    for (const forName of forAttrNames) {
      const val = getAttrValue(lt, forName);
      if (val) labelForIds.add(val);
    }
  }

  for (const tag of tags) {
    const tagName = getTagName(tag);
    // Skip hidden inputs
    if (tagName === "input") {
      const type = getAttrValue(tag, "type");
      if (type === "hidden" || type === "submit" || type === "button" || type === "reset" || type === "image") {
        continue;
      }
    }

    // Check if it has an id that a label references
    const id = getAttrValue(tag, "id");
    if (id && labelForIds.has(id)) continue;

    // Check for aria-label or aria-labelledby
    if (hasAttr(tag, "aria-label") || hasAttr(tag, "aria-labelledby")) continue;

    // Check for title attribute (acceptable labelling mechanism)
    if (hasAttr(tag, "title")) continue;

    // Check for placeholder (not ideal but partial)
    const hasPlaceholder = hasAttr(tag, "placeholder");

    // Check if wrapped in a <label> tag — simple heuristic:
    // look for <label> ... this tag ... </label> pattern
    const tagEscaped = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const wrappedRegex = new RegExp(`<label[^>]*>[^]*?${tagEscaped}[^]*?</label>`, "i");
    if (wrappedRegex.test(code)) continue;

    if (hasPlaceholder) {
      issues.push({
        category: "Form Labels",
        severity: "warning",
        wcagCriterion: "1.3.1",
        description: `Form control <${tagName}> relies only on placeholder for labeling.`,
        element: snippet(tag),
        suggestion: "Placeholders disappear on input. Add a visible <label>, aria-label, or aria-labelledby.",
      });
    } else {
      issues.push({
        category: "Form Labels",
        severity: "error",
        wcagCriterion: "1.3.1",
        description: `Form control <${tagName}> has no accessible label.`,
        element: snippet(tag),
        suggestion: 'Add a <label> with matching for/id, wrap in a <label>, or add aria-label / aria-labelledby.',
      });
    }
  }

  return issues;
}

// ---------------------------------------------------------------------------
// 5. Heading Hierarchy
// ---------------------------------------------------------------------------

function checkHeadingHierarchy(code: string): A11yIssue[] {
  const issues: A11yIssue[] = [];
  const headingRegex = /<(h[1-6])\b[^>]*>/gi;
  const headings: { level: number; tag: string }[] = [];

  let m: RegExpExecArray | null;
  const re = new RegExp(headingRegex.source, "gi");
  while ((m = re.exec(code)) !== null) {
    headings.push({ level: parseInt(m[1][1]), tag: m[0] });
  }

  if (headings.length === 0) return issues;

  // Check for multiple h1
  const h1Count = headings.filter((h) => h.level === 1).length;
  if (h1Count > 1) {
    issues.push({
      category: "Heading Hierarchy",
      severity: "warning",
      wcagCriterion: "1.3.1",
      description: `Found ${h1Count} <h1> elements. Pages should generally have a single <h1>.`,
      element: "Multiple <h1> tags",
      suggestion: "Use a single <h1> for the main page title and use <h2>-<h6> for subsections.",
    });
  }

  // Check that levels don't skip
  for (let i = 1; i < headings.length; i++) {
    const prev = headings[i - 1].level;
    const curr = headings[i].level;
    if (curr > prev + 1) {
      issues.push({
        category: "Heading Hierarchy",
        severity: "error",
        wcagCriterion: "1.3.1",
        description: `Heading level skips from <h${prev}> to <h${curr}> (missing <h${prev + 1}>).`,
        element: snippet(headings[i].tag),
        suggestion: `Don't skip heading levels. Use <h${prev + 1}> instead, or add the missing intermediate heading.`,
      });
    }
  }

  // Check that the first heading is h1 (info level)
  if (headings[0].level !== 1) {
    issues.push({
      category: "Heading Hierarchy",
      severity: "info",
      wcagCriterion: "1.3.1",
      description: `First heading is <h${headings[0].level}> instead of <h1>.`,
      element: snippet(headings[0].tag),
      suggestion: "Consider starting with an <h1> element for the main page/section title.",
    });
  }

  return issues;
}

// ---------------------------------------------------------------------------
// 6. ARIA Attributes
// ---------------------------------------------------------------------------

function checkAriaAttributes(code: string): A11yIssue[] {
  const issues: A11yIssue[] = [];

  // aria-hidden="true" on focusable elements
  const ariaHiddenRegex = /<([a-zA-Z][a-zA-Z0-9]*)\b[^>]*aria-hidden\s*=\s*["']true["'][^>]*>/gi;
  const ariaHiddenTags = findTags(code, ariaHiddenRegex);

  for (const tag of ariaHiddenTags) {
    const tn = getTagName(tag);
    const isFocusable =
      INTERACTIVE_TAGS.has(tn) ||
      hasAttr(tag, "tabindex") ||
      hasAttr(tag, "href");

    if (isFocusable) {
      issues.push({
        category: "ARIA Attributes",
        severity: "error",
        wcagCriterion: "4.1.2",
        description: `aria-hidden="true" is set on a focusable <${tn}> element.`,
        element: snippet(tag),
        suggestion: 'Remove aria-hidden="true" from focusable elements, or remove focusability (tabindex="-1", remove href).',
      });
    }
  }

  // Icon-only buttons without aria-label
  const buttonRegex = /<button\b[^>]*>[^]*?<\/button>/gi;
  const buttons = findTags(code, buttonRegex);

  for (const btn of buttons) {
    // Extract inner content (between > and </button>)
    const innerMatch = btn.match(/<button\b[^>]*>([\s\S]*)<\/button>/i);
    if (!innerMatch) continue;
    const inner = innerMatch[1].trim();

    // Check if inner content has only icons/svgs/i tags and no visible text
    const textContent = inner
      .replace(/<[^>]*>/g, "")  // strip all tags
      .replace(/\s+/g, " ")
      .trim();

    const hasIconContent = /<(svg|i|img|span\b[^>]*class\s*=\s*["'][^"']*icon[^"']*["'])\b/i.test(inner);

    if (hasIconContent && textContent.length === 0) {
      const openTag = btn.match(/<button\b[^>]*/i)?.[0] ?? btn;
      if (!hasAttr(openTag, "aria-label") && !hasAttr(openTag, "aria-labelledby") && !hasAttr(openTag, "title")) {
        issues.push({
          category: "ARIA Attributes",
          severity: "error",
          wcagCriterion: "4.1.2",
          description: "Icon-only button has no accessible label.",
          element: snippet(btn),
          suggestion: "Add aria-label, aria-labelledby, or visually hidden text to describe the button's purpose.",
        });
      }
    }
  }

  // Check for wrong role usage on known elements
  const roleRegex = /<(button|a|input|nav|main|header|footer|aside|section|article)\b[^>]*role\s*=\s*["']([^"']*)["'][^>]*>/gi;
  const roleTags = findTags(code, roleRegex);
  const IMPLICIT_ROLES: Record<string, string> = {
    button: "button",
    a: "link",
    nav: "navigation",
    main: "main",
    header: "banner",
    footer: "contentinfo",
    aside: "complementary",
    article: "article",
  };

  for (const tag of roleTags) {
    const tn = getTagName(tag);
    const roleVal = getAttrValue(tag, "role");
    const implicitRole = IMPLICIT_ROLES[tn];
    if (implicitRole && roleVal === implicitRole) {
      issues.push({
        category: "ARIA Attributes",
        severity: "info",
        wcagCriterion: "4.1.2",
        description: `<${tn}> has role="${roleVal}" which is its implicit role. This is redundant.`,
        element: snippet(tag),
        suggestion: `Remove role="${roleVal}" from <${tn}> as it already has this role implicitly.`,
      });
    }
  }

  // Check for landmark roles presence
  const hasNav = /<nav\b/i.test(code) || /role\s*=\s*["']navigation["']/i.test(code);
  const hasMain = /<main\b/i.test(code) || /role\s*=\s*["']main["']/i.test(code);

  if (!hasMain && code.length > 200) {
    issues.push({
      category: "ARIA Attributes",
      severity: "info",
      wcagCriterion: "1.3.1",
      description: "No <main> landmark found in the code.",
      element: "(document structure)",
      suggestion: "Add a <main> element to identify the primary content area.",
    });
  }

  return issues;
}

// ---------------------------------------------------------------------------
// 7. Keyboard Navigation
// ---------------------------------------------------------------------------

function checkKeyboardNavigation(code: string, fw: Framework): A11yIssue[] {
  const issues: A11yIssue[] = [];

  // Check for tabindex > 0
  const tabindexRegex = /<[a-zA-Z][^>]*tabindex\s*=\s*["']?(\d+)["']?[^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = tabindexRegex.exec(code)) !== null) {
    const val = parseInt(m[1]);
    if (val > 0) {
      issues.push({
        category: "Keyboard Navigation",
        severity: "warning",
        wcagCriterion: "2.4.3",
        description: `tabindex="${val}" found. Positive tabindex values disrupt natural tab order.`,
        element: snippet(m[0]),
        suggestion: 'Use tabindex="0" to add to tab order or tabindex="-1" for programmatic focus. Avoid positive values.',
      });
    }
  }

  // Check for onClick on non-interactive elements without keyboard support
  const clickAttrs = attr("onclick", fw);
  const keyAttrs = attr("onkeydown", fw);

  const nonInteractiveRegex = /<(div|span|li|td|tr|p|section|article)\b[^>]*>/gi;
  const nonInteractiveTags = findTags(code, nonInteractiveRegex);

  for (const tag of nonInteractiveTags) {
    if (!hasAnyAttr(tag, clickAttrs)) continue;

    const hasRole = hasAttr(tag, "role");
    const hasTabindex = hasAttr(tag, "tabindex");
    const hasKeyHandler = hasAnyAttr(tag, keyAttrs);

    const tn = getTagName(tag);

    if (!hasRole || !hasTabindex) {
      issues.push({
        category: "Keyboard Navigation",
        severity: "error",
        wcagCriterion: "2.1.1",
        description: `<${tn}> has a click handler but lacks ${!hasRole ? 'role="button"' : ""}${!hasRole && !hasTabindex ? " and " : ""}${!hasTabindex ? 'tabindex="0"' : ""}.`,
        element: snippet(tag),
        suggestion: `Add role="button" and tabindex="0" to make this element accessible, or use a <button> element instead.`,
      });
    }

    if (!hasKeyHandler) {
      issues.push({
        category: "Keyboard Navigation",
        severity: "warning",
        wcagCriterion: "2.1.1",
        description: `<${tn}> has a click handler but no keyboard event handler.`,
        element: snippet(tag),
        suggestion: "Add a keydown handler (Enter/Space) so keyboard users can activate this element.",
      });
    }
  }

  return issues;
}

// ---------------------------------------------------------------------------
// 8. Focus Indicators
// ---------------------------------------------------------------------------

function checkFocusIndicators(code: string): A11yIssue[] {
  const issues: A11yIssue[] = [];

  // Check for outline: none / outline: 0 without :focus-visible replacement
  const outlineNoneRegex = /outline\s*:\s*(none|0)\b[^;]*/gi;
  let m: RegExpExecArray | null;
  while ((m = outlineNoneRegex.exec(code)) !== null) {
    // Check if there's a :focus-visible nearby
    const contextStart = Math.max(0, m.index - 200);
    const contextEnd = Math.min(code.length, m.index + m[0].length + 200);
    const context = code.slice(contextStart, contextEnd);
    const hasFocusVisible = /:focus-visible/i.test(context);
    const hasFocusWithin = /:focus-within/i.test(context);
    const hasBoxShadowFocus = /box-shadow/i.test(context) && /:focus/i.test(context);
    const hasBorderFocus = /border.*:focus|:focus.*border/i.test(context);

    if (!hasFocusVisible && !hasFocusWithin && !hasBoxShadowFocus && !hasBorderFocus) {
      issues.push({
        category: "Focus Indicators",
        severity: "error",
        wcagCriterion: "2.4.7",
        description: `"${m[0].trim()}" removes the focus indicator without an alternative.`,
        element: snippet(context, 80),
        suggestion: "Provide a visible focus indicator using :focus-visible with outline, box-shadow, or border.",
      });
    } else {
      issues.push({
        category: "Focus Indicators",
        severity: "info",
        wcagCriterion: "2.4.7",
        description: `"${m[0].trim()}" removes the default outline but a replacement may be present.`,
        element: snippet(context, 80),
        suggestion: "Verify that the alternative focus indicator meets WCAG requirements (visible, sufficient contrast).",
      });
    }
  }

  return issues;
}

// ---------------------------------------------------------------------------
// 9. Color-Only Information
// ---------------------------------------------------------------------------

function checkColorOnlyInfo(code: string): A11yIssue[] {
  const issues: A11yIssue[] = [];

  // Heuristic: look for patterns where color alone might convey meaning.
  // e.g. error classes with red but no icon/text indicator
  const errorColorPatterns = [
    { regex: /(?:color\s*:\s*(?:red|#[ef][0-9a-f]0{2,4}|#f{2}0{4}|rgb\(\s*2[0-5]\d\s*,\s*\d{1,2}\s*,\s*\d{1,2}\s*\))|(?:text-red|text-danger|text-error|color-red|color-error))\b/gi, meaning: "error/danger" },
    { regex: /(?:color\s*:\s*(?:green|#0{2}(?:8|[a-f])[0-9a-f]{3}|rgb\(\s*\d{1,2}\s*,\s*1[2-9]\d|2\d{2}\s*,\s*\d{1,2}\s*\))|(?:text-green|text-success|color-green|color-success))\b/gi, meaning: "success" },
    { regex: /(?:color\s*:\s*(?:orange|#ff[a-f][0-9a-f]{3}|rgb\(\s*2[0-5]\d\s*,\s*1[0-6]\d\s*,\s*\d{1,2}\s*\))|(?:text-orange|text-warning|color-orange|color-warning))\b/gi, meaning: "warning" },
  ];

  for (const pattern of errorColorPatterns) {
    let m: RegExpExecArray | null;
    while ((m = pattern.regex.exec(code)) !== null) {
      // Check if nearby content has an icon or text indicator
      const contextStart = Math.max(0, m.index - 100);
      const contextEnd = Math.min(code.length, m.index + m[0].length + 200);
      const context = code.slice(contextStart, contextEnd);

      const hasIcon = /<(svg|i|img)\b/i.test(context) || /icon|aria-label|sr-only|visually-hidden/i.test(context);
      const hasTextIndicator = /error|warning|success|alert|required|invalid/i.test(context.replace(m[0], ""));

      if (!hasIcon && !hasTextIndicator) {
        issues.push({
          category: "Color-Only Information",
          severity: "warning",
          wcagCriterion: "1.4.1",
          description: `${pattern.meaning} state may be conveyed by color alone ("${m[0].trim()}").`,
          element: snippet(context, 80),
          suggestion: "Supplement color with icons, text, or patterns so information is not conveyed by color alone.",
        });
      }
    }
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Scoring & Report
// ---------------------------------------------------------------------------

function computeScore(issues: A11yIssue[]): number {
  let score = 100;
  for (const issue of issues) {
    switch (issue.severity) {
      case "error":
        score -= 8;
        break;
      case "warning":
        score -= 3;
        break;
      case "info":
        score -= 1;
        break;
    }
  }
  return Math.max(0, Math.min(100, score));
}

function buildReport(issues: A11yIssue[], level: WcagLevel): string {
  const score = computeScore(issues);

  const categories = [
    "Color Contrast",
    "Touch Target Size",
    "Image Alt Text",
    "Form Labels",
    "Heading Hierarchy",
    "ARIA Attributes",
    "Keyboard Navigation",
    "Focus Indicators",
    "Color-Only Information",
  ];

  const categoryResults: CategoryResult[] = categories.map((name) => {
    const catIssues = issues.filter((i) => i.category === name);
    return {
      name,
      passed: catIssues.filter((i) => i.severity === "error").length === 0,
      issueCount: catIssues.length,
    };
  });

  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");
  const infos = issues.filter((i) => i.severity === "info");

  let summary: string;
  if (score >= 90) {
    summary = "Excellent accessibility! Minor improvements may still be possible.";
  } else if (score >= 70) {
    summary = "Good accessibility foundation with some issues to address.";
  } else if (score >= 50) {
    summary = "Several accessibility issues found. Addressing these will significantly improve usability.";
  } else {
    summary = "Major accessibility issues detected. These should be resolved before release.";
  }

  const lines: string[] = [
    `# Accessibility Audit Report`,
    ``,
    `**WCAG Level:** ${level}`,
    `**Accessibility Score:** ${score}/100`,
    `**Summary:** ${summary}`,
    ``,
    `**Issues found:** ${errors.length} errors, ${warnings.length} warnings, ${infos.length} suggestions`,
    ``,
    `## Pass/Fail by Category`,
    ``,
    `| Category | Status | Issues |`,
    `|----------|--------|--------|`,
  ];

  for (const cat of categoryResults) {
    const status = cat.issueCount === 0 ? "PASS" : cat.passed ? "WARN" : "FAIL";
    lines.push(`| ${cat.name} | ${status} | ${cat.issueCount} |`);
  }

  lines.push(``);

  // Group issues by category
  for (const catName of categories) {
    const catIssues = issues.filter((i) => i.category === catName);
    if (catIssues.length === 0) continue;

    lines.push(`## ${catName}`);
    lines.push(``);

    for (const issue of catIssues) {
      const severityLabel = issue.severity === "error" ? "ERROR" : issue.severity === "warning" ? "WARNING" : "INFO";
      lines.push(`### ${severityLabel} - WCAG ${issue.wcagCriterion}`);
      lines.push(``);
      lines.push(`**Description:** ${issue.description}`);
      lines.push(`**Element:** \`${issue.element}\``);
      lines.push(`**Fix:** ${issue.suggestion}`);
      lines.push(``);
    }
  }

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Tool Registration
// ---------------------------------------------------------------------------

export function registerA11yAudit(server: McpServer): void {
  server.tool(
    "a11y_audit",
    "Comprehensive WCAG 2.1 accessibility audit. Analyzes UI code for color contrast, touch targets, alt text, form labels, heading hierarchy, ARIA usage, keyboard navigation, focus indicators, and color-only information issues.",
    {
      code: z.string().describe("The UI code to audit (HTML, CSS, React, Vue, or Svelte)"),
      level: z
        .enum(["A", "AA", "AAA"])
        .default("AA")
        .describe("WCAG conformance level to test against"),
      framework: z
        .enum(["react", "vue", "svelte", "html", "auto"])
        .default("auto")
        .describe("Framework hint (auto-detected if not specified)"),
    },
    async ({ code, level, framework }) => {
      const fw: Framework =
        framework && framework !== "auto"
          ? (framework as Framework)
          : detectFramework(code);

      const allIssues: A11yIssue[] = [
        ...checkColorContrast(code, level),
        ...checkTouchTargetSize(code, fw),
        ...checkImageAltText(code),
        ...checkFormLabels(code, fw),
        ...checkHeadingHierarchy(code),
        ...checkAriaAttributes(code),
        ...checkKeyboardNavigation(code, fw),
        ...checkFocusIndicators(code),
        ...checkColorOnlyInfo(code),
      ];

      const report = buildReport(allIssues, level);

      return {
        content: [{ type: "text" as const, text: report }],
      };
    }
  );
}
