import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

// ---------------------------------------------------------------------------
// Material Design 3 – Google's design system
// ---------------------------------------------------------------------------
const MATERIAL3_GUIDELINES = `# Material Design 3 — Reference Guide

## Color System
- **Structure:** primary, on-primary, primary-container, on-primary-container,
  secondary, on-secondary, secondary-container, on-secondary-container,
  tertiary, on-tertiary, tertiary-container, on-tertiary-container,
  error, on-error, error-container, on-error-container,
  surface, on-surface, surface-variant, on-surface-variant,
  outline, outline-variant, inverse-surface, inverse-on-surface,
  inverse-primary, shadow, scrim
- **Tonal palettes:** 13 tones — 0, 10, 20, 25, 30, 35, 40, 50, 60, 70, 80, 90, 95, 98, 99, 100
- **Key colors for light theme:**
  - Primary: tone 40 | On-Primary: tone 100 | Primary-Container: tone 90 | On-Primary-Container: tone 10
  - Surface: tone 98 | On-Surface: tone 10 | Surface-Variant: tone 90 | On-Surface-Variant: tone 30
  - Outline: tone 50 | Outline-Variant: tone 80
- **Key colors for dark theme:**
  - Primary: tone 80 | On-Primary: tone 20 | Primary-Container: tone 30 | On-Primary-Container: tone 90
  - Surface: tone 6 | On-Surface: tone 90 | Surface-Variant: tone 30 | On-Surface-Variant: tone 80
  - Outline: tone 60 | Outline-Variant: tone 30

## Typography Scale (Material 3 Type Scale)
| Role             | Font     | Weight   | Size   | Line Height | Letter Spacing |
|------------------|----------|----------|--------|-------------|----------------|
| Display Large    | Roboto   | 400      | 57px   | 64px        | -0.25px        |
| Display Medium   | Roboto   | 400      | 45px   | 52px        | 0px            |
| Display Small    | Roboto   | 400      | 36px   | 44px        | 0px            |
| Headline Large   | Roboto   | 400      | 32px   | 40px        | 0px            |
| Headline Medium  | Roboto   | 400      | 28px   | 36px        | 0px            |
| Headline Small   | Roboto   | 400      | 24px   | 32px        | 0px            |
| Title Large      | Roboto   | 400      | 22px   | 28px        | 0px            |
| Title Medium     | Roboto   | 500      | 16px   | 24px        | 0.15px         |
| Title Small      | Roboto   | 500      | 14px   | 20px        | 0.1px          |
| Body Large       | Roboto   | 400      | 16px   | 24px        | 0.5px          |
| Body Medium      | Roboto   | 400      | 14px   | 20px        | 0.25px         |
| Body Small       | Roboto   | 400      | 12px   | 16px        | 0.4px          |
| Label Large      | Roboto   | 500      | 14px   | 20px        | 0.1px          |
| Label Medium     | Roboto   | 500      | 12px   | 16px        | 0.5px          |
| Label Small      | Roboto   | 500      | 11px   | 16px        | 0.5px          |

## Spacing & Layout
- **Base unit:** 4dp (density-independent pixels)
- **Spacing scale:** 4, 8, 12, 16, 24, 32, 48, 64dp
- **Grid columns:** 4 (compact), 8 (medium), 12 (expanded)
- **Margins:** 16dp (compact), 24dp (medium), 24dp (expanded)
- **Gutter:** 8dp (compact), 16dp (medium), 24dp (expanded)
- **Breakpoints:** compact <600dp, medium 600-839dp, expanded 840dp+

## Elevation / Shadow
- **Level 0:** 0dp — surface
- **Level 1:** 1dp — card, search bar (surface-tint at 5% opacity)
- **Level 2:** 3dp — FAB, bottom sheet (surface-tint at 8% opacity)
- **Level 3:** 6dp — nav drawer, modal bottom sheet (surface-tint at 11% opacity)
- **Level 4:** 8dp — menu, side sheet (surface-tint at 12% opacity)
- **Level 5:** 12dp — dialog (surface-tint at 14% opacity)
- **Note:** M3 uses surface-tint color overlay instead of drop shadows

## Shape (Border Radius)
- **None:** 0dp — full-screen dialogs
- **Extra Small:** 4dp — text fields, menus
- **Small:** 8dp — chips, snackbar
- **Medium:** 12dp — cards, dialogs, FABs
- **Large:** 16dp — bottom sheets, nav drawers
- **Extra Large:** 28dp — large FABs, search view
- **Full:** 50% — badges, buttons (pill), icon containers

## Button
- **Height:** 40dp
- **Min touch target:** 48x48dp
- **Horizontal padding:** 24dp (text), 16dp (icon + text, start); 24dp (end)
- **Corner radius:** 20dp (full / pill)
- **Font:** Label Large (14px, weight 500, 0.1px spacing)
- **Variants:** Filled, Outlined, Text, Elevated, Tonal
- **Icon size in button:** 18dp, 8dp gap between icon and text

## Card
- **Corner radius:** 12dp (medium shape)
- **Padding:** 16dp internal
- **Variants:** Elevated (level 1 tint), Filled (surface-variant bg), Outlined (1dp outline)
- **Min width:** none specified — content-driven
- **Spacing between cards:** 8dp

## Text Field
- **Height:** 56dp
- **Corner radius:** 4dp top (filled), 4dp all (outlined)
- **Label font:** Body Small (12px) when focused, Body Large (16px) when resting
- **Horizontal padding:** 16dp
- **Helper/error text:** Body Small, 4dp below field
- **Variants:** Filled (bottom border 1dp, 2dp on focus), Outlined (1dp border, 2dp on focus)

## Navigation
- **Bottom nav height:** 80dp, icon 24dp, label Body Small, active indicator 64x32dp pill
- **Nav rail width:** 80dp, icon 24dp, label Label Medium
- **Nav drawer width:** 360dp max
- **Top app bar height:** 64dp (small), center-aligned title or left-aligned
`;

