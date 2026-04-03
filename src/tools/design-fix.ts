import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { parseCode } from "../parsers/index.js";
import { runDesignRules, calculateScore, type FocusArea } from "../rules/index.js";
import type { DesignIssue } from "../rules/types.js";
import { parseCSSValue, toPx } from "../utils/css-value-parser.js";
import {
  parseColor,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  contrastRatio,
  relativeLuminance,
  type RGB,
} from "../utils/color-utils.js";
import {
  GRID_BASE,
  SPACING_SCALE,
  WCAG_AA_NORMAL,
  OPTIMAL_LINE_HEIGHT_BODY,
} from "../constants.js";

type FixLevel = "safe" | "moderate" | "aggressive";

interface FixResult {
  description: string;
  category: string;
  before: string;
  after: string;
}

// ─── Spacing Fixes ────────────────────────────────────────────────────────────

function nearestGridValue(px: number): number {
  return Math.round(px / GRID_BASE) * GRID_BASE;
}

function nearestSpacingScale(px: number): number {
  return SPACING_SCALE.reduce((prev, curr) =>
    Math.abs(curr - px) < Math.abs(prev - px) ? curr : prev
  );
}

/** Map px value to the closest Tailwind spacing class token */
function pxToTailwindSpacing(px: number): string | null {
  const twMap: Record<number, string> = {
    0: "0", 1: "px", 2: "0.5", 4: "1", 6: "1.5", 8: "2", 10: "2.5",
    12: "3", 14: "3.5", 16: "4", 20: "5", 24: "6", 28: "7", 32: "8",
    36: "9", 40: "10", 44: "11", 48: "12", 56: "14", 64: "16", 80: "20",
    96: "24", 112: "28", 128: "32",
  };
  return twMap[px] ?? null;
}

const SPACING_PROPS = new Set([
  "padding", "padding-top", "padding-right", "padding-bottom", "padding-left",
  "margin", "margin-top", "margin-right", "margin-bottom", "margin-left",
  "gap", "row-gap", "column-gap",
]);

function fixSpacingInCSS(code: string, fixes: FixResult[], level: FixLevel): string {
  // Match CSS property: value pairs for spacing props
  const spacingPropPattern = new RegExp(
    `((?:padding|margin)(?:-(?:top|right|bottom|left))?|(?:row-|column-)?gap)\\s*:\\s*([^;}"']+)`,
    "g"
  );

  return code.replace(spacingPropPattern, (match, prop: string, rawValue: string) => {
    const value = rawValue.trim();
    const parsed = parseCSSValue(value);
    if (!parsed) return match;

    const px = toPx(parsed);
    if (px === null || px === 0) return match;

    // safe: only fix non-grid-aligned values
    if (px % GRID_BASE !== 0) {
      const fixed = nearestGridValue(px);
      const newValue = parsed.unit === "rem" ? `${fixed / 16}rem` : `${fixed}px`;
      fixes.push({
        description: `Grid alignment: ${prop}: ${value} is not on the ${GRID_BASE}px grid`,
        category: "spacing",
        before: `${prop}: ${value}`,
        after: `${prop}: ${newValue}`,
      });
      return `${prop}: ${newValue}`;
    }

    // moderate+: consolidate to spacing scale
    if (level !== "safe" && !SPACING_SCALE.includes(px)) {
      const fixed = nearestSpacingScale(px);
      const newValue = parsed.unit === "rem" ? `${fixed / 16}rem` : `${fixed}px`;
      fixes.push({
        description: `Spacing scale: ${prop}: ${value} consolidated to design scale`,
        category: "spacing",
        before: `${prop}: ${value}`,
        after: `${prop}: ${newValue}`,
      });
      return `${prop}: ${newValue}`;
    }

    return match;
  });
}

