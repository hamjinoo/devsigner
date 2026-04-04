<p align="center">
  <img src="https://img.shields.io/badge/MCP-Server-blue?style=for-the-badge" alt="MCP Server" />
  <img src="https://img.shields.io/badge/Tools-33-orange?style=for-the-badge" alt="33 Tools" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Figma-F24E1E?style=for-the-badge&logo=figma&logoColor=white" alt="Figma" />
  <img src="https://img.shields.io/badge/WCAG_2.1-AA%2FAAA-green?style=for-the-badge" alt="WCAG 2.1" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="MIT License" />
  <img src="https://img.shields.io/badge/PRs-Welcome-brightgreen?style=for-the-badge" alt="PRs Welcome" />
</p>

<h1 align="center">
  devsigner
</h1>

<p align="center">
  <strong>The complete design toolkit MCP server for developers who can't design.</strong>
  <br />
  33 tools. Analyze, generate, fix, iterate. From first pixel to Figma handoff.
</p>

<p align="center">
  <a href="#-quick-start">Quick Start</a> &bull;
  <a href="#-all-33-tools">Tools</a> &bull;
  <a href="#-design-session-flow">Session Flow</a> &bull;
  <a href="#-figma-integration">Figma</a> &bull;
  <a href="#-accessibility">Accessibility</a> &bull;
  <a href="#-how-it-works">How It Works</a> &bull;
  <a href="#-contributing">Contributing</a>
</p>

---

## The Problem

You're a developer. You can build anything. But your UIs look like this:

```
┌──────────────────────────────────────────────────┐
│  padding: 13px (why?)                            │
│  margin: 7px  (why not 8?)                       │
│                                                  │
│  ██████ #000000 text on #333333 bg               │
│  (can you even read this?)                       │
│                                                  │
│  font-size: 13px, 14px, 15px, 17px               │
│  (pick a scale, any scale)                       │
│                                                  │
│  z-index: 99999 (the classic)                    │
│                                                  │
│  "I'll just eyeball the spacing"                 │
│  (narrator: they should not have eyeballed it)   │
│                                                  │
│  Opens Figma → stares → closes Figma             │
└──────────────────────────────────────────────────┘
               Score: 23/100
```

You don't need a design degree. You need **devsigner** -- 33 MCP tools that review your UI, generate production-ready code, auto-fix issues, and even pull design specs straight from Figma.

---

## Quick Start

### Option 1: npx (recommended)

No install needed. Just add to your MCP client config:

