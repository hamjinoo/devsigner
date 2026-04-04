# devsigner Dashboard

> Last updated: 2026-04-03

## Status: v0.8.0 LIVE on npm (v1.0.0 imminent)

| | |
|---|---|
| **npm** | [devsigner@0.8.0](https://www.npmjs.com/package/devsigner) |
| **GitHub** | [hamjinoo/devsigner](https://github.com/hamjinoo/devsigner) |
| **Install** | `npx -y devsigner` |
| **Deps** | 3 (MCP SDK, zod, puppeteer-core) |

---

## Tools (37)

| # | Tool | Category | Status |
|---|------|----------|--------|
| 1 | `design_review` | Analysis | Live |
| 2 | `screenshot_review` | Analysis | Live |
| 3 | `scan_project` | Analysis | Live |
| 4 | `a11y_audit` | Analysis | Live |
| 5 | `analyze_url` | Analysis | Live |
| 6 | `batch_analyze` | Analysis | Live |
| 7 | `batch_review` | Analysis | Live |
| 8 | `design_compare` | Analysis | Live |
| 9 | `perf_audit` | Analysis | Live |
| 10 | `compete_analyze` | Analysis | Live |
| 11 | `color_palette` | Generation | Live |
| 12 | `component_suggest` | Generation | Live (20 templates) |
| 13 | `generate_page` | Generation | Live (6 page types) |
| 14 | `design_identity` | Generation | Live (6 archetypes) |
| 15 | `export_tokens` | Generation | Live |
| 16 | `generate_style_guide` | Generation | Live |
| 17 | `scaffold_project` | Generation | Live |
| 18 | `screenshot_to_code` | Generation | Live |
| 19 | `suggest_animations` | Generation | Live |
| 20 | `design_fix` | Fixing | Live |
| 21 | `design_iterate` | Fixing | Live |
| 22 | `migrate_styles` | Fixing | Live |
| 23 | `render_and_review` | Visual | Live |
| 24 | `live_preview` | Visual | Live |
| 25 | `responsive_preview` | Visual | Live |
| 26 | `design_guide` | Knowledge | Live (4 systems) |
| 27 | `design_reference` | Knowledge | Live (7 industries) |
| 28 | `design_trends` | Knowledge | Live |
| 29 | `figma_inspect` | Figma | Live |
| 30 | `figma_to_code` | Figma | Live |
| 31 | `design_session` | Session | Live |
| 32 | `save_identity` | Session | Live |
| 33 | `log_review` | Session | Live |
| 34 | `log_decision` | Session | Live |
| 35 | `design_feedback` | Session | Live |
| 36 | `design_wizard` | Orchestrator | Live |
| 37 | `design_wizard` (sub-tools) | Orchestrator | Live |

---

## Tool Categories

| Category | Count | Description |
|----------|-------|-------------|
| Analysis | 10 | Review, audit, compare, benchmark |
| Generation | 9 | Components, pages, tokens, style guides, scaffolding |
| Fixing | 3 | Auto-fix, iterate, migrate |
| Visual | 3 | Render, live preview, responsive preview |
| Knowledge | 3 | Design systems, industry references, trends |
| Figma | 2 | Inspect, convert to code |
| Session | 5 | Session management, identity, logging, feedback |
| Orchestrator | 1 | design_wizard (multi-step workflow) |

---

## Component Templates (20)

| Template | Variants |
|----------|----------|
| pricing-card | React, Vue, Svelte, HTML |
| login-form | React, Vue, Svelte, HTML |
| hero-section | React, HTML |
| navbar | React, HTML |
| footer | React, HTML |
| feature-grid | React, HTML |
| testimonial-card | React, HTML |
| faq-accordion | React, HTML |
| stats-section | React, HTML |
| cta-banner | React, HTML |
| team-grid | React, HTML |
| contact-form | React, HTML |
| notification-toast | React, HTML |
| modal-dialog | React, HTML |
| data-table | React, HTML |
| empty-state | React, HTML |
| sidebar-nav | React, HTML |
| breadcrumb | React, HTML |
| avatar-group | React, HTML |
| badge-collection | React, HTML |

---

## Page Templates (6)

| Page | Personalities |
|------|--------------|
| Landing | bold_minimal, warm_professional, energetic_pop, elegant_editorial, data_dense, soft_wellness |
| Dashboard | all 6 |
| Pricing | all 6 |
| Login | all 6 |
| Settings | all 6 |
| 404 | all 6 |

---

## Design Personalities (6)

| Archetype | Vibe | Reference |
|-----------|------|-----------|
| Bold Minimal | Stark, empty, commanding | Linear, Vercel |
| Warm Professional | Trustworthy, gradient, balanced | Stripe, Mercury |
| Energetic Pop | Colorful, large, playful | Duolingo, Discord |
| Elegant Editorial | Serif, typographic, spacious | Notion, Medium |
| Data Dense | Compact, functional, no fluff | GitHub, Grafana |
| Soft Wellness | Pastel, rounded, gentle | Calm, Headspace |

---

## Design System Knowledge

| System | Coverage |
|--------|----------|
| Material Design 3 | Color roles, type scale, spacing, elevation, components |
| Apple HIG | System colors, SF Pro scale, safe areas, touch targets |
| shadcn/ui | CSS variables, Tailwind scale, component classes |
| Ant Design | Brand colors, type scale, grid, spacing tokens |

---

## Industry References

| Industry | Products | Aspects |
|----------|----------|---------|
| Fintech | Stripe, Wise, Mercury, Robinhood | color, layout, typography, components, spacing |
| SaaS | Linear, Notion, Vercel, GitHub | all |
| E-Commerce | Shopify, Gumroad, Apple Store | all |
| Healthcare | Calm, Headspace, Oscar Health | all |
| Education | Duolingo, Coursera | all |
| Social | Twitter/X | all |
| Dev Tools | VS Code | all |

---

## Milestones

| Date | Milestone |
|------|-----------|
| 2026-04-03 | v0.1.0 — MVP: 3 tools (review, palette, component) |
| 2026-04-03 | v0.2.0 — 20 tools, npm published |
| 2026-04-03 | v0.3.0 — analyze_url, batch_analyze, design_trends, GitHub Action |
| 2026-04-03 | v0.4.0 — screenshot_to_code, scaffold_project, .devsignerrc.json |
| 2026-04-03 | v0.4.1 — live_preview, responsive_preview, demo showcase |
| 2026-04-03 | v0.5.0 — export_tokens, design_compare |
| 2026-04-03 | v0.6.0 — batch_review, suggest_animations, generate_style_guide |
| 2026-04-03 | v0.7.0 — design_wizard orchestrator |
| 2026-04-03 | v0.8.0 — perf_audit, migrate_styles, compete_analyze |
| 2026-04-03 | v1.0.0 — Quality consolidation, full test suite, documentation |

---

## Backlog

| Priority | Feature | Status |
|----------|---------|--------|
| ~~High~~ | ~~screenshot_to_code~~ | Done (v0.4.0) |
| ~~High~~ | ~~scaffold_project~~ | Done (v0.4.0) |
| ~~Medium~~ | ~~Custom rules config (.devsignerrc.json)~~ | Done (v0.4.0) |
| ~~Medium~~ | ~~Screenshot comparison (before/after)~~ | Done (v0.5.0 — design_compare) |
| ~~Medium~~ | ~~Batch review~~ | Done (v0.6.0) |
| ~~Medium~~ | ~~Animation suggestions~~ | Done (v0.6.0) |
| ~~Medium~~ | ~~Style guide generation~~ | Done (v0.6.0) |
| ~~Medium~~ | ~~Design wizard orchestrator~~ | Done (v0.7.0) |
| ~~Medium~~ | ~~Performance audit~~ | Done (v0.8.0) |
| ~~Medium~~ | ~~Style migration~~ | Done (v0.8.0) |
| ~~Medium~~ | ~~Competitive analysis~~ | Done (v0.8.0) |
| High | Vue/Svelte variants for all 18 new components | Planned |
| High | Onboarding + Blog page templates | Planned |
| Medium | Figma OAuth (replace personal access token) | Planned |
| Medium | Tailwind v4 native @theme support | Planned |
| Low | Design system export (Figma → code → tokens loop) | Planned |
| Low | Community rules marketplace | Idea |
| Low | Web dashboard for design metrics | Idea |

---

## Architecture

```
src/
├── index.ts                    # Entry: McpServer + StdioServerTransport
├── server.ts                   # Tool/resource registration hub (37 tools)
├── constants.ts                # Grid, WCAG, typography constants
├── review.ts                   # Shared review logic
├── config/
│   └── project-config.ts       # .devsignerrc.json config loading
├── context/
│   └── project-context.ts      # Persistent .devsigner/ session system
├── tools/
│   ├── design-review.ts        # Code-based design analysis
│   ├── design-fix.ts           # Auto-correct design issues
│   ├── design-iterate.ts       # Render→review→fix loop
│   ├── design-identity.ts      # Product personality system
│   ├── design-session.ts       # Session management (5 tools)
│   ├── design-guide.ts         # Design system guidelines
│   ├── design-reference.ts     # Industry reference patterns
│   ├── design-compare.ts       # Visual before/after diff
│   ├── design-trends.ts        # Trend reports from collected data
│   ├── design-wizard.ts        # Multi-step orchestrator
│   ├── color-palette.ts        # Color system generation
│   ├── component-suggest.ts    # 20 component templates
│   ├── generate-page.ts        # 6 page templates
│   ├── generate-style-guide.ts # Full style guide generation
│   ├── scan-project.ts         # Project tech stack scanner
│   ├── render-and-review.ts    # Browser rendering + screenshot
│   ├── screenshot-review.ts    # Existing screenshot analysis
│   ├── screenshot-to-code.ts   # Screenshot → code generation
│   ├── live-preview.ts         # Live preview server
│   ├── responsive-preview.ts   # Multi-viewport preview
│   ├── figma.ts                # Figma inspect + to-code
│   ├── a11y-audit.ts           # WCAG 2.1 accessibility audit
│   ├── analyze-url.ts          # Live website analysis
│   ├── batch-analyze.ts        # Multi-URL batch analysis
│   ├── batch-review.ts         # Directory-wide batch review
│   ├── scaffold-project.ts     # Full project scaffolding
│   ├── export-tokens.ts        # Design token export
│   ├── suggest-animations.ts   # Animation suggestions
│   ├── perf-audit.ts           # Performance audit
│   ├── migrate-styles.ts       # Style migration (CSS↔Tailwind)
│   └── compete-analyze.ts      # Competitive design analysis
├── rules/
│   ├── index.ts                # Rule runner + score calculator
│   ├── types.ts                # DesignIssue, Severity, Category types
│   ├── spacing.ts              # 4px/8px grid rules
│   ├── color.ts                # WCAG contrast rules
│   ├── typography.ts           # Type scale rules
│   └── layout.ts               # z-index, max-width rules
├── parsers/
│   ├── index.ts                # Parser exports
│   ├── css-extractor.ts        # CSS block parsing
│   ├── tailwind-extractor.ts   # Tailwind class → CSS mapping
│   ├── inline-style-extractor.ts
│   └── framework-detector.ts   # React/Vue/Svelte/HTML detection
├── palettes/
│   ├── generator.ts            # Color palette engine
│   ├── presets.ts              # 10 industry presets
│   └── formatters.ts           # CSS/Tailwind/token output
├── components/
│   └── templates/              # Component HTML/framework templates
├── resources/
│   └── design-systems.ts       # MCP resources (4 systems)
├── schemas/
│   └── design-analysis.sql     # PostgreSQL schema for data pipeline
└── utils/
    ├── color-utils.ts          # Hex/RGB/HSL, WCAG contrast
    └── css-value-parser.ts     # px/rem/em parsing, shorthand expansion
```
