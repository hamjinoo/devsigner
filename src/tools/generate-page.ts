import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { loadContext } from "../context/project-context.js";
import type { DesignIdentityData } from "../context/project-context.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PageType = "landing" | "dashboard" | "pricing" | "login" | "settings" | "onboarding" | "blog" | "404";
type Framework = "react" | "vue" | "svelte" | "html";
type Style = "tailwind" | "inline";
type Personality =
  | "bold_minimal"
  | "warm_professional"
  | "energetic_pop"
  | "elegant_editorial"
  | "data_dense"
  | "soft_wellness";

interface PageInput {
  page_type: PageType;
  framework: Framework;
  style: Style;
  personality: Personality;
  product_name: string;
  dark_mode: boolean;
}

// ---------------------------------------------------------------------------
// Design token system per personality
// ---------------------------------------------------------------------------

interface DesignTokens {
  // Colors
  bg: string;
  bgAlt: string;
  bgCard: string;
  text: string;
  textMuted: string;
  textHeading: string;
  primary: string;
  primaryHover: string;
  primaryText: string;
  accent: string;
  border: string;
  borderLight: string;
  // Dark mode overrides
  darkBg: string;
  darkBgAlt: string;
  darkBgCard: string;
  darkText: string;
  darkTextMuted: string;
  darkTextHeading: string;
  darkBorder: string;
  // Typography
  fontFamily: string;
  headingFontFamily: string;
  headingWeight: string;
  bodyWeight: string;
  // Layout
  radius: string;
  radiusSm: string;
  radiusLg: string;
  shadow: string;
  shadowLg: string;
  // Hero gradient / bg
  heroBg: string;
  darkHeroBg: string;
  // Personality-specific
  inputBorder: string;
  inputBg: string;
  focusRing: string;
  successColor: string;
  dangerColor: string;
  warningColor: string;
}

const TOKENS: Record<Personality, DesignTokens> = {
  bold_minimal: {
    bg: "#ffffff",
    bgAlt: "#f9fafb",
    bgCard: "#ffffff",
    text: "#111827",
    textMuted: "#6b7280",
    textHeading: "#000000",
    primary: "#111827",
    primaryHover: "#374151",
    primaryText: "#ffffff",
    accent: "#3b82f6",
    border: "#e5e7eb",
    borderLight: "#f3f4f6",
    darkBg: "#000000",
    darkBgAlt: "#0a0a0a",
    darkBgCard: "#111111",
    darkText: "#e5e7eb",
    darkTextMuted: "#9ca3af",
    darkTextHeading: "#ffffff",
    darkBorder: "#1f2937",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    headingFontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    headingWeight: "700",
    bodyWeight: "400",
    radius: "6px",
    radiusSm: "4px",
    radiusLg: "8px",
    shadow: "none",
    shadowLg: "none",
    heroBg: "#ffffff",
    darkHeroBg: "#000000",
    inputBorder: "#d1d5db",
    inputBg: "#ffffff",
    focusRing: "#111827",
    successColor: "#10b981",
    dangerColor: "#ef4444",
    warningColor: "#f59e0b",
  },
  warm_professional: {
    bg: "#ffffff",
    bgAlt: "#f8fafc",
    bgCard: "#ffffff",
    text: "#1e293b",
    textMuted: "#64748b",
    textHeading: "#0f172a",
    primary: "#6366f1",
    primaryHover: "#4f46e5",
    primaryText: "#ffffff",
    accent: "#8b5cf6",
    border: "#e2e8f0",
    borderLight: "#f1f5f9",
    darkBg: "#0f172a",
    darkBgAlt: "#1e293b",
    darkBgCard: "#1e293b",
    darkText: "#e2e8f0",
    darkTextMuted: "#94a3b8",
    darkTextHeading: "#f8fafc",
    darkBorder: "#334155",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    headingFontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    headingWeight: "700",
    bodyWeight: "400",
    radius: "8px",
    radiusSm: "6px",
    radiusLg: "12px",
    shadow: "0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.08)",
    shadowLg: "0 10px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.04)",
    heroBg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    darkHeroBg: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
    inputBorder: "#cbd5e1",
    inputBg: "#ffffff",
    focusRing: "#6366f1",
    successColor: "#10b981",
    dangerColor: "#ef4444",
    warningColor: "#f59e0b",
  },
  energetic_pop: {
    bg: "#ffffff",
    bgAlt: "#faf5ff",
    bgCard: "#ffffff",
    text: "#1f2937",
    textMuted: "#6b7280",
    textHeading: "#111827",
    primary: "#8b5cf6",
    primaryHover: "#7c3aed",
    primaryText: "#ffffff",
    accent: "#f59e0b",
    border: "#e5e7eb",
    borderLight: "#f3f4f6",
    darkBg: "#1a1025",
    darkBgAlt: "#231432",
    darkBgCard: "#2d1b4e",
    darkText: "#e5e7eb",
    darkTextMuted: "#a78bfa",
    darkTextHeading: "#ffffff",
    darkBorder: "#4c1d95",
    fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif",
    headingFontFamily: "'DM Sans', 'Inter', system-ui, sans-serif",
    headingWeight: "800",
    bodyWeight: "400",
    radius: "16px",
    radiusSm: "12px",
    radiusLg: "24px",
    shadow: "0 4px 6px -1px rgba(139,92,246,0.15), 0 2px 4px -2px rgba(139,92,246,0.1)",
    shadowLg: "0 20px 40px -8px rgba(139,92,246,0.2)",
    heroBg: "#8b5cf6",
    darkHeroBg: "#4c1d95",
    inputBorder: "#d8b4fe",
    inputBg: "#faf5ff",
    focusRing: "#8b5cf6",
    successColor: "#34d399",
    dangerColor: "#f87171",
    warningColor: "#fbbf24",
  },
  elegant_editorial: {
    bg: "#ffffff",
    bgAlt: "#fafaf9",
    bgCard: "#ffffff",
    text: "#292524",
    textMuted: "#78716c",
    textHeading: "#0c0a09",
    primary: "#292524",
    primaryHover: "#44403c",
    primaryText: "#ffffff",
    accent: "#a16207",
    border: "#e7e5e4",
    borderLight: "#f5f5f4",
    darkBg: "#0c0a09",
    darkBgAlt: "#1c1917",
    darkBgCard: "#1c1917",
    darkText: "#d6d3d1",
    darkTextMuted: "#a8a29e",
    darkTextHeading: "#fafaf9",
    darkBorder: "#292524",
    fontFamily: "'Source Serif 4', 'Georgia', 'Times New Roman', serif",
    headingFontFamily: "'Source Serif 4', 'Georgia', 'Times New Roman', serif",
    headingWeight: "600",
    bodyWeight: "400",
    radius: "0px",
    radiusSm: "0px",
    radiusLg: "2px",
    shadow: "none",
    shadowLg: "none",
    heroBg: "#ffffff",
    darkHeroBg: "#0c0a09",
    inputBorder: "#d6d3d1",
    inputBg: "#ffffff",
    focusRing: "#292524",
    successColor: "#16a34a",
    dangerColor: "#dc2626",
    warningColor: "#ca8a04",
  },
  data_dense: {
    bg: "#ffffff",
    bgAlt: "#f9fafb",
    bgCard: "#ffffff",
    text: "#111827",
    textMuted: "#6b7280",
    textHeading: "#111827",
    primary: "#2563eb",
    primaryHover: "#1d4ed8",
    primaryText: "#ffffff",
    accent: "#2563eb",
    border: "#e5e7eb",
    borderLight: "#f3f4f6",
    darkBg: "#111827",
    darkBgAlt: "#1f2937",
    darkBgCard: "#1f2937",
    darkText: "#d1d5db",
    darkTextMuted: "#9ca3af",
    darkTextHeading: "#f9fafb",
    darkBorder: "#374151",
    fontFamily: "'Inter', 'SF Mono', system-ui, -apple-system, sans-serif",
    headingFontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    headingWeight: "600",
    bodyWeight: "400",
    radius: "4px",
    radiusSm: "2px",
    radiusLg: "6px",
    shadow: "0 1px 2px 0 rgba(0,0,0,0.05)",
    shadowLg: "0 4px 6px -1px rgba(0,0,0,0.07)",
    heroBg: "#ffffff",
    darkHeroBg: "#111827",
    inputBorder: "#d1d5db",
    inputBg: "#ffffff",
    focusRing: "#2563eb",
    successColor: "#16a34a",
    dangerColor: "#dc2626",
    warningColor: "#d97706",
  },
  soft_wellness: {
    bg: "#fefcfb",
    bgAlt: "#fdf2f8",
    bgCard: "#ffffff",
    text: "#44403c",
    textMuted: "#78716c",
    textHeading: "#292524",
    primary: "#e879a8",
    primaryHover: "#db2777",
    primaryText: "#ffffff",
    accent: "#a78bfa",
    border: "#fce7f3",
    borderLight: "#fdf2f8",
    darkBg: "#1c1917",
    darkBgAlt: "#292524",
    darkBgCard: "#292524",
    darkText: "#d6d3d1",
    darkTextMuted: "#a8a29e",
    darkTextHeading: "#fafaf9",
    darkBorder: "#44403c",
    fontFamily: "'Nunito', 'DM Sans', system-ui, sans-serif",
    headingFontFamily: "'Nunito', 'DM Sans', system-ui, sans-serif",
    headingWeight: "700",
    bodyWeight: "300",
    radius: "16px",
    radiusSm: "12px",
    radiusLg: "24px",
    shadow: "0 4px 20px rgba(0,0,0,0.04)",
    shadowLg: "0 8px 40px rgba(0,0,0,0.06)",
    heroBg: "linear-gradient(135deg, #fce7f3 0%, #ede9fe 50%, #e0f2fe 100%)",
    darkHeroBg: "linear-gradient(135deg, #292524 0%, #1c1917 100%)",
    inputBorder: "#f9a8d4",
    inputBg: "#fffbfe",
    focusRing: "#e879a8",
    successColor: "#34d399",
    dangerColor: "#f87171",
    warningColor: "#fbbf24",
  },
};

// ---------------------------------------------------------------------------
// Tailwind class mapping per personality
// ---------------------------------------------------------------------------

interface TailwindPersonality {
  bg: string;
  bgAlt: string;
  bgCard: string;
  text: string;
  textMuted: string;
  textHeading: string;
  primary: string;
  primaryHover: string;
  primaryBg: string;
  primaryBgHover: string;
  accent: string;
  border: string;
  shadow: string;
  shadowLg: string;
  radius: string;
  radiusSm: string;
  radiusLg: string;
  heroBg: string;
  inputBorder: string;
  inputBg: string;
  focusRing: string;
  // Dark overrides
  darkBg: string;
  darkBgAlt: string;
  darkBgCard: string;
  darkText: string;
  darkTextMuted: string;
  darkTextHeading: string;
  darkBorder: string;
}

const TW: Record<Personality, TailwindPersonality> = {
  bold_minimal: {
    bg: "bg-white",
    bgAlt: "bg-gray-50",
    bgCard: "bg-white",
    text: "text-gray-900",
    textMuted: "text-gray-500",
    textHeading: "text-black",
    primary: "text-gray-900",
    primaryHover: "text-gray-700",
    primaryBg: "bg-gray-900",
    primaryBgHover: "hover:bg-gray-700",
    accent: "text-blue-500",
    border: "border-gray-200",
    shadow: "shadow-none",
    shadowLg: "shadow-none",
    radius: "rounded-md",
    radiusSm: "rounded",
    radiusLg: "rounded-lg",
    heroBg: "bg-white",
    inputBorder: "border-gray-300",
    inputBg: "bg-white",
    focusRing: "focus:ring-gray-900",
    darkBg: "dark:bg-black",
    darkBgAlt: "dark:bg-neutral-950",
    darkBgCard: "dark:bg-neutral-900",
    darkText: "dark:text-gray-200",
    darkTextMuted: "dark:text-gray-400",
    darkTextHeading: "dark:text-white",
    darkBorder: "dark:border-gray-800",
  },
  warm_professional: {
    bg: "bg-white",
    bgAlt: "bg-slate-50",
    bgCard: "bg-white",
    text: "text-slate-700",
    textMuted: "text-slate-500",
    textHeading: "text-slate-900",
    primary: "text-indigo-600",
    primaryHover: "text-indigo-500",
    primaryBg: "bg-indigo-600",
    primaryBgHover: "hover:bg-indigo-500",
    accent: "text-violet-500",
    border: "border-slate-200",
    shadow: "shadow-sm",
    shadowLg: "shadow-lg",
    radius: "rounded-lg",
    radiusSm: "rounded-md",
    radiusLg: "rounded-xl",
    heroBg: "bg-gradient-to-br from-indigo-500 to-purple-600",
    inputBorder: "border-slate-300",
    inputBg: "bg-white",
    focusRing: "focus:ring-indigo-500",
    darkBg: "dark:bg-slate-900",
    darkBgAlt: "dark:bg-slate-800",
    darkBgCard: "dark:bg-slate-800",
    darkText: "dark:text-slate-200",
    darkTextMuted: "dark:text-slate-400",
    darkTextHeading: "dark:text-slate-50",
    darkBorder: "dark:border-slate-700",
  },
  energetic_pop: {
    bg: "bg-white",
    bgAlt: "bg-violet-50",
    bgCard: "bg-white",
    text: "text-gray-800",
    textMuted: "text-gray-500",
    textHeading: "text-gray-900",
    primary: "text-violet-600",
    primaryHover: "text-violet-500",
    primaryBg: "bg-violet-500",
    primaryBgHover: "hover:bg-violet-600",
    accent: "text-amber-500",
    border: "border-gray-200",
    shadow: "shadow-md shadow-violet-500/10",
    shadowLg: "shadow-xl shadow-violet-500/20",
    radius: "rounded-2xl",
    radiusSm: "rounded-xl",
    radiusLg: "rounded-3xl",
    heroBg: "bg-violet-500",
    inputBorder: "border-violet-300",
    inputBg: "bg-violet-50",
    focusRing: "focus:ring-violet-500",
    darkBg: "dark:bg-[#1a1025]",
    darkBgAlt: "dark:bg-[#231432]",
    darkBgCard: "dark:bg-[#2d1b4e]",
    darkText: "dark:text-gray-200",
    darkTextMuted: "dark:text-violet-300",
    darkTextHeading: "dark:text-white",
    darkBorder: "dark:border-violet-900",
  },
  elegant_editorial: {
    bg: "bg-white",
    bgAlt: "bg-stone-50",
    bgCard: "bg-white",
    text: "text-stone-700",
    textMuted: "text-stone-500",
    textHeading: "text-stone-900",
    primary: "text-stone-800",
    primaryHover: "text-stone-700",
    primaryBg: "bg-stone-800",
    primaryBgHover: "hover:bg-stone-700",
    accent: "text-amber-700",
    border: "border-stone-200",
    shadow: "shadow-none",
    shadowLg: "shadow-none",
    radius: "rounded-none",
    radiusSm: "rounded-none",
    radiusLg: "rounded-sm",
    heroBg: "bg-white",
    inputBorder: "border-stone-300",
    inputBg: "bg-white",
    focusRing: "focus:ring-stone-800",
    darkBg: "dark:bg-stone-950",
    darkBgAlt: "dark:bg-stone-900",
    darkBgCard: "dark:bg-stone-900",
    darkText: "dark:text-stone-300",
    darkTextMuted: "dark:text-stone-500",
    darkTextHeading: "dark:text-stone-50",
    darkBorder: "dark:border-stone-800",
  },
  data_dense: {
    bg: "bg-white",
    bgAlt: "bg-gray-50",
    bgCard: "bg-white",
    text: "text-gray-900",
    textMuted: "text-gray-500",
    textHeading: "text-gray-900",
    primary: "text-blue-600",
    primaryHover: "text-blue-500",
    primaryBg: "bg-blue-600",
    primaryBgHover: "hover:bg-blue-700",
    accent: "text-blue-600",
    border: "border-gray-200",
    shadow: "shadow-sm",
    shadowLg: "shadow-md",
    radius: "rounded",
    radiusSm: "rounded-sm",
    radiusLg: "rounded-md",
    heroBg: "bg-white",
    inputBorder: "border-gray-300",
    inputBg: "bg-white",
    focusRing: "focus:ring-blue-500",
    darkBg: "dark:bg-gray-900",
    darkBgAlt: "dark:bg-gray-800",
    darkBgCard: "dark:bg-gray-800",
    darkText: "dark:text-gray-200",
    darkTextMuted: "dark:text-gray-400",
    darkTextHeading: "dark:text-gray-50",
    darkBorder: "dark:border-gray-700",
  },
  soft_wellness: {
    bg: "bg-orange-50/30",
    bgAlt: "bg-pink-50",
    bgCard: "bg-white",
    text: "text-stone-600",
    textMuted: "text-stone-500",
    textHeading: "text-stone-800",
    primary: "text-pink-400",
    primaryHover: "text-pink-500",
    primaryBg: "bg-pink-400",
    primaryBgHover: "hover:bg-pink-500",
    accent: "text-violet-400",
    border: "border-pink-100",
    shadow: "shadow-md shadow-pink-500/5",
    shadowLg: "shadow-xl shadow-pink-500/10",
    radius: "rounded-2xl",
    radiusSm: "rounded-xl",
    radiusLg: "rounded-3xl",
    heroBg: "bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100",
    inputBorder: "border-pink-200",
    inputBg: "bg-pink-50/50",
    focusRing: "focus:ring-pink-400",
    darkBg: "dark:bg-stone-900",
    darkBgAlt: "dark:bg-stone-800",
    darkBgCard: "dark:bg-stone-800",
    darkText: "dark:text-stone-300",
    darkTextMuted: "dark:text-stone-500",
    darkTextHeading: "dark:text-stone-50",
    darkBorder: "dark:border-stone-700",
  },
};

