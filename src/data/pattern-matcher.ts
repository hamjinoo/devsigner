/**
 * Pattern Matcher — the AlphaGo of design
 *
 * Instead of generating design from math formulas,
 * selects real patterns from crawled site data.
 *
 * "What do the best SaaS sites actually use for buttons?"
 * → Look at the data, find the most common pattern, return that.
 */

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CrawledSite {
  url: string;
  category: string;
  title: string;
  colors: {
    palette: Array<{ raw: string; count: number; pct: number }>;
    colorScheme: "light" | "dark" | "mixed";
    colorCount: number;
  };
  typography: {
    fonts: Array<{ family: string; count: number }>;
    sizes: Array<{ px: number; count: number }>;
    weights: Array<{ weight: string; count: number }>;
    headingFont: string | null;
    bodyFont: string | null;
  };
  spacing: {
    values: number[];
    gridAlignedPct: number;
    density: "spacious" | "balanced" | "compact";
    uniqueCount: number;
  };
  shapes: {
    cornerStyle: string;
    shadowStyle: string;
    radii: number[];
  };
  components: {
    buttons: Array<{
      padding: string;
      fontSize: number;
      fontWeight: string;
      borderRadius: number;
      backgroundColor: string;
      color: string;
    }>;
    cards: Array<{
      padding: number;
      borderRadius: number;
      boxShadow: string | null;
      backgroundColor: string;
    }>;
  };
}

export interface DesignPattern {
  // Typography
  topFonts: Array<{ family: string; count: number; pct: number }>;
  topTypeSizes: number[];
  topFontWeights: string[];
  headingFont: string;
  bodyFont: string;

  // Colors
  colorScheme: "light" | "dark";
  avgColorCount: number;

  // Spacing
  avgGridAlignment: number;
  dominantDensity: string;
  commonSpacingValues: number[];

  // Shapes
  dominantCornerStyle: string;
  avgBorderRadius: number;
  dominantShadowStyle: string;

  // Components
  buttonPattern: {
    padding: string;
    fontSize: number;
    fontWeight: string;
    borderRadius: number;
  } | null;
  cardPattern: {
    padding: number;
    borderRadius: number;
    hasShadow: boolean;
  } | null;

  sampleSize: number;
}

// ---------------------------------------------------------------------------
// Load crawled data
// ---------------------------------------------------------------------------

let crawledCache: CrawledSite[] | null = null;

export function loadCrawledData(): CrawledSite[] {
  if (crawledCache) return crawledCache;

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    join(__dirname, "../../data/crawled/design-patterns.json"),
    join(__dirname, "../data/crawled/design-patterns.json"),
    join(__dirname, "../../../data/crawled/design-patterns.json"),
  ];

  for (const p of candidates) {
    try {
      const raw = readFileSync(p, "utf-8");
      crawledCache = JSON.parse(raw);
      return crawledCache!;
    } catch {
      // try next
    }
  }

  crawledCache = [];
  return crawledCache;
}

// ---------------------------------------------------------------------------
// Pattern extraction
// ---------------------------------------------------------------------------

function mode<T>(arr: T[]): T | undefined {
  const counts = new Map<T, number>();
  for (const v of arr) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best: T | undefined;
  let bestCount = 0;
  for (const [v, c] of counts) {
    if (c > bestCount) { best = v; bestCount = c; }
  }
  return best;
}

