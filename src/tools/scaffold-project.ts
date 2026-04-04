import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { DevsignerConfig } from "../config/project-config.js";
import { DEFAULT_CONFIG } from "../config/project-config.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Personality =
  | "bold_minimal"
  | "warm_professional"
  | "energetic_pop"
  | "elegant_editorial"
  | "data_dense"
  | "soft_wellness";

type Framework = "nextjs" | "vite-react" | "vue" | "svelte" | "html";

// ---------------------------------------------------------------------------
// Design tokens per personality (colors, typography, spacing, shapes)
// ---------------------------------------------------------------------------

interface PersonalityTokens {
  // Colors
  primary: string;
  primaryHover: string;
  primaryText: string;
  accent: string;
  bg: string;
  bgAlt: string;
  bgCard: string;
  text: string;
  textMuted: string;
  textHeading: string;
  border: string;
  success: string;
  error: string;
  warning: string;
  // Typography
  fontFamily: string;
  headingFontFamily: string;
  headingWeight: string;
  bodyWeight: string;
  // Shape
  radius: string;
  radiusSm: string;
  radiusLg: string;
  shadow: string;
  shadowLg: string;
  // Hero
  heroBg: string;
}

const PERSONALITY_TOKENS: Record<Personality, PersonalityTokens> = {
  bold_minimal: {
    primary: "#111827",
    primaryHover: "#374151",
    primaryText: "#ffffff",
    accent: "#3b82f6",
    bg: "#ffffff",
    bgAlt: "#f9fafb",
    bgCard: "#ffffff",
    text: "#111827",
    textMuted: "#6b7280",
    textHeading: "#000000",
    border: "#e5e7eb",
    success: "#10b981",
    error: "#ef4444",
    warning: "#f59e0b",
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
  },
  warm_professional: {
    primary: "#6366f1",
    primaryHover: "#4f46e5",
    primaryText: "#ffffff",
    accent: "#8b5cf6",
    bg: "#ffffff",
    bgAlt: "#f8fafc",
    bgCard: "#ffffff",
    text: "#1e293b",
    textMuted: "#64748b",
    textHeading: "#0f172a",
    border: "#e2e8f0",
    success: "#10b981",
    error: "#ef4444",
    warning: "#f59e0b",
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
  },
  energetic_pop: {
    primary: "#8b5cf6",
    primaryHover: "#7c3aed",
    primaryText: "#ffffff",
    accent: "#f59e0b",
    bg: "#ffffff",
    bgAlt: "#faf5ff",
    bgCard: "#ffffff",
    text: "#1f2937",
    textMuted: "#6b7280",
    textHeading: "#111827",
    border: "#e5e7eb",
    success: "#34d399",
    error: "#f87171",
    warning: "#fbbf24",
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
  },
  elegant_editorial: {
    primary: "#292524",
    primaryHover: "#44403c",
    primaryText: "#ffffff",
    accent: "#a16207",
    bg: "#ffffff",
    bgAlt: "#fafaf9",
    bgCard: "#ffffff",
    text: "#292524",
    textMuted: "#78716c",
    textHeading: "#0c0a09",
    border: "#e7e5e4",
    success: "#16a34a",
    error: "#dc2626",
    warning: "#ca8a04",
    fontFamily: "'Source Serif 4', Georgia, 'Times New Roman', serif",
    headingFontFamily: "'Source Serif 4', Georgia, 'Times New Roman', serif",
    headingWeight: "600",
    bodyWeight: "400",
    radius: "0px",
    radiusSm: "0px",
    radiusLg: "2px",
    shadow: "none",
    shadowLg: "none",
    heroBg: "#ffffff",
  },
  data_dense: {
    primary: "#2563eb",
    primaryHover: "#1d4ed8",
    primaryText: "#ffffff",
    accent: "#2563eb",
    bg: "#ffffff",
    bgAlt: "#f9fafb",
    bgCard: "#ffffff",
    text: "#111827",
    textMuted: "#6b7280",
    textHeading: "#111827",
    border: "#e5e7eb",
    success: "#16a34a",
    error: "#dc2626",
    warning: "#d97706",
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
  },
  soft_wellness: {
    primary: "#e879a8",
    primaryHover: "#db2777",
    primaryText: "#ffffff",
    accent: "#a78bfa",
    bg: "#fefcfb",
    bgAlt: "#fdf2f8",
    bgCard: "#ffffff",
    text: "#44403c",
    textMuted: "#78716c",
    textHeading: "#292524",
    border: "#fce7f3",
    success: "#34d399",
    error: "#f87171",
    warning: "#fbbf24",
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
  },
};

const PERSONALITY_LABELS: Record<Personality, string> = {
  bold_minimal: "Bold Minimal",
  warm_professional: "Warm Professional",
  energetic_pop: "Energetic Pop",
  elegant_editorial: "Elegant Editorial",
  data_dense: "Data Dense",
  soft_wellness: "Soft Wellness",
};

// ---------------------------------------------------------------------------
// File generators
// ---------------------------------------------------------------------------

function generateTokensCSS(tokens: PersonalityTokens): string {
  return `:root {
  /* Colors */
  --color-primary: ${tokens.primary};
  --color-primary-hover: ${tokens.primaryHover};
  --color-primary-text: ${tokens.primaryText};
  --color-accent: ${tokens.accent};
  --color-bg: ${tokens.bg};
  --color-bg-alt: ${tokens.bgAlt};
  --color-bg-card: ${tokens.bgCard};
  --color-text: ${tokens.text};
  --color-text-muted: ${tokens.textMuted};
  --color-text-heading: ${tokens.textHeading};
  --color-border: ${tokens.border};
  --color-success: ${tokens.success};
  --color-error: ${tokens.error};
  --color-warning: ${tokens.warning};

  /* Typography */
  --font-family: ${tokens.fontFamily};
  --font-heading: ${tokens.headingFontFamily};
  --font-weight-heading: ${tokens.headingWeight};
  --font-weight-body: ${tokens.bodyWeight};
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;
  --text-4xl: 2.25rem;
  --text-5xl: 3rem;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;

  /* Shape */
  --radius-sm: ${tokens.radiusSm};
  --radius-md: ${tokens.radius};
  --radius-lg: ${tokens.radiusLg};
  --radius-full: 9999px;

  /* Shadow */
  --shadow: ${tokens.shadow};
  --shadow-lg: ${tokens.shadowLg};

  /* Hero */
  --hero-bg: ${tokens.heroBg};
}
`;
}

function generateGlobalCSS(): string {
  return `/* Reset & Base Styles */
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  font-family: var(--font-family);
  font-weight: var(--font-weight-body);
  color: var(--color-text);
  background-color: var(--color-bg);
  line-height: 1.6;
  min-height: 100vh;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
  font-weight: var(--font-weight-heading);
  color: var(--color-text-heading);
  line-height: 1.2;
}

h1 { font-size: var(--text-5xl); }
h2 { font-size: var(--text-4xl); }
h3 { font-size: var(--text-3xl); }
h4 { font-size: var(--text-2xl); }
h5 { font-size: var(--text-xl); }
h6 { font-size: var(--text-lg); }

a {
  color: var(--color-primary);
  text-decoration: none;
  transition: color 0.15s ease;
}

a:hover {
  color: var(--color-primary-hover);
}

img, svg {
  display: block;
  max-width: 100%;
}

button, input, select, textarea {
  font-family: inherit;
  font-size: inherit;
}

@import './tokens.css';
`;
}

function generateDevsignerConfig(personality: Personality): DevsignerConfig {
  return {
    ...DEFAULT_CONFIG,
    personality,
    allowedColors: [
      PERSONALITY_TOKENS[personality].primary,
      PERSONALITY_TOKENS[personality].accent,
    ],
  };
}

function generateContextJSON(personality: Personality): string {
  const tokens = PERSONALITY_TOKENS[personality];
  const context = {
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    identity: {
      personality: PERSONALITY_LABELS[personality],
      signature: `Scaffolded with ${PERSONALITY_LABELS[personality]} personality`,
      product: "",
      audience: "",
      mood: "",
      boldMoves: [],
      restraints: [],
      palette: {
        primary: tokens.primary,
        accent: tokens.accent,
        background_light: tokens.bg,
        text_primary: tokens.text,
        text_secondary: tokens.textMuted,
        border: tokens.border,
        success: tokens.success,
        error: tokens.error,
        warning: tokens.warning,
      },
      typography: {
        font_heading: tokens.headingFontFamily,
        font_body: tokens.fontFamily,
        weight_heading: tokens.headingWeight,
        weight_body: tokens.bodyWeight,
      },
      spacing: {
        page_padding: "48px",
        section_gap: "56px",
        card_padding: "24px",
        element_gap: "16px",
        inline_gap: "12px",
        tight_gap: "8px",
      },
      corners: {
        sm: tokens.radiusSm,
        md: tokens.radius,
        lg: tokens.radiusLg,
        full: "9999px",
      },
      shadows: {
        sm: tokens.shadow,
        md: tokens.shadow,
        lg: tokens.shadowLg,
      },
      heroTreatment: "",
      buttonPersonality: "",
      cardStyle: "",
      motionLevel: "subtle",
    },
    reviewHistory: [],
    decisions: [
      {
        timestamp: new Date().toISOString(),
        decision: `Project scaffolded with "${PERSONALITY_LABELS[personality]}" personality`,
        reason: "scaffold_project tool",
        context: "scaffold_project",
      },
    ],
    learnedPatterns: [],
    rejectedSuggestions: [],
  };
  return JSON.stringify(context, null, 2);
}

