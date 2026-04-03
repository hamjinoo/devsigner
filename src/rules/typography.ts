import type { StyleDeclaration } from "../parsers/css-extractor.js";
import type { DesignIssue } from "./types.js";
import { parseCSSValue, toPx } from "../utils/css-value-parser.js";
import {
  MAX_DISTINCT_FONT_SIZES,
  MAX_DISTINCT_FONT_WEIGHTS,
  OPTIMAL_LINE_HEIGHT_BODY,
} from "../constants.js";

export function checkTypography(declarations: StyleDeclaration[]): DesignIssue[] {
  const issues: DesignIssue[] = [];

  const fontSizes: number[] = [];
  const fontWeights: string[] = [];
  const lineHeights: { value: number; fontSize?: number; line?: number }[] = [];

  for (const decl of declarations) {
    if (decl.property === "font-size") {
      const parsed = parseCSSValue(decl.value);
      if (parsed) {
        const px = toPx(parsed);
        if (px !== null) fontSizes.push(px);
      }
    }

    if (decl.property === "font-weight") {
      fontWeights.push(decl.value);
    }

    if (decl.property === "line-height") {
      const parsed = parseCSSValue(decl.value);
      if (parsed) {
        if (parsed.unit === "px") {
          lineHeights.push({ value: parsed.value, line: decl.line });
        } else {
          // unitless or em — treat as multiplier
          lineHeights.push({ value: parsed.value, line: decl.line });
        }
      }
    }
  }

  // Check font size count
  const uniqueSizes = [...new Set(fontSizes)];
  if (uniqueSizes.length > MAX_DISTINCT_FONT_SIZES) {
    issues.push({
      severity: "warning",
      category: "typography",
      message: `Found ${uniqueSizes.length} distinct font sizes — too many sizes break visual hierarchy.`,
      suggestion: `Use a type scale with ${MAX_DISTINCT_FONT_SIZES} or fewer sizes (e.g., 12, 14, 16, 20, 24, 32px).`,
    });
  }

  // Check for non-standard font sizes
  for (const size of uniqueSizes) {
    if (size > 10 && size < 20 && size % 2 !== 0) {
      issues.push({
        severity: "info",
        category: "typography",
        message: `Font size ${size}px is an unusual value.`,
        suggestion: `Use even-numbered sizes for cleaner rendering: ${Math.floor(size / 2) * 2}px or ${Math.ceil(size / 2) * 2}px.`,
      });
    }
  }

  // Check hierarchy (heading sizes should step up by at least ~20%)
  const sortedSizes = [...uniqueSizes].sort((a, b) => a - b);
  for (let i = 1; i < sortedSizes.length; i++) {
    const ratio = sortedSizes[i] / sortedSizes[i - 1];
    if (ratio < 1.1 && sortedSizes[i] > 14) {
      issues.push({
        severity: "info",
        category: "typography",
        message: `Font sizes ${sortedSizes[i - 1]}px and ${sortedSizes[i]}px are too close (ratio: ${ratio.toFixed(2)}).`,
        suggestion: `Ensure at least 1.2x ratio between type scale steps for clear visual hierarchy.`,
      });
    }
  }

  // Check font weight count
  const uniqueWeights = [...new Set(fontWeights)];
  if (uniqueWeights.length > MAX_DISTINCT_FONT_WEIGHTS) {
    issues.push({
      severity: "warning",
      category: "typography",
      message: `Found ${uniqueWeights.length} font weights — excessive weight variation is distracting.`,
      suggestion: `Limit to ${MAX_DISTINCT_FONT_WEIGHTS} weights: regular (400), medium (500), and bold (700).`,
    });
  }

  // Check line heights
  for (const lh of lineHeights) {
    // If value is small (< 4), it's likely a multiplier
    if (lh.value > 0 && lh.value < 4) {
      if (lh.value < OPTIMAL_LINE_HEIGHT_BODY.min) {
        issues.push({
          severity: "warning",
          category: "typography",
          message: `Line height ${lh.value} is too tight for body text.`,
          suggestion: `Use line-height ${OPTIMAL_LINE_HEIGHT_BODY.min}–${OPTIMAL_LINE_HEIGHT_BODY.max} for comfortable reading.`,
          line: lh.line,
        });
      }
    }
  }

  return issues;
}