**Claude Desktop** (`claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "devsigner": {
      "command": "npx",
      "args": ["-y", "devsigner"]
    }
  }
}
```

**Claude Code:**
```bash
claude mcp add devsigner -- npx -y devsigner
```

**Cursor / Windsurf:**
```json
{
  "mcpServers": {
    "devsigner": {
      "command": "npx",
      "args": ["-y", "devsigner"]
    }
  }
}
```

### Option 2: Install globally

```bash
npm install -g devsigner
```

Then add to your MCP config:
```json
{
  "mcpServers": {
    "devsigner": {
      "command": "devsigner"
    }
  }
}
```

### Option 3: From source

```bash
git clone https://github.com/hamjinoo/devsigner.git
cd devsigner
npm install
npm run build
```

```json
{
  "mcpServers": {
    "devsigner": {
      "command": "node",
      "args": ["/path/to/devsigner/dist/index.js"]
    }
  }
}
```

---

## All 33 Tools

### Analysis

| Tool | Description |
|------|-------------|
| `design_review` | Code-based design analysis with scoring. Paste your UI code, get a detailed report with a score out of 100. Checks spacing, color, typography, and layout. |
| `screenshot_review` | Visual review of existing screenshots. Point it at a screenshot and get design feedback on what the user actually sees. |
| `scan_project` | Auto-detect your project's tech stack and design patterns. Understands React, Vue, Svelte, Tailwind, CSS modules, and more. |
| `a11y_audit` | Full WCAG 2.1 accessibility compliance audit at A, AA, or AAA level. Catches contrast failures, missing labels, focus traps, and more. |
| `batch_review` | Scan entire project, review all UI files, aggregate score + file ranking. |

### Generation

| Tool | Description |
|------|-------------|
| `color_palette` | Generate complete color systems from a description. Includes semantic colors, dark mode, contrast validation, and outputs as CSS variables, Tailwind config, or design tokens. |
| `component_suggest` | 20+ well-designed component templates. Pricing cards, login forms, navbars, hero sections, dashboards, and more. Token-based and framework-ready. |
| `generate_page` | Full page generation. Landing pages, dashboards, pricing pages, login screens, settings panels, and 404 pages -- complete and production-ready. |
| `design_identity` | Product design personality system. Choose from 6 archetypes to generate a consistent visual identity: typography, colors, spacing, and tone. |
| `scaffold_project` | Generate complete project structure with tokens, components, pages. |
| `export_tokens` | Export design tokens as CSS, Tailwind, SCSS, JSON, Figma Tokens. |
| `generate_style_guide` | Auto-generate visual HTML style guide from identity. |
| `screenshot_to_code` | Screenshot to code generation via host LLM Vision. |

### Fixing

| Tool | Description |
|------|-------------|
| `design_fix` | Auto-correct design issues in your code. Three modes: **safe** (non-breaking only), **moderate** (visual improvements), **aggressive** (full redesign). |
| `design_iterate` | Automated render, review, fix, re-render loop. Hands-off iterative improvement until the score meets your target. |
| `suggest_animations` | Detect static UIs and suggest micro-interactions with code. |
| `design_compare` | Visual before/after comparison with score diff. |

### Visual

| Tool | Description |
|------|-------------|
| `render_and_review` | Render your code in a real Chrome browser, capture a screenshot, and get visual feedback on the actual rendered result. |
| `screenshot_review` | Analyze existing screenshots or mockups for design issues without needing the source code. |
| `live_preview` | Real-time local preview server with auto-refresh. |
| `responsive_preview` | Render at mobile/tablet/desktop simultaneously. |

### Knowledge

| Tool | Description |
|------|-------------|
| `design_guide` | Query Material Design 3, Apple HIG, shadcn, and Ant Design guidelines. Get authoritative answers on spacing, typography, color, and component patterns. |
| `design_reference` | 15+ real product design patterns across 7 industries. See how Stripe, Linear, Notion, and others solve the same UI problem you're facing. |

### Figma

| Tool | Description |
|------|-------------|
| `figma_inspect` | Read Figma files and extract the full design system: colors, typography, spacing, components, and layout structure. |
| `figma_to_code` | Convert Figma frames directly to code. Supports React, Vue, Svelte, and plain HTML/CSS output. |

### Session & Context

| Tool | Description |
|------|-------------|
| `design_session` | Start or resume persistent design sessions. Tracks your project's design state across conversations. |
| `save_identity` | Save a generated design identity to your project for consistent reuse. |
| `log_review` | Track review scores over time. See your design quality trend across sessions. |
| `log_decision` | Record design decisions with reasoning. Build a searchable decision log for your team. |
| `design_feedback` | Teach devsigner what works and reject what doesn't. The system learns your preferences within a session. |

Configuration: Project-specific settings can be defined in `.devsignerrc.json`.

### Orchestration

| Tool | Description |
|------|-------------|
| `design_wizard` | Interactive step-by-step orchestrator that chains tools into a guided design workflow. |

---

## Design Review in Action

```
┌─────────────────────────────────────────────────────┐
│  Design Review Report                               │
│                                                     │
│  Framework: React          Score: ██████░░░░ 62/100 │
│                                                     │
│  ERRORS (must fix)                                  │
│  |-- [color] Contrast 1.66:1 -- needs 4.5:1 for AA │
│  |   -> Lighten text or darken background           │
│  |                                                  │
│  WARNINGS (should fix)                              │
│  |-- [spacing] padding: 13px not on 4px grid        │
│  |   -> Use 12px or 16px                            │
│  |-- [typography] line-height 1.1 too tight          │
│  |   -> Use 1.4-1.8 for body text                   │
│  |-- [layout] z-index: 999 is excessive              │
│  |   -> Use scale: 1, 10, 20, 30, 40, 50            │
│  |                                                  │
│  SUGGESTIONS (nice to have)                         │
│  |-- [color] Avoid pure #000000                     │
│  |   -> Try #1a1a1a for softer dark                 │
│  +-- [typography] 13px is unusual                   │
│      -> Use even sizes: 12px or 14px                │
└─────────────────────────────────────────────────────┘
```

---

## Design Session Flow

The real power of devsigner is the **iterative design loop**. Instead of a single review, devsigner can continuously improve your UI:

```
┌─────────────────────────────────────────────────────────────┐
│                    Iterative Design Loop                     │
│                                                             │
│   1. START SESSION                                          │
│      design_session("start")                                │
│      |                                                      │
│      v                                                      │
│   2. ESTABLISH IDENTITY                                     │
│      design_identity("fintech, trustworthy")                │
│      |                                                      │
│      v                                                      │
│   3. GENERATE                                               │
│      generate_page("dashboard") or component_suggest(...)   │
│      |                                                      │
│      v                                                      │
│   4. RENDER + REVIEW          <----+                        │
│      render_and_review(code)       |                        │
│      Score: 58/100                 |                        │
│      |                             |                        │
│      v                             |                        │
│   5. AUTO-FIX                      |                        │
│      design_fix(code, "moderate")  |                        │
│      |                             |                        │
│      v                             |                        │
│   6. SCORE CHECK                   |                        │
│      Score >= 85? ----NO----------+                         │
│      |                                                      │
│      YES                                                    │
│      |                                                      │
│      v                                                      │
│   7. SAVE + LOG                                             │
│      save_identity() + log_review() + log_decision()        │
│      |                                                      │
│      v                                                      │
│   DONE -- Score: 91/100                                     │
│                                                             │
│   Or skip all that and use:                                 │
│      design_iterate(code, target: 85)                       │
│      (does steps 4-6 automatically)                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Figma Integration

Bridge the gap between design and code. No more eyeballing pixels from a Figma mockup.

```
┌──────────────────────────────────────────────────────┐
│  Figma Workflow                                      │
│                                                      │
│  figma_inspect(file_url)                             │
│  |                                                   │
│  v                                                   │
│  ┌──────────────────────────┐                        │
│  │  Extracted Design System  │                       │
│  │  - 5 colors              │                        │
│  │  - 3 font families       │                        │
│  │  - 8px spacing grid      │                        │
│  │  - 12 components found   │                        │
│  └──────────────┬───────────┘                        │
│                 |                                     │
│                 v                                     │
│  figma_to_code(frame, "react")                       │
│  |                                                   │
│  v                                                   │
│  ┌──────────────────────────┐                        │
│  │  Generated React Code     │                       │
│  │  - Pixel-accurate         │                       │
│  │  - Uses design tokens     │                       │
│  │  - Responsive             │                       │
│  └──────────────────────────┘                        │
│                                                      │
│  Then run design_review on the output to validate.   │
└──────────────────────────────────────────────────────┘
```

---

## Accessibility

`a11y_audit` runs a full WCAG 2.1 compliance check on your code or rendered pages.

```
┌─────────────────────────────────────────────────────┐
│  Accessibility Audit Report          Level: AA      │
│                                                     │
│  PASS  12 checks passed                             │
│  FAIL   4 issues found                              │
│                                                     │
│  [1.4.3] Contrast (Minimum)              FAIL       │
│  Text "#777" on "#fff" = 4.48:1                     │
│  -> Darken to "#757575" for 4.6:1                   │
│                                                     │
│  [2.4.7] Focus Visible                   FAIL       │
│  Button has outline: none with no replacement       │
│  -> Add :focus-visible with visible ring            │
│                                                     │
│  [1.3.1] Info and Relationships          FAIL       │
│  Form inputs missing associated <label>             │
│  -> Add <label for="..."> or aria-label             │
│                                                     │
│  [4.1.2] Name, Role, Value              FAIL        │
│  Icon button has no accessible name                 │
│  -> Add aria-label="Close" to icon button           │
└─────────────────────────────────────────────────────┘
```

Supports **Level A**, **Level AA**, and **Level AAA** auditing.

---

## MCP Resources

devsigner also exposes design system knowledge as MCP resources that your AI client can read directly:

| Resource URI | Description |
|-------------|-------------|
| `devsigner://design-system/material3` | Material Design 3 guidelines |
| `devsigner://design-system/apple-hig` | Apple Human Interface Guidelines |
| `devsigner://design-system/shadcn` | shadcn/ui conventions and patterns |
| `devsigner://design-system/ant-design` | Ant Design system specifications |

---

## Examples

### Review your messy code

> **You:** "Review this component for design issues"
> ```jsx
> <div style={{ padding: '13px', color: '#333', backgroundColor: '#000' }}>
>   <h1 style={{ fontSize: '15px' }}>Title</h1>
> </div>
> ```

**devsigner** catches:
- `padding: 13px` -- not on 4px grid, suggest 12px or 16px
- `color: #333 on #000` -- contrast ratio 1.66:1, fails WCAG AA
- `fontSize: 15px` -- odd value, suggest 14px or 16px

### Generate a full page

> **You:** "Generate a pricing page for my SaaS product with a modern feel"

**devsigner** generates a complete pricing page with proper grid layout, typography hierarchy, color-coded tiers, and responsive breakpoints.

### Fix it automatically

> **You:** "Fix all the design issues in this component, moderate mode"

**devsigner** returns corrected code with every spacing, color, and typography issue resolved -- while keeping your component logic untouched.

### Pull from Figma

> **You:** "Inspect this Figma file and generate React components for the dashboard frame"

**devsigner** extracts the design system from Figma, converts the specified frame to React code, and validates the output against the original design specs.

### Run an accessibility audit

> **You:** "Run an a11y audit on this form at WCAG AA level"

**devsigner** checks every form element for proper labels, contrast ratios, focus management, keyboard navigation, and ARIA attributes.

---

## How It Works

```
┌───────────────────────────────────────────────────────────────────┐
│                       Your IDE / Terminal                         │
│                                                                   │
│   You: "Review my dashboard and fix it"                          │
│    |                                                              │
│    v                                                              │
│   ┌────────────────┐    stdio    ┌─────────────────────────────┐  │
│   │  Claude/Cursor  |<---------->|  devsigner MCP Server       |  │
│   │  (MCP Client)   |            |                             |  │
│   └────────────────┘            |  ┌────────┐  ┌───────────┐  |  │
│                                  |  |Parsers |  | Renderers |  |  │
│                                  |  |CSS     |  | Puppeteer |  |  │
│                                  |  |Tailwind|  | Chrome    |  |  │
│                                  |  |JSX     |  └─────┬─────┘  |  │
│                                  |  └───┬────┘        |        |  │
│                                  |      v             v        |  │
│                                  |  ┌─────────────────────┐    |  │
│                                  |  |    Rules Engine      |    |  │
│                                  |  |  Spacing  | Color    |    |  │
│                                  |  |  Typo     | Layout   |    |  │
│                                  |  |  A11y     | WCAG     |    |  │
│                                  |  └─────────┬───────────┘    |  │
│                                  |            v                |  │
│                                  |  ┌─────────────────────┐    |  │
│                                  |  |    Generators        |    |  │
│                                  |  |  Pages  | Components |    |  │
│                                  |  |  Colors | Identity   |    |  │
│                                  |  └─────────┬───────────┘    |  │
│                                  |            v                |  │
│                                  |  ┌─────────────────────┐    |  │
│                                  |  |    Integrations      |    |  │
│                                  |  |  Figma  | Sessions   |    |  │
│                                  |  |  Guides | References |    |  │
│                                  |  └─────────────────────┘    |  │
│                                  └─────────────────────────────┘  │
│                                                                   │
│   devsigner: "Score 62/100. Found 7 issues. Auto-fixing..."     │
│   devsigner: "Score 89/100. Ship it."                            │
└───────────────────────────────────────────────────────────────────┘
```

**Key design decisions:**

- **No API keys needed** -- All analysis runs locally with a deterministic rules engine. No external AI calls.
- **Zero config by default** -- Works out of the box. Optionally configure with `.devsignerrc.json`.
- **Framework-agnostic** -- Parses React, Vue, Svelte, plain HTML/CSS, and Tailwind classes.
- **Actionable, not vague** -- Every issue comes with a specific, copy-pasteable fix.
- **Iterative by design** -- Tools compose into loops. Review, fix, re-render, repeat.
- **Figma-native** -- Read real Figma files, extract design systems, generate code.
- **Accessibility-first** -- WCAG 2.1 compliance is not an afterthought.

---

## Design Rules Reference

<details>
<summary><strong>Spacing Rules</strong></summary>

| Rule | Severity | Description |
|------|----------|-------------|
| 4px grid | Warning | All spacing values should be multiples of 4px |
| 8px preference | Info | Major spacing should prefer 8px multiples |
| Consistency | Warning | Flags >6 distinct spacing values in one component |

</details>

<details>
<summary><strong>Color Rules</strong></summary>

| Rule | Severity | Description |
|------|----------|-------------|
| WCAG AA contrast | Error | Text/background contrast must be >=4.5:1 (normal) or >=3:1 (large) |
| WCAG AAA contrast | Error | Text/background contrast must be >=7:1 (normal) or >=4.5:1 (large) |
| Pure black | Info | Suggests softer alternatives to `#000000` |
| Pure white | Info | Suggests softer alternatives to `#ffffff` |
| Color count | Warning | Flags >6 distinct colors |

</details>

<details>
<summary><strong>Typography Rules</strong></summary>

| Rule | Severity | Description |
|------|----------|-------------|
| Font size count | Warning | Flags >6 distinct font sizes |
| Odd font sizes | Info | Suggests even-numbered alternatives (13px -> 12/14px) |
| Type scale ratio | Info | Adjacent sizes should differ by >=1.2x |
| Font weight count | Warning | Flags >3 distinct weights |
| Line height | Warning | Body text line-height should be 1.4-1.8 |

</details>

<details>
<summary><strong>Layout Rules</strong></summary>

| Rule | Severity | Description |
|------|----------|-------------|
| z-index | Warning | Flags values >100 |
| Max-width | Info | Text containers should have max-width for readability |
| Text alignment | Warning | Flags >2 alignment styles in one component |

</details>

<details>
<summary><strong>Accessibility Rules (WCAG 2.1)</strong></summary>

| Rule | Level | Description |
|------|-------|-------------|
| 1.1.1 Non-text Content | A | Images must have alt text |
| 1.3.1 Info and Relationships | A | Form inputs need associated labels |
| 1.4.3 Contrast (Minimum) | AA | 4.5:1 for normal text, 3:1 for large text |
| 1.4.6 Contrast (Enhanced) | AAA | 7:1 for normal text, 4.5:1 for large text |
| 2.1.1 Keyboard | A | All interactive elements must be keyboard accessible |
| 2.4.7 Focus Visible | AA | Focus indicator must be visible |
| 4.1.2 Name, Role, Value | A | Interactive elements need accessible names |

</details>

---

## Roadmap

- [x] ~~Screenshot review~~ -- Upload a screenshot, get design feedback
- [x] ~~Figma integration~~ -- Read Figma files and convert to code
- [x] ~~Auto-fix mode~~ -- Return corrected code, not just suggestions
- [x] ~~Accessibility audit~~ -- WCAG 2.1 A/AA/AAA compliance
- [x] ~~Design sessions~~ -- Persistent context across conversations
- [x] ~~Full page generation~~ -- Complete pages, not just components
- [x] ~~Design identity system~~ -- Consistent personality across a product
- [x] ~~Custom rules~~ -- `.devsignerrc.json` for project-specific design systems
- [ ] **Tailwind v4** -- Native `@theme` block support
- [ ] **Storybook integration** -- Review components in Storybook
- [x] ~~Design diff~~ -- Compare before/after screenshots automatically
- [ ] **Team presets** -- Shared design identities across a team
- [ ] **VS Code extension** -- Inline design hints in the editor gutter

---

## Contributing

Contributions are welcome! Whether it's new rules, component templates, Figma improvements, or bug fixes.

```bash
# Clone and install
git clone https://github.com/hamjinoo/devsigner.git
cd devsigner
npm install

# Development (auto-reload)
npm run dev

# Build
npm run build

# Test with MCP Inspector
npx @modelcontextprotocol/inspector node dist/index.js
```

### Project structure

```
src/
  tools/            # All 33 tool implementations
  rules/            # Design rule modules (spacing, color, typography, layout)
  parsers/          # CSS, Tailwind, JSX, inline style parsers
  components/       # Component templates (20+ designs)
  palettes/         # Color palette presets and generation
  resources/        # MCP resource definitions (design system guides)
  context/          # Session and identity management
  preview/          # Live preview and responsive preview servers
  orchestration/    # Design wizard and workflow orchestration
  utils/            # Shared utilities (contrast calculation, etc.)
  server.ts         # MCP server setup and tool registration
  index.ts          # Entry point
```

### Adding a new component template

Templates live in `src/components/`. Each template uses `{{token}}` placeholders that get replaced with design tokens:

- `{{borderRadius}}` -- Corner radius for the variant
- `{{shadow}}` -- Box shadow for the variant
- `{{spacing.sm}}` / `{{spacing.md}}` / `{{spacing.lg}}` / `{{spacing.xl}}` -- Spacing scale

### Adding a new design rule

Rules live in `src/rules/`. Each rule module exports a function that takes `StyleDeclaration[]` and returns `DesignIssue[]`.

---

## License

MIT

---

<p align="center">
  <strong>Built for developers who code better than they design.</strong>
  <br />
  <sub>If that's you, give us a star on <a href="https://github.com/hamjinoo/devsigner">GitHub</a></sub>
</p>
