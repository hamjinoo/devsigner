import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { parseCode } from "../parsers/index.js";
import { runDesignRules, calculateScore, type FocusArea } from "../rules/index.js";
import {
  loadReferenceDB,
  getReferencesForContext,
  type NormalizedReference,
} from "../data/reference-db.js";
import { getRangesForContext, type IndustryRanges } from "../data/reference-ranges.js";
import { detectPageType, suggestIndustry } from "../context/page-type-detector.js";
import { findChrome, wrapInHTML } from "./render-and-review.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function findClosestReferences(
  industry?: string,
  personality?: string,
  limit = 5,
): NormalizedReference[] {
  const refs = getReferencesForContext(industry, personality);
  // Sort by complexity (prefer sites with rich data) and pick top N
  return [...refs]
    .sort((a, b) => b.complexity - a.complexity)
    .slice(0, limit);
}

function buildComparisonTable(
  userMetrics: {
    colorCount: number;
    spacingUniqueCount: number;
    fontSizeCount: number;
    fontWeightCount: number;
  },
  ranges: IndustryRanges,
  refs: NormalizedReference[],
): string {
  const lines: string[] = [];

  lines.push("## Your Design vs Reference Sites");
  lines.push("");
  lines.push("| Metric | Yours | Typical Range | Median | Top References |");
  lines.push("|--------|-------|---------------|--------|----------------|");

  // Color count
  const refColorExamples = refs
    .slice(0, 3)
    .map((r) => `${new URL(r.url).hostname}(${r.colors.colorCount})`)
    .join(", ");
  lines.push(
    `| Colors | **${userMetrics.colorCount}** | ${ranges.colorCount.p25}-${ranges.colorCount.p75} | ${ranges.colorCount.median} | ${refColorExamples} |`,
  );

  // Spacing
  const refSpacingExamples = refs
    .slice(0, 3)
    .map((r) => `${new URL(r.url).hostname}(${r.spacing.uniqueCount})`)
    .join(", ");
  lines.push(
    `| Spacing values | **${userMetrics.spacingUniqueCount}** | ${ranges.spacingUniqueCount.p25}-${ranges.spacingUniqueCount.p75} | ${ranges.spacingUniqueCount.median} | ${refSpacingExamples} |`,
  );

  // Font sizes
  const refSizeExamples = refs
    .slice(0, 3)
    .map((r) => `${new URL(r.url).hostname}(${r.typography.sizeCount})`)
    .join(", ");
  lines.push(
    `| Font sizes | **${userMetrics.fontSizeCount}** | ${ranges.typographySizeCount.p25}-${ranges.typographySizeCount.p75} | ${ranges.typographySizeCount.median} | ${refSizeExamples} |`,
  );

  // Font weights
  const refWeightExamples = refs
    .slice(0, 3)
    .map((r) => `${new URL(r.url).hostname}(${r.typography.weightCount})`)
    .join(", ");
  lines.push(
    `| Font weights | **${userMetrics.fontWeightCount}** | ${ranges.typographyWeightCount.p25}-${ranges.typographyWeightCount.p75} | ${ranges.typographyWeightCount.median} | ${refWeightExamples} |`,
  );

  lines.push("");
  return lines.join("\n");
}

function buildReferenceDetails(refs: NormalizedReference[]): string {
  const lines: string[] = [];
  lines.push("## Reference Sites");
  lines.push("");

  for (const ref of refs) {
    const hostname = new URL(ref.url).hostname;
    const topColors = ref.colors.palette
      .slice(0, 5)
      .map((c) => c.hex)
      .join(", ");
    const fonts = ref.typography.fonts
      .slice(0, 2)
      .map((f) => f.family)
      .join(", ");

    lines.push(`### ${hostname}`);
    lines.push(`- **Industry:** ${ref.industry} | **Personality:** ${ref.personality}`);
    lines.push(`- **Colors:** ${ref.colors.colorCount} (${topColors})`);
    lines.push(`- **Typography:** ${fonts} | ${ref.typography.sizeCount} sizes, ${ref.typography.weightCount} weights`);
    lines.push(`- **Spacing:** ${ref.spacing.uniqueCount} values, ${ref.spacing.gridAlignedPct}% grid-aligned, ${ref.spacing.density}`);
    lines.push(`- **Shapes:** ${ref.shapes.cornerStyle} corners, ${ref.shapes.shadowStyle} shadows`);
    lines.push("");
  }

  return lines.join("\n");
}

