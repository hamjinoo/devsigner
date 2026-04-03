<p align="center">
  <img src="https://img.shields.io/badge/MCP-Server-blue?style=for-the-badge" alt="MCP Server" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="MIT License" />
  <img src="https://img.shields.io/badge/PRs-Welcome-brightgreen?style=for-the-badge" alt="PRs Welcome" />
</p>

<h1 align="center">
  devsigner
</h1>

<p align="center">
  <strong>A design-sense MCP server for developers who can't design.</strong>
  <br />
  Stop guessing. Get instant, actionable design feedback right in your IDE.
</p>

<p align="center">
  <a href="#-quick-start">Quick Start</a> &bull;
  <a href="#-tools">Tools</a> &bull;
  <a href="#-examples">Examples</a> &bull;
  <a href="#-how-it-works">How It Works</a> &bull;
  <a href="#-contributing">Contributing</a>
</p>

---

## The Problem

You're a developer. You can build anything. But your UIs look like this:

```
┌──────────────────────────────────────────┐
│  padding: 13px (why?)                    │
│  margin: 7px  (why not 8?)               │
│                                          │
│  ██████ #000000 text on #333333 bg       │
│  (can you even read this?)               │
│                                          │
│  font-size: 13px, 14px, 15px, 17px       │
│  (pick a scale, any scale)               │
│                                          │
│  z-index: 99999 (the classic)            │
└──────────────────────────────────────────┘
               Score: 23/100
```

**devsigner** catches these mistakes and tells you exactly how to fix them.

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
git clone https://github.com/YOUR_USERNAME/devsigner.git
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

## Tools

devsigner provides **3 tools** that work inside any MCP-compatible client:

### `design_review` — Your AI design critic

Paste your UI code and get a detailed design report with a score.

```
┌─────────────────────────────────────────────────────┐
│  📊 Design Review Report                            │
│                                                     │
│  Framework: React          Score: ██████░░░░ 62/100 │
│                                                     │
│  ❌ ERRORS (must fix)                               │
│  ├─ [color] Contrast 1.66:1 — needs 4.5:1 for AA   │
│  │  → Lighten text or darken background             │
│  │                                                  │
│  ⚠️ WARNINGS (should fix)                           │
│  ├─ [spacing] padding: 13px not on 4px grid         │
│  │  → Use 12px or 16px                              │
│  ├─ [typography] line-height 1.1 too tight           │
│  │  → Use 1.4–1.8 for body text                    │
│  ├─ [layout] z-index: 999 is excessive              │
│  │  → Use scale: 1, 10, 20, 30, 40, 50             │
│  │                                                  │
│  💡 SUGGESTIONS (nice to have)                      │
│  ├─ [color] Avoid pure #000000                      │
│  │  → Try #1a1a1a for softer dark                   │
│  └─ [typography] 13px is unusual                    │
│     → Use even sizes: 12px or 14px                  │
└─────────────────────────────────────────────────────┘
```

**Checks performed:**

| Category | What it checks |
|----------|---------------|
| **Spacing** | 4px/8px grid alignment, spacing consistency, scale adherence |
| **Color** | WCAG AA/AAA contrast ratios, color count, pure black/white usage |
| **Typography** | Type scale consistency, line-height, font weight count, hierarchy |
| **Layout** | z-index sanity, max-width for readability, text alignment consistency |

**Input:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `code` | string | *(required)* | Your UI code (HTML, CSS, React, Vue, Svelte) |
| `framework` | `"react" \| "vue" \| "svelte" \| "html" \| "auto"` | `"auto"` | Framework hint |
| `focus` | `("spacing" \| "color" \| "typography" \| "layout" \| "all")[]` | `["all"]` | Which aspects to review |

---

### `color_palette` — Never pick bad colors again

Describe your project and get a complete, production-ready color system.

