import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// Types — canonical internal schema
// ---------------------------------------------------------------------------

export interface ReferenceColor {
  hex: string;
  count: number;
  percentage: number;
}

export interface ReferenceFont {
  family: string;
  count: number;
  heading: boolean;
  body: boolean;
}

export interface NormalizedReference {
  url: string;
  title: string;
  industry: string;
  personality: string;
  complexity: number;
  colors: {
    palette: ReferenceColor[];
    dominantBg: string;
    primaryText: string;
    colorScheme: "light" | "dark" | "mixed";
    colorCount: number;
  };
  typography: {
    fonts: ReferenceFont[];
    sizes: Array<{ px: number; count: number }>;
    weights: Array<{ weight: number; count: number }>;
    headingFont: string | null;
    bodyFont: string | null;
    sizeCount: number;
    weightCount: number;
    fontFamilyCount: number;
  };
  spacing: {
    topValues: Array<{ px: number; count: number }>;
    gridAlignedPct: number;
    density: "spacious" | "balanced" | "compact";
    uniqueCount: number;
  };
  layout: {
    maxWidth: number | null;
    hasSidebar: boolean;
    hasHero: boolean;
    hasStickyHeader: boolean;
    hasFooter: boolean;
  };
  shapes: {
    cornerStyle: "sharp" | "subtle" | "rounded" | "pill";
    shadowStyle: "none" | "subtle" | "medium" | "dramatic";
    topRadii: Array<{ px: number; count: number }>;
  };
}

// ---------------------------------------------------------------------------
// Seed data schema (what's actually in seed-analyses.json)
// ---------------------------------------------------------------------------

interface SeedEntry {
  url: string;
  page_title?: string;
  colors: {
    palette: Array<{ hex: string; count: number; pct: number }>;
    dominant_bg: string;
    primary_text: string;
    color_scheme: string;
    unique_count: number;
  };
  typography: {
    fonts: Array<{ family: string; count: number; heading: boolean; body: boolean }>;
    sizes: Array<{ px: number; count: number }>;
    weights: Array<{ weight: number; count: number }>;
    heading_font: string | null;
    body_font: string | null;
  };
  spacing: {
    top_values: Array<{ px: number; count: number }>;
    grid_aligned_pct: number;
    density: string;
    unique_count: number;
  };
  layout: {
    maxWidth: number | null;
    hasSidebar: boolean;
    hasHero: boolean;
    hasStickyHeader: boolean;
    hasFooter: boolean;
  };
  shapes: {
    corner_style: string;
    shadow_style: string;
    top_radii: Array<{ px: number; count: number }>;
  };
  overall: {
    personality: string;
    industry: string;
    complexity: number;
  };
}

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

function normalize(entry: SeedEntry): NormalizedReference {
  return {
    url: entry.url,
    title: entry.page_title ?? entry.url,
    industry: entry.overall.industry,
    personality: entry.overall.personality,
    complexity: entry.overall.complexity,
    colors: {
      palette: entry.colors.palette.map((c) => ({
        hex: c.hex,
        count: c.count,
        percentage: c.pct,
      })),
      dominantBg: entry.colors.dominant_bg,
      primaryText: entry.colors.primary_text,
      colorScheme: entry.colors.color_scheme as "light" | "dark" | "mixed",
      colorCount: entry.colors.unique_count,
    },
    typography: {
      fonts: entry.typography.fonts,
      sizes: entry.typography.sizes,
      weights: entry.typography.weights,
      headingFont: entry.typography.heading_font,
      bodyFont: entry.typography.body_font,
      sizeCount: entry.typography.sizes.length,
      weightCount: entry.typography.weights.length,
      fontFamilyCount: entry.typography.fonts.length,
    },
    spacing: {
      topValues: entry.spacing.top_values,
      gridAlignedPct: entry.spacing.grid_aligned_pct,
      density: entry.spacing.density as "spacious" | "balanced" | "compact",
      uniqueCount: entry.spacing.unique_count,
    },
    layout: entry.layout,
    shapes: {
      cornerStyle: entry.shapes.corner_style as NormalizedReference["shapes"]["cornerStyle"],
      shadowStyle: entry.shapes.shadow_style as NormalizedReference["shapes"]["shadowStyle"],
      topRadii: entry.shapes.top_radii,
    },
  };
}

// ---------------------------------------------------------------------------
// Cached loader
// ---------------------------------------------------------------------------

let cache: NormalizedReference[] | null = null;

export function loadReferenceDB(): NormalizedReference[] {
  if (cache) return cache;

  const __dirname = dirname(fileURLToPath(import.meta.url));
  // Try multiple paths: works both in dev (src/) and built (dist/)
  const candidates = [
    join(__dirname, "../../data/seed-analyses.json"),
    join(__dirname, "../data/seed-analyses.json"),
    join(__dirname, "../../../data/seed-analyses.json"),
  ];

  let raw: string | null = null;
  for (const p of candidates) {
    try {
      raw = readFileSync(p, "utf-8");
      break;
    } catch {
      // try next
    }
  }

  if (!raw) {
    cache = [];
    return cache;
  }

  const entries: SeedEntry[] = JSON.parse(raw);
  cache = entries.map(normalize);
  return cache;
}

export function getByIndustry(industry: string): NormalizedReference[] {
  return loadReferenceDB().filter((r) => r.industry === industry);
}

export function getByPersonality(personality: string): NormalizedReference[] {
  return loadReferenceDB().filter((r) => r.personality === personality);
}

export function getByURL(url: string): NormalizedReference | undefined {
  return loadReferenceDB().find((r) => r.url === url);
}

export function getIndustries(): string[] {
  const set = new Set(loadReferenceDB().map((r) => r.industry));
  return [...set].sort();
}

export function getReferencesForContext(industry?: string, personality?: string): NormalizedReference[] {
  let refs = loadReferenceDB();
  if (industry) {
    const byIndustry = refs.filter((r) => r.industry === industry);
    if (byIndustry.length >= 5) refs = byIndustry;
  }
  if (personality) {
    const byPersonality = refs.filter((r) => r.personality === personality);
    if (byPersonality.length >= 3) refs = byPersonality;
  }
  return refs;
}
