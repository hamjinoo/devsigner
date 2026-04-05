import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { loadCrawledData, type CrawledSite } from "../data/pattern-matcher.js";

// ---------------------------------------------------------------------------
// Recipe builder — extracts actionable design specs from crawled data
// ---------------------------------------------------------------------------

interface DesignRecipe {
  category: string;
  sampleSize: number;
  typography: {
    primaryFont: string;
    monoFont: string | null;
    sizeScale: string;
    headingSizes: string;
    bodySize: string;
    lineHeight: string;
    headingWeight: string;
    bodyWeight: string;
  };
  colors: {
    scheme: string;
    recommendation: string;
  };
  spacing: {
    gridBase: string;
    sectionPadding: string;
    componentGap: string;
    cardPadding: string;
  };
  components: {
    buttons: string;
    cards: string;
    corners: string;
    shadows: string;
  };
  layout: {
    maxWidth: string;
    heroStyle: string;
    navStyle: string;
  };
  referenceExamples: string[];
}

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
  return sorted[Math.floor(sorted.length / 2)];
}

function buildRecipe(sites: CrawledSite[], category: string): DesignRecipe {
  // Typography
  const skipFonts = new Set(["", "Noto Sans KR", "sans-serif", "serif", "monospace", "inherit", "system-ui", "ui-sans-serif", "-apple-system", "Arial", "Helvetica"]);
  const fontCounts = new Map<string, number>();
  const monoFonts = new Map<string, number>();

  for (const site of sites) {
    for (const f of site.typography.fonts) {
      const name = f.family.trim();
      if (skipFonts.has(name) || name.length > 40 || name.length < 2) continue;
      if (/mono|code|consolas/i.test(name)) {
        monoFonts.set(name, (monoFonts.get(name) ?? 0) + 1);
      } else {
        fontCounts.set(name, (fontCounts.get(name) ?? 0) + 1);
      }
    }
  }

  const topFont = [...fontCounts.entries()].sort(([, a], [, b]) => b - a)[0];
  const topMono = [...monoFonts.entries()].sort(([, a], [, b]) => b - a)[0];

  // Sizes
  const sizeFreq = new Map<number, number>();
  for (const site of sites) {
    for (const s of site.typography.sizes) {
      sizeFreq.set(s.px, (sizeFreq.get(s.px) ?? 0) + s.count);
    }
  }
  const topSizes = [...sizeFreq.entries()].sort(([, a], [, b]) => b - a).slice(0, 8).map(([px]) => px).sort((a, b) => a - b);
  const headingSizes = topSizes.filter(s => s >= 20);
  const bodySize = topSizes.find(s => s >= 14 && s <= 18) ?? 16;

  // Colors
  const schemes = sites.map(s => s.colors.colorScheme);
  const dominantScheme = mode(schemes) ?? "dark";

  // Get real primary colors from top sites
  const primaryColors: string[] = [];
  for (const site of sites.slice(0, 10)) {
    for (const c of site.colors.palette.slice(0, 5)) {
      const match = c.raw.match(/\d+/g);
      if (match) {
        const [r, g, b] = match.map(Number);
        if (r < 30 && g < 30 && b < 30) continue;
        if (r > 225 && g > 225 && b > 225) continue;
        const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
        if (maxDiff < 20) continue;
        primaryColors.push(c.raw);
        break;
      }
    }
  }

  // Buttons
  const buttons = sites.flatMap(s => s.components.buttons).filter(b => b.fontSize > 0 && b.padding !== "0px 0px");
  const validPaddings = buttons.map(b => b.padding).filter(p => !p.startsWith("0px"));
  const btnPadding = mode(validPaddings) ?? "10px 20px";
  const btnRadius = median(buttons.filter(b => b.borderRadius > 0 && b.borderRadius < 100).map(b => b.borderRadius));
  const btnFontSize = Math.round(median(buttons.map(b => b.fontSize)));

  // Cards
  const cards = sites.flatMap(s => s.components.cards).filter(c => c.padding > 0 && c.padding < 200);
  const cardPadding = cards.length > 0 ? Math.round(median(cards.map(c => c.padding))) : 24;
  const cardRadius = cards.length > 0 ? Math.round(median(cards.filter(c => c.borderRadius < 100).map(c => c.borderRadius))) : 12;

  // Corners & shadows
  const cornerStyle = mode(sites.map(s => s.shapes.cornerStyle)) ?? "rounded";
  const shadowStyle = mode(sites.map(s => s.shapes.shadowStyle)) ?? "subtle";

  // Layout
  const maxWidths = sites.map(s => s.layout.maxWidth).filter(w => w && w > 0 && w < 2000) as number[];
  const maxWidth = maxWidths.length > 0 ? Math.round(median(maxWidths)) : 1200;
  const hasHero = sites.filter(s => s.layout.hasHero).length;
  const hasSidebar = sites.filter(s => s.layout.hasSidebar).length;

  // Reference examples
  const examples = sites.slice(0, 5).map(s => {
    const hostname = new URL(s.url).hostname;
    const font = s.typography.fonts[0]?.family ?? "system";
    return `${hostname} (${font}, ${s.colors.colorScheme}, ${s.shapes.cornerStyle})`;
  });

  return {
    category,
    sampleSize: sites.length,
    typography: {
      primaryFont: topFont ? topFont[0] : "Inter",
      monoFont: topMono ? topMono[0] : null,
      sizeScale: topSizes.join(", ") + "px",
      headingSizes: headingSizes.length > 0 ? headingSizes.join(", ") + "px" : "24, 32, 48px",
      bodySize: bodySize + "px",
      lineHeight: "1.5-1.6 for body, 1.1-1.2 for headings",
      headingWeight: "700-800",
      bodyWeight: "400",
    },
    colors: {
      scheme: dominantScheme,
      recommendation: dominantScheme === "dark"
        ? "Dark background (#0A0A0F to #1A1A2E), light text (#E4E4E7), muted secondary (#71717A), accent with medium saturation"
        : "White/off-white background (#FFFFFF/#FAFAFA), dark text (#1A1A2E), gray secondary (#6B7280), saturated accent",
    },
    spacing: {
      gridBase: "4px (multiples: 4, 8, 12, 16, 20, 24, 32, 48, 64)",
      sectionPadding: "64-96px vertical",
      componentGap: "16-24px",
      cardPadding: cardPadding + "px",
    },
    components: {
      buttons: `padding: ${btnPadding}, font-size: ${btnFontSize}px, border-radius: ${btnRadius}px, font-weight: 500. Primary: filled with brand color. Secondary: outline/ghost.`,
      cards: `padding: ${cardPadding}px, border-radius: ${cardRadius}px, ${shadowStyle === "subtle" ? "subtle shadow (0 1px 3px rgba(0,0,0,0.1))" : "no shadow"}, border: 1px solid border color.`,
      corners: `${cornerStyle} style (avg radius: ${btnRadius}px). Buttons and cards use consistent radius.`,
      shadows: `${shadowStyle}. ${shadowStyle === "subtle" ? "Use subtle shadows for elevation (cards, dropdowns). No dramatic shadows." : "Minimal shadow usage. Rely on borders and spacing for hierarchy."}`,
    },
    layout: {
      maxWidth: maxWidth + "px",
      heroStyle: hasHero > sites.length / 2 ? "Hero section with centered heading + subtext + CTA. Full-width, 96-120px vertical padding." : "No dominant hero pattern.",
      navStyle: "Flex row: logo left, links center, CTA right. Sticky header common.",
    },
    referenceExamples: examples,
  };
}