function fixSpacingInTailwind(code: string, fixes: FixResult[], level: FixLevel): string {
  // Match arbitrary spacing values: p-[13px], m-[17px], gap-[9px], etc.
  const twArbitrarySpacing = /\b(p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap)-\[(\d+(?:\.\d+)?)px\]/g;

  return code.replace(twArbitrarySpacing, (match, prefix: string, rawPx: string) => {
    const px = parseFloat(rawPx);
    if (px === 0) return match;

    let fixedPx = px;

    if (px % GRID_BASE !== 0) {
      fixedPx = nearestGridValue(px);
    } else if (level !== "safe" && !SPACING_SCALE.includes(px)) {
      fixedPx = nearestSpacingScale(px);
    } else {
      // Already on grid; check if a named class exists
      const twToken = pxToTailwindSpacing(px);
      if (twToken !== null) {
        const replacement = `${prefix}-${twToken}`;
        fixes.push({
          description: `Tailwind class: use named spacing class instead of arbitrary value`,
          category: "spacing",
          before: match,
          after: replacement,
        });
        return replacement;
      }
      return match;
    }

    const twToken = pxToTailwindSpacing(fixedPx);
    if (twToken !== null) {
      const replacement = `${prefix}-${twToken}`;
      fixes.push({
        description: `Tailwind spacing: snap ${px}px to grid value ${fixedPx}px`,
        category: "spacing",
        before: match,
        after: replacement,
      });
      return replacement;
    }

    // Fallback to arbitrary with corrected value
    const replacement = `${prefix}-[${fixedPx}px]`;
    fixes.push({
      description: `Grid alignment: snap ${px}px to ${fixedPx}px`,
      category: "spacing",
      before: match,
      after: replacement,
    });
    return replacement;
  });
}

// ─── Color Fixes ──────────────────────────────────────────────────────────────

function adjustForContrast(textRgb: RGB, bgRgb: RGB, targetRatio: number): RGB {
  const bgLum = relativeLuminance(bgRgb);
  const textHsl = rgbToHsl(textRgb);

  // Determine if we need to lighten or darken the text
  // If background is dark (luminance < 0.5), lighten the text; otherwise darken it
  const direction = bgLum < 0.5 ? 1 : -1;
  const step = 0.02;

  let bestRgb = textRgb;
  let currentL = textHsl.l;

  for (let i = 0; i < 80; i++) {
    currentL += direction * step;
    currentL = Math.max(0, Math.min(1, currentL));

    const candidate = hslToRgb({ h: textHsl.h, s: textHsl.s, l: currentL });
    const ratio = contrastRatio(candidate, bgRgb);

    if (ratio >= targetRatio) {
      bestRgb = candidate;
      break;
    }
    bestRgb = candidate;
  }

  return bestRgb;
}

