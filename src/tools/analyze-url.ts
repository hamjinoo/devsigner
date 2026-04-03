import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import puppeteer from "puppeteer-core";
import { findChrome } from "./render-and-review.js";
import { parseColor, rgbToHex, contrastRatio, rgbToHsl, type RGB } from "../utils/color-utils.js";

// ─── JSON Schema for PostgreSQL storage ──────────────────────────────────────

export interface DesignAnalysis {
  // Metadata
  id?: string;
  url: string;
  analyzed_at: string;
  viewport: { width: number; height: number };
  page_title: string;
  screenshot_base64?: string;

  // Colors
  colors: {
    palette: Array<{
      hex: string;
      rgb: { r: number; g: number; b: number };
      hsl: { h: number; s: number; l: number };
      count: number;
      percentage: number;
      usage: "background" | "text" | "border" | "accent" | "unknown";
    }>;
    dominant_color: string;
    background_color: string;
    text_color: string;
    accent_color: string | null;
    contrast_pairs: Array<{
      foreground: string;
      background: string;
      ratio: number;
      wcag_aa: boolean;
      wcag_aaa: boolean;
    }>;
    color_scheme: "light" | "dark" | "mixed";
    color_count: number;
  };

  // Typography
  typography: {
    fonts: Array<{
      family: string;
      count: number;
      is_heading: boolean;
      is_body: boolean;
    }>;
    font_sizes: Array<{
      size_px: number;
      count: number;
      usage: "heading" | "body" | "caption" | "unknown";
    }>;
    font_weights: Array<{
      weight: number;
      count: number;
    }>;
    line_heights: Array<{
      value: number;
      count: number;
    }>;
    type_scale_ratio: number | null;
    heading_font: string | null;
    body_font: string | null;
  };

  // Spacing
  spacing: {
    values: Array<{
      value_px: number;
      count: number;
      property: string;
    }>;
    grid_aligned_percentage: number;
    base_unit: number;
    density: "spacious" | "balanced" | "compact";
    unique_count: number;
  };

  // Layout
  layout: {
    max_width: number | null;
    has_sidebar: boolean;
    has_hero: boolean;
    has_sticky_header: boolean;
    has_footer: boolean;
    column_count: number;
    is_centered: boolean;
    is_responsive: boolean;
    viewport_coverage: number;
  };

  // Shapes
  shapes: {
    border_radii: Array<{
      value_px: number;
      count: number;
    }>;
    shadows: Array<{
      value: string;
      count: number;
    }>;
    corner_style: "sharp" | "subtle" | "rounded" | "pill";
    shadow_style: "none" | "subtle" | "medium" | "dramatic";
  };

  // Overall
  overall: {
    design_personality: string;
    estimated_industry: string;
    visual_weight: "light" | "medium" | "heavy";
    whitespace_ratio: number;
    complexity_score: number;
    tags: string[];
  };
}

// ─── Browser-based extraction ────────────────────────────────────────────────

