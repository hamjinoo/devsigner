# Launch Posts

## Hacker News — Show HN

**Title:** Show HN: devsigner – 23 MCP tools that give developers design sense

**Post:**

I built an MCP server that solves the biggest pain point I've had as a developer for years: **I can code anything, but my UIs look like they were designed by a database.**

**What it does:**
- `design_review` — paste your code, get a design score out of 100 with specific fixes
- `design_identity` — describe your product, get a complete design personality (not just colors — where to be bold, where to restrain)
- `generate_page` — full landing pages, dashboards, pricing pages with real design opinions
- `design_fix` — auto-corrects spacing, contrast, typography issues
- `analyze_url` — study any website's design patterns (I analyzed 30 top sites to build the trend database)
- `a11y_audit` — WCAG 2.1 accessibility compliance
- Figma integration, persistent sessions, and more

**Key insight:** Every AI design tool generates the same safe, generic UI (white background, blue button, rounded card). devsigner has a "personality system" — 6 archetypes (Bold Minimal, Warm Professional, Energetic Pop, etc.) that make actual design decisions, not just safe ones.

**How it works:** Add one line to your Claude/Cursor config, then just talk naturally: "review my component", "make me a fintech dashboard like Stripe but warmer."

- npm: `npx -y devsigner`
- GitHub: https://github.com/hamjinoo/devsigner
- Landing page: https://hamjinoo.github.io/devsigner/
- It's open source (MIT), runs locally, no API keys needed.

Built the entire thing in one day with Claude Code. The design trend data comes from real analysis of Stripe, Linear, Notion, Vercel, and 26 other sites.

---

## Reddit — r/webdev

**Title:** I built an MCP server that reviews your UI code and tells you exactly what's wrong with the design (open source)

**Post:**

As a developer, I've always struggled with design. I can build a full-stack app but I can't pick two colors that look good together. Sound familiar?

So I built **devsigner** — an MCP server with 23 tools that plugs into Claude or Cursor and gives you design sense:

**The cool parts:**
- Paste your code → get a design score with specific fixes ("padding 13px? Use 12px. That's the 4px grid.")
- Describe your product → get a complete design identity, not just a color palette
- It studied 30 real sites (Stripe, Linear, Notion) and knows what's actually trending
- WCAG accessibility audit built in
- Figma integration — read your design file, convert to code

**What makes it different from v0/Lovable:**
Those tools generate new projects. devsigner improves your existing code. Think of it as ESLint but for design.

`npx -y devsigner` to try it. Open source, MIT licensed.

GitHub: https://github.com/hamjinoo/devsigner

Would love feedback from anyone who's struggled with the same problem.

---

## Reddit — r/reactjs

**Title:** Open source MCP server that reviews your React components for design issues (spacing, contrast, typography)

**Post:**

Built this because I was tired of my React components looking "developer-made."

**devsigner** is an MCP server (works with Claude Desktop, Cursor, Windsurf) that:

1. Reviews your JSX/TSX for design issues — catches bad spacing (13px → use 12px), low contrast, inconsistent typography
2. Auto-fixes the issues and returns corrected code
3. Generates components and full pages with proper design tokens
4. Runs a WCAG 2.1 accessibility audit

It understands Tailwind classes, inline styles, and CSS. No build step needed — just `npx -y devsigner`.

The design rules are based on analysis of 30 top sites. For example: 83% use pill corners (border-radius 16px+), Inter and Geist are the dominant fonts, 47% use dark mode.

https://github.com/hamjinoo/devsigner

---

## Dev.to

**Title:** I analyzed 30 top websites and built an MCP server that teaches your IDE design sense

**Tags:** mcp, design, react, opensource, webdev

*(Use the HN post as the base, expand with code examples and screenshots)*

---

## X/Twitter

**Thread:**

1/ I built devsigner — an MCP server that gives developers design sense.

23 tools. Analyzes your UI, generates pages, fixes issues, audits accessibility.

Open source. `npx -y devsigner`

🧵 Here's what I learned building it:

2/ The biggest insight: AI design tools all generate the SAME design.

White bg. Blue button. Rounded card. Inter font.

It's "safe." It's also forgettable. Every SaaS looks identical.

3/ So I built a "personality system" — 6 archetypes based on real products:

- Bold Minimal (Linear, Vercel)
- Warm Professional (Stripe, Mercury)
- Energetic Pop (Duolingo, Discord)
- Elegant Editorial (Notion, Medium)
- Data Dense (GitHub, Grafana)
- Soft Wellness (Calm, Headspace)

4/ I analyzed 30 real sites to validate.

Results:
- 83% use pill corners (16px+)
- 50/47 light/dark split
- Inter + Geist dominate
- Only 23% use sticky headers (surprising)

This data feeds back into the tool.

5/ The key positioning:

Lovable creates 0→1 (new projects)
devsigner makes 1→10 (improves existing)

Nobody else does design review for existing codebases.

That's the moat.

GitHub: https://github.com/hamjinoo/devsigner
npm: npx -y devsigner
