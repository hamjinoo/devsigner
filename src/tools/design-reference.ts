import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ColorPattern {
  palette: Record<string, string>;
  usage: string;
  darkMode?: Record<string, string>;
}

interface LayoutPattern {
  name: string;
  description: string;
  structure: string;
  css: string;
}

interface TypographyPattern {
  fontFamily: string;
  fallback: string;
  scale: Record<string, string>;
  weights: Record<string, number>;
  lineHeights: Record<string, string>;
  notes: string;
}

interface ComponentPattern {
  name: string;
  usage: string;
  specs: string;
}

interface SpacingPattern {
  density: string;
  base: number;
  scale: Record<string, string>;
  gaps: Record<string, string>;
  padding: Record<string, string>;
  notes: string;
}

interface DesignPrinciple {
  principle: string;
  explanation: string;
}

interface ProductReference {
  name: string;
  tagline: string;
  colors: ColorPattern;
  layouts: LayoutPattern[];
  typography: TypographyPattern;
  components: ComponentPattern[];
  spacing: SpacingPattern;
  principles: DesignPrinciple[];
}

interface IndustryData {
  overview: string;
  products: Record<string, ProductReference>;
  pageGuidance: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Knowledge Base
// ---------------------------------------------------------------------------

const INDUSTRIES: Record<string, IndustryData> = {
  // =========================================================================
  // FINTECH
  // =========================================================================
  fintech: {
    overview:
      "Fintech design prioritizes trust, clarity, and data density. Users need to make financial decisions quickly, so the UI must communicate numbers unambiguously. Neutral or cool color palettes convey stability; green and red carry semantic meaning (gain/loss). Avoid overly playful aesthetics — money is serious.",
    pageGuidance: {
      dashboard:
        "Lead with a summary bar (balance, net change, key KPIs). Follow with a data table or transaction list. Use cards for secondary metrics. Stripe and Mercury both use a left sidebar + main content layout. Keep the sidebar narrow (240-260px). Use monospaced or tabular-lining fonts for numbers.",
      landing:
        "Hero with a clear value prop and a single CTA. Show trust signals (backed by X, secured by Y). Wise uses illustrations to explain complex flows. Stripe uses code snippets and interactive demos. Keep above-the-fold clean — one message.",
      settings:
        "Group settings into sections with clear headings. Use a vertical tab navigation on the left (like Stripe). Each section should be independently saveable. Use destructive-action patterns (red button, confirmation modal) for account deletion or key revocation.",
      pricing:
        "Use a comparison table with 2-4 tiers. Highlight the recommended plan with a border or background shift. Stripe uses a simple grid of cards; Wise uses a calculator-style approach showing real costs. Always show pricing per-unit transparency.",
      onboarding:
        "Step-by-step wizard with a progress indicator. KYC flows should feel secure — use muted colors, lock icons. Robinhood uses a conversational, one-question-per-screen approach. Mercury uses a traditional form with inline validation.",
    },
    products: {
      stripe: {
        name: "Stripe",
        tagline: "Clean, data-dense, developer-friendly",
        colors: {
          palette: {
            primary: "#635BFF",
            primaryLight: "#7A73FF",
            primaryDark: "#4B45C6",
            background: "#FFFFFF",
            surface: "#F6F9FC",
            surfaceDark: "#F0F3F7",
            text: "#1A1F36",
            textSecondary: "#697386",
            textTertiary: "#A3ACB9",
            border: "#E3E8EE",
            success: "#30B130",
            warning: "#ED6704",
            error: "#DF1B41",
            info: "#0570DE",
          },
          usage:
            "Stripe uses a predominantly white/light gray canvas with its signature indigo (#635BFF) as the primary accent. The indigo is used sparingly — CTAs, active states, and key interactive elements. Most of the interface is neutral, letting data stand out. Success/error colors are used semantically for payment states.",
          darkMode: {
            background: "#0A2540",
            surface: "#163354",
            text: "#FFFFFF",
            textSecondary: "#ADBDCC",
            border: "#2A4A6B",
          },
        },
        layouts: [
          {
            name: "Sidebar + Content",
            description:
              "Fixed left sidebar (240px) with a scrollable main content area. The sidebar has grouped navigation with collapsible sections. Content area has a sticky header with breadcrumbs.",
            structure:
              "[Sidebar 240px] [Main Content: Header (56px sticky) + Body (padded 32px)]",
            css: `/* Stripe-style layout */
.layout { display: grid; grid-template-columns: 240px 1fr; height: 100vh; }
.sidebar { background: #F6F9FC; border-right: 1px solid #E3E8EE; padding: 16px 0; overflow-y: auto; }
.sidebar-section { padding: 8px 16px; }
.sidebar-section-title { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #697386; margin-bottom: 4px; }
.sidebar-link { display: flex; align-items: center; gap: 8px; padding: 6px 16px; font-size: 14px; color: #1A1F36; border-radius: 6px; }
.sidebar-link:hover { background: #E3E8EE; }
.sidebar-link.active { background: #635BFF; color: #FFFFFF; }
.main { overflow-y: auto; }
.main-header { position: sticky; top: 0; height: 56px; padding: 0 32px; display: flex; align-items: center; border-bottom: 1px solid #E3E8EE; background: #FFFFFF; z-index: 10; }
.main-body { padding: 32px; }`,
          },
        ],
        typography: {
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          fallback: "system-ui, sans-serif",
          scale: {
            xs: "11px",
            sm: "13px",
            base: "14px",
            md: "16px",
            lg: "20px",
            xl: "24px",
            "2xl": "28px",
            "3xl": "32px",
          },
          weights: { normal: 400, medium: 500, semibold: 600, bold: 700 },
          lineHeights: {
            tight: "1.25",
            normal: "1.5",
            relaxed: "1.6",
          },
          notes:
            "Stripe uses a system font stack at a base of 14px. Labels and metadata use 13px or 11px. Page titles are 24-28px semibold. Numbers in tables use tabular-lining figures (font-variant-numeric: tabular-nums). Body text has generous line-height (1.5-1.6).",
        },
        components: [
          { name: "Data Table", usage: "Primary data display for transactions, customers, payments", specs: "Row height: 44px. Font: 14px. Header: 13px uppercase #697386 font-weight: 600. Row hover: #F6F9FC. Borders: 1px solid #E3E8EE bottom only. Column padding: 12px 16px." },
          { name: "Metric Card", usage: "KPI display at top of dashboard", specs: "Padding: 20px 24px. Background: #FFFFFF. Border: 1px solid #E3E8EE. Border-radius: 8px. Label: 13px #697386. Value: 28px font-weight: 600 #1A1F36. Subtext: 13px color varies (green for positive, red for negative)." },
          { name: "Button (Primary)", usage: "Main CTA", specs: "Background: #635BFF. Color: #FFFFFF. Padding: 8px 16px. Border-radius: 6px. Font: 14px weight 500. Height: 36px. Hover: #7A73FF. Active: #4B45C6. Disabled: opacity 0.5." },
          { name: "Badge / Status", usage: "Payment status indicators", specs: "Padding: 2px 8px. Border-radius: 4px. Font: 12px weight: 500. Variants — Succeeded: bg #D7F7C2 text #1A6D00, Failed: bg #FDDEE4 text #A41235, Pending: bg #FDE6CC text #8A3800." },
          { name: "Search / Command Bar", usage: "Quick navigation", specs: "Height: 36px. Background: #F6F9FC. Border: 1px solid #E3E8EE. Border-radius: 6px. Padding: 0 12px. Font: 14px. Placeholder color: #A3ACB9. Focus: border-color #635BFF, box-shadow: 0 0 0 3px rgba(99,91,255,0.15)." },
        ],
        spacing: {
          density: "medium-dense",
          base: 4,
          scale: { xs: "4px", sm: "8px", md: "12px", lg: "16px", xl: "24px", "2xl": "32px", "3xl": "48px" },
          gaps: { tableRow: "0 (border-separated)", cards: "16px", sections: "32px", formFields: "16px" },
          padding: { page: "32px", card: "20px 24px", sidebarItem: "6px 16px", tableCell: "12px 16px", button: "8px 16px" },
          notes: "Stripe favors a 4px base grid. Most spacing values are multiples of 4. Content density is medium — not cramped, but efficient. Whitespace is used strategically between sections, not within data-heavy areas.",
        },
        principles: [
          { principle: "Data comes first", explanation: "The interface serves the data, not the other way around. Decorative elements are nearly absent." },
          { principle: "Progressive disclosure", explanation: "Show summary by default, reveal details on click/expand. Keeps dashboards scannable." },
          { principle: "Consistent micro-interactions", explanation: "Hover states, focus rings, and transitions (150ms ease) are uniform across all elements." },
          { principle: "Neutral canvas", explanation: "White/gray backgrounds let colored status indicators and charts pop without competition." },
        ],
      },
      wise: {
        name: "Wise (TransferWise)",
        tagline: "Friendly, accessible, transparent",
        colors: {
          palette: {
            primary: "#9FE870",
            primaryDark: "#163300",
            background: "#FFFFFF",
            surface: "#F2F5F7",
            surfaceGreen: "#E8F5D9",
            text: "#163300",
            textSecondary: "#5D7B52",
            border: "#D5DCD0",
            accent: "#2ED06E",
            navy: "#37517E",
            warning: "#FFC832",
            error: "#C0392B",
          },
          usage:
            "Wise uses a distinctive bright green (#9FE870) as its brand color, paired with a very dark green (#163300) for text. The palette feels natural and approachable. The green communicates growth and money. Surfaces are soft whites and pale greens. The brand is warm, not corporate.",
        },
        layouts: [
          {
            name: "Centered Content + Tabs",
            description:
              "Main content area is centered (max-width: 600-800px) with horizontal tab navigation at the top. Sidebar is minimal or absent on main flows.",
            structure:
              "[Top Nav (64px)] [Centered Content (max-width: 800px, padding: 24px-40px)]",
            css: `/* Wise-style centered layout */
.container { max-width: 800px; margin: 0 auto; padding: 24px 20px 40px; }
.tabs { display: flex; gap: 4px; border-bottom: 1px solid #D5DCD0; margin-bottom: 24px; }
.tab { padding: 12px 16px; font-size: 16px; font-weight: 500; color: #5D7B52; border-bottom: 2px solid transparent; }
.tab.active { color: #163300; border-bottom-color: #163300; }
.card { background: #FFFFFF; border: 1px solid #D5DCD0; border-radius: 12px; padding: 24px; }`,
          },
        ],
        typography: {
          fontFamily: "'Wise Sans', -apple-system, BlinkMacSystemFont, sans-serif",
          fallback: "system-ui, sans-serif",
          scale: { sm: "14px", base: "16px", md: "18px", lg: "24px", xl: "32px", "2xl": "40px" },
          weights: { normal: 400, medium: 500, bold: 700 },
          lineHeights: { tight: "1.3", normal: "1.5", relaxed: "1.7" },
          notes: "Wise uses larger base font size (16px) than most fintech apps, prioritizing readability. Headings are bold and large. The tone is conversational — UI copy reads like a friend explaining finance.",
        },
        components: [
          { name: "Transfer Card", usage: "Core conversion/transfer display", specs: "Padding: 24px. Background: #FFFFFF. Border: 1px solid #D5DCD0. Border-radius: 12px. Amount: 32px bold #163300. Currency label: 14px #5D7B52. Arrow/icon: 24px #9FE870." },
          { name: "Rate Display", usage: "Exchange rate and fee transparency", specs: "Font: 14px #5D7B52 for labels. Rate number: 18px bold #163300. Green highlight box: bg #E8F5D9 padding 16px border-radius 8px for 'you save' messaging." },
          { name: "Button (Primary)", usage: "Main CTA", specs: "Background: #9FE870. Color: #163300. Padding: 12px 24px. Border-radius: 12px. Font: 16px weight 700. Height: 48px. Hover: brightness(1.05). Active: brightness(0.95)." },
        ],
        spacing: {
          density: "spacious",
          base: 8,
          scale: { xs: "4px", sm: "8px", md: "16px", lg: "24px", xl: "32px", "2xl": "48px", "3xl": "64px" },
          gaps: { cards: "16px", sections: "48px", formFields: "24px" },
          padding: { page: "24px 20px to 40px 40px (responsive)", card: "24px", button: "12px 24px" },
          notes: "Wise is generous with whitespace. Sections are separated by 48-64px. This creates a calm, trustworthy feel — users never feel rushed or overwhelmed.",
        },
        principles: [
          { principle: "Radical transparency", explanation: "Every fee, rate, and cost is shown upfront. The design supports this with clear breakdowns and highlighted savings." },
          { principle: "Conversational UI", explanation: "Labels and instructions use plain language. 'You send' and 'They receive' instead of 'Debit amount' and 'Credit amount'." },
          { principle: "Accessibility first", explanation: "Large touch targets (48px+), high contrast ratios, generous spacing. Designed for global users with varying tech literacy." },
        ],
      },
      mercury: {
        name: "Mercury",
        tagline: "Minimal, professional, startup-banking",
        colors: {
          palette: {
            primary: "#4C48FF",
            primaryLight: "#6E6BFF",
            background: "#FFFFFF",
            surface: "#F7F7F8",
            text: "#121217",
            textSecondary: "#6B6F76",
            textTertiary: "#9CA0A6",
            border: "#E8E8EC",
            borderLight: "#F0F0F3",
            success: "#18A957",
            error: "#E5484D",
            warning: "#F5A623",
          },
          usage:
            "Mercury uses an extremely clean, almost monochrome palette. The primary purple-blue (#4C48FF) appears only on CTAs and key interactive elements. Everything else is shades of gray. This creates a premium, quiet feel that signals 'serious business banking'.",
        },
        layouts: [
          {
            name: "Sidebar + Clean Content",
            description:
              "Narrow sidebar (220px) with minimal navigation. Content area is generously padded with lots of whitespace. Data is presented in clean, separated sections.",
            structure:
              "[Sidebar 220px (dark: #121217)] [Main: Top bar (48px) + Content (padding: 40px)]",
            css: `/* Mercury-style layout */
.layout { display: grid; grid-template-columns: 220px 1fr; height: 100vh; }
.sidebar { background: #121217; color: #FFFFFF; padding: 24px 12px; }
.sidebar-link { display: flex; align-items: center; gap: 10px; padding: 8px 12px; color: #9CA0A6; font-size: 14px; border-radius: 6px; }
.sidebar-link:hover { background: rgba(255,255,255,0.06); color: #FFFFFF; }
.sidebar-link.active { background: rgba(255,255,255,0.1); color: #FFFFFF; }
.main-body { padding: 40px 48px; max-width: 960px; }`,
          },
        ],
        typography: {
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
          fallback: "system-ui, sans-serif",
          scale: { xs: "12px", sm: "13px", base: "14px", md: "16px", lg: "20px", xl: "24px", "2xl": "32px" },
          weights: { normal: 400, medium: 500, semibold: 600 },
          lineHeights: { tight: "1.25", normal: "1.5", relaxed: "1.6" },
          notes: "Mercury uses Inter at 14px base. Typography is understated — no heavy weights above 600. Numbers use tabular-nums for alignment in financial tables. The restrained type system lets the data speak.",
        },
        components: [
          { name: "Balance Display", usage: "Account balance hero element", specs: "Font: 40px weight 600 #121217. Sub-label: 14px #6B6F76. Container: no border, no background, just clean typography with 48px margin-bottom." },
          { name: "Transaction Row", usage: "Transaction list items", specs: "Height: 56px. Padding: 0 16px. Border-bottom: 1px solid #F0F0F3. Merchant: 14px weight 500 #121217. Date: 13px #9CA0A6. Amount: 14px weight 500, color: #121217 (debit) or #18A957 (credit). Hover: bg #F7F7F8." },
          { name: "Button (Primary)", usage: "Main CTA", specs: "Background: #4C48FF. Color: #FFFFFF. Padding: 8px 16px. Border-radius: 8px. Font: 14px weight 500. Height: 36px. Hover: #6E6BFF." },
        ],
        spacing: {
          density: "spacious",
          base: 4,
          scale: { xs: "4px", sm: "8px", md: "16px", lg: "24px", xl: "32px", "2xl": "48px", "3xl": "64px" },
          gaps: { cards: "16px", sections: "48px", formFields: "20px" },
          padding: { page: "40px 48px", card: "24px", button: "8px 16px" },
          notes: "Mercury is the most spacious fintech product. Generous padding (40px+ on pages), large gaps between sections. This whitespace is intentional — it signals premium quality and calm confidence.",
        },
        principles: [
          { principle: "Less is more", explanation: "Mercury removes anything unnecessary. No decorative elements, no heavy shadows, no gradients. Every pixel earns its place." },
          { principle: "Typography as design", explanation: "Without ornament, the type hierarchy does all the heavy lifting. Size, weight, and color create structure." },
          { principle: "Dark sidebar, light content", explanation: "The dark sidebar (#121217) anchors navigation while the white content area keeps financial data crisp and readable." },
        ],
      },
      robinhood: {
        name: "Robinhood",
        tagline: "Bold, modern, consumer-first",
        colors: {
          palette: {
            primary: "#00C805",
            primaryDark: "#00A808",
            background: "#FFFFFF",
            backgroundDark: "#1E2124",
            text: "#1E2124",
            textSecondary: "#737680",
            textOnDark: "#FFFFFF",
            border: "#E3E5E8",
            success: "#00C805",
            error: "#FF5000",
            warning: "#FFD700",
          },
          usage:
            "Robinhood uses a bold, high-contrast palette. The signature green (#00C805) is pure and saturated, conveying growth and gains. Red-orange (#FF5000) for losses. Black backgrounds for charts create drama. The overall feel is 'exciting but trustworthy'.",
        },
        layouts: [
          {
            name: "Single Column + Chart Hero",
            description:
              "No sidebar. Centered single-column layout with a large chart as the hero element. Navigation is top-bar only. Content scrolls vertically with card sections.",
            structure:
              "[Top Nav 56px] [Chart Hero (300-400px height)] [Content Cards (max-width: 680px, centered)]",
            css: `/* Robinhood-style layout */
.app { max-width: 100%; }
.navbar { height: 56px; padding: 0 24px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #E3E5E8; }
.chart-hero { height: 360px; padding: 32px 24px; background: #FFFFFF; }
.content { max-width: 680px; margin: 0 auto; padding: 24px; }
.content-card { padding: 20px 0; border-bottom: 1px solid #E3E5E8; }`,
          },
        ],
        typography: {
          fontFamily: "'Capsule Sans', -apple-system, BlinkMacSystemFont, sans-serif",
          fallback: "system-ui, sans-serif",
          scale: { sm: "13px", base: "15px", md: "18px", lg: "24px", xl: "32px", "2xl": "48px" },
          weights: { normal: 400, medium: 500, bold: 700 },
          lineHeights: { tight: "1.2", normal: "1.4", relaxed: "1.6" },
          notes: "Robinhood uses slightly larger than average type (15px base) with bold weights for portfolio values. The large portfolio balance (48px bold) is the hero element. Copy is short and action-oriented.",
        },
        components: [
          { name: "Portfolio Chart", usage: "Main stock/portfolio graph", specs: "Height: 300-400px. Line: 2px stroke, color: #00C805 (gain) or #FF5000 (loss). Background: transparent or #1E2124 (dark). Tooltip: bg #1E2124 text #FFFFFF padding 8px 12px border-radius 4px font 13px." },
          { name: "Stock Row", usage: "Watchlist/holdings list items", specs: "Height: 64px. Padding: 12px 0. Name: 15px weight 500 #1E2124. Ticker: 13px #737680. Price: 15px weight 500. Change badge: 13px weight 500 green/red." },
          { name: "Button (Primary)", usage: "Buy/Sell CTA", specs: "Background: #00C805. Color: #FFFFFF. Padding: 14px 24px. Border-radius: 24px (fully rounded). Font: 16px weight 700. Height: 48px. Hover: #00A808." },
        ],
        spacing: {
          density: "medium",
          base: 4,
          scale: { xs: "4px", sm: "8px", md: "12px", lg: "16px", xl: "24px", "2xl": "32px", "3xl": "48px" },
          gaps: { listItems: "0 (border-separated)", cards: "24px", sections: "32px" },
          padding: { page: "24px", card: "20px 0", button: "14px 24px" },
          notes: "Robinhood balances data density with breathing room. The single-column layout means vertical space is used generously, while individual rows are compact for scannability.",
        },
        principles: [
          { principle: "Chart is king", explanation: "The portfolio chart dominates the viewport. Every design decision points users to the visual representation of their money." },
          { principle: "Consumer simplicity", explanation: "Despite being a financial app, Robinhood removes jargon and complexity. One number, one chart, minimal options." },
          { principle: "Bold color semantics", explanation: "Green = good, red-orange = bad. These are the only semantic colors. Everything else is neutral." },
        ],
      },
    },
  },

  // =========================================================================
  // SAAS / DASHBOARD
  // =========================================================================
  saas: {
    overview:
      "SaaS dashboards balance power-user efficiency with approachability. The best ones (Linear, Notion, Vercel) are opinionated — they pick one design philosophy and execute it perfectly. Keyboard shortcuts, command palettes, and fast transitions are table stakes. Data density varies by audience: developer tools can be denser; creative tools need more whitespace.",
    pageGuidance: {
      dashboard:
        "Show the most important metrics first. Use a card grid for KPIs, followed by a data table or feed. Linear uses a single-column issue list; Vercel uses a project grid. GitHub uses a dense activity feed. Choose based on whether your primary unit is a list item or a project.",
      landing:
        "SaaS landing pages should show the product immediately. Vercel and Linear both lead with product screenshots/demos, not stock photos. The hero CTA should start a free trial or show a demo. Keep the nav minimal (4-5 links max).",
      settings:
        "Use a left sidebar with grouped sections (General, Team, Billing, Integrations). Each section loads in the main content area. Notion, GitHub, and Linear all use this pattern. Never put settings in a modal for a SaaS product.",
      pricing:
        "2-4 tiers in a horizontal layout. Annual/monthly toggle. Feature comparison table below. Highlight the popular tier. Vercel and GitHub both use this exact pattern. Free tier should be prominent.",
      onboarding:
        "Keep it short — 3-5 steps max. Show progress. Let users skip to explore. Linear asks for workspace name and theme, then drops you into the product. The fastest onboarding wins.",
    },
    products: {
      linear: {
        name: "Linear",
        tagline: "Minimal, fast, keyboard-first",
        colors: {
          palette: {
            primary: "#5E6AD2",
            primaryLight: "#7C85DE",
            background: "#FFFFFF",
            backgroundDark: "#191A23",
            surface: "#F5F5F5",
            surfaceDark: "#22232E",
            text: "#1B1B1F",
            textDark: "#EEEEF0",
            textSecondary: "#6B6F76",
            textTertiaryDark: "#80838D",
            border: "#E5E5E5",
            borderDark: "#2E2F3E",
            success: "#4DA862",
            warning: "#E5A54B",
            error: "#D9534F",
            issueBacklog: "#B4B4B4",
            issueTodo: "#E2E2E2",
            issueInProgress: "#F2C94C",
            issueDone: "#5E6AD2",
            issueCancelled: "#95979F",
          },
          usage:
            "Linear offers both light and dark themes. The signature indigo (#5E6AD2) is used for active states, selected items, and the 'Done' status. The dark theme (#191A23) is the default and most popular. Colors are muted and functional — no decorative use. Issue statuses have their own color coding.",
          darkMode: {
            background: "#191A23",
            surface: "#22232E",
            text: "#EEEEF0",
            textSecondary: "#80838D",
            border: "#2E2F3E",
          },
        },
        layouts: [
          {
            name: "Sidebar + List + Detail Panel",
            description:
              "Three-column layout: slim sidebar (220px), issue list (320-400px), and detail panel (remaining). The sidebar collapses. The list supports keyboard navigation.",
            structure:
              "[Sidebar 220px] [List Panel 320-400px] [Detail Panel (flex)]",
            css: `/* Linear-style three-column layout */
.layout { display: grid; grid-template-columns: 220px 360px 1fr; height: 100vh; }
.sidebar { background: #191A23; padding: 12px 8px; border-right: 1px solid #2E2F3E; }
.list-panel { background: #191A23; border-right: 1px solid #2E2F3E; overflow-y: auto; }
.list-item { padding: 8px 16px; font-size: 14px; color: #EEEEF0; cursor: pointer; display: flex; align-items: center; gap: 8px; }
.list-item:hover { background: #22232E; }
.list-item.selected { background: #2E2F3E; }
.detail-panel { background: #191A23; padding: 24px 32px; overflow-y: auto; }`,
          },
        ],
        typography: {
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
          fallback: "system-ui, sans-serif",
          scale: { xs: "11px", sm: "12px", base: "14px", md: "16px", lg: "20px", xl: "24px" },
          weights: { normal: 400, medium: 500, semibold: 600 },
          lineHeights: { tight: "1.25", normal: "1.5", relaxed: "1.6" },
          notes: "Linear uses Inter at 14px base. The typography is extremely disciplined — only 3 weights are used (400, 500, 600). Titles rarely exceed 20px. The compact type system makes the interface feel fast and dense.",
        },
        components: [
          { name: "Issue Row", usage: "Main list item for issues/tasks", specs: "Height: 36-40px. Padding: 8px 16px. Status icon: 16px with color coding. Title: 14px weight 400 text-overflow ellipsis. Priority icon: 16px. Label badges: 11px padding 2px 6px border-radius 3px." },
          { name: "Command Palette", usage: "Quick actions and search (Cmd+K)", specs: "Width: 640px. Background: #22232E. Border: 1px solid #2E2F3E. Border-radius: 12px. Box-shadow: 0 16px 70px rgba(0,0,0,0.5). Input: 16px height 48px. Result items: 14px height 40px padding 0 16px." },
          { name: "Button (Primary)", usage: "Main CTA", specs: "Background: #5E6AD2. Color: #FFFFFF. Padding: 6px 12px. Border-radius: 6px. Font: 13px weight 500. Height: 32px. Hover: #7C85DE." },
        ],
        spacing: {
          density: "dense",
          base: 4,
          scale: { xs: "2px", sm: "4px", md: "8px", lg: "12px", xl: "16px", "2xl": "24px", "3xl": "32px" },
          gaps: { listItems: "0 (continuous)", sections: "24px", formFields: "12px" },
          padding: { page: "24px 32px", card: "16px", sidebarItem: "6px 12px", listItem: "8px 16px", button: "6px 12px" },
          notes: "Linear is dense by design. List items are compact (36-40px). Padding is minimal. This density is part of the 'fast' feeling — you see more information without scrolling.",
        },
        principles: [
          { principle: "Speed as a feature", explanation: "Every interaction should feel instant. Transitions are < 100ms. Optimistic updates everywhere. The design supports this by keeping layouts stable." },
          { principle: "Keyboard first", explanation: "Every action is accessible via keyboard. The command palette (Cmd+K) and shortcuts are the primary interaction model." },
          { principle: "Opinionated defaults", explanation: "Linear does not offer endless customization. It chooses the best workflow and implements it perfectly." },
        ],
      },
      notion: {
        name: "Notion",
        tagline: "Clean, flexible, content-first",
        colors: {
          palette: {
            primary: "#2383E2",
            background: "#FFFFFF",
            backgroundDark: "#191919",
            surface: "#F7F6F3",
            surfaceHover: "#EFEFEF",
            text: "#37352F",
            textDark: "#FFFFFFCF",
            textSecondary: "#787774",
            border: "#E9E9E7",
            borderDark: "#FFFFFF14",
            tagRed: "#FFE2DD",
            tagOrange: "#FADEC9",
            tagYellow: "#FDECC8",
            tagGreen: "#DBEDDB",
            tagBlue: "#D3E5EF",
            tagPurple: "#E8DEEE",
            tagPink: "#F5E0E9",
            tagGray: "#E3E2E0",
          },
          usage:
            "Notion uses a warm, slightly off-white palette (#F7F6F3 surface, #37352F text) that feels like paper. The only brand color (#2383E2) appears on links and selected items. Multi-colored tags provide visual variety within the warm system. The overall effect is calm and inviting.",
        },
        layouts: [
          {
            name: "Sidebar + Content Canvas",
            description:
              "Resizable sidebar (260px default) with a full-width content canvas. Content has generous max-width (900px) and is centered. The canvas feels like a document editor.",
            structure:
              "[Sidebar 260px (resizable)] [Content Canvas (max-width: 900px, centered, padding: 96px horizontal)]",
            css: `/* Notion-style layout */
.layout { display: flex; height: 100vh; }
.sidebar { width: 260px; background: #F7F6F3; padding: 8px; border-right: 1px solid #E9E9E7; overflow-y: auto; flex-shrink: 0; }
.sidebar-item { padding: 4px 12px; font-size: 14px; color: #37352F; border-radius: 4px; display: flex; align-items: center; gap: 8px; min-height: 28px; }
.sidebar-item:hover { background: #EFEFEF; }
.content-canvas { flex: 1; overflow-y: auto; padding: 80px 96px; }
.content-inner { max-width: 900px; margin: 0 auto; }`,
          },
        ],
        typography: {
          fontFamily: "ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, sans-serif",
          fallback: "system-ui, sans-serif",
          scale: { sm: "12px", base: "14px", md: "16px", lg: "20px", xl: "24px", "2xl": "30px", "3xl": "40px" },
          weights: { normal: 400, medium: 500, semibold: 600, bold: 700 },
          lineHeights: { tight: "1.3", normal: "1.5", relaxed: "1.7", page: "1.8" },
          notes: "Notion uses a system font stack but supports serif (Georgia) and mono (iaWriterMono) alternatives per page. Base content font is 16px with generous line-height (1.7-1.8) for readability. Page titles are 40px bold. Notion's type system is optimized for reading, not scanning.",
        },
        components: [
          { name: "Block", usage: "Fundamental content unit (paragraph, heading, list, etc.)", specs: "Min-height: 28px. Padding: 3px 2px. On hover: left drag handle appears at -24px. Each block has a 4px margin between siblings." },
          { name: "Database Row", usage: "Table or board database items", specs: "Height: 34px. Padding: 0 8px. Font: 14px. Border-bottom: 1px solid #E9E9E7. Cell padding: 8px. Tag: 12px padding 2px 6px border-radius 3px with colored backgrounds (see tag colors)." },
          { name: "Button (Primary)", usage: "Modal CTAs and settings", specs: "Background: #2383E2. Color: #FFFFFF. Padding: 6px 12px. Border-radius: 4px. Font: 14px weight 500. Height: 32px. Hover: #0B6BCB." },
        ],
        spacing: {
          density: "medium-spacious",
          base: 4,
          scale: { xs: "2px", sm: "4px", md: "8px", lg: "12px", xl: "16px", "2xl": "24px", "3xl": "32px" },
          gaps: { blocks: "4px", sections: "16px", pagePadding: "80px 96px" },
          padding: { page: "80px 96px (generous, document-like)", sidebar: "8px", sidebarItem: "4px 12px", block: "3px 2px" },
          notes: "Notion's content area is luxuriously padded (96px horizontal!). This makes pages feel like documents, not app screens. The sidebar is compact by contrast. This dual-density approach is key to Notion's feel.",
        },
        principles: [
          { principle: "Content is the interface", explanation: "Notion hides chrome and controls. The page IS the product. Toolbars appear on hover, menus on right-click." },
          { principle: "Everything is a block", explanation: "Uniform block model means consistent spacing, consistent behavior, and infinite composability." },
          { principle: "Warm neutrals", explanation: "The slightly warm color palette (#F7F6F3 instead of #F5F5F5) makes the app feel personal rather than clinical." },
        ],
      },
      vercel: {
        name: "Vercel",
        tagline: "Dark, sleek, developer-centric",
        colors: {
          palette: {
            primary: "#FFFFFF",
            background: "#000000",
            backgroundLight: "#FFFFFF",
            surface: "#111111",
            surfaceLight: "#FAFAFA",
            text: "#EDEDED",
            textLight: "#171717",
            textSecondary: "#888888",
            textSecondaryLight: "#666666",
            border: "#333333",
            borderLight: "#EAEAEA",
            success: "#0070F3",
            error: "#EE0000",
            warning: "#F5A623",
            link: "#0070F3",
          },
          usage:
            "Vercel's default is a striking dark theme (#000000 background with #EDEDED text). The palette is almost entirely monochromatic — black, white, and grays. Blue (#0070F3) is the only accent, used for links and success states. This extreme minimalism creates a premium, developer-focused aesthetic. The light theme mirrors this with #FFFFFF background and #171717 text.",
        },
        layouts: [
          {
            name: "Top Nav + Project Grid",
            description:
              "No sidebar. Top navigation bar with project selector. Content is a responsive grid of project cards. Detail pages use a tabs + content layout.",
            structure:
              "[Top Nav (64px, sticky)] [Content (max-width: 1200px, centered, padding: 24px)]",
            css: `/* Vercel-style layout */
.navbar { height: 64px; padding: 0 24px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #333333; background: #000000; position: sticky; top: 0; z-index: 100; }
.content { max-width: 1200px; margin: 0 auto; padding: 24px; }
.project-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; }
.project-card { background: #111111; border: 1px solid #333333; border-radius: 12px; padding: 24px; }
.project-card:hover { border-color: #555555; }`,
          },
        ],
        typography: {
          fontFamily: "'Geist', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
          fallback: "system-ui, sans-serif",
          scale: { xs: "12px", sm: "13px", base: "14px", md: "16px", lg: "20px", xl: "24px", "2xl": "32px", "3xl": "48px" },
          weights: { normal: 400, medium: 500, semibold: 600, bold: 700 },
          lineHeights: { tight: "1.25", normal: "1.5", relaxed: "1.7" },
          notes: "Vercel uses its own Geist font. Base size is 14px. The monospace variant (Geist Mono) is used for code, deployment URLs, and technical values. Landing page headings are large (48-72px) and bold for maximum impact.",
        },
        components: [
          { name: "Project Card", usage: "Project listing on dashboard", specs: "Background: #111111. Border: 1px solid #333333. Border-radius: 12px. Padding: 24px. Project name: 16px weight 600 #EDEDED. URL: 14px #888888. Status dot: 8px border-radius 50%. Hover: border-color #555555." },
          { name: "Deployment Row", usage: "Deployment list items", specs: "Height: 48px. Padding: 0 16px. Border-bottom: 1px solid #333333. Commit: 14px #EDEDED. Branch: 13px font-family monospace #888888. Status: 13px with colored dot (green/red/yellow)." },
          { name: "Button (Primary)", usage: "Main CTA", specs: "Background: #FFFFFF. Color: #000000. Padding: 8px 16px. Border-radius: 6px. Font: 14px weight 500. Height: 36px. Hover: background #CCCCCC. (Inverted in light mode: bg #000000 text #FFFFFF)." },
        ],
        spacing: {
          density: "medium",
          base: 4,
          scale: { xs: "4px", sm: "8px", md: "12px", lg: "16px", xl: "24px", "2xl": "32px", "3xl": "48px" },
          gaps: { cards: "24px", sections: "48px", listItems: "0 (border-separated)" },
          padding: { page: "24px", card: "24px", button: "8px 16px", navItem: "8px 12px" },
          notes: "Vercel uses moderate spacing. Cards have 24px padding and 24px gaps. The design breathes through contrast (dark backgrounds with light cards) rather than excessive whitespace.",
        },
        principles: [
          { principle: "Monochromatic confidence", explanation: "By limiting color to black, white, and gray, Vercel avoids visual noise. The single blue accent (#0070F3) has maximum impact." },
          { principle: "Dark mode by default", explanation: "Developer tools embrace dark mode. Vercel leans into this as a brand identity, not just a theme option." },
          { principle: "Show, don't decorate", explanation: "No illustrations, no icons for decoration. Real deployment data, real domains, real status indicators." },
        ],
      },
      github: {
        name: "GitHub",
        tagline: "Functional, dense, information-rich",
        colors: {
          palette: {
            primary: "#1F6FEB",
            primaryHover: "#388BFD",
            background: "#0D1117",
            backgroundLight: "#FFFFFF",
            surface: "#161B22",
            surfaceLight: "#F6F8FA",
            text: "#C9D1D9",
            textLight: "#1F2328",
            textSecondary: "#8B949E",
            textSecondaryLight: "#656D76",
            border: "#30363D",
            borderLight: "#D0D7DE",
            success: "#3FB950",
            error: "#F85149",
            warning: "#D29922",
            info: "#58A6FF",
            accent: "#BC8CFF",
          },
          usage:
            "GitHub uses a rich, multi-color palette with strong semantic meaning. Green (merged/success), red (closed/error), purple (open PR), yellow (warning). The dark theme (#0D1117) is default for many developers. The light theme uses a clean white with blue links. GitHub uses color more liberally than minimalist tools.",
          darkMode: {
            background: "#0D1117",
            surface: "#161B22",
            text: "#C9D1D9",
            textSecondary: "#8B949E",
            border: "#30363D",
          },
        },
        layouts: [
          {
            name: "Header + Content + Sidebar",
            description:
              "Top header with search, content area with optional right sidebar. Repository pages use a tab bar beneath the header. Content max-width is 1280px.",
            structure:
              "[Top Header 64px] [Repo Tabs 48px] [Main Content (flex, max-width: 1280px)] + [Optional Sidebar 296px]",
            css: `/* GitHub-style layout */
.header { height: 64px; background: #161B22; padding: 0 32px; display: flex; align-items: center; gap: 16px; }
.tab-bar { height: 48px; border-bottom: 1px solid #30363D; padding: 0 32px; display: flex; align-items: end; gap: 8px; }
.tab { padding: 8px 16px; font-size: 14px; color: #C9D1D9; border-bottom: 2px solid transparent; }
.tab.active { color: #FFFFFF; border-bottom-color: #F78166; font-weight: 600; }
.page { max-width: 1280px; margin: 0 auto; padding: 24px 32px; display: grid; grid-template-columns: 1fr 296px; gap: 24px; }
.sidebar { font-size: 14px; color: #8B949E; }`,
          },
        ],
        typography: {
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif",
          fallback: "system-ui, sans-serif",
          scale: { xs: "12px", sm: "13px", base: "14px", md: "16px", lg: "20px", xl: "24px", "2xl": "32px" },
          weights: { normal: 400, medium: 500, semibold: 600, bold: 700 },
          lineHeights: { tight: "1.25", normal: "1.5", relaxed: "1.75" },
          notes: "GitHub uses a system font stack at 14px base. Monospace code uses 'SFMono-Regular', Menlo, Consolas. GitHub is comfortable with smaller type (12-13px) for metadata. Line height for prose content (README, comments) is generous (1.75).",
        },
        components: [
          { name: "Repository Card", usage: "Repository listing", specs: "Padding: 16px. Border: 1px solid #30363D. Border-radius: 6px. Repo name: 16px weight 600 color #58A6FF. Description: 14px #8B949E. Language dot: 12px circle. Stars/forks: 12px #8B949E." },
          { name: "Issue/PR Row", usage: "Issue and pull request lists", specs: "Padding: 8px 16px. Border-bottom: 1px solid #30363D. Icon: 16px (green open, purple PR, red closed). Title: 14px weight 600 #C9D1D9. Labels: 12px padding 2px 8px border-radius 16px colored backgrounds. Metadata: 12px #8B949E." },
          { name: "Button (Primary)", usage: "Main CTA (New Issue, Create PR)", specs: "Background: #238636. Color: #FFFFFF. Padding: 5px 16px. Border-radius: 6px. Font: 14px weight 500. Height: 32px. Border: 1px solid rgba(240,246,252,0.1). Hover: #2EA043." },
        ],
        spacing: {
          density: "dense",
          base: 4,
          scale: { xs: "4px", sm: "8px", md: "12px", lg: "16px", xl: "24px", "2xl": "32px" },
          gaps: { listItems: "0 (border-separated)", cards: "16px", sections: "24px", formFields: "16px" },
          padding: { page: "24px 32px", card: "16px", button: "5px 16px", listItem: "8px 16px" },
          notes: "GitHub is one of the densest SaaS products. It prioritizes information density — showing more data per screen. Padding is compact, rows are tight. This works because GitHub users are power users who scan quickly.",
        },
        principles: [
          { principle: "Information density is a feature", explanation: "GitHub shows as much relevant context as possible in one view. Metadata, labels, avatars, timestamps all visible without expanding." },
          { principle: "Color for meaning, not decoration", explanation: "Every color in the GitHub UI conveys status. Green = open/success, red = closed/error, purple = PR activity, yellow = warning." },
          { principle: "Consistent primitives", explanation: "GitHub reuses a small set of components (label, avatar, counter, timeline) across all features. This consistency reduces cognitive load." },
        ],
      },
    },
  },

  // =========================================================================
  // E-COMMERCE
  // =========================================================================
  ecommerce: {
    overview:
      "E-commerce design is conversion-driven. Every design choice should reduce friction between discovery and purchase. Clear product photography, prominent pricing, and obvious CTAs are non-negotiable. Trust signals (reviews, secure checkout, return policy) must be visible. Mobile-first is essential — most e-commerce traffic is mobile.",
    pageGuidance: {
      dashboard:
        "For merchant dashboards: show today's sales, orders pending, and key metrics at a glance. Use a card grid for KPIs. Shopify uses a clean summary with actionable items (orders to fulfill, items low in stock). Keep it action-oriented, not just informational.",
      landing:
        "Hero with flagship product or value proposition. Grid of featured products below. For platforms like Shopify/Gumroad, show social proof (merchant count, revenue processed). Apple leads with one stunning product image and minimal text.",
      settings:
        "Merchant settings: use grouped sections (Store, Payments, Shipping, Taxes). Each section has a clear form layout. Shopify uses a card-based layout where each settings group is a separate card with a save button.",
      pricing:
        "For platforms: show tier comparison with feature lists. For stores: use a clean product card with price, Add to Cart, and a quick-view option. Apple uses a configurator approach for product pricing.",
      onboarding:
        "For merchants: guided setup with a checklist (Shopify setup guide). Show progress as a percentage. Each step links to the relevant settings page. For shoppers: skip onboarding entirely — let them browse immediately.",
    },
    products: {
      shopify: {
        name: "Shopify",
        tagline: "Merchant-friendly, action-oriented, Polaris design system",
        colors: {
          palette: {
            primary: "#008060",
            primaryHover: "#006E52",
            background: "#F6F6F7",
            surface: "#FFFFFF",
            text: "#202223",
            textSecondary: "#6D7175",
            textDisabled: "#8C9196",
            border: "#C9CCCF",
            borderSubdued: "#E1E3E5",
            success: "#008060",
            warning: "#B98900",
            error: "#D82C0D",
            info: "#2C6ECB",
            highlight: "#5BCDDA",
          },
          usage:
            "Shopify's Polaris uses green (#008060) as the primary action color — it reads as 'commerce' and 'go'. The background is a soft gray (#F6F6F7) with white cards on top. The palette is warm and approachable, designed for non-technical merchants. Semantic colors (success=green, error=red, warning=amber) are used for order and inventory states.",
        },
        layouts: [
          {
            name: "Sidebar + Card Content",
            description:
              "Left sidebar with navigation (240px). Main content uses a card-based layout where each section (orders, products, analytics) is a white card on the gray background.",
            structure:
              "[Sidebar 240px (dark: #1A1C1D)] [Content: Top bar (56px) + Cards (max-width: 998px, centered, padding: 20px)]",
            css: `/* Shopify Admin-style layout */
.layout { display: grid; grid-template-columns: 240px 1fr; height: 100vh; }
.sidebar { background: #1A1C1D; color: #FFFFFF; padding: 12px 0; }
.sidebar-link { padding: 8px 16px; font-size: 14px; color: #B5B5B5; display: flex; align-items: center; gap: 12px; }
.sidebar-link:hover { background: rgba(255,255,255,0.06); color: #FFFFFF; }
.sidebar-link.active { background: rgba(255,255,255,0.1); color: #FFFFFF; }
.main { background: #F6F6F7; overflow-y: auto; }
.content { max-width: 998px; margin: 0 auto; padding: 20px; }
.card { background: #FFFFFF; border-radius: 12px; box-shadow: 0 1px 0 rgba(0,0,0,0.05); padding: 20px; margin-bottom: 16px; }`,
          },
        ],
        typography: {
          fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          fallback: "system-ui, sans-serif",
          scale: { xs: "12px", sm: "13px", base: "14px", md: "16px", lg: "20px", xl: "24px", "2xl": "28px" },
          weights: { normal: 400, medium: 500, semibold: 600, bold: 700 },
          lineHeights: { tight: "1.25", normal: "1.5", relaxed: "1.6" },
          notes: "Shopify Polaris uses Inter at 14px base. Headings are semibold (600), body is regular (400). The type system is practical — clear hierarchy without being flashy. Labels use 13px semibold. Help text uses 13px regular #6D7175.",
        },
        components: [
          { name: "Resource List Item", usage: "Orders, products, customers list", specs: "Height: 52px. Padding: 12px 20px. Checkbox: 20px. Thumbnail: 40x40px border-radius 4px. Title: 14px weight 500 #202223. Metadata: 13px #6D7175. Hover: bg #F6F6F7." },
          { name: "Polaris Card", usage: "Section container for admin panels", specs: "Background: #FFFFFF. Border-radius: 12px. Box-shadow: 0 1px 0 rgba(0,0,0,0.05). Padding: 20px. Section divider: 1px solid #E1E3E5 with -20px horizontal margin." },
          { name: "Button (Primary)", usage: "Main CTA (Save, Create)", specs: "Background: #008060. Color: #FFFFFF. Padding: 8px 16px. Border-radius: 8px. Font: 14px weight 500. Height: 36px. Hover: #006E52. Active: #005C43. Shadow: 0 1px 0 rgba(0,0,0,0.05)." },
          { name: "Banner", usage: "Alerts, notices, promotional messages", specs: "Padding: 16px. Border-radius: 12px. Info: bg #EAF4FE border-left: 4px solid #2C6ECB. Warning: bg #FFF5EA border-left: 4px solid #B98900. Critical: bg #FFF4F4 border-left: 4px solid #D82C0D." },
        ],
        spacing: {
          density: "medium",
          base: 4,
          scale: { xs: "4px", sm: "8px", md: "12px", lg: "16px", xl: "20px", "2xl": "24px", "3xl": "32px" },
          gaps: { cards: "16px", sections: "20px", formFields: "16px", listItems: "0 (border-separated)" },
          padding: { page: "20px", card: "20px", button: "8px 16px", listItem: "12px 20px" },
          notes: "Shopify uses moderate spacing optimized for merchant productivity. Cards have 20px padding, 16px gaps between them. Dense enough to show important info, spacious enough to not overwhelm non-technical users.",
        },
        principles: [
          { principle: "Merchants first", explanation: "Every design decision optimizes for merchants who are NOT designers or developers. Clear labels, obvious actions, no jargon." },
          { principle: "Cards as containers", explanation: "Each logical section is a card with rounded corners and subtle shadow. This creates visual grouping without heavy borders." },
          { principle: "Green means action", explanation: "The primary green (#008060) is exclusively for primary actions. This creates a clear visual trail — users always know what to click next." },
        ],
      },
      gumroad: {
        name: "Gumroad",
        tagline: "Creator-first, bold, playful",
        colors: {
          palette: {
            primary: "#FF90E8",
            primaryAlt: "#23A094",
            background: "#FFFFFF",
            surface: "#F4F4F0",
            text: "#000000",
            textSecondary: "#666666",
            border: "#000000",
            accent1: "#FF90E8",
            accent2: "#23A094",
            accent3: "#FFD700",
            accent4: "#90A8ED",
          },
          usage:
            "Gumroad uses a distinctive neo-brutalist palette with a pink accent (#FF90E8), thick black borders, and bold typography. The style is intentionally rough and handmade-feeling. Multiple accent colors create a playful, creative atmosphere. This aesthetic signals 'indie creators welcome'.",
        },
        layouts: [
          {
            name: "Simple Centered Content",
            description:
              "Minimal chrome. Top bar with logo and nav. Content is centered with generous max-width. Product pages are single-column with large imagery.",
            structure:
              "[Top Nav (56px)] [Content (max-width: 640px for product pages, 1100px for dashboard, centered)]",
            css: `/* Gumroad-style layout */
.navbar { height: 56px; padding: 0 20px; display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #000000; }
.content { max-width: 640px; margin: 0 auto; padding: 32px 20px; }
.card { background: #FFFFFF; border: 2px solid #000000; border-radius: 8px; padding: 24px; box-shadow: 4px 4px 0 #000000; }`,
          },
        ],
        typography: {
          fontFamily: "'Mabry Pro', -apple-system, system-ui, sans-serif",
          fallback: "system-ui, sans-serif",
          scale: { sm: "14px", base: "16px", md: "18px", lg: "24px", xl: "32px", "2xl": "48px" },
          weights: { normal: 400, bold: 700, black: 900 },
          lineHeights: { tight: "1.2", normal: "1.5", relaxed: "1.7" },
          notes: "Gumroad uses a rounded, friendly font (Mabry Pro). Type is large (16px base) and bold headings go up to 48px weight 900. The typography is a key part of the brand — it feels hand-crafted and personal.",
        },
        components: [
          { name: "Product Card", usage: "Product listing and discovery", specs: "Border: 2px solid #000000. Border-radius: 8px. Box-shadow: 4px 4px 0 #000000. Image: full-width, border-bottom: 2px solid #000000. Padding: 20px. Title: 18px weight 700. Price: 16px weight 700 #23A094." },
          { name: "Button (Primary)", usage: "Buy/Subscribe CTA", specs: "Background: #FF90E8. Color: #000000. Padding: 12px 24px. Border: 2px solid #000000. Border-radius: 8px. Font: 16px weight 700. Box-shadow: 2px 2px 0 #000000. Hover: translate(-1px, -1px) box-shadow 3px 3px 0 #000000. Active: translate(1px, 1px) box-shadow 1px 1px 0." },
        ],
        spacing: {
          density: "spacious",
          base: 4,
          scale: { sm: "8px", md: "16px", lg: "24px", xl: "32px", "2xl": "48px", "3xl": "64px" },
          gaps: { cards: "24px", sections: "48px", formFields: "20px" },
          padding: { page: "32px 20px", card: "24px", button: "12px 24px" },
          notes: "Gumroad is spacious and bold. Large padding, large gaps. The neo-brutalist borders and shadows add visual weight, so spacing needs to be generous to avoid clutter.",
        },
        principles: [
          { principle: "Neo-brutalism", explanation: "Thick borders, drop shadows, bold colors. This anti-minimalist approach stands out and signals creativity and independence." },
          { principle: "Creator personality", explanation: "The design makes space for creator customization — cover images, color accents, personal branding." },
          { principle: "Simplicity over features", explanation: "Gumroad strips e-commerce to the essentials: product, price, buy button. No complicated store builders." },
        ],
      },
      apple_store: {
        name: "Apple Store",
        tagline: "Premium, spacious, photography-driven",
        colors: {
          palette: {
            primary: "#0071E3",
            primaryHover: "#0077ED",
            background: "#FFFFFF",
            backgroundDark: "#000000",
            surface: "#F5F5F7",
            text: "#1D1D1F",
            textSecondary: "#6E6E73",
            textTertiary: "#86868B",
            border: "#D2D2D7",
            link: "#0066CC",
          },
          usage:
            "Apple uses an almost entirely grayscale palette with blue (#0071E3) for links and CTAs only. The design lets product photography and product colors be the visual stars. Backgrounds alternate between pure white and very light gray (#F5F5F7). Dark sections (#000000) are used for hero product reveals.",
        },
        layouts: [
          {
            name: "Full-Width Sections + Centered Content",
            description:
              "No sidebar. Full-width sections with alternating backgrounds. Content within sections is centered with generous max-width. Product pages use a split layout (image left, details right).",
            structure:
              "[Top Nav (48px, sticky, frosted glass)] [Hero (full-viewport or 80vh)] [Section (padding: 80px, max-width: 980px)] [Section...]",
            css: `/* Apple Store-style layout */
.nav { height: 48px; background: rgba(255,255,255,0.72); backdrop-filter: saturate(180%) blur(20px); position: sticky; top: 0; z-index: 100; padding: 0 24px; display: flex; align-items: center; justify-content: center; gap: 32px; }
.nav-link { font-size: 12px; color: #1D1D1F; opacity: 0.8; }
.hero { min-height: 80vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 24px; text-align: center; }
.section { padding: 80px 24px; max-width: 980px; margin: 0 auto; }
.section-alt { background: #F5F5F7; }
.product-split { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center; }`,
          },
        ],
        typography: {
          fontFamily: "'SF Pro Display', 'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif",
          fallback: "system-ui, sans-serif",
          scale: { xs: "12px", sm: "14px", base: "17px", md: "21px", lg: "28px", xl: "40px", "2xl": "56px", "3xl": "80px", "4xl": "96px" },
          weights: { regular: 400, medium: 500, semibold: 600, bold: 700 },
          lineHeights: { tight: "1.05", heading: "1.1", normal: "1.47", relaxed: "1.5" },
          notes: "Apple uses SF Pro at 17px base — larger than most. Headings are enormous (56-96px) with tight line-height (1.05-1.1) for maximum visual impact. Body text is 17px with 1.47 line-height. Weight transitions are subtle (400 to 600, rarely 700). This creates an editorial, magazine-like feel.",
        },
        components: [
          { name: "Product Hero Card", usage: "Featured product showcase", specs: "Full-width or contained. Background: #F5F5F7 or #000000. Padding: 56px 40px. Product name: 56px weight 600 #1D1D1F. Tagline: 28px weight 400 #6E6E73. CTA link: 21px #0066CC with arrow. Product image: centered, large (60-80% of card width)." },
          { name: "Buy Button", usage: "Add to Bag / Purchase", specs: "Background: #0071E3. Color: #FFFFFF. Padding: 12px 24px. Border-radius: 980px (pill shape). Font: 17px weight 400. Min-width: 200px. Hover: #0077ED." },
          { name: "Product Tile", usage: "Product grid items in store", specs: "Padding: 32px 24px 24px. Background: #FFFFFF. Border-radius: 18px. Image: centered, 200-280px. Title: 21px weight 600 #1D1D1F. Price: 17px #1D1D1F. Color options: 12px circles with 2px border." },
        ],
        spacing: {
          density: "very spacious",
          base: 8,
          scale: { sm: "8px", md: "16px", lg: "24px", xl: "40px", "2xl": "56px", "3xl": "80px", "4xl": "120px" },
          gaps: { productGrid: "24px", sections: "80-120px", textBlocks: "16px" },
          padding: { page: "80px 24px", section: "56px 40px", card: "32px 24px", button: "12px 24px" },
          notes: "Apple uses the most generous spacing of any major brand. Section padding is 80px+. Product images have enormous breathing room. This spaciousness communicates premium quality — the product has room to 'breathe'. Every pixel of whitespace says 'we have nothing to hide'.",
        },
        principles: [
          { principle: "Product is the hero", explanation: "Photography does 80% of the selling. The design is a frame for the product, not a competitor for attention." },
          { principle: "Breathing room", explanation: "Massive whitespace around every element. This is the single most important design choice — it creates a luxury feel." },
          { principle: "Progressive reveal", explanation: "Information is revealed as you scroll. Each section focuses on one message. No section tries to do too much." },
          { principle: "Frosted glass nav", explanation: "The translucent, sticky navigation (backdrop-filter: blur) is now synonymous with premium web design." },
        ],
      },
    },
  },

  // =========================================================================
  // HEALTHCARE
  // =========================================================================
  healthcare: {
    overview:
      "Healthcare design must be calming, trustworthy, and accessible. Users may be stressed, in pain, or dealing with sensitive information. Soft colors, generous spacing, and clear typography are essential. WCAG AA (minimum) compliance is non-negotiable. Avoid clinical or sterile aesthetics — aim for warm, human, and reassuring.",
    pageGuidance: {
      dashboard:
        "Show upcoming appointments, medication reminders, and health metrics. Use a card layout with clear icons. Calm and Headspace both use large, friendly cards. Oscar Health uses a clean list. Avoid dense data tables — healthcare users need calm clarity, not data overload.",
      landing:
        "Lead with empathy — acknowledge the user's needs. Show how the product helps with clear, simple messaging. Calm uses nature imagery and soothing gradients. Oscar Health uses friendly illustrations and plain language. Trust signals (HIPAA, certifications) should be visible but not dominant.",
      settings:
        "Health settings are sensitive — use clear labels and helpful descriptions for every field. Group settings logically (Profile, Notifications, Privacy, Insurance). Use confirmation dialogs for any data changes. Make data export and deletion easy to find (GDPR/HIPAA).",
      onboarding:
        "Be gentle. Ask only what's necessary. Use progress indicators. Calm asks about goals and mood before showing content. Oscar Health collects insurance info in a step-by-step wizard with reassuring copy. Never rush health-related onboarding.",
    },
    products: {
      calm: {
        name: "Calm",
        tagline: "Soft, accessible, nature-inspired",
        colors: {
          palette: {
            primary: "#4A90D9",
            primaryDark: "#2E5C8A",
            background: "#1B2838",
            backgroundLight: "#F5F5F0",
            surface: "#243447",
            surfaceLight: "#FFFFFF",
            text: "#FFFFFF",
            textLight: "#2D3436",
            textSecondary: "#A8B8C8",
            textSecondaryLight: "#6B7B8D",
            accent: "#8BC5A7",
            accentWarm: "#F5A962",
            border: "#3A4F63",
            borderLight: "#E0E0DC",
          },
          usage:
            "Calm uses deep blues and navy (#1B2838) as the default dark background, evoking a night sky. Soft blue (#4A90D9) for interactive elements. Green accents (#8BC5A7) for nature/wellness. The palette is deliberately calming — no harsh or saturated colors. Light mode uses warm off-whites and soft grays.",
        },
        layouts: [
          {
            name: "Immersive Full-Screen",
            description:
              "Full-screen backgrounds with centered content. Navigation is minimal — a bottom tab bar on mobile, slim sidebar on desktop. The content area feels like a peaceful environment, not an app.",
            structure:
              "[Background (full-screen gradient or image)] [Centered Content (max-width: 600px, padding: 32px)] [Bottom Tab Nav (mobile) or Slim Sidebar 72px (desktop)]",
            css: `/* Calm-style immersive layout */
.app { background: linear-gradient(180deg, #1B2838 0%, #243447 100%); min-height: 100vh; color: #FFFFFF; }
.content { max-width: 600px; margin: 0 auto; padding: 32px 24px; text-align: center; }
.card { background: rgba(255,255,255,0.08); backdrop-filter: blur(12px); border-radius: 16px; padding: 24px; border: 1px solid rgba(255,255,255,0.1); }
.tab-bar { position: fixed; bottom: 0; left: 0; right: 0; height: 72px; background: rgba(27,40,56,0.95); backdrop-filter: blur(12px); display: flex; justify-content: space-around; align-items: center; }`,
          },
        ],
        typography: {
          fontFamily: "'Apercu', -apple-system, system-ui, sans-serif",
          fallback: "system-ui, sans-serif",
          scale: { sm: "14px", base: "16px", md: "18px", lg: "24px", xl: "32px", "2xl": "40px" },
          weights: { light: 300, normal: 400, medium: 500, bold: 700 },
          lineHeights: { tight: "1.2", normal: "1.5", relaxed: "1.8" },
          notes: "Calm uses a rounded, soft font at 16px base. Light weight (300) is used for large display text to feel gentle and unimposing. Body text is 16-18px with generous line-height (1.8). The typography should feel like a whisper, not a shout.",
        },
        components: [
          { name: "Meditation Card", usage: "Session/content selection", specs: "Background: rgba(255,255,255,0.08). Backdrop-filter: blur(12px). Border: 1px solid rgba(255,255,255,0.1). Border-radius: 16px. Padding: 24px. Image: border-radius 12px. Title: 18px weight 500 #FFFFFF. Duration: 14px #A8B8C8." },
          { name: "Play Button", usage: "Start session CTA", specs: "Width: 64px. Height: 64px. Background: #4A90D9. Border-radius: 50%. Color: #FFFFFF. Icon: 24px play triangle. Box-shadow: 0 4px 20px rgba(74,144,217,0.4). Hover: scale(1.05) transition 200ms." },
          { name: "Progress Ring", usage: "Streak/completion indicator", specs: "Width: 120px. Height: 120px. SVG circle with stroke-dasharray animation. Stroke: #8BC5A7 (complete) #3A4F63 (remaining). Stroke-width: 6px. Center text: 24px weight 500." },
        ],
        spacing: {
          density: "very spacious",
          base: 8,
          scale: { sm: "8px", md: "16px", lg: "24px", xl: "32px", "2xl": "48px", "3xl": "64px" },
          gaps: { cards: "16px", sections: "48px", formFields: "24px" },
          padding: { page: "32px 24px", card: "24px", button: "16px 32px" },
          notes: "Calm uses very generous spacing. Everything breathes. This is essential for a wellness app — cramped layouts create anxiety. Sections are separated by 48-64px. Cards have 24px internal padding.",
        },
        principles: [
          { principle: "Calm by design", explanation: "Every design choice reduces stimulation. Muted colors, gentle animations (200-400ms, ease-out), soft shadows. No sharp corners, no harsh contrasts." },
          { principle: "Nature as UI", explanation: "Background imagery (oceans, forests, stars) creates an emotional environment. The UI floats on top of these environments with glassmorphism." },
          { principle: "Accessibility as care", explanation: "Large touch targets (48px+), high contrast on text, screen reader support. Caring for all users is part of the brand promise." },
        ],
      },
      headspace: {
        name: "Headspace",
        tagline: "Playful, warm, illustrated",
        colors: {
          palette: {
            primary: "#FF6B35",
            primaryDark: "#E55A25",
            background: "#FFF9F2",
            surface: "#FFFFFF",
            text: "#2D2926",
            textSecondary: "#6B6460",
            blue: "#1B95E0",
            purple: "#9B59B6",
            green: "#27AE60",
            yellow: "#F2C94C",
            coral: "#F26B5E",
            navy: "#192841",
          },
          usage:
            "Headspace uses a warm, multi-color palette with an orange primary (#FF6B35). The background is a warm cream (#FFF9F2) instead of white. Each content category has its own color (blue for sleep, green for focus, etc.). The multi-color approach combined with rounded shapes and illustrations creates a friendly, non-clinical feel.",
        },
        layouts: [
          {
            name: "Card Grid + Illustrated Header",
            description:
              "Full-width illustrated header per section. Content is a 2-3 column card grid. Navigation is bottom tabs (mobile) or top bar (web). Lots of rounded shapes and organic curves.",
            structure:
              "[Top Nav or Bottom Tabs] [Section Header (illustration + title, padding: 32px)] [Card Grid (2-3 col, gap: 16px, padding: 20px)]",
            css: `/* Headspace-style layout */
.app { background: #FFF9F2; min-height: 100vh; }
.section-header { padding: 32px 20px; text-align: center; }
.section-header h2 { font-size: 28px; font-weight: 700; color: #2D2926; margin-top: 16px; }
.card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 16px; padding: 0 20px 32px; }
.content-card { background: #FFFFFF; border-radius: 16px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); overflow: hidden; }`,
          },
        ],
        typography: {
          fontFamily: "'Graphik', -apple-system, system-ui, sans-serif",
          fallback: "system-ui, sans-serif",
          scale: { sm: "13px", base: "16px", md: "18px", lg: "24px", xl: "28px", "2xl": "36px" },
          weights: { normal: 400, medium: 500, semibold: 600, bold: 700 },
          lineHeights: { tight: "1.2", normal: "1.5", relaxed: "1.7" },
          notes: "Headspace uses a rounded geometric sans-serif at 16px base. Headings are bold and friendly (28-36px). The tone in UI copy is warm and encouraging — 'Nice work!' 'Keep it up!' Typography pairs with illustrations to create a cohesive, approachable feel.",
        },
        components: [
          { name: "Course Card", usage: "Meditation/course discovery", specs: "Background: #FFFFFF or colored background per category. Border-radius: 16px. Padding: 16px. Image: full-width top, border-radius 12px. Title: 16px weight 600 #2D2926. Subtitle: 14px #6B6460. Duration: 13px #6B6460. Shadow: 0 2px 8px rgba(0,0,0,0.06)." },
          { name: "Category Pill", usage: "Content filtering", specs: "Padding: 8px 20px. Border-radius: 24px. Font: 14px weight 500. Background: per-category color at 15% opacity. Text: per-category color at full saturation. Active: full background color with white text." },
          { name: "Button (Primary)", usage: "Start session CTA", specs: "Background: #FF6B35. Color: #FFFFFF. Padding: 14px 32px. Border-radius: 28px (pill). Font: 16px weight 600. Hover: #E55A25. Shadow: 0 4px 12px rgba(255,107,53,0.3)." },
        ],
        spacing: {
          density: "spacious",
          base: 8,
          scale: { sm: "8px", md: "16px", lg: "20px", xl: "32px", "2xl": "48px" },
          gaps: { cards: "16px", sections: "32px", formFields: "20px" },
          padding: { page: "20px", card: "16px", sectionHeader: "32px 20px", button: "14px 32px" },
          notes: "Headspace uses friendly, spacious layouts. Cards are rounded (16px radius) with ample padding. The overall feel is soft and inviting — nothing is cramped or angular.",
        },
        principles: [
          { principle: "Illustration as brand", explanation: "Headspace's custom illustrations (characters, abstract shapes) are central to the brand. They make mental health feel approachable and non-scary." },
          { principle: "Color as wayfinding", explanation: "Each content category (sleep=blue, focus=green, stress=coral) has its own color. Users can navigate by color alone." },
          { principle: "Warm, not clinical", explanation: "The cream background (#FFF9F2), rounded corners (16px+), and friendly copy avoid any association with medical apps. Mental health should feel warm." },
        ],
      },
      oscar_health: {
        name: "Oscar Health",
        tagline: "Clean, trustworthy, modern healthcare",
        colors: {
          palette: {
            primary: "#0D2C6C",
            primaryLight: "#1A5CFF",
            background: "#FFFFFF",
            surface: "#F5F7FA",
            text: "#0D2C6C",
            textSecondary: "#5A6B80",
            border: "#D8DFE7",
            success: "#00875A",
            warning: "#F5A623",
            error: "#D9534F",
            accent: "#00BFD8",
          },
          usage:
            "Oscar uses a deep navy (#0D2C6C) as its primary and text color — it reads as authoritative and trustworthy without being cold. The accent teal (#00BFD8) adds a modern, tech-forward feel. Backgrounds are clean whites and very light blues. The overall palette says 'we're a health company you can trust, but we're also modern'.",
        },
        layouts: [
          {
            name: "Top Nav + Card Sections",
            description:
              "Top navigation with member info. Content area uses card-based layout with clear sections for different health management tasks (appointments, claims, medications).",
            structure:
              "[Top Nav (64px)] [Hero/Welcome Banner] [Card Grid (max-width: 1100px, centered, 2-col)]",
            css: `/* Oscar Health-style layout */
.navbar { height: 64px; background: #0D2C6C; padding: 0 32px; display: flex; align-items: center; gap: 24px; color: #FFFFFF; }
.welcome { padding: 40px 32px; background: #F5F7FA; }
.welcome h1 { font-size: 32px; font-weight: 700; color: #0D2C6C; }
.content { max-width: 1100px; margin: 0 auto; padding: 32px; display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
.card { background: #FFFFFF; border: 1px solid #D8DFE7; border-radius: 12px; padding: 24px; }`,
          },
        ],
        typography: {
          fontFamily: "'Gilroy', -apple-system, system-ui, sans-serif",
          fallback: "system-ui, sans-serif",
          scale: { sm: "14px", base: "16px", md: "18px", lg: "24px", xl: "32px", "2xl": "40px" },
          weights: { normal: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800 },
          lineHeights: { tight: "1.2", normal: "1.5", relaxed: "1.7" },
          notes: "Oscar uses Gilroy (geometric sans-serif) at 16px base. Headings use extrabold (800) for confidence and authority. Body text has generous line-height for readability. The type system is large and clear — essential for health information that must be understood by everyone.",
        },
        components: [
          { name: "Health Action Card", usage: "Tasks and next steps for members", specs: "Background: #FFFFFF. Border: 1px solid #D8DFE7. Border-radius: 12px. Padding: 24px. Icon: 40px in #F5F7FA circle. Title: 18px weight 600 #0D2C6C. Description: 16px #5A6B80. CTA link: 16px weight 600 #1A5CFF." },
          { name: "Appointment Slot", usage: "Doctor appointment booking", specs: "Padding: 16px. Border: 1px solid #D8DFE7. Border-radius: 8px. Time: 16px weight 600 #0D2C6C. Doctor: 14px #5A6B80. Available indicator: 8px dot #00875A. Hover: border-color #1A5CFF background #F5F7FA." },
          { name: "Button (Primary)", usage: "Main CTA", specs: "Background: #0D2C6C. Color: #FFFFFF. Padding: 12px 24px. Border-radius: 8px. Font: 16px weight 600. Height: 48px. Hover: #0A2050." },
        ],
        spacing: {
          density: "spacious",
          base: 8,
          scale: { sm: "8px", md: "16px", lg: "24px", xl: "32px", "2xl": "48px", "3xl": "64px" },
          gaps: { cards: "24px", sections: "48px", formFields: "24px" },
          padding: { page: "32px", card: "24px", button: "12px 24px" },
          notes: "Oscar uses spacious layouts with large cards (24px padding) and generous gaps. Health information needs breathing room — crowded interfaces create anxiety for people dealing with medical concerns.",
        },
        principles: [
          { principle: "Trust through design", explanation: "Navy colors, clean layouts, and clear typography build trust. Healthcare demands more trust than other industries — design must earn it." },
          { principle: "Clarity over cleverness", explanation: "No ambiguous icons, no unclear labels. Every element is self-explanatory. In healthcare, misunderstanding can have real consequences." },
          { principle: "Action-oriented", explanation: "Oscar focuses on 'what to do next' — book an appointment, find a doctor, check a claim. The design guides users toward actions, not just information." },
        ],
      },
    },
  },

  // =========================================================================
  // EDUCATION
  // =========================================================================
  education: {
    overview:
      "Education design balances engagement with focus. The best edtech products use gamification carefully — enough to motivate, not so much that it distracts. Content readability is paramount. Progress tracking and clear learning paths keep users oriented. Accessibility is critical since users span all ages and abilities.",
    pageGuidance: {
      dashboard:
        "Show current learning progress prominently — streaks, completion percentage, next lesson. Duolingo uses a single-column path; Coursera uses a card grid of enrolled courses. The dashboard should answer: 'What should I do next?' immediately.",
      landing:
        "Show the breadth of content and social proof (learner count, reviews, outcomes). Coursera leads with a search bar and course categories. Duolingo leads with a simple value proposition and immediate start CTA. Both work because they match their audience.",
      settings:
        "Keep settings minimal. Learning goals, notification preferences, language, accessibility options. Duolingo groups these simply. Coursera has more settings due to certificates and professional features.",
      pricing:
        "Freemium is the norm. Show what's free vs paid clearly. Duolingo Plus uses a comparison list. Coursera uses per-course pricing with a subscription option. Highlight value (certificates, offline access) not features.",
      onboarding:
        "Ask about goals first — 'Why are you learning Spanish?' Duolingo does this brilliantly with a placement test that doubles as engagement. Coursera asks about career goals. Get users to content ASAP.",
    },
    products: {
      duolingo: {
        name: "Duolingo",
        tagline: "Gamified, colorful, habit-forming",
        colors: {
          palette: {
            primary: "#58CC02",
            primaryDark: "#4CAD00",
            background: "#FFFFFF",
            surface: "#F7F7F7",
            text: "#3C3C3C",
            textSecondary: "#777777",
            blue: "#1CB0F6",
            red: "#FF4B4B",
            orange: "#FF9600",
            purple: "#CE82FF",
            pink: "#FF86D0",
            yellow: "#FFC800",
            border: "#E5E5E5",
            borderDark: "#CDCDCD",
            maskGreen: "#89E219",
          },
          usage:
            "Duolingo uses a vibrant, multi-color palette dominated by its signature green (#58CC02). Each color has a purpose: green for correct/progress, red for wrong/hearts, blue for info, orange for streaks. The palette is intentionally childlike and energetic. High saturation creates excitement and reinforces the gamification loop.",
        },
        layouts: [
          {
            name: "Centered Path + Side Panels",
            description:
              "The main learning path is a single vertical column centered on screen. Side panels show streak, league, and profile info. The path uses a winding tree layout with circular lesson nodes.",
            structure:
              "[Left Panel (optional, stats)] [Central Path (max-width: 500px)] [Right Panel (optional, leaderboard)]",
            css: `/* Duolingo-style path layout */
.app { display: flex; justify-content: center; gap: 32px; padding: 24px; max-width: 1100px; margin: 0 auto; }
.side-panel { width: 280px; flex-shrink: 0; }
.path-container { max-width: 500px; display: flex; flex-direction: column; align-items: center; gap: 16px; }
.lesson-node { width: 64px; height: 64px; border-radius: 50%; background: #58CC02; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 0 #4CAD00; cursor: pointer; }
.lesson-node:hover { transform: translateY(-2px); }
.lesson-node.locked { background: #E5E5E5; box-shadow: 0 4px 0 #CDCDCD; cursor: not-allowed; }`,
          },
        ],
        typography: {
          fontFamily: "'Din Round', 'Nunito', -apple-system, system-ui, sans-serif",
          fallback: "'Nunito', system-ui, sans-serif",
          scale: { sm: "13px", base: "15px", md: "17px", lg: "21px", xl: "28px", "2xl": "36px" },
          weights: { normal: 400, bold: 700, black: 900 },
          lineHeights: { tight: "1.2", normal: "1.4", relaxed: "1.6" },
          notes: "Duolingo uses Din Round (or Nunito as a web fallback) — a friendly, rounded font. Weights are either regular (400) or bold (700+). There's no in-between — this bold approach matches the gamified aesthetic. Text is large enough for comfortable reading during lessons (17px for content).",
        },
        components: [
          { name: "Lesson Node", usage: "Main path lesson selector", specs: "Width: 64px. Height: 64px. Border-radius: 50%. Background: category color. Box-shadow: 0 4px 0 (darker shade). Icon: 28px white. Hover: translateY(-2px). Active: translateY(2px) shadow 0 0px. Locked: bg #E5E5E5." },
          { name: "XP Progress Bar", usage: "Lesson progress and daily goals", specs: "Height: 16px. Background: #E5E5E5. Border-radius: 8px. Fill: #58CC02 with transition: width 300ms ease. Label: 13px bold centered on bar." },
          { name: "Streak Counter", usage: "Daily streak display", specs: "Icon: flame emoji or SVG 32px. Count: 21px weight 700 #FF9600. Label: 13px #777777. Container: padding 16px, border: 2px solid #E5E5E5, border-radius 12px." },
          { name: "Button (Primary)", usage: "Check/Continue CTA in lessons", specs: "Background: #58CC02. Color: #FFFFFF. Padding: 14px 24px. Border-radius: 16px. Font: 15px weight 700 uppercase. Box-shadow: 0 4px 0 #4CAD00. Hover: bg #46A302. Active: translateY(4px) shadow none. Width: 100% in lesson context." },
        ],
        spacing: {
          density: "spacious",
          base: 8,
          scale: { sm: "8px", md: "16px", lg: "24px", xl: "32px", "2xl": "48px" },
          gaps: { pathNodes: "16px", cards: "16px", sections: "32px", lessonOptions: "12px" },
          padding: { page: "24px", card: "16px", button: "14px 24px", lessonContent: "24px 16px" },
          notes: "Duolingo uses generous spacing with large, tappable elements (64px lesson nodes, 48px+ buttons). Everything is designed for mobile-first interaction. Spacing creates a sense of progress as you scroll down the path.",
        },
        principles: [
          { principle: "Gamification done right", explanation: "XP, streaks, leagues, hearts — every mechanic serves learning retention. The design makes these feel rewarding, not manipulative." },
          { principle: "One thing at a time", explanation: "Lessons show one question per screen. The path shows one clear next step. Cognitive load is minimized at every turn." },
          { principle: "Personality through UI", explanation: "Duo the owl, sound effects, celebrations, and playful animations make the app feel alive. Design IS the content experience." },
        ],
      },
      coursera: {
        name: "Coursera",
        tagline: "Academic, structured, professional",
        colors: {
          palette: {
            primary: "#0056D2",
            primaryDark: "#003E99",
            background: "#FFFFFF",
            surface: "#F5F5F5",
            text: "#1F1F1F",
            textSecondary: "#585858",
            textTertiary: "#757575",
            border: "#C8C8C8",
            success: "#1F7A1F",
            warning: "#D2780A",
            error: "#D91F11",
            accent: "#7C68EE",
            partnerBlue: "#0056D2",
          },
          usage:
            "Coursera uses a traditional, academic color scheme with blue (#0056D2) as the primary. The palette is restrained and professional — it appeals to adult learners and enterprise clients. No bright, playful colors. Grays and whites dominate, letting course imagery and university logos provide visual variety.",
        },
        layouts: [
          {
            name: "Top Nav + Content Grid",
            description:
              "Top navigation with search and user menu. Content area uses a responsive grid for course cards. Course detail pages use a two-column layout (content + sidebar for enrollment).",
            structure:
              "[Top Nav (64px)] [Content (max-width: 1200px, centered)] — [Course Grid: 3-4 col] or [Course Detail: Content (flex) + Sidebar (360px)]",
            css: `/* Coursera-style layout */
.navbar { height: 64px; background: #FFFFFF; border-bottom: 1px solid #C8C8C8; padding: 0 24px; display: flex; align-items: center; gap: 24px; }
.content { max-width: 1200px; margin: 0 auto; padding: 32px 24px; }
.course-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(270px, 1fr)); gap: 24px; }
.course-detail { display: grid; grid-template-columns: 1fr 360px; gap: 32px; }
.enrollment-card { position: sticky; top: 80px; background: #FFFFFF; border: 1px solid #C8C8C8; border-radius: 8px; padding: 24px; }`,
          },
        ],
        typography: {
          fontFamily: "'Source Sans Pro', -apple-system, system-ui, sans-serif",
          fallback: "system-ui, sans-serif",
          scale: { xs: "12px", sm: "14px", base: "16px", md: "18px", lg: "24px", xl: "32px", "2xl": "40px" },
          weights: { normal: 400, semibold: 600, bold: 700 },
          lineHeights: { tight: "1.3", normal: "1.5", relaxed: "1.8" },
          notes: "Coursera uses Source Sans Pro at 16px base — an academic-feeling font that's still highly readable on screen. Course descriptions and reading material use 18px with 1.8 line-height for comfortable extended reading. Headings are semibold (600), not bold — this creates a scholarly, understated tone.",
        },
        components: [
          { name: "Course Card", usage: "Course discovery and catalog", specs: "Background: #FFFFFF. Border: 1px solid #C8C8C8. Border-radius: 8px. Image: full-width top, aspect-ratio 16/9. Padding: 16px. Partner logo: 24px height. Title: 16px weight 600 #1F1F1F. Rating: 14px with yellow stars. Meta: 14px #585858." },
          { name: "Enrollment CTA", usage: "Course enrollment sidebar", specs: "Position: sticky top: 80px. Background: #FFFFFF. Border: 1px solid #C8C8C8. Border-radius: 8px. Padding: 24px. Price: 24px weight 700 #1F1F1F. Enroll button: full-width bg #0056D2 color #FFFFFF padding 12px border-radius 4px." },
          { name: "Progress Tracker", usage: "Course progress in enrolled courses", specs: "Bar: height 8px background #F5F5F5 border-radius 4px. Fill: #0056D2 with transition. Label: 14px weight 600. 'X of Y completed': 14px #585858." },
          { name: "Button (Primary)", usage: "Enroll/Start CTA", specs: "Background: #0056D2. Color: #FFFFFF. Padding: 10px 24px. Border-radius: 4px. Font: 16px weight 600. Height: 44px. Hover: #003E99." },
        ],
        spacing: {
          density: "medium",
          base: 8,
          scale: { sm: "8px", md: "16px", lg: "24px", xl: "32px", "2xl": "48px", "3xl": "64px" },
          gaps: { courseCards: "24px", sections: "48px", formFields: "16px", moduleItems: "0 (border-separated)" },
          padding: { page: "32px 24px", card: "16px", enrollmentCard: "24px", button: "10px 24px" },
          notes: "Coursera uses standard, conservative spacing. Not too dense, not too spacious. The focus is on content readability and easy scanning of course catalogs. Module lists are compact; course descriptions have generous line-height.",
        },
        principles: [
          { principle: "Credibility through restraint", explanation: "Coursera's design is intentionally un-flashy. University partners and adult learners expect seriousness. The design builds trust through professionalism." },
          { principle: "Content-first hierarchy", explanation: "Course title, instructor, university, rating — the information hierarchy is clear and consistent across thousands of courses." },
          { principle: "Search and filter as primary navigation", explanation: "With 5000+ courses, search and filtering are more important than browsing. The design centers this with a prominent search bar and robust filter sidebar." },
        ],
      },
    },
  },

  // =========================================================================
  // SOCIAL
  // =========================================================================
  social: {
    overview:
      "Social platform design centers on content consumption and creation. The feed is the core UI pattern. Engagement mechanics (likes, comments, shares) must be immediately accessible but not overwhelming. Identity (profiles, avatars) is prominent. Performance is critical — infinite scroll must feel instant. Design must handle user-generated content of wildly varying quality.",
    pageGuidance: {
      dashboard:
        "The 'dashboard' IS the feed. New content at top, infinite scroll. Twitter/X uses a single-column reverse-chronological feed. Instagram uses a photo grid for profiles and a single-column feed for the home. LinkedIn uses a card-based feed with a mix of content types.",
      landing:
        "Social landing pages sell community. Show sample content, user counts, and the signup CTA. Twitter shows trending topics. LinkedIn shows professional benefits. The landing should give a taste of the content without requiring signup.",
      settings:
        "Privacy settings are the most critical. Account, privacy, notifications, security — in that order. Every social platform handles this similarly because it's a regulatory requirement. Make privacy controls clear and accessible.",
      onboarding:
        "Follow people/topics immediately. The faster a user sees relevant content in their feed, the higher retention. Twitter asks to follow 3+ accounts. LinkedIn asks to connect contacts. Content > profile setup.",
    },
    products: {
      twitter: {
        name: "Twitter/X",
        tagline: "Real-time, text-first, minimalist",
        colors: {
          palette: {
            primary: "#1D9BF0",
            background: "#FFFFFF",
            backgroundDark: "#000000",
            surface: "#F7F9F9",
            surfaceDark: "#16181C",
            text: "#0F1419",
            textDark: "#E7E9EA",
            textSecondary: "#536471",
            textSecondaryDark: "#71767B",
            border: "#EFF3F4",
            borderDark: "#2F3336",
            like: "#F91880",
            retweet: "#00BA7C",
            reply: "#536471",
          },
          usage:
            "Twitter uses blue (#1D9BF0) as its signature interactive color — links, follow buttons, tweet button. The interface is otherwise almost entirely monochrome. Engagement actions have distinct colors: pink for likes (#F91880), green for retweets (#00BA7C). This minimal palette keeps the focus on text content.",
        },
        layouts: [
          {
            name: "Three-Column Feed",
            description:
              "Left sidebar (navigation), center column (feed), right sidebar (trends/search). The center column is the star. On mobile, it's single-column with bottom tab navigation.",
            structure:
              "[Left Sidebar 275px (nav icons)] [Feed 600px (centered)] [Right Sidebar 350px (search, trends)]",
            css: `/* Twitter-style layout */
.layout { display: flex; justify-content: center; max-width: 1300px; margin: 0 auto; }
.left-sidebar { width: 275px; padding: 0 12px; position: sticky; top: 0; height: 100vh; }
.feed { width: 600px; border-left: 1px solid #EFF3F4; border-right: 1px solid #EFF3F4; min-height: 100vh; }
.right-sidebar { width: 350px; padding: 0 24px; position: sticky; top: 0; height: 100vh; overflow-y: auto; }
.tweet { padding: 12px 16px; border-bottom: 1px solid #EFF3F4; display: flex; gap: 12px; }
.tweet:hover { background: rgba(0,0,0,0.03); }`,
          },
        ],
        typography: {
          fontFamily: "'Chirp', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          fallback: "system-ui, sans-serif",
          scale: { sm: "13px", base: "15px", md: "17px", lg: "20px", xl: "23px" },
          weights: { normal: 400, bold: 700, black: 800 },
          lineHeights: { tight: "1.2", normal: "1.4", relaxed: "1.5" },
          notes: "Twitter uses its custom Chirp font at 15px base. Tweet text is 15px regular. Display names are 15px bold. Usernames are 15px regular in #536471. Trending topics and counts use 13px. The type system is optimized for scanning speed — users process hundreds of tweets per session.",
        },
        components: [
          { name: "Tweet", usage: "Core content unit", specs: "Padding: 12px 16px. Avatar: 40px circle. Display name: 15px weight 700 #0F1419. Handle: 15px #536471. Content: 15px #0F1419 line-height 1.4. Actions bar: 13px icons at 20px, gap 48px between actions. Border-bottom: 1px solid #EFF3F4." },
          { name: "Tweet Compose", usage: "Content creation", specs: "Padding: 12px 16px. Avatar: 40px. Textarea: 20px placeholder 'What is happening?!' #536471. Character limit: circular progress at 24px. Tweet button: bg #1D9BF0 color #FFFFFF padding 8px 20px border-radius 9999px font 15px weight 700." },
          { name: "Follow Button", usage: "User follow CTA", specs: "Background: #0F1419. Color: #FFFFFF. Padding: 6px 16px. Border-radius: 9999px (pill). Font: 14px weight 700. Height: 32px. Hover: opacity 0.9. Following state: bg transparent border 1px solid #CFD9DE color #0F1419." },
        ],
        spacing: {
          density: "dense",
          base: 4,
          scale: { xs: "4px", sm: "8px", md: "12px", lg: "16px", xl: "20px", "2xl": "24px" },
          gaps: { tweets: "0 (border-separated)", tweetActions: "48px", sections: "16px" },
          padding: { tweet: "12px 16px", sidebar: "0 12px", trending: "12px 16px" },
          notes: "Twitter is dense to maximize content throughput. Tweets are compact with minimal internal spacing. The feed has zero gap between tweets (border-separated). This density is intentional — social feeds need to show volume.",
        },
        principles: [
          { principle: "Content velocity", explanation: "The design optimizes for consuming and producing content at high speed. Minimal chrome, maximum content area." },
          { principle: "Pill buttons everywhere", explanation: "Rounded pill shapes (border-radius: 9999px) are Twitter's signature component shape. Buttons, tags, and navigation items all use this." },
          { principle: "Engagement color coding", explanation: "Like (pink), retweet (green), reply (gray) — each engagement type has a unique color for instant recognition." },
        ],
      },
    },
  },

  // =========================================================================
  // DEVELOPER TOOLS
  // =========================================================================
  developer_tools: {
    overview:
      "Developer tool design prioritizes information density, keyboard efficiency, and dark themes. Developers spend long hours in these tools, so eye strain reduction matters. Monospace fonts for code, syntax highlighting, and terminal aesthetics are expected. The best dev tools feel fast — perceived performance is as important as actual performance.",
    pageGuidance: {
      dashboard:
        "Show project status, recent activity, and quick actions. Vercel shows deployment status; GitHub shows activity feeds; Linear shows assigned issues. Developers want to answer 'what needs my attention?' immediately.",
      landing:
        "Show the product in action — code snippets, terminal output, actual UI screenshots. Developers are skeptical of marketing; they want to see the tool working. Vercel and Linear both lead with product demos, not stock photos.",
      settings:
        "Developers expect granular settings. API keys, webhooks, integrations, team permissions. Use a left sidebar with many sections. Code-style elements (monospace for keys, copyable fields) feel natural.",
      pricing:
        "Free tier is essential for developer adoption. Show usage limits clearly (requests/month, team size, storage). Vercel and GitHub both use a comparison table with clear limits per tier.",
      onboarding:
        "CLI-first onboarding is ideal. 'npm install && npx create' is better than a web wizard. If web onboarding is needed, keep it to framework/template selection, then show a terminal command. Get developers to code ASAP.",
    },
    products: {
      // Vercel and GitHub already covered in SaaS, referenced here conceptually
      vscode: {
        name: "VS Code",
        tagline: "Extensible, familiar, productivity-focused",
        colors: {
          palette: {
            primary: "#007ACC",
            background: "#1E1E1E",
            backgroundLight: "#FFFFFF",
            surface: "#252526",
            surfaceLight: "#F3F3F3",
            sidebarBg: "#333333",
            activityBarBg: "#333333",
            text: "#CCCCCC",
            textLight: "#333333",
            textInactive: "#969696",
            border: "#474747",
            borderLight: "#E7E7E7",
            selection: "#264F78",
            findMatch: "#515C6A",
            lineHighlight: "#2A2D2E",
            success: "#89D185",
            error: "#F48771",
            warning: "#CCA700",
            info: "#75BEFF",
          },
          usage:
            "VS Code's default dark theme uses a medium-dark gray (#1E1E1E) — not pure black, which would cause excessive contrast with white text. Blue (#007ACC) is the primary accent for focused elements and links. The activity bar and sidebar are slightly lighter (#333333) to create depth. Syntax highlighting provides the real color variety.",
        },
        layouts: [
          {
            name: "Activity Bar + Sidebar + Editor + Panel",
            description:
              "Four-region layout. Narrow activity bar (48px) on the far left with icon-only navigation. Resizable sidebar (300px default). Central editor area with tabs. Bottom panel for terminal/output.",
            structure:
              "[Activity Bar 48px] [Sidebar 300px (resizable)] [Editor Area (flex)] [Bottom Panel (resizable, 200px default)]",
            css: `/* VS Code-style layout */
.layout { display: grid; grid-template-columns: 48px 300px 1fr; grid-template-rows: 1fr 200px; height: 100vh; }
.activity-bar { background: #333333; display: flex; flex-direction: column; align-items: center; padding: 8px 0; gap: 4px; }
.activity-icon { width: 48px; height: 40px; display: flex; align-items: center; justify-content: center; color: #969696; }
.activity-icon.active { color: #FFFFFF; border-left: 2px solid #FFFFFF; }
.sidebar { background: #252526; border-right: 1px solid #474747; overflow-y: auto; }
.sidebar-header { padding: 8px 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #BBBBBB; }
.editor { background: #1E1E1E; }
.panel { grid-column: 1 / -1; background: #1E1E1E; border-top: 1px solid #474747; }`,
          },
        ],
        typography: {
          fontFamily: "'Segoe UI', -apple-system, system-ui, sans-serif (UI); 'Cascadia Code', 'Fira Code', Consolas, monospace (editor)",
          fallback: "system-ui, sans-serif",
          scale: { xs: "11px", sm: "12px", base: "13px", md: "14px" },
          weights: { normal: 400, semibold: 600 },
          lineHeights: { tight: "1.2", normal: "1.4", code: "1.6" },
          notes: "VS Code uses 13px as the UI font size — smaller than most apps, maximizing screen real estate. The editor uses a monospace font (default Consolas/Menlo) at 14px with 1.6 line-height. File tree uses 13px with 22px row height. Every pixel is optimized for showing more code.",
        },
        components: [
          { name: "Editor Tab", usage: "Open file tabs", specs: "Height: 35px. Padding: 0 12px. Font: 13px. Active: bg #1E1E1E border-bottom: transparent. Inactive: bg #2D2D2D color #969696. Close icon: 16px on hover. Modified dot: 8px circle." },
          { name: "Tree Item", usage: "File explorer items", specs: "Height: 22px. Padding-left: 8px + (depth * 16px). Font: 13px. Icon: 16px with language-specific colors. Hover: bg #2A2D2E. Selected: bg #37373D. Active: bg #04395E." },
          { name: "Command Palette", usage: "Quick actions (Ctrl+Shift+P)", specs: "Width: 600px. Background: #252526. Border: 1px solid #474747. Input: 14px height 32px bg #3C3C3C. Result items: 13px height 22px padding 0 8px. Selected: bg #04395E." },
          { name: "Status Bar", usage: "Bottom status information", specs: "Height: 22px. Background: #007ACC (with workspace) or #68217A (no workspace). Font: 12px. Items: padding 0 8px. Color: #FFFFFF. Hover: bg rgba(255,255,255,0.12)." },
        ],
        spacing: {
          density: "very dense",
          base: 4,
          scale: { xs: "2px", sm: "4px", md: "8px", lg: "12px", xl: "16px" },
          gaps: { treeItems: "0", tabs: "0", statusItems: "0" },
          padding: { treeItem: "0 8px", tab: "0 12px", panel: "8px", editorGutter: "0 8px" },
          notes: "VS Code is one of the densest UIs in use. Tree items are 22px, tabs are 35px, status bar is 22px. This extreme density exists because developers need maximum viewport for code. UI chrome is minimized aggressively.",
        },
        principles: [
          { principle: "Code is king", explanation: "Every design decision maximizes the code editing area. All other UI elements are as compact as possible." },
          { principle: "Depth through shade", explanation: "The activity bar, sidebar, editor, and panel each use a slightly different shade of gray, creating depth without borders." },
          { principle: "Keyboard everything", explanation: "Command palette, shortcuts for every action. The mouse is secondary. Design supports this with visible keybindings in menus." },
        ],
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function formatColorSection(product: ProductReference): string {
  const lines = [
    `### Color Palette`,
    ``,
    `| Role | Hex | Description |`,
    `|------|-----|-------------|`,
  ];
  for (const [role, hex] of Object.entries(product.colors.palette)) {
    lines.push(`| ${role} | \`${hex}\` | |`);
  }
  lines.push(``);
  lines.push(product.colors.usage);
  if (product.colors.darkMode) {
    lines.push(``);
    lines.push(`**Dark Mode Overrides:**`);
    for (const [role, hex] of Object.entries(product.colors.darkMode)) {
      lines.push(`- ${role}: \`${hex}\``);
    }
  }
  return lines.join("\n");
}

function formatLayoutSection(product: ProductReference): string {
  const lines = [`### Layout Patterns`, ``];
  for (const layout of product.layouts) {
    lines.push(`**${layout.name}** — ${layout.description}`);
    lines.push(``);
    lines.push(`Structure: \`${layout.structure}\``);
    lines.push(``);
    lines.push("```css");
    lines.push(layout.css);
    lines.push("```");
    lines.push(``);
  }
  return lines.join("\n");
}

function formatTypographySection(product: ProductReference): string {
  const lines = [
    `### Typography`,
    ``,
    `**Font:** \`${product.typography.fontFamily}\``,
    `**Fallback:** \`${product.typography.fallback}\``,
    ``,
    `**Type Scale:**`,
    ``,
    `| Step | Size |`,
    `|------|------|`,
  ];
  for (const [step, size] of Object.entries(product.typography.scale)) {
    lines.push(`| ${step} | ${size} |`);
  }
  lines.push(``);
  lines.push(`**Weights:**`);
  for (const [name, val] of Object.entries(product.typography.weights)) {
    lines.push(`- ${name}: ${val}`);
  }
  lines.push(``);
  lines.push(`**Line Heights:**`);
  for (const [name, val] of Object.entries(product.typography.lineHeights)) {
    lines.push(`- ${name}: ${val}`);
  }
  lines.push(``);
  lines.push(product.typography.notes);
  return lines.join("\n");
}

function formatComponentSection(product: ProductReference): string {
  const lines = [`### Component Patterns`, ``];
  for (const comp of product.components) {
    lines.push(`**${comp.name}** — ${comp.usage}`);
    lines.push(`- ${comp.specs}`);
    lines.push(``);
  }
  return lines.join("\n");
}

function formatSpacingSection(product: ProductReference): string {
  const lines = [
    `### Spacing & Density`,
    ``,
    `**Density:** ${product.spacing.density}`,
    `**Base unit:** ${product.spacing.base}px`,
    ``,
    `**Scale:**`,
    ``,
    `| Step | Value |`,
    `|------|-------|`,
  ];
  for (const [step, val] of Object.entries(product.spacing.scale)) {
    lines.push(`| ${step} | ${val} |`);
  }
  lines.push(``);
  lines.push(`**Common Gaps:**`);
  for (const [ctx, val] of Object.entries(product.spacing.gaps)) {
    lines.push(`- ${ctx}: ${val}`);
  }
  lines.push(``);
  lines.push(`**Common Padding:**`);
  for (const [ctx, val] of Object.entries(product.spacing.padding)) {
    lines.push(`- ${ctx}: ${val}`);
  }
  lines.push(``);
  lines.push(product.spacing.notes);
  return lines.join("\n");
}

function formatPrinciplesSection(product: ProductReference): string {
  const lines = [`### Key Design Principles`, ``];
  for (const p of product.principles) {
    lines.push(`**${p.principle}:** ${p.explanation}`);
    lines.push(``);
  }
  return lines.join("\n");
}

function formatProduct(product: ProductReference, aspect: string): string {
  const lines = [
    `## ${product.name}`,
    `*${product.tagline}*`,
    ``,
  ];

  if (aspect === "all" || aspect === "color") {
    lines.push(formatColorSection(product));
    lines.push(``);
  }
  if (aspect === "all" || aspect === "layout") {
    lines.push(formatLayoutSection(product));
    lines.push(``);
  }
  if (aspect === "all" || aspect === "typography") {
    lines.push(formatTypographySection(product));
    lines.push(``);
  }
  if (aspect === "all" || aspect === "components") {
    lines.push(formatComponentSection(product));
    lines.push(``);
  }
  if (aspect === "all" || aspect === "spacing") {
    lines.push(formatSpacingSection(product));
    lines.push(``);
  }

  // Always include principles — they're critical context
  if (aspect === "all") {
    lines.push(formatPrinciplesSection(product));
  }

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export function registerDesignReference(server: McpServer): void {
  server.tool(
    "design_reference",
    "Get industry-specific design reference knowledge from well-known products (Stripe, Linear, Shopify, Duolingo, etc.). Returns exact color values, spacing, typography, layout patterns, and design principles. Use when building UI for a specific industry.",
    {
      industry: z
        .enum(["fintech", "saas", "ecommerce", "healthcare", "education", "social", "developer_tools"])
        .describe("Target industry — determines which reference products are shown"),
      page_type: z
        .string()
        .optional()
        .describe("Optional page type for targeted guidance (e.g., 'dashboard', 'landing', 'settings', 'pricing', 'onboarding')"),
      aspect: z
        .enum(["color", "layout", "typography", "components", "spacing", "all"])
        .default("all")
        .describe("Which design aspect to focus on — use 'all' for a comprehensive reference"),
    },
    async ({ industry, page_type, aspect }) => {
      const data = INDUSTRIES[industry];
      if (!data) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Industry "${industry}" not found. Available: ${Object.keys(INDUSTRIES).join(", ")}`,
            },
          ],
        };
      }

      const lines = [
        `# Design Reference: ${industry.charAt(0).toUpperCase() + industry.slice(1).replace("_", " ")}`,
        ``,
        `## Industry Overview`,
        ``,
        data.overview,
        ``,
      ];

      // Add page-type-specific guidance if requested
      if (page_type) {
        const pageKey = page_type.toLowerCase().replace(/[^a-z]/g, "");
        const guidance = data.pageGuidance[pageKey];
        if (guidance) {
          lines.push(`## Page Guidance: ${page_type}`);
          lines.push(``);
          lines.push(guidance);
          lines.push(``);
        } else {
          const availablePages = Object.keys(data.pageGuidance).join(", ");
          lines.push(`> No specific guidance for "${page_type}" page type. Available: ${availablePages}`);
          lines.push(``);
        }
      }

      lines.push(`---`);
      lines.push(``);

      // Format each product reference
      for (const product of Object.values(data.products)) {
        lines.push(formatProduct(product, aspect));
        lines.push(`---`);
        lines.push(``);
      }

      return {
        content: [{ type: "text" as const, text: lines.join("\n") }],
      };
    }
  );
}
