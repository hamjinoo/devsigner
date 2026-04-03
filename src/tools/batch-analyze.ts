import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import puppeteer from "puppeteer-core";
import * as fs from "node:fs";
import * as path from "node:path";
import { findChrome } from "./render-and-review.js";
import {
  type DesignAnalysis,
  extractDesignData,
  processColors,
  processTypography,
  processSpacing,
  processShapes,
  estimatePersonality,
  estimateIndustry,
} from "./analyze-url.js";

// ─── Core batch analysis logic ──────────────────────────────────────────────

interface BatchResult {
  succeeded: DesignAnalysis[];
  failed: Array<{ url: string; error: string }>;
}

async function runBatchAnalysis(
  urls: string[],
  viewportWidth: number,
  viewportHeight: number,
  delayBetween: number,
): Promise<BatchResult> {
  const chromePath = await findChrome();
  if (!chromePath) {
    throw new Error("Chrome or Edge not found. Install Google Chrome to use batch_analyze.");
  }

  const succeeded: DesignAnalysis[] = [];
  const failed: Array<{ url: string; error: string }> = [];

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu", "--disable-web-security"],
  });

  try {
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];

      // Delay between requests (skip for the first URL)
      if (i > 0 && delayBetween > 0) {
        await new Promise(r => setTimeout(r, delayBetween));
      }

      let page;
      try {
        page = await browser.newPage();
        await page.setViewport({ width: viewportWidth, height: viewportHeight });
        await page.setUserAgent(
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        );

        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
        // Wait for rendering
        await new Promise(r => setTimeout(r, 2000));

        // Extract design data using the shared extraction logic
        const rawData = await extractDesignData(page);

        // Process data using the shared processing functions
        const colors = processColors(rawData.colors);
        const typography = processTypography(rawData.typography);
        const spacing = processSpacing(rawData.spacing);
        const shapes = processShapes(rawData.shapes);
        const personality = estimatePersonality(colors, typography, spacing, shapes);
        const industry = estimateIndustry(rawData.title, colors);

        const analysis: DesignAnalysis = {
          url,
          analyzed_at: new Date().toISOString(),
          viewport: { width: viewportWidth, height: viewportHeight },
          page_title: rawData.title,
          colors,
          typography,
          spacing,
          layout: {
            max_width: rawData.layout.maxContentWidth || null,
            has_sidebar: rawData.layout.hasSidebar,
            has_hero: rawData.layout.hasHero,
            has_sticky_header: rawData.layout.hasStickyHeader,
            has_footer: rawData.layout.hasFooter,
            column_count: rawData.layout.maxCols,
            is_centered: rawData.layout.isCentered,
            is_responsive: true,
            viewport_coverage: rawData.layout.maxContentWidth
              ? Math.round((rawData.layout.maxContentWidth / rawData.layout.viewportWidth) * 100)
              : 100,
          },
          shapes,
          overall: {
            design_personality: personality,
            estimated_industry: industry,
            visual_weight: colors.color_count > 12 ? "heavy" : colors.color_count > 6 ? "medium" : "light",
            whitespace_ratio: spacing.density === "spacious" ? 0.6 : spacing.density === "compact" ? 0.2 : 0.4,
            complexity_score: Math.min(
              100,
              colors.color_count * 3 + typography.font_sizes.length * 5 + spacing.unique_count * 2,
            ),
            tags: [
              personality.toLowerCase().replace(/ /g, "-"),
              industry,
              colors.color_scheme,
              spacing.density,
              shapes.corner_style,
            ],
          },
        };

        succeeded.push(analysis);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        failed.push({ url, error: message });
      } finally {
        if (page) {
          await page.close().catch(() => {});
        }
      }
    }
  } finally {
    await browser.close().catch(() => {});
  }

  return { succeeded, failed };
}

