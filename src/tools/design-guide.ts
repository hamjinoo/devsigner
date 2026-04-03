import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Component-level knowledge per design system
// ---------------------------------------------------------------------------

type DesignSystemId = "material3" | "apple_hig" | "shadcn" | "ant_design";

interface ComponentGuide {
  [component: string]: string;
}

const MATERIAL3_COMPONENTS: ComponentGuide = {
  button: `## Material Design 3 — Button

**Variants:** Filled, Outlined, Text, Elevated, Tonal

### Filled Button (primary action)
- Height: 40dp
- Corner radius: 20dp (full pill)
- Horizontal padding: 24dp (text only), 16dp (leading icon side) + 24dp (trailing)
- Font: Label Large — 14px, weight 500, letter-spacing 0.1px
- Color: on-primary on primary
- Disabled: surface at 12% opacity, on-surface at 38% opacity

### Outlined Button
- Same dimensions as Filled
- Border: 1dp solid outline color
- Background: transparent
- Text: primary color

### Text Button
- Height: 40dp, padding: 12dp horizontal
- No background, no border
- Text: primary color

### Icon Button
- Size: 40x40dp (standard), 48x48dp (large)
- Icon: 24dp
- Container shape: full circle

### FAB (Floating Action Button)
- Small: 40x40dp, icon 24dp, radius 12dp
- Regular: 56x56dp, icon 24dp, radius 16dp
- Large: 96x96dp, icon 36dp, radius 28dp
- Extended: height 56dp, radius 16dp, 16dp padding

### Touch Target
- MINIMUM 48x48dp — even if visual size is smaller, ensure the tap area is 48x48dp

### State Layers
- Hover: 8% opacity of content color
- Focus: 10% opacity
- Pressed: 10% opacity
- Dragged: 16% opacity`,

  card: `## Material Design 3 — Card

**Variants:** Elevated, Filled, Outlined

### Elevated Card
- Corner radius: 12dp (medium shape)
- Elevation: Level 1 (surface-tint at 5% opacity)
- Background: surface
- No border
- Padding: 16dp (content area)

### Filled Card
- Corner radius: 12dp
- Elevation: Level 0
- Background: surface-variant
- No border

### Outlined Card
- Corner radius: 12dp
- Elevation: Level 0
- Background: surface
- Border: 1dp solid outline-variant

### Layout Inside Card
- Image: edge-to-edge or with 16dp margin
- Header (title + subtitle): 16dp padding
- Body text: 16dp padding, 8dp below header
- Actions: 8dp padding, right-aligned or full-width
- Gap between cards in a grid: 8dp

### Sizing
- No enforced min/max width — content-driven
- Recommended: constrain with grid columns or max-width`,

  form: `## Material Design 3 — Form / Input Fields

### Text Field Variants
**Filled:**
- Height: 56dp
- Corner radius: 4dp top-left, 4dp top-right, 0 bottom
- Background: surface-variant
- Bottom border: 1dp (resting), 2dp (focused), primary color
- Horizontal padding: 16dp
- Label: Body Small (12px) floating above, Body Large (16px) resting

**Outlined:**
- Height: 56dp
- Corner radius: 4dp all corners
- Background: transparent
- Border: 1dp outline (resting), 2dp primary (focused)
- Horizontal padding: 16dp
- Label floats into border notch

### Supporting Text
- Position: 4dp below the text field
- Font: Body Small (12px)
- Error text: error color, replaces helper text

### Field Spacing
- Between fields: 16dp
- Between label group and field: 4dp (if using external label)
- Form section spacing: 24dp

### Validation
- Error: border/indicator becomes error color, supporting text becomes error
- Character counter: right-aligned, Body Small

### Selectors
- Checkbox: 18x18dp, touch target 48x48dp, corner radius 2dp
- Radio: 20x20dp, touch target 48x48dp
- Switch: 52x32dp, thumb 24dp (off) / 28dp (on)`,

  navigation: `## Material Design 3 — Navigation

### Bottom Navigation Bar
- Height: 80dp
- Items: 3-5
- Icon: 24dp (active), active indicator: 64x32dp pill with secondary-container color
- Label: Label Medium (12px, weight 500)
- Active: icon + label shown, indicator visible
- Inactive: icon + label shown, no indicator

### Navigation Rail (Tablet/Desktop)
- Width: 80dp
- Icon: 24dp, active indicator: 56x32dp pill
- Label: Label Medium, below icon
- Optional FAB at top
- Top padding: 44dp to first item

### Navigation Drawer
- Width: 360dp max
- Item height: 56dp
- Active indicator: full width, 28dp corner radius, secondary-container fill
- Icon: 24dp, 12dp gap to label
- Label: Label Large (14px, weight 500)
- Section header: Title Small (14px, weight 500), 18dp leading padding

### Top App Bar
- **Small:** height 64dp, title: Title Large (22px)
- **Center-aligned:** height 64dp, title centered
- **Medium:** height 112dp, title moves to bottom on scroll
- **Large:** height 152dp, title prominent at bottom
- Leading icon: 24dp, 16dp from edge
- Trailing icons: 24dp, 12dp gap between

### Tabs
- Height: 48dp
- Active indicator: 3dp bottom border, primary color
- Label: Title Small (14px, weight 500)
- Min tab width: 90dp
- Icon + label tab height: 64dp`,

  typography: `## Material Design 3 — Typography

### Complete Type Scale

| Role             | Size | Weight | Line Height | Letter Spacing | Use Case                    |
|------------------|------|--------|-------------|----------------|-----------------------------|
| Display Large    | 57px | 400    | 64px        | -0.25px        | Hero text, splash screens   |
| Display Medium   | 45px | 400    | 52px        | 0px            | Large feature text          |
| Display Small    | 36px | 400    | 44px        | 0px            | Prominent headings          |
| Headline Large   | 32px | 400    | 40px        | 0px            | Page titles                 |
| Headline Medium  | 28px | 400    | 36px        | 0px            | Section titles              |
| Headline Small   | 24px | 400    | 32px        | 0px            | Card titles                 |
| Title Large      | 22px | 400    | 28px        | 0px            | App bar titles              |
| Title Medium     | 16px | 500    | 24px        | 0.15px         | Subsections                 |
| Title Small      | 14px | 500    | 20px        | 0.1px          | Tab labels, nav drawer      |
| Body Large       | 16px | 400    | 24px        | 0.5px          | Primary body text           |
| Body Medium      | 14px | 400    | 20px        | 0.25px         | Default body text           |
| Body Small       | 12px | 400    | 16px        | 0.4px          | Captions, helper text       |
| Label Large      | 14px | 500    | 20px        | 0.1px          | Buttons, menu items         |
| Label Medium     | 12px | 500    | 16px        | 0.5px          | Nav labels, small buttons   |
| Label Small      | 11px | 500    | 16px        | 0.5px          | Badges, timestamps          |

### Font
- Default: Roboto (Android), system font (web)
- Recommended web: Roboto, Inter, or system-ui stack

### Usage Rules
- Max 3 type sizes per screen/section
- Use weight (400 vs 500) for hierarchy, not just size
- Display styles: short text only, never paragraphs
- Body styles: paragraphs, long-form content`,

  color: `## Material Design 3 — Color

### Color Roles (Light Theme)
| Role                    | Tone | Usage                                     |
|-------------------------|------|-------------------------------------------|
| primary                 | 40   | Key buttons, active states, links         |
| on-primary              | 100  | Text/icons on primary                     |
| primary-container       | 90   | Filled tonal buttons, chips, backgrounds  |
| on-primary-container    | 10   | Text/icons on primary-container           |
| secondary               | 40   | Less prominent buttons, selections        |
| on-secondary            | 100  | Text/icons on secondary                   |
| secondary-container     | 90   | Navigation indicator, toggled chips       |
| on-secondary-container  | 10   | Text/icons on secondary-container         |
| tertiary                | 40   | Complementary accents                     |
| tertiary-container      | 90   | Tertiary backgrounds                      |
| error                   | 40   | Error states, destructive actions         |
| error-container         | 90   | Error backgrounds                         |
| surface                 | 98   | Page background                           |
| on-surface              | 10   | Primary text                              |
| surface-variant         | 90   | Card backgrounds, input fills             |
| on-surface-variant      | 30   | Secondary text, icons                     |
| outline                 | 50   | Borders, dividers                         |
| outline-variant         | 80   | Subtle borders                            |

### Dark Theme — Same roles, different tones
- primary: 80, on-primary: 20, primary-container: 30, on-primary-container: 90
- surface: 6, on-surface: 90
- outline: 60, outline-variant: 30

### Tonal Palette Generation
1. Choose a source/seed color
2. Generate 13 tones: 0, 10, 20, 25, 30, 35, 40, 50, 60, 70, 80, 90, 95, 98, 99, 100
3. Map tones to roles per theme (light uses lower tones for containers, dark uses higher)
4. Ensure 4.5:1 contrast between on-X and X for text

### Custom Colors
- You can add custom colors beyond primary/secondary/tertiary
- Each custom color generates its own container/on-container pairs
- Harmonize custom colors with the primary hue using Material Color Utilities`,

  spacing: `## Material Design 3 — Spacing & Layout

### Base Grid
- **Base unit:** 4dp
- **Spacing scale:** 4, 8, 12, 16, 24, 32, 48, 64dp
- **Preferred increment:** 8dp for most component spacing

### Layout Grid
| Window Class | Columns | Margins | Gutter |
|-------------|---------|---------|--------|
| Compact     | 4       | 16dp    | 8dp    |
| Medium      | 8       | 24dp    | 16dp   |
| Expanded    | 12      | 24dp    | 24dp   |

### Breakpoints
- Compact: < 600dp (phones portrait)
- Medium: 600 - 839dp (tablets portrait, foldables)
- Expanded: 840dp+ (tablets landscape, desktops)

### Component Spacing Patterns
- **Card grid gap:** 8dp
- **List item padding:** 16dp horizontal, 8-12dp vertical
- **Section divider margin:** 16dp top and bottom
- **Dialog padding:** 24dp
- **Bottom sheet padding:** 16dp horizontal
- **FAB from edge:** 16dp
- **Content max width:** 1040dp recommended for readability

### Density
- Default: 0dp adjustment
- Comfortable: -4dp (tighter)
- Compact: -8dp (densest)
- Applied to component heights: e.g., button 40dp default, 36dp comfortable, 32dp compact`,

  dialog: `## Material Design 3 — Dialog

### Basic Dialog
- Corner radius: 28dp (extra large shape)
- Min width: 280dp, max width: 560dp
- Elevation: Level 3 (surface-tint at 11% opacity)
- Background: surface-container-high
- Padding: 24dp all sides
- Icon (optional): 24dp, centered above title
- Title: Headline Small (24px, weight 400), centered if icon present
- Body: Body Medium (14px), 16dp below title
- Actions: right-aligned, 8dp gap between buttons, 24dp below body
- Divider (optional): 1dp, full width above actions

### Full-Screen Dialog (Mobile)
- Corner radius: 0dp
- Top app bar with close icon (leading) and action button (trailing)
- Content area: full width, scrollable

### Scrim (Overlay)
- Color: scrim at 32% opacity
- Tapping scrim dismisses non-critical dialogs`,

  chip: `## Material Design 3 — Chips

### Variants
- **Assist:** icon + label, elevated or flat
- **Filter:** checkmark + label, toggleable
- **Input:** avatar/icon + label + remove button
- **Suggestion:** label only, action chip

### Dimensions
- Height: 32dp
- Corner radius: 8dp (small shape)
- Horizontal padding: 16dp (label only), 8dp (with leading icon)
- Icon size: 18dp
- Label: Label Large (14px, weight 500)
- Gap between icon and label: 8dp
- Remove button (input chip): 18dp, trailing

### States
- Unselected: outline 1dp, transparent background
- Selected: secondary-container fill, no outline
- Disabled: surface at 12%, content at 38%

### Layout
- Chip group gap: 8dp
- Wrap to next line with 8dp row gap`,
};