export async function extractDesignData(page: any): Promise<{
  colors: any;
  typography: any;
  spacing: any;
  layout: any;
  shapes: any;
  title: string;
}> {
  return await page.evaluate(() => {
    const allElements = document.querySelectorAll("*");
    const computed: Array<{ tag: string; styles: CSSStyleDeclaration; rect: DOMRect }> = [];

    for (const el of allElements) {
      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) continue;
      computed.push({ tag: el.tagName.toLowerCase(), styles: style, rect });
    }

    // ── Colors ──
    const colorCounts = new Map<string, { count: number; usage: string }>();
    const bgColors: string[] = [];
    const textColors: string[] = [];

    function addColor(color: string, usage: string) {
      const existing = colorCounts.get(color);
      if (existing) {
        existing.count++;
      } else {
        colorCounts.set(color, { count: 1, usage });
      }
    }

    for (const { styles } of computed) {
      const bg = styles.backgroundColor;
      const fg = styles.color;
      const border = styles.borderColor;

      if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") {
        addColor(bg, "background");
        bgColors.push(bg);
      }
      if (fg) {
        addColor(fg, "text");
        textColors.push(fg);
      }
      if (border && border !== "rgba(0, 0, 0, 0)" && border !== fg && border !== bg) {
        addColor(border, "border");
      }
    }

    // ── Typography ──
    const fontCounts = new Map<string, { count: number; isHeading: boolean; isBody: boolean }>();
    const sizeCounts = new Map<number, { count: number; usage: string }>();
    const weightCounts = new Map<number, number>();
    const lineHeightCounts = new Map<number, number>();
    const headingTags = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);

    for (const { tag, styles } of computed) {
      const family = styles.fontFamily.split(",")[0].trim().replace(/['"]/g, "");
      const size = parseFloat(styles.fontSize);
      const weight = parseInt(styles.fontWeight) || 400;
      const lh = parseFloat(styles.lineHeight) / size;
      const isHeading = headingTags.has(tag);

      const existing = fontCounts.get(family);
      if (existing) {
        existing.count++;
        if (isHeading) existing.isHeading = true;
        else existing.isBody = true;
      } else {
        fontCounts.set(family, { count: 1, isHeading, isBody: !isHeading });
      }

      if (!isNaN(size) && size > 0) {
        const rounded = Math.round(size);
        const sizeEntry = sizeCounts.get(rounded);
        if (sizeEntry) sizeEntry.count++;
        else sizeCounts.set(rounded, {
          count: 1,
          usage: isHeading ? "heading" : size > 18 ? "heading" : size < 13 ? "caption" : "body"
        });
      }

      weightCounts.set(weight, (weightCounts.get(weight) || 0) + 1);

      if (!isNaN(lh) && lh > 0 && lh < 5) {
        const roundedLh = Math.round(lh * 10) / 10;
        lineHeightCounts.set(roundedLh, (lineHeightCounts.get(roundedLh) || 0) + 1);
      }
    }

    // ── Spacing ──
    const spacingCounts = new Map<string, { count: number; property: string }>();

    for (const { styles } of computed) {
      for (const prop of ["marginTop", "marginBottom", "marginLeft", "marginRight",
        "paddingTop", "paddingBottom", "paddingLeft", "paddingRight", "gap"]) {
        const val = parseFloat((styles as any)[prop]);
        if (!isNaN(val) && val > 0 && val < 500) {
          const rounded = Math.round(val);
          const key = `${rounded}`;
          const existing = spacingCounts.get(key);
          if (existing) existing.count++;
          else spacingCounts.set(key, { count: 1, property: prop });
        }
      }
    }

    // ── Layout ──
    const body = document.body;
    const bodyRect = body.getBoundingClientRect();
    const maxContentWidth = Math.max(
      ...Array.from(document.querySelectorAll("main, [role='main'], .container, .content, article, section"))
        .map(el => el.getBoundingClientRect().width)
        .filter(w => w > 0),
      0
    );

    const hasSidebar = !!document.querySelector("aside, nav[class*='sidebar'], [class*='sidebar'], [class*='side-nav']");
    const hasHero = !!document.querySelector("[class*='hero'], [class*='banner'], header + section, header + div > section:first-child");
    const hasStickyHeader = Array.from(document.querySelectorAll("header, nav")).some(
      el => window.getComputedStyle(el).position === "sticky" || window.getComputedStyle(el).position === "fixed"
    );
    const hasFooter = !!document.querySelector("footer");

    // Estimate columns
    let maxCols = 1;
    for (const el of document.querySelectorAll("[style*='grid'], [class*='grid'], [style*='flex'], [class*='flex']")) {
      const children = el.children;
      if (children.length >= 2) {
        const firstRect = children[0].getBoundingClientRect();
        let cols = 1;
        for (let i = 1; i < children.length; i++) {
          const r = children[i].getBoundingClientRect();
          if (Math.abs(r.top - firstRect.top) < 5) cols++;
          else break;
        }
        maxCols = Math.max(maxCols, cols);
      }
    }

    // ── Shapes ──
    const radiusCounts = new Map<number, number>();
    const shadowCounts = new Map<string, number>();

    for (const { styles } of computed) {
      const radius = parseFloat(styles.borderRadius);
      if (!isNaN(radius) && radius > 0) {
        const rounded = Math.round(radius);
        radiusCounts.set(rounded, (radiusCounts.get(rounded) || 0) + 1);
      }

      const shadow = styles.boxShadow;
      if (shadow && shadow !== "none") {
        shadowCounts.set(shadow, (shadowCounts.get(shadow) || 0) + 1);
      }
    }

    // ── Serialize Maps ──
    return {
      title: document.title,
      colors: {
        counts: Object.fromEntries(colorCounts),
        bgColors: [...new Set(bgColors)].slice(0, 20),
        textColors: [...new Set(textColors)].slice(0, 20),
      },
      typography: {
        fonts: Object.fromEntries(fontCounts),
        sizes: Object.fromEntries(sizeCounts),
        weights: Object.fromEntries(weightCounts),
        lineHeights: Object.fromEntries(lineHeightCounts),
      },
      spacing: Object.fromEntries(spacingCounts),
      layout: {
        maxContentWidth: maxContentWidth || bodyRect.width,
        viewportWidth: window.innerWidth,
        hasSidebar,
        hasHero,
        hasStickyHeader,
        hasFooter,
        maxCols,
        isCentered: maxContentWidth > 0 && maxContentWidth < window.innerWidth * 0.9,
      },
      shapes: {
        radii: Object.fromEntries(radiusCounts),
        shadows: Object.fromEntries(shadowCounts),
      },
    };
  });
}