function saveResults(outputPath: string, newResults: DesignAnalysis[]): number {
  // Ensure the directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  let existing: DesignAnalysis[] = [];

  // If the file already exists, read and append
  if (fs.existsSync(outputPath)) {
    try {
      const raw = fs.readFileSync(outputPath, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        existing = parsed;
      }
    } catch {
      // If the file is corrupted or not valid JSON, start fresh
    }
  }

  const combined = [...existing, ...newResults];
  fs.writeFileSync(outputPath, JSON.stringify(combined, null, 2), "utf-8");
  return combined.length;
}

// ─── Tool Registration ──────────────────────────────────────────────────────

export function registerBatchAnalyze(server: McpServer): void {
  server.tool(
    "batch_analyze",
    "Analyze multiple websites in batch. Launches a single browser, visits each URL, extracts design data, and saves all results to a JSON file. Appends to existing files. Returns a summary with success/failure counts and average scores.",
    {
      urls: z.array(z.string().url()).min(1).describe("List of URLs to analyze"),
      output_path: z
        .string()
        .describe('Path to save the results JSON file (e.g., "d:/Documents/devsigner/data/analyses.json")'),
      viewport_width: z.number().default(1440).describe("Viewport width in pixels"),
      viewport_height: z.number().default(900).describe("Viewport height in pixels"),
      delay_between: z
        .number()
        .default(3000)
        .describe("Milliseconds to wait between each URL to avoid rate limiting"),
    },
    async ({ urls, output_path, viewport_width, viewport_height, delay_between }) => {
      try {
        const { succeeded, failed } = await runBatchAnalysis(urls, viewport_width, viewport_height, delay_between);

        // Save results to file (append if exists)
        let totalInFile = 0;
        if (succeeded.length > 0) {
          totalInFile = saveResults(output_path, succeeded);
        }

        // Compute average scores
        const avgComplexity =
          succeeded.length > 0
            ? Math.round(succeeded.reduce((s, a) => s + a.overall.complexity_score, 0) / succeeded.length)
            : 0;
        const avgColorCount =
          succeeded.length > 0
            ? Math.round(succeeded.reduce((s, a) => s + a.colors.color_count, 0) / succeeded.length)
            : 0;
        const avgGridAlignment =
          succeeded.length > 0
            ? Math.round(
                succeeded.reduce((s, a) => s + a.spacing.grid_aligned_percentage, 0) / succeeded.length,
              )
            : 0;

        // Build summary
        const lines = [
          `# Batch Analysis Complete`,
          ``,
          `## Results`,
          `| Metric | Value |`,
          `|--------|-------|`,
          `| URLs Requested | ${urls.length} |`,
          `| Succeeded | ${succeeded.length} |`,
          `| Failed | ${failed.length} |`,
          `| Total in File | ${totalInFile} |`,
          `| Output Path | \`${output_path}\` |`,
          ``,
          `## Average Scores`,
          `| Metric | Value |`,
          `|--------|-------|`,
          `| Avg Complexity | ${avgComplexity}/100 |`,
          `| Avg Color Count | ${avgColorCount} |`,
          `| Avg Grid Alignment | ${avgGridAlignment}% |`,
          ``,
        ];

        if (succeeded.length > 0) {
          lines.push(`## Analyzed Sites`);
          lines.push(`| # | URL | Personality | Industry | Complexity |`);
          lines.push(`|---|-----|-------------|----------|------------|`);
          for (let i = 0; i < succeeded.length; i++) {
            const a = succeeded[i];
            lines.push(
              `| ${i + 1} | ${a.url} | ${a.overall.design_personality} | ${a.overall.estimated_industry} | ${a.overall.complexity_score} |`,
            );
          }
          lines.push(``);
        }

        if (failed.length > 0) {
          lines.push(`## Failed URLs`);
          lines.push(`| URL | Error |`);
          lines.push(`|-----|-------|`);
          for (const f of failed) {
            lines.push(`| ${f.url} | ${f.error} |`);
          }
          lines.push(``);
        }

        return {
          content: [{ type: "text" as const, text: lines.join("\n") }],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: "text" as const, text: `Batch analysis failed: ${message}` }],
          isError: true,
        };
      }
    },
  );
}
