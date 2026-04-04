import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as fs from "node:fs";
import * as fsp from "node:fs/promises";
import * as path from "node:path";
import { parseColor, rgbToHex, rgbToHsl, type RGB } from "../utils/color-utils.js";
import { parseCSSValue, toPx } from "../utils/css-value-parser.js";
import { GRID_BASE, SPACING_SCALE, MAX_DISTINCT_COLORS, MAX_DISTINCT_FONT_SIZES } from "../constants.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TechStack {
  framework: string | null;
  cssFramework: string | null;
  componentLibrary: string | null;
  language: string;
  buildTool: string | null;
}

interface DesignToken {
  source: string;
  type: "color" | "spacing" | "font-size" | "font-weight" | "font-family" | "border-radius" | "shadow" | "other";
  name: string;
  value: string;
}

interface ColorStat {
  hex: string;
  count: number;
  properties: string[];
  inConfig: boolean;
}

interface SpacingStat {
  value: string;
  px: number;
  count: number;
  gridAligned: boolean;
}

interface TypographyStat {
  fonts: Record<string, number>;
  sizes: Record<string, number>;
  weights: Record<string, number>;
}

export interface ProjectDesignProfile {
  techStack: TechStack;
  designTokens: DesignToken[];
  tailwindConfig: Record<string, unknown> | null;
  colors: ColorStat[];
  spacing: SpacingStat[];
  typography: TypographyStat;
  insights: string[];
  filesScanned: number;
}

// ---------------------------------------------------------------------------
// Helpers — safe file reading
// ---------------------------------------------------------------------------

export async function readFileSafe(filePath: string): Promise<string | null> {
  try {
    return await fsp.readFile(filePath, "utf-8");
  } catch {
    return null;
  }
}