function generateFavicon(tokens: PersonalityTokens): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="8" fill="${tokens.primary}"/>
  <text x="16" y="22" font-size="18" font-family="system-ui" font-weight="bold" fill="${tokens.primaryText}" text-anchor="middle">D</text>
</svg>`;
}

// ---------------------------------------------------------------------------
// Component generators (framework-specific)
// ---------------------------------------------------------------------------

function componentExt(fw: Framework): string {
  if (fw === "vue") return ".vue";
  if (fw === "svelte") return ".svelte";
  if (fw === "html") return ".html";
  return ".tsx"; // nextjs and vite-react
}

function generateButton(fw: Framework, _tokens: PersonalityTokens): string {
  if (fw === "vue") {
    return `<template>
  <button
    :class="['btn', variant === 'secondary' ? 'btn-secondary' : 'btn-primary', sizeClass]"
    :disabled="disabled"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
defineProps<{
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}>();

defineEmits<{
  click: [event: MouseEvent];
}>();

const sizeClass = computed(() => {
  const sizes = { sm: 'btn-sm', md: 'btn-md', lg: 'btn-lg' };
  return sizes[props.size ?? 'md'];
});
</script>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
  border-radius: var(--radius-md);
}
.btn-primary {
  background: var(--color-primary);
  color: var(--color-primary-text);
}
.btn-primary:hover { background: var(--color-primary-hover); }
.btn-secondary {
  background: transparent;
  color: var(--color-primary);
  border: 1px solid var(--color-border);
}
.btn-secondary:hover { background: var(--color-bg-alt); }
.btn-sm { padding: var(--space-1) var(--space-3); font-size: var(--text-sm); }
.btn-md { padding: var(--space-2) var(--space-4); font-size: var(--text-base); }
.btn-lg { padding: var(--space-3) var(--space-6); font-size: var(--text-lg); }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
`;
  }

  if (fw === "svelte") {
    return `<script lang="ts">
  export let variant: 'primary' | 'secondary' = 'primary';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let disabled = false;

  const sizeClass = { sm: 'btn-sm', md: 'btn-md', lg: 'btn-lg' };
</script>

<button
  class="btn {variant === 'secondary' ? 'btn-secondary' : 'btn-primary'} {sizeClass[size]}"
  {disabled}
  on:click
>
  <slot />
</button>

<style>
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    font-weight: 600;
    border: none;
    cursor: pointer;
    transition: all 0.15s ease;
    border-radius: var(--radius-md);
  }
  .btn-primary {
    background: var(--color-primary);
    color: var(--color-primary-text);
  }
  .btn-primary:hover { background: var(--color-primary-hover); }
  .btn-secondary {
    background: transparent;
    color: var(--color-primary);
    border: 1px solid var(--color-border);
  }
  .btn-secondary:hover { background: var(--color-bg-alt); }
  .btn-sm { padding: var(--space-1) var(--space-3); font-size: var(--text-sm); }
  .btn-md { padding: var(--space-2) var(--space-4); font-size: var(--text-base); }
  .btn-lg { padding: var(--space-3) var(--space-6); font-size: var(--text-lg); }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
`;
  }

  if (fw === "html") {
    return `<!-- Button Component -->
<!-- Usage: copy the .btn classes into your HTML -->
<style>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
  border-radius: var(--radius-md);
  font-family: inherit;
}
.btn-primary {
  background: var(--color-primary);
  color: var(--color-primary-text);
}
.btn-primary:hover { background: var(--color-primary-hover); }
.btn-secondary {
  background: transparent;
  color: var(--color-primary);
  border: 1px solid var(--color-border);
}
.btn-secondary:hover { background: var(--color-bg-alt); }
.btn-sm { padding: var(--space-1) var(--space-3); font-size: var(--text-sm); }
.btn-md { padding: var(--space-2) var(--space-4); font-size: var(--text-base); }
.btn-lg { padding: var(--space-3) var(--space-6); font-size: var(--text-lg); }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>

<button class="btn btn-primary btn-md">Primary Button</button>
<button class="btn btn-secondary btn-md">Secondary Button</button>
`;
  }

  // React (nextjs / vite-react)
  return `import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const sizeStyles: Record<string, React.CSSProperties> = {
  sm: { padding: 'var(--space-1) var(--space-3)', fontSize: 'var(--text-sm)' },
  md: { padding: 'var(--space-2) var(--space-4)', fontSize: 'var(--text-base)' },
  lg: { padding: 'var(--space-3) var(--space-6)', fontSize: 'var(--text-lg)' },
};

export default function Button({ variant = 'primary', size = 'md', children, style, ...props }: ButtonProps) {
  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-2)',
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    borderRadius: 'var(--radius-md)',
    fontFamily: 'inherit',
    ...sizeStyles[size],
  };

  const variants: Record<string, React.CSSProperties> = {
    primary: {
      background: 'var(--color-primary)',
      color: 'var(--color-primary-text)',
    },
    secondary: {
      background: 'transparent',
      color: 'var(--color-primary)',
      border: '1px solid var(--color-border)',
    },
  };

  return (
    <button style={{ ...base, ...variants[variant], ...style }} {...props}>
      {children}
    </button>
  );
}
`;
}

function generateCard(fw: Framework, _tokens: PersonalityTokens): string {
  if (fw === "vue") {
    return `<template>
  <div class="card" :class="{ 'card-hover': hoverable }">
    <div v-if="$slots.header" class="card-header">
      <slot name="header" />
    </div>
    <div class="card-body">
      <slot />
    </div>
    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ hoverable?: boolean }>();
</script>

<style scoped>
.card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  overflow: hidden;
}
.card-hover { transition: box-shadow 0.2s ease, transform 0.2s ease; }
.card-hover:hover { box-shadow: var(--shadow-lg); transform: translateY(-2px); }
.card-header { padding: var(--space-4) var(--space-6); border-bottom: 1px solid var(--color-border); }
.card-body { padding: var(--space-6); }
.card-footer { padding: var(--space-4) var(--space-6); border-top: 1px solid var(--color-border); background: var(--color-bg-alt); }
</style>
`;
  }

  if (fw === "svelte") {
    return `<script lang="ts">
  export let hoverable = false;
</script>

<div class="card" class:card-hover={hoverable}>
  {#if $$slots.header}
    <div class="card-header"><slot name="header" /></div>
  {/if}
  <div class="card-body"><slot /></div>
  {#if $$slots.footer}
    <div class="card-footer"><slot name="footer" /></div>
  {/if}
</div>

<style>
  .card {
    background: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow);
    overflow: hidden;
  }
  .card-hover { transition: box-shadow 0.2s ease, transform 0.2s ease; }
  .card-hover:hover { box-shadow: var(--shadow-lg); transform: translateY(-2px); }
  .card-header { padding: var(--space-4) var(--space-6); border-bottom: 1px solid var(--color-border); }
  .card-body { padding: var(--space-6); }
  .card-footer { padding: var(--space-4) var(--space-6); border-top: 1px solid var(--color-border); background: var(--color-bg-alt); }
</style>
`;
  }

  if (fw === "html") {
    return `<!-- Card Component -->
<style>
.card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  overflow: hidden;
}
.card-hover { transition: box-shadow 0.2s ease, transform 0.2s ease; }
.card-hover:hover { box-shadow: var(--shadow-lg); transform: translateY(-2px); }
.card-header { padding: var(--space-4) var(--space-6); border-bottom: 1px solid var(--color-border); }
.card-body { padding: var(--space-6); }
.card-footer { padding: var(--space-4) var(--space-6); border-top: 1px solid var(--color-border); background: var(--color-bg-alt); }
</style>

<div class="card card-hover">
  <div class="card-header"><h3>Card Title</h3></div>
  <div class="card-body"><p>Card content goes here.</p></div>
  <div class="card-footer"><span>Footer</span></div>
</div>
`;
  }

  // React
  return `import React from 'react';

