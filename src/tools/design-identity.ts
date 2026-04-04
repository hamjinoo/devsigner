import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { rgbToHex, hslToRgb, rgbToHsl, parseColor, generateShadeScale, type HSL } from "../utils/color-utils.js";

// --- Design Personality Archetypes ---

export interface DesignPersonality {
  name: string;
  description: string;
  keywords: string[];

  // Where to be bold vs restrained
  boldMoves: string[];
  restraints: string[];

  // Specific design decisions
  whitespaceStrategy: "generous" | "balanced" | "dense";
  colorIntensity: "muted" | "medium" | "vibrant" | "bold";
  cornerStyle: "sharp" | "subtle" | "rounded" | "pill";
  shadowStyle: "none" | "subtle" | "medium" | "dramatic";
  typographyVoice: "neutral" | "confident" | "friendly" | "elegant" | "playful";
  motionLevel: "none" | "subtle" | "moderate" | "expressive";
  contentDensity: "spacious" | "balanced" | "compact";
  heroTreatment: string;
  buttonPersonality: string;
  cardStyle: string;

  // What makes this personality distinctive
  signature: string;
}

export const PERSONALITIES: DesignPersonality[] = [
  {
    name: "Bold Minimal",
    description: "Extreme restraint with one bold punch. Like Linear or Vercel.",
    keywords: ["minimal", "clean", "linear", "vercel", "stark", "focus", "developer", "dev tool"],
    boldMoves: [
      "One oversized headline per page that demands attention",
      "Dramatic dark/light contrast — no middle ground",
      "Generous whitespace that makes content feel premium",
    ],
    restraints: [
      "Almost no color — 1 accent max, used sparingly",
      "No decorative elements, icons, or illustrations",
      "No shadows or gradients on cards",
    ],
    whitespaceStrategy: "generous",
    colorIntensity: "muted",
    cornerStyle: "subtle",
    shadowStyle: "none",
    typographyVoice: "confident",
    motionLevel: "subtle",
    contentDensity: "spacious",
    heroTreatment: "Full-width, single large headline (48-72px), short subtitle, one CTA. Nothing else.",
    buttonPersonality: "Solid fill for primary (dark bg, light text). Ghost/outline for secondary. No gradients. Small border-radius (4-6px).",
    cardStyle: "Border only (1px solid, low contrast). No shadow. Minimal internal padding. Content speaks for itself.",
    signature: "The power of emptiness — what you DON'T show is as important as what you show.",
  },
  {
    name: "Warm Professional",
    description: "Trustworthy but approachable. Like Stripe or Mercury.",
    keywords: ["professional", "trust", "stripe", "mercury", "fintech", "finance", "bank", "warm"],
    boldMoves: [
      "Rich gradient backgrounds on hero sections (not flat, not boring)",
      "Large, confident typography with generous letter-spacing",
      "Subtle color-shifting gradients on key interactive elements",
    ],
    restraints: [
      "Body text stays neutral and readable — save color for accents",
      "Cards and containers stay clean — decoration goes in backgrounds",
      "Data-dense sections use tight spacing, breathing room is for marketing pages",
    ],
    whitespaceStrategy: "balanced",
    colorIntensity: "medium",
    cornerStyle: "rounded",
    shadowStyle: "subtle",
    typographyVoice: "confident",
    motionLevel: "subtle",
    contentDensity: "balanced",
    heroTreatment: "Gradient mesh or radial gradient background. Large headline (40-56px). Benefit-focused subtitle. Two CTAs (primary gradient, secondary ghost).",
    buttonPersonality: "Primary: subtle gradient fill (not flat). Generous padding (12-16px vertical). Medium radius (8px). Hover: slight scale + shadow.",
    cardStyle: "Light background, subtle shadow (0 1px 3px rgba(0,0,0,0.08)). 12-16px radius. Comfortable padding (24-32px).",
    signature: "Feels expensive without being cold. The gradient is the handshake — warm, confident, memorable.",
  },
  {
    name: "Energetic Pop",
    description: "Bold colors, playful interactions. Like Duolingo or Discord.",
    keywords: ["playful", "fun", "game", "duolingo", "discord", "social", "kids", "creative", "colorful"],
    boldMoves: [
      "Primary color used LARGE — full-color sections, not just accents",
      "Oversized interactive elements (buttons 20-30% bigger than 'normal')",
      "Illustrations and mascots as first-class citizens, not decoration",
    ],
    restraints: [
      "Despite bold colors, text readability is sacred — always high contrast",
      "Animation has purpose — celebrates actions, doesn't distract from content",
      "Information hierarchy is strict — bold doesn't mean chaotic",
    ],
    whitespaceStrategy: "balanced",
    colorIntensity: "bold",
    cornerStyle: "pill",
    shadowStyle: "dramatic",
    typographyVoice: "playful",
    motionLevel: "expressive",
    contentDensity: "balanced",
    heroTreatment: "Full-color background (primary color, not white). Large playful headline. Illustration or mascot alongside text. Big rounded CTA.",
    buttonPersonality: "Large pill shape (full border-radius). Bold color fill. Strong hover effect (scale 1.05 + deeper shadow). Fun micro-interaction on click.",
    cardStyle: "White or light card on colored background. Large border-radius (16-20px). Pronounced shadow. Internal spacing generous.",
    signature: "Makes you smile. Design should feel like a reward, not a chore.",
  },
  {
    name: "Elegant Editorial",
    description: "Typography-driven, magazine-like. Like Notion or Medium.",
    keywords: ["editorial", "magazine", "notion", "medium", "blog", "content", "writing", "elegant", "sophisticated"],
    boldMoves: [
      "Typography IS the design — serif/sans-serif pairing creates instant sophistication",
      "Extreme font size contrast (14px body → 64px+ headlines)",
      "Strategic use of italic and light weights for emphasis",
    ],
    restraints: [
      "Minimal UI chrome — borders, shadows, and containers kept to absolute minimum",
      "Color is almost absent — black, white, and one muted accent",
      "No visual noise — every pixel of decoration must earn its place",
    ],
    whitespaceStrategy: "generous",
    colorIntensity: "muted",
    cornerStyle: "sharp",
    shadowStyle: "none",
    typographyVoice: "elegant",
    motionLevel: "none",
    contentDensity: "spacious",
    heroTreatment: "Massive serif headline (56-80px). Thin rule (1px) separator. Short description in sans-serif. Minimal or no CTA button — let the content pull them in.",
    buttonPersonality: "Underlined text links preferred over buttons. When buttons needed: ghost style, thin border, wide letter-spacing, uppercase small text.",
    cardStyle: "No card at all — content separated by whitespace and thin rules. If card needed: no border, no shadow, just background color difference.",
    signature: "The words are the interface. Everything else gets out of the way.",
  },
  {
    name: "Data Dense",
    description: "Maximum information, minimum noise. Like GitHub or Grafana dashboards.",
    keywords: ["dashboard", "data", "analytics", "github", "grafana", "admin", "table", "dense", "monitoring"],
    boldMoves: [
      "Information density is a feature — pack it in, but organize it ruthlessly",
      "Color used functionally: red=bad, green=good, blue=info, yellow=warning. No decoration.",
      "Monospace or tabular numbers for data — alignment is everything",
    ],
    restraints: [
      "Zero decorative elements — every pixel shows data or aids navigation",
      "Whitespace is tight but CONSISTENT (4px grid, no exceptions)",
      "Borders and separators are hairline (1px) — structure without weight",
    ],
    whitespaceStrategy: "dense",
    colorIntensity: "muted",
    cornerStyle: "subtle",
    shadowStyle: "none",
    typographyVoice: "neutral",
    motionLevel: "none",
    contentDensity: "compact",
    heroTreatment: "No hero. Jump straight to the dashboard/data. Page title + breadcrumb + action buttons in a compact header bar.",
    buttonPersonality: "Small, compact (8px vertical padding). Subtle fill or ghost. Icon + text preferred. No large CTAs — actions should be discoverable but not dominating.",
    cardStyle: "Thin border (1px, muted). Small radius (4px). Tight padding (12-16px). Headers are small, bold, uppercase.",
    signature: "Respect for the user's expertise. Don't waste their time with fluff — show the data.",
  },
  {
    name: "Soft Wellness",
    description: "Calming, accessible, human. Like Calm or Headspace.",
    keywords: ["health", "wellness", "calm", "headspace", "meditation", "care", "soft", "gentle", "medical", "therapy"],
    boldMoves: [
      "Rounded everything — shapes, corners, typography feel huggable",
      "Pastel/muted color palette with high lightness — feels safe and open",
      "Generous padding inside everything — nothing feels cramped or rushed",
    ],
    restraints: [
      "No sharp edges, thin lines, or high contrast — everything is soft",
      "Text stays readable but uses lighter weights (300-400 for body)",
      "No urgency — no red, no exclamation marks, no aggressive CTAs",
    ],
    whitespaceStrategy: "generous",
    colorIntensity: "muted",
    cornerStyle: "pill",
    shadowStyle: "subtle",
    typographyVoice: "friendly",
    motionLevel: "moderate",
    contentDensity: "spacious",
    heroTreatment: "Soft gradient or pastel background. Friendly, large headline (rounded sans-serif). Illustration of person/nature. Inviting CTA with rounded corners.",
    buttonPersonality: "Fully rounded (pill). Soft color fill (not saturated). Large padding (14-18px vertical). Gentle hover (slight lightening + subtle shadow).",
    cardStyle: "Soft shadow (0 4px 20px rgba(0,0,0,0.04)). Large radius (16-24px). Very generous padding (32-40px). Pastel accent borders optional.",
    signature: "Design as a deep breath. Everything says 'take your time, you're safe here.'",
  },
];

