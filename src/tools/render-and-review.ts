import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import puppeteer from "puppeteer-core";
import { readFile } from "node:fs/promises";
import { parseCode } from "../parsers/index.js";
import { runDesignRules, calculateScore, type FocusArea } from "../rules/index.js";

export async function findChrome(): Promise<string | null> {
  const paths = [
    // Windows
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    process.env.LOCALAPPDATA + "\\Google\\Chrome\\Application\\chrome.exe",
    // Windows Edge
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    // macOS
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    // Linux
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/snap/bin/chromium",
  ];

  const { access } = await import("node:fs/promises");
  for (const p of paths) {
    try {
      await access(p);
      return p;
    } catch {
      // continue
    }
  }
  return null;
}

export function wrapInHTML(code: string, viewport: { width: number; height: number }): string {
  // If it's already a full HTML document, use as-is
  if (code.includes("<!DOCTYPE") || code.includes("<html")) {
    return code;
  }

  // If it's JSX/React, wrap in a simple HTML page with a note
  // The browser can't render JSX directly, so we treat it as HTML-ish
  // Strip JSX-specific syntax for visual rendering
  let renderableCode = code;

  // Convert className to class for HTML rendering
  renderableCode = renderableCode.replace(/className=/g, "class=");

  // Convert JSX style objects to inline CSS (basic conversion)
  renderableCode = renderableCode.replace(
    /style=\{\{([\s\S]*?)\}\}/g,
    (_match, styles: string) => {
      const cssString = styles
        .replace(/(\w+):/g, (_m: string, prop: string) => {
          return prop.replace(/[A-Z]/g, (c: string) => `-${c.toLowerCase()}`) + ":";
        })
        .replace(/,\s*$/gm, ";")
        .replace(/,/g, ";")
        .replace(/'/g, "")
        .replace(/"/g, "");
      return `style="${cssString}"`;
    }
  );

  // Remove JSX expressions like {variable}, {#each}, etc.
  renderableCode = renderableCode.replace(/\{[^}]*\}/g, "");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    min-height: ${viewport.height}px;
    background: #ffffff;
  }
</style>
</head>
<body>
${renderableCode}
</body>
</html>`;
}

export function registerRenderAndReview(server: McpServer): void {
  server.tool(
    "render_and_review",
    "Render UI code in a real browser and return a screenshot for visual design review. Supports HTML, CSS, React, Vue, and Svelte code. The screenshot lets you SEE the actual result.",
    {
      code: z.string().describe("UI code to render (HTML, CSS, React, Vue, or Svelte)"),
      viewport_width: z.number().default(1280).describe("Viewport width in pixels"),
      viewport_height: z.number().default(800).describe("Viewport height in pixels"),
      dark_background: z.boolean().default(false).describe("Use dark background for the page"),
      run_design_review: z.boolean().default(true).describe("Also run the design_review rules on the code"),
    },
    async ({ code, viewport_width, viewport_height, dark_background, run_design_review }) => {
      const chromePath = await findChrome();
      if (!chromePath) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Could not find Chrome or Edge browser installed. Please install Google Chrome or Microsoft Edge to use the render_and_review tool.\n\nExpected locations:\n- Windows: C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe\n- macOS: /Applications/Google Chrome.app\n- Linux: /usr/bin/google-chrome",
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

        const page = await browser.newPage();
        await page.setViewport({ width: viewport_width, height: viewport_height });

        let html = wrapInHTML(code, { width: viewport_width, height: viewport_height });
        if (dark_background) {
          html = html.replace("background: #ffffff", "background: #0a0a0a");
        }

        await page.setContent(html, { waitUntil: "networkidle0", timeout: 10000 });

        // Wait a bit for any CSS transitions/animations
        await new Promise((r) => setTimeout(r, 500));

        const screenshot = await page.screenshot({
          type: "png",
          fullPage: false,
          encoding: "base64",
        });

        await browser.close();
        browser = null;

        const content: Array<{ type: "image"; data: string; mimeType: string } | { type: "text"; text: string }> = [
          {
            type: "image" as const,
            data: screenshot as string,
            mimeType: "image/png",
          },
        ];

        // Run design review if requested
        if (run_design_review) {
          const parsed = parseCode(code);
          const issues = runDesignRules(parsed.declarations, ["all"] as FocusArea[]);
          const score = calculateScore(issues);

          const reviewLines = [
            "",
            "---",
            `## Design Rules Analysis (Score: ${score}/100)`,
            "",
          ];

          if (issues.length === 0) {
            reviewLines.push("No rule violations detected. Review the screenshot above for visual quality.");
          } else {
            for (const issue of issues) {
              const icon = issue.severity === "error" ? "ERROR" : issue.severity === "warning" ? "WARNING" : "INFO";
              reviewLines.push(`- **[${icon}] [${issue.category}]** ${issue.message}`);
              reviewLines.push(`  → ${issue.suggestion}`);
            }
          }

          reviewLines.push(
            "",
            "---",
            "*Please also review the screenshot visually for layout balance, visual hierarchy, whitespace usage, and overall aesthetics that rules alone cannot catch.*",
          );

          content.push({ type: "text" as const, text: reviewLines.join("\n") });
        } else {
          content.push({
            type: "text" as const,
            text: "\n*Screenshot rendered. Please review the visual design for layout balance, color harmony, typography hierarchy, spacing consistency, and overall aesthetics.*",
          });
        }

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
              text: `Failed to render: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
