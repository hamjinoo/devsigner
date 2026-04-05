import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { parseCode } from "../parsers/index.js";
import { runDesignRules, calculateScore, type FocusArea, type RuleContext } from "../rules/index.js";
import { getRangesForContext } from "../data/reference-ranges.js";
import { detectPageType, suggestIndustry } from "../context/page-type-detector.js";
import { computeScorecard } from "../scoring/calculators.js";
import { formatScorecard } from "../scoring/dimensions.js";
import { findChrome, wrapInHTML } from "./render-and-review.js";

export function registerDesignReview(server: McpServer): void {
  server.tool(
    "design_review",
    "Analyze UI code and provide actionable design feedback on spacing, color, typography, and layout. Returns a rendered screenshot of your code plus a detailed report with scores compared against 101 real-world reference sites.",
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
      industry: z
        .string()
        .optional()
        .describe("Industry context for reference comparison (e.g., 'saas', 'fintech', 'ecommerce', 'developer_tools')"),
      visual: z
        .boolean()
        .default(true)
        .describe("Include a rendered screenshot of the code"),
    },
    async ({ code, framework, focus, industry, visual }) => {
      const parsed = parseCode(code, framework);

      // Auto-detect page type and industry if not provided
      const pageType = detectPageType(code);
      const effectiveIndustry = industry ?? suggestIndustry(pageType);

      // Build reference-aware context
      const ranges = getRangesForContext(effectiveIndustry);
      const ruleContext: RuleContext = {
        industry: effectiveIndustry ?? ranges.industry,
        pageType,
        ranges,
      };

      const issues = runDesignRules(parsed.declarations, focus as FocusArea[], parsed.blocks, undefined, ruleContext);
      const score = calculateScore(issues);

      const errors = issues.filter((i) => i.severity === "error");
      const warnings = issues.filter((i) => i.severity === "warning");
      const infos = issues.filter((i) => i.severity === "info");

      const industryLabel = ruleContext.industry === "all" ? "101 reference sites" : `${ruleContext.industry} reference sites`;

      let summary: string;
      if (score >= 90) {
        summary = `Excellent! Your UI code is within the design standards of ${industryLabel}.`;
      } else if (score >= 70) {
        summary = `Good foundation, but some areas fall outside the typical range for ${industryLabel}.`;
      } else if (score >= 50) {
        summary = `Several design issues found compared to ${industryLabel}. Addressing these will significantly improve the UI.`;
      } else {
        summary = `Major design issues detected compared to ${industryLabel}. Consider reviewing the suggestions carefully.`;
      }

      // Compute multi-dimensional scorecard
      const scorecard = computeScorecard(parsed.declarations, parsed.blocks, {
        pageType,
        ranges,
        code,
      });

      const lines = [
        `# Design Review Report`,
        ``,
        `**Framework detected:** ${parsed.framework}`,
        `**Page type detected:** ${pageType}`,
        `**Compared against:** ${industryLabel} (${ranges.sampleSize} sites)`,
        `**Summary:** ${summary}`,
        ``,
        formatScorecard(scorecard),
        ``,
        `**Rule issues:** ${errors.length} errors, ${warnings.length} warnings, ${infos.length} suggestions`,
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

      // Build response with optional screenshot
      const content: Array<{ type: "image"; data: string; mimeType: string } | { type: "text"; text: string }> = [];

      if (visual) {
        try {
          const chromePath = await findChrome();
          if (chromePath) {
            const puppeteer = await import("puppeteer-core");
            const browser = await puppeteer.default.launch({
              executablePath: chromePath,
              headless: true,
              args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
            });
            try {
              const page = await browser.newPage();
              await page.setViewport({ width: 1280, height: 800 });
              const html = wrapInHTML(code, { width: 1280, height: 800 });
              await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 15000 });
              await new Promise((r) => setTimeout(r, 400));
              const screenshot = (await page.screenshot({ type: "png", encoding: "base64" })) as string;
              await page.close();
              content.push({ type: "image" as const, data: screenshot, mimeType: "image/png" });
            } finally {
              await browser.close();
            }
          }
        } catch {
          // Chrome not available — skip screenshot silently
        }
      }

      content.push({ type: "text" as const, text: lines.join("\n") });

      return { content };
    }
  );
}