// ---------------------------------------------------------------------------
// Apple Human Interface Guidelines
// ---------------------------------------------------------------------------
const APPLE_HIG_GUIDELINES = `# Apple Human Interface Guidelines — Reference Guide

## Color System
- **System colors (iOS light/dark):**
  - Blue: #007AFF / #0A84FF
  - Green: #34C759 / #30D158
  - Indigo: #5856D6 / #5E5CE6
  - Orange: #FF9500 / #FF9F0A
  - Pink: #FF2D55 / #FF375F
  - Purple: #AF52DE / #BF5AF2
  - Red: #FF3B30 / #FF453A
  - Teal: #5AC8FA / #64D2FF
  - Yellow: #FFCC00 / #FFD60A
- **Grays (iOS light/dark):**
  - Label: #000000 / #FFFFFF
  - Secondary Label: #3C3C43 60% / #EBEBF5 60%
  - Tertiary Label: #3C3C43 30% / #EBEBF5 30%
  - Quaternary Label: #3C3C43 18% / #EBEBF5 16%
  - System Fill: #787880 20% / #787880 36%
  - Secondary Fill: #787880 16% / #787880 32%
  - Tertiary Fill: #767680 12% / #767680 24%
  - Quaternary Fill: #747480 8% / #747480 18%
- **Background (iOS light/dark):**
  - Primary: #FFFFFF / #000000
  - Secondary: #F2F2F7 / #1C1C1E
  - Tertiary: #FFFFFF / #2C2C2E
  - Grouped primary: #F2F2F7 / #000000
  - Grouped secondary: #FFFFFF / #1C1C1E
  - Grouped tertiary: #F2F2F7 / #2C2C2E

## Typography (iOS — San Francisco / SF Pro)
| Style              | Size  | Weight    | Leading |
|--------------------|-------|-----------|---------|
| Large Title        | 34pt  | Regular   | 41pt    |
| Title 1            | 28pt  | Regular   | 34pt    |
| Title 2            | 22pt  | Regular   | 28pt    |
| Title 3            | 20pt  | Regular   | 25pt    |
| Headline           | 17pt  | Semibold  | 22pt    |
| Body               | 17pt  | Regular   | 22pt    |
| Callout            | 16pt  | Regular   | 21pt    |
| Subheadline        | 15pt  | Regular   | 20pt    |
| Footnote           | 13pt  | Regular   | 18pt    |
| Caption 1          | 12pt  | Regular   | 16pt    |
| Caption 2          | 11pt  | Regular   | 13pt    |
- **macOS** uses the same scale but SF Pro at slightly different optical sizes
- **Note:** 1pt = 1px at @1x, 2px at @2x, 3px at @3x

## Spacing & Layout
- **Standard margins:** 16pt (compact), 20pt (regular)
- **Base unit:** 8pt grid recommended
- **Content spacing:** 8pt, 16pt, 20pt common increments
- **Safe area insets (iPhone):** top 59pt (notch/dynamic island), bottom 34pt (home indicator)
- **Minimum tappable area:** 44x44pt (CRITICAL — never go below this)

## Buttons
- **Min touch target:** 44x44pt
- **System button height:** 50pt (prominent), 34pt (small)
- **Corner radius:** continuous (squircle), typically 10-12pt for buttons, varies with size
- **Styles:** Filled, Gray, Tinted, Borderless, Pull-down, Pop-up
- **Font:** Body (17pt) or Headline (17pt semibold) for prominent

## Cards / Grouped Content
- **Corner radius:** 10pt (standard), 13pt (inset grouped table)
- **Inset margin:** 16pt from screen edge
- **Section spacing:** 35pt between grouped sections
- **Row height:** 44pt minimum
- **Separator inset:** 16pt from leading edge (or 60pt if preceded by image)

## Text Fields
- **Height:** 36pt (standard), 44pt with label
- **Corner radius:** 10pt (rounded style)
- **Horizontal padding:** 8pt inner
- **Placeholder:** Secondary label color
- **Clear button:** appears when text is entered

## Navigation
- **Navigation bar height:** 44pt (standard), 96pt (large title)
- **Tab bar height:** 49pt
- **Tab bar icon size:** 25x25pt (regular), 18x18pt (compact)
- **Toolbar height:** 44pt
- **Sidebar width:** 320pt (iPad), adjustable (macOS)

## Sheets & Modals
- **Corner radius:** 10pt top corners
- **Detents:** small (25%), medium (50%), large (full)
- **Grab handle:** 36x5pt, 5pt from top
- **Standard sheet max width:** 540pt (iPad)

## Icons
- **App icon:** 1024x1024px (App Store), rendered at various sizes
- **SF Symbols:** Preferred for all UI icons
- **Tab bar icons:** 25x25pt (@1x)
- **Toolbar icons:** 22x22pt (@1x)
- **Navigation bar icons:** 22x22pt (@1x)
`;