export async function readJsonSafe(filePath: string): Promise<Record<string, unknown> | null> {
  const text = await readFileSafe(filePath);
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function collectFiles(projectPath: string, patterns: string[]): Promise<string[]> {
  const files: string[] = [];
  for (const pattern of patterns) {
    try {
      for await (const entry of fsp.glob(pattern, { cwd: projectPath })) {
        const full = path.resolve(projectPath, entry as string);
        // Skip node_modules, dist, build, .next, etc.
        const rel = path.relative(projectPath, full);
        if (/(?:^|[\\/])(?:node_modules|\.next|dist|build|\.git)[\\/]/.test(rel)) continue;
        files.push(full);
      }
    } catch {
      // Pattern not supported or no matches — skip
    }
  }
  return [...new Set(files)];
}

// ---------------------------------------------------------------------------
// 1. Tech stack detection
// ---------------------------------------------------------------------------

export function detectTechStack(pkg: Record<string, unknown> | null): TechStack {
  const stack: TechStack = {
    framework: null,
    cssFramework: null,
    componentLibrary: null,
    language: "javascript",
    buildTool: null,
  };

  if (!pkg) return stack;

  const allDeps: Record<string, string> = {
    ...(pkg.dependencies as Record<string, string> ?? {}),
    ...(pkg.devDependencies as Record<string, string> ?? {}),
  };

  const has = (name: string) => name in allDeps;

  // Framework
  if (has("next")) stack.framework = "Next.js";
  else if (has("nuxt") || has("nuxt3")) stack.framework = "Nuxt";
  else if (has("@sveltejs/kit")) stack.framework = "SvelteKit";
  else if (has("gatsby")) stack.framework = "Gatsby";
  else if (has("remix") || has("@remix-run/react")) stack.framework = "Remix";
  else if (has("astro")) stack.framework = "Astro";
  else if (has("react")) stack.framework = "React";
  else if (has("vue")) stack.framework = "Vue";
  else if (has("svelte")) stack.framework = "Svelte";
  else if (has("@angular/core")) stack.framework = "Angular";

  // CSS framework
  if (has("tailwindcss")) stack.cssFramework = "Tailwind CSS";
  else if (has("styled-components")) stack.cssFramework = "styled-components";
  else if (has("@emotion/react") || has("@emotion/styled")) stack.cssFramework = "Emotion";
  else if (has("sass") || has("node-sass")) stack.cssFramework = "Sass";
  else if (has("less")) stack.cssFramework = "Less";
  else if (has("@vanilla-extract/css")) stack.cssFramework = "Vanilla Extract";
  else if (has("@stitches/react")) stack.cssFramework = "Stitches";

  // Component library
  if (has("@radix-ui/react-dialog") || has("@radix-ui/themes")) stack.componentLibrary = "Radix UI";
  if (has("class-variance-authority") && has("tailwind-merge")) {
    stack.componentLibrary = "shadcn/ui (likely)";
  }
  if (has("@mui/material") || has("@material-ui/core")) stack.componentLibrary = "Material UI";
  if (has("antd")) stack.componentLibrary = "Ant Design";
  if (has("@chakra-ui/react")) stack.componentLibrary = "Chakra UI";
  if (has("@mantine/core")) stack.componentLibrary = "Mantine";
  if (has("@headlessui/react")) stack.componentLibrary = (stack.componentLibrary ? stack.componentLibrary + " + " : "") + "Headless UI";
  if (has("@nextui-org/react")) stack.componentLibrary = "NextUI";
  if (has("primereact")) stack.componentLibrary = "PrimeReact";
  if (has("daisyui")) stack.componentLibrary = (stack.componentLibrary ? stack.componentLibrary + " + " : "") + "daisyUI";

  // Language
  if (has("typescript") || has("@types/node") || has("@types/react")) {
    stack.language = "typescript";
  }

  // Build tool
  if (has("vite")) stack.buildTool = "Vite";
  else if (has("webpack")) stack.buildTool = "Webpack";
  else if (has("esbuild")) stack.buildTool = "esbuild";
  else if (has("tsup")) stack.buildTool = "tsup";
  else if (has("turbo")) stack.buildTool = "Turbopack";
  else if (has("parcel")) stack.buildTool = "Parcel";

  return stack;
}

// ---------------------------------------------------------------------------
// 2. Tailwind config parsing
// ---------------------------------------------------------------------------

export async function parseTailwindConfig(projectPath: string): Promise<{
  raw: Record<string, unknown> | null;
  configColors: Set<string>;
}> {
  const configColors = new Set<string>();
  let raw: Record<string, unknown> | null = null;

  const candidates = [
    "tailwind.config.js",
    "tailwind.config.ts",
    "tailwind.config.mjs",
    "tailwind.config.cjs",
  ];

  let configText: string | null = null;
  for (const name of candidates) {
    configText = await readFileSafe(path.join(projectPath, name));
    if (configText) break;
  }

  if (!configText) return { raw, configColors };

  // Extract color hex values from the config text
  const hexMatches = configText.matchAll(/#(?:[0-9a-fA-F]{3}){1,2}\b/g);
  for (const m of hexMatches) {
    configColors.add(normalizeHex(m[0]));
  }

  // Try to extract JSON-like theme.extend.colors structure via regex
  // We cannot require() arbitrary JS, so we do best-effort regex extraction
  const colorsBlockMatch = configText.match(/colors\s*:\s*\{([\s\S]*?)\}/);
  if (colorsBlockMatch) {
    const innerHexes = colorsBlockMatch[1].matchAll(/#(?:[0-9a-fA-F]{3}){1,2}\b/g);
    for (const m of innerHexes) {
      configColors.add(normalizeHex(m[0]));
    }
  }

  raw = { _note: "Parsed from tailwind config (best-effort regex)", configuredColors: [...configColors] };
  return { raw, configColors };
}

// ---------------------------------------------------------------------------
// 3. Design token discovery
// ---------------------------------------------------------------------------

export async function discoverDesignTokens(projectPath: string): Promise<DesignToken[]> {
  const tokens: DesignToken[] = [];

  // CSS custom properties from globals.css / variables.css / tokens.css / theme.css
  const cssTokenFiles = await collectFiles(projectPath, [
    "**/globals.css",
    "**/global.css",
    "**/variables.css",
    "**/tokens.css",
    "**/theme.css",
    "**/design-tokens.css",
    "**/_variables.scss",
    "**/_tokens.scss",
  ]);

  for (const file of cssTokenFiles) {
    const content = await readFileSafe(file);
    if (!content) continue;
    const relPath = path.relative(projectPath, file);

    // CSS custom properties: --color-primary: #xxx;
    const customPropRegex = /--([\w-]+)\s*:\s*([^;]+)/g;
    let match;
    while ((match = customPropRegex.exec(content)) !== null) {
      const name = match[1];
      const value = match[2].trim();
      let type: DesignToken["type"] = "other";

      if (/color|bg|text|border|accent|primary|secondary|warning|error|success|info|muted|foreground|background|destructive/i.test(name)) {
        type = "color";
      } else if (/spacing|gap|pad|margin|space/i.test(name)) {
        type = "spacing";
      } else if (/font-size|text-size|fs-/i.test(name)) {
        type = "font-size";
      } else if (/font-weight|fw-/i.test(name)) {
        type = "font-weight";
      } else if (/font-family|ff-/i.test(name)) {
        type = "font-family";
      } else if (/radius|rounded/i.test(name)) {
        type = "border-radius";
      } else if (/shadow/i.test(name)) {
        type = "shadow";
      }

      tokens.push({ source: relPath, type, name: `--${name}`, value });
    }
  }

  // JSON token files (W3C DTCG format or flat)
  const jsonTokenFiles = await collectFiles(projectPath, [
    "**/tokens.json",
    "**/design-tokens.json",
    "**/*.tokens.json",
    "**/tokens/**/*.json",
  ]);

  for (const file of jsonTokenFiles) {
    const json = await readJsonSafe(file);
    if (!json) continue;
    const relPath = path.relative(projectPath, file);
    flattenTokenJson(json, relPath, "", tokens);
  }

  // Theme JS/TS files
  const themeFiles = await collectFiles(projectPath, [
    "**/theme.ts",
    "**/theme.js",
    "**/theme/index.ts",
    "**/theme/index.js",
    "**/theme/colors.ts",
    "**/theme/colors.js",
  ]);

  for (const file of themeFiles) {
    const content = await readFileSafe(file);
    if (!content) continue;
    const relPath = path.relative(projectPath, file);

    // Extract hex colors from theme files
    const hexRegex = /["']#(?:[0-9a-fA-F]{3}){1,2}["']/g;
    let hMatch;
    while ((hMatch = hexRegex.exec(content)) !== null) {
      const hex = hMatch[0].replace(/["']/g, "");
      tokens.push({ source: relPath, type: "color", name: hex, value: hex });
    }
  }

  return tokens;
}

function flattenTokenJson(
  obj: Record<string, unknown>,
  source: string,
  prefix: string,
  tokens: DesignToken[]
): void {
  for (const [key, val] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;

    if (val && typeof val === "object" && !Array.isArray(val)) {
      const valObj = val as Record<string, unknown>;
      // DTCG format: { "$value": "...", "$type": "..." }
      if ("$value" in valObj) {
        const tokenType = mapDtcgType(valObj.$type as string | undefined);
        tokens.push({ source, type: tokenType, name: path, value: String(valObj.$value) });
      } else if ("value" in valObj) {
        const tokenType = mapDtcgType(valObj.type as string | undefined);
        tokens.push({ source, type: tokenType, name: path, value: String(valObj.value) });
      } else {
        flattenTokenJson(valObj, source, path, tokens);
      }
    }
  }
}

function mapDtcgType(t: string | undefined): DesignToken["type"] {
  if (!t) return "other";
  const lower = t.toLowerCase();
  if (lower === "color") return "color";
  if (lower === "spacing" || lower === "dimension") return "spacing";
  if (lower === "fontsize" || lower === "font-size") return "font-size";
  if (lower === "fontweight" || lower === "font-weight") return "font-weight";
  if (lower === "fontfamily" || lower === "font-family") return "font-family";
  if (lower === "borderradius" || lower === "border-radius") return "border-radius";
  if (lower === "shadow" || lower === "boxshadow") return "shadow";
  return "other";
}

// ---------------------------------------------------------------------------
// 4. Color extraction from all CSS/component files
// ---------------------------------------------------------------------------

function normalizeHex(hex: string): string {
  const rgb = parseColor(hex);
  return rgb ? rgbToHex(rgb) : hex.toLowerCase();
}

export async function extractProjectColors(
  projectPath: string,
  configColors: Set<string>
): Promise<ColorStat[]> {
  const colorMap = new Map<string, { count: number; properties: Set<string> }>();

  const cssFiles = await collectFiles(projectPath, [
    "**/*.css",
    "**/*.scss",
    "**/*.less",
    "**/*.tsx",
    "**/*.jsx",
    "**/*.vue",
    "**/*.svelte",
  ]);

  const hexRegex = /#(?:[0-9a-fA-F]{3}){1,2}\b/g;
  const rgbRegex = /rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*[\d.]+)?\s*\)/g;
  const hslRegex = /hsla?\(\s*\d+\s*,\s*[\d.]+%\s*,\s*[\d.]+%(?:\s*,\s*[\d.]+)?\s*\)/g;

  const colorPropertyPattern = /(?:color|background(?:-color)?|border(?:-color)?|fill|stroke|outline-color|box-shadow|text-shadow|text-decoration-color)\s*:\s*/i;

  for (const file of cssFiles) {
    const content = await readFileSafe(file);
    if (!content) continue;

    function extractFromRegex(regex: RegExp) {
      let m;
      while ((m = regex.exec(content!)) !== null) {
        const rgb = parseColor(m[0]);
        if (!rgb) continue;
        const hex = rgbToHex(rgb);

        // Determine which CSS property context it's in (best-effort)
        const lineStart = content!.lastIndexOf("\n", m.index) + 1;
        const lineText = content!.slice(lineStart, m.index + m[0].length + 50);
        let propName = "unknown";
        const propMatch = lineText.match(/([\w-]+)\s*:/);
        if (propMatch) propName = propMatch[1];

        const entry = colorMap.get(hex) ?? { count: 0, properties: new Set<string>() };
        entry.count++;
        entry.properties.add(propName);
        colorMap.set(hex, entry);
      }
    }

    extractFromRegex(new RegExp(hexRegex.source, "g"));
    extractFromRegex(new RegExp(rgbRegex.source, "g"));
    extractFromRegex(new RegExp(hslRegex.source, "g"));
  }

  const stats: ColorStat[] = [];
  for (const [hex, data] of colorMap) {
    stats.push({
      hex,
      count: data.count,
      properties: [...data.properties],
      inConfig: configColors.has(hex),
    });
  }

  stats.sort((a, b) => b.count - a.count);
  return stats;
}

// ---------------------------------------------------------------------------
// 5. Spacing extraction
// ---------------------------------------------------------------------------

export async function extractSpacingPatterns(projectPath: string): Promise<SpacingStat[]> {
  const spacingMap = new Map<string, { px: number; count: number }>();

  const spacingProps = new Set([
    "margin", "margin-top", "margin-right", "margin-bottom", "margin-left",
    "padding", "padding-top", "padding-right", "padding-bottom", "padding-left",
    "gap", "row-gap", "column-gap",
  ]);

  const cssFiles = await collectFiles(projectPath, [
    "**/*.css",
    "**/*.scss",
    "**/*.less",
    "**/*.tsx",
    "**/*.jsx",
    "**/*.vue",
    "**/*.svelte",
  ]);

  for (const file of cssFiles) {
    const content = await readFileSafe(file);
    if (!content) continue;

    // CSS declarations
    const declRegex = /([\w-]+)\s*:\s*([^;}{]+)/g;
    let match;
    while ((match = declRegex.exec(content)) !== null) {
      const prop = match[1].trim().toLowerCase();
      if (!spacingProps.has(prop)) continue;

      const values = match[2].trim().split(/\s+/);
      for (const v of values) {
        const parsed = parseCSSValue(v);
        if (!parsed) continue;
        const px = toPx(parsed);
        if (px === null || px <= 0) continue;

        const key = `${px}px`;
        const entry = spacingMap.get(key) ?? { px, count: 0 };
        entry.count++;
        spacingMap.set(key, entry);
      }
    }

    // JSX style objects: padding: "16px", margin: "8px"
    const jsxSpacingRegex = /(?:padding|margin|gap)(?:Top|Right|Bottom|Left)?\s*:\s*(?:"([^"]+)"|'([^']+)'|(\d+))/g;
    while ((match = jsxSpacingRegex.exec(content)) !== null) {
      const val = match[1] || match[2] || match[3];
      if (!val) continue;
      // If it's a bare number, it's pixels in React
      const cssVal = /^\d+$/.test(val) ? `${val}px` : val;
      const values = cssVal.split(/\s+/);
      for (const v of values) {
        const parsed = parseCSSValue(v);
        if (!parsed) continue;
        const px = toPx(parsed);
        if (px === null || px <= 0) continue;

        const key = `${px}px`;
        const entry = spacingMap.get(key) ?? { px, count: 0 };
        entry.count++;
        spacingMap.set(key, entry);
      }
    }
  }

  const stats: SpacingStat[] = [];
  for (const [value, data] of spacingMap) {
    stats.push({
      value,
      px: data.px,
      count: data.count,
      gridAligned: data.px % GRID_BASE === 0,
    });
  }

  stats.sort((a, b) => b.count - a.count);
  return stats;
}

// ---------------------------------------------------------------------------
// 6. Typography extraction
// ---------------------------------------------------------------------------

export async function extractTypography(projectPath: string): Promise<TypographyStat> {
  const fonts: Record<string, number> = {};
  const sizes: Record<string, number> = {};
  const weights: Record<string, number> = {};

  const cssFiles = await collectFiles(projectPath, [
    "**/*.css",
    "**/*.scss",
    "**/*.less",
    "**/*.tsx",
    "**/*.jsx",
    "**/*.vue",
    "**/*.svelte",
  ]);

  for (const file of cssFiles) {
    const content = await readFileSafe(file);
    if (!content) continue;

    // font-family
    const ffRegex = /font-family\s*:\s*([^;}{]+)/gi;
    let m;
    while ((m = ffRegex.exec(content)) !== null) {
      const val = m[1].trim().replace(/["']/g, "").split(",")[0].trim();
      if (val && !val.startsWith("var(")) {
        fonts[val] = (fonts[val] ?? 0) + 1;
      }
    }

    // font-size
    const fsRegex = /font-size\s*:\s*([^;}{]+)/gi;
    while ((m = fsRegex.exec(content)) !== null) {
      const val = m[1].trim();
      if (val && !val.startsWith("var(") && !val.startsWith("inherit") && !val.startsWith("unset")) {
        sizes[val] = (sizes[val] ?? 0) + 1;
      }
    }

    // font-weight
    const fwRegex = /font-weight\s*:\s*([^;}{]+)/gi;
    while ((m = fwRegex.exec(content)) !== null) {
      const val = m[1].trim();
      if (val && !val.startsWith("var(") && !val.startsWith("inherit") && !val.startsWith("unset")) {
        weights[val] = (weights[val] ?? 0) + 1;
      }
    }

    // JSX: fontSize, fontWeight, fontFamily
    const jsxFsRegex = /fontSize\s*:\s*(?:"([^"]+)"|'([^']+)'|(\d+))/g;
    while ((m = jsxFsRegex.exec(content)) !== null) {
      const val = m[1] || m[2] || (m[3] ? `${m[3]}px` : null);
      if (val) sizes[val] = (sizes[val] ?? 0) + 1;
    }

    const jsxFwRegex = /fontWeight\s*:\s*(?:"?(\d+)"?|'(\d+)'|(bold|normal|lighter|bolder))/g;
    while ((m = jsxFwRegex.exec(content)) !== null) {
      const val = m[1] || m[2] || m[3];
      if (val) weights[val] = (weights[val] ?? 0) + 1;
    }

    const jsxFfRegex = /fontFamily\s*:\s*(?:"([^"]+)"|'([^']+)')/g;
    while ((m = jsxFfRegex.exec(content)) !== null) {
      const val = (m[1] || m[2])?.split(",")[0].trim();
      if (val) fonts[val] = (fonts[val] ?? 0) + 1;
    }
  }

  return { fonts, sizes, weights };
}

// ---------------------------------------------------------------------------
// 7. Insight generation
// ---------------------------------------------------------------------------

export function generateInsights(
  profile: Omit<ProjectDesignProfile, "insights">
): string[] {
  const insights: string[] = [];

  // --- Colors ---
  const totalDistinctColors = profile.colors.length;
  const configuredCount = profile.colors.filter((c) => c.inConfig).length;
  const unconfiguredCount = totalDistinctColors - configuredCount;

  if (totalDistinctColors > MAX_DISTINCT_COLORS) {
    if (profile.techStack.cssFramework === "Tailwind CSS" && configuredCount > 0) {
      insights.push(
        `You're using ${totalDistinctColors} distinct colors but only ${configuredCount} are in your Tailwind config. Consider adding the remaining ${unconfiguredCount} to your theme or replacing them with configured values.`
      );
    } else {
      insights.push(
        `Found ${totalDistinctColors} distinct colors across the project. A focused palette typically uses ${MAX_DISTINCT_COLORS} or fewer base colors. Consider consolidating.`
      );
    }
  } else if (totalDistinctColors > 0) {
    insights.push(
      `Your color palette is tight with ${totalDistinctColors} distinct colors — well within the recommended ${MAX_DISTINCT_COLORS}.`
    );
  }

  // Near-duplicate colors
  const hexList = profile.colors.map((c) => c.hex);
  const nearDupes = findNearDuplicateColors(hexList);
  if (nearDupes.length > 0) {
    const pairs = nearDupes.slice(0, 3).map((p) => `${p[0]} and ${p[1]}`).join("; ");
    insights.push(
      `Found ${nearDupes.length} near-duplicate color pair(s) that could be consolidated: ${pairs}${nearDupes.length > 3 ? " (and more)" : ""}.`
    );
  }

  // --- Spacing ---
  const totalSpacingUsages = profile.spacing.reduce((sum, s) => sum + s.count, 0);
  const gridAlignedUsages = profile.spacing.filter((s) => s.gridAligned).reduce((sum, s) => sum + s.count, 0);

  if (totalSpacingUsages > 0) {
    const pct = Math.round((gridAlignedUsages / totalSpacingUsages) * 100);
    if (pct >= 80) {
      insights.push(
        `Your spacing is mostly ${GRID_BASE}px-grid aligned (${pct}%). Great consistency.`
      );
    } else {
      insights.push(
        `Only ${pct}% of spacing values are ${GRID_BASE}px-grid aligned. Consider standardizing on multiples of ${GRID_BASE}px for visual rhythm.`
      );
    }

    // Odd one-off values
    const oddValues = profile.spacing.filter((s) => !s.gridAligned && s.count <= 2);
    if (oddValues.length > 0) {
      const examples = oddValues.slice(0, 4).map((s) => s.value).join(", ");
      insights.push(
        `Found ${oddValues.length} uncommon spacing value(s) used only 1-2 times: ${examples}. These may be candidates for cleanup.`
      );
    }
  }

  // --- Typography ---
  const fontCount = Object.keys(profile.typography.fonts).length;
  const sizeCount = Object.keys(profile.typography.sizes).length;
  const weightCount = Object.keys(profile.typography.weights).length;

  if (fontCount > 3) {
    insights.push(
      `${fontCount} different font families detected. Best practice is 1-2 fonts (one for headings, one for body).`
    );
  }

  if (sizeCount > MAX_DISTINCT_FONT_SIZES) {
    insights.push(
      `${sizeCount} different font sizes in use — consider establishing a type scale with ${MAX_DISTINCT_FONT_SIZES} or fewer sizes.`
    );
  }

  if (weightCount > 4) {
    insights.push(
      `${weightCount} different font weights detected. Most designs work well with 2-3 weights (regular, medium/semibold, bold).`
    );
  }

  // --- Design tokens ---
  const tokenColorCount = profile.designTokens.filter((t) => t.type === "color").length;
  const tokenSpacingCount = profile.designTokens.filter((t) => t.type === "spacing").length;

  if (tokenColorCount === 0 && totalDistinctColors > 3) {
    insights.push(
      "No design tokens for colors were found. Consider defining CSS custom properties or a tokens file to centralize color management."
    );
  }

  if (tokenSpacingCount === 0 && profile.spacing.length > 3) {
    insights.push(
      "No spacing tokens found. Defining a spacing scale as CSS custom properties would improve maintainability."
    );
  }

  // --- Component library ---
  if (!profile.techStack.componentLibrary && profile.techStack.framework) {
    insights.push(
      `No component library detected. Consider adopting one (e.g., shadcn/ui, Radix, Headless UI) to speed up development with accessible, well-designed components.`
    );
  }

  if (insights.length === 0) {
    insights.push("The project looks well-structured from a design perspective.");
  }

  return insights;
}

function findNearDuplicateColors(hexColors: string[]): [string, string][] {
  const pairs: [string, string][] = [];
  const checked = new Set<string>();

  for (let i = 0; i < hexColors.length && i < 50; i++) {
    for (let j = i + 1; j < hexColors.length && j < 50; j++) {
      const a = parseColor(hexColors[i]);
      const b = parseColor(hexColors[j]);
      if (!a || !b) continue;

      const distance = Math.sqrt(
        (a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2
      );

      // Euclidean distance < 30 in RGB space — visually very similar
      if (distance < 30 && distance > 0) {
        const key = [hexColors[i], hexColors[j]].sort().join("-");
        if (!checked.has(key)) {
          checked.add(key);
          pairs.push([hexColors[i], hexColors[j]]);
        }
      }
    }
  }

  return pairs;
}

// ---------------------------------------------------------------------------
// Format output
// ---------------------------------------------------------------------------

export function formatProfile(profile: ProjectDesignProfile): string {
  const lines: string[] = [];

  lines.push("# Project Design Profile");
  lines.push("");

  // Tech Stack
  lines.push("## Tech Stack");
  lines.push("");
  lines.push(`| Aspect | Detected |`);
  lines.push(`|--------|----------|`);
  lines.push(`| Framework | ${profile.techStack.framework ?? "None detected"} |`);
  lines.push(`| CSS Framework | ${profile.techStack.cssFramework ?? "Plain CSS"} |`);
  lines.push(`| Component Library | ${profile.techStack.componentLibrary ?? "None detected"} |`);
  lines.push(`| Language | ${profile.techStack.language} |`);
  lines.push(`| Build Tool | ${profile.techStack.buildTool ?? "Unknown"} |`);
  lines.push("");

  // Design Tokens
  if (profile.designTokens.length > 0) {
    lines.push("## Design Tokens Found");
    lines.push("");
    const grouped = new Map<string, DesignToken[]>();
    for (const t of profile.designTokens) {
      const arr = grouped.get(t.type) ?? [];
      arr.push(t);
      grouped.set(t.type, arr);
    }
    for (const [type, tokens] of grouped) {
      lines.push(`### ${type} (${tokens.length})`);
      for (const t of tokens.slice(0, 15)) {
        lines.push(`- \`${t.name}\`: \`${t.value}\` *(${t.source})*`);
      }
      if (tokens.length > 15) {
        lines.push(`- ... and ${tokens.length - 15} more`);
      }
      lines.push("");
    }
  } else {
    lines.push("## Design Tokens");
    lines.push("");
    lines.push("No design token files found (no CSS custom properties in globals, no tokens.json, no theme files).");
    lines.push("");
  }

  // Colors
  lines.push("## Color Usage");
  lines.push("");
  if (profile.colors.length > 0) {
    lines.push(`**${profile.colors.length} distinct colors** found across the project.`);
    lines.push("");
    lines.push("| Color | Count | Properties | In Config? |");
    lines.push("|-------|-------|------------|------------|");
    for (const c of profile.colors.slice(0, 20)) {
      const props = c.properties.slice(0, 3).join(", ");
      lines.push(`| \`${c.hex}\` | ${c.count} | ${props} | ${c.inConfig ? "Yes" : "No"} |`);
    }
    if (profile.colors.length > 20) {
      lines.push(`| ... | | | ${profile.colors.length - 20} more |`);
    }
  } else {
    lines.push("No colors extracted.");
  }
  lines.push("");

  // Spacing
  lines.push("## Spacing Patterns");
  lines.push("");
  if (profile.spacing.length > 0) {
    const totalUsages = profile.spacing.reduce((s, v) => s + v.count, 0);
    const gridAligned = profile.spacing.filter((s) => s.gridAligned).reduce((s, v) => s + v.count, 0);
    const pct = totalUsages > 0 ? Math.round((gridAligned / totalUsages) * 100) : 0;
    lines.push(`**${profile.spacing.length} distinct spacing values**, ${pct}% are ${GRID_BASE}px-grid aligned.`);
    lines.push("");
    lines.push("| Value | Count | Grid Aligned? |");
    lines.push("|-------|-------|---------------|");
    for (const s of profile.spacing.slice(0, 15)) {
      lines.push(`| ${s.value} | ${s.count} | ${s.gridAligned ? "Yes" : "No"} |`);
    }
    if (profile.spacing.length > 15) {
      lines.push(`| ... | | ${profile.spacing.length - 15} more |`);
    }
  } else {
    lines.push("No spacing patterns extracted.");
  }
  lines.push("");

  // Typography
  lines.push("## Typography");
  lines.push("");

  const { fonts, sizes, weights } = profile.typography;
  const sortedFonts = Object.entries(fonts).sort((a, b) => b[1] - a[1]);
  const sortedSizes = Object.entries(sizes).sort((a, b) => b[1] - a[1]);
  const sortedWeights = Object.entries(weights).sort((a, b) => b[1] - a[1]);

  if (sortedFonts.length > 0) {
    lines.push("**Font Families:**");
    for (const [font, count] of sortedFonts.slice(0, 8)) {
      lines.push(`- \`${font}\` (${count} occurrences)`);
    }
    lines.push("");
  }

  if (sortedSizes.length > 0) {
    lines.push("**Font Sizes:**");
    for (const [size, count] of sortedSizes.slice(0, 10)) {
      lines.push(`- \`${size}\` (${count}x)`);
    }
    lines.push("");
  }

  if (sortedWeights.length > 0) {
    lines.push("**Font Weights:**");
    for (const [weight, count] of sortedWeights.slice(0, 8)) {
      lines.push(`- \`${weight}\` (${count}x)`);
    }
    lines.push("");
  }

  // Insights
  lines.push("## Actionable Insights");
  lines.push("");
  for (let i = 0; i < profile.insights.length; i++) {
    lines.push(`${i + 1}. ${profile.insights[i]}`);
  }
  lines.push("");

  lines.push(`---`);
  lines.push(`*Scanned ${profile.filesScanned} files.*`);

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Tool registration
// ---------------------------------------------------------------------------

export function registerScanProject(server: McpServer): void {
  server.tool(
    "scan_project",
    "Scan a project directory to build a complete design profile: tech stack, design tokens, color palette usage, spacing patterns, typography stats, and component library detection. Returns actionable insights.",
    {
      project_path: z
        .string()
        .describe("Absolute path to the project root directory (must contain package.json or source files)"),
    },
    async ({ project_path }) => {
      // Validate path exists
      try {
        const stat = await fsp.stat(project_path);
        if (!stat.isDirectory()) {
          return {
            content: [{ type: "text" as const, text: `Error: "${project_path}" is not a directory.` }],
            isError: true,
          };
        }
      } catch {
        return {
          content: [{ type: "text" as const, text: `Error: Cannot access "${project_path}". Make sure the path exists and is readable.` }],
          isError: true,
        };
      }

      // Read package.json
      const pkg = await readJsonSafe(path.join(project_path, "package.json"));

      // Run all scans in parallel
      const [techStack, { raw: tailwindConfig, configColors }, designTokens, colors, spacing, typography] =
        await Promise.all([
          Promise.resolve(detectTechStack(pkg)),
          parseTailwindConfig(project_path),
          discoverDesignTokens(project_path),
          extractProjectColors(project_path, new Set()), // We'll fix configColors after
          extractSpacingPatterns(project_path),
          extractTypography(project_path),
        ]);

      // Mark which colors are in the tailwind config
      for (const c of colors) {
        c.inConfig = configColors.has(c.hex);
      }

      // Count total files scanned
      const allFiles = await collectFiles(project_path, [
        "**/*.css", "**/*.scss", "**/*.less",
        "**/*.tsx", "**/*.jsx", "**/*.vue", "**/*.svelte",
        "**/*.ts", "**/*.js",
      ]);

      const profileWithoutInsights = {
        techStack,
        designTokens,
        tailwindConfig,
        colors,
        spacing,
        typography,
        filesScanned: allFiles.length,
      };

      const insights = generateInsights(profileWithoutInsights);

      const profile: ProjectDesignProfile = {
        ...profileWithoutInsights,
        insights,
      };

      return {
        content: [{ type: "text" as const, text: formatProfile(profile) }],
      };
    }
  );
}
