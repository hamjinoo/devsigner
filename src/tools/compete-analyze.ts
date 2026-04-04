import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import puppeteer from "puppeteer-core";
import { findChrome } from "./render-and-review.js";
import {
  extractDesignData,
  processColors,
  processTypography,
  processSpacing,
  processShapes,
  estimatePersonality,
  estimateIndustry,
  type DesignAnalysis,
} from "./analyze-url.js";

// ─── Types ──────────────────────────────────────────────────────────────────

interface SiteAnalysis {
  url: string;
  title: string;
  screenshotBase64: string | undefined;
  colors: DesignAnalysis["colors"];
  typography: DesignAnalysis["typography"];
  spacing: DesignAnalysis["spacing"];
  shapes: DesignAnalysis["shapes"];
  layout: DesignAnalysis["layout"];
  personality: string;
  industry: string;
  complexity: number;
  rawLayout: any;
}

// ─── Single-site analysis helper ────────────────────────────────────────────

async function analyzeSite(
  browser: any,
  url: string,
  viewportWidth: number,
  viewportHeight: number,
): Promise<SiteAnalysis> {
  const page = await browser.newPage();
  await page.setViewport({ width: viewportWidth, height: viewportHeight });
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  );

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  // Wait for rendering
  await new Promise((r) => setTimeout(r, 2000));

  const rawData = await extractDesignData(page);

  const screenshotBase64 = (await page.screenshot({
    type: "png",
    encoding: "base64",
    fullPage: false,
  })) as string;

  await page.close();

  const colors = processColors(rawData.colors);
  const typography = processTypography(rawData.typography);
  const spacing = processSpacing(rawData.spacing);
  const shapes = processShapes(rawData.shapes);
  const personality = estimatePersonality(colors, typography, spacing, shapes);
  const industry = estimateIndustry(rawData.title, colors, url);
  const complexity = Math.min(
    100,
    colors.color_count * 3 +
      typography.font_sizes.length * 5 +
      spacing.unique_count * 2,
  );

  const layout: DesignAnalysis["layout"] = {
    max_width: rawData.layout.maxContentWidth || null,
    has_sidebar: rawData.layout.hasSidebar,
    has_hero: rawData.layout.hasHero,
    has_sticky_header: rawData.layout.hasStickyHeader,
    has_footer: rawData.layout.hasFooter,
    column_count: rawData.layout.maxCols,
    is_centered: rawData.layout.isCentered,
    is_responsive: true,
    viewport_coverage: rawData.layout.maxContentWidth
      ? Math.round(
          (rawData.layout.maxContentWidth / rawData.layout.viewportWidth) * 100,
        )
      : 100,
  };

  return {
    url,
    title: rawData.title || url,
    screenshotBase64,
    colors,
    typography,
    spacing,
    shapes,
    layout,
    personality,
    industry,
    complexity,
    rawLayout: rawData.layout,
  };
}

// ─── Comparison logic ───────────────────────────────────────────────────────

function generateAdvantages(mine: SiteAnalysis, theirs: SiteAnalysis): string[] {
  const advantages: string[] = [];

  // Contrast compliance
  const myFailingContrast = mine.colors.contrast_pairs.filter((p) => !p.wcag_aa).length;
  const theirFailingContrast = theirs.colors.contrast_pairs.filter((p) => !p.wcag_aa).length;
  if (myFailingContrast < theirFailingContrast) {
    advantages.push(
      `Your site has better contrast compliance (${myFailingContrast} failing pairs vs ${theirFailingContrast})`,
    );
  }

  // Grid alignment
  if (mine.spacing.grid_aligned_percentage > theirs.spacing.grid_aligned_percentage) {
    advantages.push(
      `Your spacing is more grid-aligned (${mine.spacing.grid_aligned_percentage}% vs ${theirs.spacing.grid_aligned_percentage}%)`,
    );
  }

  // Fewer font families = more consistent
  if (mine.typography.fonts.length < theirs.typography.fonts.length && mine.typography.fonts.length <= 3) {
    advantages.push(
      `Your typography is more consistent with ${mine.typography.fonts.length} font families vs ${theirs.typography.fonts.length}`,
    );
  }

  // Type scale ratio (having one is good)
  if (mine.typography.type_scale_ratio && !theirs.typography.type_scale_ratio) {
    advantages.push(
      `Your type scale follows a consistent ratio (${mine.typography.type_scale_ratio}:1) while competitor's is irregular`,
    );
  }

  // Lower complexity can be an advantage
  if (mine.complexity < theirs.complexity && mine.complexity >= 30) {
    advantages.push(
      `Your design is cleaner and less complex (score ${mine.complexity} vs ${theirs.complexity})`,
    );
  }

  // Sticky header
  if (mine.layout.has_sticky_header && !theirs.layout.has_sticky_header) {
    advantages.push("Your site has a sticky header for better navigation");
  }

  // Shadow usage for depth
  if (mine.shapes.shadow_style !== "none" && theirs.shapes.shadow_style === "none") {
    advantages.push(
      `Your site uses ${mine.shapes.shadow_style} shadows for visual depth, competitor uses none`,
    );
  }

  // Fewer unique spacing values = more consistent
  if (mine.spacing.unique_count < theirs.spacing.unique_count) {
    advantages.push(
      `Your spacing is more constrained (${mine.spacing.unique_count} unique values vs ${theirs.spacing.unique_count})`,
    );
  }

  if (advantages.length === 0) {
    advantages.push("No clear design advantages identified -- consider the recommendations below");
  }

  return advantages;
}

