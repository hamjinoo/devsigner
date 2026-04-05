import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { designTransform } from "../generator/transform.js";

export function registerDesignTransform(server: McpServer): void {
  server.tool(
    "design_transform",
    "Transform your UI code with a complete, professional design system. Takes your existing HTML/React/Vue code and generates a beautifully redesigned version with proper typography, colors, spacing, and component styling — learned from 101 real-world reference sites. Returns before/after screenshots and the redesigned code.",
    {
      code: z.string().describe("Your UI code to redesign (HTML, CSS, React, Vue, or Svelte)"),
      industry: z
        .string()
        .optional()
        .describe("Industry context: 'saas', 'fintech', 'ecommerce', 'developer_tools', 'healthcare', 'education'"),
      mood: z
        .enum(["warm", "cool", "neutral", "bold", "soft"])
        .default("neutral")
        .describe("Design mood: warm (friendly), cool (professional), neutral (balanced), bold (striking), soft (gentle)"),
      dark_mode: z
        .boolean()
        .default(false)
        .describe("Generate dark mode design"),
      primary_color: z
        .string()
        .optional()
        .describe("Override primary brand color (hex, e.g. '#6366f1')"),
    },
    async ({ code, industry, mood, dark_mode, primary_color }) => {
      try {
        const result = await designTransform(code, {
          industry,
          mood,
          darkMode: dark_mode,
          primaryColor: primary_color,
        });

        const content: Array<{ type: "image"; data: string; mimeType: string } | { type: "text"; text: string }> = [];

        // Before screenshot
        content.push({
          type: "image" as const,
          data: result.beforeScreenshot,
          mimeType: "image/png",
        });

        content.push({
          type: "text" as const,
          text: "**↑ Before** — Your current design\n\n**↓ After** — Redesigned with devsigner",
        });

        // After screenshot
        content.push({
          type: "image" as const,
          data: result.afterScreenshot,
          mimeType: "image/png",
        });

        // Report
        const report = [
          `## Design Transform Complete`,
          ``,
          `**Page type detected:** ${result.pageType}`,
          `**Design system:** ${result.designSystem.description}`,
          ``,
          `### What Changed`,
          `- Typography: Inter font family, 1.25 type scale (Major Third)`,
          `- Colors: Generated palette based on ${mood} mood${industry ? ` for ${industry}` : ""}`,
          `- Spacing: 4px grid system (4, 8, 12, 16, 24, 32, 48, 64, 80, 96px)`,
          `- Components: Buttons, cards, inputs, navigation — all styled`,
          `- Layout: ${result.pageType === "blog" ? "720px" : result.pageType === "dashboard" ? "1400px" : "1200px"} max-width container`,
          ``,
          `### Redesigned Code`,
          ``,
          `\`\`\`html`,
          result.redesignedCode,
          `\`\`\``,
        ].join("\n");

        content.push({ type: "text" as const, text: report });

        return { content };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: "text" as const, text: `Design transform failed: ${message}` }],
          isError: true,
        };
      }
    },
  );
}
