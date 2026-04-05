/**
 * Design System Generator
 *
 * Generates a complete, production-quality CSS design system based on:
 * - Page/product context (SaaS, e-commerce, blog, etc.)
 * - Reference patterns from the 101-site database
 * - Color palette generation from mood/industry
 *
 * This is NOT a linter. This GENERATES beautiful design.
 */

import { getRangesForContext, type IndustryRanges } from "../data/reference-ranges.js";
import { getReferencesForContext, type NormalizedReference } from "../data/reference-db.js";
import { getPatternForCategory, getPatternForAll, type DesignPattern } from "../data/pattern-matcher.js";
import type { PageType } from "../context/page-type-detector.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DesignSystemConfig {
  pageType?: PageType;
  industry?: string;
  personality?: string;
  mood?: "warm" | "cool" | "neutral" | "bold" | "soft";
  primaryColor?: string; // User can override
  darkMode?: boolean;
}

export interface GeneratedDesignSystem {
  css: string;
  tokens: Record<string, string>;
  description: string;
}

// ---------------------------------------------------------------------------
// Color palette generation
// ---------------------------------------------------------------------------

interface HSL { h: number; s: number; l: number }

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function generateShadeScale(h: number, s: number): Record<string, string> {
  return {
    "50":  hslToHex(h, Math.max(s - 30, 5), 97),
    "100": hslToHex(h, Math.max(s - 20, 8), 94),
    "200": hslToHex(h, Math.max(s - 10, 10), 86),
    "300": hslToHex(h, s, 76),
    "400": hslToHex(h, s, 64),
    "500": hslToHex(h, s, 50),
    "600": hslToHex(h, Math.min(s + 5, 100), 40),
    "700": hslToHex(h, Math.min(s + 10, 100), 32),
    "800": hslToHex(h, Math.min(s + 10, 100), 24),
    "900": hslToHex(h, Math.min(s + 15, 100), 17),
    "950": hslToHex(h, Math.min(s + 15, 100), 10),
  };
}

function moodToHue(mood: string, industry?: string): number {
  // Industry-informed defaults
  const industryHues: Record<string, number> = {
    fintech: 220,      // blue (trust)
    saas: 250,         // purple-blue (modern)
    developer_tools: 200, // cyan-blue (tech)
    ecommerce: 25,     // orange-warm (energy)
    healthcare: 160,   // teal (calm/trust)
    education: 210,    // blue (stable)
    design_tools: 270, // purple (creative)
    ai: 260,           // purple (futuristic)
    entertainment: 340, // pink (fun)
  };

  const moodOffsets: Record<string, number> = {
    warm: -30,
    cool: 20,
    bold: 10,
    soft: -10,
    neutral: 0,
  };

  const baseHue = industry && industryHues[industry] ? industryHues[industry] : 220;
  const offset = moodOffsets[mood] ?? 0;
  return (baseHue + offset + 360) % 360;
}

function moodToSaturation(mood: string): number {
  const map: Record<string, number> = {
    bold: 75,
    warm: 55,
    cool: 50,
    neutral: 40,
    soft: 35,
  };
  return map[mood] ?? 55;
}

interface ColorPalette {
  primary: Record<string, string>;
  neutral: Record<string, string>;
  accent: Record<string, string>;
  success: string;
  warning: string;
  danger: string;
  bg: string;
  surface: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
}

function hexToHsl(hex: string): HSL | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
      case g: h = ((b - r) / d + 2) * 60; break;
      case b: h = ((r - g) / d + 4) * 60; break;
    }
  }
  return { h, s, l };
}