function buildInsights(
  userMetrics: {
    colorCount: number;
    spacingUniqueCount: number;
    fontSizeCount: number;
    fontWeightCount: number;
  },
  ranges: IndustryRanges,
  refs: NormalizedReference[],
  industryLabel: string,
): string {
  const lines: string[] = [];
  lines.push("## Key Insights");
  lines.push("");

  // Color insight
  if (userMetrics.colorCount > ranges.colorCount.p75) {
    const bestRef = refs.find((r) => r.colors.colorCount <= ranges.colorCount.median);
    const example = bestRef ? ` ${new URL(bestRef.url).hostname} uses just ${bestRef.colors.colorCount}.` : "";
    lines.push(
      `- **Too many colors (${userMetrics.colorCount}):** ${industryLabel} sites typically use ${ranges.colorCount.p25}-${ranges.colorCount.p75} (median ${ranges.colorCount.median}).${example} Consider consolidating near-duplicate colors.`,
    );
  } else if (userMetrics.colorCount < ranges.colorCount.p25) {
    lines.push(
      `- **Very few colors (${userMetrics.colorCount}):** ${industryLabel} sites use ${ranges.colorCount.p25}-${ranges.colorCount.p75}. You might benefit from more accent/status colors.`,
    );
  } else {
    lines.push(`- **Color count (${userMetrics.colorCount}):** Within the typical range for ${industryLabel} sites. ✓`);
  }

  // Spacing insight
  if (userMetrics.spacingUniqueCount > ranges.spacingUniqueCount.p75) {
    lines.push(
      `- **Too many spacing values (${userMetrics.spacingUniqueCount}):** ${industryLabel} sites use ${ranges.spacingUniqueCount.p25}-${ranges.spacingUniqueCount.p75} (median ${ranges.spacingUniqueCount.median}). Define a spacing scale (4, 8, 12, 16, 24, 32, 48, 64).`,
    );
  } else {
    lines.push(`- **Spacing variety (${userMetrics.spacingUniqueCount}):** Within range. ✓`);
  }

  // Typography insight
  if (userMetrics.fontSizeCount > ranges.typographySizeCount.p75) {
    lines.push(
      `- **Too many font sizes (${userMetrics.fontSizeCount}):** ${industryLabel} sites use ${ranges.typographySizeCount.p25}-${ranges.typographySizeCount.p75}. Adopt a type scale (e.g., 1.25 ratio).`,
    );
  } else {
    lines.push(`- **Font size count (${userMetrics.fontSizeCount}):** Within range. ✓`);
  }

  // Top fonts in industry
  if (ranges.topFonts.length > 0) {
    const topFontNames = ranges.topFonts.slice(0, 5).map((f) => f.family).join(", ");
    lines.push(`- **Popular fonts in ${industryLabel}:** ${topFontNames}`);
  }

  lines.push("");
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Tool registration
// ---------------------------------------------------------------------------

export function registerReferenceCompare(server: McpServer): void {
  server.tool(
    "design_compare_reference",
    "Compare your UI code against real-world reference sites from our database of 101 analyzed products. Shows how your design metrics (colors, spacing, typography) compare to established products like Stripe, Linear, and Vercel.",
    {
      code: z.string().describe("Your UI code to compare"),
      industry: z
        .string()
        .optional()
        .describe("Industry to compare against (e.g., 'saas', 'fintech', 'ecommerce', 'developer_tools'). Auto-detected if not specified."),
      personality: z
        .string()
        .optional()
        .describe("Design personality to match (e.g., 'Bold Minimal', 'Warm Professional')"),
      visual: z
        .boolean()
        .default(true)
        .describe("Include a rendered screenshot of your code"),
    },
    async ({ code, industry, personality, visual }) => {
      // Detect context
      const pageType = detectPageType(code);
      const effectiveIndustry = industry ?? suggestIndustry(pageType);

      // Get reference data
      const refs = findClosestReferences(effectiveIndustry, personality);
      const ranges = getRangesForContext(effectiveIndustry, personality);
      const industryLabel = effectiveIndustry ?? "all";

      // Parse user code for metrics
      const parsed = parseCode(code, "auto");
      const issues = runDesignRules(parsed.declarations, ["all"] as FocusArea[], parsed.blocks);
      const score = calculateScore(issues);

      // Extract user metrics from declarations
      const allColors = new Set<string>();
      const allSpacingValues = new Set<number>();
      const allFontSizes = new Set<number>();
      const allFontWeights = new Set<string>();

      for (const decl of parsed.declarations) {
        if (["color", "background-color", "background", "border-color"].includes(decl.property)) {
          allColors.add(decl.value);
        }
        if (["padding", "padding-top", "padding-right", "padding-bottom", "padding-left",
             "margin", "margin-top", "margin-right", "margin-bottom", "margin-left",
             "gap", "row-gap", "column-gap"].includes(decl.property)) {
          allSpacingValues.add(parseFloat(decl.value) || 0);
        }
        if (decl.property === "font-size") {
          allFontSizes.add(parseFloat(decl.value) || 0);
        }
        if (decl.property === "font-weight") {
          allFontWeights.add(decl.value);
        }
      }

      const userMetrics = {
        colorCount: allColors.size,
        spacingUniqueCount: allSpacingValues.size,
        fontSizeCount: allFontSizes.size,
        fontWeightCount: allFontWeights.size,
      };

      // Build response
      const content: Array<{ type: "image"; data: string; mimeType: string } | { type: "text"; text: string }> = [];

      // Screenshot
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
          // skip
        }
      }

      // Text report
      const reportLines = [
        "# Design Reference Comparison",
        "",
        `**Page type:** ${pageType}`,
        `**Industry:** ${industryLabel}`,
        `**Your score:** ${score}/100`,
        `**Reference sites:** ${refs.length} (from ${ranges.sampleSize} total in category)`,
        "",
      ];

      const report = reportLines.join("\n")
        + buildComparisonTable(userMetrics, ranges, refs)
        + buildInsights(userMetrics, ranges, refs, industryLabel)
        + buildReferenceDetails(refs);

      content.push({ type: "text" as const, text: report });

      return { content };
    },
  );
}