function generateGaps(mine: SiteAnalysis, theirs: SiteAnalysis): string[] {
  const gaps: string[] = [];

  // Grid alignment
  if (theirs.spacing.grid_aligned_percentage > mine.spacing.grid_aligned_percentage) {
    gaps.push(
      `Competitor has tighter spacing consistency (${theirs.spacing.grid_aligned_percentage}% vs ${mine.spacing.grid_aligned_percentage}% grid-aligned)`,
    );
  }

  // Contrast
  const myFailingContrast = mine.colors.contrast_pairs.filter((p) => !p.wcag_aa).length;
  const theirFailingContrast = theirs.colors.contrast_pairs.filter((p) => !p.wcag_aa).length;
  if (theirFailingContrast < myFailingContrast) {
    gaps.push(
      `Competitor has better contrast compliance (${theirFailingContrast} failing pairs vs your ${myFailingContrast})`,
    );
  }

  // Type scale
  if (theirs.typography.type_scale_ratio && !mine.typography.type_scale_ratio) {
    gaps.push(
      `Competitor uses a consistent type scale ratio (${theirs.typography.type_scale_ratio}:1), yours is irregular`,
    );
  }

  // Font consistency
  if (theirs.typography.fonts.length < mine.typography.fonts.length && theirs.typography.fonts.length <= 3) {
    gaps.push(
      `Competitor uses fewer font families (${theirs.typography.fonts.length} vs your ${mine.typography.fonts.length}), creating more visual consistency`,
    );
  }

  // Color palette discipline
  if (theirs.colors.color_count < mine.colors.color_count && theirs.colors.color_count <= 10) {
    gaps.push(
      `Competitor has a tighter color palette (${theirs.colors.color_count} colors vs your ${mine.colors.color_count})`,
    );
  }

  // Spacing consistency
  if (theirs.spacing.unique_count < mine.spacing.unique_count) {
    gaps.push(
      `Competitor uses fewer unique spacing values (${theirs.spacing.unique_count} vs your ${mine.spacing.unique_count}), indicating a stronger spacing system`,
    );
  }

  // Layout features
  if (theirs.layout.has_sticky_header && !mine.layout.has_sticky_header) {
    gaps.push("Competitor has a sticky header; yours does not");
  }
  if (theirs.layout.has_hero && !mine.layout.has_hero) {
    gaps.push("Competitor has a hero section; yours does not");
  }

  // Shadow depth
  if (theirs.shapes.shadow_style !== "none" && mine.shapes.shadow_style === "none") {
    gaps.push(
      `Competitor uses ${theirs.shapes.shadow_style} shadows for visual depth, your site uses none`,
    );
  }

  if (gaps.length === 0) {
    gaps.push("No clear design gaps identified -- your site appears competitive across all dimensions");
  }

  return gaps;
}