function pickPrimaryFromReferences(refs: NormalizedReference[], mood: string, industry?: string): { h: number; s: number } {
  // Try to find a good primary color from reference sites
  const candidates: Array<{ hex: string; h: number; s: number; score: number }> = [];

  for (const ref of refs) {
    for (const color of ref.colors.palette.slice(0, 5)) {
      const hsl = hexToHsl(color.hex);
      if (!hsl) continue;
      // Skip near-black, near-white, and very desaturated colors
      if (hsl.l < 0.15 || hsl.l > 0.85 || hsl.s < 0.15) continue;

      let score = color.percentage; // Higher usage = more relevant
      // Boost if in the "right" hue range for the mood
      const targetHue = moodToHue(mood, industry);
      const hueDist = Math.min(Math.abs(hsl.h - targetHue), 360 - Math.abs(hsl.h - targetHue));
      if (hueDist < 60) score += 10;

      candidates.push({ hex: color.hex, h: hsl.h, s: hsl.s * 100, score });
    }
  }

  if (candidates.length > 0) {
    candidates.sort((a, b) => b.score - a.score);
    return { h: candidates[0].h, s: candidates[0].s };
  }

  // Fallback to mood-based generation
  return { h: moodToHue(mood, industry), s: moodToSaturation(mood) };
}

function generatePalette(config: DesignSystemConfig, refs: NormalizedReference[]): ColorPalette {
  const mood = config.mood ?? "neutral";
  const dark = config.darkMode ?? false;

  // If user provided primary color, use it
  let hue: number, sat: number;
  if (config.primaryColor) {
    const hsl = hexToHsl(config.primaryColor);
    if (hsl) {
      hue = hsl.h;
      sat = hsl.s * 100;
    } else {
      const picked = pickPrimaryFromReferences(refs, mood, config.industry);
      hue = picked.h;
      sat = picked.s;
    }
  } else {
    // Learn from crawled sites first (larger dataset), fall back to reference DB
    const crawled = config.industry
      ? getPatternForCategory(config.industry)
      : getPatternForAll();

    if (crawled.topColors.length > 0 && crawled.sampleSize >= 3) {
      // Parse the most popular chromatic color from crawled data
      const topColor = crawled.topColors[0].raw;
      const match = topColor.match(/\d+/g);
      if (match && match.length >= 3) {
        const [r, g, b] = match.map(Number);
        const parsed = hexToHsl(
          "#" + [r, g, b].map(v => v.toString(16).padStart(2, "0")).join("")
        );
        if (parsed) {
          hue = parsed.h;
          sat = parsed.s * 100;
        } else {
          const picked = pickPrimaryFromReferences(refs, mood, config.industry);
          hue = picked.h;
          sat = picked.s;
        }
      } else {
        const picked = pickPrimaryFromReferences(refs, mood, config.industry);
        hue = picked.h;
        sat = picked.s;
      }
    } else {
      const picked = pickPrimaryFromReferences(refs, mood, config.industry);
      hue = picked.h;
      sat = picked.s;
    }
  }

  const primary = generateShadeScale(hue, sat);
  const neutral = generateShadeScale(hue, 8);
  const accentHue = (hue + 150) % 360;
  const accent = generateShadeScale(accentHue, Math.min(sat + 15, 80));

  return {
    primary,
    neutral,
    accent,
    success: hslToHex(145, 60, 42),
    warning: hslToHex(38, 90, 50),
    danger: hslToHex(0, 72, 51),
    bg: dark ? neutral["950"] : "#ffffff",
    surface: dark ? neutral["900"] : neutral["50"],
    border: dark ? neutral["800"] : neutral["200"],
    text: dark ? neutral["100"] : neutral["900"],
    textSecondary: dark ? neutral["300"] : neutral["600"],
    textMuted: dark ? neutral["500"] : neutral["400"],
  };
}

// ---------------------------------------------------------------------------
// Typography system
// ---------------------------------------------------------------------------

interface TypographySystem {
  fontFamily: string;
  fontFamilyMono: string;
  scale: Record<string, { size: string; lineHeight: string; letterSpacing: string; weight: string }>;
}

