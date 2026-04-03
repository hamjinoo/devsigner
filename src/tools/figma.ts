import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Figma API helpers
// ---------------------------------------------------------------------------

interface FigmaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

interface FigmaPaint {
  type: string;
  color?: FigmaColor;
  visible?: boolean;
  opacity?: number;
}

interface FigmaTypeStyle {
  fontFamily: string;
  fontWeight: number;
  fontSize: number;
  lineHeightPx?: number;
  lineHeightPercent?: number;
  letterSpacing?: number;
  textAlignHorizontal?: string;
  textCase?: string;
}

interface FigmaEffect {
  type: string;
  visible?: boolean;
  radius?: number;
  color?: FigmaColor;
  offset?: { x: number; y: number };
  spread?: number;
}

interface FigmaNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
  characters?: string;
  style?: FigmaTypeStyle;
  fills?: FigmaPaint[];
  strokes?: FigmaPaint[];
  strokeWeight?: number;
  cornerRadius?: number;
  rectangleCornerRadii?: number[];
  effects?: FigmaEffect[];
  absoluteBoundingBox?: { x: number; y: number; width: number; height: number };
  constraints?: { vertical: string; horizontal: string };
  layoutMode?: string;         // AUTO_LAYOUT: "HORIZONTAL" | "VERTICAL" | "NONE"
  primaryAxisSizingMode?: string;
  counterAxisSizingMode?: string;
  primaryAxisAlignItems?: string;
  counterAxisAlignItems?: string;
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  itemSpacing?: number;
  componentId?: string;
  componentProperties?: Record<string, unknown>;
  opacity?: number;
  visible?: boolean;
  clipsContent?: boolean;
}

interface FigmaVariable {
  id: string;
  name: string;
  resolvedType: string;
  valuesByMode: Record<string, unknown>;
}

interface FigmaVariableCollection {
  id: string;
  name: string;
  variableIds: string[];
}