// ─── Post-processing (Node.js side) ─────────────────────────────────────────

export function parseRGBString(str: string): RGB | null {
  const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return null;
  return { r: parseInt(m[1]), g: parseInt(m[2]), b: parseInt(m[3]) };
}

export function processColors(rawColors: any) {
  const palette: DesignAnalysis["colors"]["palette"] = [];
  const totalCount = Object.values(rawColors.counts).reduce((s: number, v: any) => s + v.count, 0) as number;

  for (const [colorStr, data] of Object.entries(rawColors.counts) as Array<[string, { count: number; usage: string }]>) {
    const rgb = parseRGBString(colorStr);
    if (!rgb) continue;
    const hex = rgbToHex(rgb);
    const hsl = rgbToHsl(rgb);

    palette.push({
      hex,
      rgb,
      hsl,
      count: data.count,
      percentage: Math.round((data.count / totalCount) * 100),
      usage: data.usage as any,
    });
  }

  palette.sort((a, b) => b.count - a.count);

  // Contrast pairs
  const contrastPairs: DesignAnalysis["colors"]["contrast_pairs"] = [];
  const textHexes = rawColors.textColors.map((c: string) => { const r = parseRGBString(c); return r ? rgbToHex(r) : null; }).filter(Boolean);
  const bgHexes = rawColors.bgColors.map((c: string) => { const r = parseRGBString(c); return r ? rgbToHex(r) : null; }).filter(Boolean);

  const seenPairs = new Set<string>();
  for (const fg of [...new Set(textHexes)] as string[]) {
    for (const bg of [...new Set(bgHexes)] as string[]) {
      if (fg === bg) continue;
      const key = `${fg}|${bg}`;
      if (seenPairs.has(key)) continue;
      seenPairs.add(key);

      const fgRgb = parseColor(fg);
      const bgRgb = parseColor(bg);
      if (!fgRgb || !bgRgb) continue;

      const ratio = Math.round(contrastRatio(fgRgb, bgRgb) * 100) / 100;
      if (ratio < 10) {
        contrastPairs.push({
          foreground: fg,
          background: bg,
          ratio,
          wcag_aa: ratio >= 4.5,
          wcag_aaa: ratio >= 7,
        });
      }
    }
  }
  contrastPairs.sort((a, b) => a.ratio - b.ratio);

  // Determine color scheme
  const bgPalette = palette.filter(c => c.usage === "background");
  const dominantBg = bgPalette[0];
  const colorScheme = dominantBg && dominantBg.hsl.l < 0.3 ? "dark" : dominantBg && dominantBg.hsl.l > 0.7 ? "light" : "mixed";

  // Find accent (most saturated non-bg non-text color)
  const accentCandidate = palette.filter(c => c.hsl.s > 0.4 && c.usage !== "background").sort((a, b) => b.hsl.s - a.hsl.s)[0];

  return {
    palette: palette.slice(0, 20),
    dominant_color: palette[0]?.hex || "#000000",
    background_color: bgPalette[0]?.hex || "#ffffff",
    text_color: palette.find(c => c.usage === "text")?.hex || "#000000",
    accent_color: accentCandidate?.hex || null,
    contrast_pairs: contrastPairs.slice(0, 10),
    color_scheme: colorScheme as any,
    color_count: palette.length,
  };
}

