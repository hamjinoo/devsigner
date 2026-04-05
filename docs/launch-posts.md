# Launch Posts — devsigner v2

## Hacker News — Show HN

**Title:** Show HN: devsigner – MCP server that redesigns your UI code (before/after screenshots)

**Post:**

I built an MCP server that does something no other developer tool does: **it takes your existing UI code and generates a professional redesign with before/after screenshots.**

Not a linter. Not a template. An actual design generator.

**How it works:**

1. Point it at your project: `devsigner serve ./my-app`
2. Dashboard opens with every UI file scored across 5 dimensions (Consistency, Hierarchy, Accessibility, Harmony, Density)
3. Click "Transform" on any file → see your code rendered as-is (Before) and redesigned with a complete design system (After)
4. The design system is generated from patterns learned from 101 analyzed sites (Stripe, Linear, Vercel, Notion, etc.)

**The key difference from v0/Lovable:**
- They build new apps from scratch (0→1)
- devsigner improves *existing* projects (1→10)
- You built your app with Claude Code/Cursor? Great. devsigner makes it look professional.

**What it actually generates:**
- Complete CSS design system (color palette, typography scale, spacing, component styles)
- HTML layout restructuring (nav flexbox, hero centering, card grids, section spacing)
- Tailwind class upgrades (better colors, proper spacing, shadows, hover states)
- All based on what real successful sites actually use, not textbook rules

**39 MCP tools** including: design_review (with screenshots), design_transform (full redesign), design_compare_reference (compare against Stripe/Linear/Vercel), design_fix (before/after), and more.

- npm: `npx -y devsigner`
- GitHub: https://github.com/hamjinoo/devsigner
- Open source (MIT), runs locally, no API keys needed.

The scoring thresholds aren't hardcoded rules — they're statistical ranges (p25/median/p75) computed from 101 real sites. When devsigner says "you have too many colors," it means "SaaS sites typically use 11-15 colors (median 13), you have 22."

---

## Reddit — r/webdev

**Title:** I made a tool that takes your ugly UI code and shows you what it would look like with proper design [open source]

**Post:**

You know that feeling when you build something and it *works* but looks like it was designed by a database? That's been my whole career.

So I built **devsigner** — an MCP server that redesigns your existing code. Not linting. Not suggesting. Actually redesigning.

**Here's what happens:**

Run `devsigner serve ./your-project` → browser opens with a dashboard showing:
- Every UI file in your project with a 5-dimension design scorecard
- Click "Transform" on any file → Before/After screenshots side by side
- The "After" has a complete design system: proper typography scale, color palette, spacing rhythm, component styles

**What makes it different:**
- It learned design patterns from 101 real sites (Stripe, Linear, Notion, Vercel, etc.)
- It detects your page type (landing page? dashboard? pricing page?) and applies different standards
- Recommendations are based on data, not opinions: "SaaS sites use 11-15 colors (median 13), you have 22"
- It restructures your HTML layout (nav → flexbox, cards → grid, hero → centered)
- It upgrades Tailwind classes (adds proper padding, shadows, hover states)

**It's NOT:**
- A Figma replacement
- A competitor to v0/Lovable (they build new apps, this improves existing ones)
- Just a linter (it generates actual design, not just warnings)

Free, open source (MIT), runs locally.
- npm: `npx -y devsigner`
- GitHub: https://github.com/hamjinoo/devsigner

---

## Reddit — r/reactjs

**Title:** Built a design tool for React devs who can't design (MCP server, generates before/after screenshots)

**Post:**

I can build a full React app in a weekend. But ask me to make it look good? I'll spend 3 hours picking button colors and end up with something that looks like 2012.

**devsigner** solves this. It's an MCP server (works with Claude Code, Cursor, etc.) with 39 design tools:

**The one you'll use most:** `design_transform`
- Paste your React component
- It generates a complete design system (colors, typography, spacing) learned from 101 real sites
- Returns before/after screenshots
- Gives you the redesigned code

**Works with Tailwind:** Automatically upgrades your classes — adds proper padding to buttons, shadows to cards, responsive grid columns, hover states.

**Works with plain CSS too:** Injects a complete CSS design system with custom properties.

- npm: `npx -y devsigner`
- GitHub: https://github.com/hamjinoo/devsigner

---

## X/Twitter Thread

**Tweet 1:**
I built a tool that takes your ugly UI code and shows you exactly how it should look.

Before → After screenshots. Real design, not linting.

It learned from 101 sites (Stripe, Linear, Notion). Open source.

🔗 github.com/hamjinoo/devsigner

**Tweet 2:**
How it works:

`devsigner serve ./your-project`

→ Dashboard opens
→ Every file scored on 5 dimensions
→ Click "Transform" on any file
→ See your design vs what devsigner generates

No Figma. No designer. Just better code.

**Tweet 3:**
The scoring isn't random rules.

It analyzed 101 real sites and computed statistical ranges:
- "SaaS sites use 11-15 colors (median 13)"
- "Landing page hero padding: 48-80px"
- "Top fonts: Inter, system-ui, SF Pro"

Your code is scored against real data, not textbook theory.

**Tweet 4:**
Who this is for:

✅ Developers who build with Claude Code / Cursor
✅ Solo devs who can't afford a designer
✅ Teams that want design quality gates on PRs
✅ Anyone whose UI "works but looks meh"

❌ Not for: replacing Figma, competing with Lovable

**Tweet 5:**
39 MCP tools. Open source. MIT license.
Runs locally. No API keys.

`npx -y devsigner`

github.com/hamjinoo/devsigner

---

## Dev.to Article

**Title:** How I Built a Design Generator That Learns From Real Sites (Not Rules)

**Subtitle:** From "your spacing is wrong" to "here's what Stripe does — and here's your code redesigned"

*[Article should include actual Before/After screenshots, the radar chart scorecard, and code examples. Focus on the technical approach: reference-based intelligence vs rule-based linting.]*

**Key sections:**
1. The problem: developers can code but can't design
2. Why linters don't work (hardcoded rules vs real-world patterns)
3. The approach: learn from 101 real sites
4. How the design system generator works
5. Before/After examples
6. How to use it (npm install, MCP config)
7. What's next

---

## Product Hunt

**Tagline:** The design assistant for developers who can't design

**Description:**
devsigner takes your existing UI code and generates a professional redesign. Not a linter — a design generator. Learned from 101 real sites (Stripe, Linear, Notion). Shows before/after screenshots. Works as an MCP server with Claude Code/Cursor.

**Topics:** Developer Tools, Design Tools, AI, Open Source

**Maker comment:**
"I can build anything but my UIs always look like they were designed by a database. So I built the tool I wished existed — one that doesn't just tell me what's wrong, but shows me what it should look like."
