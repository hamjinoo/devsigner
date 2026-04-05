/**
 * Design Transform — the core design generator
 *
 * Takes user's existing code + generated design system
 * → Produces a beautifully redesigned version
 * → Renders before/after screenshots
 * → Returns everything the user needs
 */

import puppeteer from "puppeteer-core";
import { findChrome, wrapInHTML } from "../tools/render-and-review.js";
import { generateDesignSystem, type DesignSystemConfig, type GeneratedDesignSystem } from "./design-system.js";
import { detectPageType } from "../context/page-type-detector.js";

export interface TransformOutput {
  beforeScreenshot: string;  // base64 PNG
  afterScreenshot: string;   // base64 PNG
  designSystem: GeneratedDesignSystem;
  redesignedCode: string;
  pageType: string;
}

/**
 * Inject the design system CSS into the user's code.
 * Handles both full HTML documents and code fragments.
 */
function injectDesignSystem(code: string, ds: GeneratedDesignSystem): string {
  const styleTag = `<style id="devsigner-design-system">\n${ds.css}\n</style>`;

  // If it's a full HTML document, inject into <head>
  if (code.includes("<head>")) {
    return code.replace("<head>", `<head>\n${styleTag}`);
  }

  if (code.includes("<!DOCTYPE") || code.includes("<html")) {
    return code.replace(/<html[^>]*>/, (match) => `${match}\n<head>${styleTag}</head>`);
  }

  // For fragments, wrap with the design system
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
${styleTag}
</head>
<body>
${code}
</body>
</html>`;
}

/**
 * Main transform function.
 * Takes code → generates design system → injects → renders before/after.
 */
export async function designTransform(
  code: string,
  config: DesignSystemConfig = {},
): Promise<TransformOutput> {
  // Auto-detect page type
  const pageType = config.pageType ?? detectPageType(code);
  const fullConfig = { ...config, pageType: pageType as DesignSystemConfig["pageType"] };

  // Generate the design system
  const ds = generateDesignSystem(fullConfig);

  // Create the redesigned code
  const redesignedCode = injectDesignSystem(code, ds);

  // Render both versions
  const chromePath = await findChrome();
  if (!chromePath) {
    throw new Error("Chrome/Edge not found. Install Chrome or Edge for visual preview.");
  }

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });

  try {
    const viewport = { width: 1280, height: 800 };
    const page = await browser.newPage();
    await page.setViewport(viewport);

    // Render BEFORE (original code, wrapped minimally)
    const beforeHTML = wrapInHTML(code, viewport);
    await page.setContent(beforeHTML, { waitUntil: "domcontentloaded", timeout: 15000 });
    await new Promise((r) => setTimeout(r, 500));
    const beforeScreenshot = (await page.screenshot({
      type: "png",
      encoding: "base64",
      fullPage: false,
    })) as string;

    // Render AFTER (with design system injected)
    await page.setContent(redesignedCode, { waitUntil: "domcontentloaded", timeout: 15000 });
    await new Promise((r) => setTimeout(r, 500));
    const afterScreenshot = (await page.screenshot({
      type: "png",
      encoding: "base64",
      fullPage: false,
    })) as string;

    await page.close();

    return {
      beforeScreenshot,
      afterScreenshot,
      designSystem: ds,
      redesignedCode,
      pageType,
    };
  } finally {
    await browser.close();
  }
}