export function processTypography(rawTypo: any) {
  const fonts = Object.entries(rawTypo.fonts).map(([family, data]: [string, any]) => ({
    family,
    count: data.count,
    is_heading: data.isHeading,
    is_body: data.isBody,
  })).sort((a, b) => b.count - a.count);

  const sizes = Object.entries(rawTypo.sizes).map(([size, data]: [string, any]) => ({
    size_px: parseInt(size),
    count: data.count,
    usage: data.usage,
  })).sort((a, b) => b.size_px - a.size_px);

  const weights = Object.entries(rawTypo.weights).map(([w, count]: [string, any]) => ({
    weight: parseInt(w),
    count,
  })).sort((a, b) => b.count - a.count);

  const lineHeights = Object.entries(rawTypo.lineHeights).map(([lh, count]: [string, any]) => ({
    value: parseFloat(lh),
    count,
  })).sort((a, b) => b.count - a.count);

  // Estimate type scale ratio
  const sortedSizes = sizes.map(s => s.size_px).filter(s => s >= 12).sort((a, b) => a - b);
  let scaleRatio: number | null = null;
  if (sortedSizes.length >= 3) {
    const ratios = [];
    for (let i = 1; i < sortedSizes.length; i++) {
      ratios.push(sortedSizes[i] / sortedSizes[i - 1]);
    }
    const avg = ratios.reduce((s, r) => s + r, 0) / ratios.length;
    if (avg > 1.05 && avg < 2) scaleRatio = Math.round(avg * 1000) / 1000;
  }

  return {
    fonts,
    font_sizes: sizes,
    font_weights: weights,
    line_heights: lineHeights,
    type_scale_ratio: scaleRatio,
    heading_font: fonts.find(f => f.is_heading)?.family || null,
    body_font: fonts.find(f => f.is_body)?.family || fonts[0]?.family || null,
  };
}

export function processSpacing(rawSpacing: any) {
  const values = Object.entries(rawSpacing).map(([px, data]: [string, any]) => ({
    value_px: parseInt(px),
    count: data.count,
    property: data.property,
  })).sort((a, b) => b.count - a.count);

  const total = values.reduce((s, v) => s + v.count, 0);
  const gridAligned = values.filter(v => v.value_px % 4 === 0).reduce((s, v) => s + v.count, 0);

  // Estimate base unit
  const common = values.slice(0, 10).map(v => v.value_px);
  const gcdAll = common.reduce((a, b) => gcd(a, b), common[0] || 4);
  const baseUnit = gcdAll >= 4 ? gcdAll : 4;

  // Density
  const avgSpacing = values.length > 0 ? values.reduce((s, v) => s + v.value_px * v.count, 0) / total : 16;
  const density = avgSpacing > 24 ? "spacious" : avgSpacing < 12 ? "compact" : "balanced";

  return {
    values: values.slice(0, 20),
    grid_aligned_percentage: total > 0 ? Math.round((gridAligned / total) * 100) : 0,
    base_unit: baseUnit,
    density: density as any,
    unique_count: values.length,
  };
}

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) { [a, b] = [b, a % b]; }
  return a;
}

export function processShapes(rawShapes: any) {
  const radii = Object.entries(rawShapes.radii).map(([px, count]: [string, any]) => ({
    value_px: parseInt(px),
    count,
  })).sort((a, b) => b.count - a.count);

  const shadows = Object.entries(rawShapes.shadows).map(([val, count]: [string, any]) => ({
    value: val,
    count,
  })).sort((a, b) => b.count - a.count);

  // Determine corner style
  const avgRadius = radii.length > 0
    ? radii.reduce((s, r) => s + r.value_px * r.count, 0) / radii.reduce((s, r) => s + r.count, 0)
    : 0;
  const cornerStyle = avgRadius < 2 ? "sharp" : avgRadius < 6 ? "subtle" : avgRadius < 16 ? "rounded" : "pill";

  // Determine shadow style
  const shadowCount = shadows.reduce((s, sh) => s + sh.count, 0);
  const shadowStyle = shadowCount === 0 ? "none"
    : shadows.some(s => s.value.includes("20px") || s.value.includes("25px") || s.value.includes("30px")) ? "dramatic"
    : shadows.some(s => s.value.includes("10px") || s.value.includes("12px")) ? "medium"
    : "subtle";

  return {
    border_radii: radii.slice(0, 10),
    shadows: shadows.slice(0, 5),
    corner_style: cornerStyle as any,
    shadow_style: shadowStyle as any,
  };
}

