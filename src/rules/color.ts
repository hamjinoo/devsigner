import type { StyleDeclaration } from "../parsers/css-extractor.js";
import type { DesignIssue } from "./types.js";
import { parseColor, contrastRatio, rgbToHex } from "../utils/color-utils.js";
import { WCAG_AA_NORMAL, WCAG_AA_LARGE, MAX_DISTINCT_COLORS } from "../constants.js";

export function checkColors(declarations: StyleDeclaration[]): DesignIssue[] {
  const issues: DesignIssue[] = [];

  const textColors: string[] = [];
  const bgColors: string[] = [];
  const allColors: string[] = [];

  for (const decl of declarations) {
    const rgb = parseColor(decl.value);
    if (!rgb) continue;

    const hex = rgbToHex(rgb);

    if (decl.property === "color") {
      textColors.push(hex);
      allColors.push(hex);
    } else if (decl.property === "background-color" || decl.property === "background") {
      bgColors.push(hex);
      allColors.push(hex);
    } else if (decl.property === "border-color") {
      allColors.push(hex);
    }
  }

  // Check contrast ratios between text and background colors
  for (const text of textColors) {
    for (const bg of bgColors) {
      const textRgb = parseColor(text);
      const bgRgb = parseColor(bg);
      if (!textRgb || !bgRgb) continue;

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
  }

  // Check for pure black/white
  for (const hex of allColors) {
    if (hex === "#000000") {
      issues.push({
        severity: "info",
        category: "color",
        message: "Pure black `#000000` can feel harsh against most backgrounds.",
        suggestion: "Try `#1a1a1a` or `#111827` for a softer dark tone.",
      });
    }
    if (hex === "#ffffff") {
      issues.push({
        severity: "info",
        category: "color",
        message: "Pure white `#ffffff` backgrounds can cause eye strain.",
        suggestion: "Try `#fafafa` or `#f9fafb` for a gentler background.",
      });
    }
  }

  // Check color count
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
