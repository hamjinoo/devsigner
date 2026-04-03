import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { generatePalette } from "../palettes/generator.js";
import { formatCSSVariables, formatTailwindConfig, formatDesignTokens } from "../palettes/formatters.js";

export function registerColorPalette(server: McpServer): void {
  server.tool(
    "color_palette",
    "Generate a complete, harmonious color palette for your project. Describe your project's mood, industry, or style and get production-ready CSS variables, Tailwind config, and design tokens.",
    {
      description: z
        .string()
        .describe("Project description — mood, industry, or style (e.g., 'fintech app, professional, trustworthy')"),
      base_color: z
        .string()
        .optional()
        .describe("Optional starting hex color (e.g., '#3B82F6') — palette will be built around this"),
      format: z
        .enum(["css_variables", "tailwind_config", "design_tokens", "all"])
        .default("all")
        .describe("Output format"),
      dark_mode: z
        .boolean()
        .default(true)
        .describe("Include dark mode variant"),
    },
    async ({ description, base_color, format, dark_mode }) => {
      const { palette, contrastReport, presetUsed } = generatePalette(description, base_color);

      const lines = [
        `# Color Palette: ${presetUsed}`,
        ``,
        `Generated from: "${description}"${base_color ? ` (base: ${base_color})` : ""}`,
        ``,
        `## Palette Overview`,
        ``,
        `| Role | Color |`,
        `|------|-------|`,
        `| Primary | ${palette.primary["500"]} |`,
        `| Secondary | ${palette.secondary["500"]} |`,
        `| Accent | ${palette.accent["500"]} |`,
        `| Success | ${palette.success} |`,
        `| Warning | ${palette.warning} |`,
        `| Error | ${palette.error} |`,
        `| Info | ${palette.info} |`,
        ``,
        `## Contrast Report`,
        ``,
      ];

      for (const report of contrastReport) {
        const status = report.wcagAAA ? "AAA" : report.wcagAA ? "AA" : "FAIL";
        lines.push(`- \`${report.pair[0]}\` on \`${report.pair[1]}\`: ${report.ratio}:1 (${status})`);
      }
      lines.push(``);

      if (format === "css_variables" || format === "all") {
        lines.push(`## CSS Variables`, ``, "```css", formatCSSVariables(palette, dark_mode), "```", ``);
      }

      if (format === "tailwind_config" || format === "all") {
        lines.push(`## Tailwind Config`, ``, "```js", formatTailwindConfig(palette), "```", ``);
      }

      if (format === "design_tokens" || format === "all") {
        lines.push(
          `## Design Tokens (W3C Format)`,
          ``,
          "```json",
          JSON.stringify(formatDesignTokens(palette), null, 2),
          "```"
        );
      }

      return {
        content: [{ type: "text" as const, text: lines.join("\n") }],
      };
    }
  );
}