// ---------------------------------------------------------------------------
// shadcn/ui – React / Tailwind design system
// ---------------------------------------------------------------------------
const SHADCN_GUIDELINES = `# shadcn/ui — Reference Guide

## Color System (CSS Variables — HSL format)
- **Default theme (light):**
  - \`--background: 0 0% 100%\` (white)
  - \`--foreground: 240 10% 3.9%\` (near-black)
  - \`--card: 0 0% 100%\`
  - \`--card-foreground: 240 10% 3.9%\`
  - \`--popover: 0 0% 100%\`
  - \`--popover-foreground: 240 10% 3.9%\`
  - \`--primary: 240 5.9% 10%\`
  - \`--primary-foreground: 0 0% 98%\`
  - \`--secondary: 240 4.8% 95.9%\`
  - \`--secondary-foreground: 240 5.9% 10%\`
  - \`--muted: 240 4.8% 95.9%\`
  - \`--muted-foreground: 240 3.8% 46.1%\`
  - \`--accent: 240 4.8% 95.9%\`
  - \`--accent-foreground: 240 5.9% 10%\`
  - \`--destructive: 0 84.2% 60.2%\`
  - \`--destructive-foreground: 0 0% 98%\`
  - \`--border: 240 5.9% 90%\`
  - \`--input: 240 5.9% 90%\`
  - \`--ring: 240 5.9% 10%\`
  - \`--radius: 0.5rem\` (8px base radius)
- **Default theme (dark):**
  - \`--background: 240 10% 3.9%\`
  - \`--foreground: 0 0% 98%\`
  - \`--primary: 0 0% 98%\`
  - \`--primary-foreground: 240 5.9% 10%\`
  - \`--border: 240 3.7% 15.9%\`
  - \`--ring: 240 4.9% 83.9%\`

## Typography
- **Font family:** \`font-sans\` — defaults to Inter or system stack
  \`font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif\`
- **Scale (Tailwind):**
  - \`text-xs\`: 12px / 16px
  - \`text-sm\`: 14px / 20px
  - \`text-base\`: 16px / 24px
  - \`text-lg\`: 18px / 28px
  - \`text-xl\`: 20px / 28px
  - \`text-2xl\`: 24px / 32px
  - \`text-3xl\`: 30px / 36px
  - \`text-4xl\`: 36px / 40px
- **Heading defaults:** h1: text-4xl font-bold tracking-tight, h2: text-3xl font-semibold tracking-tight, h3: text-2xl font-semibold tracking-tight, h4: text-xl font-semibold tracking-tight
- **Body:** text-sm or text-base, text-muted-foreground for secondary
- **Inline code:** \`font-mono text-sm bg-muted px-1.5 py-0.5 rounded\`

## Spacing
- **Base unit:** 4px (Tailwind default: 1 unit = 0.25rem = 4px)
- **Common gaps:** gap-1 (4px), gap-2 (8px), gap-3 (12px), gap-4 (16px), gap-6 (24px), gap-8 (32px)
- **Card padding:** p-6 (24px)
- **Section spacing:** space-y-4 (16px) to space-y-8 (32px)
- **Form field spacing:** space-y-2 (8px) between label and input, space-y-4 (16px) between fields

## Border Radius
- **Base \`--radius\`:** 0.5rem (8px)
- **Applied:** \`rounded-lg\` = var(--radius) = 8px, \`rounded-md\` = calc(var(--radius) - 2px) = 6px, \`rounded-sm\` = calc(var(--radius) - 4px) = 4px
- **Cards:** rounded-lg (8px) with border
- **Buttons:** rounded-md (6px)
- **Inputs:** rounded-md (6px)
- **Badges:** rounded-full (pill)
- **Avatars:** rounded-full

## Button
- **Height:** h-10 (40px) default, h-9 (36px) sm, h-11 (44px) lg, h-10 w-10 (40x40px) icon
- **Padding:** px-4 py-2 (default), px-3 (sm), px-8 (lg)
- **Font:** text-sm font-medium
- **Border radius:** rounded-md (6px)
- **Variants:**
  - default: bg-primary text-primary-foreground hover:bg-primary/90
  - destructive: bg-destructive text-destructive-foreground hover:bg-destructive/90
  - outline: border border-input bg-background hover:bg-accent hover:text-accent-foreground
  - secondary: bg-secondary text-secondary-foreground hover:bg-secondary/80
  - ghost: hover:bg-accent hover:text-accent-foreground
  - link: text-primary underline-offset-4 hover:underline
- **Disabled:** pointer-events-none opacity-50

## Card
- **Structure:** Card > CardHeader > (CardTitle + CardDescription) + CardContent + CardFooter
- **Border radius:** rounded-lg (8px)
- **Border:** 1px solid hsl(var(--border))
- **Background:** bg-card text-card-foreground
- **Shadow:** shadow-sm
- **CardHeader padding:** p-6
- **CardContent padding:** p-6 pt-0
- **CardFooter padding:** p-6 pt-0, flex items-center

## Input / Text Field
- **Height:** h-10 (40px)
- **Padding:** px-3 py-2
- **Border:** border border-input (1px solid)
- **Border radius:** rounded-md (6px)
- **Font:** text-sm
- **Focus:** focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
- **Placeholder:** text-muted-foreground
- **Disabled:** disabled:cursor-not-allowed disabled:opacity-50

## Dialog / Modal
- **Max width:** max-w-lg (512px) default
- **Border radius:** rounded-lg (8px)
- **Padding:** p-6
- **Overlay:** bg-black/80
- **Animation:** fade in + slide up

## Table
- **Header:** h-12, text-left align-middle font-medium text-muted-foreground, px-4
- **Cell:** p-4 align-middle
- **Row border:** border-b
- **Hover:** hover:bg-muted/50

## Navigation
- **NavigationMenu trigger:** h-10, px-4 py-2, text-sm font-medium, rounded-md
- **Sidebar width:** w-64 (256px) expanded, w-16 (64px) collapsed
- **Breadcrumb separator:** ChevronRight, text-muted-foreground

## Shadows
- **shadow-sm:** 0 1px 2px 0 rgb(0 0 0 / 0.05)
- **shadow:** 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)
- **shadow-md:** 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)
- **shadow-lg:** 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)
`;