// ---------------------------------------------------------------------------
// Personality description for output notes
// ---------------------------------------------------------------------------

const PERSONALITY_NOTES: Record<Personality, { summary: string; decisions: string[] }> = {
  bold_minimal: {
    summary: "Bold Minimal - Extreme restraint with one bold punch. Inspired by Linear and Vercel.",
    decisions: [
      "Dark/white contrast with near-zero color; one accent used sparingly",
      "Oversized headline as the singular focal point on each section",
      "No shadows, no gradients on containers -- borders only (1px, subtle)",
      "Generous whitespace to make sparse content feel premium",
      "Sharp, compact typography (Inter or system sans-serif) with tight tracking on headings",
    ],
  },
  warm_professional: {
    summary: "Warm Professional - Trustworthy and approachable. Inspired by Stripe and Mercury.",
    decisions: [
      "Rich gradient backgrounds on hero/accent sections for warmth",
      "Indigo/purple primary palette conveys trust and sophistication",
      "Subtle shadows on cards (not flat, not heavy) create gentle depth",
      "Balanced whitespace: comfortable but not wasteful",
      "Rounded corners (8-12px) for approachability without being childish",
    ],
  },
  energetic_pop: {
    summary: "Energetic Pop - Bold colors, playful energy. Inspired by Duolingo and Discord.",
    decisions: [
      "Vibrant violet primary used at large scale (full-color hero sections)",
      "Oversized border-radius (16-24px) on all containers for playfulness",
      "Pronounced shadows with color tint for depth and energy",
      "Extra-bold headings (800 weight) with a larger-than-normal size scale",
      "Interactive elements are 20-30% larger than conventional to invite engagement",
    ],
  },
  elegant_editorial: {
    summary: "Elegant Editorial - Typography-driven, magazine-like. Inspired by Notion and Medium.",
    decisions: [
      "Serif typeface (Source Serif / Georgia) drives the visual identity",
      "Zero border-radius: sharp edges convey precision and sophistication",
      "No shadows anywhere: whitespace and thin rules separate content",
      "Extreme font-size contrast between body (16px) and headlines (48-72px)",
      "Muted stone/warm-gray palette; color is almost absent except for one accent",
    ],
  },
  data_dense: {
    summary: "Data Dense - Maximum information, minimum noise. Inspired by GitHub and Grafana.",
    decisions: [
      "Compact spacing on a strict 4px grid; no decorative whitespace",
      "Small border-radius (4px) for functional, tool-like appearance",
      "Functional color only: blue=interactive, green=success, red=error, yellow=warning",
      "Tabular/monospace numbers for data alignment",
      "No hero section on dashboards; every pixel earns its place with data",
    ],
  },
  soft_wellness: {
    summary: "Soft Wellness - Calming, accessible, human. Inspired by Calm and Headspace.",
    decisions: [
      "Pastel palette with very high lightness values for a safe, open feel",
      "Fully rounded elements (pill buttons, large radius cards) feel approachable",
      "Light font weights (300-400 body) for a gentle, non-aggressive tone",
      "Generous internal padding on everything; nothing feels cramped",
      "Soft shadows with low opacity for subtle, cloud-like depth",
    ],
  },
};

// ---------------------------------------------------------------------------
// Helper: build DesignTokens / TailwindPersonality from saved identity
// ---------------------------------------------------------------------------

function identityToDesignTokens(
  identity: DesignIdentityData,
  base: DesignTokens,
): DesignTokens {
  const p = identity.palette;
  const ty = identity.typography;
  const co = identity.corners;
  const sh = identity.shadows;

  return {
    ...base,
    // Colors — use identity palette when keys exist, fall back to base
    bg: p.bg ?? p.background ?? base.bg,
    bgAlt: p.bgAlt ?? p.background_alt ?? base.bgAlt,
    bgCard: p.bgCard ?? p.card ?? base.bgCard,
    text: p.text ?? base.text,
    textMuted: p.textMuted ?? p.text_muted ?? base.textMuted,
    textHeading: p.textHeading ?? p.text_heading ?? base.textHeading,
    primary: p.primary ?? base.primary,
    primaryHover: p.primaryHover ?? p.primary_hover ?? base.primaryHover,
    primaryText: p.primaryText ?? p.primary_text ?? base.primaryText,
    accent: p.accent ?? base.accent,
    border: p.border ?? base.border,
    borderLight: p.borderLight ?? p.border_light ?? base.borderLight,
    // Dark overrides
    darkBg: p.darkBg ?? p.dark_bg ?? base.darkBg,
    darkBgAlt: p.darkBgAlt ?? p.dark_bg_alt ?? base.darkBgAlt,
    darkBgCard: p.darkBgCard ?? p.dark_bg_card ?? base.darkBgCard,
    darkText: p.darkText ?? p.dark_text ?? base.darkText,
    darkTextMuted: p.darkTextMuted ?? p.dark_text_muted ?? base.darkTextMuted,
    darkTextHeading: p.darkTextHeading ?? p.dark_text_heading ?? base.darkTextHeading,
    darkBorder: p.darkBorder ?? p.dark_border ?? base.darkBorder,
    // Typography
    fontFamily: ty.fontFamily ?? ty.font_family ?? ty.body ?? base.fontFamily,
    headingFontFamily: ty.headingFontFamily ?? ty.heading_font_family ?? ty.heading ?? base.headingFontFamily,
    headingWeight: ty.headingWeight ?? ty.heading_weight ?? base.headingWeight,
    bodyWeight: ty.bodyWeight ?? ty.body_weight ?? base.bodyWeight,
    // Layout / corners
    radius: co.default ?? co.md ?? base.radius,
    radiusSm: co.sm ?? base.radiusSm,
    radiusLg: co.lg ?? base.radiusLg,
    // Shadows
    shadow: sh.default ?? sh.md ?? base.shadow,
    shadowLg: sh.lg ?? base.shadowLg,
    // Hero
    heroBg: p.heroBg ?? p.hero_bg ?? base.heroBg,
    darkHeroBg: p.darkHeroBg ?? p.dark_hero_bg ?? base.darkHeroBg,
    // Input / focus
    inputBorder: p.inputBorder ?? p.input_border ?? base.inputBorder,
    inputBg: p.inputBg ?? p.input_bg ?? base.inputBg,
    focusRing: p.focusRing ?? p.focus_ring ?? base.focusRing,
    // Semantic
    successColor: p.success ?? p.successColor ?? base.successColor,
    dangerColor: p.danger ?? p.dangerColor ?? base.dangerColor,
    warningColor: p.warning ?? p.warningColor ?? base.warningColor,
  };
}

/**
 * Build a TailwindPersonality from a saved identity.  Because Tailwind
 * classes cannot be derived programmatically from arbitrary hex values we
 * use Tailwind's arbitrary-value syntax, e.g. `bg-[#1a2b3c]`.
 */
function identityToTailwindPersonality(
  identity: DesignIdentityData,
  base: TailwindPersonality,
): TailwindPersonality {
  const p = identity.palette;
  const co = identity.corners;
  const sh = identity.shadows;

  // Tiny helper: wrap a hex/value in arbitrary Tailwind class
  const arb = (prefix: string, value: string | undefined): string | undefined =>
    value ? `${prefix}-[${value}]` : undefined;

  // Radius mapping helper
  const radiusArb = (value: string | undefined): string | undefined =>
    value ? `rounded-[${value}]` : undefined;

  // Shadow: arbitrary shadows are complex; keep base unless identity provides them
  const shadowArb = (value: string | undefined, fallback: string): string =>
    value && value !== "none" ? `shadow-[${value.replace(/ /g, "_")}]` : (value === "none" ? "shadow-none" : fallback);

  return {
    ...base,
    bg: arb("bg", p.bg ?? p.background) ?? base.bg,
    bgAlt: arb("bg", p.bgAlt ?? p.background_alt) ?? base.bgAlt,
    bgCard: arb("bg", p.bgCard ?? p.card) ?? base.bgCard,
    text: arb("text", p.text) ?? base.text,
    textMuted: arb("text", p.textMuted ?? p.text_muted) ?? base.textMuted,
    textHeading: arb("text", p.textHeading ?? p.text_heading) ?? base.textHeading,
    primary: arb("text", p.primary) ?? base.primary,
    primaryHover: arb("text", p.primaryHover ?? p.primary_hover) ?? base.primaryHover,
    primaryBg: arb("bg", p.primary) ?? base.primaryBg,
    primaryBgHover: arb("hover:bg", p.primaryHover ?? p.primary_hover) ?? base.primaryBgHover,
    accent: arb("text", p.accent) ?? base.accent,
    border: arb("border", p.border) ?? base.border,
    shadow: shadowArb(sh.default ?? sh.md, base.shadow),
    shadowLg: shadowArb(sh.lg, base.shadowLg),
    radius: radiusArb(co.default ?? co.md) ?? base.radius,
    radiusSm: radiusArb(co.sm) ?? base.radiusSm,
    radiusLg: radiusArb(co.lg) ?? base.radiusLg,
    heroBg: arb("bg", p.heroBg ?? p.hero_bg) ?? base.heroBg,
    inputBorder: arb("border", p.inputBorder ?? p.input_border) ?? base.inputBorder,
    inputBg: arb("bg", p.inputBg ?? p.input_bg) ?? base.inputBg,
    focusRing: arb("focus:ring", p.focusRing ?? p.focus_ring) ?? base.focusRing,
    // Dark overrides
    darkBg: arb("dark:bg", p.darkBg ?? p.dark_bg) ?? base.darkBg,
    darkBgAlt: arb("dark:bg", p.darkBgAlt ?? p.dark_bg_alt) ?? base.darkBgAlt,
    darkBgCard: arb("dark:bg", p.darkBgCard ?? p.dark_bg_card) ?? base.darkBgCard,
    darkText: arb("dark:text", p.darkText ?? p.dark_text) ?? base.darkText,
    darkTextMuted: arb("dark:text", p.darkTextMuted ?? p.dark_text_muted) ?? base.darkTextMuted,
    darkTextHeading: arb("dark:text", p.darkTextHeading ?? p.dark_text_heading) ?? base.darkTextHeading,
    darkBorder: arb("dark:border", p.darkBorder ?? p.dark_border) ?? base.darkBorder,
  };
}

// ---------------------------------------------------------------------------
// Helper: resolve colors for dark/light mode
// ---------------------------------------------------------------------------

function t(tokens: DesignTokens, dark: boolean) {
  return {
    bg: dark ? tokens.darkBg : tokens.bg,
    bgAlt: dark ? tokens.darkBgAlt : tokens.bgAlt,
    bgCard: dark ? tokens.darkBgCard : tokens.bgCard,
    text: dark ? tokens.darkText : tokens.text,
    textMuted: dark ? tokens.darkTextMuted : tokens.textMuted,
    textHeading: dark ? tokens.darkTextHeading : tokens.textHeading,
    border: dark ? tokens.darkBorder : tokens.border,
    heroBg: dark ? tokens.darkHeroBg : tokens.heroBg,
    primary: tokens.primary,
    primaryHover: tokens.primaryHover,
    primaryText: tokens.primaryText,
    accent: tokens.accent,
    radius: tokens.radius,
    radiusSm: tokens.radiusSm,
    radiusLg: tokens.radiusLg,
    shadow: tokens.shadow,
    shadowLg: tokens.shadowLg,
    fontFamily: tokens.fontFamily,
    headingFontFamily: tokens.headingFontFamily,
    headingWeight: tokens.headingWeight,
    bodyWeight: tokens.bodyWeight,
    inputBorder: tokens.inputBorder,
    inputBg: dark ? tokens.darkBgAlt : tokens.inputBg,
    focusRing: tokens.focusRing,
    successColor: tokens.successColor,
    dangerColor: tokens.dangerColor,
    warningColor: tokens.warningColor,
  };
}

// ---------------------------------------------------------------------------
// Page generators: Tailwind
// ---------------------------------------------------------------------------

function twDark(tw: TailwindPersonality, dark: boolean): string {
  // When dark_mode is explicitly enabled, apply dark: prefixed classes
  // We add "dark" to the root element so Tailwind dark mode works
  return dark ? " dark" : "";
}