interface CardProps {
  hoverable?: boolean;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export default function Card({ hoverable, header, footer, children, style }: CardProps) {
  const cardStyle: React.CSSProperties = {
    background: 'var(--color-bg-card)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow)',
    overflow: 'hidden',
    transition: hoverable ? 'box-shadow 0.2s ease, transform 0.2s ease' : undefined,
    ...style,
  };

  return (
    <div style={cardStyle}>
      {header && (
        <div style={{ padding: 'var(--space-4) var(--space-6)', borderBottom: '1px solid var(--color-border)' }}>
          {header}
        </div>
      )}
      <div style={{ padding: 'var(--space-6)' }}>
        {children}
      </div>
      {footer && (
        <div style={{ padding: 'var(--space-4) var(--space-6)', borderTop: '1px solid var(--color-border)', background: 'var(--color-bg-alt)' }}>
          {footer}
        </div>
      )}
    </div>
  );
}
`;
}

function generateInput(fw: Framework, _tokens: PersonalityTokens): string {
  if (fw === "vue") {
    return `<template>
  <div class="input-group">
    <label v-if="label" class="input-label" :for="id">{{ label }}</label>
    <input
      :id="id"
      :type="type"
      :placeholder="placeholder"
      :value="modelValue"
      :disabled="disabled"
      class="input-field"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <p v-if="error" class="input-error">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  id?: string;
  label?: string;
  type?: string;
  placeholder?: string;
  modelValue?: string;
  disabled?: boolean;
  error?: string;
}>();

defineEmits<{
  'update:modelValue': [value: string];
}>();
</script>

<style scoped>
.input-group { display: flex; flex-direction: column; gap: var(--space-1); }
.input-label { font-size: var(--text-sm); font-weight: 500; color: var(--color-text); }
.input-field {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  color: var(--color-text);
  background: var(--color-bg-card);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  outline: none;
}
.input-field:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 20%, transparent);
}
.input-field:disabled { opacity: 0.5; cursor: not-allowed; }
.input-error { font-size: var(--text-sm); color: var(--color-error); }
</style>
`;
  }

  if (fw === "svelte") {
    return `<script lang="ts">
  export let id = '';
  export let label = '';
  export let type = 'text';
  export let placeholder = '';
  export let value = '';
  export let disabled = false;
  export let error = '';
</script>

<div class="input-group">
  {#if label}
    <label class="input-label" for={id}>{label}</label>
  {/if}
  <input
    {id}
    {type}
    {placeholder}
    {disabled}
    bind:value
    class="input-field"
  />
  {#if error}
    <p class="input-error">{error}</p>
  {/if}
</div>

<style>
  .input-group { display: flex; flex-direction: column; gap: var(--space-1); }
  .input-label { font-size: var(--text-sm); font-weight: 500; color: var(--color-text); }
  .input-field {
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    font-size: var(--text-base);
    color: var(--color-text);
    background: var(--color-bg-card);
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
    outline: none;
  }
  .input-field:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 20%, transparent);
  }
  .input-field:disabled { opacity: 0.5; cursor: not-allowed; }
  .input-error { font-size: var(--text-sm); color: var(--color-error); }
</style>
`;
  }

  if (fw === "html") {
    return `<!-- Input Component -->
<style>
.input-group { display: flex; flex-direction: column; gap: var(--space-1); }
.input-label { font-size: var(--text-sm); font-weight: 500; color: var(--color-text); }
.input-field {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  color: var(--color-text);
  background: var(--color-bg-card);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  outline: none;
  font-family: inherit;
}
.input-field:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 20%, transparent);
}
.input-field:disabled { opacity: 0.5; cursor: not-allowed; }
.input-error { font-size: var(--text-sm); color: var(--color-error); margin: 0; }
</style>

<div class="input-group">
  <label class="input-label" for="email">Email</label>
  <input class="input-field" id="email" type="email" placeholder="you@example.com" />
</div>
`;
  }

  // React
  return `import React from 'react';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, id, style, ...props }: InputProps) {
  const fieldStyle: React.CSSProperties = {
    padding: 'var(--space-2) var(--space-3)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--text-base)',
    color: 'var(--color-text)',
    background: 'var(--color-bg-card)',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
    outline: 'none',
    width: '100%',
    fontFamily: 'inherit',
    ...style,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
      {label && (
        <label htmlFor={id} style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text)' }}>
          {label}
        </label>
      )}
      <input id={id} style={fieldStyle} {...props} />
      {error && <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-error)', margin: 0 }}>{error}</p>}
    </div>
  );
}
`;
}

function generateLayout(fw: Framework, _tokens: PersonalityTokens, projectName: string): string {
  if (fw === "vue") {
    return `<template>
  <div class="layout">
    <header class="layout-header">
      <div class="header-content">
        <a href="/" class="logo">${projectName}</a>
        <nav class="nav-links">
          <slot name="nav">
            <a href="/">Home</a>
            <a href="/dashboard">Dashboard</a>
            <a href="/settings">Settings</a>
          </slot>
        </nav>
      </div>
    </header>
    <div class="layout-body">
      <aside v-if="$slots.sidebar" class="layout-sidebar">
        <slot name="sidebar" />
      </aside>
      <main class="layout-content">
        <slot />
      </main>
    </div>
    <footer class="layout-footer">
      <p>&copy; ${new Date().getFullYear()} ${projectName}. All rights reserved.</p>
    </footer>
  </div>
</template>

<style scoped>
.layout { min-height: 100vh; display: flex; flex-direction: column; }
.layout-header {
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg);
  position: sticky;
  top: 0;
  z-index: 10;
}
.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-3) var(--space-6);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.logo { font-weight: var(--font-weight-heading); font-size: var(--text-xl); color: var(--color-text-heading); }
.nav-links { display: flex; gap: var(--space-6); }
.nav-links a { color: var(--color-text-muted); font-size: var(--text-sm); transition: color 0.15s; }
.nav-links a:hover { color: var(--color-text); }
.layout-body { display: flex; flex: 1; max-width: 1200px; margin: 0 auto; width: 100%; }
.layout-sidebar {
  width: 240px;
  flex-shrink: 0;
  border-right: 1px solid var(--color-border);
  padding: var(--space-6);
}
.layout-content { flex: 1; padding: var(--space-6); }
.layout-footer {
  border-top: 1px solid var(--color-border);
  padding: var(--space-6);
  text-align: center;
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}
</style>
`;
  }

  if (fw === "svelte") {
    return `<script lang="ts">
  export let showSidebar = false;
</script>

<div class="layout">
  <header class="layout-header">
    <div class="header-content">
      <a href="/" class="logo">${projectName}</a>
      <nav class="nav-links">
        <slot name="nav">
          <a href="/">Home</a>
          <a href="/dashboard">Dashboard</a>
          <a href="/settings">Settings</a>
        </slot>
      </nav>
    </div>
  </header>
  <div class="layout-body">
    {#if showSidebar}
      <aside class="layout-sidebar"><slot name="sidebar" /></aside>
    {/if}
    <main class="layout-content"><slot /></main>
  </div>
  <footer class="layout-footer">
    <p>&copy; ${new Date().getFullYear()} ${projectName}. All rights reserved.</p>
  </footer>
</div>

<style>
  .layout { min-height: 100vh; display: flex; flex-direction: column; }
  .layout-header {
    border-bottom: 1px solid var(--color-border);
    background: var(--color-bg);
    position: sticky;
    top: 0;
    z-index: 10;
  }
  .header-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: var(--space-3) var(--space-6);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .logo { font-weight: var(--font-weight-heading); font-size: var(--text-xl); color: var(--color-text-heading); text-decoration: none; }
  .nav-links { display: flex; gap: var(--space-6); }
  .nav-links a { color: var(--color-text-muted); font-size: var(--text-sm); text-decoration: none; transition: color 0.15s; }
  .nav-links a:hover { color: var(--color-text); }
  .layout-body { display: flex; flex: 1; max-width: 1200px; margin: 0 auto; width: 100%; }
  .layout-sidebar { width: 240px; flex-shrink: 0; border-right: 1px solid var(--color-border); padding: var(--space-6); }
  .layout-content { flex: 1; padding: var(--space-6); }
  .layout-footer {
    border-top: 1px solid var(--color-border);
    padding: var(--space-6);
    text-align: center;
    color: var(--color-text-muted);
    font-size: var(--text-sm);
  }
</style>
`;
  }

  if (fw === "html") {
    return `<!-- Layout Component -->
<style>
.layout { min-height: 100vh; display: flex; flex-direction: column; }
.layout-header {
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg);
  position: sticky;
  top: 0;
  z-index: 10;
}
.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-3) var(--space-6);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.logo { font-weight: var(--font-weight-heading); font-size: var(--text-xl); color: var(--color-text-heading); text-decoration: none; }
.nav-links { display: flex; gap: var(--space-6); }
.nav-links a { color: var(--color-text-muted); font-size: var(--text-sm); text-decoration: none; transition: color 0.15s; }
.nav-links a:hover { color: var(--color-text); }
.layout-body { display: flex; flex: 1; max-width: 1200px; margin: 0 auto; width: 100%; }
.layout-sidebar { width: 240px; flex-shrink: 0; border-right: 1px solid var(--color-border); padding: var(--space-6); }
.layout-content { flex: 1; padding: var(--space-6); }
.layout-footer {
  border-top: 1px solid var(--color-border);
  padding: var(--space-6);
  text-align: center;
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}
</style>