function generateRecommendations(mine: SiteAnalysis, theirs: SiteAnalysis): string[] {
  const recs: string[] = [];

  // Contrast fix
  const myFailing = mine.colors.contrast_pairs.filter((p) => !p.wcag_aa);
  if (myFailing.length > 0) {
    const worst = myFailing[0];
    recs.push(
      `Fix contrast issues: \`${worst.foreground}\` on \`${worst.background}\` has a ratio of ${worst.ratio}:1. Aim for at least 4.5:1 for WCAG AA compliance`,
    );
  }

  // Grid alignment
  if (mine.spacing.grid_aligned_percentage < 80) {
    recs.push(
      `Adopt a ${mine.spacing.base_unit}px base grid. Currently ${mine.spacing.grid_aligned_percentage}% aligned -- target 80%+ by converting spacing values to multiples of ${mine.spacing.base_unit}px`,
    );
  }

  // Color palette reduction
  if (mine.colors.color_count > 15) {
    recs.push(
      `Reduce color palette from ${mine.colors.color_count} to 8-12 colors. Define primary, secondary, accent, and neutral scales. Competitor uses ${theirs.colors.color_count}`,
    );
  }

  // Typography consistency
  if (mine.typography.fonts.length > 3) {
    recs.push(
      `Consolidate to 2 font families (currently using ${mine.typography.fonts.length}). Consider "${theirs.typography.heading_font || mine.typography.fonts[0]?.family}" for headings and "${theirs.typography.body_font || mine.typography.fonts[1]?.family || mine.typography.fonts[0]?.family}" for body`,
    );
  }

  // Type scale
  if (!mine.typography.type_scale_ratio) {
    const suggestedRatio = theirs.typography.type_scale_ratio || 1.25;
    const baseSizePx = mine.typography.font_sizes.find((s) => s.usage === "body")?.size_px || 16;
    recs.push(
      `Establish a type scale with ratio ${suggestedRatio}. Starting from ${baseSizePx}px body: ${baseSizePx}px, ${Math.round(baseSizePx * suggestedRatio)}px, ${Math.round(baseSizePx * suggestedRatio ** 2)}px, ${Math.round(baseSizePx * suggestedRatio ** 3)}px`,
    );
  }

  // Corner style differentiation
  if (mine.shapes.corner_style === theirs.shapes.corner_style) {
    const alternatives: Record<string, string> = {
      sharp: "Try `border-radius: 8px` for a friendlier feel",
      subtle: "Consider `border-radius: 12px` for more personality or `0px` for a bold editorial look",
      rounded: "Consider sharper corners (`border-radius: 4px`) for a more precise, technical aesthetic",
      pill: "Consider moderate rounding (`border-radius: 8px`) for a more grounded look",
    };
    recs.push(
      `Both sites use ${mine.shapes.corner_style} corners. ${alternatives[mine.shapes.corner_style] || "Differentiate your corner style"}`,
    );
  }

  // Shadow improvement
  if (mine.shapes.shadow_style === "none" && theirs.shapes.shadow_style !== "none") {
    recs.push(
      `Add subtle shadows for depth: \`box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)\` on cards and interactive elements`,
    );
  }

  // Spacing reduction
  if (mine.spacing.unique_count > theirs.spacing.unique_count + 5) {
    recs.push(
      `Define a spacing scale (e.g., 4, 8, 12, 16, 24, 32, 48, 64px) and migrate ad-hoc values. You have ${mine.spacing.unique_count} unique values -- aim for under ${Math.max(theirs.spacing.unique_count, 15)}`,
    );
  }

  // Density adjustment
  if (mine.spacing.density !== theirs.spacing.density) {
    const tip =
      theirs.spacing.density === "spacious"
        ? "Increase padding and margins by 25-50% to create more breathing room"
        : theirs.spacing.density === "compact"
          ? "Tighten padding and margins by 20-30% for a more information-dense feel"
          : "Balance your spacing -- aim for 16-24px default padding on containers";
    recs.push(
      `Your density is "${mine.spacing.density}" vs competitor's "${theirs.spacing.density}". ${tip}`,
    );
  }

  // Return top 5
  return recs.slice(0, 5);
}

// ─── Tool Registration ──────────────────────────────────────────────────────

