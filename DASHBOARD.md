# devsigner Dashboard

> Last updated: 2026-04-03

## Status: LIVE on npm

| | |
|---|---|
| **npm** | [devsigner@0.2.0](https://www.npmjs.com/package/devsigner) |
| **GitHub** | [hamjinoo/devsigner](https://github.com/hamjinoo/devsigner) |
| **Install** | `npx -y devsigner` |
| **Bundle** | 569 KB |
| **Deps** | 3 (MCP SDK, zod, puppeteer-core) |

---

## Tools (20)

| # | Tool | Category | Status |
|---|------|----------|--------|
| 1 | `design_review` | Analysis | ✅ Live |
| 2 | `screenshot_review` | Analysis | ✅ Live |
| 3 | `scan_project` | Analysis | ✅ Live |
| 4 | `a11y_audit` | Analysis | ✅ Live |
| 5 | `color_palette` | Generation | ✅ Live |
| 6 | `component_suggest` | Generation | ✅ Live (20 templates) |
| 7 | `generate_page` | Generation | ✅ Live (6 page types) |
| 8 | `design_identity` | Generation | ✅ Live (6 archetypes) |
| 9 | `design_fix` | Fixing | ✅ Live |
| 10 | `design_iterate` | Fixing | ✅ Live |
| 11 | `render_and_review` | Visual | ✅ Live |
| 12 | `design_guide` | Knowledge | ✅ Live (4 systems) |
| 13 | `design_reference` | Knowledge | ✅ Live (7 industries) |
| 14 | `figma_inspect` | Figma | ✅ Live |
| 15 | `figma_to_code` | Figma | ✅ Live |
| 16 | `design_session` | Session | ✅ Live |
| 17 | `save_identity` | Session | ✅ Live |
| 18 | `log_review` | Session | ✅ Live |
| 19 | `log_decision` | Session | ✅ Live |
| 20 | `design_feedback` | Session | ✅ Live |

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
| 2026-04-03 | Phase 2 — Context + knowledge: 6 tools |
| 2026-04-03 | Phase 3 — Visual ("eyes"): 8 tools |
| 2026-04-03 | Phase 4 — Personality: 9 tools |
| 2026-04-03 | Phase 5 — Pages + auto-fix: 16 tools |
| 2026-04-03 | Phase 6 — Figma + a11y + iterate: 20 tools |
| 2026-04-03 | npm publish — devsigner@0.2.0 live |

---

## Backlog

| Priority | Feature | Status |
|----------|---------|--------|
| High | Vue/Svelte variants for all 18 new components | Planned |
| High | Onboarding + Blog page templates | Planned |
| Medium | Custom rules config (.devsignerrc.json) | Planned |
| Medium | Figma OAuth (replace personal access token) | Planned |
| Medium | Tailwind v4 native @theme support | Planned |
| Low | Screenshot comparison (before/after side-by-side) | Planned |
| Low | Design system export (Figma → code → tokens loop) | Planned |
| Low | Community rules marketplace | Idea |
| Low | Web dashboard for design metrics | Idea |

---

## Architecture

```
src/
├── index.ts                    # Entry: McpServer + StdioServerTransport
├── server.ts                   # Tool/resource registration hub
├── constants.ts                # Grid, WCAG, typography constants
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
│   ├── color-palette.ts        # Color system generation
│   ├── component-suggest.ts    # 20 component templates
│   ├── generate-page.ts        # 6 page templates
│   ├── scan-project.ts         # Project tech stack scanner
│   ├── render-and-review.ts    # Browser rendering + screenshot
│   ├── screenshot-review.ts    # Existing screenshot analysis
│   ├── figma.ts                # Figma inspect + to-code
│   └── a11y-audit.ts           # WCAG 2.1 accessibility audit
├── rules/
│   ├── spacing.ts              # 4px/8px grid rules
│   ├── color.ts                # WCAG contrast rules
│   ├── typography.ts           # Type scale rules
│   └── layout.ts               # z-index, max-width rules
├── parsers/
│   ├── css-extractor.ts        # CSS block parsing
│   ├── tailwind-extractor.ts   # Tailwind class → CSS mapping
│   ├── inline-style-extractor.ts
│   └── framework-detector.ts   # React/Vue/Svelte/HTML detection
├── palettes/
│   ├── generator.ts            # Color palette engine
│   ├── presets.ts              # 10 industry presets
│   └── formatters.ts           # CSS/Tailwind/token output
├── resources/
│   └── design-systems.ts       # MCP resources (4 systems)
└── utils/
    ├── color-utils.ts          # Hex/RGB/HSL, WCAG contrast
    └── css-value-parser.ts     # px/rem/em parsing, shorthand expansion
```