export function matchPersonality(description: string, competitors: string, mood: string): DesignPersonality {
  const combined = `${description} ${competitors} ${mood}`.toLowerCase();

  let best = PERSONALITIES[0];
  let bestScore = 0;

  for (const p of PERSONALITIES) {
    let score = 0;
    for (const kw of p.keywords) {
      if (combined.includes(kw)) score += kw.length;
    }
    if (score > bestScore) {
      bestScore = score;
      best = p;
    }
  }

  return best;
}

export function generateIdentityPalette(personality: DesignPersonality, baseHue: number): Record<string, string> {
  const satMap = { muted: 0.25, medium: 0.55, vibrant: 0.7, bold: 0.85 };
  const sat = satMap[personality.colorIntensity];

  const primary = rgbToHex(hslToRgb({ h: baseHue, s: sat, l: 0.5 }));
  const primaryLight = rgbToHex(hslToRgb({ h: baseHue, s: sat * 0.6, l: 0.95 }));
  const primaryDark = rgbToHex(hslToRgb({ h: baseHue, s: sat, l: 0.15 }));
  const accent = rgbToHex(hslToRgb({ h: (baseHue + 30) % 360, s: sat * 0.8, l: 0.5 }));

  const bgMap = {
    muted: { light: "#fafafa", dark: "#09090b" },
    medium: { light: "#ffffff", dark: "#0a0a0a" },
    vibrant: { light: "#ffffff", dark: "#0c0a09" },
    bold: { light: primaryLight, dark: primaryDark },
  };
  const bg = bgMap[personality.colorIntensity];

  return {
    primary,
    accent,
    background_light: bg.light,
    background_dark: bg.dark,
    text_primary: personality.colorIntensity === "bold" ? "#ffffff" : "#111111",
    text_secondary: "#6b7280",
    text_muted: "#9ca3af",
    border: personality.shadowStyle === "none" ? "#e5e7eb" : "#f3f4f6",
    success: "#22c55e",
    error: "#ef4444",
    warning: "#f59e0b",
  };
}