<div class="layout">
  <header class="layout-header">
    <div class="header-content">
      <a href="/" class="logo">${projectName}</a>
      <nav class="nav-links">
        <a href="/">Home</a>
        <a href="/dashboard">Dashboard</a>
        <a href="/settings">Settings</a>
      </nav>
    </div>
  </header>
  <div class="layout-body">
    <main class="layout-content">
      <!-- Page content goes here -->
    </main>
  </div>
  <footer class="layout-footer">
    <p>&copy; ${new Date().getFullYear()} ${projectName}. All rights reserved.</p>
  </footer>
</div>
`;
  }

  // React
  return `import React from 'react';

interface LayoutProps {
  sidebar?: React.ReactNode;
  children: React.ReactNode;
}

export default function Layout({ sidebar, children }: LayoutProps) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-bg)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: 'var(--space-3) var(--space-6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <a href="/" style={{
            fontWeight: 'var(--font-weight-heading)' as any,
            fontSize: 'var(--text-xl)',
            color: 'var(--color-text-heading)',
            textDecoration: 'none',
          }}>
            ${projectName}
          </a>
          <nav style={{ display: 'flex', gap: 'var(--space-6)' }}>
            <a href="/" style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', textDecoration: 'none' }}>Home</a>
            <a href="/dashboard" style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', textDecoration: 'none' }}>Dashboard</a>
            <a href="/settings" style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', textDecoration: 'none' }}>Settings</a>
          </nav>
        </div>
      </header>

      {/* Body */}
      <div style={{ display: 'flex', flex: 1, maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        {sidebar && (
          <aside style={{
            width: 240,
            flexShrink: 0,
            borderRight: '1px solid var(--color-border)',
            padding: 'var(--space-6)',
          }}>
            {sidebar}
          </aside>
        )}
        <main style={{ flex: 1, padding: 'var(--space-6)' }}>
          {children}
        </main>
      </div>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--color-border)',
        padding: 'var(--space-6)',
        textAlign: 'center',
        color: 'var(--color-text-muted)',
        fontSize: 'var(--text-sm)',
      }}>
        <p>&copy; ${new Date().getFullYear()} ${projectName}. All rights reserved.</p>
      </footer>
    </div>
  );
}
`;
}

// ---------------------------------------------------------------------------
// Page generators
// ---------------------------------------------------------------------------

function generatePage(
  pageType: string,
  fw: Framework,
  tokens: PersonalityTokens,
  projectName: string,
): string {
  const pn = projectName;

  switch (pageType.toLowerCase()) {
    case "landing":
      return generateLandingPage(fw, tokens, pn);
    case "dashboard":
      return generateDashboardPage(fw, tokens, pn);
    case "login":
      return generateLoginPage(fw, tokens, pn);
    case "settings":
      return generateSettingsPage(fw, tokens, pn);
    default:
      return generateGenericPage(fw, tokens, pn, pageType);
  }
}

function generateLandingPage(fw: Framework, _tokens: PersonalityTokens, name: string): string {
  if (fw === "vue") {
    return `<template>
  <div class="landing">
    <section class="hero">
      <div class="hero-content">
        <h1>Build something amazing with ${name}</h1>
        <p class="hero-subtitle">Ship faster, collaborate better, and create experiences your users will love.</p>
        <div class="hero-actions">
          <button class="btn btn-primary btn-lg">Get Started Free</button>
          <button class="btn btn-secondary btn-lg">Learn More</button>
        </div>
      </div>
    </section>

    <section class="features">
      <h2>Why ${name}?</h2>
      <div class="features-grid">
        <div class="feature-card" v-for="f in features" :key="f.title">
          <div class="feature-icon">{{ f.icon }}</div>
          <h3>{{ f.title }}</h3>
          <p>{{ f.desc }}</p>
        </div>
      </div>
    </section>

    <section class="cta">
      <h2>Ready to get started?</h2>
      <p>Join thousands of teams already using ${name}.</p>
      <button class="btn btn-primary btn-lg">Start Free Trial</button>
    </section>
  </div>
</template>

<script setup lang="ts">
const features = [
  { icon: '\\u26A1', title: 'Lightning Fast', desc: 'Sub-50ms response times globally. Your users never wait.' },
  { icon: '\\uD83D\\uDD12', title: 'Secure by Default', desc: 'SOC 2 certified with end-to-end encryption.' },
  { icon: '\\uD83D\\uDC65', title: 'Team Ready', desc: 'Real-time collaboration built in from day one.' },
];
</script>

<style scoped>
.hero { background: var(--hero-bg); padding: var(--space-20) var(--space-6); text-align: center; }
.hero-content { max-width: 800px; margin: 0 auto; }
.hero h1 { margin-bottom: var(--space-4); }
.hero-subtitle { color: var(--color-text-muted); font-size: var(--text-xl); margin-bottom: var(--space-8); }
.hero-actions { display: flex; gap: var(--space-4); justify-content: center; }
.features { padding: var(--space-20) var(--space-6); max-width: 1200px; margin: 0 auto; text-align: center; }
.features h2 { margin-bottom: var(--space-12); }
.features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--space-6); }
.feature-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  padding: var(--space-8);
  text-align: left;
}
.feature-icon { font-size: var(--text-3xl); margin-bottom: var(--space-4); }
.feature-card h3 { margin-bottom: var(--space-2); }
.feature-card p { color: var(--color-text-muted); font-size: var(--text-sm); line-height: 1.6; }
.cta { background: var(--color-bg-alt); padding: var(--space-20) var(--space-6); text-align: center; }
.cta h2 { margin-bottom: var(--space-3); }
.cta p { color: var(--color-text-muted); margin-bottom: var(--space-8); }
</style>
`;
  }

  if (fw === "svelte") {
    return `<section class="hero">
  <div class="hero-content">
    <h1>Build something amazing with ${name}</h1>
    <p class="hero-subtitle">Ship faster, collaborate better, and create experiences your users will love.</p>
    <div class="hero-actions">
      <button class="btn btn-primary btn-lg">Get Started Free</button>
      <button class="btn btn-secondary btn-lg">Learn More</button>
    </div>
  </div>
</section>

<section class="features">
  <h2>Why ${name}?</h2>
  <div class="features-grid">
    {#each [
      { icon: '\\u26A1', title: 'Lightning Fast', desc: 'Sub-50ms response times globally.' },
      { icon: '\\uD83D\\uDD12', title: 'Secure by Default', desc: 'SOC 2 certified with end-to-end encryption.' },
      { icon: '\\uD83D\\uDC65', title: 'Team Ready', desc: 'Real-time collaboration built in from day one.' },
    ] as feature}
      <div class="feature-card">
        <div class="feature-icon">{feature.icon}</div>
        <h3>{feature.title}</h3>
        <p>{feature.desc}</p>
      </div>
    {/each}
  </div>
</section>

<section class="cta">
  <h2>Ready to get started?</h2>
  <p>Join thousands of teams already using ${name}.</p>
  <button class="btn btn-primary btn-lg">Start Free Trial</button>
</section>

<style>
  .hero { background: var(--hero-bg); padding: var(--space-20) var(--space-6); text-align: center; }
  .hero-content { max-width: 800px; margin: 0 auto; }
  .hero h1 { margin-bottom: var(--space-4); }
  .hero-subtitle { color: var(--color-text-muted); font-size: var(--text-xl); margin-bottom: var(--space-8); }
  .hero-actions { display: flex; gap: var(--space-4); justify-content: center; }
  .features { padding: var(--space-20) var(--space-6); max-width: 1200px; margin: 0 auto; text-align: center; }
  .features h2 { margin-bottom: var(--space-12); }
  .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--space-6); }
  .feature-card {
    background: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow);
    padding: var(--space-8);
    text-align: left;
  }
  .feature-icon { font-size: var(--text-3xl); margin-bottom: var(--space-4); }
  .feature-card h3 { margin-bottom: var(--space-2); }
  .feature-card p { color: var(--color-text-muted); font-size: var(--text-sm); line-height: 1.6; }
  .cta { background: var(--color-bg-alt); padding: var(--space-20) var(--space-6); text-align: center; }
  .cta h2 { margin-bottom: var(--space-3); }
  .cta p { color: var(--color-text-muted); margin-bottom: var(--space-8); }