function landingTailwind(input: PageInput): string {
  const tw = TW[input.personality];
  const name = input.product_name || "Acme";
  const dk = input.dark_mode;
  const darkCls = dk ? " dark" : "";

  const isEditorial = input.personality === "elegant_editorial";
  const isPop = input.personality === "energetic_pop";
  const isMinimal = input.personality === "bold_minimal";
  const isWellness = input.personality === "soft_wellness";

  // Headline sizing per personality
  const headlineClass = isMinimal
    ? "text-5xl md:text-7xl font-bold tracking-tight"
    : isEditorial
    ? "text-4xl md:text-6xl font-semibold italic leading-tight"
    : isPop
    ? "text-4xl md:text-6xl font-extrabold"
    : isWellness
    ? "text-3xl md:text-5xl font-bold"
    : "text-4xl md:text-6xl font-bold";

  const heroTextColor = (input.personality === "warm_professional" || isPop) ? "text-white" : `${tw.textHeading} ${dk ? tw.darkTextHeading : ""}`;
  const heroMutedColor = (input.personality === "warm_professional" || isPop) ? "text-white/80" : `${tw.textMuted} ${dk ? tw.darkTextMuted : ""}`;
  const heroBgClass = (input.personality === "warm_professional" || isPop) ? tw.heroBg : `${tw.bg} ${dk ? tw.darkBg : ""}`;

  const btnPrimary = (input.personality === "warm_professional" || isPop)
    ? `bg-white text-gray-900 hover:bg-gray-100 ${tw.radius} px-8 py-3 font-semibold transition`
    : `${tw.primaryBg} ${tw.primaryBgHover} text-white ${tw.radius} px-8 py-3 font-semibold transition`;
  const btnSecondary = (input.personality === "warm_professional" || isPop)
    ? `border-2 border-white/30 text-white hover:bg-white/10 ${tw.radius} px-8 py-3 font-semibold transition`
    : `border ${tw.border} ${dk ? tw.darkBorder : ""} ${tw.text} ${dk ? tw.darkText : ""} hover:bg-gray-50 ${dk ? "dark:hover:bg-gray-800" : ""} ${tw.radius} px-8 py-3 font-semibold transition`;

  return `export default function LandingPage() {
  return (
    <div className={\`min-h-screen ${tw.bg} ${dk ? tw.darkBg : ""} ${tw.text} ${dk ? tw.darkText : ""}${darkCls}\`}>
      {/* Navigation */}
      <nav className={\`flex items-center justify-between px-6 md:px-12 py-4 ${tw.bg} ${dk ? tw.darkBg : ""} border-b ${tw.border} ${dk ? tw.darkBorder : ""}\`}>
        <div className="text-xl font-bold ${tw.textHeading} ${dk ? tw.darkTextHeading : ""}">${name}</div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="${tw.textMuted} ${dk ? tw.darkTextMuted : ""} hover:${tw.text.replace("text-", "")} transition text-sm">Features</a>
          <a href="#testimonials" className="${tw.textMuted} ${dk ? tw.darkTextMuted : ""} hover:${tw.text.replace("text-", "")} transition text-sm">Testimonials</a>
          <a href="#pricing" className="${tw.textMuted} ${dk ? tw.darkTextMuted : ""} hover:${tw.text.replace("text-", "")} transition text-sm">Pricing</a>
          <a href="#" className="${btnPrimary} text-sm !py-2 !px-5">Get Started</a>
        </div>
        <button className="md:hidden ${tw.textMuted}" aria-label="Menu">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
      </nav>

      {/* Hero */}
      <section className={\`${heroBgClass} py-20 md:py-32 px-6 md:px-12 text-center\`}>
        <div className="max-w-4xl mx-auto">
          <h1 className={\`${headlineClass} ${heroTextColor} mb-6\`}>
            Build products that people actually love
          </h1>
          <p className={\`text-lg md:text-xl ${heroMutedColor} max-w-2xl mx-auto mb-10\`}>
            ${name} gives your team the tools to ship faster, collaborate better, and create experiences your customers will remember.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#" className="${btnPrimary}">Start Free Trial</a>
            <a href="#" className="${btnSecondary}">See How It Works</a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className={\`py-20 md:py-28 px-6 md:px-12 ${tw.bgAlt} ${dk ? tw.darkBgAlt : ""}\`}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            ${isEditorial ? `<p className="uppercase tracking-widest text-xs ${tw.textMuted} ${dk ? tw.darkTextMuted : ""} mb-4">Capabilities</p>` : ""}
            <h2 className="text-3xl md:text-4xl font-bold ${tw.textHeading} ${dk ? tw.darkTextHeading : ""} mb-4">
              Everything you need, nothing you don't
            </h2>
            <p className="${tw.textMuted} ${dk ? tw.darkTextMuted : ""} max-w-xl mx-auto">
              Powerful features designed to help you work smarter, not harder.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: "M13 10V3L4 14h7v7l9-11h-7z", title: "Lightning Fast", desc: "Sub-50ms response times globally. Your users never wait." },
              { icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z", title: "Enterprise Security", desc: "SOC 2 Type II certified with end-to-end encryption at rest and in transit." },
              { icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z", title: "Team Collaboration", desc: "Real-time editing, comments, and approvals. Your whole team, in sync." },
            ].map((feature, i) => (
              <div key={i} className={\`${tw.bgCard} ${dk ? tw.darkBgCard : ""} p-8 ${tw.radius} ${tw.shadow} ${dk ? tw.darkBorder : ""} ${input.personality === "data_dense" ? "border " + tw.border : ""}\`}>
                <div className={\`w-10 h-10 ${tw.primaryBg} ${tw.radius} flex items-center justify-center mb-4\`}>
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feature.icon} /></svg>
                </div>
                <h3 className="text-lg font-semibold ${tw.textHeading} ${dk ? tw.darkTextHeading : ""} mb-2">{feature.title}</h3>
                <p className="${tw.textMuted} ${dk ? tw.darkTextMuted : ""} text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className={\`py-20 md:py-28 px-6 md:px-12 ${tw.bg} ${dk ? tw.darkBg : ""}\`}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold ${tw.textHeading} ${dk ? tw.darkTextHeading : ""} mb-4">
              Trusted by teams who ship
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { quote: "We cut our deployment time by 60% in the first month. ${name} just gets out of the way and lets us build.", name: "Sarah Chen", role: "CTO, Meridian Labs" },
              { quote: "The collaboration features alone are worth the price. Our design and engineering teams finally speak the same language.", name: "Marcus Rivera", role: "VP Engineering, Bloom" },
              { quote: "I've tried every tool in this space. ${name} is the only one my team actually stuck with past the trial.", name: "Aisha Patel", role: "Founder, Noctis" },
            ].map((testimonial, i) => (
              <div key={i} className={\`${tw.bgCard} ${dk ? tw.darkBgCard : ""} p-8 ${tw.radiusLg} ${tw.shadow} border ${tw.border} ${dk ? tw.darkBorder : ""}\`}>
                <p className="${tw.text} ${dk ? tw.darkText : ""} text-sm leading-relaxed mb-6">"{testimonial.quote}"</p>
                <div>
                  <p className="font-semibold ${tw.textHeading} ${dk ? tw.darkTextHeading : ""} text-sm">{testimonial.name}</p>
                  <p className="${tw.textMuted} ${dk ? tw.darkTextMuted : ""} text-xs">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={\`${heroBgClass} py-20 md:py-28 px-6 md:px-12 text-center\`}>
        <div className="max-w-3xl mx-auto">
          <h2 className={\`text-3xl md:text-4xl font-bold ${heroTextColor} mb-6\`}>
            Ready to get started?
          </h2>
          <p className={\`text-lg ${heroMutedColor} mb-10\`}>
            Join thousands of teams who trust ${name} to build better products, faster.
          </p>
          <a href="#" className="${btnPrimary}">Start Your Free Trial</a>
        </div>
      </section>

      {/* Footer */}
      <footer className={\`px-6 md:px-12 py-12 border-t ${tw.border} ${dk ? tw.darkBorder : ""} ${tw.bg} ${dk ? tw.darkBg : ""}\`}>
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8">
          <div>
            <p className="font-bold ${tw.textHeading} ${dk ? tw.darkTextHeading : ""} mb-4">${name}</p>
            <p className="${tw.textMuted} ${dk ? tw.darkTextMuted : ""} text-sm">Build products people love.</p>
          </div>
          {[
            { title: "Product", links: ["Features", "Pricing", "Changelog", "Docs"] },
            { title: "Company", links: ["About", "Blog", "Careers", "Contact"] },
            { title: "Legal", links: ["Privacy", "Terms", "Security"] },
          ].map((col, i) => (
            <div key={i}>
              <p className="font-semibold ${tw.textHeading} ${dk ? tw.darkTextHeading : ""} text-sm mb-4">{col.title}</p>
              <ul className="space-y-2">
                {col.links.map((link, j) => (
                  <li key={j}><a href="#" className="${tw.textMuted} ${dk ? tw.darkTextMuted : ""} text-sm hover:underline">{link}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}`;
}

function dashboardTailwind(input: PageInput): string {
  const tw = TW[input.personality];
  const name = input.product_name || "Acme";
  const dk = input.dark_mode;
  const darkCls = dk ? " dark" : "";
  const isDense = input.personality === "data_dense";

  return `import { useState } from "react";

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const stats = [
    { label: "Total Revenue", value: "$45,231", change: "+20.1%", up: true },
    { label: "Subscriptions", value: "2,350", change: "+180", up: true },
    { label: "Active Users", value: "12,234", change: "+4.6%", up: true },
    { label: "Churn Rate", value: "2.4%", change: "-0.3%", up: false },
  ];

  const recentActivity = [
    { user: "Sarah Chen", action: "Upgraded to Pro plan", time: "2 min ago" },
    { user: "Marcus Rivera", action: "Created new project", time: "14 min ago" },
    { user: "Aisha Patel", action: "Invited 3 team members", time: "1 hour ago" },
    { user: "James Okonkwo", action: "Deployed v2.4.1", time: "2 hours ago" },
    { user: "Emily Nakamura", action: "Updated billing info", time: "4 hours ago" },
  ];

  const navItems = [
    { icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1", label: "Dashboard", active: true },
    { icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z", label: "Customers" },
    { icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", label: "Analytics" },
    { icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z", label: "Settings" },
  ];

  return (
    <div className={\`flex h-screen ${tw.bg} ${dk ? tw.darkBg : ""} ${tw.text} ${dk ? tw.darkText : ""}${darkCls}\`}>
      {/* Sidebar */}
      <aside className={\`\${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 fixed lg:static z-40 inset-y-0 left-0 w-64 ${tw.bgCard} ${dk ? tw.darkBgCard : ""} border-r ${tw.border} ${dk ? tw.darkBorder : ""} transition-transform duration-200 flex flex-col\`}>
        <div className={\`flex items-center gap-2 px-6 ${isDense ? "py-3" : "py-5"} border-b ${tw.border} ${dk ? tw.darkBorder : ""}\`}>
          <div className={\`w-8 h-8 ${tw.primaryBg} ${tw.radiusSm} flex items-center justify-center\`}>
            <span className="text-white font-bold text-sm">${name.charAt(0)}</span>
          </div>
          <span className="font-semibold ${tw.textHeading} ${dk ? tw.darkTextHeading : ""}">${name}</span>
        </div>
        <nav className={\`flex-1 px-3 ${isDense ? "py-2" : "py-4"} space-y-1\`}>
          {navItems.map((item, i) => (
            <a
              key={i}
              href="#"
              className={\`flex items-center gap-3 px-3 ${isDense ? "py-1.5 text-sm" : "py-2"} ${tw.radiusSm} transition \${
                item.active
                  ? "${tw.primaryBg} text-white"
                  : "${tw.textMuted} ${dk ? tw.darkTextMuted : ""} hover:${tw.bgAlt.replace("bg-", "bg-")} ${dk ? "dark:hover:bg-gray-700" : ""}"
              }\`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} /></svg>
              {item.label}
            </a>
          ))}
        </nav>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className={\`flex items-center justify-between px-6 ${isDense ? "py-2" : "py-4"} border-b ${tw.border} ${dk ? tw.darkBorder : ""} ${tw.bgCard} ${dk ? tw.darkBgCard : ""}\`}>
          <div className="flex items-center gap-4">
            <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <svg className="w-6 h-6 ${tw.textMuted}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className={\`relative hidden sm:block\`}>
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${tw.textMuted}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input
                type="text"
                placeholder="Search..."
                className={\`pl-10 pr-4 ${isDense ? "py-1.5 text-sm" : "py-2"} ${tw.radiusSm} border ${tw.inputBorder} ${dk ? tw.darkBorder : ""} ${tw.inputBg} ${dk ? tw.darkBgAlt : ""} ${tw.text} ${dk ? tw.darkText : ""} w-64 outline-none ${tw.focusRing} focus:ring-2\`}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className={\`relative p-2 ${tw.textMuted} ${dk ? tw.darkTextMuted : ""} hover:${tw.bgAlt.replace("bg-", "bg-")} ${tw.radiusSm}\`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className={\`w-8 h-8 ${tw.primaryBg} rounded-full flex items-center justify-center\`}>
              <span className="text-white text-sm font-medium">JD</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className={\`flex-1 overflow-y-auto ${isDense ? "p-4" : "p-6"}\`}>
          <div className="max-w-7xl mx-auto">
            <h1 className={\`${isDense ? "text-lg" : "text-2xl"} font-bold ${tw.textHeading} ${dk ? tw.darkTextHeading : ""} mb-6\`}>Dashboard</h1>

            {/* Stats Row */}
            <div className={\`grid grid-cols-2 lg:grid-cols-4 ${isDense ? "gap-3" : "gap-6"} mb-8\`}>
              {stats.map((stat, i) => (
                <div key={i} className={\`${tw.bgCard} ${dk ? tw.darkBgCard : ""} ${isDense ? "p-3" : "p-6"} ${tw.radius} ${tw.shadow} border ${tw.border} ${dk ? tw.darkBorder : ""}\`}>
                  <p className={\`text-xs ${tw.textMuted} ${dk ? tw.darkTextMuted : ""} ${isDense ? "mb-1" : "mb-2"}\`}>{stat.label}</p>
                  <p className={\`${isDense ? "text-xl" : "text-2xl"} font-bold ${tw.textHeading} ${dk ? tw.darkTextHeading : ""}\`}>{stat.value}</p>
                  <p className={\`text-xs mt-1 \${stat.up ? "text-green-500" : "text-red-500"}\`}>{stat.change} from last month</p>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-5 gap-6">
              {/* Chart placeholder */}
              <div className={\`lg:col-span-3 ${tw.bgCard} ${dk ? tw.darkBgCard : ""} ${isDense ? "p-4" : "p-6"} ${tw.radius} ${tw.shadow} border ${tw.border} ${dk ? tw.darkBorder : ""}\`}>
                <h2 className={\`${isDense ? "text-sm font-semibold" : "text-lg font-semibold"} ${tw.textHeading} ${dk ? tw.darkTextHeading : ""} mb-4\`}>Revenue Overview</h2>
                <div className={\`${tw.bgAlt} ${dk ? tw.darkBgAlt : ""} ${tw.radius} h-64 flex items-center justify-center\`}>
                  <p className="${tw.textMuted} ${dk ? tw.darkTextMuted : ""} text-sm">Chart component goes here</p>
                </div>
              </div>

              {/* Recent Activity */}
              <div className={\`lg:col-span-2 ${tw.bgCard} ${dk ? tw.darkBgCard : ""} ${isDense ? "p-4" : "p-6"} ${tw.radius} ${tw.shadow} border ${tw.border} ${dk ? tw.darkBorder : ""}\`}>
                <h2 className={\`${isDense ? "text-sm font-semibold" : "text-lg font-semibold"} ${tw.textHeading} ${dk ? tw.darkTextHeading : ""} mb-4\`}>Recent Activity</h2>
                <div className={\`space-y-${isDense ? "2" : "4"}\`}>
                  {recentActivity.map((item, i) => (
                    <div key={i} className={\`flex items-start gap-3 ${isDense ? "py-1.5" : "py-2"} \${i < recentActivity.length - 1 ? "border-b ${tw.border} ${dk ? tw.darkBorder : ""}" : ""}\`}>
                      <div className={\`w-8 h-8 ${tw.bgAlt} ${dk ? tw.darkBgAlt : ""} rounded-full flex items-center justify-center flex-shrink-0\`}>
                        <span className={\`text-xs font-medium ${tw.textMuted}\`}>{item.user.split(" ").map(n => n[0]).join("")}</span>
                      </div>
                      <div className="min-w-0">
                        <p className={\`text-sm ${tw.text} ${dk ? tw.darkText : ""}\`}>
                          <span className="font-medium">{item.user}</span>{" "}{item.action}
                        </p>
                        <p className={\`text-xs ${tw.textMuted} ${dk ? tw.darkTextMuted : ""}\`}>{item.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}`;
}

