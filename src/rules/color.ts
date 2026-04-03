import type { StyleDeclaration, StyleBlock } from "../parsers/css-extractor.js";
import type { DesignIssue } from "./types.js";
import { parseColor, contrastRatio, rgbToHex } from "../utils/color-utils.js";
import { WCAG_AA_NORMAL, WCAG_AA_LARGE, MAX_DISTINCT_COLORS } from "../constants.js";

export function checkColors(declarations: StyleDeclaration[], blocks: StyleBlock[] = []): DesignIssue[] {
  const issues: DesignIssue[] = [];

  const allColors: string[] = [];

  // Collect all colors from flat declarations (for color count + pure black/white checks)
  for (const decl of declarations) {
    const rgb = parseColor(decl.value);
    if (!rgb) continue;

    const hex = rgbToHex(rgb);

    if (
      decl.property === "color" ||
      decl.property === "background-color" ||
      decl.property === "background" ||
      decl.property === "border-color"
    ) {
      allColors.push(hex);
    }
  }

  // ── Contrast checks: block-aware (only compare co-located color pairs) ──
  // Track which color pairs we've already reported to avoid duplicates
  const reportedPairs = new Set<string>();

  for (const block of blocks) {
    let textColor: string | null = null;
    let bgColor: string | null = null;

    for (const decl of block.declarations) {
      const rgb = parseColor(decl.value);
      if (!rgb) continue;

      const hex = rgbToHex(rgb);

      if (decl.property === "color") {
        textColor = hex;
      } else if (decl.property === "background-color" || decl.property === "background") {
        bgColor = hex;
      }
    }

    // Case 1: Both text color and background color on the same element — check contrast
    if (textColor && bgColor) {
      checkContrastPair(textColor, bgColor, reportedPairs, issues);
    }
    // Case 2: Text color without a background on the same element — assume white default
    else if (textColor && !bgColor) {
      checkContrastPair(textColor, "#ffffff", reportedPairs, issues);
    }
    // Case 3: Only background color, no text — skip contrast check
  }

  // ── Pure black/white: only flag when there are 3+ instances ──
  const pureBlackCount = allColors.filter((c) => c === "#000000").length;
  const pureWhiteCount = allColors.filter((c) => c === "#ffffff").length;

  if (pureBlackCount >= 3) {
    issues.push({
      severity: "info",
      category: "color",
      message: `Pure black \`#000000\` used ${pureBlackCount} times — can feel harsh against most backgrounds.`,
      suggestion: "Try `#1a1a1a` or `#111827` for a softer dark tone.",
    });
  }
  if (pureWhiteCount >= 3) {
    issues.push({
      severity: "info",
      category: "color",
      message: `Pure white \`#ffffff\` used ${pureWhiteCount} times — can cause eye strain.`,
      suggestion: "Try `#fafafa` or `#f9fafb` for a gentler background.",
    });
  }

  // ── Color count check ──
  const uniqueHues = [...new Set(allColors)];
  if (uniqueHues.length > MAX_DISTINCT_COLORS) {
    issues.push({
      severity: "warning",
      category: "color",
      message: `Found ${uniqueHues.length} distinct colors — too many colors create a chaotic look.`,
      suggestion: `Limit your palette to ${MAX_DISTINCT_COLORS} or fewer colors. Use a design system with primary, secondary, and accent colors.`,
    });
  }

  return issues;
}

/**
 * Check contrast between a text/bg pair.
 * Only reports each unique pair once.
 */
function checkContrastPair(
  text: string,
  bg: string,
  reportedPairs: Set<string>,
  issues: DesignIssue[]
): void {
  // Deduplicate: normalize pair key so we don't report the same combo twice
  // Skip if text and background are the same color (happens when color is used as background on badges etc.)
  if (text.toLowerCase() === bg.toLowerCase()) return;

  const pairKey = `${text}|${bg}`;
  if (reportedPairs.has(pairKey)) return;
  reportedPairs.add(pairKey);

  const textRgb = parseColor(text);
  const bgRgb = parseColor(bg);
  if (!textRgb || !bgRgb) return;

  const ratio = contrastRatio(textRgb, bgRgb);

  if (ratio < WCAG_AA_LARGE) {
    issues.push({
      severity: "error",
      category: "color",
      message: `Low contrast: text \`${text}\` on background \`${bg}\` has ratio ${ratio.toFixed(2)}:1.`,
      suggestion: `WCAG AA requires at least ${WCAG_AA_NORMAL}:1 for normal text, ${WCAG_AA_LARGE}:1 for large text. Adjust the text or background color.`,
    });
  } else if (ratio < WCAG_AA_NORMAL) {
    issues.push({
      severity: "warning",
      category: "color",
      message: `Marginal contrast: text \`${text}\` on background \`${bg}\` has ratio ${ratio.toFixed(2)}:1.`,
      suggestion: `Passes WCAG AA for large text only (≥${WCAG_AA_LARGE}:1). For normal text, increase contrast to at least ${WCAG_AA_NORMAL}:1.`,
    });
  }
}
