import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import puppeteer from "puppeteer-core";
import { findChrome, wrapInHTML } from "./render-and-review.js";
import { parseCode } from "../parsers/index.js";
import { runDesignRules, calculateScore, type FocusArea, type DesignIssue } from "../rules/index.js";

function categorizeIssues(issues: DesignIssue[]): Map<string, DesignIssue[]> {
  const map = new Map<string, DesignIssue[]>();
  for (const issue of issues) {
    const key = `${issue.category}:${issue.message}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(issue);
  }
  return map;
}

function severityIcon(severity: string): string {
  switch (severity) {
    case "error":
      return "ERROR";
    case "warning":
      return "WARNING";
    default:
      return "INFO";
  }
}

export function registerDesignCompare(server: McpServer): void {
  server.tool(
    "design_compare",
    "Compare two versions of UI code visually. Renders both in a real browser, takes screenshots, runs design rules on each, and shows a side-by-side comparison with score changes, improvements, and regressions.",
    {
      before: z.string().describe("The original UI code (HTML, CSS, React, Vue, Svelte)"),
      after: z.string().describe("The modified UI code"),
      viewport_width: z.number().default(1280).describe("Viewport width in pixels"),
      viewport_height: z.number().default(800).describe("Viewport height in pixels"),
    },
    async ({ before, after, viewport_width, viewport_height }) => {
      const chromePath = await findChrome();
      if (!chromePath) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Could not find Chrome or Edge browser installed. Please install Google Chrome or Microsoft Edge to use design_compare.\n\nExpected locations:\n- Windows: C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe\n- macOS: /Applications/Google Chrome.app\n- Linux: /usr/bin/google-chrome",
            },
          ],
          isError: true,
        };
      }

      let browser;
      try {
        browser = await puppeteer.launch({
          executablePath: chromePath,
          headless: true,
          args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
        });

        const viewport = { width: viewport_width, height: viewport_height };

        // --- Render BEFORE ---
        const pageBefore = await browser.newPage();
        await pageBefore.setViewport(viewport);
        const htmlBefore = wrapInHTML(before, viewport);
        await pageBefore.setContent(htmlBefore, { waitUntil: "domcontentloaded", timeout: 30000 });
        await new Promise((r) => setTimeout(r, 500));
        const screenshotBefore = (await pageBefore.screenshot({
          type: "png",
          fullPage: false,
          encoding: "base64",
        })) as string;
        await pageBefore.close();

        // --- Render AFTER ---
        const pageAfter = await browser.newPage();
        await pageAfter.setViewport(viewport);
        const htmlAfter = wrapInHTML(after, viewport);
        await pageAfter.setContent(htmlAfter, { waitUntil: "domcontentloaded", timeout: 30000 });
        await new Promise((r) => setTimeout(r, 500));
        const screenshotAfter = (await pageAfter.screenshot({
          type: "png",
          fullPage: false,
          encoding: "base64",
        })) as string;
        await pageAfter.close();

        await browser.close();
        browser = null;

        // --- Run design rules on both ---
        const parsedBefore = parseCode(before);
        const parsedAfter = parseCode(after);
        const focus: FocusArea[] = ["all"];

        const issuesBefore = runDesignRules(parsedBefore.declarations, focus, parsedBefore.blocks);
        const issuesAfter = runDesignRules(parsedAfter.declarations, focus, parsedAfter.blocks);

        const scoreBefore = calculateScore(issuesBefore);
        const scoreAfter = calculateScore(issuesAfter);
        const scoreDelta = scoreAfter - scoreBefore;

        // --- Diff issues ---
        const beforeMap = categorizeIssues(issuesBefore);
        const afterMap = categorizeIssues(issuesAfter);

        const allKeys = new Set([...beforeMap.keys(), ...afterMap.keys()]);
        const fixed: DesignIssue[] = [];
        const introduced: DesignIssue[] = [];
        const persisting: DesignIssue[] = [];

        for (const key of allKeys) {
          const inBefore = beforeMap.has(key);
          const inAfter = afterMap.has(key);
          if (inBefore && !inAfter) {
            fixed.push(beforeMap.get(key)![0]);
          } else if (!inBefore && inAfter) {
            introduced.push(afterMap.get(key)![0]);
          } else if (inBefore && inAfter) {
            persisting.push(afterMap.get(key)![0]);
          }
        }

        // --- Build output ---
        const content: Array<
          | { type: "image"; data: string; mimeType: string }
          | { type: "text"; text: string }
        > = [];

        // Header
        const deltaStr =
          scoreDelta > 0
            ? `+${scoreDelta} (improved)`
            : scoreDelta < 0
              ? `${scoreDelta} (declined)`
              : "no change";

        content.push({
          type: "text" as const,
          text: [
            "# Design Comparison",
            "",
            "## Score",
            "",
            `| | Score |`,
            `|---|---|`,
            `| Before | **${scoreBefore}/100** |`,
            `| After | **${scoreAfter}/100** |`,
            `| Delta | **${deltaStr}** |`,
            "",
            "---",
            "",
            "## Before",
          ].join("\n"),
        });

        content.push({
          type: "image" as const,
          data: screenshotBefore,
          mimeType: "image/png",
        });

        content.push({
          type: "text" as const,
          text: [
            "",
            "## After",
          ].join("\n"),
        });

        content.push({
          type: "image" as const,
          data: screenshotAfter,
          mimeType: "image/png",
        });

        // Changes summary
        const summaryLines: string[] = [
          "",
          "---",
          "",
          "## Changes Detail",
          "",
        ];

        if (fixed.length > 0) {
          summaryLines.push(`### Fixed (${fixed.length} issues resolved)`);
          for (const issue of fixed) {
            summaryLines.push(
              `- **[${severityIcon(issue.severity)}] [${issue.category}]** ${issue.message}`
            );
          }
          summaryLines.push("");
        }

        if (introduced.length > 0) {
          summaryLines.push(`### New Issues (${introduced.length} introduced)`);
          for (const issue of introduced) {
            summaryLines.push(
              `- **[${severityIcon(issue.severity)}] [${issue.category}]** ${issue.message}`
            );
            summaryLines.push(`  -> ${issue.suggestion}`);
          }
          summaryLines.push("");
        }

        if (persisting.length > 0) {
          summaryLines.push(`### Remaining (${persisting.length} still present)`);
          for (const issue of persisting) {
            summaryLines.push(
              `- [${severityIcon(issue.severity)}] [${issue.category}] ${issue.message}`
            );
          }
          summaryLines.push("");
        }

        if (fixed.length === 0 && introduced.length === 0 && persisting.length === 0) {
          summaryLines.push("No design rule violations detected in either version.");
          summaryLines.push("");
        }

        summaryLines.push(
          "---",
          "",
          `*Before: ${issuesBefore.length} total issues | After: ${issuesAfter.length} total issues*`,
          "",
          "*Review both screenshots above for visual changes that rules cannot detect: layout shifts, visual balance, whitespace distribution, and overall aesthetic quality.*",
        );

        content.push({
          type: "text" as const,
          text: summaryLines.join("\n"),
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
              text: `Failed to compare designs: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
