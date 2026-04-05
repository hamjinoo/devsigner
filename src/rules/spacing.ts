import type { StyleDeclaration } from "../parsers/css-extractor.js";
import type { DesignIssue, RuleContext } from "./types.js";
import type { DevsignerConfig } from "../config/project-config.js";
import { parseCSSValue, toPx } from "../utils/css-value-parser.js";
import { GRID_BASE, GRID_PREFERRED, SPACING_SCALE } from "../constants.js";
import { isRuleIgnored } from "../config/project-config.js";

export function checkSpacing(
  declarations: StyleDeclaration[],
  config?: DevsignerConfig,
  context?: RuleContext,
): DesignIssue[] {
  const issues: DesignIssue[] = [];

  const gridBase = config?.rules.spacing.gridBase ?? GRID_BASE;
  const gridPreferred = config?.rules.spacing.gridPreferred ?? GRID_PREFERRED;
  const maxDistinctValues = config?.rules.spacing.maxDistinctValues ?? 6;

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

    // Check base grid alignment
    if (px % gridBase !== 0 && !(config && isRuleIgnored(config, "spacing.gridBase"))) {
      const nearest = Math.round(px / gridBase) * gridBase;
      issues.push({
        severity: "warning",
        category: "spacing",
        message: `\`${decl.property}: ${decl.value}\` is not aligned to the ${gridBase}px grid.`,
        suggestion: `Use \`${decl.property}: ${nearest}px\` instead (${gridBase}px grid alignment).`,
        line: decl.line,
      });
    }
    // Prefer preferred grid multiples
    else if (
      px % gridPreferred !== 0 &&
      px > gridPreferred &&
      !(config && isRuleIgnored(config, "spacing.gridPreferred"))
    ) {
      const nearest = Math.round(px / gridPreferred) * gridPreferred;
      issues.push({
        severity: "info",
        category: "spacing",
        message: `\`${decl.property}: ${decl.value}\` — consider using ${gridPreferred}px multiples for major spacing.`,
        suggestion: `\`${decl.property}: ${nearest}px\` would follow the ${gridPreferred}px grid system.`,
        line: decl.line,
      });
    }
  }

  // Check spacing consistency
  if (!(config && isRuleIgnored(config, "spacing.consistency"))) {
    const uniqueValues = [...new Set(spacingValues)];

    // Use reference ranges if available
    const refRanges = context?.ranges;
    const effectiveMax = refRanges
      ? refRanges.spacingUniqueCount.p75
      : maxDistinctValues;

    if (uniqueValues.length > effectiveMax) {
      const closest = uniqueValues.map((v) => {
        return SPACING_SCALE.reduce((prev, curr) =>
          Math.abs(curr - v) < Math.abs(prev - v) ? curr : prev
        );
      });
      const recommended = [...new Set(closest)].sort((a, b) => a - b);

      const industryLabel = context?.industry ?? "reference";
      const suggestion = refRanges
        ? `${industryLabel} sites typically use ${refRanges.spacingUniqueCount.p25}-${refRanges.spacingUniqueCount.p75} spacing values (median ${refRanges.spacingUniqueCount.median}). Consolidate to: ${recommended.join(", ")}px.`
        : `Consolidate to a spacing scale: ${recommended.join(", ")}px.`;

      issues.push({
        severity: "warning",
        category: "spacing",
        message: `Found ${uniqueValues.length} different spacing values — above the typical range${refRanges ? ` for ${industryLabel} sites` : ""}.`,
        suggestion,
      });
    }
  }

  return issues;
}
