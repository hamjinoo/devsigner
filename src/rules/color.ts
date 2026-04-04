import type { StyleDeclaration, StyleBlock } from "../parsers/css-extractor.js";
import type { DesignIssue } from "./types.js";
import type { DevsignerConfig } from "../config/project-config.js";
import { parseColor, contrastRatio, rgbToHex } from "../utils/color-utils.js";
import { WCAG_AA_NORMAL, WCAG_AA_LARGE, WCAG_AAA_NORMAL, WCAG_AAA_LARGE, MAX_DISTINCT_COLORS } from "../constants.js";
import { isRuleIgnored, isAllowedColor } from "../config/project-config.js";

export function checkColors(
  declarations: StyleDeclaration[],
  blocks: StyleBlock[] = [],
  config?: DevsignerConfig,
): DesignIssue[] {
  const issues: DesignIssue[] = [];

  const maxDistinctColors = config?.rules.color.maxDistinctColors ?? MAX_DISTINCT_COLORS;
  const contrastLevel = config?.rules.color.contrastLevel ?? "AA";
  const allowPureBlack = config?.rules.color.allowPureBlack ?? false;
  const allowPureWhite = config?.rules.color.allowPureWhite ?? false;

  // Select correct WCAG thresholds based on configured contrast level
  const contrastNormal = contrastLevel === "AAA" ? WCAG_AAA_NORMAL : WCAG_AA_NORMAL;
  const contrastLarge = contrastLevel === "AAA" ? WCAG_AAA_LARGE : WCAG_AA_LARGE;

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

  // -- Contrast checks: block-aware (only compare co-located color pairs) --
  if (!(config && isRuleIgnored(config, "color.contrast"))) {
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

      if (textColor && bgColor) {
        checkContrastPair(textColor, bgColor, reportedPairs, issues, contrastNormal, contrastLarge);
      } else if (textColor && !bgColor) {
        checkContrastPair(textColor, "#ffffff", reportedPairs, issues, contrastNormal, contrastLarge);
      }
    }
  }

  // -- Pure black/white: only flag when there are 3+ instances --
  if (!allowPureBlack && !(config && isRuleIgnored(config, "color.pureBlack"))) {
    const pureBlackCount = allColors.filter((c) => c === "#000000").length;
    if (pureBlackCount >= 3) {
      issues.push({
        severity: "info",
        category: "color",
        message: `Pure black \`#000000\` used ${pureBlackCount} times — can feel harsh against most backgrounds.`,
        suggestion: "Try `#1a1a1a` or `#111827` for a softer dark tone.",
      });
    }
  }

  if (!allowPureWhite && !(config && isRuleIgnored(config, "color.pureWhite"))) {
    const pureWhiteCount = allColors.filter((c) => c === "#ffffff").length;
    if (pureWhiteCount >= 3) {
      issues.push({
        severity: "info",
        category: "color",
        message: `Pure white \`#ffffff\` used ${pureWhiteCount} times — can cause eye strain.`,
        suggestion: "Try `#fafafa` or `#f9fafb` for a gentler background.",
      });
    }
  }

  // -- Color count check --
  if (!(config && isRuleIgnored(config, "color.count"))) {
    // Filter out allowed colors before counting
    const filteredColors = config
      ? allColors.filter((c) => !isAllowedColor(config, c))
      : allColors;
    const uniqueHues = [...new Set(filteredColors)];
    if (uniqueHues.length > maxDistinctColors) {
      issues.push({
        severity: "warning",
        category: "color",
        message: `Found ${uniqueHues.length} distinct colors — too many colors create a chaotic look.`,
        suggestion: `Limit your palette to ${maxDistinctColors} or fewer colors. Use a design system with primary, secondary, and accent colors.`,
      });
    }
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
  issues: DesignIssue[],
  thresholdNormal: number,
  thresholdLarge: number,
): void {
  if (text.toLowerCase() === bg.toLowerCase()) return;

  const pairKey = `${text}|${bg}`;
  if (reportedPairs.has(pairKey)) return;
  reportedPairs.add(pairKey);

  const textRgb = parseColor(text);
  const bgRgb = parseColor(bg);
  if (!textRgb || !bgRgb) return;

  const ratio = contrastRatio(textRgb, bgRgb);

  if (ratio < thresholdLarge) {
    issues.push({
      severity: "error",
      category: "color",
      message: `Low contrast: text \`${text}\` on background \`${bg}\` has ratio ${ratio.toFixed(2)}:1.`,
      suggestion: `WCAG requires at least ${thresholdNormal}:1 for normal text, ${thresholdLarge}:1 for large text. Adjust the text or background color.`,
    });
  } else if (ratio < thresholdNormal) {
    issues.push({
      severity: "warning",
      category: "color",
      message: `Marginal contrast: text \`${text}\` on background \`${bg}\` has ratio ${ratio.toFixed(2)}:1.`,
      suggestion: `Passes for large text only (>=${thresholdLarge}:1). For normal text, increase contrast to at least ${thresholdNormal}:1.`,
    });
  }
}