export function getTypographySystem(voice: string): Record<string, string> {
  const systems: Record<string, Record<string, string>> = {
    neutral: {
      font_heading: "Inter, Geist, system-ui, sans-serif",
      font_body: "Inter, Geist, system-ui, sans-serif",
      weight_heading: "700",
      weight_body: "400",
      heading_xxl: "48px",
      heading_xl: "36px",
      heading_lg: "28px",
      heading_md: "22px",
      body_lg: "18px",
      body_md: "16px",
      body_sm: "14px",
      caption: "12px",
      line_height_heading: "1.2",
      line_height_body: "1.6",
      letter_spacing_heading: "-0.02em",
    },
    confident: {
      font_heading: "'Inter Tight', Inter, Geist, system-ui, sans-serif",
      font_body: "Inter, Geist, system-ui, sans-serif",
      weight_heading: "800",
      weight_body: "400",
      heading_xxl: "56px",
      heading_xl: "40px",
      heading_lg: "32px",
      heading_md: "24px",
      body_lg: "18px",
      body_md: "16px",
      body_sm: "14px",
      caption: "12px",
      line_height_heading: "1.1",
      line_height_body: "1.6",
      letter_spacing_heading: "-0.03em",
    },
    friendly: {
      font_heading: "'DM Sans', 'Nunito', system-ui, sans-serif",
      font_body: "'DM Sans', 'Nunito', system-ui, sans-serif",
      weight_heading: "700",
      weight_body: "400",
      heading_xxl: "44px",
      heading_xl: "34px",
      heading_lg: "26px",
      heading_md: "20px",
      body_lg: "18px",
      body_md: "16px",
      body_sm: "14px",
      caption: "12px",
      line_height_heading: "1.3",
      line_height_body: "1.7",
      letter_spacing_heading: "-0.01em",
    },
    elegant: {
      font_heading: "'Playfair Display', Georgia, serif",
      font_body: "'Source Sans 3', system-ui, sans-serif",
      weight_heading: "600",
      weight_body: "400",
      heading_xxl: "64px",
      heading_xl: "44px",
      heading_lg: "32px",
      heading_md: "24px",
      body_lg: "18px",
      body_md: "16px",
      body_sm: "14px",
      caption: "12px",
      line_height_heading: "1.15",
      line_height_body: "1.7",
      letter_spacing_heading: "-0.01em",
    },
    playful: {
      font_heading: "'Fredoka', 'Nunito', system-ui, sans-serif",
      font_body: "'Nunito', 'DM Sans', system-ui, sans-serif",
      weight_heading: "700",
      weight_body: "400",
      heading_xxl: "52px",
      heading_xl: "38px",
      heading_lg: "28px",
      heading_md: "22px",
      body_lg: "18px",
      body_md: "16px",
      body_sm: "14px",
      caption: "13px",
      line_height_heading: "1.25",
      line_height_body: "1.65",
      letter_spacing_heading: "0",
    },
  };

  return systems[voice] || systems["neutral"];
}