function pricingTailwind(input: PageInput): string {
  const tw = TW[input.personality];
  const name = input.product_name || "Acme";
  const dk = input.dark_mode;
  const darkCls = dk ? " dark" : "";

  return `import { useState } from "react";

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);

  const plans = [
    {
      name: "Starter",
      desc: "Perfect for side projects and small teams getting started.",
      monthly: 12,
      annual: 9,
      features: ["5 projects", "10 GB storage", "Basic analytics", "Email support", "API access"],
      highlighted: false,
      cta: "Start Free Trial",
    },
    {
      name: "Pro",
      desc: "For growing teams who need more power and flexibility.",
      monthly: 36,
      annual: 29,
      features: ["Unlimited projects", "100 GB storage", "Advanced analytics", "Priority support", "API access", "Custom domains", "Team collaboration"],
      highlighted: true,
      cta: "Start Free Trial",
    },
    {
      name: "Enterprise",
      desc: "For organizations with advanced security and compliance needs.",
      monthly: 89,
      annual: 69,
      features: ["Everything in Pro", "Unlimited storage", "SAML SSO", "Dedicated support", "SLA guarantee", "Custom integrations", "Audit logs"],
      highlighted: false,
      cta: "Contact Sales",
    },
  ];

  const faqs = [
    { q: "Can I switch plans later?", a: "Absolutely. You can upgrade or downgrade at any time. Changes are prorated so you only pay for what you use." },
    { q: "Is there a free trial?", a: "Yes, every plan includes a 14-day free trial. No credit card required to get started." },
    { q: "What happens when I hit my storage limit?", a: "We will notify you as you approach your limit. You can upgrade your plan or purchase additional storage at any time." },
    { q: "Do you offer refunds?", a: "We offer a 30-day money-back guarantee. If you are not happy, reach out and we will make it right." },
  ];

  return (
    <div className={\`min-h-screen ${tw.bg} ${dk ? tw.darkBg : ""} ${tw.text} ${dk ? tw.darkText : ""}${darkCls}\`}>
      {/* Header */}
      <section className={\`py-20 px-6 md:px-12 text-center ${tw.bgAlt} ${dk ? tw.darkBgAlt : ""}\`}>
        <h1 className="text-4xl md:text-5xl font-bold ${tw.textHeading} ${dk ? tw.darkTextHeading : ""} mb-4">
          Simple, transparent pricing
        </h1>
        <p className="${tw.textMuted} ${dk ? tw.darkTextMuted : ""} text-lg max-w-xl mx-auto mb-8">
          Start free, scale when you are ready. No hidden fees, no surprises.
        </p>
        {/* Toggle */}
        <div className="flex items-center justify-center gap-3">
          <span className={\`text-sm \${!annual ? "${tw.textHeading} ${dk ? tw.darkTextHeading : ""} font-semibold" : "${tw.textMuted} ${dk ? tw.darkTextMuted : ""}"}\`}>Monthly</span>
          <button
            onClick={() => setAnnual(!annual)}
            className={\`relative w-12 h-6 ${tw.radius} transition \${annual ? "${tw.primaryBg}" : "${tw.bgAlt.replace("50", "200")} ${dk ? tw.darkBorder : ""} border ${tw.border}"}\`}
            aria-label="Toggle annual billing"
          >
            <span className={\`absolute top-0.5 \${annual ? "left-6" : "left-0.5"} w-5 h-5 bg-white rounded-full shadow transition-all\`} />
          </button>
          <span className={\`text-sm \${annual ? "${tw.textHeading} ${dk ? tw.darkTextHeading : ""} font-semibold" : "${tw.textMuted} ${dk ? tw.darkTextMuted : ""}"}\`}>
            Annual <span className="${tw.primary} text-xs font-medium ml-1">Save 20%</span>
          </span>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 px-6 md:px-12">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={\`relative ${tw.bgCard} ${dk ? tw.darkBgCard : ""} p-8 ${tw.radiusLg} border-2 \${
                plan.highlighted
                  ? "${tw.primaryBg.replace("bg-", "border-")} ${tw.shadowLg}"
                  : "${tw.border} ${dk ? tw.darkBorder : ""} ${tw.shadow}"
              }\`}
            >
              {plan.highlighted && (
                <span className={\`absolute -top-3 left-1/2 -translate-x-1/2 ${tw.primaryBg} text-white text-xs font-semibold px-4 py-1 ${tw.radius}\`}>
                  Most Popular
                </span>
              )}
              <p className={\`font-semibold ${tw.textHeading} ${dk ? tw.darkTextHeading : ""} text-lg mb-1\`}>{plan.name}</p>
              <p className="${tw.textMuted} ${dk ? tw.darkTextMuted : ""} text-sm mb-6">{plan.desc}</p>
              <p className={\`text-4xl font-bold ${tw.textHeading} ${dk ? tw.darkTextHeading : ""} mb-1\`}>
                \${annual ? plan.annual : plan.monthly}
                <span className="${tw.textMuted} ${dk ? tw.darkTextMuted : ""} text-base font-normal">/mo</span>
              </p>
              {annual && <p className="${tw.primary} text-sm mb-6">Billed annually</p>}
              {!annual && <p className="${tw.textMuted} ${dk ? tw.darkTextMuted : ""} text-sm mb-6">Billed monthly</p>}
              <button
                className={\`w-full py-3 ${tw.radius} font-semibold transition \${
                  plan.highlighted
                    ? "${tw.primaryBg} ${tw.primaryBgHover} text-white"
                    : "border ${tw.border} ${dk ? tw.darkBorder : ""} ${tw.text} ${dk ? tw.darkText : ""} hover:${tw.bgAlt.replace("bg-", "bg-")}"
                }\`}
              >
                {plan.cta}
              </button>
              <ul className="mt-8 space-y-3">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm ${tw.text} ${dk ? tw.darkText : ""}">
                    <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className={\`py-16 px-6 md:px-12 ${tw.bgAlt} ${dk ? tw.darkBgAlt : ""}\`}>
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold ${tw.textHeading} ${dk ? tw.darkTextHeading : ""} text-center mb-12">
            Frequently asked questions
          </h2>
          <div className="space-y-6">
            {faqs.map((faq, i) => (
              <div key={i} className={\`${tw.bgCard} ${dk ? tw.darkBgCard : ""} p-6 ${tw.radius} border ${tw.border} ${dk ? tw.darkBorder : ""}\`}>
                <h3 className="font-semibold ${tw.textHeading} ${dk ? tw.darkTextHeading : ""} mb-2">{faq.q}</h3>
                <p className="${tw.textMuted} ${dk ? tw.darkTextMuted : ""} text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 px-6 md:px-12 text-center">
        <h2 className="text-2xl md:text-3xl font-bold ${tw.textHeading} ${dk ? tw.darkTextHeading : ""} mb-4">
          Still have questions?
        </h2>
        <p className="${tw.textMuted} ${dk ? tw.darkTextMuted : ""} mb-8">
          Our team is happy to walk you through ${name} and answer anything.
        </p>
        <a href="#" className="${tw.primaryBg} ${tw.primaryBgHover} text-white ${tw.radius} px-8 py-3 font-semibold transition inline-block">
          Talk to Sales
        </a>
      </section>
    </div>
  );
}`;
}

function loginTailwind(input: PageInput): string {
  const tw = TW[input.personality];
  const name = input.product_name || "Acme";
  const dk = input.dark_mode;
  const darkCls = dk ? " dark" : "";

  return `export default function LoginPage() {
  return (
    <div className={\`min-h-screen flex items-center justify-center ${tw.bgAlt} ${dk ? tw.darkBgAlt : ""} px-4${darkCls}\`}>
      <div className={\`w-full max-w-md ${tw.bgCard} ${dk ? tw.darkBgCard : ""} ${tw.radiusLg} ${tw.shadowLg} border ${tw.border} ${dk ? tw.darkBorder : ""} p-8 md:p-10\`}>
        {/* Logo */}
        <div className="text-center mb-8">
          <div className={\`w-12 h-12 ${tw.primaryBg} ${tw.radius} flex items-center justify-center mx-auto mb-4\`}>
            <span className="text-white font-bold text-xl">${name.charAt(0)}</span>
          </div>
          <h1 className="text-2xl font-bold ${tw.textHeading} ${dk ? tw.darkTextHeading : ""}">Welcome back</h1>
          <p className="${tw.textMuted} ${dk ? tw.darkTextMuted : ""} text-sm mt-1">Sign in to your ${name} account</p>
        </div>

        {/* Social Login */}
        <div className="space-y-3 mb-6">
          <button className={\`w-full flex items-center justify-center gap-3 py-2.5 ${tw.radius} border ${tw.border} ${dk ? tw.darkBorder : ""} ${tw.bgCard} ${dk ? tw.darkBgCard : ""} ${tw.text} ${dk ? tw.darkText : ""} text-sm font-medium hover:${tw.bgAlt.replace("bg-", "bg-")} transition\`}>
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continue with Google
          </button>
          <button className={\`w-full flex items-center justify-center gap-3 py-2.5 ${tw.radius} border ${tw.border} ${dk ? tw.darkBorder : ""} ${tw.bgCard} ${dk ? tw.darkBgCard : ""} ${tw.text} ${dk ? tw.darkText : ""} text-sm font-medium hover:${tw.bgAlt.replace("bg-", "bg-")} transition\`}>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z"/></svg>
            Continue with GitHub
          </button>
        </div>

        {/* Divider */}
        <div className="relative mb-6">
          <div className={\`absolute inset-0 flex items-center\`}><div className={\`w-full border-t ${tw.border} ${dk ? tw.darkBorder : ""}\`}></div></div>
          <div className="relative flex justify-center text-sm"><span className={\`px-3 ${tw.bgCard} ${dk ? tw.darkBgCard : ""} ${tw.textMuted} ${dk ? tw.darkTextMuted : ""}\`}>or continue with email</span></div>
        </div>

        {/* Form */}
        <form className="space-y-4">
          <div>
            <label className={\`block text-sm font-medium ${tw.textHeading} ${dk ? tw.darkTextHeading : ""} mb-1.5\`}>Email address</label>
            <input
              type="email"
              placeholder="you@company.com"
              className={\`w-full px-4 py-2.5 ${tw.radius} border ${tw.inputBorder} ${dk ? tw.darkBorder : ""} ${tw.inputBg} ${dk ? tw.darkBgAlt : ""} ${tw.text} ${dk ? tw.darkText : ""} text-sm outline-none ${tw.focusRing} focus:ring-2 transition\`}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={\`block text-sm font-medium ${tw.textHeading} ${dk ? tw.darkTextHeading : ""}\`}>Password</label>
              <a href="#" className="${tw.primary} text-sm hover:underline">Forgot password?</a>
            </div>
            <input
              type="password"
              placeholder="Enter your password"
              className={\`w-full px-4 py-2.5 ${tw.radius} border ${tw.inputBorder} ${dk ? tw.darkBorder : ""} ${tw.inputBg} ${dk ? tw.darkBgAlt : ""} ${tw.text} ${dk ? tw.darkText : ""} text-sm outline-none ${tw.focusRing} focus:ring-2 transition\`}
            />
          </div>
          <button
            type="submit"
            className={\`w-full py-2.5 ${tw.primaryBg} ${tw.primaryBgHover} text-white ${tw.radius} font-semibold text-sm transition\`}
          >
            Sign in
          </button>
        </form>

        <p className="${tw.textMuted} ${dk ? tw.darkTextMuted : ""} text-sm text-center mt-6">
          Don't have an account?{" "}
          <a href="#" className="${tw.primary} font-medium hover:underline">Create one</a>
        </p>
      </div>
    </div>
  );
}`;
}

