# Changelog

## v1.0.0 (2026-04-03)

### Quality Consolidation
- **Comprehensive e2e test suite** — all 37 tools tested end-to-end via `test-e2e.mjs`
- **Full documentation** — CONTRIBUTING.md, updated DASHBOARD.md, updated CHANGELOG.md
- **Stable API** — all tool input/output schemas finalized
- **Zero-crash guarantee** — every tool handles missing files, missing Chrome, invalid input gracefully

### What's in 1.0.0
- 37 MCP tools across 8 categories (Analysis, Generation, Fixing, Visual, Knowledge, Figma, Session, Orchestrator)
- 20 component templates with React + HTML variants
- 6 full page templates x 6 design personalities
- 4 design system knowledge bases (Material Design 3, Apple HIG, shadcn/ui, Ant Design)
- 7 industry reference databases (15+ products)
- Design rules engine (spacing, color, typography, layout) with scoring
- Persistent design sessions (.devsigner/)
- Project config via .devsignerrc.json
- GitHub Action for PR design review
- Landing page at https://hamjinoo.github.io/devsigner/

---

## v0.8.0 (2026-04-03)

### New Tools
- **`perf_audit`** — Performance-aware design audit: detect layout shifts, heavy paints, oversized images, render-blocking patterns
- **`migrate_styles`** — Migrate between CSS and Tailwind (both directions), with framework-aware output
- **`compete_analyze`** — Competitive design analysis: compare your site's design against competitors

---

## v0.7.0 (2026-04-03)

### New Tools
- **`design_wizard`** — Multi-step orchestrator that guides users through a full design workflow: scan → identity → review → fix → generate, all in one conversation

---

## v0.6.0 (2026-04-03)

### New Tools
- **`batch_review`** — Scan all components in a directory, aggregate design issues into a single report with per-file and overall scores
- **`suggest_animations`** — Detect static UIs that would benefit from motion, suggest CSS/Framer Motion animations with code
- **`generate_style_guide`** — Generate a complete style guide document from project analysis: colors, typography, spacing, components

---

## v0.5.0 (2026-04-03)

### New Tools
- **`export_tokens`** — Export design tokens in multiple formats: CSS custom properties, Tailwind config, JSON tokens, SCSS variables
- **`design_compare`** — Visual before/after comparison: diff two screenshots or two URLs side by side, highlight design changes

---

## v0.4.1 (2026-04-03)

### New Tools
- **`live_preview`** — Start a local preview server for generated HTML, auto-refresh on changes
- **`responsive_preview`** — Render at multiple viewports (mobile, tablet, desktop) and compare layouts side by side

### Improvements
- **Demo showcase** — Interactive demo pages showing devsigner capabilities

---

## v0.4.0 (2026-04-03)

### New Tools
- **`screenshot_to_code`** — Analyze a screenshot and generate matching HTML/CSS code with layout detection
- **`scaffold_project`** — Generate a full project structure with components, styles, layouts, and shared design tokens

### New Infrastructure
- **`.devsignerrc.json`** — Per-project configuration file for custom rules, thresholds, and preferences

---

## v0.3.0 (2026-04-04)

### New Tools
- **`analyze_url`** — Analyze any live website's design (colors, typography, spacing, layout, shapes)
- **`batch_analyze`** — Analyze multiple URLs at once, save to JSON
- **`design_trends`** — Generate trend reports from collected design data
- **`design_iterate`** — Automated render→review→fix→re-render loop

### New Infrastructure
- **GitHub Action** — Automated design review on every PR (`action.yml`)
- **Landing Page** — https://hamjinoo.github.io/devsigner/
- **PostgreSQL Schema** — Ready for production data storage (`src/schemas/design-analysis.sql`)
- **Design Data Pipeline** — 30 top sites analyzed, first trends report generated

### Improvements
- **Personality classifier** — Replaced if-else chain with scoring system. No more 80% "Energetic Pop" bias.
- **Industry classifier** — Now checks URL domain first, then title. Added `design_tools` category.
- **design_review noise fix** — Block-aware contrast checking. Only compares text/bg on same element.
- **Scoring** — Deduplicated issues, reduced info/warning penalties for realistic scores.
- **Timeouts** — 10s→30s, networkidle0→domcontentloaded for Windows stability.
- **Default tokens updated** — Rounded corners 8→12px, pill 12→20px based on 83% trend data. Added Geist font.
- **generate_page** — Now reads saved identity from `.devsigner/context.json` when project_path given.
- **Component tokens** — Modern borderRadius 0.75→1rem, playful 1→1.25rem.

## v0.2.0 (2026-04-03)

### Initial Release
- 20 MCP tools across 7 categories
- Design review with scoring
- Color palette generation (CSS vars, Tailwind, design tokens)
- 20 component templates (React + HTML)
- 6 full page templates x 6 design personalities
- Design system knowledge (Material Design 3, Apple HIG, shadcn, Ant Design)
- Industry references (15+ products, 7 industries)
- Auto-fix (safe/moderate/aggressive)
- Render + screenshot review (Puppeteer)
- Figma inspect + to-code
- WCAG 2.1 accessibility audit
- Persistent design sessions (.devsigner/)
- Published to npm as `devsigner`