</style>
`;
  }

  if (fw === "html") {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${name} - Landing</title>
  <link rel="stylesheet" href="../styles/global.css" />
  <link rel="stylesheet" href="../styles/tokens.css" />
</head>
<body>
  <section style="background: var(--hero-bg); padding: var(--space-20) var(--space-6); text-align: center;">
    <div style="max-width: 800px; margin: 0 auto;">
      <h1>Build something amazing with ${name}</h1>
      <p style="color: var(--color-text-muted); font-size: var(--text-xl); margin: var(--space-4) 0 var(--space-8);">
        Ship faster, collaborate better, and create experiences your users will love.
      </p>
      <div style="display: flex; gap: var(--space-4); justify-content: center;">
        <button class="btn btn-primary btn-lg">Get Started Free</button>
        <button class="btn btn-secondary btn-lg">Learn More</button>
      </div>
    </div>
  </section>

  <section style="padding: var(--space-20) var(--space-6); max-width: 1200px; margin: 0 auto; text-align: center;">
    <h2 style="margin-bottom: var(--space-12);">Why ${name}?</h2>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--space-6);">
      <div class="card card-body" style="text-align: left;">
        <div style="font-size: var(--text-3xl); margin-bottom: var(--space-4);">&#9889;</div>
        <h3>Lightning Fast</h3>
        <p style="color: var(--color-text-muted); font-size: var(--text-sm);">Sub-50ms response times globally.</p>
      </div>
      <div class="card card-body" style="text-align: left;">
        <div style="font-size: var(--text-3xl); margin-bottom: var(--space-4);">&#128274;</div>
        <h3>Secure by Default</h3>
        <p style="color: var(--color-text-muted); font-size: var(--text-sm);">SOC 2 certified with end-to-end encryption.</p>
      </div>
      <div class="card card-body" style="text-align: left;">
        <div style="font-size: var(--text-3xl); margin-bottom: var(--space-4);">&#128101;</div>
        <h3>Team Ready</h3>
        <p style="color: var(--color-text-muted); font-size: var(--text-sm);">Real-time collaboration built in from day one.</p>
      </div>
    </div>
  </section>

  <section style="background: var(--color-bg-alt); padding: var(--space-20) var(--space-6); text-align: center;">
    <h2>Ready to get started?</h2>
    <p style="color: var(--color-text-muted); margin: var(--space-3) 0 var(--space-8);">Join thousands of teams already using ${name}.</p>
    <button class="btn btn-primary btn-lg">Start Free Trial</button>
  </section>
</body>
</html>
`;
  }

  // React (nextjs / vite-react)
  return `import React from 'react';
import Button from '../components/Button';
import Card from '../components/Card';

const features = [
  { icon: '\\u26A1', title: 'Lightning Fast', desc: 'Sub-50ms response times globally. Your users never wait.' },
  { icon: '\\uD83D\\uDD12', title: 'Secure by Default', desc: 'SOC 2 certified with end-to-end encryption.' },
  { icon: '\\uD83D\\uDC65', title: 'Team Ready', desc: 'Real-time collaboration built in from day one.' },
];

export default function Landing() {
  return (
    <div>
      {/* Hero */}
      <section style={{
        background: 'var(--hero-bg)',
        padding: 'var(--space-20) var(--space-6)',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h1 style={{ marginBottom: 'var(--space-4)' }}>
            Build something amazing with ${name}
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xl)', marginBottom: 'var(--space-8)' }}>
            Ship faster, collaborate better, and create experiences your users will love.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center' }}>
            <Button size="lg">Get Started Free</Button>
            <Button variant="secondary" size="lg">Learn More</Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: 'var(--space-20) var(--space-6)', maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ marginBottom: 'var(--space-12)' }}>Why ${name}?</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-6)' }}>
          {features.map((f, i) => (
            <Card key={i}>
              <div style={{ fontSize: 'var(--text-3xl)', marginBottom: 'var(--space-4)' }}>{f.icon}</div>
              <h3 style={{ marginBottom: 'var(--space-2)' }}>{f.title}</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', lineHeight: 1.6 }}>{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{
        background: 'var(--color-bg-alt)',
        padding: 'var(--space-20) var(--space-6)',
        textAlign: 'center',
      }}>
        <h2 style={{ marginBottom: 'var(--space-3)' }}>Ready to get started?</h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-8)' }}>
          Join thousands of teams already using ${name}.
        </p>
        <Button size="lg">Start Free Trial</Button>
      </section>
    </div>
  );
}
`;
}

function generateDashboardPage(fw: Framework, _tokens: PersonalityTokens, name: string): string {
  if (fw === "html") {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${name} - Dashboard</title>
  <link rel="stylesheet" href="../styles/global.css" />
  <link rel="stylesheet" href="../styles/tokens.css" />
</head>
<body>
  <div style="padding: var(--space-6); max-width: 1200px; margin: 0 auto;">
    <div style="margin-bottom: var(--space-8);">
      <h1 style="font-size: var(--text-3xl);">Dashboard</h1>
      <p style="color: var(--color-text-muted);">Welcome back! Here is your overview.</p>
    </div>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: var(--space-4); margin-bottom: var(--space-8);">
      <div class="card card-body">
        <p style="color: var(--color-text-muted); font-size: var(--text-sm);">Total Users</p>
        <p style="font-size: var(--text-3xl); font-weight: var(--font-weight-heading);">12,483</p>
        <p style="color: var(--color-success); font-size: var(--text-sm);">+12% from last month</p>
      </div>
      <div class="card card-body">
        <p style="color: var(--color-text-muted); font-size: var(--text-sm);">Revenue</p>
        <p style="font-size: var(--text-3xl); font-weight: var(--font-weight-heading);">$48,290</p>
        <p style="color: var(--color-success); font-size: var(--text-sm);">+8.2% from last month</p>
      </div>
      <div class="card card-body">
        <p style="color: var(--color-text-muted); font-size: var(--text-sm);">Active Projects</p>
        <p style="font-size: var(--text-3xl); font-weight: var(--font-weight-heading);">34</p>
        <p style="color: var(--color-text-muted); font-size: var(--text-sm);">3 due this week</p>
      </div>
      <div class="card card-body">
        <p style="color: var(--color-text-muted); font-size: var(--text-sm);">Uptime</p>
        <p style="font-size: var(--text-3xl); font-weight: var(--font-weight-heading);">99.98%</p>
        <p style="color: var(--color-success); font-size: var(--text-sm);">All systems operational</p>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><h3 style="font-size: var(--text-lg);">Recent Activity</h3></div>
      <div class="card-body">
        <p style="color: var(--color-text-muted);">No recent activity to display.</p>
      </div>
    </div>
  </div>
</body>
</html>
`;
  }

  if (fw === "vue") {
    return `<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h1>Dashboard</h1>
      <p class="subtitle">Welcome back! Here is your overview.</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card" v-for="stat in stats" :key="stat.label">
        <p class="stat-label">{{ stat.label }}</p>
        <p class="stat-value">{{ stat.value }}</p>
        <p class="stat-change" :class="stat.positive ? 'positive' : ''">{{ stat.change }}</p>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><h3>Recent Activity</h3></div>
      <div class="card-body"><p class="muted">No recent activity to display.</p></div>
    </div>
  </div>
</template>

<script setup lang="ts">
const stats = [
  { label: 'Total Users', value: '12,483', change: '+12% from last month', positive: true },
  { label: 'Revenue', value: '$48,290', change: '+8.2% from last month', positive: true },
  { label: 'Active Projects', value: '34', change: '3 due this week', positive: false },
  { label: 'Uptime', value: '99.98%', change: 'All systems operational', positive: true },
];
</script>

<style scoped>
.dashboard { padding: var(--space-6); max-width: 1200px; margin: 0 auto; }
.dashboard-header { margin-bottom: var(--space-8); }
.dashboard-header h1 { font-size: var(--text-3xl); }
.subtitle { color: var(--color-text-muted); }
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: var(--space-4); margin-bottom: var(--space-8); }
.stat-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  padding: var(--space-6);
}
.stat-label { color: var(--color-text-muted); font-size: var(--text-sm); }
.stat-value { font-size: var(--text-3xl); font-weight: var(--font-weight-heading); margin: var(--space-1) 0; }
.stat-change { font-size: var(--text-sm); color: var(--color-text-muted); }
.stat-change.positive { color: var(--color-success); }
.muted { color: var(--color-text-muted); }
</style>
`;
  }

  if (fw === "svelte") {
    return `<script lang="ts">
  const stats = [
    { label: 'Total Users', value: '12,483', change: '+12% from last month', positive: true },
    { label: 'Revenue', value: '$48,290', change: '+8.2% from last month', positive: true },
    { label: 'Active Projects', value: '34', change: '3 due this week', positive: false },
    { label: 'Uptime', value: '99.98%', change: 'All systems operational', positive: true },
  ];
