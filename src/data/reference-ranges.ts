import {
  loadReferenceDB,
  getReferencesForContext,
  type NormalizedReference,
} from "./reference-db.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DesignRange {
  min: number;
  p25: number;
  median: number;
  p75: number;
  max: number;
  sampleSize: number;
}

export interface IndustryRanges {
  industry: string;
  sampleSize: number;
  colorCount: DesignRange;
  spacingGridAlignedPct: DesignRange;
  spacingUniqueCount: DesignRange;
  typographySizeCount: DesignRange;
  typographyWeightCount: DesignRange;
  typographyFontFamilyCount: DesignRange;
  complexity: DesignRange;
  densityDistribution: Record<string, number>;
  cornerStyleDistribution: Record<string, number>;
  shadowStyleDistribution: Record<string, number>;
  topFonts: Array<{ family: string; count: number }>;
  topColors: Array<{ hex: string; count: number }>;
}

// ---------------------------------------------------------------------------
// Statistical helpers
// ---------------------------------------------------------------------------

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

function computeRange(values: number[]): DesignRange {
  if (values.length === 0) {
    return { min: 0, p25: 0, median: 0, p75: 0, max: 0, sampleSize: 0 };
  }
  const sorted = [...values].sort((a, b) => a - b);
  return {
    min: sorted[0],
    p25: Math.round(percentile(sorted, 25)),
    median: Math.round(percentile(sorted, 50)),
    p75: Math.round(percentile(sorted, 75)),
    max: sorted[sorted.length - 1],
    sampleSize: sorted.length,
  };
}

function distribution(values: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const v of values) {
    counts[v] = (counts[v] ?? 0) + 1;
  }
  return counts;
}

// ---------------------------------------------------------------------------
// Compute ranges from reference set
// ---------------------------------------------------------------------------

export function computeRanges(refs: NormalizedReference[]): IndustryRanges {
  const colorCounts = refs.map((r) => r.colors.colorCount);
  const gridPcts = refs.map((r) => r.spacing.gridAlignedPct);
  const spacingCounts = refs.map((r) => r.spacing.uniqueCount);
  const sizeCounts = refs.map((r) => r.typography.sizeCount);
  const weightCounts = refs.map((r) => r.typography.weightCount);
  const fontFamilyCounts = refs.map((r) => r.typography.fontFamilyCount);
  const complexities = refs.map((r) => r.complexity);

  // Top fonts
  const fontFreq = new Map<string, number>();
  for (const r of refs) {
    for (const f of r.typography.fonts) {
      fontFreq.set(f.family, (fontFreq.get(f.family) ?? 0) + 1);
    }
  }
  const topFonts = [...fontFreq.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([family, count]) => ({ family, count }));

  // Top colors (from dominant backgrounds)
  const colorFreq = new Map<string, number>();
  for (const r of refs) {
    for (const c of r.colors.palette.slice(0, 5)) {
      colorFreq.set(c.hex, (colorFreq.get(c.hex) ?? 0) + 1);
    }
  }
  const topColors = [...colorFreq.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([hex, count]) => ({ hex, count }));

  return {
    industry: refs.length > 0 ? refs[0].industry : "all",
    sampleSize: refs.length,
    colorCount: computeRange(colorCounts),
    spacingGridAlignedPct: computeRange(gridPcts),
    spacingUniqueCount: computeRange(spacingCounts),
    typographySizeCount: computeRange(sizeCounts),
    typographyWeightCount: computeRange(weightCounts),
    typographyFontFamilyCount: computeRange(fontFamilyCounts),
    complexity: computeRange(complexities),
    densityDistribution: distribution(refs.map((r) => r.spacing.density)),
    cornerStyleDistribution: distribution(refs.map((r) => r.shapes.cornerStyle)),
    shadowStyleDistribution: distribution(refs.map((r) => r.shapes.shadowStyle)),
    topFonts,
    topColors,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const rangesCache = new Map<string, IndustryRanges>();

export function getRangesForIndustry(industry: string): IndustryRanges {
  const key = `industry:${industry}`;
  if (rangesCache.has(key)) return rangesCache.get(key)!;

  const refs = getReferencesForContext(industry);
  const ranges = computeRanges(refs);
  ranges.industry = industry;
  rangesCache.set(key, ranges);
  return ranges;
}

export function getRangesForAll(): IndustryRanges {
  const key = "all";
  if (rangesCache.has(key)) return rangesCache.get(key)!;

  const refs = loadReferenceDB();
  const ranges = computeRanges(refs);
  ranges.industry = "all";
  rangesCache.set(key, ranges);
  return ranges;
}

export function getRangesForContext(industry?: string, personality?: string): IndustryRanges {
  const key = `ctx:${industry ?? "all"}:${personality ?? "all"}`;
  if (rangesCache.has(key)) return rangesCache.get(key)!;

  const refs = getReferencesForContext(industry, personality);
  const ranges = computeRanges(refs);
  ranges.industry = industry ?? "all";
  rangesCache.set(key, ranges);
  return ranges;
}

/**
 * Check if a value is within the "normal" range (p25-p75) for the given metric.
 * Returns: "below" | "normal" | "above"
 */
export function evaluateAgainstRange(
  value: number,
  range: DesignRange,
): "below" | "normal" | "above" {
  if (value < range.p25) return "below";
  if (value > range.p75) return "above";
  return "normal";
}

/**
 * Format a range-based suggestion with reference data.
 */
export function formatRangeSuggestion(
  metric: string,
  userValue: number,
  range: DesignRange,
  industry: string,
): string {
  const position = evaluateAgainstRange(userValue, range);
  const label = industry === "all" ? "reference sites" : `${industry} sites`;

  if (position === "normal") {
    return `Your ${metric} (${userValue}) is within the typical range for ${label} (${range.p25}-${range.p75}, median ${range.median}).`;
  }

  if (position === "above") {
    return `Your ${metric} (${userValue}) is above the typical range for ${label} (${range.p25}-${range.p75}, median ${range.median}). Consider consolidating.`;
  }

  return `Your ${metric} (${userValue}) is below the typical range for ${label} (${range.p25}-${range.p75}, median ${range.median}).`;
}
