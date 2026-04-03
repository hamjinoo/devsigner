import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import puppeteer from "puppeteer-core";
import { parseCode } from "../parsers/index.js";
import { runDesignRules, calculateScore, type FocusArea } from "../rules/index.js";
import type { DesignIssue } from "../rules/types.js";
import { applyFixes, type FixLevel, type FixResult } from "./design-fix.js";
import { findChrome, wrapInHTML } from "./render-and-review.js";

// ─── Types ───────────────────────────────────────────────────────────────────

interface IterationLog {
  iteration: number;
  score: number;
  issuesFixed: number;
  issuesRemaining: number;
  fixesApplied: string[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function renderToScreenshot(
  page: puppeteer.Page,
  code: string,
  viewport: { width: number; height: number },
): Promise<string> {
  const html = wrapInHTML(code, viewport);
  await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 30000 });
  // Allow CSS transitions / animations to settle
  await new Promise((r) => setTimeout(r, 500));
  const screenshot = await page.screenshot({
    type: "png",
    fullPage: false,
    encoding: "base64",
  });
  return screenshot as string;
}

function reviewCode(
  code: string,
  framework: string,
): { score: number; issues: DesignIssue[] } {
  const parsed = parseCode(code, framework);
  const issues = runDesignRules(parsed.declarations, ["all"] as FocusArea[], parsed.blocks);
  const score = calculateScore(issues);
  return { score, issues };
}

// ─── Tool Registration ───────────────────────────────────────────────────────