// ---------------------------------------------------------------------------
// Ant Design – Enterprise UI system
// ---------------------------------------------------------------------------
const ANT_DESIGN_GUIDELINES = `# Ant Design — Reference Guide

## Color System
- **Brand color:** #1677FF (Daybreak Blue)
- **Functional colors:**
  - Success: #52C41A
  - Warning: #FAAD14
  - Error: #FF4D4F
  - Info: #1677FF
- **Neutral palette:**
  - Title: rgba(0, 0, 0, 0.88)
  - Primary text: rgba(0, 0, 0, 0.88)
  - Secondary text: rgba(0, 0, 0, 0.65)
  - Disabled text: rgba(0, 0, 0, 0.25)
  - Border: #D9D9D9
  - Divider: rgba(5, 5, 5, 0.06)
  - Background: #F5F5F5
  - Table header bg: #FAFAFA
- **Dark mode neutrals:**
  - Background: #141414
  - Elevated bg: #1F1F1F
  - Border: #424242
  - Primary text: rgba(255, 255, 255, 0.85)
  - Secondary text: rgba(255, 255, 255, 0.65)
- **Color palette generation:** 10-shade scale per hue (blue-1 through blue-10), brand at shade 6

## Typography
- **Font family:** \`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif\`
- **Font sizes:**
  - 12px — Small / Caption / Help text
  - 14px — Body (default base size)
  - 16px — Subtitle / Large body
  - 20px — Heading 5 (h5)
  - 24px — Heading 4 (h4)
  - 30px — Heading 3 (h3)
  - 38px — Heading 2 (h2)
  - 46px — Heading 1 (h1)
- **Line heights:** 20px (12px), 22px (14px), 24px (16px), 28px (20px), 32px (24px), 38px (30px), 46px (38px), 54px (46px)
- **Font weight:** normal 400, medium 500, semibold 600, bold 700
- **Base font size:** 14px (IMPORTANT: not 16px like most systems)

## Spacing
- **Base unit:** 4px
- **Spacing scale:** 4, 8, 12, 16, 20, 24, 32, 48px
- **Compact/comfortable/spacious modes:** margin/padding scaled proportionally
- **Component margins:**
  - marginXS: 8px, marginSM: 12px, margin: 16px, marginMD: 20px, marginLG: 24px, marginXL: 32px, marginXXL: 48px
  - paddingXS: 8px, paddingSM: 12px, padding: 16px, paddingMD: 20px, paddingLG: 24px
- **Grid gutter:** 16px default (can be [horizontal, vertical])

## Border Radius
- **borderRadius:** 6px (default)
- **borderRadiusSM:** 4px (small components)
- **borderRadiusLG:** 8px (large components like cards, modals)
- **borderRadiusOuter:** 4px (outer elements)

## Button
- **Height:** 32px (default), 24px (small), 40px (large)
- **Padding:** 15px horizontal (default), 7px (small), 15px (large)
- **Font size:** 14px (default), 14px (small), 16px (large)
- **Border radius:** 6px
- **Min width:** none, but icon-only buttons are square (32x32, 24x24, 40x40)
- **Types:** Primary (filled brand), Default (outlined), Dashed, Text, Link
- **Danger variant:** red tones for each type
- **Disabled:** opacity-based, cursor: not-allowed

## Card
- **Border radius:** 8px (borderRadiusLG)
- **Padding:** 24px body, 24px header (with bottom border)
- **Header:** 16px font size, font-weight 600, min-height 56px
- **Border:** 1px solid #F0F0F0
- **Shadow (hoverable):** 0 1px 2px -2px rgba(0,0,0,0.16), 0 3px 6px 0 rgba(0,0,0,0.12), 0 5px 12px 4px rgba(0,0,0,0.09)
- **Sizes:** default (24px padding), small (12px padding)

## Input / Text Field
- **Height:** 32px (default), 24px (small), 40px (large)
- **Padding:** 4px 11px (default), 0px 7px (small), 7px 11px (large)
- **Border:** 1px solid #D9D9D9
- **Border radius:** 6px
- **Focus border:** brand color (#1677FF), box-shadow: 0 0 0 2px rgba(22,119,255,0.06)
- **Error border:** #FF4D4F, shadow: 0 0 0 2px rgba(255,38,5,0.06)
- **Font size:** 14px (default), 14px (small), 16px (large)

## Table
- **Header bg:** #FAFAFA, font-weight 600, padding 16px
- **Cell padding:** 16px (default), 8px 16px (small), 8px (compact via size="small")
- **Row hover:** #FAFAFA
- **Selected row:** light primary tint
- **Border:** bottom 1px solid #F0F0F0
- **Sticky header supported**

## Modal / Dialog
- **Width:** 520px default
- **Border radius:** 8px
- **Padding:** 20px 24px body, 16px 24px header/footer
- **Mask:** rgba(0, 0, 0, 0.45)
- **Header:** 16px font size, font-weight 600
- **Close button:** top-right, 22px

## Navigation
- **Top Menu height:** 46px (horizontal), item padding: 0 20px
- **Sider width:** 200px (default), 80px (collapsed)
- **Menu item height:** 40px, font-size 14px
- **Breadcrumb separator:** "/" by default, font-size 14px, color secondary text
- **Tabs bar height:** 46px, tab padding: 12px 0, gap: 32px

## Message / Notification
- **Message:** top-center, auto-dismiss 3s, 14px, icon + text
- **Notification:** top-right, 384px width, 24px padding, border-radius 8px

## Layout
- **Header height:** 64px, background #001529 (dark) or #FFFFFF
- **Footer padding:** 24px 50px
- **Content padding:** 24px typically
- **Sider:** fixed left, 200px default
- **Breakpoints:** xs: 480px, sm: 576px, md: 768px, lg: 992px, xl: 1200px, xxl: 1600px
- **Grid columns:** 24
`;