function fixColorsInCSS(code: string, fixes: FixResult[], level: FixLevel): string {
  let result = code;

  // Collect background colors for contrast checking
  const bgColorMatches: Array<{ color: string; rgb: RGB }> = [];
  const bgPattern = /background(?:-color)?\s*:\s*([^;}"']+)/g;
  let bgMatch;
  while ((bgMatch = bgPattern.exec(code)) !== null) {
    const rgb = parseColor(bgMatch[1].trim());
    if (rgb) {
      bgColorMatches.push({ color: bgMatch[1].trim(), rgb });
    }
  }

  // Fix low-contrast text colors
  const textColorPattern = /(\bcolor\s*:\s*)([^;}"']+)/g;
  result = result.replace(textColorPattern, (match, prefix: string, rawValue: string) => {
    const value = rawValue.trim();
    const textRgb = parseColor(value);
    if (!textRgb) return match;

    for (const bg of bgColorMatches) {
      const ratio = contrastRatio(textRgb, bg.rgb);
      if (ratio < WCAG_AA_NORMAL) {
        const fixed = adjustForContrast(textRgb, bg.rgb, WCAG_AA_NORMAL);
        const fixedHex = rgbToHex(fixed);
        const newRatio = contrastRatio(fixed, bg.rgb);
        fixes.push({
          description: `WCAG contrast: text on ${bg.color} had ratio ${ratio.toFixed(2)}:1, now ${newRatio.toFixed(2)}:1`,
          category: "color",
          before: `color: ${value}`,
          after: `color: ${fixedHex}`,
        });
        return `${prefix}${fixedHex}`;
      }
    }

    return match;
  });

  // Fix pure black -> #111827
  result = replaceColorValue(result, "#000000", "#111827", fixes, "Pure black softened to #111827");
  result = replaceColorValue(result, "#000", "#111827", fixes, "Pure black softened to #111827");
  result = replaceColorValue(result, "rgb(0, 0, 0)", "#111827", fixes, "Pure black softened to #111827");
  result = replaceColorValue(result, "rgb(0,0,0)", "#111827", fixes, "Pure black softened to #111827");

  // Fix pure white backgrounds -> #fafafa
  result = fixPureWhiteBackgrounds(result, fixes);

  return result;
}

function replaceColorValue(
  code: string,
  oldColor: string,
  newColor: string,
  fixes: FixResult[],
  description: string,
): string {
  if (!code.includes(oldColor)) return code;

  // Only replace in CSS property contexts (not in arbitrary text)
  const escaped = oldColor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(:\\s*)${escaped}(?=\\s*[;}"'])`, "gi");

  if (pattern.test(code)) {
    fixes.push({
      description,
      category: "color",
      before: oldColor,
      after: newColor,
    });
    return code.replace(pattern, `$1${newColor}`);
  }

  return code;
}

function fixPureWhiteBackgrounds(code: string, fixes: FixResult[]): string {
  // Only replace #ffffff / #fff in background/background-color contexts
  const bgWhitePattern = /(background(?:-color)?\s*:\s*)(?:#ffffff|#fff)\b/gi;
  if (bgWhitePattern.test(code)) {
    fixes.push({
      description: "Pure white background softened to #fafafa",
      category: "color",
      before: "background: #ffffff",
      after: "background: #fafafa",
    });
    return code.replace(
      /(background(?:-color)?\s*:\s*)(?:#ffffff|#fff)\b/gi,
      "$1#fafafa"
    );
  }
  return code;
}

function fixColorsInTailwind(code: string, fixes: FixResult[]): string {
  let result = code;

  // bg-white -> bg-gray-50 (subtle off-white)
  if (/\bbg-white\b/.test(result)) {
    fixes.push({
      description: "Pure white background softened",
      category: "color",
      before: "bg-white",
      after: "bg-gray-50",
    });
    result = result.replace(/\bbg-white\b/g, "bg-gray-50");
  }

  // text-black -> text-gray-900
  if (/\btext-black\b/.test(result)) {
    fixes.push({
      description: "Pure black text softened",
      category: "color",
      before: "text-black",
      after: "text-gray-900",
    });
    result = result.replace(/\btext-black\b/g, "text-gray-900");
  }

  return result;
}

// ─── Typography Fixes ─────────────────────────────────────────────────────────

function fixTypographyInCSS(code: string, fixes: FixResult[], level: FixLevel): string {
  let result = code;

  // Fix odd font sizes -> nearest even
  if (level !== "safe") {
    result = result.replace(/(font-size\s*:\s*)(\d+(?:\.\d+)?)(px)/g, (match, prefix, size, unit) => {
      const px = parseFloat(size);
      if (px > 10 && px < 20 && px % 2 !== 0) {
        const fixed = Math.round(px / 2) * 2;
        fixes.push({
          description: `Odd font size normalized to even value`,
          category: "typography",
          before: `font-size: ${size}px`,
          after: `font-size: ${fixed}px`,
        });
        return `${prefix}${fixed}${unit}`;
      }
      return match;
    });
  }

  // Fix too-tight line-height (unitless values < 1.4 on body text)
  if (level !== "safe") {
    result = result.replace(/(line-height\s*:\s*)([\d.]+)(?=\s*[;}"'])/g, (match, prefix, rawVal) => {
      const val = parseFloat(rawVal);
      // Only fix unitless multipliers (< 4 indicates multiplier, not px)
      if (val > 0 && val < 4 && val < OPTIMAL_LINE_HEIGHT_BODY.min) {
        const fixed = OPTIMAL_LINE_HEIGHT_BODY.min;
        fixes.push({
          description: `Line-height too tight for body text`,
          category: "typography",
          before: `line-height: ${rawVal}`,
          after: `line-height: ${fixed}`,
        });
        return `${prefix}${fixed}`;
      }
      return match;
    });
  }

  // Fix font weight proliferation: map unusual weights to 400/500/700
  if (level === "aggressive") {
    result = result.replace(/(font-weight\s*:\s*)(\d+)/g, (match, prefix, rawWeight) => {
      const w = parseInt(rawWeight);
      const preferred = [400, 500, 700];
      if (preferred.includes(w)) return match;

      const nearest = preferred.reduce((prev, curr) =>
        Math.abs(curr - w) < Math.abs(prev - w) ? curr : prev
      );
      fixes.push({
        description: `Font weight consolidated to standard scale`,
        category: "typography",
        before: `font-weight: ${rawWeight}`,
        after: `font-weight: ${nearest}`,
      });
      return `${prefix}${nearest}`;
    });
  }

  return result;
}

function fixTypographyInTailwind(code: string, fixes: FixResult[], level: FixLevel): string {
  let result = code;

  // Fix arbitrary odd font sizes: text-[13px] -> text-sm (14px), text-[15px] -> text-base (16px)
  if (level !== "safe") {
    const twFontSizeMap: Record<number, string> = {
      11: "text-xs",   // 12px
      13: "text-sm",   // 14px
      15: "text-base", // 16px
      17: "text-lg",   // 18px
      19: "text-xl",   // 20px
    };

    result = result.replace(/\btext-\[(\d+)px\]/g, (match, rawPx) => {
      const px = parseInt(rawPx);
      const replacement = twFontSizeMap[px];
      if (replacement) {
        fixes.push({
          description: `Odd font size snapped to Tailwind type scale`,
          category: "typography",
          before: match,
          after: replacement,
        });
        return replacement;
      }
      return match;
    });
  }

  // Consolidate unusual font weights in aggressive mode
  if (level === "aggressive") {
    const weightConsolidate: Record<string, string> = {
      "font-thin": "font-normal",
      "font-extralight": "font-normal",
      "font-light": "font-normal",
      "font-semibold": "font-bold",
      "font-extrabold": "font-bold",
      "font-black": "font-bold",
    };
    for (const [from, to] of Object.entries(weightConsolidate)) {
      const regex = new RegExp(`\\b${from}\\b`, "g");
      if (regex.test(result)) {
        fixes.push({
          description: `Font weight consolidated`,
          category: "typography",
          before: from,
          after: to,
        });
        result = result.replace(regex, to);
      }
    }
  }

  return result;
}

// ─── Layout Fixes ─────────────────────────────────────────────────────────────

function fixLayoutInCSS(code: string, fixes: FixResult[], level: FixLevel): string {
  let result = code;

  // Normalize z-index values
  result = result.replace(/(z-index\s*:\s*)(\d+)/g, (match, prefix, rawVal) => {
    const val = parseInt(rawVal);
    if (val > 100) {
      // Map to a scale: 1-10 -> 10, 11-30 -> 20, 31-60 -> 30, 61-100 -> 40, >100 -> 50
      const normalized = val > 9000 ? 50 : Math.min(50, Math.ceil(val / 200) * 10);
      fixes.push({
        description: `Excessive z-index normalized`,
        category: "layout",
        before: `z-index: ${rawVal}`,
        after: `z-index: ${normalized}`,
      });
      return `${prefix}${normalized}`;
    }
    return match;
  });

  // Aggressive: add max-width to text containers if missing
  if (level === "aggressive") {
    // Find selectors that have font-size or color but no max-width
    const blockRegex = /([^{}]+)\{([^{}]+)\}/g;
    result = result.replace(blockRegex, (match, selector: string, body: string) => {
      const hasText = /\b(?:font-size|color)\s*:/.test(body);
      const hasMaxWidth = /\bmax-width\s*:/.test(body);
      if (hasText && !hasMaxWidth) {
        const trimmedBody = body.trimEnd();
        const needsSemicolon = !trimmedBody.endsWith(";");
        const addition = `${needsSemicolon ? ";" : ""}\n  max-width: 65ch`;
        fixes.push({
          description: `Added max-width for readable line length`,
          category: "layout",
          before: "(no max-width)",
          after: "max-width: 65ch",
        });
        return `${selector}{${body}${addition}\n}`;
      }
      return match;
    });
  }

  return result;
}

function fixLayoutInTailwind(code: string, fixes: FixResult[], level: FixLevel): string {
  let result = code;

  // Fix excessive z-index: z-[9999] -> z-50
  result = result.replace(/\bz-\[(\d+)\]/g, (match, rawVal) => {
    const val = parseInt(rawVal);
    if (val > 50) {
      const normalized = Math.min(50, Math.ceil(val / 200) * 10);
      const replacement = `z-${normalized}`;
      fixes.push({
        description: `Excessive z-index normalized`,
        category: "layout",
        before: match,
        after: replacement,
      });
      return replacement;
    }
    return match;
  });

  return result;
}

// ─── Missing Padding Fix ──────────────────────────────────────────────────────

function addMissingPaddingCSS(code: string, fixes: FixResult[], level: FixLevel): string {
  if (level === "safe") return code;

  // Find blocks with background-color but no padding
  const blockRegex = /([^{}]+)\{([^{}]+)\}/g;
  return code.replace(blockRegex, (match, selector: string, body: string) => {
    const hasBg = /\bbackground(?:-color)?\s*:/.test(body);
    const hasPadding = /\bpadding(?:-(?:top|right|bottom|left))?\s*:/.test(body);
    if (hasBg && !hasPadding) {
      const trimmedBody = body.trimEnd();
      const needsSemicolon = !trimmedBody.endsWith(";");
      const addition = `${needsSemicolon ? ";" : ""}\n  padding: 16px`;
      fixes.push({
        description: `Added missing padding to element with background`,
        category: "spacing",
        before: "(no padding)",
        after: "padding: 16px",
      });
      return `${selector}{${body}${addition}\n}`;
    }
    return match;
  });
}

// ─── Missing Line-Height Fix ────────────────────────────────────────────────

function addMissingLineHeightCSS(code: string, fixes: FixResult[], level: FixLevel): string {
  if (level === "safe") return code;

  // Find blocks with font-size but no line-height
  const blockRegex = /([^{}]+)\{([^{}]+)\}/g;
  return code.replace(blockRegex, (match, selector: string, body: string) => {
    const hasFontSize = /\bfont-size\s*:/.test(body);
    const hasLineHeight = /\bline-height\s*:/.test(body);
    if (hasFontSize && !hasLineHeight) {
      const trimmedBody = body.trimEnd();
      const needsSemicolon = !trimmedBody.endsWith(";");
      const addition = `${needsSemicolon ? ";" : ""}\n  line-height: 1.5`;
      fixes.push({
        description: `Added missing line-height for readability`,
        category: "typography",
        before: "(no line-height)",
        after: "line-height: 1.5",
      });
      return `${selector}{${body}${addition}\n}`;
    }
    return match;
  });
}

// ─── JSX Inline Style Fixes ──────────────────────────────────────────────────

function fixJSXInlineStyles(code: string, fixes: FixResult[], level: FixLevel): string {
  // Fix numeric values in JSX style objects: style={{ padding: 13 }} -> style={{ padding: 12 }}
  const jsxStyleRegex = /style\s*=\s*\{\{([\s\S]*?)\}\}/g;

  return code.replace(jsxStyleRegex, (match, body: string) => {
    let fixedBody = body;

    // Fix spacing values
    fixedBody = fixedBody.replace(
      /\b(padding|paddingTop|paddingRight|paddingBottom|paddingLeft|margin|marginTop|marginRight|marginBottom|marginLeft|gap)\s*:\s*(\d+)/g,
      (propMatch, prop: string, rawVal: string) => {
        const px = parseInt(rawVal);
        if (px === 0) return propMatch;
        if (px % GRID_BASE !== 0) {
          const fixed = nearestGridValue(px);
          fixes.push({
            description: `Grid alignment in JSX style`,
            category: "spacing",
            before: `${prop}: ${rawVal}`,
            after: `${prop}: ${fixed}`,
          });
          return `${prop}: ${fixed}`;
        }
        return propMatch;
      }
    );

    // Fix font sizes (odd -> even)
    if (level !== "safe") {
      fixedBody = fixedBody.replace(
        /\bfontSize\s*:\s*(\d+)/g,
        (propMatch, rawVal) => {
          const px = parseInt(rawVal);
          if (px > 10 && px < 20 && px % 2 !== 0) {
            const fixed = Math.round(px / 2) * 2;
            fixes.push({
              description: `Odd font size normalized in JSX style`,
              category: "typography",
              before: `fontSize: ${rawVal}`,
              after: `fontSize: ${fixed}`,
            });
            return `fontSize: ${fixed}`;
          }
          return propMatch;
        }
      );
    }

    if (fixedBody !== body) {
      return `style={{${fixedBody}}}`;
    }
    return match;
  });
}

// ─── HTML Inline Style Fixes ────────────────────────────────────────────────

function fixHTMLInlineStyles(code: string, fixes: FixResult[], level: FixLevel): string {
  const htmlStyleRegex = /style\s*=\s*"([^"]*)"/g;

  return code.replace(htmlStyleRegex, (match, body: string) => {
    let fixedBody = body;

    // Fix spacing values in inline styles
    fixedBody = fixedBody.replace(
      /((?:padding|margin)(?:-(?:top|right|bottom|left))?|(?:row-|column-)?gap)\s*:\s*(\d+(?:\.\d+)?)px/g,
      (propMatch, prop: string, rawVal: string) => {
        const px = parseFloat(rawVal);
        if (px === 0) return propMatch;
        if (px % GRID_BASE !== 0) {
          const fixed = nearestGridValue(px);
          fixes.push({
            description: `Grid alignment in inline style`,
            category: "spacing",
            before: `${prop}: ${rawVal}px`,
            after: `${prop}: ${fixed}px`,
          });
          return `${prop}: ${fixed}px`;
        }
        return propMatch;
      }
    );

    // Fix odd font sizes in inline styles
    if (level !== "safe") {
      fixedBody = fixedBody.replace(
        /font-size\s*:\s*(\d+(?:\.\d+)?)px/g,
        (propMatch, rawVal) => {
          const px = parseFloat(rawVal);
          if (px > 10 && px < 20 && px % 2 !== 0) {
            const fixed = Math.round(px / 2) * 2;
            fixes.push({
              description: `Odd font size normalized in inline style`,
              category: "typography",
              before: `font-size: ${rawVal}px`,
              after: `font-size: ${fixed}px`,
            });
            return `font-size: ${fixed}px`;
          }
          return propMatch;
        }
      );
    }

    if (fixedBody !== body) {
      return `style="${fixedBody}"`;
    }
    return match;
  });
}

// ─── Main Fix Pipeline ────────────────────────────────────────────────────────

function applyFixes(code: string, level: FixLevel): { fixedCode: string; fixes: FixResult[] } {
  const fixes: FixResult[] = [];
  let result = code;

  const hasTailwind = /(?:className|class)\s*=/.test(code);
  const hasCSS = /\{[\s\S]*?[a-z-]+\s*:[\s\S]*?\}/.test(code);
  const hasJSXStyle = /style\s*=\s*\{\{/.test(code);
  const hasHTMLStyle = /style\s*=\s*"/.test(code);

  // 1. Spacing fixes
  if (hasCSS) result = fixSpacingInCSS(result, fixes, level);
  if (hasTailwind) result = fixSpacingInTailwind(result, fixes, level);
  if (hasJSXStyle) result = fixJSXInlineStyles(result, fixes, level);
  if (hasHTMLStyle) result = fixHTMLInlineStyles(result, fixes, level);

  // 2. Color fixes
  if (hasCSS || hasHTMLStyle) result = fixColorsInCSS(result, fixes, level);
  if (hasTailwind) result = fixColorsInTailwind(result, fixes);

  // 3. Typography fixes
  if (hasCSS) result = fixTypographyInCSS(result, fixes, level);
  if (hasTailwind) result = fixTypographyInTailwind(result, fixes, level);

  // 4. Layout fixes
  if (hasCSS) result = fixLayoutInCSS(result, fixes, level);
  if (hasTailwind) result = fixLayoutInTailwind(result, fixes, level);

  // 5. Moderate+: add missing padding/line-height
  if (hasCSS && level !== "safe") {
    result = addMissingPaddingCSS(result, fixes, level);
    result = addMissingLineHeightCSS(result, fixes, level);
  }

  return { fixedCode: result, fixes };
}

// ─── Tool Registration ────────────────────────────────────────────────────────

export function registerDesignFix(server: McpServer): void {
  server.tool(
    "design_fix",
    "Fix design issues in UI code automatically. Corrects spacing grid alignment, WCAG contrast violations, typography oddities, and layout problems. Returns corrected code ready to paste.",
    {
      code: z.string().describe("The UI code with design issues (HTML, CSS, React, Vue, or Svelte)"),
      framework: z
        .enum(["react", "vue", "svelte", "html", "auto"])
        .default("auto")
        .describe("Framework hint (auto-detected if not specified)"),
      fix_level: z
        .enum(["safe", "moderate", "aggressive"])
        .default("moderate")
        .describe(
          "Fix intensity: safe = only rule violations, moderate = rules + typography/spacing consistency, aggressive = everything + restructure"
        ),
    },
    async ({ code, framework, fix_level }) => {
      // 1. Parse and score BEFORE
      const parsedBefore = parseCode(code, framework);
      const issuesBefore = runDesignRules(parsedBefore.declarations, ["all"] as FocusArea[]);
      const scoreBefore = calculateScore(issuesBefore);

      // 2. Apply fixes
      const { fixedCode, fixes } = applyFixes(code, fix_level);

      // 3. Parse and score AFTER
      const parsedAfter = parseCode(fixedCode, framework);
      const issuesAfter = runDesignRules(parsedAfter.declarations, ["all"] as FocusArea[]);
      const scoreAfter = calculateScore(issuesAfter);

      // 4. Build the response
      const lines: string[] = [];

      lines.push(`# Design Fix Report`);
      lines.push(``);
      lines.push(`**Framework:** ${parsedBefore.framework}`);
      lines.push(`**Fix level:** ${fix_level}`);
      lines.push(`**Fixes applied:** ${fixes.length}`);
      lines.push(``);

      // Score comparison
      lines.push(`## Score`);
      lines.push(``);
      const delta = scoreAfter - scoreBefore;
      const arrow = delta > 0 ? "+" : "";
      lines.push(`| | Before | After |`);
      lines.push(`|---|---|---|`);
      lines.push(`| **Score** | ${scoreBefore}/100 | ${scoreAfter}/100 (${arrow}${delta}) |`);
      lines.push(`| **Errors** | ${issuesBefore.filter((i) => i.severity === "error").length} | ${issuesAfter.filter((i) => i.severity === "error").length} |`);
      lines.push(`| **Warnings** | ${issuesBefore.filter((i) => i.severity === "warning").length} | ${issuesAfter.filter((i) => i.severity === "warning").length} |`);
      lines.push(`| **Suggestions** | ${issuesBefore.filter((i) => i.severity === "info").length} | ${issuesAfter.filter((i) => i.severity === "info").length} |`);
      lines.push(``);

      // Diff summary
      if (fixes.length > 0) {
        lines.push(`## Changes`);
        lines.push(``);

        const grouped: Record<string, FixResult[]> = {};
        for (const fix of fixes) {
          if (!grouped[fix.category]) grouped[fix.category] = [];
          grouped[fix.category].push(fix);
        }

        for (const [category, categoryFixes] of Object.entries(grouped)) {
          lines.push(`### ${category.charAt(0).toUpperCase() + category.slice(1)}`);
          lines.push(``);
          for (const fix of categoryFixes) {
            lines.push(`- ${fix.description}`);
            lines.push(`  \`${fix.before}\` -> \`${fix.after}\``);
          }
          lines.push(``);
        }
      } else {
        lines.push(`No fixable issues found at the **${fix_level}** level.`);
        lines.push(``);
      }

      // Remaining issues
      if (issuesAfter.length > 0) {
        lines.push(`## Remaining Issues`);
        lines.push(``);
        for (const issue of issuesAfter) {
          lines.push(`- **[${issue.severity}]** [${issue.category}] ${issue.message}`);
        }
        lines.push(``);
      }

      // Fixed code
      lines.push(`## Fixed Code`);
      lines.push(``);
      lines.push("```");
      lines.push(fixedCode);
      lines.push("```");

      return {
        content: [{ type: "text" as const, text: lines.join("\n") }],
      };
    }
  );
}