```
┌─────────────────────────────────────────────────────┐
│  🎨 Color Palette: Fintech                          │
│                                                     │
│  Generated from: "fintech app, trustworthy"         │
│                                                     │
│  Primary    ■■■■■■■■■■  #1a56db (Deep Blue)        │
│  Secondary  ■■■■■■■■■■  #2563a8                    │
│  Accent     ■■■■■■■■■■  #db881a                    │
│                                                     │
│  ✅ Success  ■  #22874a                              │
│  ⚠️ Warning  ■  #c88a08                              │
│  ❌ Error    ■  #d94a4a                              │
│  ℹ️ Info     ■  #2e7bc2                              │
│                                                     │
│  Contrast Report:                                   │
│  Primary on light bg → 8.21:1 ✅ AAA                │
│  Foreground on dark  → 15.3:1 ✅ AAA                │
│                                                     │
│  Output: CSS Variables / Tailwind / Design Tokens   │
└─────────────────────────────────────────────────────┘
```

**Built-in presets:** Professional, Fintech, Healthcare, Creative, E-Commerce, Education, SaaS, Nature, Playful, Minimal

**Input:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `description` | string | *(required)* | Project mood/industry (e.g., "fintech app, professional") |
| `base_color` | string | - | Starting hex color to build around |
| `format` | `"css_variables" \| "tailwind_config" \| "design_tokens" \| "all"` | `"all"` | Output format |
| `dark_mode` | boolean | `true` | Include dark mode variant |

---

### `component_suggest` — Copy-paste beautiful components

Get well-designed, token-based components ready for your framework.

```
┌─────────────────────────────────────────────────────┐
│  🧩 Pricing Card (React, Modern)                    │
│                                                     │
│  ┌─────────────────────────┐                        │
│  │  PRO                    │                        │
│  │  $29 /month             │                        │
│  │                         │                        │
│  │  ✓ Feature one          │                        │
│  │  ✓ Feature two          │                        │
│  │  ✓ Feature three        │                        │
│  │                         │                        │
│  │  ┌───────────────────┐  │                        │
│  │  │   Get Started     │  │                        │
│  │  └───────────────────┘  │                        │
│  └─────────────────────────┘                        │
│                                                     │
│  Design Decisions:                                  │
│  • Border radius: 0.75rem (modern feel)             │
│  • Spacing: consistent 4-step scale                 │
│  • Typography: 2 sizes, 2 weights for clarity       │
│  • Color: neutral base + blue accent                │
└─────────────────────────────────────────────────────┘
```

**Available templates:** Pricing Card, Login Form *(more coming soon)*

**Input:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `component` | string | *(required)* | What you need (e.g., "pricing card", "login form") |
| `framework` | `"react" \| "vue" \| "svelte" \| "html"` | *(required)* | Target framework |
| `variant` | `"minimal" \| "modern" \| "corporate" \| "playful"` | `"modern"` | Design style |

---

## Examples

### Review your messy code

> **You:** "Review this component for design issues"
> ```jsx
> <div style={{ padding: '13px', color: '#333', backgroundColor: '#000' }}>
>   <h1 style={{ fontSize: '15px' }}>Title</h1>
> </div>
> ```

**devsigner** will catch:
- `padding: 13px` → not on 4px grid, suggest 12px or 16px
- `color: #333 on #000` → contrast ratio 1.66:1, fails WCAG AA
- `fontSize: 15px` → odd value, suggest 14px or 16px

### Generate a color palette

> **You:** "Generate a color palette for a healthcare SaaS dashboard"

**devsigner** returns complete CSS variables, Tailwind config, and design tokens with WCAG-validated contrast ratios.

### Get a component

> **You:** "Give me a login form in Vue with a minimal style"

**devsigner** returns a complete, well-designed Vue component with proper spacing, typography, and color.

---

## How It Works

