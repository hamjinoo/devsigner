import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import puppeteer from "puppeteer-core";
import { findChrome, wrapInHTML } from "./render-and-review.js";

interface Viewport {
  name: string;
  width: number;
  height: number;
}

const DEFAULT_VIEWPORTS: Viewport[] = [
  { name: "Mobile", width: 375, height: 812 },
  { name: "Tablet", width: 768, height: 1024 },
  { name: "Desktop", width: 1440, height: 900 },
];

export function registerResponsivePreview(server: McpServer): void {
  server.tool(
    "responsive_preview",
    "Render UI code at multiple viewport sizes (mobile, tablet, desktop) and return screenshots of all viewports simultaneously. Useful for checking responsive behavior of a design across common device breakpoints.",
    {
      code: z.string().describe("UI code to preview (HTML, CSS, React, Vue, or Svelte)"),
      viewports: z
        .array(
          z.object({
            name: z.string().describe("Viewport label (e.g. 'Mobile')"),
            width: z.number().describe("Viewport width in pixels"),
            height: z.number().describe("Viewport height in pixels"),
          })
        )
        .optional()
        .describe(
          "Custom viewports to test. Defaults to Mobile (375x812), Tablet (768x1024), Desktop (1440x900)"
        ),
    },
    async ({ code, viewports }) => {
      const chromePath = await findChrome();
      if (!chromePath) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Could not find Chrome or Edge browser installed. Please install Google Chrome or Microsoft Edge to use the responsive_preview tool.\n\nExpected locations:\n- Windows: C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe\n- macOS: /Applications/Google Chrome.app\n- Linux: /usr/bin/google-chrome",
            },
          ],
          isError: true,
        };
      }

      const targetViewports: Viewport[] = viewports && viewports.length > 0 ? viewports : DEFAULT_VIEWPORTS;

      let browser;
      try {
        browser = await puppeteer.launch({
          executablePath: chromePath,
          headless: true,
          args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
        });

        const page = await browser.newPage();

        const screenshots: Array<{
          name: string;
          width: number;
          height: number;
          data: string;
        }> = [];

        for (const vp of targetViewports) {
          await page.setViewport({ width: vp.width, height: vp.height });

          const html = wrapInHTML(code, { width: vp.width, height: vp.height });
          await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 30000 });

          // Wait for CSS transitions/animations
          await new Promise((r) => setTimeout(r, 500));

          const screenshot = await page.screenshot({
            type: "png",
            fullPage: false,
            encoding: "base64",
          });

          screenshots.push({
            name: vp.name,
            width: vp.width,
            height: vp.height,
            data: screenshot as string,
          });
        }

        await browser.close();
        browser = null;

        // Build response content: images first, then summary
        const content: Array<
          | { type: "image"; data: string; mimeType: string }
          | { type: "text"; text: string }
        > = [];

        // Add each screenshot with a label
        for (const shot of screenshots) {
          content.push({
            type: "text" as const,
            text: `### ${shot.name} (${shot.width}x${shot.height})`,
          });
          content.push({
            type: "image" as const,
            data: shot.data,
            mimeType: "image/png",
          });
        }

        // Build responsive summary
        const summaryLines: string[] = [
          "",
          "---",
          "## Responsive Preview Summary",
          "",
          `Rendered at **${screenshots.length} viewport(s)**:`,
          "",
        ];

        for (const shot of screenshots) {
          summaryLines.push(`- **${shot.name}:** ${shot.width} x ${shot.height}px`);
        }

        summaryLines.push("");

        // Basic layout change detection: check if screenshots have different data lengths
        // (different pixel content = likely different layout)
        if (screenshots.length >= 2) {
          const dataLengths = screenshots.map((s) => s.data.length);
          const allSame = dataLengths.every((len) => len === dataLengths[0]);

          if (allSame) {
            summaryLines.push(
              "**Layout observation:** All viewports produced identical screenshots. The layout may not be responsive — consider adding CSS media queries, flexible widths (`%`, `vw`, `flex`, `grid`), or a responsive meta viewport tag."
            );
          } else {
            const diffs: string[] = [];
            for (let i = 1; i < screenshots.length; i++) {
              const prev = screenshots[i - 1];
              const curr = screenshots[i];
              const sizeDiff = Math.abs(curr.data.length - prev.data.length);
              const pctChange = ((sizeDiff / prev.data.length) * 100).toFixed(1);
              diffs.push(
                `  - ${prev.name} -> ${curr.name}: ~${pctChange}% pixel data difference`
              );
            }

            summaryLines.push(
              "**Layout observation:** Screenshots differ across viewports, suggesting the layout adapts to different screen sizes.",
              "",
              "Viewport transitions:",
              ...diffs
            );
          }

          summaryLines.push("");
        }

        summaryLines.push(
          "### Responsive Design Guidance",
          "",
          "When reviewing the screenshots above, look for:",
          "- **Content reflow:** Does text and content reorganize appropriately for smaller screens?",
          "- **Navigation:** Is the navigation accessible on mobile (hamburger menu, bottom nav)?",
          "- **Touch targets:** Are interactive elements at least 44x44px on mobile?",
          "- **Typography scale:** Does font size adjust for readability on each viewport?",
          "- **Image scaling:** Do images resize without overflow or distortion?",
          "- **Horizontal scroll:** Is there any unwanted horizontal scrolling on narrow viewports?",
          "- **Whitespace:** Does spacing feel appropriate for each screen density?",
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
              text: `Failed to render responsive preview: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