function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function extractPattern(sites: CrawledSite[]): DesignPattern {
  if (sites.length === 0) {
    return emptyPattern();
  }

  // Typography — find most popular fonts across all sites
  const fontCounts = new Map<string, number>();
  const skipFonts = new Set(["", "inherit", "initial", "system-ui", "-apple-system", "sans-serif", "serif", "monospace"]);

  for (const site of sites) {
    for (const f of site.typography.fonts) {
      const name = f.family.trim();
      if (skipFonts.has(name) || name.length > 40 || name.length < 2) continue;
      fontCounts.set(name, (fontCounts.get(name) ?? 0) + 1);
    }
  }

  const topFonts = [...fontCounts.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([family, count]) => ({ family, count, pct: Math.round((count / sites.length) * 100) }));

  // Type sizes — find the most common scales
  const sizeFreq = new Map<number, number>();
  for (const site of sites) {
    for (const s of site.typography.sizes) {
      sizeFreq.set(s.px, (sizeFreq.get(s.px) ?? 0) + s.count);
    }
  }
  const topTypeSizes = [...sizeFreq.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([px]) => px)
    .sort((a, b) => a - b);

  // Font weights
  const weightFreq = new Map<string, number>();
  for (const site of sites) {
    for (const w of site.typography.weights) {
      weightFreq.set(w.weight, (weightFreq.get(w.weight) ?? 0) + w.count);
    }
  }
  const topFontWeights = [...weightFreq.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4)
    .map(([w]) => w);

  // Heading/body font
  const headingFonts = sites.map(s => s.typography.headingFont).filter(Boolean) as string[];
  const bodyFonts = sites.map(s => s.typography.bodyFont).filter(Boolean) as string[];
  const headingFont = mode(headingFonts) ?? topFonts[0]?.family ?? "Inter";
  const bodyFont = mode(bodyFonts) ?? topFonts[0]?.family ?? "Inter";

  // Colors
  const schemes = sites.map(s => s.colors.colorScheme);
  const colorScheme = (schemes.filter(s => s === "dark").length > schemes.length / 2) ? "dark" : "light";
  const avgColorCount = Math.round(sites.reduce((s, site) => s + site.colors.colorCount, 0) / sites.length);

  // Spacing
  const avgGridAlignment = Math.round(sites.reduce((s, site) => s + site.spacing.gridAlignedPct, 0) / sites.length);
  const densities = sites.map(s => s.spacing.density);
  const dominantDensity = mode(densities) ?? "balanced";

  const allSpacingValues = new Map<number, number>();
  for (const site of sites) {
    for (const v of site.spacing.values) {
      allSpacingValues.set(v, (allSpacingValues.get(v) ?? 0) + 1);
    }
  }
  const commonSpacingValues = [...allSpacingValues.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, 12)
    .map(([v]) => v)
    .sort((a, b) => a - b);

  // Shapes
  const cornerStyles = sites.map(s => s.shapes.cornerStyle);
  const dominantCornerStyle = mode(cornerStyles) ?? "rounded";
  const allRadii = sites.flatMap(s => s.shapes.radii);
  const avgBorderRadius = Math.round(median(allRadii));
  const shadowStyles = sites.map(s => s.shapes.shadowStyle);
  const dominantShadowStyle = mode(shadowStyles) ?? "subtle";

  // Button pattern — filter out zero-padding buttons (computed style artifacts)
  const allButtons = sites.flatMap(s => s.components.buttons)
    .filter(b => b.fontSize > 0 && b.padding !== "0px 0px" && b.padding !== "0px 0px");
  let buttonPattern: DesignPattern["buttonPattern"] = null;
  if (allButtons.length > 0) {
    // Filter paddings to only real ones
    const validPaddings = allButtons.map(b => b.padding).filter(p => !p.startsWith("0px"));
    buttonPattern = {
      padding: mode(validPaddings) ?? "10px 20px",
      fontSize: Math.round(median(allButtons.map(b => b.fontSize))),
      fontWeight: mode(allButtons.map(b => b.fontWeight)) ?? "500",
      borderRadius: Math.round(median(allButtons.filter(b => b.borderRadius > 0).map(b => b.borderRadius))),
    };
  }

  // Card pattern
  const allCards = sites.flatMap(s => s.components.cards).filter(c => c.padding > 0);
  let cardPattern: DesignPattern["cardPattern"] = null;
  if (allCards.length > 0) {
    cardPattern = {
      padding: Math.round(median(allCards.map(c => c.padding))),
      borderRadius: Math.round(median(allCards.map(c => c.borderRadius))),
      hasShadow: allCards.filter(c => c.boxShadow).length > allCards.length / 2,
    };
  }

  return {
    topFonts,
    topTypeSizes,
    topFontWeights,
    headingFont,
    bodyFont,
    colorScheme,
    avgColorCount,
    avgGridAlignment,
    dominantDensity,
    commonSpacingValues,
    dominantCornerStyle,
    avgBorderRadius,
    dominantShadowStyle,
    buttonPattern,
    cardPattern,
    sampleSize: sites.length,
  };
}

function emptyPattern(): DesignPattern {
  return {
    topFonts: [],
    topTypeSizes: [12, 14, 16, 20, 24, 32, 48],
    topFontWeights: ["400", "500", "600", "700"],
    headingFont: "Inter",
    bodyFont: "Inter",
    colorScheme: "light",
    avgColorCount: 12,
    avgGridAlignment: 70,
    dominantDensity: "balanced",
    commonSpacingValues: [4, 8, 12, 16, 20, 24, 32, 48, 64],
    dominantCornerStyle: "rounded",
    avgBorderRadius: 8,
    dominantShadowStyle: "subtle",
    buttonPattern: { padding: "8px 16px", fontSize: 14, fontWeight: "500", borderRadius: 8 },
    cardPattern: { padding: 24, borderRadius: 12, hasShadow: true },
    sampleSize: 0,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const patternCache = new Map<string, DesignPattern>();

export function getPatternForCategory(category: string): DesignPattern {
  if (patternCache.has(category)) return patternCache.get(category)!;

  const sites = loadCrawledData().filter(s => s.category === category);
  const pattern = sites.length >= 3 ? extractPattern(sites) : extractPattern(loadCrawledData());
  patternCache.set(category, pattern);
  return pattern;
}

export function getPatternForAll(): DesignPattern {
  if (patternCache.has("__all__")) return patternCache.get("__all__")!;

  const pattern = extractPattern(loadCrawledData());
  patternCache.set("__all__", pattern);
  return pattern;
}

export function getCrawledSiteCount(): number {
  return loadCrawledData().length;
}