function settingsTailwind(input: PageInput): string {
  const tw = TW[input.personality];
  const name = input.product_name || "Acme";
  const dk = input.dark_mode;
  const darkCls = dk ? " dark" : "";

  return `import { useState } from "react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [marketingEmails, setMarketingEmails] = useState(true);

  const tabs = [
    { id: "profile", label: "Profile" },
    { id: "account", label: "Account" },
    { id: "notifications", label: "Notifications" },
    { id: "billing", label: "Billing" },
    { id: "integrations", label: "Integrations" },
  ];

  const Toggle = ({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) => (
    <button
      onClick={onToggle}
      className={\`relative w-11 h-6 ${tw.radius} transition \${enabled ? "${tw.primaryBg}" : "${tw.bgAlt.replace("50", "200")} ${dk ? tw.darkBorder : ""} border ${tw.border}"}\`}
    >
      <span className={\`absolute top-0.5 \${enabled ? "left-5" : "left-0.5"} w-5 h-5 bg-white rounded-full shadow transition-all\`} />
    </button>
  );

  return (
    <div className={\`min-h-screen ${tw.bg} ${dk ? tw.darkBg : ""} ${tw.text} ${dk ? tw.darkText : ""}${darkCls}\`}>
      {/* Header */}
      <div className={\`border-b ${tw.border} ${dk ? tw.darkBorder : ""} ${tw.bgCard} ${dk ? tw.darkBgCard : ""}\`}>
        <div className="max-w-5xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-bold ${tw.textHeading} ${dk ? tw.darkTextHeading : ""}">Settings</h1>
          <p className="${tw.textMuted} ${dk ? tw.darkTextMuted : ""} text-sm mt-1">Manage your account preferences and configuration.</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <nav className="md:w-56 flex-shrink-0">
          <ul className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
            {tabs.map((tab) => (
              <li key={tab.id}>
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={\`whitespace-nowrap px-3 py-2 text-sm ${tw.radiusSm} transition w-full text-left \${
                    activeTab === tab.id
                      ? "${tw.primaryBg} text-white font-medium"
                      : "${tw.textMuted} ${dk ? tw.darkTextMuted : ""} hover:${tw.bgAlt.replace("bg-", "bg-")}"
                  }\`}
                >
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeTab === "profile" && (
            <div className="space-y-8">
              {/* Profile Photo */}
              <section className={\`${tw.bgCard} ${dk ? tw.darkBgCard : ""} p-6 ${tw.radius} border ${tw.border} ${dk ? tw.darkBorder : ""} ${tw.shadow}\`}>
                <h2 className="font-semibold ${tw.textHeading} ${dk ? tw.darkTextHeading : ""} mb-4">Profile Photo</h2>
                <div className="flex items-center gap-4">
                  <div className={\`w-16 h-16 ${tw.primaryBg} rounded-full flex items-center justify-center\`}>
                    <span className="text-white font-bold text-xl">JD</span>
                  </div>
                  <div>
                    <button className={\`px-4 py-2 text-sm ${tw.radius} border ${tw.border} ${dk ? tw.darkBorder : ""} ${tw.text} ${dk ? tw.darkText : ""} hover:${tw.bgAlt.replace("bg-", "bg-")} transition font-medium\`}>
                      Change Photo
                    </button>
                    <p className="${tw.textMuted} ${dk ? tw.darkTextMuted : ""} text-xs mt-1">JPG, PNG, or GIF. Max 2MB.</p>
                  </div>
                </div>
              </section>

              {/* Personal Info */}
              <section className={\`${tw.bgCard} ${dk ? tw.darkBgCard : ""} p-6 ${tw.radius} border ${tw.border} ${dk ? tw.darkBorder : ""} ${tw.shadow}\`}>
                <h2 className="font-semibold ${tw.textHeading} ${dk ? tw.darkTextHeading : ""} mb-4">Personal Information</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className={\`block text-sm font-medium ${tw.textHeading} ${dk ? tw.darkTextHeading : ""} mb-1.5\`}>First Name</label>
                    <input type="text" defaultValue="Jane" className={\`w-full px-4 py-2.5 ${tw.radius} border ${tw.inputBorder} ${dk ? tw.darkBorder : ""} ${tw.inputBg} ${dk ? tw.darkBgAlt : ""} ${tw.text} ${dk ? tw.darkText : ""} text-sm outline-none ${tw.focusRing} focus:ring-2\`} />
                  </div>
                  <div>
                    <label className={\`block text-sm font-medium ${tw.textHeading} ${dk ? tw.darkTextHeading : ""} mb-1.5\`}>Last Name</label>
                    <input type="text" defaultValue="Doe" className={\`w-full px-4 py-2.5 ${tw.radius} border ${tw.inputBorder} ${dk ? tw.darkBorder : ""} ${tw.inputBg} ${dk ? tw.darkBgAlt : ""} ${tw.text} ${dk ? tw.darkText : ""} text-sm outline-none ${tw.focusRing} focus:ring-2\`} />
                  </div>
                  <div className="md:col-span-2">
                    <label className={\`block text-sm font-medium ${tw.textHeading} ${dk ? tw.darkTextHeading : ""} mb-1.5\`}>Email</label>
                    <input type="email" defaultValue="jane@company.com" className={\`w-full px-4 py-2.5 ${tw.radius} border ${tw.inputBorder} ${dk ? tw.darkBorder : ""} ${tw.inputBg} ${dk ? tw.darkBgAlt : ""} ${tw.text} ${dk ? tw.darkText : ""} text-sm outline-none ${tw.focusRing} focus:ring-2\`} />
                  </div>
                  <div className="md:col-span-2">
                    <label className={\`block text-sm font-medium ${tw.textHeading} ${dk ? tw.darkTextHeading : ""} mb-1.5\`}>Bio</label>
                    <textarea rows={3} defaultValue="Product designer based in San Francisco. Previously at Stripe." className={\`w-full px-4 py-2.5 ${tw.radius} border ${tw.inputBorder} ${dk ? tw.darkBorder : ""} ${tw.inputBg} ${dk ? tw.darkBgAlt : ""} ${tw.text} ${dk ? tw.darkText : ""} text-sm outline-none ${tw.focusRing} focus:ring-2 resize-none\`} />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button className={\`px-4 py-2 text-sm ${tw.radius} border ${tw.border} ${dk ? tw.darkBorder : ""} ${tw.text} ${dk ? tw.darkText : ""} hover:${tw.bgAlt.replace("bg-", "bg-")} transition font-medium\`}>Cancel</button>
                  <button className={\`px-4 py-2 text-sm ${tw.primaryBg} ${tw.primaryBgHover} text-white ${tw.radius} font-medium transition\`}>Save Changes</button>
                </div>
              </section>

              {/* Notifications inline */}
              <section className={\`${tw.bgCard} ${dk ? tw.darkBgCard : ""} p-6 ${tw.radius} border ${tw.border} ${dk ? tw.darkBorder : ""} ${tw.shadow}\`}>
                <h2 className="font-semibold ${tw.textHeading} ${dk ? tw.darkTextHeading : ""} mb-4">Notification Preferences</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium ${tw.textHeading} ${dk ? tw.darkTextHeading : ""}">Email Notifications</p>
                      <p className="${tw.textMuted} ${dk ? tw.darkTextMuted : ""} text-xs">Receive updates about your account via email.</p>
                    </div>
                    <Toggle enabled={emailNotifications} onToggle={() => setEmailNotifications(!emailNotifications)} />
                  </div>
                  <div className={\`border-t ${tw.border} ${dk ? tw.darkBorder : ""} pt-4 flex items-center justify-between\`}>
                    <div>
                      <p className="text-sm font-medium ${tw.textHeading} ${dk ? tw.darkTextHeading : ""}">Push Notifications</p>
                      <p className="${tw.textMuted} ${dk ? tw.darkTextMuted : ""} text-xs">Get push notifications on your device.</p>
                    </div>
                    <Toggle enabled={pushNotifications} onToggle={() => setPushNotifications(!pushNotifications)} />
                  </div>
                  <div className={\`border-t ${tw.border} ${dk ? tw.darkBorder : ""} pt-4 flex items-center justify-between\`}>
                    <div>
                      <p className="text-sm font-medium ${tw.textHeading} ${dk ? tw.darkTextHeading : ""}">Marketing Emails</p>
                      <p className="${tw.textMuted} ${dk ? tw.darkTextMuted : ""} text-xs">Receive tips, product updates, and offers.</p>
                    </div>
                    <Toggle enabled={marketingEmails} onToggle={() => setMarketingEmails(!marketingEmails)} />
                  </div>
                </div>
              </section>

              {/* Danger Zone */}
              <section className={\`p-6 ${tw.radius} border-2 border-red-200 ${dk ? "dark:border-red-900" : ""}\`}>
                <h2 className="font-semibold text-red-600 ${dk ? "dark:text-red-400" : ""} mb-2">Danger Zone</h2>
                <p className="${tw.textMuted} ${dk ? tw.darkTextMuted : ""} text-sm mb-4">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <button className={\`px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white ${tw.radius} font-medium transition\`}>
                  Delete Account
                </button>
              </section>
            </div>
          )}

          {activeTab !== "profile" && (
            <div className={\`${tw.bgCard} ${dk ? tw.darkBgCard : ""} p-12 ${tw.radius} border ${tw.border} ${dk ? tw.darkBorder : ""} ${tw.shadow} text-center\`}>
              <p className="${tw.textMuted} ${dk ? tw.darkTextMuted : ""}">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} settings content goes here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}`;
}

function notFoundTailwind(input: PageInput): string {
  const tw = TW[input.personality];
  const name = input.product_name || "Acme";
  const dk = input.dark_mode;
  const darkCls = dk ? " dark" : "";
  const isEditorial = input.personality === "elegant_editorial";
  const isPop = input.personality === "energetic_pop";
  const isWellness = input.personality === "soft_wellness";

  const numberClass = isPop
    ? `text-[10rem] md:text-[14rem] font-extrabold ${tw.primary} opacity-20 select-none`
    : isEditorial
    ? `text-[10rem] md:text-[14rem] font-light ${tw.textMuted} ${dk ? tw.darkTextMuted : ""} opacity-15 select-none italic`
    : isWellness
    ? `text-[10rem] md:text-[14rem] font-bold ${tw.primary} opacity-15 select-none`
    : `text-[10rem] md:text-[14rem] font-bold ${tw.textMuted} ${dk ? tw.darkTextMuted : ""} opacity-10 select-none`;

  return `export default function NotFoundPage() {
  return (
    <div className={\`min-h-screen flex flex-col items-center justify-center ${tw.bg} ${dk ? tw.darkBg : ""} px-6 text-center relative overflow-hidden${darkCls}\`}>
      {/* Large 404 number */}
      <div className="${numberClass} absolute leading-none" aria-hidden="true">404</div>

      <div className="relative z-10 max-w-md">
        <h1 className="text-3xl md:text-4xl font-bold ${tw.textHeading} ${dk ? tw.darkTextHeading : ""} mb-4">
          Page not found
        </h1>
        <p className="${tw.textMuted} ${dk ? tw.darkTextMuted : ""} text-lg mb-8 leading-relaxed">
          We looked everywhere, but this page seems to have wandered off. Let's get you back on track.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="/"
            className={\`${tw.primaryBg} ${tw.primaryBgHover} text-white ${tw.radius} px-8 py-3 font-semibold transition inline-block\`}
          >
            Back to Home
          </a>
          <a
            href="#"
            className={\`border ${tw.border} ${dk ? tw.darkBorder : ""} ${tw.text} ${dk ? tw.darkText : ""} hover:${tw.bgAlt.replace("bg-", "bg-")} ${tw.radius} px-8 py-3 font-semibold transition inline-block\`}
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}`;
}

// ---------------------------------------------------------------------------
// Page generators: Inline styles
// ---------------------------------------------------------------------------

function landingInline(input: PageInput): string {
  const tk = t(TOKENS[input.personality], input.dark_mode);
  const name = input.product_name || "Acme";
  const isHeroDark = input.personality === "warm_professional" || input.personality === "energetic_pop";
  const heroTextColor = isHeroDark ? "#ffffff" : tk.textHeading;
  const heroMutedColor = isHeroDark ? "rgba(255,255,255,0.8)" : tk.textMuted;

  return `export default function LandingPage() {
  const features = [
    { icon: "\\u26A1", title: "Lightning Fast", desc: "Sub-50ms response times globally. Your users never wait." },
    { icon: "\\uD83D\\uDD12", title: "Enterprise Security", desc: "SOC 2 Type II certified with end-to-end encryption at rest and in transit." },
    { icon: "\\uD83D\\uDC65", title: "Team Collaboration", desc: "Real-time editing, comments, and approvals. Your whole team, in sync." },
  ];

  const testimonials = [
    { quote: "We cut our deployment time by 60% in the first month. ${name} just gets out of the way and lets us build.", name: "Sarah Chen", role: "CTO, Meridian Labs" },
    { quote: "The collaboration features alone are worth the price. Our design and engineering teams finally speak the same language.", name: "Marcus Rivera", role: "VP Engineering, Bloom" },
    { quote: "I've tried every tool in this space. ${name} is the only one my team actually stuck with past the trial.", name: "Aisha Patel", role: "Founder, Noctis" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "${tk.bg}", color: "${tk.text}", fontFamily: ${JSON.stringify(tk.fontFamily)}, fontWeight: ${tk.bodyWeight} }}>
      {/* Nav */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 48px", borderBottom: "1px solid ${tk.border}" }}>
        <span style={{ fontWeight: 700, fontSize: "1.25rem", color: "${tk.textHeading}" }}>${name}</span>
        <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
          <a href="#features" style={{ color: "${tk.textMuted}", textDecoration: "none", fontSize: "0.875rem" }}>Features</a>
          <a href="#" style={{ color: "${tk.textMuted}", textDecoration: "none", fontSize: "0.875rem" }}>Pricing</a>
          <a href="#" style={{ background: "${tk.primary}", color: "${tk.primaryText}", padding: "8px 20px", borderRadius: "${tk.radius}", fontWeight: 600, fontSize: "0.875rem", textDecoration: "none", border: "none" }}>Get Started</a>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ background: "${tk.heroBg}", padding: "80px 48px", textAlign: "center" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <h1 style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: ${tk.headingWeight}, color: "${heroTextColor}", marginBottom: "24px", lineHeight: 1.1, fontFamily: ${JSON.stringify(tk.headingFontFamily)} }}>
            Build products that people actually love
          </h1>
          <p style={{ fontSize: "1.25rem", color: "${heroMutedColor}", maxWidth: "600px", margin: "0 auto 40px", lineHeight: 1.6 }}>
            ${name} gives your team the tools to ship faster, collaborate better, and create experiences your customers will remember.
          </p>
          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <a href="#" style={{ background: ${isHeroDark ? '"#ffffff"' : `"${tk.primary}"`}, color: ${isHeroDark ? '"#111827"' : `"${tk.primaryText}"`}, padding: "14px 32px", borderRadius: "${tk.radius}", fontWeight: 600, textDecoration: "none" }}>Start Free Trial</a>
            <a href="#" style={{ border: ${isHeroDark ? '"2px solid rgba(255,255,255,0.3)"' : `"1px solid ${tk.border}"`}, color: ${isHeroDark ? '"#ffffff"' : `"${tk.text}"`}, padding: "14px 32px", borderRadius: "${tk.radius}", fontWeight: 600, textDecoration: "none", background: "transparent" }}>See How It Works</a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ padding: "100px 48px", background: "${tk.bgAlt}" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", fontSize: "2rem", fontWeight: ${tk.headingWeight}, color: "${tk.textHeading}", marginBottom: "16px", fontFamily: ${JSON.stringify(tk.headingFontFamily)} }}>Everything you need, nothing you don't</h2>
          <p style={{ textAlign: "center", color: "${tk.textMuted}", maxWidth: "500px", margin: "0 auto 64px" }}>Powerful features designed to help you work smarter, not harder.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "32px" }}>
            {features.map((f, i) => (
              <div key={i} style={{ background: "${tk.bgCard}", padding: "32px", borderRadius: "${tk.radiusLg}", boxShadow: "${tk.shadow}", border: "1px solid ${tk.border}" }}>
                <div style={{ width: "40px", height: "40px", background: "${tk.primary}", borderRadius: "${tk.radius}", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px", fontSize: "1.2rem" }}>{f.icon}</div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "${tk.textHeading}", marginBottom: "8px" }}>{f.title}</h3>
                <p style={{ fontSize: "0.875rem", color: "${tk.textMuted}", lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ padding: "100px 48px", background: "${tk.bg}" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", fontSize: "2rem", fontWeight: ${tk.headingWeight}, color: "${tk.textHeading}", marginBottom: "48px", fontFamily: ${JSON.stringify(tk.headingFontFamily)} }}>Trusted by teams who ship</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "32px" }}>
            {testimonials.map((t, i) => (
              <div key={i} style={{ background: "${tk.bgCard}", padding: "32px", borderRadius: "${tk.radiusLg}", boxShadow: "${tk.shadow}", border: "1px solid ${tk.border}" }}>
                <p style={{ fontSize: "0.875rem", color: "${tk.text}", lineHeight: 1.7, marginBottom: "24px" }}>"{t.quote}"</p>
                <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "${tk.textHeading}" }}>{t.name}</p>
                <p style={{ fontSize: "0.75rem", color: "${tk.textMuted}" }}>{t.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: "${tk.heroBg}", padding: "100px 48px", textAlign: "center" }}>
        <h2 style={{ fontSize: "2rem", fontWeight: ${tk.headingWeight}, color: "${heroTextColor}", marginBottom: "24px", fontFamily: ${JSON.stringify(tk.headingFontFamily)} }}>Ready to get started?</h2>
        <p style={{ fontSize: "1.1rem", color: "${heroMutedColor}", marginBottom: "40px" }}>Join thousands of teams who trust ${name} to build better products, faster.</p>
        <a href="#" style={{ background: ${isHeroDark ? '"#ffffff"' : `"${tk.primary}"`}, color: ${isHeroDark ? '"#111827"' : `"${tk.primaryText}"`}, padding: "14px 32px", borderRadius: "${tk.radius}", fontWeight: 600, textDecoration: "none", display: "inline-block" }}>Start Your Free Trial</a>
      </section>

      {/* Footer */}
      <footer style={{ padding: "48px", borderTop: "1px solid ${tk.border}", background: "${tk.bg}" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "32px" }}>
          <div>
            <p style={{ fontWeight: 700, color: "${tk.textHeading}", marginBottom: "16px" }}>${name}</p>
            <p style={{ fontSize: "0.875rem", color: "${tk.textMuted}" }}>Build products people love.</p>
          </div>
          {[
            { title: "Product", links: ["Features", "Pricing", "Changelog", "Docs"] },
            { title: "Company", links: ["About", "Blog", "Careers", "Contact"] },
            { title: "Legal", links: ["Privacy", "Terms", "Security"] },
          ].map((col, i) => (
            <div key={i}>
              <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "${tk.textHeading}", marginBottom: "16px" }}>{col.title}</p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                {col.links.map((link, j) => (
                  <li key={j}><a href="#" style={{ color: "${tk.textMuted}", fontSize: "0.875rem", textDecoration: "none" }}>{link}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}`;
}