export function registerCompeteAnalyze(server: McpServer): void {
  server.tool(
    "compete_analyze",
    "Compare the design of two websites side by side. Extracts and compares colors, typography, spacing, layout, shapes, and personality from both URLs, then generates a competitive design report with advantages, gaps, and actionable recommendations.",
    {
      my_url: z.string().url().describe("Your website URL"),
      competitor_url: z.string().url().describe("Competitor's website URL"),
      viewport_width: z.number().default(1440).describe("Viewport width in pixels"),
      viewport_height: z.number().default(900).describe("Viewport height in pixels"),
    },
    async ({ my_url, competitor_url, viewport_width, viewport_height }) => {
      const chromePath = await findChrome();
      if (!chromePath) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Chrome or Edge not found. Install Google Chrome to use compete_analyze.",
            },
          ],
          isError: true,
        };
      }

      let browser;
      try {
        // Launch ONE browser
        browser = await puppeteer.launch({
          executablePath: chromePath,
          headless: true,
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-gpu",
            "--disable-web-security",
          ],
        });

        // Analyze both sites using separate pages in the same browser
        const [mine, theirs] = await Promise.all([
          analyzeSite(browser, my_url, viewport_width, viewport_height),
          analyzeSite(browser, competitor_url, viewport_width, viewport_height),
        ]);

        // Close browser
        await browser.close();
        browser = null;

        // ── Build comparison report ──

        const advantages = generateAdvantages(mine, theirs);
        const gaps = generateGaps(mine, theirs);
        const recommendations = generateRecommendations(mine, theirs);

        const lines = [
          `# Competitive Design Analysis`,
          ``,
          `**Your site:** ${mine.title} (${my_url})`,
          `**Competitor:** ${theirs.title} (${competitor_url})`,
          `**Viewport:** ${viewport_width}x${viewport_height}`,
          `**Analyzed:** ${new Date().toISOString()}`,
          ``,
          `---`,
          ``,
          `## Side-by-side Comparison`,
          ``,
          `| Aspect | Your Site | Competitor |`,
          `|--------|----------|-----------|`,
          `| Personality | ${mine.personality} | ${theirs.personality} |`,
          `| Color Scheme | ${mine.colors.color_scheme} | ${theirs.colors.color_scheme} |`,
          `| Colors Used | ${mine.colors.color_count} | ${theirs.colors.color_count} |`,
          `| Primary Color | ${mine.colors.dominant_color} | ${theirs.colors.dominant_color} |`,
          `| Background | ${mine.colors.background_color} | ${theirs.colors.background_color} |`,
          `| Text Color | ${mine.colors.text_color} | ${theirs.colors.text_color} |`,
          `| Accent Color | ${mine.colors.accent_color || "none"} | ${theirs.colors.accent_color || "none"} |`,
          `| Heading Font | ${mine.typography.heading_font || "same as body"} | ${theirs.typography.heading_font || "same as body"} |`,
          `| Body Font | ${mine.typography.body_font || "unknown"} | ${theirs.typography.body_font || "unknown"} |`,
          `| Type Scale | ${mine.typography.type_scale_ratio || "irregular"} | ${theirs.typography.type_scale_ratio || "irregular"} |`,
          `| Corner Style | ${mine.shapes.corner_style} | ${theirs.shapes.corner_style} |`,
          `| Shadow Style | ${mine.shapes.shadow_style} | ${theirs.shapes.shadow_style} |`,
          `| Density | ${mine.spacing.density} | ${theirs.spacing.density} |`,
          `| Grid Alignment | ${mine.spacing.grid_aligned_percentage}% | ${theirs.spacing.grid_aligned_percentage}% |`,
          `| Base Unit | ${mine.spacing.base_unit}px | ${theirs.spacing.base_unit}px |`,
          `| Unique Spacing | ${mine.spacing.unique_count} | ${theirs.spacing.unique_count} |`,
          `| Complexity | ${mine.complexity}/100 | ${theirs.complexity}/100 |`,
          `| Industry | ${mine.industry} | ${theirs.industry} |`,
          `| Columns | ${mine.layout.column_count} | ${theirs.layout.column_count} |`,
          `| Sticky Header | ${mine.layout.has_sticky_header ? "Yes" : "No"} | ${theirs.layout.has_sticky_header ? "Yes" : "No"} |`,
          `| Hero Section | ${mine.layout.has_hero ? "Yes" : "No"} | ${theirs.layout.has_hero ? "Yes" : "No"} |`,
          ``,
          `---`,
          ``,
          `## Competitive Advantages`,
          ``,
          ...advantages.map((a) => `- ${a}`),
          ``,
          `---`,
          ``,
          `## Competitive Gaps`,
          ``,
          ...gaps.map((g) => `- ${g}`),
          ``,
          `---`,
          ``,
          `## Recommendations`,
          ``,
          ...recommendations.map((r, i) => `${i + 1}. ${r}`),
          ``,
        ];

        // Build content array with both screenshots + text report
        const content: Array<
          | { type: "image"; data: string; mimeType: string }
          | { type: "text"; text: string }
        > = [];

        // Your site screenshot
        if (mine.screenshotBase64) {
          content.push({
            type: "text" as const,
            text: `### Your Site: ${mine.title}`,
          });
          content.push({
            type: "image" as const,
            data: mine.screenshotBase64,
            mimeType: "image/png",
          });
        }

        // Competitor screenshot
        if (theirs.screenshotBase64) {
          content.push({
            type: "text" as const,
            text: `### Competitor: ${theirs.title}`,
          });
          content.push({
            type: "image" as const,
            data: theirs.screenshotBase64,
            mimeType: "image/png",
          });
        }

        // Text report
        content.push({ type: "text" as const, text: lines.join("\n") });

        return { content };
      } catch (err) {
        if (browser) await browser.close().catch(() => {});
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [
            {
              type: "text" as const,
              text: `Failed to run competitive analysis: ${message}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