export function estimatePersonality(colors: any, typography: any, spacing: any, shapes: any): string {
  const scores: Record<string, number> = {
    "Bold Minimal": 0,
    "Warm Professional": 0,
    "Energetic Pop": 0,
    "Elegant Editorial": 0,
    "Data Dense": 0,
    "Soft Wellness": 0,
  };

  // Bold Minimal
  if (colors.color_scheme === "dark") scores["Bold Minimal"] += 3;
  if (shapes.shadow_style === "none") scores["Bold Minimal"] += 2;
  if (colors.color_count < 8) scores["Bold Minimal"] += 2;
  if (shapes.corner_style === "sharp" || shapes.corner_style === "subtle") scores["Bold Minimal"] += 1;
  if (spacing.density === "spacious") scores["Bold Minimal"] += 2;

  // Warm Professional
  if (colors.color_scheme === "light") scores["Warm Professional"] += 3;
  if (shapes.shadow_style === "subtle") scores["Warm Professional"] += 2;
  if (shapes.corner_style === "rounded") scores["Warm Professional"] += 2;
  if (spacing.density === "balanced") scores["Warm Professional"] += 1;
  if (colors.color_count >= 8 && colors.color_count <= 15) scores["Warm Professional"] += 1;

  // Energetic Pop
  if (colors.color_count > 15) scores["Energetic Pop"] += 3;
  if (shapes.corner_style === "pill") scores["Energetic Pop"] += 2;
  if (shapes.shadow_style === "dramatic") scores["Energetic Pop"] += 2;
  if (spacing.density === "balanced") scores["Energetic Pop"] += 1;
  if (colors.accent_color) {
    const accent = colors.palette?.find((c: any) => c.hex === colors.accent_color);
    if (accent && accent.hsl.s > 0.7) scores["Energetic Pop"] += 2;
  }

  // Elegant Editorial
  if (typography.heading_font && typography.heading_font.toLowerCase().includes("serif")) scores["Elegant Editorial"] += 4;
  if (shapes.shadow_style === "none") scores["Elegant Editorial"] += 2;
  if (spacing.density === "spacious") scores["Elegant Editorial"] += 2;
  if (shapes.corner_style === "sharp") scores["Elegant Editorial"] += 1;

  // Data Dense
  if (spacing.density === "compact") scores["Data Dense"] += 3;
  if (shapes.shadow_style === "none") scores["Data Dense"] += 2;
  if (colors.color_count < 6) scores["Data Dense"] += 2;
  if (shapes.corner_style === "sharp" || shapes.corner_style === "subtle") scores["Data Dense"] += 1;

  // Soft Wellness
  if (shapes.corner_style === "pill") scores["Soft Wellness"] += 3;
  if (shapes.shadow_style === "subtle") scores["Soft Wellness"] += 2;
  if (spacing.density === "spacious") scores["Soft Wellness"] += 2;
  if (colors.color_scheme === "light") scores["Soft Wellness"] += 1;
  if (colors.color_count < 10) scores["Soft Wellness"] += 1;

  // Find highest score; ties go to "Warm Professional"
  let best = "Warm Professional";
  let bestScore = scores["Warm Professional"];
  for (const [name, score] of Object.entries(scores)) {
    if (score > bestScore) {
      best = name;
      bestScore = score;
    }
  }
  return best;
}

export function estimateIndustry(title: string, colors: any, url?: string): string {
  // Check URL domain first (more reliable)
  if (url) {
    const domain = url.toLowerCase();
    if (/stripe\.com|wise\.com|mercury\.com/.test(domain)) return "fintech";
    if (/github\.com|vercel\.com|netlify|heroku|supabase\.com|tailwindcss\.com|nextjs\.org|astro\.build|vitejs\.dev/.test(domain)) return "developer_tools";
    if (/shopify\.com|gumroad\.com|amazon/.test(domain)) return "ecommerce";
    if (/duolingo|coursera|udemy/.test(domain)) return "education";
    if (/calm\.com|headspace\.com/.test(domain)) return "healthcare";
    if (/discord|slack|twitter/.test(domain)) return "social";
    if (/linear\.app|notion\.so|todoist/.test(domain)) return "saas";
    if (/figma\.com|framer\.com|canva/.test(domain)) return "design_tools";
  }

  // Fall back to title matching
  const lower = title.toLowerCase();
  if (/bank|finance|pay|money|crypto|fintech/i.test(lower)) return "fintech";
  if (/health|medical|wellness|care|calm/i.test(lower)) return "healthcare";
  if (/shop|store|buy|cart|ecommerce/i.test(lower)) return "ecommerce";
  if (/learn|course|education|school/i.test(lower)) return "education";
  if (/dashboard|analytics|admin|saas/i.test(lower)) return "saas";
  if (/social|chat|message|community/i.test(lower)) return "social";
  if (/dev|code|api|git|terminal/i.test(lower)) return "developer_tools";
  if (/design|figma|sketch|prototype/i.test(lower)) return "design_tools";
  return "general";
}