function dashboardInline(input: PageInput): string {
  const tk = t(TOKENS[input.personality], input.dark_mode);
  const name = input.product_name || "Acme";
  const isDense = input.personality === "data_dense";
  const padMain = isDense ? "16px" : "24px";
  const padCard = isDense ? "12px" : "24px";

  return `import { useState } from "react";

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const stats = [
    { label: "Total Revenue", value: "$45,231", change: "+20.1%", up: true },
    { label: "Subscriptions", value: "2,350", change: "+180", up: true },
    { label: "Active Users", value: "12,234", change: "+4.6%", up: true },
    { label: "Churn Rate", value: "2.4%", change: "-0.3%", up: false },
  ];

  const activity = [
    { user: "Sarah Chen", action: "Upgraded to Pro plan", time: "2 min ago" },
    { user: "Marcus Rivera", action: "Created new project", time: "14 min ago" },
    { user: "Aisha Patel", action: "Invited 3 team members", time: "1 hour ago" },
    { user: "James Okonkwo", action: "Deployed v2.4.1", time: "2 hours ago" },
    { user: "Emily Nakamura", action: "Updated billing info", time: "4 hours ago" },
  ];

  const navItems = ["Dashboard", "Customers", "Analytics", "Settings"];

  return (
    <div style={{ display: "flex", height: "100vh", background: "${tk.bg}", color: "${tk.text}", fontFamily: ${JSON.stringify(tk.fontFamily)}, fontWeight: ${tk.bodyWeight} }}>
      {/* Sidebar */}
      <aside style={{ width: "256px", background: "${tk.bgCard}", borderRight: "1px solid ${tk.border}", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "${isDense ? "12px 16px" : "20px 24px"}", borderBottom: "1px solid ${tk.border}" }}>
          <div style={{ width: "32px", height: "32px", background: "${tk.primary}", borderRadius: "${tk.radiusSm}", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "${tk.primaryText}", fontWeight: 700, fontSize: "0.875rem" }}>${name.charAt(0)}</span>
          </div>
          <span style={{ fontWeight: 600, color: "${tk.textHeading}" }}>${name}</span>
        </div>
        <nav style={{ padding: "${isDense ? "8px" : "16px"}", display: "flex", flexDirection: "column", gap: "4px" }}>
          {navItems.map((item, i) => (
            <a key={i} href="#" style={{ display: "block", padding: "${isDense ? "6px 12px" : "10px 12px"}", borderRadius: "${tk.radiusSm}", background: i === 0 ? "${tk.primary}" : "transparent", color: i === 0 ? "${tk.primaryText}" : "${tk.textMuted}", textDecoration: "none", fontSize: "${isDense ? "0.8125rem" : "0.875rem"}" }}>
              {item}
            </a>
          ))}
        </nav>
      </aside>

      {/* Main area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "${isDense ? "8px 16px" : "16px 24px"}", borderBottom: "1px solid ${tk.border}", background: "${tk.bgCard}" }}>
          <input type="text" placeholder="Search..." style={{ padding: "${isDense ? "6px 12px" : "10px 16px"}", borderRadius: "${tk.radiusSm}", border: "1px solid ${tk.inputBorder}", background: "${tk.inputBg}", color: "${tk.text}", fontSize: "0.875rem", width: "256px", outline: "none" }} />
          <div style={{ width: "32px", height: "32px", background: "${tk.primary}", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "${tk.primaryText}", fontSize: "0.8125rem", fontWeight: 500 }}>JD</span>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, overflow: "auto", padding: "${padMain}" }}>
          <h1 style={{ fontSize: "${isDense ? "1.1rem" : "1.5rem"}", fontWeight: ${tk.headingWeight}, color: "${tk.textHeading}", marginBottom: "24px", fontFamily: ${JSON.stringify(tk.headingFontFamily)} }}>Dashboard</h1>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "${isDense ? "12px" : "24px"}", marginBottom: "32px" }}>
            {stats.map((s, i) => (
              <div key={i} style={{ background: "${tk.bgCard}", padding: "${padCard}", borderRadius: "${tk.radius}", boxShadow: "${tk.shadow}", border: "1px solid ${tk.border}" }}>
                <p style={{ fontSize: "0.75rem", color: "${tk.textMuted}", marginBottom: "${isDense ? "4px" : "8px"}" }}>{s.label}</p>
                <p style={{ fontSize: "${isDense ? "1.25rem" : "1.5rem"}", fontWeight: 700, color: "${tk.textHeading}" }}>{s.value}</p>
                <p style={{ fontSize: "0.75rem", color: s.up ? "${tk.successColor}" : "${tk.dangerColor}", marginTop: "4px" }}>{s.change} from last month</p>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: "24px" }}>
            {/* Chart placeholder */}
            <div style={{ background: "${tk.bgCard}", padding: "${padCard}", borderRadius: "${tk.radius}", boxShadow: "${tk.shadow}", border: "1px solid ${tk.border}" }}>
              <h2 style={{ fontSize: "${isDense ? "0.875rem" : "1.1rem"}", fontWeight: 600, color: "${tk.textHeading}", marginBottom: "16px" }}>Revenue Overview</h2>
              <div style={{ background: "${tk.bgAlt}", borderRadius: "${tk.radius}", height: "256px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <p style={{ color: "${tk.textMuted}", fontSize: "0.875rem" }}>Chart component goes here</p>
              </div>
            </div>

            {/* Activity */}
            <div style={{ background: "${tk.bgCard}", padding: "${padCard}", borderRadius: "${tk.radius}", boxShadow: "${tk.shadow}", border: "1px solid ${tk.border}" }}>
              <h2 style={{ fontSize: "${isDense ? "0.875rem" : "1.1rem"}", fontWeight: 600, color: "${tk.textHeading}", marginBottom: "16px" }}>Recent Activity</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "${isDense ? "8px" : "16px"}" }}>
                {activity.map((a, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "12px", paddingBottom: "${isDense ? "8px" : "16px"}", borderBottom: i < activity.length - 1 ? "1px solid ${tk.border}" : "none" }}>
                    <div style={{ width: "32px", height: "32px", background: "${tk.bgAlt}", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: "0.7rem", fontWeight: 500, color: "${tk.textMuted}" }}>{a.user.split(" ").map(n => n[0]).join("")}</span>
                    </div>
                    <div>
                      <p style={{ fontSize: "0.875rem", color: "${tk.text}" }}><strong>{a.user}</strong> {a.action}</p>
                      <p style={{ fontSize: "0.75rem", color: "${tk.textMuted}" }}>{a.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}`;
}

function pricingInline(input: PageInput): string {
  const tk = t(TOKENS[input.personality], input.dark_mode);
  const name = input.product_name || "Acme";

  return `import { useState } from "react";

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);

  const plans = [
    { name: "Starter", desc: "Perfect for side projects and small teams.", monthly: 12, annual: 9, features: ["5 projects", "10 GB storage", "Basic analytics", "Email support", "API access"], highlighted: false, cta: "Start Free Trial" },
    { name: "Pro", desc: "For growing teams who need more power.", monthly: 36, annual: 29, features: ["Unlimited projects", "100 GB storage", "Advanced analytics", "Priority support", "API access", "Custom domains", "Team collaboration"], highlighted: true, cta: "Start Free Trial" },
    { name: "Enterprise", desc: "Advanced security and compliance.", monthly: 89, annual: 69, features: ["Everything in Pro", "Unlimited storage", "SAML SSO", "Dedicated support", "SLA guarantee", "Custom integrations", "Audit logs"], highlighted: false, cta: "Contact Sales" },
  ];

  const faqs = [
    { q: "Can I switch plans later?", a: "Absolutely. You can upgrade or downgrade at any time. Changes are prorated." },
    { q: "Is there a free trial?", a: "Yes, every plan includes a 14-day free trial. No credit card required." },
    { q: "What happens at the storage limit?", a: "We will notify you as you approach your limit. Upgrade or purchase more anytime." },
    { q: "Do you offer refunds?", a: "We offer a 30-day money-back guarantee." },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "${tk.bg}", color: "${tk.text}", fontFamily: ${JSON.stringify(tk.fontFamily)}, fontWeight: ${tk.bodyWeight} }}>
      {/* Header */}
      <section style={{ padding: "80px 48px", textAlign: "center", background: "${tk.bgAlt}" }}>
        <h1 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: ${tk.headingWeight}, color: "${tk.textHeading}", marginBottom: "16px", fontFamily: ${JSON.stringify(tk.headingFontFamily)} }}>Simple, transparent pricing</h1>
        <p style={{ color: "${tk.textMuted}", fontSize: "1.1rem", maxWidth: "500px", margin: "0 auto 32px" }}>Start free, scale when you are ready. No hidden fees.</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" }}>
          <span style={{ fontSize: "0.875rem", fontWeight: annual ? 400 : 600, color: annual ? "${tk.textMuted}" : "${tk.textHeading}" }}>Monthly</span>
          <button onClick={() => setAnnual(!annual)} style={{ position: "relative", width: "48px", height: "24px", borderRadius: "12px", border: annual ? "none" : "1px solid ${tk.border}", background: annual ? "${tk.primary}" : "${tk.bgAlt}", cursor: "pointer", padding: 0 }}>
            <span style={{ position: "absolute", top: "2px", left: annual ? "24px" : "2px", width: "20px", height: "20px", background: "#fff", borderRadius: "50%", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "left 0.2s" }} />
          </button>
          <span style={{ fontSize: "0.875rem", fontWeight: annual ? 600 : 400, color: annual ? "${tk.textHeading}" : "${tk.textMuted}" }}>Annual <span style={{ color: "${tk.primary}", fontSize: "0.75rem", fontWeight: 500, marginLeft: "4px" }}>Save 20%</span></span>
        </div>
      </section>

      {/* Cards */}
      <section style={{ padding: "64px 48px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "32px" }}>
          {plans.map((plan, i) => (
            <div key={i} style={{ position: "relative", background: "${tk.bgCard}", padding: "32px", borderRadius: "${tk.radiusLg}", border: plan.highlighted ? "2px solid ${tk.primary}" : "1px solid ${tk.border}", boxShadow: plan.highlighted ? "${tk.shadowLg}" : "${tk.shadow}" }}>
              {plan.highlighted && <span style={{ position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)", background: "${tk.primary}", color: "${tk.primaryText}", fontSize: "0.75rem", fontWeight: 600, padding: "4px 16px", borderRadius: "${tk.radius}" }}>Most Popular</span>}
              <p style={{ fontWeight: 600, color: "${tk.textHeading}", fontSize: "1.1rem", marginBottom: "4px" }}>{plan.name}</p>
              <p style={{ color: "${tk.textMuted}", fontSize: "0.875rem", marginBottom: "24px" }}>{plan.desc}</p>
              <p style={{ fontSize: "2.5rem", fontWeight: 700, color: "${tk.textHeading}", marginBottom: "4px" }}>\${annual ? plan.annual : plan.monthly}<span style={{ fontSize: "1rem", fontWeight: 400, color: "${tk.textMuted}" }}>/mo</span></p>
              <p style={{ fontSize: "0.8125rem", color: annual ? "${tk.primary}" : "${tk.textMuted}", marginBottom: "24px" }}>{annual ? "Billed annually" : "Billed monthly"}</p>
              <button style={{ width: "100%", padding: "12px", borderRadius: "${tk.radius}", border: plan.highlighted ? "none" : "1px solid ${tk.border}", background: plan.highlighted ? "${tk.primary}" : "transparent", color: plan.highlighted ? "${tk.primaryText}" : "${tk.text}", fontWeight: 600, cursor: "pointer", fontSize: "0.875rem" }}>{plan.cta}</button>
              <ul style={{ listStyle: "none", padding: 0, margin: "32px 0 0" }}>
                {plan.features.map((f, j) => (
                  <li key={j} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.875rem", color: "${tk.text}", padding: "6px 0" }}><span style={{ color: "${tk.successColor}" }}>\\u2713</span> {f}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: "64px 48px", background: "${tk.bgAlt}" }}>
        <div style={{ maxWidth: "700px", margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", fontSize: "1.75rem", fontWeight: ${tk.headingWeight}, color: "${tk.textHeading}", marginBottom: "48px", fontFamily: ${JSON.stringify(tk.headingFontFamily)} }}>Frequently asked questions</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {faqs.map((faq, i) => (
              <div key={i} style={{ background: "${tk.bgCard}", padding: "24px", borderRadius: "${tk.radius}", border: "1px solid ${tk.border}" }}>
                <h3 style={{ fontWeight: 600, color: "${tk.textHeading}", marginBottom: "8px" }}>{faq.q}</h3>
                <p style={{ color: "${tk.textMuted}", fontSize: "0.875rem", lineHeight: 1.6 }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section style={{ padding: "80px 48px", textAlign: "center" }}>
        <h2 style={{ fontSize: "1.75rem", fontWeight: ${tk.headingWeight}, color: "${tk.textHeading}", marginBottom: "16px", fontFamily: ${JSON.stringify(tk.headingFontFamily)} }}>Still have questions?</h2>
        <p style={{ color: "${tk.textMuted}", marginBottom: "32px" }}>Our team is happy to walk you through ${name} and answer anything.</p>
        <a href="#" style={{ background: "${tk.primary}", color: "${tk.primaryText}", padding: "14px 32px", borderRadius: "${tk.radius}", fontWeight: 600, textDecoration: "none", display: "inline-block" }}>Talk to Sales</a>
      </section>
    </div>
  );
}`;
}