const APPLE_HIG_COMPONENTS: ComponentGuide = {
  button: `## Apple HIG — Button

### System Button Styles
- **Filled (Prominent):** height ~50pt, background: tint color, white label, continuous corner radius ~12pt
- **Gray:** height ~50pt, background: systemFill, tint label
- **Tinted:** height ~50pt, background: tint at 15%, tint label
- **Borderless:** no background, tint label, used inline
- **Small button:** height ~34pt
- **Pull-down / Pop-up:** disclosure indicator attached

### Touch Target
- **MINIMUM 44x44pt** — this is non-negotiable on iOS
- Even if button visual is smaller, the tappable area must be at least 44x44pt
- macOS minimum: 20x20pt (but 24x24pt recommended)

### Corner Radius
- Uses continuous corners (squircle, not circular arcs)
- Typical: ~12pt for large buttons, ~8pt for small
- Capsule/pill: corner radius = height / 2

### Typography
- Prominent buttons: 17pt Semibold (Headline)
- Standard buttons: 17pt Regular (Body)
- Small buttons: 15pt Regular (Subheadline)

### Spacing
- Horizontal padding: ~20pt (prominent), ~16pt (standard)
- Between stacked buttons: 8pt
- Between side-by-side buttons: 8pt
- Leading/trailing margin from screen edge: 16pt

### Destructive Actions
- Use red (system red: #FF3B30)
- Place destructive option on the left (alert) or use swipe-to-delete pattern
- Require confirmation for irreversible actions`,

  card: `## Apple HIG — Card / Grouped Content

### Inset Grouped Table (Card-like appearance)
- Corner radius: 10pt (continuous corners / squircle)
- Background: system background (secondary grouped)
- Inset from screen edges: 16pt (compact width), 20pt (regular width)
- Section spacing: 35pt between sections
- Row height: 44pt minimum
- Row separator inset: 16pt leading (or 60pt if preceded by image)

### Content Cards (Custom)
- Corner radius: 10-16pt (continuous)
- Padding: 16pt internal
- Shadow: subtle, e.g., 0 2px 8px rgba(0,0,0,0.1)
- Background: elevated surface (secondary system background)
- Spacing between cards: 16pt

### Widgets (iOS)
- Small: 155x155pt
- Medium: 329x155pt
- Large: 329x345pt
- Corner radius: 22pt (matches app icon radius)
- Content padding: 16pt

### Key Principle
- Cards are NOT a primary pattern in Apple's design — prefer lists/grouped tables for data
- Use cards for: media content, featured items, dashboard widgets`,

  form: `## Apple HIG — Forms / Text Fields

### Text Field
- Height: 36pt (standard iOS)
- Corner radius: 10pt (rounded style)
- Background: quaternary system fill
- Horizontal padding: 8pt inner
- Font: Body (17pt Regular)
- Placeholder: secondary label color
- Clear button: appears on the right when text entered

### Grouped Form Layout (Recommended)
- Use inset grouped table style
- Each field occupies a row (min 44pt)
- Label on the left, input on the right (or label above)
- Section headers: 13pt uppercase, secondary label color
- Section footers: 13pt, secondary label color, explanatory text

### Spacing
- Between form sections: 35pt
- Between label and field (if stacked): 4pt
- Field-to-field within section: 0pt (separated by hairline dividers)
- Inset from screen edge: 16pt

### Validation
- Inline below the field or in section footer
- Use system red for errors
- Provide clear, specific error messages (not just "Invalid")

### Keyboard
- Use appropriate keyboard type: .emailAddress, .numberPad, .URL, etc.
- Return key label should match action: "Next", "Done", "Search"
- Place primary action above keyboard or use toolbar`,

  navigation: `## Apple HIG — Navigation

### Navigation Bar
- Height: 44pt (standard), 96pt (large title)
- Large title: 34pt Bold, left-aligned, collapses on scroll to 17pt
- Standard title: 17pt Semibold, centered
- Back button: chevron + previous title (or "Back")
- Tint color for buttons/icons

### Tab Bar
- Height: 49pt (plus safe area)
- Max 5 tabs (use "More" tab if needed)
- Icon: 25x25pt (regular), 18x18pt (compact)
- Label: Caption 2 (11pt), 2pt below icon
- Active: tint color | Inactive: secondary label color
- Badge: system red, min 18pt diameter

### Toolbar
- Height: 44pt
- Placed at bottom of screen
- Items: SF Symbols, tint color, evenly distributed
- Can include text buttons

### Sidebar (iPad / macOS)
- Width: 320pt (iPad), flexible (macOS)
- Row height: 44pt (iPad), 28pt (macOS)
- Collapsible with gesture or button
- Hierarchical navigation support

### Page Control (Dots)
- Dot size: 7pt
- Active: primary label color
- Inactive: secondary label color
- Spacing: 16pt between dots
- Position: 8pt above safe area bottom`,

  typography: `## Apple HIG — Typography

### iOS Type Scale (SF Pro)
| Style           | Size  | Weight    | Leading | Use Case                        |
|-----------------|-------|-----------|---------|---------------------------------|
| Large Title     | 34pt  | Regular   | 41pt    | Top-level screen titles         |
| Title 1         | 28pt  | Regular   | 34pt    | Section headers, onboarding     |
| Title 2         | 22pt  | Regular   | 28pt    | Subsection headers              |
| Title 3         | 20pt  | Regular   | 25pt    | Tertiary headings               |
| Headline        | 17pt  | Semibold  | 22pt    | Table row titles, emphasis      |
| Body            | 17pt  | Regular   | 22pt    | Primary content text            |
| Callout         | 16pt  | Regular   | 21pt    | Secondary content               |
| Subheadline     | 15pt  | Regular   | 20pt    | Smaller labels, metadata        |
| Footnote        | 13pt  | Regular   | 18pt    | Secondary info, timestamps      |
| Caption 1       | 12pt  | Regular   | 16pt    | Annotations, image captions     |
| Caption 2       | 11pt  | Regular   | 13pt    | Tab bar labels, tiny text       |

### Font
- **iOS/macOS:** SF Pro (system default — never ship it, it's automatic)
- **Monospace:** SF Mono
- **Rounded:** SF Pro Rounded (for playful/casual contexts)
- **Dynamic Type:** always support — users can scale from ~80% to ~310%

### Best Practices
- Body text: minimum 17pt on iOS (smaller feels strained)
- Avoid light font weights below 20pt
- Line length: 70-80 characters max for readability
- Use Semibold or Bold for emphasis, not size changes
- MINIMUM 11pt for any visible text`,

  color: `## Apple HIG — Color

### System Colors (iOS, Light / Dark)
| Color   | Light     | Dark      | Usage                           |
|---------|-----------|-----------|---------------------------------|
| Blue    | #007AFF   | #0A84FF  | Links, primary actions, tint    |
| Green   | #34C759   | #30D158  | Success, positive state         |
| Indigo  | #5856D6   | #5E5CE6  | Alternative primary             |
| Orange  | #FF9500   | #FF9F0A  | Warnings (non-critical)         |
| Pink    | #FF2D55   | #FF375F  | Favorites, hearts               |
| Purple  | #AF52DE   | #BF5AF2  | Creative/premium features       |
| Red     | #FF3B30   | #FF453A  | Errors, destructive actions     |
| Teal    | #5AC8FA   | #64D2FF  | Communication, real-time        |
| Yellow  | #FFCC00   | #FFD60A  | Alerts, starring                |

### Semantic Colors
- **Label:** #000000 / #FFFFFF (primary text)
- **Secondary Label:** #3C3C43 at 60% / #EBEBF5 at 60%
- **Tertiary Label:** #3C3C43 at 30% / #EBEBF5 at 30%
- **Separator:** #3C3C43 at 29% / #545458 at 65%
- **System Fill:** #787880 at 20% / #787880 at 36%
- **System Background:** #FFFFFF / #000000
- **Secondary Background:** #F2F2F7 / #1C1C1E
- **Tertiary Background:** #FFFFFF / #2C2C2E

### Accessibility
- Increased Contrast mode: system colors shift to higher contrast variants
- Never rely on color alone — always pair with shape, icon, or text
- Test with color blindness simulators (protanopia, deuteranopia, tritanopia)`,

  spacing: `## Apple HIG — Spacing & Layout

### Base Grid
- **Recommended base:** 8pt
- **Common increments:** 4, 8, 12, 16, 20, 24, 32pt

### Standard Margins
- Compact width (iPhone): 16pt leading/trailing
- Regular width (iPad): 20pt leading/trailing
- Readable content width (iPad): system auto-limits to ~672pt

### Safe Areas
- **iPhone (Dynamic Island):** top ~59pt, bottom ~34pt
- **iPhone SE:** top 20pt, bottom 0pt
- **iPad:** minimal safe area, but respect margins

### Component Spacing
- Navigation bar to content: 0pt (content starts under nav bar if using large title)
- Between list rows: 0pt (separated by 0.5pt hairline)
- Grouped section gap: 35pt
- Between buttons (stacked): 8pt
- Tab bar icons to label: 2pt
- Standard cell left inset (with image): 60pt

### Minimum Touch Targets
- **44x44pt** — absolute minimum for ANY tappable element
- Prefer 48pt+ for primary actions
- This is a WCAG 2.5.5 Level AAA requirement as well`,

  dialog: `## Apple HIG — Alerts, Sheets & Modals

### Alert Dialog
- Width: 270pt (iPhone), up to 300pt (iPad)
- Corner radius: 14pt (continuous)
- Title: 17pt Semibold, centered
- Message: 13pt Regular, centered
- Button height: 44pt
- Button separator: 0.5pt hairline
- 2 buttons: side-by-side, destructive on left, default on right (bold)
- 3+ buttons: stacked vertically

### Sheet (Bottom Sheet / Modal)
- Corner radius: 10pt top corners
- Detents: small (~25%), medium (~50%), large (~100%)
- Grab indicator: 36x5pt, centered, 5pt from top, rounded
- Background: system background
- Max width on iPad: 540pt

### Popover (iPad)
- Corner radius: 13pt
- Arrow: ~22pt wide, points to source
- Shadow: 0 10px 30px rgba(0,0,0,0.15)
- Max width: 375pt

### Action Sheet
- Corner radius: 14pt per section
- Gap between sections: 8pt
- Button height: 57pt (large), 44pt (standard)
- Cancel button: separate section at bottom, Bold weight`,
};

