# devsigner Roadmap

> Goal: Become the design layer that Lovable lacks.

## Reality Check

| | Lovable | devsigner |
|---|---|---|
| ARR | $400M | $0 |
| Funding | $530M | $0 |
| Team | 146+ | 1 |
| Users | 8M+ | 0 (just published) |
| Valuation | $6.6B | - |

**We are NOT competing head-to-head with Lovable.** That would be insane.

Instead, we exploit what Lovable can't do:

| Lovable's Weakness | devsigner's Opportunity |
|---|---|
| Only generates NEW projects | Works on EXISTING codebases |
| "Safe" generic design (shadcn defaults) | Design personality system with real opinions |
| No design review/audit | 20+ analysis tools with scoring |
| Breaks on complex apps | Doesn't generate apps — improves what you built |
| Credit-hungry (users complain most about this) | Free core, no credits, runs locally |
| Locked to React + Vite | Framework-agnostic (React, Vue, Svelte, HTML) |
| No Figma → code that actually works | Figma integration built-in |
| No accessibility | WCAG 2.1 A/AA/AAA audit |
| No design education | Design system knowledge base |

**Our position: Lovable creates the 0→1. devsigner makes the 1→10.**

---

## Phase 1: Foundation (DONE)
*Shipped 2026-04-03*

- [x] 20 MCP tools
- [x] Design review with scoring
- [x] Color palette generation
- [x] 20 component templates
- [x] 6 full page templates
- [x] 6 design personalities
- [x] Design system knowledge (Material, Apple, shadcn, Ant)
- [x] Industry references (15+ products, 7 industries)
- [x] Auto-fix (safe/moderate/aggressive)
- [x] Render + screenshot review
- [x] Iteration loop (render→review→fix→re-render)
- [x] Figma inspect + to-code
- [x] WCAG accessibility audit
- [x] Persistent design sessions
- [x] npm published (devsigner@0.2.0)
- [x] GitHub public (hamjinoo/devsigner)

---

## Phase 2: Adoption (Month 1-2)
*Goal: 500 GitHub stars, 1K npm weekly downloads*

### Marketing & Community
- [ ] Write launch post for Reddit r/webdev, r/reactjs, Hacker News
- [ ] Create demo video (2 min) showing the full workflow
- [ ] Submit to MCP server directories (awesome-mcp-servers, mcpservers.org)
- [ ] Write "How I built a design MCP server" blog post
- [ ] Share on X/Twitter, Dev.to, LinkedIn
- [ ] Create Discord server for community

### Quick Wins (High Impact, Low Effort)
- [ ] Vue/Svelte variants for all 18 new component templates
- [ ] Onboarding + Blog page templates for generate_page
- [ ] `.devsignerrc.json` — custom rules config per project
- [ ] `design_compare` tool — visual before/after diff of two screenshots
- [ ] Tailwind v4 native @theme block support

### Developer Experience
- [ ] `npx create-devsigner` — project starter with pre-configured identity
- [ ] MCP Inspector test suite for all 20 tools
- [ ] Contributing guide with "add a component" tutorial

---

## Phase 3: Intelligence (Month 2-4)
*Goal: 2K stars, 5K weekly downloads*

### Smarter Analysis
- [ ] **Responsive audit** — render at 3 viewports (mobile/tablet/desktop), compare layouts
- [ ] **Animation suggestions** — detect static UIs that would benefit from motion
- [ ] **Information hierarchy analysis** — "this page has no clear focal point"
- [ ] **Consistency checker** — compare multiple components for visual consistency

### Smarter Generation
- [ ] **Multi-file project generation** — not just pages, but full project structure
  - `/components`, `/styles`, `/layouts` organized properly
  - Shared design tokens file
  - Layout wrappers (header + sidebar + content + footer)
- [ ] **From screenshot to code** — screenshot → detect layout → generate code
- [ ] **Component variants** — each template has light/dark, sizes (sm/md/lg), states (default/hover/active/disabled)

### Smarter Fixing
- [ ] **Context-aware fixes** — read project's design identity, fix to match
- [ ] **Batch review** — scan all components in a directory, aggregate report
- [ ] **Auto-apply to file** — write fixes directly to the source file (with confirmation)

---

## Phase 4: Web Companion (Month 4-6)
*Goal: First revenue*

