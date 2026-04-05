#!/usr/bin/env node
/**
 * Batch crawl sites and extract design patterns.
 *
 * Usage:
 *   node scripts/crawl-sites.mjs                    # crawl all
 *   node scripts/crawl-sites.mjs --category saas    # crawl one category
 *   node scripts/crawl-sites.mjs --limit 10         # crawl first N per category
 *
 * Output: data/crawled/design-patterns.json
 */

import puppeteer from "puppeteer-core";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const VIEWPORT = { width: 1440, height: 900 };
const TIMEOUT = 20000;
const DELAY_BETWEEN = 2000;
const OUTPUT_FILE = join(ROOT, "data", "crawled", "design-patterns.json");

// ---------------------------------------------------------------------------
// Chrome finder
// ---------------------------------------------------------------------------

async function findChrome() {
  const { access } = await import("fs/promises");
  const paths = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    process.env.LOCALAPPDATA + "\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
  ];
  for (const p of paths) {
    try { await access(p); return p; } catch {}
  }
  return null;
}

// ---------------------------------------------------------------------------
// Design data extraction (runs inside the browser)
// ---------------------------------------------------------------------------

async function extractDesignData(page) {
  return page.evaluate(() => {
    const result = {
      colors: { palette: [], colorScheme: "light", colorCount: 0 },
      typography: { fonts: [], sizes: [], weights: [], headingFont: null, bodyFont: null },
      spacing: { values: [], gridAlignedPct: 0, density: "balanced", uniqueCount: 0 },
      layout: { maxWidth: null, hasSidebar: false, hasHero: false, hasStickyHeader: false, hasFooter: false },
      shapes: { cornerStyle: "subtle", shadowStyle: "none", radii: [] },
      components: { buttons: [], cards: [], inputs: [], navs: [] },
    };

    const allElements = document.querySelectorAll("*");
    const colorMap = new Map();
    const fontMap = new Map();
    const sizeMap = new Map();
    const weightMap = new Map();
    const spacingValues = [];
    const radiusValues = [];

    // Sample elements (max 500 for performance)
    const elements = Array.from(allElements).slice(0, 500);

    for (const el of elements) {
      const cs = getComputedStyle(el);

      // Colors
      for (const prop of ["color", "backgroundColor", "borderColor"]) {
        const val = cs[prop];
        if (val && val !== "rgba(0, 0, 0, 0)" && val !== "transparent") {
          colorMap.set(val, (colorMap.get(val) || 0) + 1);
        }
      }

      // Typography
      const font = cs.fontFamily.split(",")[0].trim().replace(/['"]/g, "");
      if (font) fontMap.set(font, (fontMap.get(font) || 0) + 1);

      const size = Math.round(parseFloat(cs.fontSize));
      if (size > 0) sizeMap.set(size, (sizeMap.get(size) || 0) + 1);

      const weight = cs.fontWeight;
      if (weight) weightMap.set(weight, (weightMap.get(weight) || 0) + 1);

      // Spacing
      for (const prop of ["paddingTop", "paddingBottom", "paddingLeft", "paddingRight",
                           "marginTop", "marginBottom", "marginLeft", "marginRight"]) {
        const px = Math.round(parseFloat(cs[prop]));
        if (px > 0 && px < 500) spacingValues.push(px);
      }

      // Border radius
      const radius = Math.round(parseFloat(cs.borderTopLeftRadius));
      if (radius > 0) radiusValues.push(radius);

      // Components
      const tag = el.tagName.toLowerCase();
      if (tag === "button" || (tag === "a" && el.getAttribute("role") === "button")) {
        result.components.buttons.push({
          padding: `${Math.round(parseFloat(cs.paddingTop))}px ${Math.round(parseFloat(cs.paddingLeft))}px`,
          fontSize: Math.round(parseFloat(cs.fontSize)),
          fontWeight: cs.fontWeight,
          borderRadius: Math.round(parseFloat(cs.borderTopLeftRadius)),
          backgroundColor: cs.backgroundColor,
          color: cs.color,
        });
      }

      if (el.classList.contains("card") || el.getAttribute("data-card") !== null ||
          (cs.boxShadow !== "none" && cs.borderRadius !== "0px" && parseFloat(cs.padding) > 10)) {
        if (result.components.cards.length < 10) {
          result.components.cards.push({
            padding: Math.round(parseFloat(cs.padding)),
            borderRadius: Math.round(parseFloat(cs.borderTopLeftRadius)),
            boxShadow: cs.boxShadow !== "none" ? cs.boxShadow : null,
            backgroundColor: cs.backgroundColor,
          });
        }
      }
    }

    // Process colors
    const sortedColors = [...colorMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20);
    const totalColorUsage = sortedColors.reduce((s, [, c]) => s + c, 0);
    result.colors.palette = sortedColors.map(([raw, count]) => ({
      raw, count, pct: Math.round((count / totalColorUsage) * 100),
    }));
    result.colors.colorCount = sortedColors.length;

    // Detect color scheme
    const bgColor = getComputedStyle(document.body).backgroundColor;
    if (bgColor) {
      const match = bgColor.match(/\d+/g);
      if (match) {
        const [r, g, b] = match.map(Number);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        result.colors.colorScheme = luminance < 0.3 ? "dark" : luminance > 0.7 ? "light" : "mixed";
      }
    }

    // Process typography
    result.typography.fonts = [...fontMap.entries()]
      .sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([family, count]) => ({ family, count }));
    result.typography.sizes = [...sizeMap.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([px, count]) => ({ px, count }));
    result.typography.weights = [...weightMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([weight, count]) => ({ weight, count }));

    if (result.typography.fonts.length > 0) {
      result.typography.bodyFont = result.typography.fonts[0].family;
      // Heading font: look for font used in h1-h3
      const headings = document.querySelectorAll("h1, h2, h3");
      if (headings.length > 0) {
        result.typography.headingFont = getComputedStyle(headings[0]).fontFamily.split(",")[0].trim().replace(/['"]/g, "");
      }
    }

    // Process spacing
    const uniqueSpacing = [...new Set(spacingValues)];
    const gridAligned = spacingValues.filter(v => v % 4 === 0).length;
    result.spacing.values = uniqueSpacing.sort((a, b) => a - b).slice(0, 20);
    result.spacing.gridAlignedPct = spacingValues.length > 0 ? Math.round((gridAligned / spacingValues.length) * 100) : 0;
    result.spacing.uniqueCount = uniqueSpacing.length;

    const avgSpacing = spacingValues.length > 0 ? spacingValues.reduce((a, b) => a + b, 0) / spacingValues.length : 16;
    result.spacing.density = avgSpacing < 12 ? "compact" : avgSpacing > 24 ? "spacious" : "balanced";

    // Layout detection
    result.layout.hasHero = !!document.querySelector("[class*='hero'], [class*='Hero'], section:first-of-type");
    result.layout.hasFooter = !!document.querySelector("footer");
    result.layout.hasStickyHeader = !!document.querySelector("[style*='position: sticky'], [style*='position: fixed'], header");
    result.layout.hasSidebar = !!document.querySelector("[class*='sidebar'], [class*='Sidebar'], aside");

    const main = document.querySelector("main, [class*='container'], [class*='wrapper']");
    if (main) {
      result.layout.maxWidth = Math.round(parseFloat(getComputedStyle(main).maxWidth)) || null;
    }

    // Shapes
    const uniqueRadii = [...new Set(radiusValues)];
    result.shapes.radii = uniqueRadii.sort((a, b) => a - b).slice(0, 10);
    const avgRadius = uniqueRadii.length > 0 ? uniqueRadii.reduce((a, b) => a + b, 0) / uniqueRadii.length : 0;
    result.shapes.cornerStyle = avgRadius < 2 ? "sharp" : avgRadius < 6 ? "subtle" : avgRadius < 16 ? "rounded" : "pill";

    const hasShadow = elements.some(el => getComputedStyle(el).boxShadow !== "none");
    result.shapes.shadowStyle = hasShadow ? "subtle" : "none";

    return result;
  });
}

// ---------------------------------------------------------------------------
// Main crawl
// ---------------------------------------------------------------------------

async function crawlSite(browser, url, category) {
  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);
  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36");

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: TIMEOUT });
    await new Promise(r => setTimeout(r, 2000)); // Wait for render

    const title = await page.title();
    const data = await extractDesignData(page);

    return {
      url,
      category,
      title,
      crawledAt: new Date().toISOString(),
      ...data,
    };
  } catch (err) {
    console.error(`  ✗ ${url}: ${err.message}`);
    return null;
  } finally {
    await page.close();
  }
}