const SHADCN_COMPONENTS: ComponentGuide = {
  button: `## shadcn/ui — Button

### Sizes
| Size    | Class      | Height | Padding      |
|---------|------------|--------|--------------|
| default | \`h-10\`     | 40px   | px-4 py-2    |
| sm      | \`h-9\`      | 36px   | px-3         |
| lg      | \`h-11\`     | 44px   | px-8         |
| icon    | \`h-10 w-10\`| 40x40px| p-0 (center) |

### Variants (Tailwind classes)
\`\`\`
default:     bg-primary text-primary-foreground hover:bg-primary/90
destructive: bg-destructive text-destructive-foreground hover:bg-destructive/90
outline:     border border-input bg-background hover:bg-accent hover:text-accent-foreground
secondary:   bg-secondary text-secondary-foreground hover:bg-secondary/80
ghost:       hover:bg-accent hover:text-accent-foreground
link:        text-primary underline-offset-4 hover:underline
\`\`\`

### Common Classes
\`\`\`tsx
className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
\`\`\`

### Border Radius
- \`rounded-md\` = calc(var(--radius) - 2px) = 6px

### Usage Pattern
\`\`\`tsx
import { Button } from "@/components/ui/button"

<Button variant="default" size="default">Click me</Button>
<Button variant="destructive" size="sm">Delete</Button>
<Button variant="outline" size="lg">Cancel</Button>
<Button variant="ghost" size="icon"><Icon /></Button>
\`\`\``,

  card: `## shadcn/ui — Card

### Structure
\`\`\`tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
  <CardFooter>
    {/* Actions */}
  </CardFooter>
</Card>
\`\`\`

### Styles
- **Card:** \`rounded-lg border bg-card text-card-foreground shadow-sm\`
  - Border radius: 8px (rounded-lg = var(--radius))
  - Border: 1px solid hsl(var(--border))
  - Shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05)
- **CardHeader:** \`flex flex-col space-y-1.5 p-6\`
  - Padding: 24px, 6px gap between title and description
- **CardTitle:** \`text-2xl font-semibold leading-none tracking-tight\`
  - Font size: 24px, weight 600
- **CardDescription:** \`text-sm text-muted-foreground\`
  - Font size: 14px, color: hsl(var(--muted-foreground))
- **CardContent:** \`p-6 pt-0\`
  - Padding: 24px sides/bottom, 0 top (flows from header)
- **CardFooter:** \`flex items-center p-6 pt-0\`
  - Padding: 24px sides/bottom, 0 top, items centered

### Spacing Between Cards
- Grid: \`grid gap-4\` (16px) or \`gap-6\` (24px)
- Stack: \`space-y-4\` (16px)`,

  form: `## shadcn/ui — Form / Input

### Input Field
\`\`\`tsx
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" placeholder="you@example.com" />
</div>
\`\`\`

### Input Styles
- \`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background\`
- Height: 40px (h-10)
- Padding: 12px horizontal, 8px vertical
- Border radius: 6px (rounded-md)
- Border: 1px solid hsl(var(--input))
- Focus: \`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2\`
- Placeholder: \`text-muted-foreground\`
- Disabled: \`disabled:cursor-not-allowed disabled:opacity-50\`

### Form Layout (with react-hook-form)
\`\`\`tsx
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

<FormField
  control={form.control}
  name="username"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Username</FormLabel>
      <FormControl>
        <Input placeholder="shadcn" {...field} />
      </FormControl>
      <FormDescription>Your public display name.</FormDescription>
      <FormMessage /> {/* Validation error */}
    </FormItem>
  )}
/>
\`\`\`

### Spacing
- Label to input: \`space-y-2\` (8px)
- Between form fields: \`space-y-4\` (16px) or \`space-y-6\` (24px)
- Form description: \`text-sm text-muted-foreground\` — 14px
- Error message: \`text-sm font-medium text-destructive\` — 14px

### Textarea
- \`min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm\`

### Select
- Trigger: same height/radius as Input (h-10, rounded-md)
- Content: \`rounded-md border bg-popover text-popover-foreground shadow-md\``,

  navigation: `## shadcn/ui — Navigation

### NavigationMenu
\`\`\`tsx
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "@/components/ui/navigation-menu"
\`\`\`
- Trigger: \`h-10 px-4 py-2 text-sm font-medium rounded-md\`
- Content panel: \`rounded-md border bg-popover shadow-lg\`
- Viewport width: auto, min 200px

### Sidebar (new)
- Expanded width: \`w-64\` (256px)
- Collapsed width: \`w-16\` (64px)
- Background: \`bg-sidebar\`
- Item height: 36px
- Item padding: \`px-3 py-2\`
- Section gap: \`space-y-4\`
- Group label: \`text-xs font-semibold text-muted-foreground px-3 mb-1\`

### Breadcrumb
\`\`\`tsx
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
\`\`\`
- Font: text-sm
- Separator: ChevronRight icon, text-muted-foreground
- Current page: text-foreground (not a link)
- Links: text-muted-foreground hover:text-foreground

### Tabs
\`\`\`tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
\`\`\`
- TabsList: \`inline-flex h-10 items-center rounded-md bg-muted p-1\`
- TabsTrigger: \`rounded-sm px-3 py-1.5 text-sm font-medium\`
- Active: \`bg-background text-foreground shadow-sm\`
- Inactive: \`text-muted-foreground\`

### Sheet (Side Panel)
- Width: default varies, typically \`sm:max-w-sm\` (384px)
- Uses slide animation from side`,

  typography: `## shadcn/ui — Typography

### Heading Defaults
\`\`\`tsx
<h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">Heading 1</h1>
<h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight">Heading 2</h2>
<h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">Heading 3</h3>
<h4 className="scroll-m-20 text-xl font-semibold tracking-tight">Heading 4</h4>
\`\`\`

### Tailwind Text Scale
| Class      | Size  | Line Height |
|------------|-------|-------------|
| text-xs    | 12px  | 16px        |
| text-sm    | 14px  | 20px        |
| text-base  | 16px  | 24px        |
| text-lg    | 18px  | 28px        |
| text-xl    | 20px  | 28px        |
| text-2xl   | 24px  | 32px        |
| text-3xl   | 30px  | 36px        |
| text-4xl   | 36px  | 40px        |
| text-5xl   | 48px  | 1           |
| text-6xl   | 60px  | 1           |

### Other Type Elements
- **Paragraph:** \`leading-7 [&:not(:first-child)]:mt-6\`
- **Lead text:** \`text-xl text-muted-foreground\`
- **Large text:** \`text-lg font-semibold\`
- **Small text:** \`text-sm font-medium leading-none\`
- **Muted text:** \`text-sm text-muted-foreground\`
- **Inline code:** \`relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold\`
- **Blockquote:** \`mt-6 border-l-2 pl-6 italic\`

### Font Stack
\`\`\`css
font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
\`\`\``,

  color: `## shadcn/ui — Color System

### CSS Variable Structure (HSL)
All colors defined as HSL values without \`hsl()\` wrapper, used as \`hsl(var(--name))\`.

### Default Theme — Light
\`\`\`css
:root {
  --background: 0 0% 100%;           /* white */
  --foreground: 240 10% 3.9%;        /* near-black */
  --card: 0 0% 100%;
  --card-foreground: 240 10% 3.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 240 10% 3.9%;
  --primary: 240 5.9% 10%;           /* dark slate */
  --primary-foreground: 0 0% 98%;    /* near-white */
  --secondary: 240 4.8% 95.9%;       /* light gray */
  --secondary-foreground: 240 5.9% 10%;
  --muted: 240 4.8% 95.9%;
  --muted-foreground: 240 3.8% 46.1%;/* medium gray */
  --accent: 240 4.8% 95.9%;
  --accent-foreground: 240 5.9% 10%;
  --destructive: 0 84.2% 60.2%;      /* red */
  --destructive-foreground: 0 0% 98%;
  --border: 240 5.9% 90%;
  --input: 240 5.9% 90%;
  --ring: 240 5.9% 10%;
  --radius: 0.5rem;                   /* 8px */
}
\`\`\`

### Default Theme — Dark
\`\`\`css
.dark {
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;
  --card: 240 10% 3.9%;
  --card-foreground: 0 0% 98%;
  --popover: 240 10% 3.9%;
  --popover-foreground: 0 0% 98%;
  --primary: 0 0% 98%;
  --primary-foreground: 240 5.9% 10%;
  --secondary: 240 3.7% 15.9%;
  --secondary-foreground: 0 0% 98%;
  --muted: 240 3.7% 15.9%;
  --muted-foreground: 240 5% 64.9%;
  --accent: 240 3.7% 15.9%;
  --accent-foreground: 0 0% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 0 0% 98%;
  --border: 240 3.7% 15.9%;
  --input: 240 3.7% 15.9%;
  --ring: 240 4.9% 83.9%;
}
\`\`\`

### How to Customize
1. Use https://ui.shadcn.com/themes to generate a palette
2. Paste CSS variables into \`globals.css\`
3. All components automatically pick up the new palette via \`hsl(var(--name))\`

### Adding Custom Colors
\`\`\`css
:root {
  --success: 142 76% 36%;
  --success-foreground: 0 0% 100%;
  --warning: 38 92% 50%;
  --warning-foreground: 0 0% 0%;
}
\`\`\`
Then extend in \`tailwind.config.js\`:
\`\`\`js
colors: {
  success: "hsl(var(--success))",
  "success-foreground": "hsl(var(--success-foreground))",
}
\`\`\``,

  spacing: `## shadcn/ui — Spacing

### Tailwind Spacing Scale (4px base)
| Class | Value  | Pixels |
|-------|--------|--------|
| 0     | 0      | 0px    |
| 0.5   | 0.125rem | 2px  |
| 1     | 0.25rem  | 4px  |
| 1.5   | 0.375rem | 6px  |
| 2     | 0.5rem   | 8px  |
| 2.5   | 0.625rem | 10px |
| 3     | 0.75rem  | 12px |
| 4     | 1rem     | 16px |
| 5     | 1.25rem  | 20px |
| 6     | 1.5rem   | 24px |
| 8     | 2rem     | 32px |
| 10    | 2.5rem   | 40px |
| 12    | 3rem     | 48px |
| 16    | 4rem     | 64px |
| 20    | 5rem     | 80px |
| 24    | 6rem     | 96px |

### Common Component Spacing
- **Card padding:** p-6 (24px)
- **Card header gap:** space-y-1.5 (6px between title/desc)
- **Form field gap:** space-y-2 (8px label-to-input), space-y-4 (16px between fields)
- **Button group gap:** gap-2 (8px) or gap-4 (16px)
- **Section spacing:** space-y-6 (24px) to space-y-8 (32px)
- **Page content padding:** p-6 (24px) or p-8 (32px)
- **Dialog padding:** p-6 (24px)
- **Sidebar section gap:** space-y-4 (16px)
- **Table cell padding:** p-4 (16px)
- **Badge padding:** px-2.5 py-0.5 (10px / 2px)

### Layout Patterns
\`\`\`tsx
{/* Page with sidebar */}
<div className="flex min-h-screen">
  <aside className="w-64 border-r p-4">...</aside>
  <main className="flex-1 p-8">...</main>
</div>

{/* Card grid */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <Card>...</Card>
</div>

{/* Form layout */}
<form className="space-y-6 max-w-md">
  <div className="space-y-2">...</div>
</form>
\`\`\``,

  dialog: `## shadcn/ui — Dialog / Modal

### Usage
\`\`\`tsx
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

<Dialog>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent className="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>Edit profile</DialogTitle>
      <DialogDescription>Make changes to your profile.</DialogDescription>
    </DialogHeader>
    {/* Content */}
    <DialogFooter>
      <Button type="submit">Save changes</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
\`\`\`

### Styles
- **Overlay:** \`fixed inset-0 z-50 bg-black/80\`
- **Content:** \`fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background p-6 shadow-lg\`
- Max width: \`sm:max-w-lg\` (512px) by default
- Border radius: rounded-lg (8px)
- Padding: p-6 (24px)
- **Header:** \`flex flex-col space-y-1.5 text-center sm:text-left\`
- **Title:** \`text-lg font-semibold leading-none tracking-tight\`
- **Description:** \`text-sm text-muted-foreground\`
- **Footer:** \`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2\`
- **Close button:** top-right, 16x16 icon

### Alert Dialog (Confirmation)
\`\`\`tsx
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
\`\`\`
- Cannot be dismissed by clicking overlay
- Footer: Cancel (left) + Action (right)`,
};