async function figmaFetch(path: string, token: string): Promise<unknown> {
  const res = await fetch(`https://api.figma.com/v1${path}`, {
    headers: { "X-Figma-Token": token },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    if (res.status === 403 || res.status === 401) {
      throw new Error(`Figma API authentication failed (${res.status}). Check your personal access token.`);
    }
    if (res.status === 404) {
      throw new Error(`Figma file/node not found (404). Check the file_key and node_id.`);
    }
    throw new Error(`Figma API error ${res.status}: ${body}`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Color utilities
// ---------------------------------------------------------------------------

function figmaColorToHex(c: FigmaColor): string {
  const to255 = (v: number) => Math.round(Math.max(0, Math.min(1, v)) * 255);
  const hex = (v: number) => to255(v).toString(16).padStart(2, "0");
  if (c.a !== undefined && c.a < 1) {
    return `#${hex(c.r)}${hex(c.g)}${hex(c.b)}${hex(c.a)}`;
  }
  return `#${hex(c.r)}${hex(c.g)}${hex(c.b)}`;
}

function figmaColorToRgba(c: FigmaColor): string {
  const to255 = (v: number) => Math.round(Math.max(0, Math.min(1, v)) * 255);
  return `rgba(${to255(c.r)}, ${to255(c.g)}, ${to255(c.b)}, ${Number(c.a ?? 1).toFixed(2)})`;
}

// ---------------------------------------------------------------------------
// Tree walking helpers for figma_inspect
// ---------------------------------------------------------------------------

interface DesignData {
  colors: Map<string, { hex: string; count: number; usages: string[] }>;
  typography: Map<string, { family: string; size: number; weight: number; lineHeight?: number; count: number }>;
  spacing: Map<number, number>;   // value → count
  components: Map<string, { name: string; type: string; properties: Record<string, unknown> }>;
  layouts: { name: string; mode: string; padding: string; gap: number; width: number; height: number }[];
  variables: { name: string; type: string; values: unknown }[];
}

function collectDesignData(node: FigmaNode, data: DesignData): void {
  // Colors from fills
  if (node.fills && Array.isArray(node.fills)) {
    for (const fill of node.fills) {
      if (fill.type === "SOLID" && fill.color && fill.visible !== false) {
        const hex = figmaColorToHex(fill.color);
        const existing = data.colors.get(hex);
        if (existing) {
          existing.count++;
          if (!existing.usages.includes(node.type)) existing.usages.push(node.type);
        } else {
          data.colors.set(hex, { hex, count: 1, usages: [node.type] });
        }
      }
    }
  }

  // Typography
  if (node.type === "TEXT" && node.style) {
    const s = node.style;
    const key = `${s.fontFamily}|${s.fontSize}|${s.fontWeight}`;
    const existing = data.typography.get(key);
    if (existing) {
      existing.count++;
    } else {
      data.typography.set(key, {
        family: s.fontFamily,
        size: s.fontSize,
        weight: s.fontWeight,
        lineHeight: s.lineHeightPx,
        count: 1,
      });
    }
  }

  // Spacing from auto-layout
  if (node.layoutMode && node.layoutMode !== "NONE") {
    const padding = [node.paddingTop ?? 0, node.paddingRight ?? 0, node.paddingBottom ?? 0, node.paddingLeft ?? 0];
    for (const p of padding) {
      if (p > 0) data.spacing.set(p, (data.spacing.get(p) ?? 0) + 1);
    }
    if (node.itemSpacing && node.itemSpacing > 0) {
      data.spacing.set(node.itemSpacing, (data.spacing.get(node.itemSpacing) ?? 0) + 1);
    }
    const bb = node.absoluteBoundingBox;
    data.layouts.push({
      name: node.name,
      mode: node.layoutMode,
      padding: `${node.paddingTop ?? 0} ${node.paddingRight ?? 0} ${node.paddingBottom ?? 0} ${node.paddingLeft ?? 0}`,
      gap: node.itemSpacing ?? 0,
      width: bb?.width ?? 0,
      height: bb?.height ?? 0,
    });
  }

  // Components
  if (node.type === "COMPONENT" || node.type === "COMPONENT_SET") {
    data.components.set(node.id, {
      name: node.name,
      type: node.type,
      properties: (node.componentProperties ?? {}) as Record<string, unknown>,
    });
  }

  // Recurse
  if (node.children) {
    for (const child of node.children) {
      collectDesignData(child, data);
    }
  }
}

function buildInspectReport(data: DesignData, fileName: string): string {
  const lines: string[] = [];

  lines.push(`# Figma Design Inspection: ${fileName}`, ``);

  // Colors sorted by frequency
  lines.push(`## Colors Used`, ``);
  const colorEntries = [...data.colors.values()].sort((a, b) => b.count - a.count);
  if (colorEntries.length === 0) {
    lines.push(`_No solid fill colors found._`, ``);
  } else {
    lines.push(`| Hex | Count | Used In |`);
    lines.push(`|-----|-------|---------|`);
    for (const c of colorEntries) {
      lines.push(`| \`${c.hex}\` | ${c.count} | ${c.usages.join(", ")} |`);
    }
    lines.push(``);
  }

  // Typography
  lines.push(`## Typography`, ``);
  const typoEntries = [...data.typography.values()].sort((a, b) => b.count - a.count);
  if (typoEntries.length === 0) {
    lines.push(`_No text nodes found._`, ``);
  } else {
    lines.push(`| Font Family | Size | Weight | Line Height | Count |`);
    lines.push(`|-------------|------|--------|-------------|-------|`);
    for (const t of typoEntries) {
      lines.push(`| ${t.family} | ${t.size}px | ${t.weight} | ${t.lineHeight ? `${Math.round(t.lineHeight)}px` : "auto"} | ${t.count} |`);
    }
    lines.push(``);
  }

  // Spacing patterns
  lines.push(`## Spacing Patterns`, ``);
  const spacingEntries = [...data.spacing.entries()].sort((a, b) => b[1] - a[1]);
  if (spacingEntries.length === 0) {
    lines.push(`_No auto-layout spacing found._`, ``);
  } else {
    lines.push(`| Value (px) | Occurrences |`);
    lines.push(`|------------|-------------|`);
    for (const [val, count] of spacingEntries) {
      lines.push(`| ${val} | ${count} |`);
    }
    lines.push(``);
  }

  // Components
  lines.push(`## Components`, ``);
  const compEntries = [...data.components.values()];
  if (compEntries.length === 0) {
    lines.push(`_No components found._`, ``);
  } else {
    for (const comp of compEntries) {
      const propsKeys = Object.keys(comp.properties);
      lines.push(`- **${comp.name}** (${comp.type})${propsKeys.length > 0 ? ` — props: ${propsKeys.join(", ")}` : ""}`);
    }
    lines.push(``);
  }

  // Design tokens / variables
  lines.push(`## Design Tokens (Variables)`, ``);
  if (data.variables.length === 0) {
    lines.push(`_No Figma Variables found in this file._`, ``);
  } else {
    lines.push(`| Name | Type | Values |`);
    lines.push(`|------|------|--------|`);
    for (const v of data.variables) {
      lines.push(`| ${v.name} | ${v.type} | ${JSON.stringify(v.values)} |`);
    }
    lines.push(``);
  }

  // Layout info
  lines.push(`## Layout (Auto-Layout Frames)`, ``);
  if (data.layouts.length === 0) {
    lines.push(`_No auto-layout frames found._`, ``);
  } else {
    lines.push(`| Frame | Direction | Padding (T R B L) | Gap | Size (w×h) |`);
    lines.push(`|-------|-----------|-------------------|-----|------------|`);
    for (const l of data.layouts) {
      lines.push(`| ${l.name} | ${l.mode} | ${l.padding} | ${l.gap}px | ${Math.round(l.width)}×${Math.round(l.height)} |`);
    }
    lines.push(``);
  }

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Code generation helpers for figma_to_code
// ---------------------------------------------------------------------------

type Framework = "react" | "vue" | "svelte" | "html";
type StyleMode = "tailwind" | "inline";

function textTag(fontSize: number): string {
  if (fontSize >= 36) return "h1";
  if (fontSize >= 28) return "h2";
  if (fontSize >= 22) return "h3";
  if (fontSize >= 18) return "h4";
  if (fontSize >= 16) return "h5";
  if (fontSize >= 14) return "p";
  return "span";
}

/** Map Figma weight numbers to Tailwind font-weight classes. */
function twFontWeight(w: number): string {
  if (w <= 100) return "font-thin";
  if (w <= 200) return "font-extralight";
  if (w <= 300) return "font-light";
  if (w <= 400) return "font-normal";
  if (w <= 500) return "font-medium";
  if (w <= 600) return "font-semibold";
  if (w <= 700) return "font-bold";
  if (w <= 800) return "font-extrabold";
  return "font-black";
}

function roundTo(n: number, d: number = 0): number {
  const f = Math.pow(10, d);
  return Math.round(n * f) / f;
}

/** Tailwind-style arbitrary value for px. */
function px(v: number): string {
  const r = Math.round(v);
  // Use standard Tailwind values where available
  const map: Record<number, string> = {
    0: "0", 1: "px", 2: "0.5", 4: "1", 6: "1.5", 8: "2", 10: "2.5", 12: "3",
    14: "3.5", 16: "4", 20: "5", 24: "6", 28: "7", 32: "8", 36: "9",
    40: "10", 44: "11", 48: "12", 56: "14", 64: "16", 80: "20", 96: "24",
    112: "28", 128: "32", 144: "36", 160: "40", 176: "44", 192: "48",
    208: "52", 224: "56", 240: "60", 256: "64", 288: "72", 320: "80", 384: "96",
  };
  return map[r] ?? `[${r}px]`;
}

interface CodeLine {
  indent: number;
  text: string;
}

function nodeToTailwind(node: FigmaNode): string {
  const classes: string[] = [];

  // Layout
  if (node.layoutMode === "HORIZONTAL") {
    classes.push("flex", "flex-row");
  } else if (node.layoutMode === "VERTICAL") {
    classes.push("flex", "flex-col");
  }

  // Alignment
  if (node.primaryAxisAlignItems) {
    const map: Record<string, string> = {
      MIN: "justify-start", CENTER: "justify-center", MAX: "justify-end",
      SPACE_BETWEEN: "justify-between",
    };
    if (map[node.primaryAxisAlignItems]) classes.push(map[node.primaryAxisAlignItems]);
  }
  if (node.counterAxisAlignItems) {
    const map: Record<string, string> = {
      MIN: "items-start", CENTER: "items-center", MAX: "items-end",
    };
    if (map[node.counterAxisAlignItems]) classes.push(map[node.counterAxisAlignItems]);
  }

  // Sizing
  const bb = node.absoluteBoundingBox;
  if (bb) {
    if (node.primaryAxisSizingMode === "FIXED" || !node.layoutMode) {
      classes.push(`w-${px(bb.width)}`);
    }
    if (node.counterAxisSizingMode === "FIXED" || !node.layoutMode) {
      classes.push(`h-${px(bb.height)}`);
    }
  }

  // Padding
  const pt = node.paddingTop ?? 0;
  const pr = node.paddingRight ?? 0;
  const pb = node.paddingBottom ?? 0;
  const pl = node.paddingLeft ?? 0;
  if (pt === pr && pr === pb && pb === pl && pt > 0) {
    classes.push(`p-${px(pt)}`);
  } else {
    if (pt === pb && pt > 0 && pl === pr && pl > 0) {
      classes.push(`py-${px(pt)}`, `px-${px(pl)}`);
    } else {
      if (pt > 0) classes.push(`pt-${px(pt)}`);
      if (pr > 0) classes.push(`pr-${px(pr)}`);
      if (pb > 0) classes.push(`pb-${px(pb)}`);
      if (pl > 0) classes.push(`pl-${px(pl)}`);
    }
  }

  // Gap
  if (node.itemSpacing && node.itemSpacing > 0) {
    classes.push(`gap-${px(node.itemSpacing)}`);
  }

  // Background
  if (node.fills && Array.isArray(node.fills)) {
    for (const fill of node.fills) {
      if (fill.type === "SOLID" && fill.color && fill.visible !== false) {
        classes.push(`bg-[${figmaColorToHex(fill.color)}]`);
        break;
      }
    }
  }

  // Border radius
  if (node.cornerRadius && node.cornerRadius > 0) {
    const r = node.cornerRadius;
    if (r >= 9999) {
      classes.push("rounded-full");
    } else {
      classes.push(`rounded-${px(r)}`);
    }
  } else if (node.rectangleCornerRadii) {
    const [tl, tr, br, bl] = node.rectangleCornerRadii;
    if (tl > 0) classes.push(`rounded-tl-${px(tl)}`);
    if (tr > 0) classes.push(`rounded-tr-${px(tr)}`);
    if (br > 0) classes.push(`rounded-br-${px(br)}`);
    if (bl > 0) classes.push(`rounded-bl-${px(bl)}`);
  }

  // Border / stroke
  if (node.strokes && Array.isArray(node.strokes)) {
    for (const stroke of node.strokes) {
      if (stroke.type === "SOLID" && stroke.color && stroke.visible !== false) {
        const sw = node.strokeWeight ?? 1;
        classes.push(sw === 1 ? "border" : `border-[${sw}px]`);
        classes.push(`border-[${figmaColorToHex(stroke.color)}]`);
        break;
      }
    }
  }

  // Shadows
  if (node.effects && Array.isArray(node.effects)) {
    for (const eff of node.effects) {
      if (eff.type === "DROP_SHADOW" && eff.visible !== false) {
        classes.push("shadow-lg");
        break;
      }
      if (eff.type === "INNER_SHADOW" && eff.visible !== false) {
        classes.push("shadow-inner");
        break;
      }
    }
  }

  // Opacity
  if (node.opacity !== undefined && node.opacity < 1) {
    classes.push(`opacity-${Math.round(node.opacity * 100)}`);
  }

  // Text styles
  if (node.type === "TEXT" && node.style) {
    const s = node.style;
    classes.push(`text-[${s.fontSize}px]`);
    classes.push(twFontWeight(s.fontWeight));
    if (s.lineHeightPx) {
      classes.push(`leading-[${roundTo(s.lineHeightPx, 1)}px]`);
    }
    if (s.letterSpacing && s.letterSpacing !== 0) {
      classes.push(`tracking-[${roundTo(s.letterSpacing, 2)}px]`);
    }
    if (s.textAlignHorizontal) {
      const map: Record<string, string> = { LEFT: "text-left", CENTER: "text-center", RIGHT: "text-right", JUSTIFIED: "text-justify" };
      if (map[s.textAlignHorizontal]) classes.push(map[s.textAlignHorizontal]);
    }
  }

  return classes.join(" ");
}

function nodeToInlineStyle(node: FigmaNode): string {
  const styles: string[] = [];

  if (node.layoutMode === "HORIZONTAL") {
    styles.push("display: flex", "flex-direction: row");
  } else if (node.layoutMode === "VERTICAL") {
    styles.push("display: flex", "flex-direction: column");
  }

  if (node.primaryAxisAlignItems) {
    const map: Record<string, string> = {
      MIN: "flex-start", CENTER: "center", MAX: "flex-end", SPACE_BETWEEN: "space-between",
    };
    if (map[node.primaryAxisAlignItems]) styles.push(`justify-content: ${map[node.primaryAxisAlignItems]}`);
  }
  if (node.counterAxisAlignItems) {
    const map: Record<string, string> = { MIN: "flex-start", CENTER: "center", MAX: "flex-end" };
    if (map[node.counterAxisAlignItems]) styles.push(`align-items: ${map[node.counterAxisAlignItems]}`);
  }

  const bb = node.absoluteBoundingBox;
  if (bb) {
    if (node.primaryAxisSizingMode === "FIXED" || !node.layoutMode) {
      styles.push(`width: ${Math.round(bb.width)}px`);
    }
    if (node.counterAxisSizingMode === "FIXED" || !node.layoutMode) {
      styles.push(`height: ${Math.round(bb.height)}px`);
    }
  }

  const pt = node.paddingTop ?? 0;
  const pr = node.paddingRight ?? 0;
  const pb = node.paddingBottom ?? 0;
  const pl = node.paddingLeft ?? 0;
  if (pt || pr || pb || pl) {
    styles.push(`padding: ${pt}px ${pr}px ${pb}px ${pl}px`);
  }

  if (node.itemSpacing && node.itemSpacing > 0) {
    styles.push(`gap: ${node.itemSpacing}px`);
  }

  if (node.fills && Array.isArray(node.fills)) {
    for (const fill of node.fills) {
      if (fill.type === "SOLID" && fill.color && fill.visible !== false) {
        styles.push(`background-color: ${figmaColorToHex(fill.color)}`);
        break;
      }
    }
  }

  if (node.cornerRadius && node.cornerRadius > 0) {
    styles.push(`border-radius: ${node.cornerRadius}px`);
  } else if (node.rectangleCornerRadii) {
    styles.push(`border-radius: ${node.rectangleCornerRadii.map(r => `${r}px`).join(" ")}`);
  }

  if (node.strokes && Array.isArray(node.strokes)) {
    for (const stroke of node.strokes) {
      if (stroke.type === "SOLID" && stroke.color && stroke.visible !== false) {
        const sw = node.strokeWeight ?? 1;
        styles.push(`border: ${sw}px solid ${figmaColorToHex(stroke.color)}`);
        break;
      }
    }
  }

  if (node.effects && Array.isArray(node.effects)) {
    for (const eff of node.effects) {
      if (eff.type === "DROP_SHADOW" && eff.visible !== false && eff.color && eff.offset) {
        styles.push(`box-shadow: ${eff.offset.x}px ${eff.offset.y}px ${eff.radius ?? 0}px ${eff.spread ?? 0}px ${figmaColorToRgba(eff.color)}`);
        break;
      }
    }
  }

  if (node.opacity !== undefined && node.opacity < 1) {
    styles.push(`opacity: ${roundTo(node.opacity, 2)}`);
  }

  if (node.type === "TEXT" && node.style) {
    const s = node.style;
    styles.push(`font-family: '${s.fontFamily}', sans-serif`);
    styles.push(`font-size: ${s.fontSize}px`);
    styles.push(`font-weight: ${s.fontWeight}`);
    if (s.lineHeightPx) styles.push(`line-height: ${roundTo(s.lineHeightPx, 1)}px`);
    if (s.letterSpacing) styles.push(`letter-spacing: ${roundTo(s.letterSpacing, 2)}px`);
    if (s.textAlignHorizontal) {
      const map: Record<string, string> = { LEFT: "left", CENTER: "center", RIGHT: "right", JUSTIFIED: "justify" };
      if (map[s.textAlignHorizontal]) styles.push(`text-align: ${map[s.textAlignHorizontal]}`);
    }
    // Text color from fills
    if (node.fills && Array.isArray(node.fills)) {
      for (const fill of node.fills) {
        if (fill.type === "SOLID" && fill.color && fill.visible !== false) {
          styles.push(`color: ${figmaColorToHex(fill.color)}`);
          break;
        }
      }
    }
  }

  return styles.join("; ");
}

function buildCodeLines(
  node: FigmaNode,
  styleMode: StyleMode,
  indent: number,
  lines: CodeLine[],
  isComponent: boolean,
): void {
  const pad = "  ".repeat(indent);

  // VECTOR — skip with a comment
  if (node.type === "VECTOR" || node.type === "BOOLEAN_OPERATION" || node.type === "LINE" || node.type === "ELLIPSE" || node.type === "STAR" || node.type === "REGULAR_POLYGON") {
    lines.push({ indent, text: `${pad}<!-- Vector: ${node.name} (skipped) -->` });
    return;
  }

  // TEXT node
  if (node.type === "TEXT") {
    const tag = textTag(node.style?.fontSize ?? 14);
    const content = node.characters ?? "";
    if (styleMode === "tailwind") {
      const tw = nodeToTailwind(node);
      lines.push({ indent, text: `${pad}<${tag}${tw ? ` class="${tw}"` : ""}>${escapeHtml(content)}</${tag}>` });
    } else {
      const style = nodeToInlineStyle(node);
      lines.push({ indent, text: `${pad}<${tag}${style ? ` style="${style}"` : ""}>${escapeHtml(content)}</${tag}>` });
    }
    return;
  }

  // Container nodes: FRAME, GROUP, RECTANGLE, COMPONENT, INSTANCE, SECTION
  const tag = node.type === "SECTION" ? "section" : "div";
  const comment = (node.type === "COMPONENT" || node.type === "INSTANCE") ? ` <!-- Component: ${node.name} -->` : "";

  if (styleMode === "tailwind") {
    const tw = nodeToTailwind(node);
    lines.push({ indent, text: `${pad}<${tag}${tw ? ` class="${tw}"` : ""}>${comment}` });
  } else {
    const style = nodeToInlineStyle(node);
    lines.push({ indent, text: `${pad}<${tag}${style ? ` style="${style}"` : ""}>${comment}` });
  }

  if (node.children) {
    for (const child of node.children) {
      if (child.visible === false) continue;
      buildCodeLines(child, styleMode, indent + 1, lines, false);
    }
  }

  lines.push({ indent, text: `${pad}</${tag}>` });
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function sanitizeComponentName(name: string): string {
  // Remove special chars, PascalCase
  return name
    .replace(/[^a-zA-Z0-9\s_-]/g, "")
    .split(/[\s_-]+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("");
}

function wrapInFramework(framework: Framework, componentName: string, body: string, styleMode: StyleMode): string {
  switch (framework) {
    case "react":
      return [
        `export default function ${componentName}() {`,
        `  return (`,
        body,
        `  );`,
        `}`,
      ].join("\n");

    case "vue":
      return [
        `<template>`,
        body,
        `</template>`,
        ``,
        `<script setup lang="ts">`,
        `// ${componentName} component`,
        `</script>`,
      ].join("\n");

    case "svelte":
      return [
        `<!-- ${componentName}.svelte -->`,
        `<script lang="ts">`,
        `  // ${componentName} component`,
        `</script>`,
        ``,
        body,
      ].join("\n");

    case "html":
    default:
      return [
        `<!DOCTYPE html>`,
        `<html lang="en">`,
        `<head>`,
        `  <meta charset="UTF-8" />`,
        `  <meta name="viewport" content="width=device-width, initial-scale=1.0" />`,
        `  <title>${componentName}</title>`,
        ...(styleMode === "tailwind"
          ? [`  <script src="https://cdn.tailwindcss.com"></script>`]
          : []),
        `</head>`,
        `<body>`,
        body,
        `</body>`,
        `</html>`,
      ].join("\n");
  }
}

// ---------------------------------------------------------------------------
// Tool registration
// ---------------------------------------------------------------------------

export function registerFigmaTools(server: McpServer): void {
  // -------------------------------------------------------------------------
  // figma_inspect
  // -------------------------------------------------------------------------
  server.tool(
    "figma_inspect",
    "Connect to Figma API and extract design system information (colors, typography, spacing, components, variables, layout) from a Figma file or specific frame.",
    {
      file_key: z.string().describe("Figma file key (from URL: figma.com/file/{FILE_KEY}/...)"),
      node_id: z.string().optional().describe("Specific frame/component node ID to inspect (omit for full file)"),
      figma_token: z.string().describe("Figma personal access token"),
    },
    async ({ file_key, node_id, figma_token }) => {
      try {
        // Fetch the file or specific nodes
        let rootNode: FigmaNode;
        let fileName: string;

        if (node_id) {
          const data = (await figmaFetch(
            `/files/${file_key}/nodes?ids=${encodeURIComponent(node_id)}`,
            figma_token,
          )) as { name: string; nodes: Record<string, { document: FigmaNode }> };
          fileName = data.name ?? file_key;
          const nodeData = data.nodes?.[node_id];
          if (!nodeData?.document) {
            return {
              content: [{ type: "text" as const, text: `Error: Node "${node_id}" not found in file "${file_key}".` }],
              isError: true,
            };
          }
          rootNode = nodeData.document;
        } else {
          const data = (await figmaFetch(`/files/${file_key}`, figma_token)) as {
            name: string;
            document: FigmaNode;
          };
          fileName = data.name ?? file_key;
          rootNode = data.document;
        }

        // Collect design data
        const designData: DesignData = {
          colors: new Map(),
          typography: new Map(),
          spacing: new Map(),
          components: new Map(),
          layouts: [],
          variables: [],
        };

        collectDesignData(rootNode, designData);

        // Try to fetch variables (may fail if plan doesn't support it)
        try {
          const varsData = (await figmaFetch(
            `/files/${file_key}/variables/local`,
            figma_token,
          )) as {
            meta?: {
              variables?: Record<string, FigmaVariable>;
              variableCollections?: Record<string, FigmaVariableCollection>;
            };
          };
          if (varsData.meta?.variables) {
            for (const v of Object.values(varsData.meta.variables)) {
              designData.variables.push({
                name: v.name,
                type: v.resolvedType,
                values: v.valuesByMode,
              });
            }
          }
        } catch {
          // Variables API may not be available — silently skip
        }

        const report = buildInspectReport(designData, fileName);

        return {
          content: [{ type: "text" as const, text: report }],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: "text" as const, text: `Error inspecting Figma file: ${message}` }],
          isError: true,
        };
      }
    },
  );

  // -------------------------------------------------------------------------
  // figma_to_code
  // -------------------------------------------------------------------------
  server.tool(
    "figma_to_code",
    "Fetch a specific Figma frame and generate component code (React, Vue, Svelte, or HTML) with Tailwind or inline styles that matches the Figma design.",
    {
      file_key: z.string().describe("Figma file key (from URL: figma.com/file/{FILE_KEY}/...)"),
      node_id: z.string().describe("The specific frame/component node ID to convert to code"),
      figma_token: z.string().describe("Figma personal access token"),
      framework: z.enum(["react", "vue", "svelte", "html"]).describe("Target framework for generated code"),
      style: z
        .enum(["tailwind", "inline"])
        .default("tailwind")
        .describe("Styling approach: Tailwind utility classes or inline styles (default: tailwind)"),
    },
    async ({ file_key, node_id, figma_token, framework, style: styleMode }) => {
      try {
        // Fetch the specific node
        const data = (await figmaFetch(
          `/files/${file_key}/nodes?ids=${encodeURIComponent(node_id)}`,
          figma_token,
        )) as { name: string; nodes: Record<string, { document: FigmaNode }> };

        const nodeData = data.nodes?.[node_id];
        if (!nodeData?.document) {
          return {
            content: [{ type: "text" as const, text: `Error: Node "${node_id}" not found in file "${file_key}".` }],
            isError: true,
          };
        }

        const rootNode = nodeData.document;
        const componentName = sanitizeComponentName(rootNode.name) || "FigmaComponent";

        // Build code lines
        const codeLines: CodeLine[] = [];
        const baseIndent = framework === "react" ? 2 : framework === "html" ? 1 : 0;
        buildCodeLines(rootNode, styleMode, baseIndent, codeLines, true);

        const body = codeLines.map(l => l.text).join("\n");
        const fullCode = wrapInFramework(framework, componentName, body, styleMode);

        // Build summary of what was extracted
        const summary: string[] = [];
        summary.push(`# Generated Code: ${rootNode.name}`, ``);
        summary.push(`- **Framework:** ${framework}`);
        summary.push(`- **Styling:** ${styleMode}`);
        summary.push(`- **Source node:** ${node_id} (${rootNode.type})`);
        const bb = rootNode.absoluteBoundingBox;
        if (bb) {
          summary.push(`- **Dimensions:** ${Math.round(bb.width)} x ${Math.round(bb.height)}px`);
        }
        summary.push(``);

        // Count nodes processed
        let nodeCount = 0;
        let skippedVectors = 0;
        function countNodes(n: FigmaNode) {
          nodeCount++;
          if (n.type === "VECTOR" || n.type === "BOOLEAN_OPERATION" || n.type === "LINE" || n.type === "ELLIPSE") {
            skippedVectors++;
          }
          if (n.children) n.children.forEach(countNodes);
        }
        countNodes(rootNode);
        summary.push(`- **Nodes processed:** ${nodeCount} (${skippedVectors} vectors skipped)`);
        summary.push(``);

        const ext = framework === "react" ? "tsx" : framework === "vue" ? "vue" : framework === "svelte" ? "svelte" : "html";
        summary.push(`\`\`\`${ext}`);
        summary.push(fullCode);
        summary.push(`\`\`\``);

        return {
          content: [{ type: "text" as const, text: summary.join("\n") }],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: "text" as const, text: `Error generating code from Figma: ${message}` }],
          isError: true,
        };
      }
    },
  );
}