function loginInline(input: PageInput): string {
  const tk = t(TOKENS[input.personality], input.dark_mode);
  const name = input.product_name || "Acme";

  return `export default function LoginPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "${tk.bgAlt}", fontFamily: ${JSON.stringify(tk.fontFamily)}, fontWeight: ${tk.bodyWeight}, padding: "16px" }}>
      <div style={{ width: "100%", maxWidth: "420px", background: "${tk.bgCard}", borderRadius: "${tk.radiusLg}", boxShadow: "${tk.shadowLg}", border: "1px solid ${tk.border}", padding: "40px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ width: "48px", height: "48px", background: "${tk.primary}", borderRadius: "${tk.radius}", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <span style={{ color: "${tk.primaryText}", fontWeight: 700, fontSize: "1.25rem" }}>${name.charAt(0)}</span>
          </div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: ${tk.headingWeight}, color: "${tk.textHeading}", margin: "0 0 4px", fontFamily: ${JSON.stringify(tk.headingFontFamily)} }}>Welcome back</h1>
          <p style={{ color: "${tk.textMuted}", fontSize: "0.875rem", margin: 0 }}>Sign in to your ${name} account</p>
        </div>

        {/* Social */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
          <button style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", padding: "10px", borderRadius: "${tk.radius}", border: "1px solid ${tk.border}", background: "${tk.bgCard}", color: "${tk.text}", fontWeight: 500, fontSize: "0.875rem", cursor: "pointer" }}>
            Continue with Google
          </button>
          <button style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", padding: "10px", borderRadius: "${tk.radius}", border: "1px solid ${tk.border}", background: "${tk.bgCard}", color: "${tk.text}", fontWeight: 500, fontSize: "0.875rem", cursor: "pointer" }}>
            Continue with GitHub
          </button>
        </div>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
          <div style={{ flex: 1, height: "1px", background: "${tk.border}" }} />
          <span style={{ color: "${tk.textMuted}", fontSize: "0.8125rem" }}>or</span>
          <div style={{ flex: 1, height: "1px", background: "${tk.border}" }} />
        </div>

        {/* Form */}
        <form style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "${tk.textHeading}", marginBottom: "6px" }}>Email address</label>
            <input type="email" placeholder="you@company.com" style={{ width: "100%", padding: "10px 16px", borderRadius: "${tk.radius}", border: "1px solid ${tk.inputBorder}", background: "${tk.inputBg}", color: "${tk.text}", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" }} />
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <label style={{ fontSize: "0.875rem", fontWeight: 500, color: "${tk.textHeading}" }}>Password</label>
              <a href="#" style={{ fontSize: "0.875rem", color: "${tk.primary}", textDecoration: "none" }}>Forgot password?</a>
            </div>
            <input type="password" placeholder="Enter your password" style={{ width: "100%", padding: "10px 16px", borderRadius: "${tk.radius}", border: "1px solid ${tk.inputBorder}", background: "${tk.inputBg}", color: "${tk.text}", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" }} />
          </div>
          <button type="submit" style={{ width: "100%", padding: "10px", background: "${tk.primary}", color: "${tk.primaryText}", borderRadius: "${tk.radius}", border: "none", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer" }}>
            Sign in
          </button>
        </form>

        <p style={{ textAlign: "center", color: "${tk.textMuted}", fontSize: "0.875rem", marginTop: "24px" }}>
          Don't have an account? <a href="#" style={{ color: "${tk.primary}", fontWeight: 500, textDecoration: "none" }}>Create one</a>
        </p>
      </div>
    </div>
  );
}`;
}

function settingsInline(input: PageInput): string {
  const tk = t(TOKENS[input.personality], input.dark_mode);
  const name = input.product_name || "Acme";

  return `import { useState } from "react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [marketingEmails, setMarketingEmails] = useState(true);

  const tabs = ["Profile", "Account", "Notifications", "Billing", "Integrations"];

  const Toggle = ({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) => (
    <button onClick={onToggle} style={{ position: "relative", width: "44px", height: "24px", borderRadius: "12px", border: enabled ? "none" : "1px solid ${tk.border}", background: enabled ? "${tk.primary}" : "${tk.bgAlt}", cursor: "pointer", padding: 0 }}>
      <span style={{ position: "absolute", top: "2px", left: enabled ? "20px" : "2px", width: "20px", height: "20px", background: "#fff", borderRadius: "50%", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "left 0.2s" }} />
    </button>
  );

  return (
    <div style={{ minHeight: "100vh", background: "${tk.bg}", color: "${tk.text}", fontFamily: ${JSON.stringify(tk.fontFamily)}, fontWeight: ${tk.bodyWeight} }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid ${tk.border}", background: "${tk.bgCard}", padding: "24px 48px" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: ${tk.headingWeight}, color: "${tk.textHeading}", margin: "0 0 4px", fontFamily: ${JSON.stringify(tk.headingFontFamily)} }}>Settings</h1>
        <p style={{ color: "${tk.textMuted}", fontSize: "0.875rem", margin: 0 }}>Manage your account preferences and configuration.</p>
      </div>

      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "32px 48px", display: "flex", gap: "32px" }}>
        {/* Sidebar nav */}
        <nav style={{ width: "180px", flexShrink: 0 }}>
          {tabs.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab.toLowerCase())} style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 12px", marginBottom: "4px", borderRadius: "${tk.radiusSm}", border: "none", background: activeTab === tab.toLowerCase() ? "${tk.primary}" : "transparent", color: activeTab === tab.toLowerCase() ? "${tk.primaryText}" : "${tk.textMuted}", cursor: "pointer", fontSize: "0.875rem", fontWeight: activeTab === tab.toLowerCase() ? 500 : 400 }}>
              {tab}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "32px" }}>
          {/* Avatar */}
          <section style={{ background: "${tk.bgCard}", padding: "24px", borderRadius: "${tk.radius}", border: "1px solid ${tk.border}", boxShadow: "${tk.shadow}" }}>
            <h2 style={{ fontWeight: 600, color: "${tk.textHeading}", marginBottom: "16px" }}>Profile Photo</h2>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "64px", height: "64px", background: "${tk.primary}", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "${tk.primaryText}", fontWeight: 700, fontSize: "1.25rem" }}>JD</span>
              </div>
              <div>
                <button style={{ padding: "8px 16px", borderRadius: "${tk.radius}", border: "1px solid ${tk.border}", background: "transparent", color: "${tk.text}", cursor: "pointer", fontSize: "0.875rem", fontWeight: 500 }}>Change Photo</button>
                <p style={{ color: "${tk.textMuted}", fontSize: "0.75rem", marginTop: "4px" }}>JPG, PNG, or GIF. Max 2MB.</p>
              </div>
            </div>
          </section>

          {/* Personal Info */}
          <section style={{ background: "${tk.bgCard}", padding: "24px", borderRadius: "${tk.radius}", border: "1px solid ${tk.border}", boxShadow: "${tk.shadow}" }}>
            <h2 style={{ fontWeight: 600, color: "${tk.textHeading}", marginBottom: "16px" }}>Personal Information</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "${tk.textHeading}", marginBottom: "6px" }}>First Name</label>
                <input type="text" defaultValue="Jane" style={{ width: "100%", padding: "10px 16px", borderRadius: "${tk.radius}", border: "1px solid ${tk.inputBorder}", background: "${tk.inputBg}", color: "${tk.text}", fontSize: "0.875rem", boxSizing: "border-box", outline: "none" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "${tk.textHeading}", marginBottom: "6px" }}>Last Name</label>
                <input type="text" defaultValue="Doe" style={{ width: "100%", padding: "10px 16px", borderRadius: "${tk.radius}", border: "1px solid ${tk.inputBorder}", background: "${tk.inputBg}", color: "${tk.text}", fontSize: "0.875rem", boxSizing: "border-box", outline: "none" }} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "${tk.textHeading}", marginBottom: "6px" }}>Email</label>
                <input type="email" defaultValue="jane@company.com" style={{ width: "100%", padding: "10px 16px", borderRadius: "${tk.radius}", border: "1px solid ${tk.inputBorder}", background: "${tk.inputBg}", color: "${tk.text}", fontSize: "0.875rem", boxSizing: "border-box", outline: "none" }} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "${tk.textHeading}", marginBottom: "6px" }}>Bio</label>
                <textarea rows={3} defaultValue="Product designer based in San Francisco. Previously at Stripe." style={{ width: "100%", padding: "10px 16px", borderRadius: "${tk.radius}", border: "1px solid ${tk.inputBorder}", background: "${tk.inputBg}", color: "${tk.text}", fontSize: "0.875rem", boxSizing: "border-box", outline: "none", resize: "none" }} />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
              <button style={{ padding: "8px 16px", borderRadius: "${tk.radius}", border: "1px solid ${tk.border}", background: "transparent", color: "${tk.text}", cursor: "pointer", fontSize: "0.875rem", fontWeight: 500 }}>Cancel</button>
              <button style={{ padding: "8px 16px", borderRadius: "${tk.radius}", border: "none", background: "${tk.primary}", color: "${tk.primaryText}", cursor: "pointer", fontSize: "0.875rem", fontWeight: 500 }}>Save Changes</button>
            </div>
          </section>

          {/* Notifications */}
          <section style={{ background: "${tk.bgCard}", padding: "24px", borderRadius: "${tk.radius}", border: "1px solid ${tk.border}", boxShadow: "${tk.shadow}" }}>
            <h2 style={{ fontWeight: 600, color: "${tk.textHeading}", marginBottom: "16px" }}>Notification Preferences</h2>
            {[
              { label: "Email Notifications", desc: "Receive updates about your account via email.", enabled: emailNotifications, toggle: () => setEmailNotifications(!emailNotifications) },
              { label: "Push Notifications", desc: "Get push notifications on your device.", enabled: pushNotifications, toggle: () => setPushNotifications(!pushNotifications) },
              { label: "Marketing Emails", desc: "Receive tips, product updates, and offers.", enabled: marketingEmails, toggle: () => setMarketingEmails(!marketingEmails) },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", borderTop: i > 0 ? "1px solid ${tk.border}" : "none" }}>
                <div>
                  <p style={{ fontWeight: 500, fontSize: "0.875rem", color: "${tk.textHeading}", margin: "0 0 2px" }}>{item.label}</p>
                  <p style={{ fontSize: "0.75rem", color: "${tk.textMuted}", margin: 0 }}>{item.desc}</p>
                </div>
                <Toggle enabled={item.enabled} onToggle={item.toggle} />
              </div>
            ))}
          </section>

          {/* Danger Zone */}
          <section style={{ padding: "24px", borderRadius: "${tk.radius}", border: "2px solid ${tk.dangerColor}33" }}>
            <h2 style={{ fontWeight: 600, color: "${tk.dangerColor}", marginBottom: "8px" }}>Danger Zone</h2>
            <p style={{ color: "${tk.textMuted}", fontSize: "0.875rem", marginBottom: "16px" }}>Permanently delete your account and all associated data. This action cannot be undone.</p>
            <button style={{ padding: "8px 16px", borderRadius: "${tk.radius}", border: "none", background: "${tk.dangerColor}", color: "#fff", cursor: "pointer", fontSize: "0.875rem", fontWeight: 500 }}>Delete Account</button>
          </section>
        </div>
      </div>
    </div>
  );
}`;
}

function notFoundInline(input: PageInput): string {
  const tk = t(TOKENS[input.personality], input.dark_mode);
  const isPop = input.personality === "energetic_pop";
  const isEditorial = input.personality === "elegant_editorial";
  const numberColor = isPop ? tk.primary : isEditorial ? tk.textMuted : tk.textMuted;

  return `export default function NotFoundPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "${tk.bg}", fontFamily: ${JSON.stringify(tk.fontFamily)}, fontWeight: ${tk.bodyWeight}, padding: "24px", textAlign: "center", position: "relative", overflow: "hidden" }}>
      {/* Background 404 */}
      <div aria-hidden="true" style={{ position: "absolute", fontSize: "clamp(10rem, 20vw, 14rem)", fontWeight: ${isEditorial ? "300" : "700"}, color: "${numberColor}", opacity: 0.1, lineHeight: 1, userSelect: "none" ${isEditorial ? ', fontStyle: "italic"' : ""} }}>404</div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: "420px" }}>
        <h1 style={{ fontSize: "clamp(1.75rem, 3vw, 2.25rem)", fontWeight: ${tk.headingWeight}, color: "${tk.textHeading}", marginBottom: "16px", fontFamily: ${JSON.stringify(tk.headingFontFamily)} }}>Page not found</h1>
        <p style={{ color: "${tk.textMuted}", fontSize: "1.1rem", lineHeight: 1.6, marginBottom: "32px" }}>
          We looked everywhere, but this page seems to have wandered off. Let's get you back on track.
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <a href="/" style={{ background: "${tk.primary}", color: "${tk.primaryText}", padding: "14px 32px", borderRadius: "${tk.radius}", fontWeight: 600, textDecoration: "none" }}>Back to Home</a>
          <a href="#" style={{ border: "1px solid ${tk.border}", color: "${tk.text}", padding: "14px 32px", borderRadius: "${tk.radius}", fontWeight: 600, textDecoration: "none", background: "transparent" }}>Contact Support</a>
        </div>
      </div>
    </div>
  );
}`;
}

// ---------------------------------------------------------------------------
// Framework wrappers: Vue, Svelte, HTML
// ---------------------------------------------------------------------------

function wrapVue(reactCode: string, _input: PageInput): string {
  // Convert the React JSX conceptually to a Vue SFC equivalent
  // For a real implementation we re-generate, but since the templates are large,
  // we provide a Vue scaffold and inline the core HTML from the React template
  const name = _input.product_name || "Acme";
  const tw = TW[_input.personality];
  const dk = _input.dark_mode;

  return `<script setup lang="ts">
import { ref } from "vue";

// Reactive state - adapt as needed for your page
const sidebarOpen = ref(false);
const annual = ref(false);
const productName = "${name}";
</script>

<!--
  Vue adaptation of the ${_input.page_type} page.

  This template uses the same Tailwind classes / inline styles as the React version.
  The core layout and design tokens are identical - only the framework syntax differs.

  To use: copy this into a .vue file and ensure your project has the same
  ${_input.style === "tailwind" ? "Tailwind CSS" : "CSS"} setup.

  For the full implementation, the React version below has been provided as
  the canonical reference. Convert JSX expressions to Vue template syntax:
  - {expression} -> {{ expression }}
  - className -> class
  - onClick -> @click
  - map() -> v-for
  - Conditional rendering: ternary -> v-if/v-else
-->

<!-- React reference (convert to Vue template syntax): -->
<!--
${reactCode.split("\n").map(l => l).join("\n")}
-->

<template>
  <div>
    <!-- Paste the converted template here. -->
    <!-- The React code above is your design reference - same classes, same structure. -->
    <p>Convert the React JSX above to Vue template syntax. The design tokens and classes are identical.</p>
  </div>
</template>

${_input.style === "tailwind" ? "" : `<style scoped>
/* Inline styles from the React version apply directly */
</style>`}`;
}