</script>

<div class="dashboard">
  <div class="dashboard-header">
    <h1>Dashboard</h1>
    <p class="subtitle">Welcome back! Here is your overview.</p>
  </div>
  <div class="stats-grid">
    {#each stats as stat}
      <div class="stat-card">
        <p class="stat-label">{stat.label}</p>
        <p class="stat-value">{stat.value}</p>
        <p class="stat-change" class:positive={stat.positive}>{stat.change}</p>
      </div>
    {/each}
  </div>
  <div class="card">
    <div class="card-header"><h3>Recent Activity</h3></div>
    <div class="card-body"><p class="muted">No recent activity to display.</p></div>
  </div>
</div>

<style>
  .dashboard { padding: var(--space-6); max-width: 1200px; margin: 0 auto; }
  .dashboard-header { margin-bottom: var(--space-8); }
  .dashboard-header h1 { font-size: var(--text-3xl); }
  .subtitle { color: var(--color-text-muted); }
  .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: var(--space-4); margin-bottom: var(--space-8); }
  .stat-card {
    background: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow);
    padding: var(--space-6);
  }
  .stat-label { color: var(--color-text-muted); font-size: var(--text-sm); }
  .stat-value { font-size: var(--text-3xl); font-weight: var(--font-weight-heading); margin: var(--space-1) 0; }
  .stat-change { font-size: var(--text-sm); color: var(--color-text-muted); }
  .stat-change.positive { color: var(--color-success); }
  .muted { color: var(--color-text-muted); }
</style>
`;
  }

  // React
  return `import React from 'react';
import Card from '../components/Card';

const stats = [
  { label: 'Total Users', value: '12,483', change: '+12% from last month', positive: true },
  { label: 'Revenue', value: '$48,290', change: '+8.2% from last month', positive: true },
  { label: 'Active Projects', value: '34', change: '3 due this week', positive: false },
  { label: 'Uptime', value: '99.98%', change: 'All systems operational', positive: true },
];

export default function Dashboard() {
  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h1 style={{ fontSize: 'var(--text-3xl)' }}>Dashboard</h1>
        <p style={{ color: 'var(--color-text-muted)' }}>Welcome back! Here is your overview.</p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 'var(--space-4)',
        marginBottom: 'var(--space-8)',
      }}>
        {stats.map((stat, i) => (
          <Card key={i}>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>{stat.label}</p>
            <p style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-weight-heading)' as any, margin: 'var(--space-1) 0' }}>{stat.value}</p>
            <p style={{ color: stat.positive ? 'var(--color-success)' : 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>{stat.change}</p>
          </Card>
        ))}
      </div>

      <Card header={<h3 style={{ fontSize: 'var(--text-lg)', margin: 0 }}>Recent Activity</h3>}>
        <p style={{ color: 'var(--color-text-muted)' }}>No recent activity to display.</p>
      </Card>
    </div>
  );
}
`;
}

function generateLoginPage(fw: Framework, _tokens: PersonalityTokens, name: string): string {
  if (fw === "html") {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${name} - Sign In</title>
  <link rel="stylesheet" href="../styles/global.css" />
  <link rel="stylesheet" href="../styles/tokens.css" />
</head>
<body>
  <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--color-bg-alt); padding: var(--space-6);">
    <div class="card" style="width: 100%; max-width: 420px;">
      <div class="card-body" style="padding: var(--space-8);">
        <div style="text-align: center; margin-bottom: var(--space-8);">
          <h1 style="font-size: var(--text-2xl); margin-bottom: var(--space-2);">${name}</h1>
          <p style="color: var(--color-text-muted);">Sign in to your account</p>
        </div>
        <form style="display: flex; flex-direction: column; gap: var(--space-4);">
          <div class="input-group">
            <label class="input-label" for="email">Email</label>
            <input class="input-field" id="email" type="email" placeholder="you@example.com" />
          </div>
          <div class="input-group">
            <label class="input-label" for="password">Password</label>
            <input class="input-field" id="password" type="password" placeholder="Enter your password" />
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <label style="display: flex; align-items: center; gap: var(--space-2); font-size: var(--text-sm); color: var(--color-text-muted);">
              <input type="checkbox" /> Remember me
            </label>
            <a href="#" style="font-size: var(--text-sm);">Forgot password?</a>
          </div>
          <button class="btn btn-primary btn-lg" type="submit" style="width: 100%;">Sign In</button>
        </form>
        <p style="text-align: center; margin-top: var(--space-6); font-size: var(--text-sm); color: var(--color-text-muted);">
          Don't have an account? <a href="#">Sign up</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`;
  }

  if (fw === "vue") {
    return `<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <h1>${name}</h1>
        <p>Sign in to your account</p>
      </div>
      <form class="login-form" @submit.prevent="handleSubmit">
        <div class="input-group">
          <label class="input-label" for="email">Email</label>
          <input class="input-field" id="email" v-model="email" type="email" placeholder="you@example.com" />
        </div>
        <div class="input-group">
          <label class="input-label" for="password">Password</label>
          <input class="input-field" id="password" v-model="password" type="password" placeholder="Enter your password" />
        </div>
        <div class="login-options">
          <label class="remember"><input type="checkbox" v-model="remember" /> Remember me</label>
          <a href="#">Forgot password?</a>
        </div>
        <button class="btn btn-primary btn-lg" type="submit" style="width: 100%;">Sign In</button>
      </form>
      <p class="signup-link">Don't have an account? <a href="#">Sign up</a></p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
const email = ref('');
const password = ref('');
const remember = ref(false);
function handleSubmit() { /* TODO */ }
</script>

<style scoped>
.login-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--color-bg-alt); padding: var(--space-6); }
.login-card {
  width: 100%;
  max-width: 420px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: var(--space-8);
}
.login-header { text-align: center; margin-bottom: var(--space-8); }
.login-header h1 { font-size: var(--text-2xl); margin-bottom: var(--space-2); }
.login-header p { color: var(--color-text-muted); }
.login-form { display: flex; flex-direction: column; gap: var(--space-4); }
.login-options { display: flex; justify-content: space-between; align-items: center; }
.remember { display: flex; align-items: center; gap: var(--space-2); font-size: var(--text-sm); color: var(--color-text-muted); }
.login-options a { font-size: var(--text-sm); }
.signup-link { text-align: center; margin-top: var(--space-6); font-size: var(--text-sm); color: var(--color-text-muted); }
</style>
`;
  }

  if (fw === "svelte") {
    return `<script lang="ts">
  let email = '';
  let password = '';
  let remember = false;
  function handleSubmit() { /* TODO */ }
</script>

<div class="login-page">
  <div class="login-card">
    <div class="login-header">
      <h1>${name}</h1>
      <p>Sign in to your account</p>
    </div>
    <form class="login-form" on:submit|preventDefault={handleSubmit}>
      <div class="input-group">
        <label class="input-label" for="email">Email</label>
        <input class="input-field" id="email" bind:value={email} type="email" placeholder="you@example.com" />
      </div>
      <div class="input-group">
        <label class="input-label" for="password">Password</label>
        <input class="input-field" id="password" bind:value={password} type="password" placeholder="Enter your password" />
      </div>
      <div class="login-options">
        <label class="remember"><input type="checkbox" bind:checked={remember} /> Remember me</label>
        <a href="#">Forgot password?</a>
      </div>
      <button class="btn btn-primary btn-lg" type="submit" style="width: 100%;">Sign In</button>
    </form>
    <p class="signup-link">Don't have an account? <a href="#">Sign up</a></p>
  </div>
</div>

<style>
  .login-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--color-bg-alt); padding: var(--space-6); }
  .login-card {
    width: 100%;
    max-width: 420px;
    background: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    padding: var(--space-8);
  }
  .login-header { text-align: center; margin-bottom: var(--space-8); }
  .login-header h1 { font-size: var(--text-2xl); margin-bottom: var(--space-2); }
  .login-header p { color: var(--color-text-muted); }
  .login-form { display: flex; flex-direction: column; gap: var(--space-4); }
  .login-options { display: flex; justify-content: space-between; align-items: center; }
  .remember { display: flex; align-items: center; gap: var(--space-2); font-size: var(--text-sm); color: var(--color-text-muted); }
  .login-options a { font-size: var(--text-sm); }
  .signup-link { text-align: center; margin-top: var(--space-6); font-size: var(--text-sm); color: var(--color-text-muted); }
</style>
`;
  }

  // React
  return `import React, { useState } from 'react';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: implement login
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-bg-alt)',
      padding: 'var(--space-6)',
    }}>
      <Card style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-2)' }}>${name}</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Sign in to your account</p>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Input
            id="email"
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            id="password"
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
              <input type="checkbox" /> Remember me
            </label>
            <a href="#" style={{ fontSize: 'var(--text-sm)' }}>Forgot password?</a>
          </div>
          <Button size="lg" style={{ width: '100%' }}>Sign In</Button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 'var(--space-6)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
          Don't have an account? <a href="#">Sign up</a>
        </p>
      </Card>
    </div>
  );
}
`;
}

