import type { StyleDeclaration } from "../parsers/css-extractor.js";
import type { DesignIssue } from "./types.js";
import { checkSpacing } from "./spacing.js";
import { checkColors } from "./color.js";
import { checkTypography } from "./typography.js";
import { checkLayout } from "./layout.js";

export type FocusArea = "spacing" | "color" | "typography" | "layout" | "all";

export function runDesignRules(
  declarations: StyleDeclaration[],
  focus: FocusArea[] = ["all"]
): DesignIssue[] {
  const issues: DesignIssue[] = [];
  const runAll = focus.includes("all");

  if (runAll || focus.includes("spacing")) {
    issues.push(...checkSpacing(declarations));
  }

  if (runAll || focus.includes("color")) {
    issues.push(...checkColors(declarations));
  }

  if (runAll || focus.includes("typography")) {
    issues.push(...checkTypography(declarations));
  }

  if (runAll || focus.includes("layout")) {
    issues.push(...checkLayout(declarations));
  }

  return issues;
}

export function calculateScore(issues: DesignIssue[]): number {
  let score = 100;

  for (const issue of issues) {
    switch (issue.severity) {
      case "error":
        score -= 10;
        break;
      case "warning":
        score -= 5;
        break;
      case "info":
        score -= 2;
        break;
    }
  }

  return Math.max(0, score);
}

export { type DesignIssue, type Severity, type Category } from "./types.js";