async function main() {
  const args = process.argv.slice(2);
  const categoryFilter = args.includes("--category") ? args[args.indexOf("--category") + 1] : null;
  const limitArg = args.includes("--limit") ? parseInt(args[args.indexOf("--limit") + 1]) : Infinity;

  const sitesFile = join(ROOT, "data", "sites-to-crawl.json");
  const sites = JSON.parse(readFileSync(sitesFile, "utf-8"));

  // Load existing results
  let results = [];
  if (existsSync(OUTPUT_FILE)) {
    results = JSON.parse(readFileSync(OUTPUT_FILE, "utf-8"));
    console.log(`Loaded ${results.length} existing results`);
  }
  const crawledUrls = new Set(results.map(r => r.url));

  // Build URL list
  const toCrawl = [];
  for (const [category, urls] of Object.entries(sites)) {
    if (categoryFilter && category !== categoryFilter) continue;
    for (const url of urls.slice(0, limitArg)) {
      if (!crawledUrls.has(url)) {
        toCrawl.push({ url, category });
      }
    }
  }

  console.log(`\n  devsigner pattern crawler\n`);
  console.log(`  Sites to crawl: ${toCrawl.length}`);
  console.log(`  Already crawled: ${crawledUrls.size}\n`);

  if (toCrawl.length === 0) {
    console.log("  Nothing to crawl.");
    return;
  }

  const chromePath = await findChrome();
  if (!chromePath) {
    console.error("Chrome/Edge not found!");
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  });

  let success = 0;
  let fail = 0;

  for (let i = 0; i < toCrawl.length; i++) {
    const { url, category } = toCrawl[i];
    process.stdout.write(`  [${i + 1}/${toCrawl.length}] ${url} ... `);

    const result = await crawlSite(browser, url, category);
    if (result) {
      results.push(result);
      success++;
      console.log(`✓ (${result.colors.colorCount} colors, ${result.typography.fonts.length} fonts)`);
    } else {
      fail++;
    }

    // Save after each site (crash-safe)
    writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));

    // Delay between requests
    if (i < toCrawl.length - 1) {
      await new Promise(r => setTimeout(r, DELAY_BETWEEN));
    }
  }

  await browser.close();

  console.log(`\n  Done: ${success} success, ${fail} failed`);
  console.log(`  Total patterns: ${results.length}`);
  console.log(`  Saved to: ${OUTPUT_FILE}\n`);
}

main().catch(console.error);
