import type { StyleDeclaration, StyleBlock } from "../parsers/css-extractor.js";
import type { DesignIssue, RuleContext } from "./types.js";
import type { DevsignerConfig } from "../config/project-config.js";
import { checkSpacing } from "./spacing.js";
import { checkColors } from "./color.js";
import { checkTypography } from "./typography.js";
import { checkLayout } from "./layout.js";

export type FocusArea = "spacing" | "color" | "typography" | "layout" | "all";

export function runDesignRules(
  declarations: StyleDeclaration[],
  focus: FocusArea[] = ["all"],
  blocks: StyleBlock[] = [],
  config?: DevsignerConfig,
  context?: RuleContext,
): DesignIssue[] {
  const issues: DesignIssue[] = [];
  const runAll = focus.includes("all");

  if (runAll || focus.includes("spacing")) {
    issues.push(...checkSpacing(declarations, config, context));
  }

  if (runAll || focus.includes("color")) {
    issues.push(...checkColors(declarations, blocks, config, context));
  }

  if (runAll || focus.includes("typography")) {
    issues.push(...checkTypography(declarations, config, context));
  }

  if (runAll || focus.includes("layout")) {
    issues.push(...checkLayout(declarations, config, context));
  }

  return issues;
}

export function calculateScore(issues: DesignIssue[]): number {
  let score = 100;

  // Deduplicate: only count unique issue messages to avoid penalizing repeated patterns
  const seen = new Set<string>();
  for (const issue of issues) {
    const key = `${issue.severity}:${issue.category}:${issue.message}`;
    if (seen.has(key)) continue;
    seen.add(key);

    switch (issue.severity) {
      case "error":
        score -= 10;
        break;
      case "warning":
        score -= 4;
        break;
      case "info":
        score -= 1;
        break;
    }
  }

  return Math.max(0, score);
}

export { type DesignIssue, type Severity, type Category, type RuleContext } from "./types.js";
