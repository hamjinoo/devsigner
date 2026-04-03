import type { StyleDeclaration } from "../parsers/css-extractor.js";
import type { DesignIssue } from "./types.js";
import { parseCSSValue, toPx } from "../utils/css-value-parser.js";
import { GRID_BASE, GRID_PREFERRED, SPACING_SCALE } from "../constants.js";

export function checkSpacing(declarations: StyleDeclaration[]): DesignIssue[] {
  const issues: DesignIssue[] = [];

  const spacingProps = [
    "padding", "padding-top", "padding-right", "padding-bottom", "padding-left",
    "margin", "margin-top", "margin-right", "margin-bottom", "margin-left",
    "gap", "row-gap", "column-gap",
  ];

  const spacingValues: number[] = [];

  for (const decl of declarations) {
    if (!spacingProps.includes(decl.property)) continue;

    const parsed = parseCSSValue(decl.value);
    if (!parsed) continue;

    const px = toPx(parsed);
    if (px === null || px === 0) continue;

    spacingValues.push(px);

    // Check 4px grid alignment
    if (px % GRID_BASE !== 0) {
      const nearest = Math.round(px / GRID_BASE) * GRID_BASE;
      issues.push({
        severity: "warning",
        category: "spacing",
        message: `\`${decl.property}: ${decl.value}\` is not aligned to the ${GRID_BASE}px grid.`,
        suggestion: `Use \`${decl.property}: ${nearest}px\` instead (${GRID_BASE}px grid alignment).`,
        line: decl.line,
      });
    }
    // Prefer 8px multiples
    else if (px % GRID_PREFERRED !== 0 && px > GRID_PREFERRED) {
      const nearest = Math.round(px / GRID_PREFERRED) * GRID_PREFERRED;
      issues.push({
        severity: "info",
        category: "spacing",
        message: `\`${decl.property}: ${decl.value}\` — consider using ${GRID_PREFERRED}px multiples for major spacing.`,
        suggestion: `\`${decl.property}: ${nearest}px\` would follow the ${GRID_PREFERRED}px grid system.`,
        line: decl.line,
      });
    }
  }

  // Check spacing consistency
  const uniqueValues = [...new Set(spacingValues)];
  if (uniqueValues.length > 6) {
    const closest = uniqueValues.map((v) => {
      return SPACING_SCALE.reduce((prev, curr) =>
        Math.abs(curr - v) < Math.abs(prev - v) ? curr : prev
      );
    });
    const recommended = [...new Set(closest)].sort((a, b) => a - b);

    issues.push({
      severity: "warning",
      category: "spacing",
      message: `Found ${uniqueValues.length} different spacing values — this creates visual inconsistency.`,
      suggestion: `Consolidate to a spacing scale: ${recommended.join(", ")}px.`,
    });
  }

  return issues;
}
