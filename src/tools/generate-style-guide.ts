import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import {
  loadContext,
  type DesignIdentityData,
} from "../context/project-context.js";
import {
  PERSONALITIES,
  type DesignPersonality,
  generateIdentityPalette,
  getTypographySystem,
  getSpacingSystem,
  getCornerRadius,
  getShadowSystem,
  moodToHue,
} from "./design-identity.js";

// --- Resolve identity from project or personality name ---

interface ResolvedIdentity {
  personality: string;
  signature: string;
  product: string;
  audience: string;
  boldMoves: string[];
  restraints: string[];
  palette: Record<string, string>;
  typography: Record<string, string>;
  spacing: Record<string, string>;
  corners: Record<string, string>;
  shadows: Record<string, string>;
  buttonPersonality: string;
  cardStyle: string;
  heroTreatment: string;
  motionLevel: string;
}

export function identityDataToResolved(id: DesignIdentityData): ResolvedIdentity {
  return {
    personality: id.personality,
    signature: id.signature,
    product: id.product,
    audience: id.audience,
    boldMoves: id.boldMoves,
    restraints: id.restraints,
    palette: id.palette,
    typography: id.typography,
    spacing: id.spacing,
    corners: id.corners,
    shadows: id.shadows,
    buttonPersonality: id.buttonPersonality,
    cardStyle: id.cardStyle,
    heroTreatment: id.heroTreatment,
    motionLevel: id.motionLevel,
  };
}

function personalityToResolved(personalityName: string): ResolvedIdentity {
  const personality = PERSONALITIES.find(
    (p) => p.name.toLowerCase() === personalityName.toLowerCase(),
  );
  if (!personality) {
    throw new Error(
      `Unknown personality "${personalityName}". Available: ${PERSONALITIES.map((p) => p.name).join(", ")}`,
    );
  }

  const baseHue = moodToHue(personality.keywords[0] || "professional");
  const palette = generateIdentityPalette(personality, baseHue);
  const typography = getTypographySystem(personality.typographyVoice);
  const spacing = getSpacingSystem(personality.contentDensity);
  const corners = getCornerRadius(personality.cornerStyle);
  const shadows = getShadowSystem(personality.shadowStyle);

  return {
    personality: personality.name,
    signature: personality.signature,
    product: personality.description,
    audience: "",
    boldMoves: personality.boldMoves,
    restraints: personality.restraints,
    palette,
    typography,
    spacing,
    corners,
    shadows,
    buttonPersonality: personality.buttonPersonality,
    cardStyle: personality.cardStyle,
    heroTreatment: personality.heroTreatment,
    motionLevel: personality.motionLevel,
  };
}

// --- Extract Google Fonts URL from typography ---