const ANT_DESIGN_COMPONENTS: ComponentGuide = {
  button: `## Ant Design — Button

### Sizes
| Size    | Height | Padding (H) | Font Size |
|---------|--------|-------------|-----------|
| small   | 24px   | 7px         | 14px      |
| default | 32px   | 15px        | 14px      |
| large   | 40px   | 15px        | 16px      |

### Types
- **Primary:** bg #1677FF, text white, hover #4096FF
- **Default:** bg white, border #D9D9D9, text rgba(0,0,0,0.88), hover: border #4096FF, text #4096FF
- **Dashed:** same as Default but dashed border
- **Text:** no bg, no border, text rgba(0,0,0,0.88), hover: bg rgba(0,0,0,0.06)
- **Link:** no bg, no border, text #1677FF, hover: #69B1FF

### Danger Variant
- Primary danger: bg #FF4D4F, hover #FF7875
- Default danger: border #FF4D4F, text #FF4D4F
- Text danger: text #FF4D4F, hover bg rgba(255,38,5,0.06)

### Other Properties
- Border radius: 6px
- Icon-only: square (32x32, 24x24, 40x40)
- Loading: spinner replaces icon, button disabled during load
- Block: width 100%
- Disabled: opacity pattern, cursor not-allowed

### Code
\`\`\`tsx
import { Button } from 'antd';

<Button type="primary">Primary</Button>
<Button>Default</Button>
<Button type="dashed">Dashed</Button>
<Button type="text">Text</Button>
<Button type="link">Link</Button>
<Button type="primary" danger>Danger</Button>
<Button type="primary" size="large">Large</Button>
\`\`\``,

  card: `## Ant Design — Card

### Styles
- **Border radius:** 8px (borderRadiusLG)
- **Border:** 1px solid #F0F0F0
- **Background:** #FFFFFF
- **Body padding:** 24px (default), 12px (size="small")
- **Header:** 24px padding, border-bottom 1px solid #F0F0F0, min-height 56px
- **Title font:** 16px, font-weight 600
- **Extra (top-right action):** 14px, link-colored

### Hoverable Card Shadow
\`\`\`css
box-shadow: 0 1px 2px -2px rgba(0, 0, 0, 0.16),
            0 3px 6px 0 rgba(0, 0, 0, 0.12),
            0 5px 12px 4px rgba(0, 0, 0, 0.09);
\`\`\`

### Variants
- **Default:** bordered, no shadow
- **Bordered={false}:** no border, shadow appears
- **Hoverable:** shadow on hover
- **Loading:** skeleton placeholder

### Grid Layout
- Use \`<Card.Grid>\` for internal grid, width percentage-based
- Default grid item: 33.33% width, border-right and border-bottom

### Code
\`\`\`tsx
import { Card } from 'antd';

<Card title="Card Title" extra={<a href="#">More</a>}>
  <p>Card content</p>
</Card>

<Card size="small" title="Small Card">
  <p>Compact content</p>
</Card>
\`\`\``,

  form: `## Ant Design — Form / Input

### Input Sizes
| Size    | Height | Padding        | Font Size |
|---------|--------|----------------|-----------|
| small   | 24px   | 0px 7px        | 14px      |
| default | 32px   | 4px 11px       | 14px      |
| large   | 40px   | 7px 11px       | 16px      |

### Input Styles
- Border: 1px solid #D9D9D9
- Border radius: 6px
- Focus: border #1677FF, box-shadow 0 0 0 2px rgba(22,119,255,0.06)
- Error: border #FF4D4F, box-shadow 0 0 0 2px rgba(255,38,5,0.06)
- Warning: border #FAAD14, box-shadow 0 0 0 2px rgba(250,173,20,0.06)
- Disabled: bg #F5F5F5, cursor not-allowed

### Form Layout
\`\`\`tsx
import { Form, Input, Button } from 'antd';

<Form layout="vertical" requiredMark="optional">
  <Form.Item label="Username" name="username" rules={[{ required: true }]}>
    <Input placeholder="Enter username" />
  </Form.Item>
  <Form.Item label="Password" name="password" rules={[{ required: true }]}>
    <Input.Password placeholder="Enter password" />
  </Form.Item>
  <Form.Item>
    <Button type="primary" htmlType="submit" block>Submit</Button>
  </Form.Item>
</Form>
\`\`\`

### Layout Options
- **horizontal:** label left, control right. Label width: 8 cols default
- **vertical:** label above, control below (recommended for mobile)
- **inline:** all items in one row

### Spacing
- Between form items: 24px (marginBottom on Form.Item)
- Compact mode: 16px between items
- Label to control: 8px (vertical), same line (horizontal)
- Help/error text: 14px, 2px below field`,

  navigation: `## Ant Design — Navigation

### Top Menu
- Height: 46px (horizontal mode)
- Item padding: 0 20px
- Font: 14px, color rgba(0,0,0,0.88)
- Active: border-bottom 2px solid #1677FF, text #1677FF
- Hover: text #1677FF
- Dark mode: bg #001529, text rgba(255,255,255,0.65)

### Sider (Sidebar)
- Width: 200px default, 80px collapsed
- Background: #001529 (dark) or #FFFFFF (light)
- Menu item height: 40px
- Menu item padding: 0 16px (collapsed: centered)
- Submenu indent: 24px per level
- Selected item: bg rgba(22,119,255,0.06), text #1677FF (light theme)

### Breadcrumb
- Font: 14px
- Separator: "/" (default), color rgba(0,0,0,0.45)
- Last item: color rgba(0,0,0,0.88)
- Links: color rgba(0,0,0,0.45), hover rgba(0,0,0,0.88)

### Tabs
- Height: 46px
- Tab padding: 12px 0
- Tab gap: 32px
- Active: text #1677FF, border-bottom 2px
- Ink bar: 2px, primary color
- Card type: bordered tabs with background

### Pagination
- Height: 32px (default), 24px (small)
- Min width per item: 32px
- Border radius: 6px
- Active: border #1677FF, text #1677FF

### Steps
- Icon size: 32px
- Connector line: 1px solid #F0F0F0
- Active: primary color
- Finished: success green (#52C41A)

### Code
\`\`\`tsx
import { Menu, Layout } from 'antd';
const { Sider } = Layout;

<Sider width={200} collapsible>
  <Menu mode="inline" defaultSelectedKeys={['1']} items={menuItems} />
</Sider>
\`\`\``,

  typography: `## Ant Design — Typography

### Font Family
\`\`\`css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
\`\`\`

### Type Scale
| Element | Size | Line Height | Weight |
|---------|------|-------------|--------|
| h1      | 38px | 46px        | 600    |
| h2      | 30px | 38px        | 600    |
| h3      | 24px | 32px        | 600    |
| h4      | 20px | 28px        | 600    |
| h5      | 16px | 24px        | 600    |
| Body    | 14px | 22px        | 400    |
| Small   | 12px | 20px        | 400    |

**IMPORTANT:** Ant Design uses 14px as base, not 16px.

### Text Colors
- Primary: rgba(0, 0, 0, 0.88) — main text
- Secondary: rgba(0, 0, 0, 0.65) — descriptions, help text
- Disabled: rgba(0, 0, 0, 0.25)
- Success: #52C41A
- Warning: #FAAD14
- Error: #FF4D4F
- Link: #1677FF

### Typography Component
\`\`\`tsx
import { Typography } from 'antd';
const { Title, Text, Paragraph, Link } = Typography;

<Title level={1}>h1. Ant Design</Title>
<Title level={2}>h2. Ant Design</Title>
<Text>Default text (14px)</Text>
<Text type="secondary">Secondary text</Text>
<Text type="danger">Error text</Text>
<Text strong>Bold text</Text>
<Paragraph>Body paragraph with 14px base size.</Paragraph>
\`\`\`

### Monospace
\`\`\`css
font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
\`\`\``,

  color: `## Ant Design — Color System

### Brand & Functional Colors
| Role    | Color   | Hover   | Active  |
|---------|---------|---------|---------|
| Primary | #1677FF | #4096FF | #0958D9 |
| Success | #52C41A | #73D13D | #389E0D |
| Warning | #FAAD14 | #FFC53D | #D48806 |
| Error   | #FF4D4F | #FF7875 | #CF1322 |
| Info    | #1677FF | #4096FF | #0958D9 |

### Neutral Palette
| Token             | Light                    | Dark                     |
|-------------------|--------------------------|--------------------------|
| Text primary      | rgba(0,0,0,0.88)        | rgba(255,255,255,0.85)   |
| Text secondary    | rgba(0,0,0,0.65)        | rgba(255,255,255,0.65)   |
| Text tertiary     | rgba(0,0,0,0.45)        | rgba(255,255,255,0.45)   |
| Text disabled     | rgba(0,0,0,0.25)        | rgba(255,255,255,0.25)   |
| Border            | #D9D9D9                  | #424242                  |
| Divider           | rgba(5,5,5,0.06)        | rgba(253,253,253,0.12)   |
| Background        | #FFFFFF                  | #141414                  |
| Secondary bg      | #F5F5F5                  | #1F1F1F                  |
| Elevated bg       | #FFFFFF                  | #262626                  |
| Table header bg   | #FAFAFA                  | #1D1D1D                  |

### Color Palette (10-shade system)
Each functional color generates a 10-shade palette. Example for blue (primary):
- blue-1: #E6F4FF (lightest background)
- blue-2: #BAE0FF
- blue-3: #91CAFF
- blue-4: #69B1FF
- blue-5: #4096FF (hover)
- blue-6: #1677FF (brand/default)
- blue-7: #0958D9 (active/pressed)
- blue-8: #003EB3
- blue-9: #002C8C
- blue-10: #001D66 (darkest)

### Customization (Design Token)
\`\`\`tsx
import { ConfigProvider } from 'antd';

<ConfigProvider theme={{
  token: {
    colorPrimary: '#1677FF',
    borderRadius: 6,
    fontSize: 14,
  },
}}>
  <App />
</ConfigProvider>
\`\`\``,

  spacing: `## Ant Design — Spacing

### Base Unit: 4px

### Spacing Tokens
| Token       | Value |
|-------------|-------|
| marginXXS   | 4px   |
| marginXS    | 8px   |
| marginSM    | 12px  |
| margin       | 16px  |
| marginMD    | 20px  |
| marginLG    | 24px  |
| marginXL    | 32px  |
| marginXXL   | 48px  |
| paddingXXS  | 4px   |
| paddingXS   | 8px   |
| paddingSM   | 12px  |
| padding      | 16px  |
| paddingMD   | 20px  |
| paddingLG   | 24px  |
| paddingXL   | 32px  |

### Grid System
- **24 columns** (not 12)
- Default gutter: 16px
- Responsive gutter: \`gutter={[16, 16]}\` for [horizontal, vertical]
- Breakpoints: xs 480, sm 576, md 768, lg 992, xl 1200, xxl 1600

### Layout Spacing
- Header height: 64px
- Sider width: 200px (default), 80px (collapsed)
- Content padding: 24px (typical)
- Footer padding: 24px 50px
- Card body padding: 24px (default), 12px (small)
- Modal body padding: 20px 24px
- Form item margin-bottom: 24px
- Table cell padding: 16px (default), 8px 16px (small)

### Compact Mode
\`\`\`tsx
import { ConfigProvider, Space } from 'antd';

<ConfigProvider componentSize="small">
  {/* All child components use compact sizing */}
</ConfigProvider>
\`\`\`

### Space Component
\`\`\`tsx
<Space size="small">    {/* 8px gap */}
<Space size="middle">   {/* 16px gap */}
<Space size="large">    {/* 24px gap */}
<Space size={[8, 16]}>  {/* custom [horizontal, vertical] */}
\`\`\``,

  table: `## Ant Design — Table

### Cell Padding
- Default: 16px
- Small (\`size="small"\`): 8px 16px
- Middle (\`size="middle"\`): 12px 8px

### Header
- Background: #FAFAFA
- Font weight: 600
- Color: rgba(0,0,0,0.88)
- Border bottom: 1px solid #F0F0F0

### Rows
- Height: auto (content-driven), min ~55px with default padding
- Hover: background #FAFAFA
- Selected: light primary tint
- Stripe (odd rows): #FAFAFA
- Border: bottom 1px solid #F0F0F0

### Fixed Header/Column
- Sticky header with \`scroll={{ y: 400 }}\`
- Fixed columns with \`fixed: 'left'\` or \`fixed: 'right'\`
- Shadow on fixed column edge

### Pagination
- Default position: bottom-right
- Size: default 32px height, small 24px
- Page size options: [10, 20, 50, 100]

### Code
\`\`\`tsx
import { Table } from 'antd';

<Table
  dataSource={data}
  columns={columns}
  size="default"
  pagination={{ pageSize: 10 }}
  scroll={{ x: 1200, y: 500 }}
  bordered
/>
\`\`\``,
};