function formatRecipe(recipe: DesignRecipe): string {
  return `# Design Recipe: ${recipe.category.toUpperCase()}
Based on ${recipe.sampleSize} real ${recipe.category} websites analyzed.

## Typography
- **Font**: ${recipe.typography.primaryFont}${recipe.typography.monoFont ? ` (mono: ${recipe.typography.monoFont})` : ""}
- **Size scale**: ${recipe.typography.sizeScale}
- **Headings**: ${recipe.typography.headingSizes}, weight ${recipe.typography.headingWeight}, line-height ${recipe.typography.lineHeight.split(",")[1]?.trim() ?? "1.2"}
- **Body**: ${recipe.typography.bodySize}, weight ${recipe.typography.bodyWeight}, line-height ${recipe.typography.lineHeight.split(",")[0]?.trim() ?? "1.6"}

## Colors
- **Scheme**: ${recipe.colors.scheme}
- ${recipe.colors.recommendation}

## Spacing
- **Grid**: ${recipe.spacing.gridBase}
- **Sections**: ${recipe.spacing.sectionPadding}
- **Components**: ${recipe.spacing.componentGap} gap
- **Card padding**: ${recipe.spacing.cardPadding}

## Components
- **Buttons**: ${recipe.components.buttons}
- **Cards**: ${recipe.components.cards}
- **Corners**: ${recipe.components.corners}
- **Shadows**: ${recipe.components.shadows}

## Layout
- **Max width**: ${recipe.layout.maxWidth}
- **Hero**: ${recipe.layout.heroStyle}
- **Nav**: ${recipe.layout.navStyle}

## Reference sites
${recipe.referenceExamples.map(e => `- ${e}`).join("\n")}

---
Use these specs when generating the UI code. Follow these patterns exactly — they come from real successful ${recipe.category} products, not theory.`;
}