export function getSpacingSystem(density: string): Record<string, string> {
  const systems: Record<string, Record<string, string>> = {
    spacious: {
      page_padding: "64px",
      section_gap: "80px",
      card_padding: "32px",
      element_gap: "24px",
      inline_gap: "16px",
      tight_gap: "8px",
    },
    balanced: {
      page_padding: "48px",
      section_gap: "56px",
      card_padding: "24px",
      element_gap: "16px",
      inline_gap: "12px",
      tight_gap: "8px",
    },
    compact: {
      page_padding: "24px",
      section_gap: "32px",
      card_padding: "16px",
      element_gap: "12px",
      inline_gap: "8px",
      tight_gap: "4px",
    },
  };
  return systems[density] || systems["balanced"];
}

export function getCornerRadius(style: string): Record<string, string> {
  const map: Record<string, Record<string, string>> = {
    sharp: { sm: "0px", md: "2px", lg: "4px", full: "4px" },
    subtle: { sm: "2px", md: "4px", lg: "6px", full: "8px" },
    rounded: { sm: "6px", md: "12px", lg: "16px", full: "20px" },
    pill: { sm: "8px", md: "12px", lg: "20px", full: "9999px" },
  };
  return map[style] || map["rounded"];
}

export function getShadowSystem(style: string): Record<string, string> {
  const map: Record<string, Record<string, string>> = {
    none: { sm: "none", md: "none", lg: "none" },
    subtle: {
      sm: "0 1px 2px rgba(0,0,0,0.04)",
      md: "0 1px 3px rgba(0,0,0,0.08)",
      lg: "0 4px 12px rgba(0,0,0,0.06)",
    },
    medium: {
      sm: "0 1px 3px rgba(0,0,0,0.08)",
      md: "0 4px 6px rgba(0,0,0,0.1)",
      lg: "0 10px 25px rgba(0,0,0,0.1)",
    },
    dramatic: {
      sm: "0 2px 8px rgba(0,0,0,0.12)",
      md: "0 8px 24px rgba(0,0,0,0.15)",
      lg: "0 20px 40px rgba(0,0,0,0.2)",
    },
  };
  return map[style] || map["subtle"];
}