function extractGoogleFontsUrl(typography: Record<string, string>): string {
  const fonts = new Set<string>();
  const fontKeys = ["font_heading", "font_body"];
  for (const key of fontKeys) {
    const val = typography[key];
    if (!val) continue;
    // Extract quoted font names
    const matches = val.match(/'([^']+)'/g);
    if (matches) {
      for (const m of matches) {
        const name = m.replace(/'/g, "");
        // Skip system/generic fonts
        if (!["system-ui", "sans-serif", "serif", "monospace", "Georgia"].includes(name)) {
          fonts.add(name);
        }
      }
    }
  }
  if (fonts.size === 0) return "";
  const families = [...fonts].map((f) => `family=${f.replace(/\s/g, "+")}:wght@300;400;500;600;700;800`).join("&");
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

// --- HTML generation ---

export function generateHtml(id: ResolvedIdentity): string {
  const googleFontsUrl = extractGoogleFontsUrl(id.typography);
  const fontLink = googleFontsUrl ? `<link rel="stylesheet" href="${googleFontsUrl}">` : "";

  const p = id.palette;
  const t = id.typography;
  const s = id.spacing;
  const c = id.corners;
  const sh = id.shadows;

  // Build color swatches HTML
  const colorEntries = Object.entries(p);
  const colorSwatchesHtml = colorEntries
    .map(([key, value]) => {
      const label = key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      const textColor = isLightColor(value) ? "#111" : "#fff";
      return `      <div class="swatch">
        <div class="swatch-color" style="background:${value};color:${textColor}">${value}</div>
        <div class="swatch-label">${label}</div>
      </div>`;
    })
    .join("\n");

  // Typography scale entries
  const typeSizes: [string, string, string][] = [
    ["Heading XXL", t.heading_xxl || "48px", t.weight_heading || "700"],
    ["Heading XL", t.heading_xl || "36px", t.weight_heading || "700"],
    ["Heading LG", t.heading_lg || "28px", t.weight_heading || "700"],
    ["Heading MD", t.heading_md || "22px", t.weight_heading || "700"],
    ["Body LG", t.body_lg || "18px", t.weight_body || "400"],
    ["Body MD", t.body_md || "16px", t.weight_body || "400"],
    ["Body SM", t.body_sm || "14px", t.weight_body || "400"],
    ["Caption", t.caption || "12px", t.weight_body || "400"],
  ];

  const typeScaleHtml = typeSizes
    .map(([name, size, weight]) => {
      const isHeading = name.startsWith("Heading");
      const font = isHeading ? (t.font_heading || "system-ui") : (t.font_body || "system-ui");
      const lh = isHeading ? (t.line_height_heading || "1.2") : (t.line_height_body || "1.6");
      const ls = isHeading ? (t.letter_spacing_heading || "0") : "0";
      return `      <div class="type-row">
        <div class="type-meta">${name}<br><span>${size} / ${weight} / ${lh}</span></div>
        <div class="type-sample" style="font-family:${font};font-size:${size};font-weight:${weight};line-height:${lh};letter-spacing:${ls}">
          The quick brown fox jumps over the lazy dog
        </div>
      </div>`;
    })
    .join("\n");

  // Spacing scale
  const spacingEntries = Object.entries(s);
  const spacingHtml = spacingEntries
    .map(([key, value]) => {
      const label = key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      return `      <div class="spacing-row">
        <div class="spacing-label">${label}<br><span>${value}</span></div>
        <div class="spacing-bar" style="width:${value};"></div>
      </div>`;
    })
    .join("\n");

  // Border radius examples
  const cornerEntries = Object.entries(c);
  const radiusHtml = cornerEntries
    .map(([key, value]) => {
      return `      <div class="radius-item">
        <div class="radius-box" style="border-radius:${value};"></div>
        <div class="radius-label">${key}<br><span>${value}</span></div>
      </div>`;
    })
    .join("\n");

  // Shadow examples
  const shadowEntries = Object.entries(sh);
  const shadowsHtml = shadowEntries
    .map(([key, value]) => {
      return `      <div class="shadow-item">
        <div class="shadow-box" style="box-shadow:${value};">${key}</div>
        <div class="shadow-label"><code>${value}</code></div>
      </div>`;
    })
    .join("\n");

  // Do's and Don'ts
  const dosHtml = id.boldMoves.map((m) => `        <li>${escapeHtml(m)}</li>`).join("\n");
  const dontsHtml = id.restraints.map((r) => `        <li>${escapeHtml(r)}</li>`).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Style Guide — ${escapeHtml(id.personality)}</title>
  ${fontLink}
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }

    body {
      font-family: ${t.font_body || "system-ui, sans-serif"};
      font-size: 16px;
      line-height: 1.6;
      color: #1f2937;
      background: #f9fafb;
      display: flex;
      min-height: 100vh;
    }

    /* --- Sidebar --- */
    .sidebar {
      width: 260px;
      min-height: 100vh;
      background: #111827;
      color: #d1d5db;
      padding: 32px 24px;
      position: fixed;
      top: 0;
      left: 0;
      overflow-y: auto;
      z-index: 100;
    }
    .sidebar h2 {
      color: #fff;
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 4px;
      font-family: ${t.font_heading || "system-ui, sans-serif"};
    }
    .sidebar .personality-badge {
      font-size: 12px;
      color: ${p.primary || "#3b82f6"};
      margin-bottom: 24px;
      display: block;
    }
    .sidebar nav a {
      display: block;
      color: #9ca3af;
      text-decoration: none;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 14px;
      transition: all 150ms ease;
    }
    .sidebar nav a:hover {
      background: rgba(255,255,255,0.06);
      color: #fff;
    }
    .sidebar nav a.active {
      background: rgba(255,255,255,0.1);
      color: #fff;
    }

    /* --- Main content --- */
    .main {
      margin-left: 260px;
      flex: 1;
      padding: 48px 56px;
      max-width: 960px;
    }

    .section { margin-bottom: 64px; }
    .section h3 {
      font-family: ${t.font_heading || "system-ui, sans-serif"};
      font-size: 28px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 8px;
      letter-spacing: ${t.letter_spacing_heading || "-0.02em"};
    }
    .section .section-desc {
      color: #6b7280;
      font-size: 15px;
      margin-bottom: 32px;
    }
    hr {
      border: none;
      border-top: 1px solid #e5e7eb;
      margin: 48px 0;
    }

    /* --- Header --- */
    .header-block {
      margin-bottom: 48px;
      padding-bottom: 32px;
      border-bottom: 1px solid #e5e7eb;
    }
    .header-block h1 {
      font-family: ${t.font_heading || "system-ui, sans-serif"};
      font-size: ${t.heading_xxl || "48px"};
      font-weight: ${t.weight_heading || "700"};
      color: #111827;
      letter-spacing: ${t.letter_spacing_heading || "-0.02em"};
      line-height: ${t.line_height_heading || "1.2"};
      margin-bottom: 8px;
    }
    .header-block .subtitle {
      color: ${p.primary || "#3b82f6"};
      font-size: 18px;
      font-weight: 500;
      margin-bottom: 12px;
    }
    .header-block blockquote {
      font-style: italic;
      color: #6b7280;
      font-size: 16px;
      border-left: 3px solid ${p.primary || "#3b82f6"};
      padding-left: 16px;
    }

    /* --- Color swatches --- */
    .swatches {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 16px;
    }
    .swatch { text-align: center; }
    .swatch-color {
      height: 80px;
      border-radius: ${c.md || "8px"};
      display: flex;
      align-items: flex-end;
      justify-content: center;
      padding-bottom: 8px;
      font-size: 12px;
      font-family: monospace;
      border: 1px solid rgba(0,0,0,0.06);
    }
    .swatch-label {
      font-size: 13px;
      color: #4b5563;
      margin-top: 6px;
      font-weight: 500;
    }

    /* --- Typography --- */
    .type-row {
      display: flex;
      align-items: baseline;
      gap: 32px;
      padding: 16px 0;
      border-bottom: 1px solid #f3f4f6;
    }
    .type-meta {
      flex: 0 0 160px;
      font-size: 13px;
      font-weight: 600;
      color: #374151;
    }
    .type-meta span {
      font-weight: 400;
      color: #9ca3af;
      font-size: 11px;
    }
    .type-sample {
      flex: 1;
      color: #1f2937;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* --- Spacing --- */
    .spacing-row {
      display: flex;
      align-items: center;
      gap: 24px;
      margin-bottom: 12px;
    }
    .spacing-label {
      flex: 0 0 140px;
      font-size: 13px;
      font-weight: 600;
      color: #374151;
    }
    .spacing-label span {
      font-weight: 400;
      color: #9ca3af;
      font-size: 12px;
      font-family: monospace;
    }
    .spacing-bar {
      height: 24px;
      background: ${p.primary || "#3b82f6"};
      opacity: 0.2;
      border-radius: 4px;
      min-width: 4px;
    }

    /* --- Border radius --- */
    .radius-grid {
      display: flex;
      gap: 24px;
      flex-wrap: wrap;
    }
    .radius-item { text-align: center; }
    .radius-box {
      width: 80px;
      height: 80px;
      background: ${p.primary || "#3b82f6"};
      opacity: 0.15;
      border: 2px solid ${p.primary || "#3b82f6"};
    }
    .radius-label {
      font-size: 13px;
      font-weight: 600;
      color: #374151;
      margin-top: 8px;
    }
    .radius-label span {
      display: block;
      font-weight: 400;
      color: #9ca3af;
      font-size: 12px;
      font-family: monospace;
    }

    /* --- Shadows --- */
    .shadow-grid {
      display: flex;
      gap: 32px;
      flex-wrap: wrap;
    }
    .shadow-item { text-align: center; max-width: 200px; }
    .shadow-box {
      width: 160px;
      height: 100px;
      background: #fff;
      border-radius: ${c.md || "8px"};
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .shadow-label {
      margin-top: 8px;
    }
    .shadow-label code {
      font-size: 11px;
      color: #9ca3af;
      word-break: break-all;
    }

    /* --- Buttons --- */
    .button-row {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      align-items: center;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 12px 28px;
      font-size: 15px;
      font-weight: 600;
      font-family: ${t.font_body || "system-ui, sans-serif"};
      border: none;
      cursor: pointer;
      transition: all 200ms ease;
      border-radius: ${c.md || "8px"};
    }
    .btn-primary {
      background: ${p.primary || "#3b82f6"};
      color: #fff;
    }
    .btn-primary:hover {
      opacity: 0.9;
      transform: translateY(-1px);
      box-shadow: ${sh.md || "0 4px 6px rgba(0,0,0,0.1)"};
    }
    .btn-secondary {
      background: transparent;
      color: ${p.primary || "#3b82f6"};
      border: 1.5px solid ${p.primary || "#3b82f6"};
    }
    .btn-secondary:hover {
      background: ${p.primary || "#3b82f6"};
      color: #fff;
    }
    .btn-ghost {
      background: transparent;
      color: #6b7280;
    }
    .btn-ghost:hover {
      background: #f3f4f6;
      color: #111827;
    }

    /* --- Card --- */
    .card-example {
      background: #fff;
      border-radius: ${c.lg || "12px"};
      box-shadow: ${sh.md || "0 1px 3px rgba(0,0,0,0.08)"};
      padding: ${s.card_padding || "24px"};
      max-width: 400px;
      border: 1px solid ${p.border || "#e5e7eb"};
      transition: all 200ms ease;
    }
    .card-example:hover {
      transform: translateY(-2px);
      box-shadow: ${sh.lg || "0 10px 25px rgba(0,0,0,0.1)"};
    }
    .card-example .card-title {
      font-family: ${t.font_heading || "system-ui, sans-serif"};
      font-size: ${t.heading_md || "22px"};
      font-weight: ${t.weight_heading || "700"};
      color: #111827;
      margin-bottom: 8px;
    }
    .card-example .card-desc {
      color: ${p.text_secondary || "#6b7280"};
      font-size: ${t.body_sm || "14px"};
      margin-bottom: 16px;
      line-height: 1.6;
    }
    .card-example .card-action {
      color: ${p.primary || "#3b82f6"};
      font-weight: 600;
      font-size: 14px;
      text-decoration: none;
    }
    .card-example .card-action:hover {
      text-decoration: underline;
    }

    /* --- Do's and Don'ts --- */
    .dos-donts {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
    }
    .do-col, .dont-col {
      padding: 24px;
      border-radius: ${c.md || "8px"};
    }
    .do-col {
      background: #f0fdf4;
      border-left: 4px solid #22c55e;
    }
    .dont-col {
      background: #fef2f2;
      border-left: 4px solid #ef4444;
    }
    .do-col h4, .dont-col h4 {
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 12px;
    }
    .do-col h4 { color: #15803d; }
    .dont-col h4 { color: #dc2626; }
    .do-col ul, .dont-col ul {
      list-style: none;
      padding: 0;
    }
    .do-col li, .dont-col li {
      font-size: 14px;
      padding: 6px 0;
      color: #374151;
      line-height: 1.5;
    }
    .do-col li::before { content: "\\2713  "; color: #22c55e; font-weight: 700; }
    .dont-col li::before { content: "\\2717  "; color: #ef4444; font-weight: 700; }

    /* --- Responsive --- */
    @media (max-width: 900px) {
      .sidebar { display: none; }
      .main { margin-left: 0; padding: 32px 24px; }
      .dos-donts { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>

  <!-- Sidebar -->
  <aside class="sidebar">
    <h2>${escapeHtml(id.personality)}</h2>
    <span class="personality-badge">Style Guide</span>
    <nav>
      <a href="#colors">Colors</a>
      <a href="#typography">Typography</a>
      <a href="#spacing">Spacing</a>
      <a href="#radius">Border Radius</a>
      <a href="#shadows">Shadows</a>
      <a href="#buttons">Buttons</a>
      <a href="#card">Card</a>
      <a href="#guidelines">Guidelines</a>
    </nav>
  </aside>

  <!-- Main Content -->
  <main class="main">

    <!-- Header -->
    <div class="header-block">
      <h1>${escapeHtml(id.product || id.personality)}</h1>
      <div class="subtitle">${escapeHtml(id.personality)}</div>
      <blockquote>"${escapeHtml(id.signature)}"</blockquote>
    </div>

    <!-- Colors -->
    <div class="section" id="colors">
      <h3>Color Palette</h3>
      <p class="section-desc">The foundational colors of this design system. Use Primary for key actions, Accent for highlights, and semantic colors for feedback states.</p>
      <div class="swatches">
${colorSwatchesHtml}
      </div>
    </div>

    <hr>

    <!-- Typography -->
    <div class="section" id="typography">
      <h3>Typography Scale</h3>
      <p class="section-desc">
        Heading font: <strong>${escapeHtml(t.font_heading || "system-ui")}</strong> (weight ${t.weight_heading || "700"})
        &nbsp;|&nbsp;
        Body font: <strong>${escapeHtml(t.font_body || "system-ui")}</strong> (weight ${t.weight_body || "400"})
      </p>
${typeScaleHtml}
    </div>

    <hr>

    <!-- Spacing -->
    <div class="section" id="spacing">
      <h3>Spacing Scale</h3>
      <p class="section-desc">Consistent spacing tokens used throughout the design system.</p>
${spacingHtml}
    </div>

    <hr>

    <!-- Border Radius -->
    <div class="section" id="radius">
      <h3>Border Radius</h3>
      <p class="section-desc">Corner radius values for components at different scales.</p>
      <div class="radius-grid">
${radiusHtml}
      </div>
    </div>

    <hr>

    <!-- Shadows -->
    <div class="section" id="shadows">
      <h3>Shadows</h3>
      <p class="section-desc">Elevation levels used for cards, modals, and interactive elements.</p>
      <div class="shadow-grid">
${shadowsHtml}
      </div>
    </div>

    <hr>

    <!-- Buttons -->
    <div class="section" id="buttons">
      <h3>Button Styles</h3>
      <p class="section-desc">${escapeHtml(id.buttonPersonality)}</p>
      <div class="button-row">
        <button class="btn btn-primary">Primary Button</button>
        <button class="btn btn-secondary">Secondary Button</button>
        <button class="btn btn-ghost">Ghost Button</button>
      </div>
    </div>

    <hr>

    <!-- Card -->
    <div class="section" id="card">
      <h3>Card Example</h3>
      <p class="section-desc">${escapeHtml(id.cardStyle)}</p>
      <div class="card-example">
        <div class="card-title">Sample Card Title</div>
        <div class="card-desc">This is an example card built with the design identity's spacing, radius, shadow, and typography tokens. Hover to see the lift effect.</div>
        <a href="#" class="card-action" onclick="return false">Learn more &rarr;</a>
      </div>
    </div>

    <hr>

    <!-- Do's and Don'ts -->
    <div class="section" id="guidelines">
      <h3>Design Guidelines</h3>
      <p class="section-desc">Bold moves to embrace, and restraints to respect.</p>
      <div class="dos-donts">
        <div class="do-col">
          <h4>Do (Bold Moves)</h4>
          <ul>
${dosHtml}
          </ul>
        </div>
        <div class="dont-col">
          <h4>Don't (Restraints)</h4>
          <ul>
${dontsHtml}
          </ul>
        </div>
      </div>
    </div>

    <hr>
    <p style="color:#9ca3af;font-size:13px;text-align:center;padding:16px 0;">
      Generated by <strong>devsigner</strong> &mdash; ${escapeHtml(id.personality)} style guide
    </p>
  </main>

</body>
</html>`;
}

// --- Utilities ---

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function isLightColor(hex: string): boolean {
  const cleaned = hex.replace("#", "");
  if (cleaned.length < 6) return true;
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  // Relative luminance approximation
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6;
}

// --- Register tool ---

export function registerGenerateStyleGuide(server: McpServer): void {
  server.tool(
    "generate_style_guide",
    "Generate a standalone, professional HTML style guide from the project's design identity or a personality archetype. Includes color swatches, typography scale, spacing, border radius, shadows, button styles, card example, and design guidelines — all rendered visually with inline CSS.",
    {
      project_path: z
        .string()
        .optional()
        .describe("Path to the project root (reads identity from .devsigner/context.json)"),
      personality: z
        .string()
        .optional()
        .describe(
          `Personality archetype name to generate from (used if no project_path). Available: ${PERSONALITIES.map((p) => p.name).join(", ")}`,
        ),
      output_path: z
        .string()
        .optional()
        .describe("If provided, writes the HTML style guide to this file path"),
    },
    async ({ project_path, personality, output_path }) => {
      let resolved: ResolvedIdentity;

      if (project_path) {
        // Try loading from project context
        const ctx = await loadContext(project_path);
        if (ctx.identity) {
          resolved = identityDataToResolved(ctx.identity);
        } else if (personality) {
          resolved = personalityToResolved(personality);
        } else {
          return {
            content: [{
              type: "text" as const,
              text: `No design identity found in ${project_path}/.devsigner/context.json.\n\nEither run \`design_identity\` first to create one, or pass a \`personality\` parameter.\n\nAvailable personalities: ${PERSONALITIES.map((p) => p.name).join(", ")}`,
            }],
          };
        }
      } else if (personality) {
        resolved = personalityToResolved(personality);
      } else {
        return {
          content: [{
            type: "text" as const,
            text: `Please provide either \`project_path\` (to read the saved identity) or \`personality\` (to generate from an archetype).\n\nAvailable personalities: ${PERSONALITIES.map((p) => p.name).join(", ")}`,
          }],
        };
      }

      const html = generateHtml(resolved);

      // Write to disk if requested
      let writtenPath = "";
      if (output_path) {
        try {
          const dir = dirname(output_path);
          await mkdir(dir, { recursive: true });
          await writeFile(output_path, html, "utf-8");
          writtenPath = output_path;
        } catch (err: any) {
          return {
            content: [{
              type: "text" as const,
              text: `Error writing style guide to ${output_path}: ${err.message}\n\nThe HTML was generated but could not be saved.`,
            }],
          };
        }
      }

      const summaryLines: string[] = [
        `# Style Guide Generated: ${resolved.personality}`,
        ``,
        `> "${resolved.signature}"`,
        ``,
      ];

      if (writtenPath) {
        summaryLines.push(`**Saved to:** \`${writtenPath}\``);
        summaryLines.push(``);
        summaryLines.push(`Open it in a browser to view the full visual style guide.`);
      } else {
        summaryLines.push(`**Tip:** Pass \`output_path\` to save the HTML file to disk and open it in a browser.`);
      }

      summaryLines.push(``);
      summaryLines.push(`## Included Sections`);
      summaryLines.push(`- Color Palette (${Object.keys(resolved.palette).length} colors)`);
      summaryLines.push(`- Typography Scale (8 sizes, heading + body fonts)`);
      summaryLines.push(`- Spacing Scale (${Object.keys(resolved.spacing).length} tokens)`);
      summaryLines.push(`- Border Radius (${Object.keys(resolved.corners).length} sizes)`);
      summaryLines.push(`- Shadows (${Object.keys(resolved.shadows).length} levels)`);
      summaryLines.push(`- Button Styles (primary, secondary, ghost)`);
      summaryLines.push(`- Card Example`);
      summaryLines.push(`- Design Guidelines (do's and don'ts)`);

      return {
        content: [
          { type: "text" as const, text: summaryLines.join("\n") },
          { type: "text" as const, text: html },
        ],
      };
    },
  );
}
