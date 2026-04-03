/**
 * Seed the design analysis database by analyzing top design sites.
 * Run with: npx tsx scripts/seed-analyses.mjs
 */

import puppeteer from "puppeteer-core";
import { findChrome } from "../src/tools/render-and-review.js";
import {
  extractDesignData,
  processColors,
  processTypography,
  processSpacing,
  processShapes,
  estimatePersonality,
  estimateIndustry,
} from "../src/tools/analyze-url.js";
import { readFile, writeFile, mkdir } from "node:fs/promises";

const SITES = [
  // Fintech
  "https://stripe.com",
  "https://mercury.com",
  "https://wise.com",
  "https://linear.app",
  // SaaS
  "https://vercel.com",
  "https://notion.so",
  "https://github.com",
  "https://supabase.com",
  // Dev Tools
  "https://tailwindcss.com",
  "https://nextjs.org",
  "https://astro.build",
  "https://vitejs.dev",
  // Design
  "https://figma.com",
  "https://framer.com",
  // E-commerce
  "https://shopify.com",
  "https://gumroad.com",
  // Education
  "https://duolingo.com",
  "https://coursera.org",
  // Health/Wellness
  "https://calm.com",
  "https://headspace.com",
  // Social
  "https://discord.com",
  "https://slack.com",
  // Productivity
  "https://todoist.com",
  "https://1password.com",
  // Landing pages known for good design
  "https://arc.net",
  "https://raycast.com",
  "https://posthog.com",
  "https://resend.com",
  "https://planetscale.com",
  "https://clerk.com",
  "https://cal.com",
];

const OUTPUT_PATH = "d:/Documents/devsigner/data/seed-analyses.json";
const VIEWPORT = { width: 1440, height: 900 };
const DELAY = 4000;

async function main() {
  const chromePath = await findChrome();
  if (!chromePath) {
    console.error("Chrome not found");
    process.exit(1);
  }

  console.log(`Using: ${chromePath}`);
  console.log(`Analyzing ${SITES.length} sites...\n`);

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu", "--disable-web-security"],
  });

  const results = [];
  let success = 0;
  let failed = 0;

  for (let i = 0; i < SITES.length; i++) {
    const url = SITES[i];
    console.log(`[${i + 1}/${SITES.length}] ${url}...`);

    try {
      const page = await browser.newPage();
      await page.setViewport(VIEWPORT);
      await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36");

      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
      await new Promise(r => setTimeout(r, 3000));

      const rawData = await extractDesignData(page);
      await page.close();

      const colors = processColors(rawData.colors);
      const typography = processTypography(rawData.typography);
      const spacing = processSpacing(rawData.spacing);
      const shapes = processShapes(rawData.shapes);
      const personality = estimatePersonality(colors, typography, spacing, shapes);
      const industry = estimateIndustry(rawData.title, colors);

      const analysis = {
        url,
        analyzed_at: new Date().toISOString(),
        viewport: VIEWPORT,
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
        },
        shapes,
        overall: {
          design_personality: personality,
          estimated_industry: industry,
          complexity_score: Math.min(100, colors.color_count * 3 + typography.font_sizes.length * 5 + spacing.unique_count * 2),
          tags: [personality.toLowerCase().replace(/ /g, "-"), industry, colors.color_scheme, spacing.density, shapes.corner_style],
        },
      };

      results.push(analysis);
      success++;
      console.log(`  ✅ ${personality} | ${industry} | ${colors.color_count} colors | ${typography.fonts.length} fonts`);

    } catch (err) {
      failed++;
      console.log(`  ❌ ${err.message.slice(0, 80)}`);
    }

    // Delay between requests
    if (i < SITES.length - 1) {
      await new Promise(r => setTimeout(r, DELAY));
    }
  }

  await browser.close();

  // Save results
  await mkdir("d:/Documents/devsigner/data", { recursive: true });
  await writeFile(OUTPUT_PATH, JSON.stringify(results, null, 2), "utf-8");

  console.log(`\n${"=".repeat(50)}`);
  console.log(`Done! ${success} succeeded, ${failed} failed`);
  console.log(`Saved to: ${OUTPUT_PATH}`);
  console.log(`${"=".repeat(50)}`);
}

main().catch(console.error);
