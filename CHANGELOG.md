# Changelog

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
- 6 full page templates × 6 design personalities
- Design system knowledge (Material Design 3, Apple HIG, shadcn, Ant Design)
- Industry references (15+ products, 7 industries)
- Auto-fix (safe/moderate/aggressive)
- Render + screenshot review (Puppeteer)
- Figma inspect + to-code
- WCAG 2.1 accessibility audit
- Persistent design sessions (.devsigner/)
- Published to npm as `devsigner`