function generateSettingsPage(fw: Framework, _tokens: PersonalityTokens, name: string): string {
  if (fw === "html") {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${name} - Settings</title>
  <link rel="stylesheet" href="../styles/global.css" />
  <link rel="stylesheet" href="../styles/tokens.css" />
</head>
<body>
  <div style="padding: var(--space-6); max-width: 800px; margin: 0 auto;">
    <h1 style="font-size: var(--text-3xl); margin-bottom: var(--space-2);">Settings</h1>
    <p style="color: var(--color-text-muted); margin-bottom: var(--space-8);">Manage your account preferences.</p>

    <div class="card" style="margin-bottom: var(--space-6);">
      <div class="card-header"><h3>Profile</h3></div>
      <div class="card-body">
        <form style="display: flex; flex-direction: column; gap: var(--space-4); max-width: 480px;">
          <div class="input-group">
            <label class="input-label" for="name">Full Name</label>
            <input class="input-field" id="name" type="text" value="Jane Doe" />
          </div>
          <div class="input-group">
            <label class="input-label" for="s-email">Email</label>
            <input class="input-field" id="s-email" type="email" value="jane@example.com" />
          </div>
          <button class="btn btn-primary btn-md" style="align-self: flex-start;">Save Changes</button>
        </form>
      </div>
    </div>

    <div class="card" style="margin-bottom: var(--space-6);">
      <div class="card-header"><h3>Notifications</h3></div>
      <div class="card-body">
        <div style="display: flex; flex-direction: column; gap: var(--space-4);">
          <label style="display: flex; align-items: center; justify-content: space-between;">
            <span>Email notifications</span>
            <input type="checkbox" checked />
          </label>
          <label style="display: flex; align-items: center; justify-content: space-between;">
            <span>Push notifications</span>
            <input type="checkbox" />
          </label>
          <label style="display: flex; align-items: center; justify-content: space-between;">
            <span>Weekly digest</span>
            <input type="checkbox" checked />
          </label>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><h3 style="color: var(--color-error);">Danger Zone</h3></div>
      <div class="card-body">
        <p style="color: var(--color-text-muted); margin-bottom: var(--space-4);">Once you delete your account, there is no going back.</p>
        <button class="btn btn-md" style="background: var(--color-error); color: white; border: none; border-radius: var(--radius-md); padding: var(--space-2) var(--space-4); cursor: pointer;">Delete Account</button>
      </div>
    </div>
  </div>
</body>
</html>
`;
  }

  if (fw === "vue") {
    return `<template>
  <div class="settings">
    <h1>Settings</h1>
    <p class="subtitle">Manage your account preferences.</p>

    <div class="card section">
      <div class="card-header"><h3>Profile</h3></div>
      <div class="card-body">
        <form class="form" @submit.prevent>
          <div class="input-group">
            <label class="input-label" for="name">Full Name</label>
            <input class="input-field" id="name" v-model="fullName" type="text" />
          </div>
          <div class="input-group">
            <label class="input-label" for="email">Email</label>
            <input class="input-field" id="email" v-model="emailAddr" type="email" />
          </div>
          <button class="btn btn-primary btn-md">Save Changes</button>
        </form>
      </div>
    </div>

    <div class="card section">
      <div class="card-header"><h3>Notifications</h3></div>
      <div class="card-body">
        <div class="toggle-list">
          <label class="toggle-item"><span>Email notifications</span><input type="checkbox" checked /></label>
          <label class="toggle-item"><span>Push notifications</span><input type="checkbox" /></label>
          <label class="toggle-item"><span>Weekly digest</span><input type="checkbox" checked /></label>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><h3 class="danger-title">Danger Zone</h3></div>
      <div class="card-body">
        <p class="muted">Once you delete your account, there is no going back.</p>
        <button class="btn btn-danger btn-md">Delete Account</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
const fullName = ref('Jane Doe');
const emailAddr = ref('jane@example.com');
</script>

<style scoped>
.settings { padding: var(--space-6); max-width: 800px; margin: 0 auto; }
.settings h1 { font-size: var(--text-3xl); margin-bottom: var(--space-2); }
.subtitle { color: var(--color-text-muted); margin-bottom: var(--space-8); }
.section { margin-bottom: var(--space-6); }
.form { display: flex; flex-direction: column; gap: var(--space-4); max-width: 480px; }
.toggle-list { display: flex; flex-direction: column; gap: var(--space-4); }
.toggle-item { display: flex; align-items: center; justify-content: space-between; }
.danger-title { color: var(--color-error); }
.muted { color: var(--color-text-muted); margin-bottom: var(--space-4); }
.btn-danger { background: var(--color-error); color: white; border: none; border-radius: var(--radius-md); cursor: pointer; }
</style>
`;
  }

  if (fw === "svelte") {
    return `<script lang="ts">
  let fullName = 'Jane Doe';
  let emailAddr = 'jane@example.com';
</script>

<div class="settings">
  <h1>Settings</h1>
  <p class="subtitle">Manage your account preferences.</p>

  <div class="card section">
    <div class="card-header"><h3>Profile</h3></div>
    <div class="card-body">
      <form class="form" on:submit|preventDefault>
        <div class="input-group">
          <label class="input-label" for="name">Full Name</label>
          <input class="input-field" id="name" bind:value={fullName} type="text" />
        </div>
        <div class="input-group">
          <label class="input-label" for="email">Email</label>
          <input class="input-field" id="email" bind:value={emailAddr} type="email" />
        </div>
        <button class="btn btn-primary btn-md">Save Changes</button>
      </form>
    </div>
  </div>

  <div class="card section">
    <div class="card-header"><h3>Notifications</h3></div>
    <div class="card-body">
      <div class="toggle-list">
        <label class="toggle-item"><span>Email notifications</span><input type="checkbox" checked /></label>
        <label class="toggle-item"><span>Push notifications</span><input type="checkbox" /></label>
        <label class="toggle-item"><span>Weekly digest</span><input type="checkbox" checked /></label>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-header"><h3 class="danger-title">Danger Zone</h3></div>
    <div class="card-body">
      <p class="muted">Once you delete your account, there is no going back.</p>
      <button class="btn btn-danger btn-md">Delete Account</button>
    </div>
  </div>
</div>

<style>
  .settings { padding: var(--space-6); max-width: 800px; margin: 0 auto; }
  .settings h1 { font-size: var(--text-3xl); margin-bottom: var(--space-2); }
  .subtitle { color: var(--color-text-muted); margin-bottom: var(--space-8); }
  .section { margin-bottom: var(--space-6); }
  .form { display: flex; flex-direction: column; gap: var(--space-4); max-width: 480px; }
  .toggle-list { display: flex; flex-direction: column; gap: var(--space-4); }
  .toggle-item { display: flex; align-items: center; justify-content: space-between; }
  .danger-title { color: var(--color-error); }
  .muted { color: var(--color-text-muted); margin-bottom: var(--space-4); }
  .btn-danger { background: var(--color-error); color: white; border: none; border-radius: var(--radius-md); cursor: pointer; }
</style>
`;
  }

  // React
  return `import React, { useState } from 'react';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';

export default function Settings() {
  const [name, setName] = useState('Jane Doe');
  const [email, setEmail] = useState('jane@example.com');

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ fontSize: 'var(--text-3xl)', marginBottom: 'var(--space-2)' }}>Settings</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-8)' }}>Manage your account preferences.</p>

      {/* Profile */}
      <Card
        header={<h3 style={{ margin: 0 }}>Profile</h3>}
        style={{ marginBottom: 'var(--space-6)' }}
      >
        <form style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', maxWidth: 480 }}>
          <Input id="name" label="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input id="email" label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button style={{ alignSelf: 'flex-start' }}>Save Changes</Button>
        </form>
      </Card>

      {/* Notifications */}
      <Card
        header={<h3 style={{ margin: 0 }}>Notifications</h3>}
        style={{ marginBottom: 'var(--space-6)' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {['Email notifications', 'Push notifications', 'Weekly digest'].map((label, i) => (
            <label key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>{label}</span>
              <input type="checkbox" defaultChecked={i !== 1} />
            </label>
          ))}
        </div>
      </Card>

      {/* Danger Zone */}
      <Card
        header={<h3 style={{ margin: 0, color: 'var(--color-error)' }}>Danger Zone</h3>}
      >
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }}>
          Once you delete your account, there is no going back.
        </p>
        <button style={{
          background: 'var(--color-error)',
          color: 'white',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-2) var(--space-4)',
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: 'var(--text-sm)',
        }}>
          Delete Account
        </button>
      </Card>
    </div>
  );
}
`;
}

function generateGenericPage(fw: Framework, _tokens: PersonalityTokens, name: string, pageType: string): string {
  const title = pageType.charAt(0).toUpperCase() + pageType.slice(1);

  if (fw === "html") {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${name} - ${title}</title>
  <link rel="stylesheet" href="../styles/global.css" />
  <link rel="stylesheet" href="../styles/tokens.css" />
</head>
<body>
  <div style="padding: var(--space-6); max-width: 800px; margin: 0 auto;">
    <h1 style="font-size: var(--text-3xl); margin-bottom: var(--space-4);">${title}</h1>
    <p style="color: var(--color-text-muted);">This is the ${title.toLowerCase()} page for ${name}.</p>
  </div>
</body>
</html>
`;
  }

  if (fw === "vue") {
    return `<template>
  <div class="page">
    <h1>${title}</h1>
    <p class="subtitle">This is the ${title.toLowerCase()} page for ${name}.</p>
  </div>
</template>

<style scoped>
.page { padding: var(--space-6); max-width: 800px; margin: 0 auto; }
.page h1 { font-size: var(--text-3xl); margin-bottom: var(--space-4); }
.subtitle { color: var(--color-text-muted); }
</style>
`;
  }

  if (fw === "svelte") {
    return `<div class="page">
  <h1>${title}</h1>
  <p class="subtitle">This is the ${title.toLowerCase()} page for ${name}.</p>
</div>

<style>
  .page { padding: var(--space-6); max-width: 800px; margin: 0 auto; }
  .page h1 { font-size: var(--text-3xl); margin-bottom: var(--space-4); }
  .subtitle { color: var(--color-text-muted); }
</style>
`;
  }

  // React
  return `import React from 'react';

export default function ${title.replace(/[^a-zA-Z0-9]/g, '')}() {
  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ fontSize: 'var(--text-3xl)', marginBottom: 'var(--space-4)' }}>${title}</h1>
      <p style={{ color: 'var(--color-text-muted)' }}>This is the ${title.toLowerCase()} page for ${name}.</p>
    </div>
  );
}
`;
}