function wrapSvelte(reactCode: string, _input: PageInput): string {
  const name = _input.product_name || "Acme";

  return `<script lang="ts">
  // Reactive state - adapt as needed
  let sidebarOpen = false;
  let annual = false;
  const productName = "${name}";
</script>

<!--
  Svelte adaptation of the ${_input.page_type} page.

  Same Tailwind classes / inline styles as the React version.
  Convert JSX expressions to Svelte syntax:
  - {expression} stays {expression}
  - className -> class
  - onClick -> on:click
  - .map() -> {#each}{/each}
  - Conditionals: {#if}{:else}{/if}
-->

<!-- React reference: -->
<!--
${reactCode.split("\n").map(l => l).join("\n")}
-->

<div>
  <!-- Paste the converted markup here. -->
  <p>Convert the React JSX above to Svelte syntax. The design tokens and classes are identical.</p>
</div>

${_input.style === "tailwind" ? "" : `<style>
/* Inline styles from the React version apply directly */
</style>`}`;
}

function wrapHtml(reactCode: string, input: PageInput): string {
  const tk = t(TOKENS[input.personality], input.dark_mode);
  const name = input.product_name || "Acme";

  if (input.style === "tailwind") {
    return `<!DOCTYPE html>
<html lang="en"${input.dark_mode ? ' class="dark"' : ""}>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${name} - ${input.page_type.charAt(0).toUpperCase() + input.page_type.slice(1)}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  ${input.dark_mode ? `<script>tailwind.config = { darkMode: 'class' }</script>` : ""}
</head>
<body>
  <!--
    Static HTML version of the ${input.page_type} page.

    The React version below is the canonical design reference.
    Convert the JSX to static HTML:
    - Remove {expressions} and replace with actual content
    - className -> class
    - Remove .map() and write out the repeated elements
    - Remove event handlers
  -->

  <!-- React reference: -->
  <!--
${reactCode.split("\n").map(l => "  " + l).join("\n")}
  -->

  <div class="min-h-screen">
    <!-- Convert the React JSX above to static HTML with the same Tailwind classes. -->
    <p class="p-8 text-center text-gray-500">Convert the React JSX above to static HTML. Same Tailwind classes apply.</p>
  </div>
</body>
</html>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${name} - ${input.page_type.charAt(0).toUpperCase() + input.page_type.slice(1)}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: ${tk.fontFamily};
      font-weight: ${tk.bodyWeight};
      color: ${tk.text};
      background: ${tk.bg};
      min-height: 100vh;
    }
    a { color: inherit; text-decoration: none; }

    /* Responsive */
    @media (max-width: 768px) {
      .desktop-only { display: none !important; }
      .grid-responsive { grid-template-columns: 1fr !important; }
      .hero-heading { font-size: 2rem !important; }
      .section-padding { padding: 48px 24px !important; }
    }
  </style>
</head>
<body>
  <!--
    Static HTML version of the ${input.page_type} page with inline styles.

    The React version below is the canonical design reference.
    Convert inline style objects to HTML style attributes.
  -->

  <!-- React reference: -->
  <!--
${reactCode.split("\n").map(l => "  " + l).join("\n")}
  -->

  <div style="min-height: 100vh;">
    <!-- Convert the React JSX above to static HTML with inline styles. -->
    <p style="padding: 32px; text-align: center; color: ${tk.textMuted};">Convert the React JSX above to static HTML with inline styles.</p>
  </div>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Main generator dispatch
// ---------------------------------------------------------------------------

type PageGenerator = (input: PageInput) => string;

const TAILWIND_GENERATORS: Partial<Record<PageType, PageGenerator>> = {
  landing: landingTailwind,
  dashboard: dashboardTailwind,
  pricing: pricingTailwind,
  login: loginTailwind,
  settings: settingsTailwind,
  "404": notFoundTailwind,
};

const INLINE_GENERATORS: Partial<Record<PageType, PageGenerator>> = {
  landing: landingInline,
  dashboard: dashboardInline,
  pricing: pricingInline,
  login: loginInline,
  settings: settingsInline,
  "404": notFoundInline,
};

function generatePage(input: PageInput): { code: string; lang: string } {
  // 1) Get React + preferred style version as canonical
  const generators = input.style === "tailwind" ? TAILWIND_GENERATORS : INLINE_GENERATORS;
  let gen = generators[input.page_type];

  // Fallback for page types without dedicated generators (onboarding, blog)
  if (!gen) {
    // Use landing as base for blog, login as base for onboarding
    if (input.page_type === "blog") {
      gen = generators["landing"];
    } else if (input.page_type === "onboarding") {
      gen = generators["login"];
    }
  }

  if (!gen) {
    return {
      code: `// Page type "${input.page_type}" is not yet supported.\n// Supported: landing, dashboard, pricing, login, settings, 404, blog, onboarding`,
      lang: "tsx",
    };
  }

  const reactCode = gen(input);

  // 2) Wrap in target framework
  switch (input.framework) {
    case "react":
      return { code: reactCode, lang: "tsx" };
    case "vue":
      return { code: wrapVue(reactCode, input), lang: "vue" };
    case "svelte":
      return { code: wrapSvelte(reactCode, input), lang: "svelte" };
    case "html":
      return { code: wrapHtml(reactCode, input), lang: "html" };
    default:
      return { code: reactCode, lang: "tsx" };
  }
}

// ---------------------------------------------------------------------------
// Structure description per page type
// ---------------------------------------------------------------------------

const PAGE_STRUCTURE: Partial<Record<PageType, string[]>> = {
  landing: [
    "Navigation bar with logo, links, and CTA button",
    "Hero section with headline, subtitle, and dual CTAs",
    "Features grid (3 cards with icons, titles, descriptions)",
    "Testimonials section (3 customer quotes with names/roles)",
    "Final CTA section with headline and primary button",
    "Footer with 4-column link grid",
  ],
  dashboard: [
    "Collapsible sidebar with logo, navigation items (active state)",
    "Top header bar with search input, notification bell, user avatar",
    "Stats row (4 metric cards with label, value, change indicator)",
    "Two-column main area: chart placeholder (3/5) + recent activity feed (2/5)",
    "Mobile: sidebar slides in as overlay with backdrop",
  ],
  pricing: [
    "Header section with headline, subtitle, and monthly/annual toggle",
    "3 pricing tier cards (highlighted middle card with 'Most Popular' badge)",
    "Each card: name, description, price, CTA button, feature checklist",
    "FAQ section with 4 question/answer pairs",
    "Bottom CTA for sales contact",
  ],
  login: [
    "Centered card on tinted background",
    "Logo placeholder with product initial",
    "Social login buttons (Google, GitHub)",
    "Divider with 'or' label",
    "Email + password form fields",
    "Forgot password link, sign-in button, sign-up link",
  ],
  settings: [
    "Page header with title and description",
    "Sidebar tab navigation (Profile, Account, Notifications, Billing, Integrations)",
    "Profile photo section with change button",
    "Personal information form (first name, last name, email, bio)",
    "Notification toggles (email, push, marketing)",
    "Danger zone with delete account button",
    "Save/Cancel action buttons",
  ],
  "404": [
    "Full-viewport centered layout",
    "Large semi-transparent 404 number as background element",
    "Headline: 'Page not found'",
    "Friendly message paragraph",
    "Two buttons: 'Back to Home' (primary) + 'Contact Support' (secondary)",
  ],
};

// ---------------------------------------------------------------------------
// Customization hints per page type
// ---------------------------------------------------------------------------

const CUSTOMIZATION_HINTS: Partial<Record<PageType, string[]>> = {
  landing: [
    "Replace the placeholder headline and subtitle with your real value proposition",
    "Update the 3 feature cards with your actual features and SVG icons",
    "Replace testimonial quotes with real customer feedback",
    "Add your actual navigation links and footer URLs",
    "Consider adding a logo image in place of the text logo",
  ],
  dashboard: [
    "Replace the chart placeholder div with your charting library (Recharts, Chart.js, etc.)",
    "Connect the stats cards to real data via props or API calls",
    "Add more navigation items to the sidebar as needed",
    "Wire up the search input with your search implementation",
    "Add a user dropdown menu on the avatar click",
  ],
  pricing: [
    "Update plan names, prices, and features to match your actual offerings",
    "Adjust the annual discount percentage if different from 20%",
    "Add or remove pricing tiers as needed",
    "Link the CTA buttons to your actual checkout/signup flow",
    "Add more FAQ items relevant to your product",
  ],
  login: [
    "Add your actual logo as an image instead of the initial placeholder",
    "Wire up form submission to your authentication API",
    "Add or remove social login providers based on what you support",
    "Add form validation and error states",
    "Consider adding a 'Remember me' checkbox",
  ],
  settings: [
    "Wire up form state to your user profile API",
    "Add content for the other tab sections (Account, Billing, etc.)",
    "Implement the file upload for profile photo changes",
    "Add confirmation dialog for the delete account action",
    "Connect the toggles to your notification preferences API",
  ],
  "404": [
    "Add a search bar to help users find what they were looking for",
    "Consider adding popular page links below the buttons",
    "Add an illustration or animation for more visual interest",
    "Track 404 hits in your analytics to find broken links",
  ],
};

// ---------------------------------------------------------------------------
// Register tool
// ---------------------------------------------------------------------------

export function registerGeneratePage(server: McpServer): void {
  server.tool(
    "generate_page",
    "Generate a COMPLETE, production-ready page with full layout, responsive design, semantic HTML, and personality-driven design tokens. Returns a single-file component ready to paste into your project.",
    {
      page_type: z
        .enum(["landing", "dashboard", "pricing", "login", "settings", "onboarding", "blog", "404"])
        .describe("Type of page to generate"),
      framework: z
        .enum(["react", "vue", "svelte", "html"])
        .describe("Target framework"),
      style: z
        .enum(["tailwind", "inline"])
        .default("tailwind")
        .describe("Styling approach: Tailwind CSS classes or inline styles"),
      personality: z
        .enum([
          "bold_minimal",
          "warm_professional",
          "energetic_pop",
          "elegant_editorial",
          "data_dense",
          "soft_wellness",
        ])
        .default("warm_professional")
        .describe("Design personality that drives the visual look and feel"),
      product_name: z
        .string()
        .optional()
        .describe("Product/brand name to use in the page (default: 'Acme')"),
      dark_mode: z
        .boolean()
        .default(false)
        .describe("Generate dark-mode version of the page"),
      project_path: z
        .string()
        .optional()
        .describe("Absolute path to the project root. When provided, loads the saved design identity from .devsigner/context.json to override design tokens."),
    },
    async ({ page_type, framework, style, personality, product_name, dark_mode, project_path }) => {
      // ---------------------------------------------------------------
      // Load saved design identity when project_path is provided
      // ---------------------------------------------------------------
      let identityUsed = false;
      let identityProductName: string | undefined;
      let savedTokens: DesignTokens | undefined;
      let savedTw: TailwindPersonality | undefined;

      if (project_path) {
        try {
          const ctx = await loadContext(project_path);
          if (ctx.identity) {
            const identity = ctx.identity;
            identityProductName = identity.product;

            // Save originals so we can restore after generation
            savedTokens = TOKENS[personality];
            savedTw = TW[personality];

            // Override with identity-derived tokens
            TOKENS[personality] = identityToDesignTokens(identity, savedTokens);
            TW[personality] = identityToTailwindPersonality(identity, savedTw);

            identityUsed = true;
          }
        } catch {
          // If loading fails, fall through to default behavior
        }
      }

      const resolvedProductName = identityProductName ?? product_name ?? "Acme";

      const input: PageInput = {
        page_type,
        framework,
        style,
        personality,
        product_name: resolvedProductName,
        dark_mode,
      };

      let code: string;
      let lang: string;
      try {
        ({ code, lang } = generatePage(input));
      } finally {
        // Restore original tokens so future calls are unaffected
        if (savedTokens) TOKENS[personality] = savedTokens;
        if (savedTw) TW[personality] = savedTw;
      }

      const notes = PERSONALITY_NOTES[personality];
      const structure = PAGE_STRUCTURE[page_type] || [];
      const hints = CUSTOMIZATION_HINTS[page_type] || [];

      const identityNote = identityUsed
        ? `\n> **Note:** This page was generated using the saved design identity from \`${project_path}/.devsigner/context.json\`. Colors, typography, spacing, corners, and shadows reflect your project's identity.\n`
        : "";

      const lines = [
        `# Generated Page: ${page_type.charAt(0).toUpperCase() + page_type.slice(1)}`,
        ``,
        `**Framework:** ${framework} | **Style:** ${style} | **Personality:** ${notes.summary}`,
        `**Dark mode:** ${dark_mode ? "Yes" : "No"} | **Product name:** ${input.product_name}`,
        identityNote,
        `---`,
        ``,
        `## Page Structure`,
        ``,
        ...structure.map((s, i) => `${i + 1}. ${s}`),
        ``,
        `## Design Decisions (${personality.replace("_", " ")})`,
        ``,
        ...notes.decisions.map((d) => `- ${d}`),
        ``,
        `---`,
        ``,
        "```" + lang,
        code,
        "```",
        ``,
        `---`,
        ``,
        `## How to Customize`,
        ``,
        ...hints.map((h) => `- ${h}`),
        ``,
        `## Quick Start`,
        ``,
      ];

      if (framework === "react") {
        lines.push(
          `1. Save as \`${page_type === "404" ? "NotFound" : page_type.charAt(0).toUpperCase() + page_type.slice(1)}Page.tsx\``,
          `2. Import and render: \`<${page_type === "404" ? "NotFound" : page_type.charAt(0).toUpperCase() + page_type.slice(1)}Page />\``,
          style === "tailwind"
            ? `3. Ensure Tailwind CSS is configured in your project`
            : `3. No additional CSS setup needed (inline styles)`,
        );
      } else if (framework === "vue") {
        lines.push(
          `1. Save as \`${page_type === "404" ? "NotFound" : page_type.charAt(0).toUpperCase() + page_type.slice(1)}Page.vue\``,
          `2. Import in your router or parent component`,
          `3. Convert the React JSX reference comments to Vue template syntax`,
        );
      } else if (framework === "svelte") {
        lines.push(
          `1. Save as \`${page_type === "404" ? "NotFound" : page_type.charAt(0).toUpperCase() + page_type.slice(1)}Page.svelte\``,
          `2. Import in your SvelteKit route or parent component`,
          `3. Convert the React JSX reference comments to Svelte syntax`,
        );
      } else {
        lines.push(
          `1. Save as \`${page_type}.html\``,
          `2. Open directly in a browser or serve from any static host`,
          `3. Convert the React JSX reference comments to static HTML`,
        );
      }

      return {
        content: [{ type: "text" as const, text: lines.join("\n") }],
      };
    }
  );
}