// ---------------------------------------------------------------------------
// MCP Tool
// ---------------------------------------------------------------------------

export function registerDesignRecipe(server: McpServer): void {
  server.tool(
    "design_recipe",
    "Get a design recipe for a specific industry/category. Returns concrete design specs (fonts, sizes, colors, spacing, component styles) extracted from real successful websites. Use this spec when generating UI code to produce professional-quality design.",
    {
      category: z
        .enum(["saas", "fintech", "developer_tools", "ai", "ecommerce", "design_tools", "media", "education", "healthcare", "social"])
        .describe("The industry/category to get design specs for"),
      page_type: z
        .enum(["landing", "pricing", "dashboard", "blog", "auth", "settings"])
        .optional()
        .describe("Specific page type (optional, for more targeted recommendations)"),
    },
    async ({ category, page_type }) => {
      const sites = loadCrawledData().filter(s => s.category === category);

      if (sites.length === 0) {
        return {
          content: [{ type: "text" as const, text: `No data available for category: ${category}` }],
          isError: true,
        };
      }

      const recipe = buildRecipe(sites, category);
      let text = formatRecipe(recipe);

      // Add page-type specific advice
      if (page_type) {
        text += `\n\n## Page-specific: ${page_type}\n`;
        switch (page_type) {
          case "landing":
            text += "- Hero: centered, 96px top/bottom padding, heading 48-64px, subtext 18-20px\n- CTA: primary button prominent, secondary button outline\n- Features: 3-column grid, icon + heading + description per card\n- Social proof: logos or testimonials section\n- Footer: multi-column with links";
            break;
          case "pricing":
            text += "- 3-tier layout (grid, equal width)\n- Highlighted/recommended tier (scale or border accent)\n- Price: large (32-48px), period small (14px)\n- Feature list: checkmarks, consistent spacing\n- CTA per tier, primary on recommended tier only";
            break;
          case "dashboard":
            text += "- Sidebar: 240-280px, dark or surface color\n- Compact spacing (8-16px gaps)\n- Data cards: grid layout, subtle borders\n- Tables: striped or hover-highlighted rows\n- Header: breadcrumb + actions right-aligned";
            break;
          case "blog":
            text += "- Max-width: 680-720px for readability\n- Body text: 18px, line-height 1.7-1.8\n- Headings: clear hierarchy (h2: 28px, h3: 22px)\n- Code blocks: monospace, surface background\n- Author/date: subtle, top of article";
            break;
          case "auth":
            text += "- Centered card, max-width 400px\n- Clean background (single color or subtle gradient)\n- Input fields: full-width, generous padding (12-16px)\n- Primary CTA: full-width button\n- Social login: outlined buttons below";
            break;
          case "settings":
            text += "- Left sidebar nav for sections\n- Form groups with labels + inputs\n- Toggle switches for on/off settings\n- Save button: sticky bottom or top-right\n- Destructive actions: red, separated section";
            break;
        }
      }

      return {
        content: [{ type: "text" as const, text }],
      };
    },
  );
}