// ---------------------------------------------------------------------------
// Index.html generator
// ---------------------------------------------------------------------------

function generateIndexHTML(fw: Framework, projectName: string): string {
  if (fw === "html") {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${projectName}</title>
  <link rel="icon" type="image/svg+xml" href="/public/favicon.svg" />
  <link rel="stylesheet" href="/src/styles/tokens.css" />
  <link rel="stylesheet" href="/src/styles/global.css" />
</head>
<body>
  <div id="app">
    <h1>Welcome to ${projectName}</h1>
    <p>Edit the pages in <code>src/pages/</code> to get started.</p>
  </div>
</body>
</html>
`;
  }

  if (fw === "nextjs") {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${projectName}</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
</head>
<body>
  <div id="__next"></div>
</body>
</html>
`;
  }

  if (fw === "vue") {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${projectName}</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
`;
  }

  if (fw === "svelte") {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${projectName}</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
`;
  }

  // vite-react
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${projectName}</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
`;
}

// ---------------------------------------------------------------------------
// Main scaffolding logic
// ---------------------------------------------------------------------------

async function writeFileRecursive(filePath: string, content: string): Promise<void> {
  const dir = filePath.substring(0, filePath.lastIndexOf("/"));
  await mkdir(dir, { recursive: true });
  await writeFile(filePath, content, "utf-8");
}

interface ScaffoldResult {
  filesCreated: string[];
  personality: string;
  framework: Framework;
}

async function scaffoldProject(
  projectName: string,
  framework: Framework,
  personality: Personality,
  pages: string[],
  outputPath: string,
): Promise<ScaffoldResult> {
  const root = join(outputPath, projectName).replace(/\\/g, "/");
  const tokens = PERSONALITY_TOKENS[personality];
  const filesCreated: string[] = [];

  async function write(relPath: string, content: string): Promise<void> {
    const fullPath = `${root}/${relPath}`;
    await writeFileRecursive(fullPath, content);
    filesCreated.push(relPath);
  }

  // 1. .devsignerrc.json
  const config = generateDevsignerConfig(personality);
  await write(".devsignerrc.json", JSON.stringify(config, null, 2));

  // 2. .devsigner/context.json
  await write(".devsigner/context.json", generateContextJSON(personality));

  // 3. Styles
  await write("src/styles/tokens.css", generateTokensCSS(tokens));
  await write("src/styles/global.css", generateGlobalCSS());

  // 4. Components
  const ext = componentExt(framework);
  await write(`src/components/Button${ext}`, generateButton(framework, tokens));
  await write(`src/components/Card${ext}`, generateCard(framework, tokens));
  await write(`src/components/Input${ext}`, generateInput(framework, tokens));
  await write(`src/components/Layout${ext}`, generateLayout(framework, tokens, projectName));

  // 5. Pages
  for (const page of pages) {
    const pageName = page.charAt(0).toUpperCase() + page.slice(1).replace(/[^a-zA-Z0-9]/g, "");
    const pageExt = framework === "html" ? ".html" : ext;
    await write(`src/pages/${pageName}${pageExt}`, generatePage(page, framework, tokens, projectName));
  }

  // 6. Public assets
  await write("public/favicon.svg", generateFavicon(tokens));

  // 7. index.html
  await write("index.html", generateIndexHTML(framework, projectName));

  return { filesCreated, personality: PERSONALITY_LABELS[personality], framework };
}

// ---------------------------------------------------------------------------
// MCP Tool Registration
// ---------------------------------------------------------------------------

export function registerScaffoldProject(server: McpServer): void {
  server.tool(
    "scaffold_project",
    "Generate a complete project structure with design tokens, base components, and pages — all pre-styled with a design personality. Creates working files on disk ready for development.",
    {
      project_name: z
        .string()
        .describe("Name of the project (used for directory name and branding)"),
      framework: z
        .enum(["nextjs", "vite-react", "vue", "svelte", "html"])
        .describe("Target framework for generated code"),
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
        .describe("Design personality archetype to apply"),
      pages: z
        .array(z.string())
        .default(["landing", "dashboard", "login", "settings"])
        .describe("Pages to generate (e.g., ['landing', 'dashboard', 'login', 'settings'])"),
      output_path: z
        .string()
        .describe("Absolute path where the project directory will be created"),
    },
    async ({ project_name, framework, personality, pages, output_path }) => {
      try {
        const result = await scaffoldProject(
          project_name,
          framework,
          personality as Personality,
          pages,
          output_path,
        );

        const fileTree = result.filesCreated
          .map((f) => `  ${f}`)
          .join("\n");

        const summary = [
          `# Project Scaffolded Successfully`,
          ``,
          `**Project:** ${project_name}`,
          `**Framework:** ${result.framework}`,
          `**Personality:** ${result.personality}`,
          `**Location:** ${join(output_path, project_name)}`,
          ``,
          `## Files Created (${result.filesCreated.length})`,
          ``,
          "```",
          `${project_name}/`,
          fileTree,
          "```",
          ``,
          `## What's Included`,
          ``,
          `- **.devsignerrc.json** — Pre-configured design rules matching the "${result.personality}" personality`,
          `- **.devsigner/context.json** — Design identity context for continuous review`,
          `- **src/styles/tokens.css** — CSS custom properties derived from the personality's design tokens`,
          `- **src/styles/global.css** — CSS reset and base typography/layout styles`,
          `- **src/components/** — Button, Card, Input, and Layout components styled with personality tokens`,
          `- **src/pages/** — ${pages.length} page(s): ${pages.join(", ")}`,
          `- **public/favicon.svg** — Simple branded favicon`,
          `- **index.html** — Entry point for the application`,
          ``,
          `## Next Steps`,
          ``,
          `1. \`cd ${project_name}\` and set up your build tool (Vite, Next.js CLI, etc.)`,
          `2. Import \`tokens.css\` and \`global.css\` in your app entry point`,
          `3. Use \`design_review\` to check any new code against the configured personality rules`,
          `4. Use \`design_identity\` to refine the personality further`,
        ];

        return {
          content: [{ type: "text" as const, text: summary.join("\n") }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text" as const,
              text: `Error scaffolding project: ${message}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