function generateTypography(config: DesignSystemConfig, refs: NormalizedReference[]): TypographySystem {
  // Pick font from references — use what successful sites in this industry use
  const topFonts = new Map<string, number>();
  const skipFonts = new Set(["inherit", "initial", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif", "serif", "monospace", ""]);

  for (const ref of refs) {
    for (const f of ref.typography.fonts) {
      const name = f.family.replace(/['"]/g, "").trim();
      if (skipFonts.has(name) || name.length > 40 || name.length < 2) continue;
      topFonts.set(name, (topFonts.get(name) ?? 0) + f.count);
    }
  }

  const sortedFonts = [...topFonts.entries()].sort(([, a], [, b]) => b - a);
  // Load crawled pattern data first
  const pattern = config.industry
    ? getPatternForCategory(config.industry)
    : getPatternForAll();

  const personality = config.personality ?? "";
  let fontFamily: string;

  if (/editorial|elegant/i.test(personality)) {
    fontFamily = "'Georgia', 'Times New Roman', serif";
  } else if (pattern.bodyFont && pattern.bodyFont !== "Inter" && pattern.sampleSize >= 3) {
    // Use the most popular font from crawled sites in this category
    fontFamily = `'${pattern.bodyFont}', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
  } else if (sortedFonts.length > 0 && sortedFonts[0][1] > 10) {
    const refFont = sortedFonts[0][0];
    fontFamily = `'${refFont}', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
  } else {
    fontFamily = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  }

  // Type scale: from crawled data (real sites) or fallback to 1.25 ratio

  // Use actual sizes from crawled sites if available
  const crawledSizes = pattern.topTypeSizes;
  let sizes: Record<string, number>;

  if (crawledSizes.length >= 6) {
    // Map crawled sizes to our scale positions
    const sorted = [...crawledSizes].sort((a, b) => a - b);
    sizes = {
      xs:   sorted[0] ?? 10,
      sm:   sorted[Math.floor(sorted.length * 0.15)] ?? 13,
      base: sorted[Math.floor(sorted.length * 0.3)] ?? 16,
      lg:   sorted[Math.floor(sorted.length * 0.45)] ?? 18,
      xl:   sorted[Math.floor(sorted.length * 0.6)] ?? 20,
      "2xl": sorted[Math.floor(sorted.length * 0.7)] ?? 24,
      "3xl": sorted[Math.floor(sorted.length * 0.85)] ?? 32,
      "4xl": sorted[sorted.length - 1] ?? 48,
    };
  } else {
    // Fallback: 1.25 ratio (Major Third)
    const base = 16;
    const ratio = 1.25;
    sizes = {
      xs:   Math.round(base / ratio / ratio),
      sm:   Math.round(base / ratio),
      base: base,
      lg:   Math.round(base * ratio),
      xl:   Math.round(base * ratio * ratio),
      "2xl": Math.round(base * ratio * ratio * ratio),
      "3xl": Math.round(base * ratio * ratio * ratio * ratio),
      "4xl": Math.round(base * ratio * ratio * ratio * ratio * ratio),
    };
  }

  return {
    fontFamily,
    fontFamilyMono: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
    scale: {
      xs:   { size: `${sizes.xs}px`,   lineHeight: "1.5", letterSpacing: "0.02em", weight: "400" },
      sm:   { size: `${sizes.sm}px`,   lineHeight: "1.5", letterSpacing: "0.01em", weight: "400" },
      base: { size: `${sizes.base}px`, lineHeight: "1.6", letterSpacing: "0",      weight: "400" },
      lg:   { size: `${sizes.lg}px`,   lineHeight: "1.5", letterSpacing: "-0.01em", weight: "500" },
      xl:   { size: `${sizes.xl}px`,   lineHeight: "1.4", letterSpacing: "-0.01em", weight: "600" },
      "2xl": { size: `${sizes["2xl"]}px`, lineHeight: "1.3", letterSpacing: "-0.02em", weight: "700" },
      "3xl": { size: `${sizes["3xl"]}px`, lineHeight: "1.2", letterSpacing: "-0.02em", weight: "700" },
      "4xl": { size: `${sizes["4xl"]}px`, lineHeight: "1.1", letterSpacing: "-0.03em", weight: "800" },
    },
  };
}

// ---------------------------------------------------------------------------
// Spacing system
// ---------------------------------------------------------------------------

function generateSpacing(): Record<string, string> {
  return {
    "0": "0",
    "1": "4px",
    "2": "8px",
    "3": "12px",
    "4": "16px",
    "5": "20px",
    "6": "24px",
    "8": "32px",
    "10": "40px",
    "12": "48px",
    "16": "64px",
    "20": "80px",
    "24": "96px",
  };
}

// ---------------------------------------------------------------------------
// Component styles
// ---------------------------------------------------------------------------

function componentRadius(personality?: string, industry?: string): string {
  // Try crawled data first
  const pattern = industry ? getPatternForCategory(industry) : getPatternForAll();
  if (pattern.sampleSize >= 3 && pattern.avgBorderRadius > 0) {
    return `${pattern.avgBorderRadius}px`;
  }

  // Fallback to personality-based
  if (/bold|minimal/i.test(personality ?? "")) return "6px";
  if (/soft|wellness/i.test(personality ?? "")) return "16px";
  if (/editorial|elegant/i.test(personality ?? "")) return "2px";
  return "8px";
}

function componentShadow(personality?: string): { sm: string; md: string; lg: string; xl: string } {
  const isBold = /bold|minimal/i.test(personality ?? "");
  const isEditorial = /editorial/i.test(personality ?? "");

  if (isBold || isEditorial) {
    return {
      sm: "none",
      md: "0 1px 3px rgba(0,0,0,0.08)",
      lg: "0 4px 12px rgba(0,0,0,0.1)",
      xl: "0 8px 30px rgba(0,0,0,0.12)",
    };
  }

  return {
    sm: "0 1px 2px rgba(0,0,0,0.05)",
    md: "0 2px 8px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)",
    lg: "0 4px 16px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)",
    xl: "0 12px 40px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.08)",
  };
}

// ---------------------------------------------------------------------------
// CSS Generator — the core output
// ---------------------------------------------------------------------------

export function generateDesignSystem(config: DesignSystemConfig = {}): GeneratedDesignSystem {
  const refs = getReferencesForContext(config.industry, config.personality);
  const crawledPattern = config.industry
    ? getPatternForCategory(config.industry)
    : getPatternForAll();
  const palette = generatePalette(config, refs);
  const typo = generateTypography(config, refs);
  const spacing = generateSpacing();
  const radius = componentRadius(config.personality, config.industry);
  const shadow = componentShadow(config.personality);
  const pageType = config.pageType ?? "landing";
  const btnPad = crawledPattern.buttonPattern?.padding ?? `${spacing["3"]} ${spacing["6"]}`;
  const btnRadius = crawledPattern.buttonPattern?.borderRadius
    ? `${crawledPattern.buttonPattern.borderRadius}px`
    : "var(--ds-radius)";
  const btnFontSize = crawledPattern.buttonPattern?.fontSize
    ? `${crawledPattern.buttonPattern.fontSize}px`
    : typo.scale.sm.size;
  const btnWeight = crawledPattern.buttonPattern?.fontWeight ?? "500";
  const cardPad = crawledPattern.cardPattern?.padding
    ? `${crawledPattern.cardPattern.padding}px`
    : spacing["6"];
  const cardRadius = crawledPattern.cardPattern?.borderRadius
    ? `${crawledPattern.cardPattern.borderRadius}px`
    : "var(--ds-radius)";

  // Section spacing based on page type
  const sectionPadding = (pageType === "dashboard" || pageType === "settings") ? "32px" : "80px";
  const containerMaxWidth = pageType === "blog" ? "720px" : pageType === "dashboard" ? "1400px" : "1200px";

  const tokens: Record<string, string> = {
    "--ds-primary": palette.primary["500"],
    "--ds-primary-hover": palette.primary["600"],
    "--ds-primary-light": palette.primary["100"],
    "--ds-accent": palette.accent["500"],
    "--ds-bg": palette.bg,
    "--ds-surface": palette.surface,
    "--ds-border": palette.border,
    "--ds-text": palette.text,
    "--ds-text-secondary": palette.textSecondary,
    "--ds-text-muted": palette.textMuted,
    "--ds-success": palette.success,
    "--ds-warning": palette.warning,
    "--ds-danger": palette.danger,
    "--ds-font": typo.fontFamily,
    "--ds-font-mono": typo.fontFamilyMono,
    "--ds-radius": radius,
    "--ds-shadow-sm": shadow.sm,
    "--ds-shadow-md": shadow.md,
    "--ds-shadow-lg": shadow.lg,
    "--ds-mood": config.mood ?? "neutral",
  };

  const css = `/* ================================================================
   Generated Design System by devsigner
   Industry: ${config.industry ?? "general"} | Page: ${pageType}
   Personality: ${config.personality ?? "modern"} | Mood: ${config.mood ?? "neutral"}
   ================================================================ */

/* --- Reset & Base --- */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
${Object.entries(tokens).map(([k, v]) => `  ${k}: ${v};`).join("\n")}
}

body {
  font-family: ${typo.fontFamily};
  font-size: ${typo.scale.base.size};
  line-height: ${typo.scale.base.lineHeight};
  color: var(--ds-text);
  background: var(--ds-bg);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* --- Typography --- */
h1, h2, h3, h4, h5, h6 {
  color: var(--ds-text);
  font-weight: 700;
}

h1 {
  font-size: ${typo.scale["4xl"].size};
  line-height: ${typo.scale["4xl"].lineHeight};
  letter-spacing: ${typo.scale["4xl"].letterSpacing};
  font-weight: ${typo.scale["4xl"].weight};
  margin-bottom: ${spacing["6"]};
}

h2 {
  font-size: ${typo.scale["3xl"].size};
  line-height: ${typo.scale["3xl"].lineHeight};
  letter-spacing: ${typo.scale["3xl"].letterSpacing};
  font-weight: ${typo.scale["3xl"].weight};
  margin-bottom: ${spacing["5"]};
}

h3 {
  font-size: ${typo.scale["2xl"].size};
  line-height: ${typo.scale["2xl"].lineHeight};
  letter-spacing: ${typo.scale["2xl"].letterSpacing};
  font-weight: ${typo.scale["2xl"].weight};
  margin-bottom: ${spacing["4"]};
}

h4 {
  font-size: ${typo.scale.xl.size};
  line-height: ${typo.scale.xl.lineHeight};
  letter-spacing: ${typo.scale.xl.letterSpacing};
  font-weight: ${typo.scale.xl.weight};
  margin-bottom: ${spacing["3"]};
}

p {
  font-size: ${typo.scale.base.size};
  line-height: ${typo.scale.base.lineHeight};
  color: var(--ds-text-secondary);
  margin-bottom: ${spacing["4"]};
  max-width: 65ch;
}

small, .text-sm {
  font-size: ${typo.scale.sm.size};
  line-height: ${typo.scale.sm.lineHeight};
}

strong { font-weight: 600; }

a {
  color: var(--ds-primary);
  text-decoration: none;
  transition: color 0.15s ease;
}
a:hover { color: var(--ds-primary-hover); }

code, pre {
  font-family: ${typo.fontFamilyMono};
  font-size: ${typo.scale.sm.size};
}

code {
  background: var(--ds-surface);
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid var(--ds-border);
}

pre {
  background: var(--ds-surface);
  padding: ${spacing["4"]};
  border-radius: var(--ds-radius);
  border: 1px solid var(--ds-border);
  overflow-x: auto;
  margin-bottom: ${spacing["6"]};
}

/* --- Layout --- */
.container, main, [class*="container"] {
  max-width: ${containerMaxWidth};
  margin: 0 auto;
  padding: 0 ${spacing["6"]};
}

section, [class*="section"] {
  padding: ${sectionPadding} 0;
}

/* --- Buttons --- */
button, [type="button"], [type="submit"], .btn, [class*="button"], [class*="btn"] {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${spacing["2"]};
  padding: ${btnPad};
  font-size: ${btnFontSize};
  font-weight: ${btnWeight};
  font-family: inherit;
  line-height: 1;
  border: 1px solid transparent;
  border-radius: ${btnRadius};
  cursor: pointer;
  transition: all 0.15s ease;
  background: var(--ds-primary);
  color: #ffffff;
}

button:hover, .btn:hover, [class*="button"]:hover, [class*="btn"]:hover {
  background: var(--ds-primary-hover);
  box-shadow: var(--ds-shadow-sm);
  transform: translateY(-1px);
}

button:active, .btn:active {
  transform: translateY(0);
}

/* Secondary/outline buttons */
button[class*="outline"], button[class*="secondary"], button[class*="ghost"],
.btn-outline, .btn-secondary, .btn-ghost {
  background: transparent;
  color: var(--ds-primary);
  border-color: var(--ds-border);
}

button[class*="outline"]:hover, .btn-outline:hover, .btn-secondary:hover {
  background: var(--ds-primary-light);
  border-color: var(--ds-primary);
}

/* --- Cards --- */
[class*="card"], .card, article {
  background: var(--ds-surface);
  border: 1px solid var(--ds-border);
  border-radius: ${cardRadius};
  padding: ${cardPad};
  box-shadow: var(--ds-shadow-sm);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

[class*="card"]:hover, .card:hover {
  box-shadow: var(--ds-shadow-md);
  transform: translateY(-2px);
}

/* --- Inputs --- */
input, textarea, select,
[type="text"], [type="email"], [type="password"], [type="number"], [type="search"], [type="url"] {
  width: 100%;
  padding: ${spacing["3"]} ${spacing["4"]};
  font-size: ${typo.scale.base.size};
  font-family: inherit;
  line-height: 1.5;
  color: var(--ds-text);
  background: var(--ds-bg);
  border: 1px solid var(--ds-border);
  border-radius: var(--ds-radius);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  outline: none;
}

input:focus, textarea:focus, select:focus {
  border-color: var(--ds-primary);
  box-shadow: 0 0 0 3px var(--ds-primary-light);
}

input::placeholder, textarea::placeholder {
  color: var(--ds-text-muted);
}

label {
  display: block;
  font-size: ${typo.scale.sm.size};
  font-weight: 500;
  color: var(--ds-text);
  margin-bottom: ${spacing["1"]};
}

/* --- Badges / Tags --- */
[class*="badge"], [class*="tag"], .badge, .tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  font-size: ${typo.scale.xs.size};
  font-weight: 500;
  border-radius: 100px;
  background: var(--ds-primary-light);
  color: var(--ds-primary);
}

/* --- Navigation --- */
nav, header, [class*="header"], [class*="navbar"], [class*="nav"] {
  padding: ${spacing["4"]} ${spacing["6"]};
  border-bottom: 1px solid var(--ds-border);
  background: var(--ds-bg);
}

nav a, header a {
  color: var(--ds-text-secondary);
  font-size: ${typo.scale.sm.size};
  font-weight: 500;
  transition: color 0.15s ease;
}

nav a:hover, header a:hover {
  color: var(--ds-text);
}

/* --- Footer --- */
footer, [class*="footer"] {
  padding: ${spacing["12"]} ${spacing["6"]};
  border-top: 1px solid var(--ds-border);
  color: var(--ds-text-muted);
  font-size: ${typo.scale.sm.size};
}

/* --- Hero Section --- */
[class*="hero"], .hero {
  padding: ${spacing["24"]} ${spacing["6"]};
  text-align: center;
}

[class*="hero"] h1, .hero h1 {
  max-width: 800px;
  margin: 0 auto ${spacing["6"]};
}

[class*="hero"] p, .hero p {
  max-width: 600px;
  margin: 0 auto ${spacing["6"]};
  font-size: ${typo.scale.lg.size};
  color: var(--ds-text-secondary);
}

/* --- Grid / Flex Utilities --- */
[class*="grid"] {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: ${spacing["6"]};
}

[class*="flex"] {
  display: flex;
  gap: ${spacing["4"]};
  align-items: center;
}

[class*="flex-col"] {
  flex-direction: column;
  align-items: stretch;
}

/* --- Feature/Pricing Sections --- */
[class*="feature"], [class*="pricing"] {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: ${spacing["6"]};
}

/* --- CTA Sections --- */
[class*="cta"] {
  text-align: center;
  padding: ${spacing["16"]} ${spacing["6"]};
  background: var(--ds-surface);
  border-radius: var(--ds-radius);
}

/* --- Centered content utility --- */
[class*="center"] {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

/* --- Dividers --- */
hr {
  border: none;
  border-top: 1px solid var(--ds-border);
  margin: ${spacing["8"]} 0;
}

/* --- Lists --- */
ul, ol {
  padding-left: ${spacing["6"]};
  margin-bottom: ${spacing["4"]};
}

li {
  margin-bottom: ${spacing["2"]};
  line-height: ${typo.scale.base.lineHeight};
  color: var(--ds-text-secondary);
}

/* --- Tables --- */
table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: ${spacing["6"]};
}

th {
  text-align: left;
  padding: ${spacing["3"]} ${spacing["4"]};
  font-size: ${typo.scale.sm.size};
  font-weight: 600;
  color: var(--ds-text-muted);
  border-bottom: 2px solid var(--ds-border);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

td {
  padding: ${spacing["3"]} ${spacing["4"]};
  font-size: ${typo.scale.sm.size};
  border-bottom: 1px solid var(--ds-border);
  color: var(--ds-text-secondary);
}

tr:hover td {
  background: var(--ds-surface);
}

/* --- Images --- */
img {
  max-width: 100%;
  height: auto;
  border-radius: var(--ds-radius);
}

/* --- Responsive --- */
@media (max-width: 768px) {
  h1 { font-size: ${typo.scale["2xl"].size}; }
  h2 { font-size: ${typo.scale.xl.size}; }
  h3 { font-size: ${typo.scale.lg.size}; }

  section, [class*="section"] {
    padding: ${spacing["10"]} 0;
  }

  [class*="hero"], .hero {
    padding: ${spacing["16"]} ${spacing["4"]};
  }
}

/* --- Focus States (Research: keyboard users need visible focus indicators) --- */
button:focus-visible, a:focus-visible, input:focus-visible, select:focus-visible,
textarea:focus-visible, [tabindex]:focus-visible {
  outline: 2px solid var(--ds-primary);
  outline-offset: 2px;
}

/* Remove default outline, use custom */
button:focus:not(:focus-visible), a:focus:not(:focus-visible) {
  outline: none;
}

/* --- Disabled States (Research: buttons must indicate when inactive) --- */
button:disabled, button[disabled], .btn:disabled,
input:disabled, select:disabled, textarea:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

/* --- Loading Indicator --- */
.loading, [class*="loading"], [aria-busy="true"] {
  position: relative;
  color: transparent !important;
}

.loading::after, [class*="loading"]::after, [aria-busy="true"]::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 18px;
  height: 18px;
  margin: -9px 0 0 -9px;
  border: 2px solid var(--ds-border);
  border-top-color: var(--ds-primary);
  border-radius: 50%;
  animation: ds-spin 0.6s linear infinite;
}

@keyframes ds-spin {
  to { transform: rotate(360deg); }
}

/* --- Selection --- */
::selection {
  background: var(--ds-primary-light);
  color: var(--ds-primary);
}

/* --- Smooth Scroll --- */
html {
  scroll-behavior: smooth;
}

/* --- Transitions --- */
* {
  transition-property: color, background-color, border-color, box-shadow, transform, opacity;
  transition-duration: 0s;
}

a, button, input, [class*="card"], [class*="btn"] {
  transition-duration: 0.15s;
  transition-timing-function: ease;
}
`;

  const description = `Design system for ${config.industry ?? "general"} ${pageType} page. ` +
    `${config.mood ?? "neutral"} mood, ${config.personality ?? "modern"} personality. ` +
    `Primary: ${palette.primary["500"]}, Accent: ${palette.accent["500"]}.`;

  return { css, tokens, description };
}