// ---------------------------------------------------------------------------
// System lookup map
// ---------------------------------------------------------------------------
const SYSTEMS: Record<DesignSystemId, { label: string; components: ComponentGuide }> = {
  material3: { label: "Material Design 3", components: MATERIAL3_COMPONENTS },
  apple_hig: { label: "Apple HIG", components: APPLE_HIG_COMPONENTS },
  shadcn: { label: "shadcn/ui", components: SHADCN_COMPONENTS },
  ant_design: { label: "Ant Design", components: ANT_DESIGN_COMPONENTS },
};

// ---------------------------------------------------------------------------
// Fuzzy component matching
// ---------------------------------------------------------------------------
const COMPONENT_ALIASES: Record<string, string[]> = {
  button: ["button", "btn", "cta", "action"],
  card: ["card", "tile", "panel"],
  form: ["form", "input", "text field", "textfield", "textarea", "select", "checkbox", "radio", "switch", "field"],
  navigation: ["navigation", "nav", "menu", "sidebar", "tab", "tabs", "breadcrumb", "header", "appbar", "app bar", "navbar", "tab bar", "tabbar", "bottom nav"],
  typography: ["typography", "type", "font", "text", "heading", "title", "body", "label", "display"],
  color: ["color", "colour", "palette", "theme", "token", "hue", "tint", "shade"],
  spacing: ["spacing", "space", "margin", "padding", "gap", "grid", "layout", "gutter", "breakpoint"],
  dialog: ["dialog", "modal", "sheet", "alert", "popup", "popover", "overlay", "drawer"],
  chip: ["chip", "tag", "badge", "pill"],
  table: ["table", "data grid", "datagrid", "list", "data table"],
};

