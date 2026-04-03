import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { parseCode } from "../parsers/index.js";
import { runDesignRules, calculateScore, type FocusArea } from "../rules/index.js";

export function registerDesignReview(server: McpServer): void {
  server.tool(
    "design_review",
    "Analyze UI code and provide actionable design feedback on spacing, color, typography, and layout. Paste any HTML, CSS, React, Vue, or Svelte code.",
    {
      code: z.string().describe("The UI code to review (HTML, CSS, React, Vue, or Svelte)"),
      framework: z
        .enum(["react", "vue", "svelte", "html", "auto"])
        .default("auto")
        .describe("Framework hint (auto-detected if not specified)"),
      focus: z
        .array(z.enum(["spacing", "color", "typography", "layout", "all"]))
        .default(["all"])
        .describe("Which design aspects to review"),
    },
    async ({ code, framework, focus }) => {
      const parsed = parseCode(code, framework);
      const issues = runDesignRules(parsed.declarations, focus as FocusArea[]);
      const score = calculateScore(issues);

      const errors = issues.filter((i) => i.severity === "error");
      const warnings = issues.filter((i) => i.severity === "warning");
      const infos = issues.filter((i) => i.severity === "info");

      let summary: string;
      if (score >= 90) {
        summary = "Excellent! Your UI code follows solid design principles.";
      } else if (score >= 70) {
        summary = "Good foundation, but there are some design improvements to make.";
      } else if (score >= 50) {
        summary = "Several design issues found. Addressing these will significantly improve the UI.";
      } else {
        summary = "Major design issues detected. Consider reviewing the suggestions carefully.";
      }

      const lines = [
        `# Design Review Report`,
        ``,
        `**Framework detected:** ${parsed.framework}`,
        `**Design Score:** ${score}/100`,
        `**Summary:** ${summary}`,
        ``,
        `**Issues found:** ${errors.length} errors, ${warnings.length} warnings, ${infos.length} suggestions`,
        ``,
      ];

      if (errors.length > 0) {
        lines.push(`## Errors (Must Fix)`);
        for (const issue of errors) {
          lines.push(`- **[${issue.category}]** ${issue.message}`);
          lines.push(`  → ${issue.suggestion}`);
        }
        lines.push(``);
      }

      if (warnings.length > 0) {
        lines.push(`## Warnings (Should Fix)`);
        for (const issue of warnings) {
          lines.push(`- **[${issue.category}]** ${issue.message}`);
          lines.push(`  → ${issue.suggestion}`);
        }
        lines.push(``);
      }

      if (infos.length > 0) {
        lines.push(`## Suggestions (Nice to Have)`);
        for (const issue of infos) {
          lines.push(`- **[${issue.category}]** ${issue.message}`);
          lines.push(`  → ${issue.suggestion}`);
        }
      }

      return {
        content: [{ type: "text" as const, text: lines.join("\n") }],
      };
    }
  );
}
