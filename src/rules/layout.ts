import type { StyleDeclaration } from "../parsers/css-extractor.js";
import type { DesignIssue } from "./types.js";
import { parseCSSValue, toPx } from "../utils/css-value-parser.js";
import { READABLE_MAX_WIDTH } from "../constants.js";

export function checkLayout(declarations: StyleDeclaration[]): DesignIssue[] {
  const issues: DesignIssue[] = [];

  let hasMaxWidth = false;
  let hasTextContent = false;
  const zIndexValues: number[] = [];
  const textAligns: string[] = [];

  for (const decl of declarations) {
    if (decl.property === "max-width") {
      hasMaxWidth = true;
      const parsed = parseCSSValue(decl.value);
      if (parsed) {
        const px = toPx(parsed);
        if (px !== null && px > READABLE_MAX_WIDTH.max + 200) {
          issues.push({
            severity: "info",
            category: "layout",
            message: `\`max-width: ${decl.value}\` may be too wide for comfortable text reading.`,
            suggestion: `Optimal reading width is ${READABLE_MAX_WIDTH.min}–${READABLE_MAX_WIDTH.max}px (45–75 characters per line).`,
            line: decl.line,
          });
        }
      }
    }

    if (decl.property === "font-size" || decl.property === "color") {
      hasTextContent = true;
    }

    if (decl.property === "z-index") {
      const val = parseInt(decl.value);
      if (!isNaN(val)) {
        zIndexValues.push(val);
        if (val > 100) {
          issues.push({
            severity: "warning",
            category: "layout",
            message: `\`z-index: ${val}\` is excessively high.`,
            suggestion: `Use a structured z-index scale (1, 10, 20, 30, 40, 50) to prevent z-index wars.`,
            line: decl.line,
          });
        }
      }
    }

    if (decl.property === "text-align") {
      textAligns.push(decl.value);
    }
  }

  // No max-width for text containers
  if (hasTextContent && !hasMaxWidth) {
    issues.push({
      severity: "info",
      category: "layout",
      message: "No `max-width` set — text may stretch too wide on large screens.",
      suggestion: `Add \`max-width: ${READABLE_MAX_WIDTH.max}px\` or \`max-width: 65ch\` for optimal readability.`,
    });
  }

  // Inconsistent text alignment
  const uniqueAligns = [...new Set(textAligns)];
  if (uniqueAligns.length > 2) {
    issues.push({
      severity: "warning",
      category: "layout",
      message: `Mixed text alignments (${uniqueAligns.join(", ")}) create a disorganized appearance.`,
      suggestion: "Stick to 1–2 alignment styles per component (typically left + center).",
    });
  }

  return issues;
}