// ---------------------------------------------------------------------------
// Knowledge base registry
// ---------------------------------------------------------------------------
export const DESIGN_SYSTEM_KNOWLEDGE: Record<
  string,
  { name: string; uri: string; description: string; content: string }
> = {
  material3: {
    name: "Material Design 3 Guidelines",
    uri: "devsigner://design-system/material3",
    description:
      "Google Material Design 3 reference — color, typography, spacing, elevation, shape, and component specs with exact values.",
    content: MATERIAL3_GUIDELINES,
  },
  apple_hig: {
    name: "Apple Human Interface Guidelines",
    uri: "devsigner://design-system/apple-hig",
    description:
      "Apple HIG reference — iOS/macOS colors, SF Pro typography, spacing, touch targets, and component specs with exact values.",
    content: APPLE_HIG_GUIDELINES,
  },
  shadcn: {
    name: "shadcn/ui Guidelines",
    uri: "devsigner://design-system/shadcn",
    description:
      "shadcn/ui reference — Tailwind CSS variables, typography, spacing, border-radius, component classes and exact values.",
    content: SHADCN_GUIDELINES,
  },
  ant_design: {
    name: "Ant Design Guidelines",
    uri: "devsigner://design-system/ant-design",
    description:
      "Ant Design reference — enterprise UI specs for color, typography, spacing, border-radius, and component dimensions with exact values.",
    content: ANT_DESIGN_GUIDELINES,
  },
};

// ---------------------------------------------------------------------------
// Register all design system resources with the MCP server
// ---------------------------------------------------------------------------
export function registerDesignSystemResources(server: McpServer): void {
  for (const [, system] of Object.entries(DESIGN_SYSTEM_KNOWLEDGE)) {
    server.resource(
      system.name,
      system.uri,
      { description: system.description, mimeType: "text/markdown" },
      async () => ({
        contents: [
          {
            uri: system.uri,
            mimeType: "text/markdown",
            text: system.content,
          },
        ],
      })
    );
  }
}