// ─── Tool Registration ──────────────────────────────────────────────────────

export function registerAnalyzeUrl(server: McpServer): void {
  server.tool(
    "analyze_url",
    "Analyze any live website's design by URL. Extracts colors, typography, spacing, layout, shapes, and overall design personality. Returns structured data ready for database storage. Use this to study how real products are designed.",
    {
      url: z.string().url().describe("URL to analyze (e.g., 'https://stripe.com')"),
      viewport_width: z.number().default(1440).describe("Viewport width in pixels"),
      viewport_height: z.number().default(900).describe("Viewport height in pixels"),
      include_screenshot: z.boolean().default(true).describe("Include a screenshot in the response"),
      scroll_to_bottom: z.boolean().default(false).describe("Scroll to bottom before analyzing (captures full-page styles)"),
    },
    async ({ url, viewport_width, viewport_height, include_screenshot, scroll_to_bottom }) => {
      const chromePath = await findChrome();
      if (!chromePath) {
        return {
          content: [{ type: "text" as const, text: "Chrome or Edge not found. Install Google Chrome to use analyze_url." }],
          isError: true,
        };
      }

      let browser;
      try {
        browser = await puppeteer.launch({
          executablePath: chromePath,
          headless: true,
          args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu", "--disable-web-security"],
        });

        const page = await browser.newPage();
        await page.setViewport({ width: viewport_width, height: viewport_height });
        await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
        // Wait for rendering
        await new Promise(r => setTimeout(r, 2000));

        if (scroll_to_bottom) {
          await page.evaluate(async () => {
            await new Promise<void>(resolve => {
              let distance = 300;
              const timer = setInterval(() => {
                window.scrollBy(0, distance);
                if (window.scrollY + window.innerHeight >= document.body.scrollHeight) {
                  clearInterval(timer);
                  window.scrollTo(0, 0);
                  resolve();
                }
              }, 100);
              setTimeout(() => { clearInterval(timer); window.scrollTo(0, 0); resolve(); }, 10000);
            });
          });
          await new Promise(r => setTimeout(r, 1000));
        }

        // Extract design data
        const rawData = await extractDesignData(page);

        // Screenshot
        let screenshotBase64: string | undefined;
        if (include_screenshot) {
          screenshotBase64 = await page.screenshot({ type: "png", encoding: "base64", fullPage: false }) as string;
        }

        await browser.close();
        browser = null;

        // Process data
        const colors = processColors(rawData.colors);
        const typography = processTypography(rawData.typography);
        const spacing = processSpacing(rawData.spacing);
        const shapes = processShapes(rawData.shapes);
        const personality = estimatePersonality(colors, typography, spacing, shapes);
        const industry = estimateIndustry(rawData.title, colors, url);

        // Build analysis object (PostgreSQL-ready)
        const analysis: DesignAnalysis = {
          url,
          analyzed_at: new Date().toISOString(),
          viewport: { width: viewport_width, height: viewport_height },
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
            complexity_score: Math.min(100, colors.color_count * 3 + typography.font_sizes.length * 5 + spacing.unique_count * 2),
            tags: [personality.toLowerCase().replace(/ /g, "-"), industry, colors.color_scheme, spacing.density, shapes.corner_style],
          },
        };

        // Build response
        const content: Array<{ type: "image"; data: string; mimeType: string } | { type: "text"; text: string }> = [];

        if (screenshotBase64) {
          content.push({ type: "image" as const, data: screenshotBase64, mimeType: "image/png" });
        }

        const lines = [
          `# Design Analysis: ${rawData.title || url}`,
          ``,
          `**URL:** ${url}`,
          `**Analyzed:** ${analysis.analyzed_at}`,
          `**Viewport:** ${viewport_width}x${viewport_height}`,
          ``,
          `---`,
          ``,
          `## Overall`,
          `| Property | Value |`,
          `|----------|-------|`,
          `| Personality | **${personality}** |`,
          `| Industry | ${industry} |`,
          `| Color Scheme | ${colors.color_scheme} |`,
          `| Density | ${spacing.density} |`,
          `| Corners | ${shapes.corner_style} |`,
          `| Shadows | ${shapes.shadow_style} |`,
          `| Complexity | ${analysis.overall.complexity_score}/100 |`,
          ``,
          `---`,
          ``,
          `## Colors (${colors.color_count} unique)`,
          ``,
          `| Color | Hex | Usage | Share |`,
          `|-------|-----|-------|-------|`,
          ...colors.palette.slice(0, 10).map((c: any) =>
            `| ${c.hex} | \`${c.hex}\` | ${c.usage} | ${c.percentage}% |`
          ),
          ``,
          `**Background:** \`${colors.background_color}\` | **Text:** \`${colors.text_color}\` | **Accent:** \`${colors.accent_color || "none"}\``,
          ``,
        ];

        if (colors.contrast_pairs.length > 0) {
          lines.push(`### Contrast Issues`);
          for (const pair of colors.contrast_pairs.filter((p: any) => !p.wcag_aa).slice(0, 5)) {
            lines.push(`- \`${pair.foreground}\` on \`${pair.background}\`: ${pair.ratio}:1 (${pair.wcag_aa ? "AA" : "FAIL"})`);
          }
          lines.push(``);
        }

        lines.push(
          `---`,
          ``,
          `## Typography`,
          ``,
          `| Font | Count | Role |`,
          `|------|-------|------|`,
          ...typography.fonts.slice(0, 5).map((f: any) =>
            `| ${f.family} | ${f.count} | ${f.is_heading ? "heading" : ""} ${f.is_body ? "body" : ""} |`
          ),
          ``,
          `**Type Scale:** ${typography.font_sizes.slice(0, 8).map((s: any) => `${s.size_px}px`).join(" → ")}`,
          `**Scale Ratio:** ${typography.type_scale_ratio || "irregular"}`,
          `**Heading Font:** ${typography.heading_font || "same as body"}`,
          `**Body Font:** ${typography.body_font || "unknown"}`,
          ``,
          `---`,
          ``,
          `## Spacing`,
          ``,
          `**Grid Alignment:** ${spacing.grid_aligned_percentage}% on 4px grid`,
          `**Base Unit:** ${spacing.base_unit}px`,
          `**Density:** ${spacing.density}`,
          `**Unique Values:** ${spacing.unique_count}`,
          ``,
          `Top spacing values: ${spacing.values.slice(0, 8).map((v: any) => `${v.value_px}px(×${v.count})`).join(", ")}`,
          ``,
          `---`,
          ``,
          `## Layout`,
          ``,
          `| Property | Value |`,
          `|----------|-------|`,
          `| Max Width | ${analysis.layout.max_width ? `${analysis.layout.max_width}px` : "full-width"} |`,
          `| Columns | ${analysis.layout.column_count} |`,
          `| Sidebar | ${analysis.layout.has_sidebar ? "Yes" : "No"} |`,
          `| Sticky Header | ${analysis.layout.has_sticky_header ? "Yes" : "No"} |`,
          `| Hero Section | ${analysis.layout.has_hero ? "Yes" : "No"} |`,
          `| Footer | ${analysis.layout.has_footer ? "Yes" : "No"} |`,
          `| Centered | ${analysis.layout.is_centered ? "Yes" : "No"} |`,
          ``,
          `---`,
          ``,
          `## Shapes`,
          ``,
          `**Corner Style:** ${shapes.corner_style}`,
          `Border radii: ${shapes.border_radii.slice(0, 5).map((r: any) => `${r.value_px}px(×${r.count})`).join(", ") || "none"}`,
          ``,
          `**Shadow Style:** ${shapes.shadow_style}`,
          `Shadows: ${shapes.shadows.length} unique values`,
          ``,
          `---`,
          ``,
          `## JSON (PostgreSQL-ready)`,
          ``,
          "```json",
          JSON.stringify(analysis, null, 2),
          "```",
        );

        content.push({ type: "text" as const, text: lines.join("\n") });

        return { content };
      } catch (err) {
        if (browser) await browser.close().catch(() => {});
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: "text" as const, text: `Failed to analyze ${url}: ${message}` }],
          isError: true,
        };
      }
    }
  );
}