```
┌──────────────────────────────────────────────────────────┐
│                    Your IDE / Terminal                     │
│                                                          │
│   You: "Review my component"                             │
│    │                                                     │
│    ▼                                                     │
│   ┌────────────────┐    stdio    ┌───────────────────┐   │
│   │  Claude/Cursor  │◄──────────►│  devsigner MCP    │   │
│   │  (MCP Client)   │            │                   │   │
│   └────────────────┘            │  ┌─────────────┐  │   │
│                                  │  │   Parsers   │  │   │
│                                  │  │ CSS/Tailwind│  │   │
│                                  │  │ Inline/JSX  │  │   │
│                                  │  └──────┬──────┘  │   │
│                                  │         ▼         │   │
│                                  │  ┌─────────────┐  │   │
│                                  │  │ Rules Engine│  │   │
│                                  │  │ Spacing     │  │   │
│                                  │  │ Color/WCAG  │  │   │
│                                  │  │ Typography  │  │   │
│                                  │  │ Layout      │  │   │
│                                  │  └─────────────┘  │   │
│                                  └───────────────────┘   │
│                                                          │
│   devsigner: "Score 62/100. Here are 7 issues..."       │
└──────────────────────────────────────────────────────────┘
```

**Key design decisions:**

- **No API keys needed** — All analysis runs locally with a deterministic rules engine. No external AI calls.
- **Zero config** — Works out of the box. No `.devsignerrc` needed.
- **Framework-agnostic** — Parses React, Vue, Svelte, plain HTML/CSS, and Tailwind classes.
- **Actionable, not vague** — Every issue comes with a specific, copy-pasteable fix.

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
| WCAG AA contrast | Error | Text/background contrast must be ≥4.5:1 (normal) or ≥3:1 (large) |
| Pure black | Info | Suggests softer alternatives to `#000000` |
| Pure white | Info | Suggests softer alternatives to `#ffffff` |
| Color count | Warning | Flags >6 distinct colors |

</details>

<details>
<summary><strong>Typography Rules</strong></summary>

| Rule | Severity | Description |
|------|----------|-------------|
| Font size count | Warning | Flags >6 distinct font sizes |
| Odd font sizes | Info | Suggests even-numbered alternatives (13px → 12/14px) |
| Type scale ratio | Info | Adjacent sizes should differ by ≥1.2x |
| Font weight count | Warning | Flags >3 distinct weights |
| Line height | Warning | Body text line-height should be 1.4–1.8 |

</details>

<details>
<summary><strong>Layout Rules</strong></summary>

| Rule | Severity | Description |
|------|----------|-------------|
| z-index | Warning | Flags values >100 |
| Max-width | Info | Text containers should have max-width for readability |
| Text alignment | Warning | Flags >2 alignment styles in one component |

</details>

---

## Roadmap

- [ ] **More component templates** — Hero, Navbar, Footer, Dashboard, Feature Grid, Testimonial
- [ ] **Screenshot review** — Upload a screenshot, get design feedback
- [ ] **Figma integration** — Read Figma files and compare with code
- [ ] **Custom rules** — `.devsignerrc.json` for project-specific design systems
- [ ] **Auto-fix mode** — Return corrected code, not just suggestions
- [ ] **Tailwind v4** — Native `@theme` block support

---

## Contributing

Contributions are welcome! Whether it's new rules, component templates, or bug fixes.

```bash
# Clone and install
git clone https://github.com/YOUR_USERNAME/devsigner.git
cd devsigner
npm install

# Development (auto-reload)
npm run dev

# Build
npm run build

# Test with MCP Inspector
npx @modelcontextprotocol/inspector node dist/index.js
```

### Adding a new component template

Templates live in `src/tools/component-suggest.ts`. Each template uses `{{token}}` placeholders that get replaced with design tokens:

- `{{borderRadius}}` — Corner radius for the variant
- `{{shadow}}` — Box shadow for the variant
- `{{spacing.sm}}` / `{{spacing.md}}` / `{{spacing.lg}}` / `{{spacing.xl}}` — Spacing scale

### Adding a new design rule

Rules live in `src/rules/`. Each rule module exports a function that takes `StyleDeclaration[]` and returns `DesignIssue[]`.

---

## License

MIT

---

<p align="center">
  <strong>Built for developers who code better than they design.</strong>
  <br />
  <sub>If that's you, give us a ⭐</sub>
</p>