const MOOD_TO_HUE: Record<string, number> = {
  trust: 220, reliable: 220, professional: 220, corporate: 220,
  calm: 200, peaceful: 200, serene: 190,
  energy: 15, bold: 350, passionate: 0, urgent: 0,
  growth: 140, nature: 140, fresh: 140, health: 160,
  creative: 280, innovative: 270, magic: 280,
  warm: 25, friendly: 35, welcoming: 30, cozy: 25,
  luxury: 45, premium: 45, gold: 45, elegant: 45,
  cool: 210, tech: 230, modern: 250, digital: 240,
  playful: 330, fun: 330, joy: 50, happy: 50,
};

export function moodToHue(mood: string): number {
  const lower = mood.toLowerCase();
  for (const [keyword, hue] of Object.entries(MOOD_TO_HUE)) {
    if (lower.includes(keyword)) return hue;
  }
  return 220; // default: professional blue
}

export function registerDesignIdentity(server: McpServer): void {
  server.tool(
    "design_identity",
    "Generate a complete design identity for your product — not just colors, but the entire design personality: where to be bold, where to restrain, typography voice, spacing strategy, component styles, and what makes YOUR product visually distinctive. This is the foundation that makes all other design decisions consistent.",
    {
      product: z.string().describe("What you're building (e.g., 'fintech dashboard for small businesses')"),
      audience: z.string().describe("Who uses it (e.g., '20-30s startup founders, tech-savvy')"),
      mood: z.string().describe("What feeling should it give (e.g., 'trustworthy but not boring, modern, warm')"),
      competitors: z
        .string()
        .default("")
        .describe("Products you admire or compete with (e.g., 'Stripe, Mercury, but warmer')"),
      base_color: z
        .string()
        .optional()
        .describe("Optional brand color to build around (hex, e.g., '#3b82f6')"),
    },
    async ({ product, audience, mood, competitors, base_color }) => {
      const personality = matchPersonality(`${product} ${audience}`, competitors, mood);

      // Determine base hue
      let baseHue: number;
      if (base_color) {
        const rgb = parseColor(base_color);
        if (rgb) {
          baseHue = rgbToHsl(rgb).h;
        } else {
          baseHue = moodToHue(mood);
        }
      } else {
        baseHue = moodToHue(mood);
      }

      const palette = generateIdentityPalette(personality, baseHue);
      const typography = getTypographySystem(personality.typographyVoice);
      const spacing = getSpacingSystem(personality.contentDensity);
      const corners = getCornerRadius(personality.cornerStyle);
      const shadows = getShadowSystem(personality.shadowStyle);

      const lines = [
        `# Design Identity: ${personality.name}`,
        ``,
        `> ${personality.signature}`,
        ``,
        `**Product:** ${product}`,
        `**Audience:** ${audience}`,
        `**Mood:** ${mood}`,
        `**Personality Archetype:** ${personality.name} — ${personality.description}`,
        ``,
        `---`,
        ``,
        `## Design Philosophy`,
        ``,
        `### Where to be BOLD`,
        ...personality.boldMoves.map((m) => `- **${m}**`),
        ``,
        `### Where to RESTRAIN`,
        ...personality.restraints.map((r) => `- ${r}`),
        ``,
        `---`,
        ``,
        `## Color System`,
        ``,
        `| Role | Value | Usage |`,
        `|------|-------|-------|`,
        `| Primary | \`${palette.primary}\` | Main brand color, CTAs, links |`,
        `| Accent | \`${palette.accent}\` | Secondary actions, highlights |`,
        `| Background (light) | \`${palette.background_light}\` | Page background |`,
        `| Background (dark) | \`${palette.background_dark}\` | Dark mode background |`,
        `| Text Primary | \`${palette.text_primary}\` | Headlines, body text |`,
        `| Text Secondary | \`${palette.text_secondary}\` | Descriptions, labels |`,
        `| Text Muted | \`${palette.text_muted}\` | Placeholders, captions |`,
        `| Border | \`${palette.border}\` | Dividers, card borders |`,
        `| Success | \`${palette.success}\` | Positive states |`,
        `| Error | \`${palette.error}\` | Error states |`,
        `| Warning | \`${palette.warning}\` | Warning states |`,
        ``,
        `**Color intensity:** ${personality.colorIntensity} — ${
          personality.colorIntensity === "muted"
            ? "color is an accent, not the star"
            : personality.colorIntensity === "bold"
              ? "color is the identity — use it large and proud"
              : "color supports the message without overwhelming"
        }`,
        ``,
        `---`,
        ``,
        `## Typography`,
        ``,
        `| Property | Value |`,
        `|----------|-------|`,
        `| Heading font | \`${typography.font_heading}\` |`,
        `| Body font | \`${typography.font_body}\` |`,
        `| Heading weight | ${typography.weight_heading} |`,
        `| Body weight | ${typography.weight_body} |`,
        `| Letter spacing (headings) | ${typography.letter_spacing_heading} |`,
        ``,
        `**Type Scale:**`,
        `| Name | Size | Usage |`,
        `|------|------|-------|`,
        `| XXL | ${typography.heading_xxl} | Hero headlines |`,
        `| XL | ${typography.heading_xl} | Page titles |`,
        `| LG | ${typography.heading_lg} | Section headings |`,
        `| MD | ${typography.heading_md} | Card titles, subheadings |`,
        `| Body LG | ${typography.body_lg} | Lead paragraphs |`,
        `| Body MD | ${typography.body_md} | Default body text |`,
        `| Body SM | ${typography.body_sm} | Secondary text, labels |`,
        `| Caption | ${typography.caption} | Fine print, metadata |`,
        ``,
        `**Voice:** ${personality.typographyVoice} — ${
          personality.typographyVoice === "confident"
            ? "large, tight, heavy. Headlines command the page."
            : personality.typographyVoice === "elegant"
              ? "serif headlines, generous tracking. Content-first, magazine feel."
              : personality.typographyVoice === "playful"
                ? "rounded, bouncy. Type that makes you smile."
                : personality.typographyVoice === "friendly"
                  ? "soft, warm. Approachable without being childish."
                  : "clean and invisible. Focus on the content, not the font."
        }`,
        ``,
        `---`,
        ``,
        `## Spacing`,
        ``,
        `| Token | Value | Usage |`,
        `|-------|-------|-------|`,
        `| Page padding | ${spacing.page_padding} | Main content area padding |`,
        `| Section gap | ${spacing.section_gap} | Between major sections |`,
        `| Card padding | ${spacing.card_padding} | Inside cards/containers |`,
        `| Element gap | ${spacing.element_gap} | Between form fields, list items |`,
        `| Inline gap | ${spacing.inline_gap} | Icon + text, button groups |`,
        `| Tight gap | ${spacing.tight_gap} | Label + input, tight pairs |`,
        ``,
        `**Density:** ${personality.contentDensity} — ${
          personality.contentDensity === "spacious"
            ? "let the content breathe. Whitespace is a feature."
            : personality.contentDensity === "compact"
              ? "pack it tight. Users want information, not empty space."
              : "balanced — enough room to breathe, efficient enough to be useful."
        }`,
        ``,
        `---`,
        ``,
        `## Shape & Shadow`,
        ``,
        `**Border Radius:**`,
        `| Size | Value |`,
        `|------|-------|`,
        `| Small (badges, chips) | ${corners.sm} |`,
        `| Medium (buttons, inputs) | ${corners.md} |`,
        `| Large (cards, modals) | ${corners.lg} |`,
        `| Full (avatars, pills) | ${corners.full} |`,
        ``,
        `**Box Shadow:**`,
        `| Size | Value |`,
        `|------|-------|`,
        `| Small | \`${shadows.sm}\` |`,
        `| Medium | \`${shadows.md}\` |`,
        `| Large | \`${shadows.lg}\` |`,
        ``,
        `---`,
        ``,
        `## Component Personality`,
        ``,
        `### Hero Section`,
        personality.heroTreatment,
        ``,
        `### Buttons`,
        personality.buttonPersonality,
        ``,
        `### Cards`,
        personality.cardStyle,
        ``,
        `### Motion`,
        `Level: ${personality.motionLevel} — ${
          personality.motionLevel === "none"
            ? "No animation. Instant transitions. Speed is the feature."
            : personality.motionLevel === "subtle"
              ? "Micro-interactions only: hover states, focus rings. 150-200ms ease-out."
              : personality.motionLevel === "moderate"
                ? "Page transitions, scroll reveals, hover lifts. 200-300ms ease."
                : "Celebratory animations, playful hover effects, loading states. 300-500ms spring."
        }`,
        ``,
        `---`,
        ``,
        `## CSS Variables (Ready to Copy)`,
        ``,
        "```css",
        `:root {`,
        `  /* Colors */`,
        `  --color-primary: ${palette.primary};`,
        `  --color-accent: ${palette.accent};`,
        `  --color-bg: ${palette.background_light};`,
        `  --color-text: ${palette.text_primary};`,
        `  --color-text-secondary: ${palette.text_secondary};`,
        `  --color-text-muted: ${palette.text_muted};`,
        `  --color-border: ${palette.border};`,
        `  --color-success: ${palette.success};`,
        `  --color-error: ${palette.error};`,
        `  --color-warning: ${palette.warning};`,
        ``,
        `  /* Typography */`,
        `  --font-heading: ${typography.font_heading};`,
        `  --font-body: ${typography.font_body};`,
        `  --text-xxl: ${typography.heading_xxl};`,
        `  --text-xl: ${typography.heading_xl};`,
        `  --text-lg: ${typography.heading_lg};`,
        `  --text-md: ${typography.heading_md};`,
        `  --text-body-lg: ${typography.body_lg};`,
        `  --text-body: ${typography.body_md};`,
        `  --text-sm: ${typography.body_sm};`,
        `  --text-caption: ${typography.caption};`,
        ``,
        `  /* Spacing */`,
        `  --space-page: ${spacing.page_padding};`,
        `  --space-section: ${spacing.section_gap};`,
        `  --space-card: ${spacing.card_padding};`,
        `  --space-element: ${spacing.element_gap};`,
        `  --space-inline: ${spacing.inline_gap};`,
        `  --space-tight: ${spacing.tight_gap};`,
        ``,
        `  /* Shape */`,
        `  --radius-sm: ${corners.sm};`,
        `  --radius-md: ${corners.md};`,
        `  --radius-lg: ${corners.lg};`,
        `  --radius-full: ${corners.full};`,
        ``,
        `  /* Shadow */`,
        `  --shadow-sm: ${shadows.sm};`,
        `  --shadow-md: ${shadows.md};`,
        `  --shadow-lg: ${shadows.lg};`,
        `}`,
        "```",
        ``,
        `---`,
        ``,
        `*Use this identity as the foundation for all design decisions. When in doubt, refer back to the Design Philosophy — "${personality.signature}"*`,
      ];

      return {
        content: [{ type: "text" as const, text: lines.join("\n") }],
      };
    }
  );
}