export function registerDesignIterate(server: McpServer): void {
  server.tool(
    "design_iterate",
    "Iteratively improve UI code through an automated render-review-fix loop. " +
      "Renders the code in a real browser, reviews it against design rules, applies fixes, " +
      "re-renders, and compares scores — repeating until the score reaches 90+, " +
      "no further improvement is made, or max iterations are reached. " +
      "Returns before/after screenshots, score progression, all fixes applied, and the final code.",
    {
      code: z.string().describe("UI code to improve (HTML, CSS, React, Vue, or Svelte)"),
      framework: z
        .enum(["react", "vue", "svelte", "html", "auto"])
        .default("auto")
        .describe("Framework hint (auto-detected if not specified)"),
      fix_level: z
        .enum(["safe", "moderate", "aggressive"])
        .default("moderate")
        .describe(
          "Fix intensity: safe = only rule violations, moderate = rules + consistency, aggressive = everything + restructure",
        ),
      max_iterations: z
        .number()
        .int()
        .min(1)
        .max(5)
        .default(3)
        .describe("Maximum number of fix iterations (default 3, max 5)"),
    },
    async ({ code, framework, fix_level, max_iterations }) => {
      // ── Find Chrome ──────────────────────────────────────────────────
      const chromePath = await findChrome();
      if (!chromePath) {
        return {
          content: [
            {
              type: "text" as const,
              text:
                "Could not find Chrome or Edge browser installed. " +
                "Please install Google Chrome or Microsoft Edge to use design_iterate.\n\n" +
                "Expected locations:\n" +
                "- Windows: C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe\n" +
                "- macOS: /Applications/Google Chrome.app\n" +
                "- Linux: /usr/bin/google-chrome",
            },
          ],
          isError: true,
        };
      }

      let browser: puppeteer.Browser | null = null;

      try {
        // ── Launch browser ONCE ──────────────────────────────────────────
        browser = await puppeteer.launch({
          executablePath: chromePath,
          headless: true,
          args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
        });

        const page = await browser.newPage();
        const viewport = { width: 1280, height: 800 };
        await page.setViewport(viewport);

        // Detect framework once
        const detectedFramework = parseCode(code, framework).framework;

        // ── Step 1: Render original ──────────────────────────────────────
        const originalScreenshot = await renderToScreenshot(page, code, viewport);

        // ── Step 2: Initial review ───────────────────────────────────────
        const initialReview = reviewCode(code, framework);

        // ── Iteration loop ───────────────────────────────────────────────
        const iterationLogs: IterationLog[] = [];
        const allFixes: FixResult[] = [];
        let currentCode = code;
        let currentScore = initialReview.score;
        let currentIssues = initialReview.issues;
        let previousScore = -1;

        for (let i = 1; i <= max_iterations; i++) {
          // Stop if score is already excellent
          if (currentScore >= 90) {
            break;
          }

          // Stop if no improvement from last iteration (skip on first)
          if (i > 1 && currentScore <= previousScore) {
            break;
          }

          previousScore = currentScore;

          // ── Fix ────────────────────────────────────────────────────────
          const { fixedCode, fixes } = applyFixes(currentCode, fix_level as FixLevel);
          allFixes.push(...fixes);
          currentCode = fixedCode;

          // ── Re-render ──────────────────────────────────────────────────
          await renderToScreenshot(page, currentCode, viewport);

          // ── Re-review ──────────────────────────────────────────────────
          const review = reviewCode(currentCode, framework);
          currentScore = review.score;
          const prevIssueCount = currentIssues.length;
          currentIssues = review.issues;

          iterationLogs.push({
            iteration: i,
            score: currentScore,
            issuesFixed: Math.max(0, prevIssueCount - currentIssues.length),
            issuesRemaining: currentIssues.length,
            fixesApplied: fixes.map((f) => f.description),
          });
        }

        // ── Final screenshot ─────────────────────────────────────────────
        const finalScreenshot = await renderToScreenshot(page, currentCode, viewport);

        // ── Close browser ────────────────────────────────────────────────
        await browser.close();
        browser = null;

        // ── Build response ───────────────────────────────────────────────
        const content: Array<
          | { type: "image"; data: string; mimeType: string }
          | { type: "text"; text: string }
        > = [];

        // Original screenshot
        content.push({
          type: "image" as const,
          data: originalScreenshot,
          mimeType: "image/png",
        });
        content.push({
          type: "text" as const,
          text: "**Original rendering** (above)",
        });

        // Final screenshot
        content.push({
          type: "image" as const,
          data: finalScreenshot,
          mimeType: "image/png",
        });
        content.push({
          type: "text" as const,
          text: "**Final rendering** (above)",
        });

        // Text report
        const lines: string[] = [];
        lines.push("# Design Iterate Report");
        lines.push("");
        lines.push(`**Framework:** ${detectedFramework}`);
        lines.push(`**Fix level:** ${fix_level}`);
        lines.push(`**Iterations run:** ${iterationLogs.length}`);
        lines.push(`**Total fixes applied:** ${allFixes.length}`);
        lines.push("");

        // Score progression
        lines.push("## Score Progression");
        lines.push("");
        lines.push("| Iteration | Score | Issues Fixed | Issues Remaining |");
        lines.push("|-----------|-------|-------------|-----------------|");
        lines.push(
          `| 0 (original) | ${initialReview.score}/100 | - | ${initialReview.issues.length} |`,
        );
        for (const log of iterationLogs) {
          lines.push(
            `| ${log.iteration} | ${log.score}/100 | ${log.issuesFixed} | ${log.issuesRemaining} |`,
          );
        }
        lines.push("");

        const finalScore = iterationLogs.length > 0
          ? iterationLogs[iterationLogs.length - 1].score
          : initialReview.score;
        const scoreDelta = finalScore - initialReview.score;
        const arrow = scoreDelta > 0 ? "+" : "";
        lines.push(
          `**Overall improvement:** ${initialReview.score}/100 -> ${finalScore}/100 (${arrow}${scoreDelta})`,
        );
        lines.push("");

        // Stop reason
        if (finalScore >= 90) {
          lines.push("*Stopped: score reached 90+ (excellent).*");
        } else if (
          iterationLogs.length >= 2 &&
          iterationLogs[iterationLogs.length - 1].score <=
            iterationLogs[iterationLogs.length - 2].score
        ) {
          lines.push("*Stopped: no further score improvement detected.*");
        } else if (iterationLogs.length === 0 && initialReview.score >= 90) {
          lines.push("*No iterations needed: original score was already 90+.*");
        } else if (iterationLogs.length >= max_iterations) {
          lines.push(`*Stopped: reached max iterations (${max_iterations}).*`);
        }
        lines.push("");

        // Summary of all fixes
        if (allFixes.length > 0) {
          lines.push("## All Fixes Applied");
          lines.push("");

          const grouped: Record<string, FixResult[]> = {};
          for (const fix of allFixes) {
            if (!grouped[fix.category]) grouped[fix.category] = [];
            grouped[fix.category].push(fix);
          }

          for (const [category, categoryFixes] of Object.entries(grouped)) {
            lines.push(
              `### ${category.charAt(0).toUpperCase() + category.slice(1)}`,
            );
            lines.push("");
            for (const fix of categoryFixes) {
              lines.push(`- ${fix.description}`);
              lines.push(`  \`${fix.before}\` -> \`${fix.after}\``);
            }
            lines.push("");
          }
        } else {
          lines.push(
            `No fixable issues found at the **${fix_level}** level.`,
          );
          lines.push("");
        }

        // Remaining issues
        if (currentIssues.length > 0) {
          lines.push("## Remaining Issues");
          lines.push("");
          for (const issue of currentIssues) {
            const icon =
              issue.severity === "error"
                ? "ERROR"
                : issue.severity === "warning"
                  ? "WARNING"
                  : "INFO";
            lines.push(
              `- **[${icon}] [${issue.category}]** ${issue.message}`,
            );
            lines.push(`  -> ${issue.suggestion}`);
          }
          lines.push("");
        } else {
          lines.push("## Remaining Issues");
          lines.push("");
          lines.push("None — all detected issues have been resolved.");
          lines.push("");
        }

        // Final code
        lines.push("## Final Code");
        lines.push("");
        lines.push("```");
        lines.push(currentCode);
        lines.push("```");

        content.push({
          type: "text" as const,
          text: lines.join("\n"),
        });

        return { content };
      } catch (err) {
        if (browser) {
          await browser.close().catch(() => {});
        }
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [
            {
              type: "text" as const,
              text: `Design iterate failed: ${message}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