### devsigner.dev — Web Dashboard
- [ ] **Design Score Dashboard** — project-wide design quality over time (reads .devsigner/)
- [ ] **Visual Component Library** — rendered previews of all your components
- [ ] **Before/After Gallery** — visual history of design improvements
- [ ] **Team Design System** — shared identity, tokens, rules across projects

### Revenue Model: Open Core
```
Free (MCP Server)              Pro ($15/month)              Team ($49/month)
──────────────────             ──────────────               ────────────────
All 20+ tools                  Web dashboard                Team dashboard
Local analysis                 Design score tracking        Shared design system
Component generation           Batch review (full project)  Design approval workflow
Design identity                Priority templates           Figma auto-sync
Community templates            Custom personality presets    SSO
                               Email support                Audit logs
```

### Technical
- [ ] SaaS web app (Next.js + Supabase)
- [ ] User authentication
- [ ] Stripe payment integration
- [ ] API for design score badges (like code coverage badges)

---

## Phase 5: Ecosystem (Month 6-12)
*Goal: 10K stars, $10K MRR*

### Integrations
- [ ] **VS Code Extension** — design score in sidebar, inline suggestions
- [ ] **GitHub Action** — design review on every PR (like a linter)
- [ ] **Figma Plugin** — push design tokens from Figma → .devsigner/
- [ ] **Storybook Integration** — review components inside Storybook
- [ ] **CI/CD Pipeline** — block PRs that drop design score below threshold

### Community Marketplace
- [ ] **Template Marketplace** — community-contributed components/pages
- [ ] **Personality Marketplace** — custom design personalities
- [ ] **Rules Marketplace** — custom design rules (company-specific)
- [ ] **Industry Packs** — deep design knowledge for specific verticals

### Advanced Features
- [ ] **Design System Generator** — scan existing app → extract full design system
- [ ] **Multi-brand Support** — same app, different design identities per brand/client
- [ ] **Localization-aware Design** — adjust layouts for different text lengths (CJK, RTL)
- [ ] **Performance-aware Design** — flag designs that would cause layout shifts, heavy paints

---

## Phase 6: Platform (Year 2+)
*Goal: 50K stars, $100K MRR*

### devsigner becomes a platform
- [ ] **Plugin System** — third-party tools that plug into devsigner's MCP server
- [ ] **Design AI Model** — fine-tuned model on design patterns (not just rules)
- [ ] **Real-time Preview Server** — live preview that updates as you code (like Lovable, but local)
- [ ] **Design-to-Code API** — SaaS API that any tool can call
- [ ] **Enterprise: Self-hosted** — on-prem devsigner for regulated industries
- [ ] **Enterprise: SSO/SCIM** — Okta, Azure AD integration

---

## Key Metrics to Track

| Metric | Phase 2 | Phase 3 | Phase 4 | Phase 5 |
|--------|---------|---------|---------|---------|
| GitHub Stars | 500 | 2,000 | 5,000 | 10,000 |
| npm Weekly Downloads | 1,000 | 5,000 | 10,000 | 50,000 |
| MRR | $0 | $0 | $1,000 | $10,000 |
| Discord Members | 100 | 500 | 1,000 | 5,000 |
| Contributors | 5 | 20 | 50 | 100 |

---

## Competitive Positioning

```
                    NEW Projects          EXISTING Projects
                    ───────────           ─────────────────
  Full App      │  Lovable              │                  │
  Generation    │  Bolt.new             │                  │
                │  Replit Agent         │                  │
                │                       │                  │
  UI            │  v0 (Vercel)          │  devsigner ★     │
  Components    │                       │                  │
                │                       │                  │
  Design        │                       │  devsigner ★     │
  Review &      │                       │  (ONLY PLAYER)   │
  Improvement   │                       │                  │
                ─────────────────────────────────────────────
```

**devsigner owns the bottom-right quadrant.** Nobody else does design review + improvement for existing projects. That's our moat.

---

## One-Line Strategy

> **Be the ESLint of design — free, open-source, runs everywhere, everyone needs it, nobody can ignore it.**

Just like ESLint didn't compete with IDEs — it became part of every IDE.
devsigner doesn't compete with Lovable — it becomes part of every developer's workflow.