function resolveComponent(query: string): string | null {
  const lower = query.toLowerCase().trim();
  for (const [canonical, aliases] of Object.entries(COMPONENT_ALIASES)) {
    if (aliases.some((a) => lower.includes(a))) {
      return canonical;
    }
  }
  return null;
}

function pickSystem(query: string): DesignSystemId | null {
  const lower = query.toLowerCase();
  if (lower.includes("material") || lower.includes("google") || lower.includes("m3") || lower.includes("android")) return "material3";
  if (lower.includes("apple") || lower.includes("hig") || lower.includes("ios") || lower.includes("macos") || lower.includes("iphone") || lower.includes("ipad") || lower.includes("swift")) return "apple_hig";
  if (lower.includes("shadcn") || lower.includes("tailwind") || lower.includes("radix") || lower.includes("next")) return "shadcn";
  if (lower.includes("ant") || lower.includes("antd") || lower.includes("enterprise")) return "ant_design";
  return null;
}

// ---------------------------------------------------------------------------
// Tool registration
// ---------------------------------------------------------------------------
export function registerDesignGuide(server: McpServer): void {
  server.tool(
    "design_guide",
    "Get specific, copy-paste-ready design guidelines from major design systems (Material Design 3, Apple HIG, shadcn/ui, Ant Design). Ask about any component or pattern and get exact values for sizes, spacing, colors, border radius, and more.",
    {
      system: z
        .enum(["material3", "apple_hig", "shadcn", "ant_design", "auto"])
        .default("auto")
        .describe(
          "Which design system to query. Use 'auto' to infer from context or get a comparison across systems."
        ),
      component: z
        .string()
        .describe(
          "The component or pattern to look up (e.g., 'button', 'card', 'form', 'navigation', 'typography', 'color', 'spacing', 'dialog', 'table')"
        ),
    },
    async ({ system, component }) => {
      const resolvedComponent = resolveComponent(component);

      // If system is "auto", try to infer or return a multi-system comparison
      const systemIds: DesignSystemId[] =
        system === "auto"
          ? (() => {
              const inferred = pickSystem(component);
              return inferred ? [inferred] : (["material3", "apple_hig", "shadcn", "ant_design"] as DesignSystemId[]);
            })()
          : [system as DesignSystemId];

      if (!resolvedComponent) {
        // Unknown component — list what we know about
        const knownComponents = Object.keys(COMPONENT_ALIASES).join(", ");
        return {
          content: [
            {
              type: "text" as const,
              text: [
                `# Design Guide`,
                ``,
                `I don't have specific guidelines for "${component}" yet.`,
                ``,
                `**Available topics:** ${knownComponents}`,
                ``,
                `**Available systems:** Material Design 3, Apple HIG, shadcn/ui, Ant Design`,
                ``,
                `Try asking about one of these topics, e.g.:`,
                `- \`component: "button"\` — sizes, variants, touch targets`,
                `- \`component: "card"\` — border-radius, padding, shadow`,
                `- \`component: "spacing"\` — grid system, spacing scale, breakpoints`,
                `- \`component: "color"\` — palettes, tokens, semantic colors`,
              ].join("\n"),
            },
          ],
        };
      }

      const sections: string[] = [];

      for (const sysId of systemIds) {
        const sys = SYSTEMS[sysId];
        const guide = sys.components[resolvedComponent];
        if (guide) {
          sections.push(guide);
        } else {
          sections.push(
            `## ${sys.label} — ${resolvedComponent}\n\nNo specific guidelines available for "${resolvedComponent}" in ${sys.label}. Try: ${Object.keys(sys.components).join(", ")}`
          );
        }
      }

      const header =
        systemIds.length === 1
          ? `# Design Guide: ${component}`
          : `# Design Guide: ${component} — Cross-System Comparison`;

      const text = [header, ``, ...sections].join("\n\n");

      return {
        content: [{ type: "text" as const, text }],
      };
    }
  );
}
