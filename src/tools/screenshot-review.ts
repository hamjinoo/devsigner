import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { readFile } from "node:fs/promises";
import { extname } from "node:path";

export function registerScreenshotReview(server: McpServer): void {
  server.tool(
    "screenshot_review",
    "Review an existing screenshot or UI image for design quality. Provide a file path to any PNG, JPG, or WebP image and get visual design feedback. Works with screenshots of websites, apps, or any UI.",
    {
      image_path: z.string().describe("Absolute path to the screenshot/image file (PNG, JPG, or WebP)"),
      context: z
        .string()
        .optional()
        .describe("Optional context about the UI (e.g., 'This is a fintech dashboard', 'This is a mobile login screen')"),
      focus: z
        .enum(["general", "color", "typography", "layout", "spacing", "accessibility"])
        .default("general")
        .describe("What aspect of design to focus the review on"),
    },
    async ({ image_path, context, focus }) => {
      try {
        const ext = extname(image_path).toLowerCase();
        const supportedExts: Record<string, string> = {
          ".png": "image/png",
          ".jpg": "image/jpeg",
          ".jpeg": "image/jpeg",
          ".webp": "image/webp",
        };

        const mimeType = supportedExts[ext];
        if (!mimeType) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Unsupported image format: ${ext}. Supported formats: PNG, JPG, WebP.`,
              },
            ],
            isError: true,
          };
        }

        const imageBuffer = await readFile(image_path);
        const base64 = imageBuffer.toString("base64");

        const focusPrompts: Record<string, string> = {
          general:
            "Review this UI screenshot for overall design quality. Check layout balance, visual hierarchy, color harmony, typography, spacing consistency, and general aesthetics. Be specific with suggestions.",
          color:
            "Focus on color usage in this UI. Check for color harmony, contrast accessibility (WCAG), palette consistency, use of color for hierarchy, and whether the colors match the intended mood/brand.",
          typography:
            "Focus on typography in this UI. Check font hierarchy, size scale consistency, line height, letter spacing, readability, font pairing, and text alignment patterns.",
          layout:
            "Focus on layout in this UI. Check visual balance, alignment grid, content grouping, whitespace usage, responsive considerations, and information hierarchy.",
          spacing:
            "Focus on spacing in this UI. Check padding consistency, margin patterns, gap uniformity, spacing scale adherence, density appropriateness, and breathing room between elements.",
          accessibility:
            "Focus on accessibility in this UI. Check color contrast ratios, touch target sizes, text readability, focus indicators, visual affordances, and potential issues for users with visual impairments.",
        };

        const contextLine = context ? `\n\n**Context:** ${context}` : "";
        const reviewPrompt = focusPrompts[focus] + contextLine;

        return {
          content: [
            {
              type: "image" as const,
              data: base64,
              mimeType,
            },
            {
              type: "text" as const,
              text: [
                "## Screenshot Design Review",
                "",
                reviewPrompt,
                "",
                "Please analyze the screenshot above and provide:",
                "1. **Overall impression** — first reaction and design quality score (1-10)",
                "2. **What works well** — design strengths to keep",
                "3. **Issues found** — specific problems with exact locations (e.g., 'the button in the top-right')",
                "4. **Actionable fixes** — concrete suggestions with specific values (colors, sizes, spacing)",
                "5. **Priority** — which fixes would have the biggest visual impact",
              ].join("\n"),
            },
          ],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [
            {
              type: "text" as const,
              text: `Failed to read image: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
