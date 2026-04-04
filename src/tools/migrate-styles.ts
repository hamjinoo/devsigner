import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { detectFramework, type Framework } from "../parsers/framework-detector.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FromFormat = "inline" | "css" | "bootstrap" | "auto";
type ToFormat = "tailwind" | "css_modules" | "styled_components";

interface MigrationResult {
  migratedCode: string;
  changes: string[];
  unmapped: string[];
}

// ---------------------------------------------------------------------------
// Inline CSS -> Tailwind mapping (50+ properties)
// ---------------------------------------------------------------------------

interface TailwindMapping {
  exact?: Record<string, string>;
  pattern?: { regex: RegExp; convert: (value: string) => string | null }[];
}

const SPACING_SCALE: Record<string, string> = {
  "0": "0",
  "0px": "0",
  "1px": "px",
  "0.125rem": "0.5",
  "2px": "0.5",
  "0.25rem": "1",
  "4px": "1",
  "0.375rem": "1.5",
  "6px": "1.5",
  "0.5rem": "2",
  "8px": "2",
  "0.625rem": "2.5",
  "10px": "2.5",
  "0.75rem": "3",
  "12px": "3",
  "0.875rem": "3.5",
  "14px": "3.5",
  "1rem": "4",
  "16px": "4",
  "1.25rem": "5",
  "20px": "5",
  "1.5rem": "6",
  "24px": "6",
  "1.75rem": "7",
  "28px": "7",
  "2rem": "8",
  "32px": "8",
  "2.25rem": "9",
  "36px": "9",
  "2.5rem": "10",
  "40px": "10",
  "2.75rem": "11",
  "44px": "11",
  "3rem": "12",
  "48px": "12",
  "3.5rem": "14",
  "56px": "14",
  "4rem": "16",
  "64px": "16",
  "5rem": "20",
  "80px": "20",
  "6rem": "24",
  "96px": "24",
  "7rem": "28",
  "112px": "28",
  "8rem": "32",
  "128px": "32",
  "9rem": "36",
  "144px": "36",
  "10rem": "40",
  "160px": "40",
  "11rem": "44",
  "176px": "44",
  "12rem": "48",
  "192px": "48",
  "13rem": "52",
  "208px": "52",
  "14rem": "56",
  "224px": "56",
  "15rem": "60",
  "240px": "60",
  "16rem": "64",
  "256px": "64",
  "18rem": "72",
  "288px": "72",
  "20rem": "80",
  "320px": "80",
  "24rem": "96",
  "384px": "96",
};

function spacingToTw(value: string, prefix: string): string | null {
  const v = value.trim();
  if (v === "auto") return `${prefix}-auto`;
  const scale = SPACING_SCALE[v];
  if (scale) return `${prefix}-${scale}`;
  // Arbitrary value fallback
  return `${prefix}-[${v}]`;
}

const FONT_SIZE_MAP: Record<string, string> = {
  "12px": "text-xs",
  "0.75rem": "text-xs",
  "14px": "text-sm",
  "0.875rem": "text-sm",
  "16px": "text-base",
  "1rem": "text-base",
  "18px": "text-lg",
  "1.125rem": "text-lg",
  "20px": "text-xl",
  "1.25rem": "text-xl",
  "24px": "text-2xl",
  "1.5rem": "text-2xl",
  "30px": "text-3xl",
  "1.875rem": "text-3xl",
  "36px": "text-4xl",
  "2.25rem": "text-4xl",
  "48px": "text-5xl",
  "3rem": "text-5xl",
  "60px": "text-6xl",
  "3.75rem": "text-6xl",
  "72px": "text-7xl",
  "4.5rem": "text-7xl",
  "96px": "text-8xl",
  "6rem": "text-8xl",
  "128px": "text-9xl",
  "8rem": "text-9xl",
};

const FONT_WEIGHT_MAP: Record<string, string> = {
  "100": "font-thin",
  "200": "font-extralight",
  "300": "font-light",
  "400": "font-normal",
  "500": "font-medium",
  "600": "font-semibold",
  "700": "font-bold",
  "800": "font-extrabold",
  "900": "font-black",
  "normal": "font-normal",
  "bold": "font-bold",
};

const BORDER_RADIUS_MAP: Record<string, string> = {
  "0": "rounded-none",
  "0px": "rounded-none",
  "0.125rem": "rounded-sm",
  "2px": "rounded-sm",
  "0.25rem": "rounded",
  "4px": "rounded",
  "0.375rem": "rounded-md",
  "6px": "rounded-md",
  "0.5rem": "rounded-lg",
  "8px": "rounded-lg",
  "0.75rem": "rounded-xl",
  "12px": "rounded-xl",
  "1rem": "rounded-2xl",
  "16px": "rounded-2xl",
  "1.5rem": "rounded-3xl",
  "24px": "rounded-3xl",
  "9999px": "rounded-full",
  "50%": "rounded-full",
};

const NAMED_COLORS: Record<string, string> = {
  "white": "white",
  "#fff": "white",
  "#ffffff": "white",
  "black": "black",
  "#000": "black",
  "#000000": "black",
  "transparent": "transparent",
  "currentColor": "current",
  "currentcolor": "current",
  "inherit": "inherit",
};

const TAILWIND_COLORS: Record<string, string> = {
  "#ef4444": "red-500",
  "#f97316": "orange-500",
  "#eab308": "yellow-500",
  "#22c55e": "green-500",
  "#3b82f6": "blue-500",
  "#6366f1": "indigo-500",
  "#8b5cf6": "violet-500",
  "#a855f7": "purple-500",
  "#ec4899": "pink-500",
  "#14b8a6": "teal-500",
  "#06b6d4": "cyan-500",
  "#f43f5e": "rose-500",
  "#64748b": "slate-500",
  "#6b7280": "gray-500",
  "#71717a": "zinc-500",
  "#737373": "neutral-500",
  "#78716c": "stone-500",
  // Common shades
  "#fee2e2": "red-100",
  "#fecaca": "red-200",
  "#fca5a5": "red-300",
  "#f87171": "red-400",
  "#dc2626": "red-600",
  "#b91c1c": "red-700",
  "#dbeafe": "blue-100",
  "#bfdbfe": "blue-200",
  "#93c5fd": "blue-300",
  "#60a5fa": "blue-400",
  "#2563eb": "blue-600",
  "#1d4ed8": "blue-700",
  "#1e40af": "blue-800",
  "#dcfce7": "green-100",
  "#bbf7d0": "green-200",
  "#86efac": "green-300",
  "#4ade80": "green-400",
  "#16a34a": "green-600",
  "#15803d": "green-700",
  "#f3f4f6": "gray-100",
  "#e5e7eb": "gray-200",
  "#d1d5db": "gray-300",
  "#9ca3af": "gray-400",
  "#4b5563": "gray-600",
  "#374151": "gray-700",
  "#1f2937": "gray-800",
  "#111827": "gray-900",
  "#f8fafc": "slate-50",
  "#f1f5f9": "slate-100",
  "#e2e8f0": "slate-200",
  "#cbd5e1": "slate-300",
  "#94a3b8": "slate-400",
  "#475569": "slate-600",
  "#334155": "slate-700",
  "#1e293b": "slate-800",
  "#0f172a": "slate-900",
  "#fafafa": "neutral-50",
  "#f5f5f5": "neutral-100",
  "#e5e5e5": "neutral-200",
  "#d4d4d4": "neutral-300",
  "#a3a3a3": "neutral-400",
  "#525252": "neutral-600",
  "#404040": "neutral-700",
  "#262626": "neutral-800",
  "#171717": "neutral-900",
};

function colorToTw(value: string, prefix: string): string | null {
  const v = value.trim().toLowerCase();
  const named = NAMED_COLORS[v];
  if (named) return `${prefix}-${named}`;

  const twColor = TAILWIND_COLORS[v];
  if (twColor) return `${prefix}-${twColor}`;

  // rgb/rgba
  if (/^rgba?\(/.test(v)) {
    return `${prefix}-[${v.replace(/\s+/g, "_")}]`;
  }

  // Hex arbitrary
  if (/^#[0-9a-f]{3,8}$/i.test(v)) {
    return `${prefix}-[${v}]`;
  }

  return `${prefix}-[${v}]`;
}

function convertPropertyToTailwind(property: string, value: string): string | null {
  const prop = property.trim().toLowerCase();
  const val = value.trim();

  switch (prop) {
    // Display
    case "display":
      switch (val) {
        case "flex": return "flex";
        case "inline-flex": return "inline-flex";
        case "grid": return "grid";
        case "inline-grid": return "inline-grid";
        case "block": return "block";
        case "inline-block": return "inline-block";
        case "inline": return "inline";
        case "none": return "hidden";
        case "contents": return "contents";
        case "table": return "table";
        default: return null;
      }

    // Position
    case "position":
      switch (val) {
        case "static": return "static";
        case "relative": return "relative";
        case "absolute": return "absolute";
        case "fixed": return "fixed";
        case "sticky": return "sticky";
        default: return null;
      }

    // Flexbox
    case "flex-direction":
      switch (val) {
        case "row": return "flex-row";
        case "row-reverse": return "flex-row-reverse";
        case "column": return "flex-col";
        case "column-reverse": return "flex-col-reverse";
        default: return null;
      }
    case "flex-wrap":
      switch (val) {
        case "wrap": return "flex-wrap";
        case "nowrap": return "flex-nowrap";
        case "wrap-reverse": return "flex-wrap-reverse";
        default: return null;
      }
    case "flex-grow":
      return val === "1" ? "grow" : val === "0" ? "grow-0" : `grow-[${val}]`;
    case "flex-shrink":
      return val === "1" ? "shrink" : val === "0" ? "shrink-0" : `shrink-[${val}]`;
    case "flex":
      switch (val) {
        case "1": case "1 1 0%": return "flex-1";
        case "auto": case "1 1 auto": return "flex-auto";
        case "initial": case "0 1 auto": return "flex-initial";
        case "none": case "0 0 auto": return "flex-none";
        default: return `flex-[${val.replace(/\s+/g, "_")}]`;
      }
    case "order":
      if (val === "0") return "order-none";
      if (/^-?\d+$/.test(val)) {
        const n = parseInt(val);
        if (n >= 1 && n <= 12) return `order-${n}`;
        if (n === -9999) return "order-first";
        if (n === 9999) return "order-last";
      }
      return `order-[${val}]`;

    // Alignment
    case "justify-content":
      switch (val) {
        case "flex-start": case "start": return "justify-start";
        case "flex-end": case "end": return "justify-end";
        case "center": return "justify-center";
        case "space-between": return "justify-between";
        case "space-around": return "justify-around";
        case "space-evenly": return "justify-evenly";
        default: return null;
      }
    case "align-items":
      switch (val) {
        case "flex-start": case "start": return "items-start";
        case "flex-end": case "end": return "items-end";
        case "center": return "items-center";
        case "baseline": return "items-baseline";
        case "stretch": return "items-stretch";
        default: return null;
      }
    case "align-self":
      switch (val) {
        case "auto": return "self-auto";
        case "flex-start": case "start": return "self-start";
        case "flex-end": case "end": return "self-end";
        case "center": return "self-center";
        case "stretch": return "self-stretch";
        case "baseline": return "self-baseline";
        default: return null;
      }
    case "align-content":
      switch (val) {
        case "flex-start": case "start": return "content-start";
        case "flex-end": case "end": return "content-end";
        case "center": return "content-center";
        case "space-between": return "content-between";
        case "space-around": return "content-around";
        case "stretch": return "content-stretch";
        default: return null;
      }
    case "gap":
      return spacingToTw(val, "gap");
    case "row-gap":
      return spacingToTw(val, "gap-y");
    case "column-gap":
      return spacingToTw(val, "gap-x");

    // Grid
    case "grid-template-columns":
      if (/^repeat\((\d+),\s*1fr\)$/.test(val)) {
        const n = val.match(/repeat\((\d+)/)?.[1];
        return `grid-cols-${n}`;
      }
      return `grid-cols-[${val.replace(/\s+/g, "_")}]`;
    case "grid-template-rows":
      if (/^repeat\((\d+),\s*1fr\)$/.test(val)) {
        const n = val.match(/repeat\((\d+)/)?.[1];
        return `grid-rows-${n}`;
      }
      return `grid-rows-[${val.replace(/\s+/g, "_")}]`;
    case "grid-column":
      if (/^span\s+(\d+)/.test(val)) {
        const n = val.match(/span\s+(\d+)/)?.[1];
        return `col-span-${n}`;
      }
      return `col-[${val.replace(/\s+/g, "_")}]`;

    // Spacing
    case "padding": return spacingToTw(val, "p");
    case "padding-top": return spacingToTw(val, "pt");
    case "padding-right": return spacingToTw(val, "pr");
    case "padding-bottom": return spacingToTw(val, "pb");
    case "padding-left": return spacingToTw(val, "pl");
    case "padding-inline": return spacingToTw(val, "px");
    case "padding-block": return spacingToTw(val, "py");
    case "margin": return spacingToTw(val, "m");
    case "margin-top": return spacingToTw(val, "mt");
    case "margin-right": return spacingToTw(val, "mr");
    case "margin-bottom": return spacingToTw(val, "mb");
    case "margin-left": return spacingToTw(val, "ml");
    case "margin-inline": return spacingToTw(val, "mx");
    case "margin-block": return spacingToTw(val, "my");

    // Sizing
    case "width":
      if (val === "100%") return "w-full";
      if (val === "100vw") return "w-screen";
      if (val === "auto") return "w-auto";
      if (val === "min-content") return "w-min";
      if (val === "max-content") return "w-max";
      if (val === "fit-content") return "w-fit";
      return SPACING_SCALE[val] ? `w-${SPACING_SCALE[val]}` : `w-[${val}]`;
    case "height":
      if (val === "100%") return "h-full";
      if (val === "100vh") return "h-screen";
      if (val === "auto") return "h-auto";
      if (val === "min-content") return "h-min";
      if (val === "max-content") return "h-max";
      if (val === "fit-content") return "h-fit";
      return SPACING_SCALE[val] ? `h-${SPACING_SCALE[val]}` : `h-[${val}]`;
    case "min-width":
      if (val === "0") return "min-w-0";
      if (val === "100%") return "min-w-full";
      if (val === "min-content") return "min-w-min";
      if (val === "max-content") return "min-w-max";
      if (val === "fit-content") return "min-w-fit";
      return `min-w-[${val}]`;
    case "max-width":
      if (val === "none") return "max-w-none";
      if (val === "100%") return "max-w-full";
      if (val === "min-content") return "max-w-min";
      if (val === "max-content") return "max-w-max";
      if (val === "fit-content") return "max-w-fit";
      return `max-w-[${val}]`;
    case "min-height":
      if (val === "0") return "min-h-0";
      if (val === "100%") return "min-h-full";
      if (val === "100vh") return "min-h-screen";
      return `min-h-[${val}]`;
    case "max-height":
      if (val === "none") return "max-h-none";
      if (val === "100%") return "max-h-full";
      if (val === "100vh") return "max-h-screen";
      return `max-h-[${val}]`;

    // Typography
    case "font-size":
      return FONT_SIZE_MAP[val] || `text-[${val}]`;
    case "font-weight":
      return FONT_WEIGHT_MAP[val] || `font-[${val}]`;
    case "font-style":
      return val === "italic" ? "italic" : val === "normal" ? "not-italic" : null;
    case "font-family":
      if (/sans-serif/i.test(val)) return "font-sans";
      if (/serif/i.test(val) && !/sans-serif/i.test(val)) return "font-serif";
      if (/monospace|mono/i.test(val)) return "font-mono";
      return `font-[${val.replace(/\s+/g, "_")}]`;
    case "text-align":
      switch (val) {
        case "left": return "text-left";
        case "center": return "text-center";
        case "right": return "text-right";
        case "justify": return "text-justify";
        case "start": return "text-start";
        case "end": return "text-end";
        default: return null;
      }
    case "text-decoration":
    case "text-decoration-line":
      if (val.includes("underline")) return "underline";
      if (val.includes("line-through")) return "line-through";
      if (val.includes("overline")) return "overline";
      if (val === "none") return "no-underline";
      return null;
    case "text-transform":
      switch (val) {
        case "uppercase": return "uppercase";
        case "lowercase": return "lowercase";
        case "capitalize": return "capitalize";
        case "none": return "normal-case";
        default: return null;
      }
    case "line-height":
      switch (val) {
        case "1": return "leading-none";
        case "1.25": return "leading-tight";
        case "1.375": return "leading-snug";
        case "1.5": return "leading-normal";
        case "1.625": return "leading-relaxed";
        case "2": return "leading-loose";
        default: return `leading-[${val}]`;
      }
    case "letter-spacing":
      switch (val) {
        case "-0.05em": return "tracking-tighter";
        case "-0.025em": return "tracking-tight";
        case "0": case "0em": return "tracking-normal";
        case "0.025em": return "tracking-wide";
        case "0.05em": return "tracking-wider";
        case "0.1em": return "tracking-widest";
        default: return `tracking-[${val}]`;
      }
    case "white-space":
      switch (val) {
        case "normal": return "whitespace-normal";
        case "nowrap": return "whitespace-nowrap";
        case "pre": return "whitespace-pre";
        case "pre-line": return "whitespace-pre-line";
        case "pre-wrap": return "whitespace-pre-wrap";
        case "break-spaces": return "whitespace-break-spaces";
        default: return null;
      }
    case "word-break":
      if (val === "break-all") return "break-all";
      if (val === "keep-all") return "break-keep";
      return null;
    case "overflow-wrap":
    case "word-wrap":
      if (val === "break-word") return "break-words";
      return null;
    case "text-overflow":
      if (val === "ellipsis") return "text-ellipsis";
      if (val === "clip") return "text-clip";
      return null;

    // Colors
    case "color":
      return colorToTw(val, "text");
    case "background-color":
      return colorToTw(val, "bg");
    case "background":
      // Only handle simple color backgrounds
      if (/^(#|rgb|hsl|[a-z]+$)/i.test(val.trim()) && !/\s/.test(val.trim())) {
        return colorToTw(val, "bg");
      }
      return null;

    // Borders
    case "border":
      if (val === "none" || val === "0") return "border-0";
      if (/^1px\s+solid\s+/.test(val)) {
        const colorPart = val.replace(/^1px\s+solid\s+/, "").trim();
        const colorClass = colorToTw(colorPart, "border");
        return colorClass ? `border ${colorClass}` : "border";
      }
      if (/^(\d+)px\s+solid/.test(val)) {
        const w = val.match(/^(\d+)px/)?.[1];
        return `border-${w === "1" ? "" : w}`.replace(/-$/, "");
      }
      return `border-[${val.replace(/\s+/g, "_")}]`;
    case "border-width":
      switch (val) {
        case "0": case "0px": return "border-0";
        case "1px": return "border";
        case "2px": return "border-2";
        case "4px": return "border-4";
        case "8px": return "border-8";
        default: return `border-[${val}]`;
      }
    case "border-color":
      return colorToTw(val, "border");
    case "border-style":
      switch (val) {
        case "solid": return "border-solid";
        case "dashed": return "border-dashed";
        case "dotted": return "border-dotted";
        case "double": return "border-double";
        case "none": return "border-none";
        default: return null;
      }
    case "border-radius":
      return BORDER_RADIUS_MAP[val] || `rounded-[${val}]`;
    case "border-top-left-radius": return BORDER_RADIUS_MAP[val] ? BORDER_RADIUS_MAP[val].replace("rounded", "rounded-tl") : `rounded-tl-[${val}]`;
    case "border-top-right-radius": return BORDER_RADIUS_MAP[val] ? BORDER_RADIUS_MAP[val].replace("rounded", "rounded-tr") : `rounded-tr-[${val}]`;
    case "border-bottom-left-radius": return BORDER_RADIUS_MAP[val] ? BORDER_RADIUS_MAP[val].replace("rounded", "rounded-bl") : `rounded-bl-[${val}]`;
    case "border-bottom-right-radius": return BORDER_RADIUS_MAP[val] ? BORDER_RADIUS_MAP[val].replace("rounded", "rounded-br") : `rounded-br-[${val}]`;

    // Effects
    case "opacity":
      return `opacity-${Math.round(parseFloat(val) * 100)}`;
    case "box-shadow":
      if (val === "none") return "shadow-none";
      // Map common shadows
      if (/^0\s+1px\s+2px/.test(val)) return "shadow-sm";
      if (/^0\s+1px\s+3px/.test(val)) return "shadow";
      if (/^0\s+4px\s+6px/.test(val)) return "shadow-md";
      if (/^0\s+10px\s+15px/.test(val)) return "shadow-lg";
      if (/^0\s+20px\s+25px/.test(val)) return "shadow-xl";
      if (/^0\s+25px\s+50px/.test(val)) return "shadow-2xl";
      return `shadow-[${val.replace(/\s+/g, "_")}]`;
    case "cursor":
      switch (val) {
        case "pointer": return "cursor-pointer";
        case "default": return "cursor-default";
        case "move": return "cursor-move";
        case "not-allowed": return "cursor-not-allowed";
        case "grab": return "cursor-grab";
        case "grabbing": return "cursor-grabbing";
        case "text": return "cursor-text";
        case "wait": return "cursor-wait";
        case "crosshair": return "cursor-crosshair";
        case "none": return "cursor-none";
        default: return `cursor-[${val}]`;
      }

    // Layout
    case "overflow":
      switch (val) {
        case "hidden": return "overflow-hidden";
        case "auto": return "overflow-auto";
        case "scroll": return "overflow-scroll";
        case "visible": return "overflow-visible";
        default: return null;
      }
    case "overflow-x":
      return `overflow-x-${val}`;
    case "overflow-y":
      return `overflow-y-${val}`;
    case "z-index":
      switch (val) {
        case "0": return "z-0";
        case "10": return "z-10";
        case "20": return "z-20";
        case "30": return "z-30";
        case "40": return "z-40";
        case "50": return "z-50";
        case "auto": return "z-auto";
        default: return `z-[${val}]`;
      }
    case "top": return spacingToTw(val, "top");
    case "right": return spacingToTw(val, "right");
    case "bottom": return spacingToTw(val, "bottom");
    case "left": return spacingToTw(val, "left");
    case "inset":
      if (val === "0") return "inset-0";
      return spacingToTw(val, "inset");

    // Visibility
    case "visibility":
      return val === "hidden" ? "invisible" : val === "visible" ? "visible" : null;

    // Transforms
    case "transform":
      if (val === "none") return "transform-none";
      return null; // Complex transforms need manual conversion
    case "transition":
      if (/all/i.test(val)) return "transition-all";
      if (/color/i.test(val)) return "transition-colors";
      if (/opacity/i.test(val)) return "transition-opacity";
      if (/transform/i.test(val)) return "transition-transform";
      if (/shadow/i.test(val)) return "transition-shadow";
      return "transition";
    case "transition-duration":
      switch (val) {
        case "75ms": return "duration-75";
        case "100ms": return "duration-100";
        case "150ms": return "duration-150";
        case "200ms": return "duration-200";
        case "300ms": return "duration-300";
        case "500ms": return "duration-500";
        case "700ms": return "duration-700";
        case "1000ms": case "1s": return "duration-1000";
        default: return `duration-[${val}]`;
      }
    case "transition-timing-function":
      switch (val) {
        case "ease-in": return "ease-in";
        case "ease-out": return "ease-out";
        case "ease-in-out": return "ease-in-out";
        case "linear": return "ease-linear";
        default: return `ease-[${val.replace(/\s+/g, "_")}]`;
      }

    // Object fit
    case "object-fit":
      switch (val) {
        case "contain": return "object-contain";
        case "cover": return "object-cover";
        case "fill": return "object-fill";
        case "none": return "object-none";
        case "scale-down": return "object-scale-down";
        default: return null;
      }

    // Pointer events
    case "pointer-events":
      return val === "none" ? "pointer-events-none" : val === "auto" ? "pointer-events-auto" : null;

    // User select
    case "user-select":
    case "-webkit-user-select":
      switch (val) {
        case "none": return "select-none";
        case "text": return "select-text";
        case "all": return "select-all";
        case "auto": return "select-auto";
        default: return null;
      }

    // List style
    case "list-style-type":
      switch (val) {
        case "none": return "list-none";
        case "disc": return "list-disc";
        case "decimal": return "list-decimal";
        default: return `list-[${val}]`;
      }

    // Resize
    case "resize":
      switch (val) {
        case "none": return "resize-none";
        case "both": return "resize";
        case "vertical": return "resize-y";
        case "horizontal": return "resize-x";
        default: return null;
      }

    // Appearance
    case "appearance":
    case "-webkit-appearance":
      return val === "none" ? "appearance-none" : null;

    // Outline
    case "outline":
      if (val === "none" || val === "0") return "outline-none";
      return null;

    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Bootstrap -> Tailwind mapping (top 30+ classes)
// ---------------------------------------------------------------------------

const BOOTSTRAP_TO_TAILWIND: Record<string, string> = {
  // Layout
  "container": "max-w-7xl mx-auto px-4",
  "container-fluid": "w-full px-4",
  "row": "flex flex-wrap -mx-3",
  "col": "flex-1 px-3",
  "col-1": "w-1/12 px-3",
  "col-2": "w-2/12 px-3",
  "col-3": "w-3/12 px-3",
  "col-4": "w-4/12 px-3",
  "col-5": "w-5/12 px-3",
  "col-6": "w-6/12 px-3",
  "col-7": "w-7/12 px-3",
  "col-8": "w-8/12 px-3",
  "col-9": "w-9/12 px-3",
  "col-10": "w-10/12 px-3",
  "col-11": "w-11/12 px-3",
  "col-12": "w-full px-3",
  // Responsive cols
  "col-sm-6": "sm:w-1/2 px-3",
  "col-sm-4": "sm:w-1/3 px-3",
  "col-sm-3": "sm:w-1/4 px-3",
  "col-md-1": "md:w-1/12 px-3",
  "col-md-2": "md:w-2/12 px-3",
  "col-md-3": "md:w-1/4 px-3",
  "col-md-4": "md:w-1/3 px-3",
  "col-md-5": "md:w-5/12 px-3",
  "col-md-6": "md:w-1/2 px-3",
  "col-md-7": "md:w-7/12 px-3",
  "col-md-8": "md:w-2/3 px-3",
  "col-md-9": "md:w-3/4 px-3",
  "col-md-10": "md:w-10/12 px-3",
  "col-md-11": "md:w-11/12 px-3",
  "col-md-12": "md:w-full px-3",
  "col-lg-3": "lg:w-1/4 px-3",
  "col-lg-4": "lg:w-1/3 px-3",
  "col-lg-6": "lg:w-1/2 px-3",
  "col-lg-8": "lg:w-2/3 px-3",
  "col-lg-9": "lg:w-3/4 px-3",
  "col-lg-12": "lg:w-full px-3",

  // Buttons
  "btn": "px-4 py-2 rounded font-medium inline-block text-center",
  "btn-primary": "bg-blue-600 text-white hover:bg-blue-700",
  "btn-secondary": "bg-gray-600 text-white hover:bg-gray-700",
  "btn-success": "bg-green-600 text-white hover:bg-green-700",
  "btn-danger": "bg-red-600 text-white hover:bg-red-700",
  "btn-warning": "bg-yellow-500 text-white hover:bg-yellow-600",
  "btn-info": "bg-cyan-500 text-white hover:bg-cyan-600",
  "btn-light": "bg-gray-100 text-gray-800 hover:bg-gray-200",
  "btn-dark": "bg-gray-800 text-white hover:bg-gray-900",
  "btn-outline-primary": "border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white",
  "btn-outline-secondary": "border border-gray-600 text-gray-600 hover:bg-gray-600 hover:text-white",
  "btn-lg": "px-6 py-3 text-lg",
  "btn-sm": "px-3 py-1.5 text-sm",
  "btn-block": "w-full",

  // Typography
  "h1": "text-4xl font-bold",
  "h2": "text-3xl font-bold",
  "h3": "text-2xl font-bold",
  "h4": "text-xl font-bold",
  "h5": "text-lg font-bold",
  "h6": "text-base font-bold",
  "lead": "text-xl font-light",
  "text-muted": "text-gray-500",
  "text-primary": "text-blue-600",
  "text-success": "text-green-600",
  "text-danger": "text-red-600",
  "text-warning": "text-yellow-600",
  "text-info": "text-cyan-600",
  "text-center": "text-center",
  "text-left": "text-left",
  "text-right": "text-right",
  "font-weight-bold": "font-bold",
  "font-weight-normal": "font-normal",
  "font-italic": "italic",
  "text-uppercase": "uppercase",
  "text-lowercase": "lowercase",
  "text-capitalize": "capitalize",
  "text-truncate": "truncate",
  "small": "text-sm",

  // Display
  "d-none": "hidden",
  "d-block": "block",
  "d-inline": "inline",
  "d-inline-block": "inline-block",
  "d-flex": "flex",
  "d-inline-flex": "inline-flex",
  "d-grid": "grid",
  "d-md-none": "md:hidden",
  "d-md-block": "md:block",
  "d-md-flex": "md:flex",
  "d-lg-none": "lg:hidden",
  "d-lg-block": "lg:block",
  "d-lg-flex": "lg:flex",

  // Flex
  "flex-row": "flex-row",
  "flex-column": "flex-col",
  "flex-wrap": "flex-wrap",
  "flex-nowrap": "flex-nowrap",
  "justify-content-start": "justify-start",
  "justify-content-end": "justify-end",
  "justify-content-center": "justify-center",
  "justify-content-between": "justify-between",
  "justify-content-around": "justify-around",
  "align-items-start": "items-start",
  "align-items-end": "items-end",
  "align-items-center": "items-center",
  "align-items-stretch": "items-stretch",
  "align-self-start": "self-start",
  "align-self-end": "self-end",
  "align-self-center": "self-center",

  // Spacing
  "m-0": "m-0",
  "m-1": "m-1",
  "m-2": "m-2",
  "m-3": "m-3",
  "m-4": "m-4",
  "m-5": "m-5",
  "m-auto": "m-auto",
  "mt-0": "mt-0",
  "mt-1": "mt-1",
  "mt-2": "mt-2",
  "mt-3": "mt-3",
  "mt-4": "mt-4",
  "mt-5": "mt-5",
  "mb-0": "mb-0",
  "mb-1": "mb-1",
  "mb-2": "mb-2",
  "mb-3": "mb-3",
  "mb-4": "mb-4",
  "mb-5": "mb-5",
  "mx-auto": "mx-auto",
  "my-0": "my-0",
  "my-1": "my-1",
  "my-2": "my-2",
  "my-3": "my-3",
  "my-4": "my-4",
  "my-5": "my-5",
  "p-0": "p-0",
  "p-1": "p-1",
  "p-2": "p-2",
  "p-3": "p-3",
  "p-4": "p-4",
  "p-5": "p-5",
  "pt-0": "pt-0",
  "pt-1": "pt-1",
  "pt-2": "pt-2",
  "pt-3": "pt-3",
  "pt-4": "pt-4",
  "pt-5": "pt-5",
  "pb-0": "pb-0",
  "pb-1": "pb-1",
  "pb-2": "pb-2",
  "pb-3": "pb-3",
  "pb-4": "pb-4",
  "pb-5": "pb-5",
  "px-0": "px-0",
  "px-1": "px-1",
  "px-2": "px-2",
  "px-3": "px-3",
  "px-4": "px-4",
  "px-5": "px-5",
  "py-0": "py-0",
  "py-1": "py-1",
  "py-2": "py-2",
  "py-3": "py-3",
  "py-4": "py-4",
  "py-5": "py-5",

  // Cards
  "card": "rounded-lg border border-gray-200 bg-white shadow-sm",
  "card-body": "p-4",
  "card-header": "px-4 py-3 border-b border-gray-200",
  "card-footer": "px-4 py-3 border-t border-gray-200",
  "card-title": "text-lg font-semibold mb-2",
  "card-text": "text-gray-700",

  // Alerts
  "alert": "p-4 rounded-lg mb-4",
  "alert-primary": "bg-blue-100 text-blue-800 border border-blue-200",
  "alert-success": "bg-green-100 text-green-800 border border-green-200",
  "alert-danger": "bg-red-100 text-red-800 border border-red-200",
  "alert-warning": "bg-yellow-100 text-yellow-800 border border-yellow-200",
  "alert-info": "bg-cyan-100 text-cyan-800 border border-cyan-200",

  // Badges
  "badge": "inline-block px-2 py-1 text-xs font-bold rounded",
  "badge-primary": "bg-blue-600 text-white",
  "badge-secondary": "bg-gray-600 text-white",
  "badge-success": "bg-green-600 text-white",
  "badge-danger": "bg-red-600 text-white",

  // Forms
  "form-control": "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
  "form-group": "mb-4",
  "form-label": "block mb-1 font-medium text-gray-700",
  "form-check": "flex items-center",
  "form-check-input": "mr-2",
  "form-check-label": "text-gray-700",
  "form-text": "mt-1 text-sm text-gray-500",

  // Tables
  "table": "w-full border-collapse",
  "table-striped": "even:bg-gray-50",
  "table-bordered": "border border-gray-300",
  "table-hover": "hover:bg-gray-100",

  // Nav
  "nav": "flex",
  "nav-link": "px-3 py-2 text-gray-600 hover:text-gray-900",
  "nav-item": "list-none",
  "navbar": "flex items-center justify-between px-4 py-3",
  "navbar-brand": "text-xl font-bold",

  // Utilities
  "rounded": "rounded",
  "rounded-circle": "rounded-full",
  "rounded-0": "rounded-none",
  "shadow": "shadow",
  "shadow-sm": "shadow-sm",
  "shadow-lg": "shadow-lg",
  "shadow-none": "shadow-none",
  "w-25": "w-1/4",
  "w-50": "w-1/2",
  "w-75": "w-3/4",
  "w-100": "w-full",
  "h-100": "h-full",
  "overflow-auto": "overflow-auto",
  "overflow-hidden": "overflow-hidden",
  "position-relative": "relative",
  "position-absolute": "absolute",
  "position-fixed": "fixed",
  "position-sticky": "sticky",
  "fixed-top": "fixed top-0 left-0 right-0",
  "fixed-bottom": "fixed bottom-0 left-0 right-0",
  "sticky-top": "sticky top-0",
  "float-left": "float-left",
  "float-right": "float-right",
  "float-none": "float-none",
  "clearfix": "after:content-[''] after:table after:clear-both",
  "visible": "visible",
  "invisible": "invisible",
  "sr-only": "sr-only",
  "img-fluid": "max-w-full h-auto",
  "img-thumbnail": "border rounded p-1 max-w-full h-auto",
  "list-unstyled": "list-none p-0",
  "list-inline": "flex gap-4 list-none p-0",
  "list-inline-item": "inline",
};

// ---------------------------------------------------------------------------
// Auto-detection of source format
// ---------------------------------------------------------------------------

function detectFromFormat(code: string): FromFormat {
  // Check for Bootstrap classes
  const bootstrapClasses = Object.keys(BOOTSTRAP_TO_TAILWIND);
  let bootstrapCount = 0;
  for (const cls of bootstrapClasses) {
    const escaped = cls.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`\\b${escaped}\\b`).test(code)) {
      bootstrapCount++;
    }
    if (bootstrapCount >= 3) return "bootstrap";
  }

  // Check for inline styles
  const hasInlineStyles = /style\s*=\s*["'{]/.test(code);
  const hasCSS = /<style[\s>]|@media|@keyframes|\{[\s\S]*?[\w-]+\s*:\s*[^;]+;[\s\S]*?\}/.test(code);

  if (hasInlineStyles && !hasCSS) return "inline";
  if (hasCSS) return "css";
  if (hasInlineStyles) return "inline";

  return "inline";
}

// ---------------------------------------------------------------------------
// Inline -> Tailwind migration
// ---------------------------------------------------------------------------

function migrateInlineToTailwind(code: string, fw: Framework): MigrationResult {
  const changes: string[] = [];
  const unmapped: string[] = [];
  let migratedCode = code;

  if (fw === "react") {
    // JSX: style={{ prop: "value", ... }} -> className="..."
    const jsxStyleRegex = /style\s*=\s*\{\{([\s\S]*?)\}\}/g;
    migratedCode = migratedCode.replace(jsxStyleRegex, (_match, styleContent: string) => {
      const classes: string[] = [];
      const failedProps: string[] = [];

      // Parse camelCase JS object properties
      const pairRegex = /(\w+)\s*:\s*(?:"([^"]*)"|'([^']*)'|`([^`]*)`|(\d+[\w%]*)|([\w.]+))/g;
      let pairMatch;

      while ((pairMatch = pairRegex.exec(styleContent)) !== null) {
        const camelProp = pairMatch[1];
        const value = pairMatch[2] ?? pairMatch[3] ?? pairMatch[4] ?? pairMatch[5] ?? pairMatch[6] ?? "";
        const kebabProp = camelProp.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

        // Handle numeric values (React treats numbers as px)
        let processedValue = value;
        if (/^\d+$/.test(processedValue) && kebabProp !== "opacity" && kebabProp !== "z-index" && kebabProp !== "flex-grow" && kebabProp !== "flex-shrink" && kebabProp !== "order" && kebabProp !== "font-weight" && kebabProp !== "line-height") {
          processedValue = `${processedValue}px`;
        }

        const twClass = convertPropertyToTailwind(kebabProp, processedValue);
        if (twClass) {
          classes.push(twClass);
          changes.push(`\`${kebabProp}: ${processedValue}\` -> \`${twClass}\``);
        } else {
          failedProps.push(`${camelProp}: "${value}"`);
          unmapped.push(`${kebabProp}: ${processedValue}`);
        }
      }

      if (failedProps.length > 0 && classes.length > 0) {
        // Keep remaining styles as inline, add className for converted ones
        return `className="${classes.join(" ")}" style={{${failedProps.join(", ")}}}`;
      } else if (classes.length > 0) {
        return `className="${classes.join(" ")}"`;
      }
      return _match;
    });

    // Merge multiple className attributes if any were created next to existing ones
    migratedCode = migratedCode.replace(
      /className="([^"]*?)"\s+className="([^"]*?)"/g,
      (_m, a: string, b: string) => `className="${a} ${b}"`
    );
  } else {
    // HTML: style="prop: value; ..." -> class="..."
    const htmlStyleRegex = /style\s*=\s*"([^"]*)"/gi;
    migratedCode = migratedCode.replace(htmlStyleRegex, (_match, styleContent: string) => {
      const classes: string[] = [];
      const failedDecls: string[] = [];

      const declarations = styleContent.split(";").filter((s) => s.trim());
      for (const decl of declarations) {
        const colonIdx = decl.indexOf(":");
        if (colonIdx === -1) continue;

        const prop = decl.slice(0, colonIdx).trim();
        const value = decl.slice(colonIdx + 1).trim();

        const twClass = convertPropertyToTailwind(prop, value);
        if (twClass) {
          classes.push(twClass);
          changes.push(`\`${prop}: ${value}\` -> \`${twClass}\``);
        } else {
          failedDecls.push(`${prop}: ${value}`);
          unmapped.push(`${prop}: ${value}`);
        }
      }

      const classAttr = fw === "react" ? "className" : "class";

      if (failedDecls.length > 0 && classes.length > 0) {
        return `${classAttr}="${classes.join(" ")}" style="${failedDecls.join("; ")}"`;
      } else if (classes.length > 0) {
        return `${classAttr}="${classes.join(" ")}"`;
      }
      return _match;
    });
  }

  return { migratedCode, changes, unmapped };
}

// ---------------------------------------------------------------------------
// CSS -> Tailwind migration
// ---------------------------------------------------------------------------

function migrateCSSToTailwind(code: string, _fw: Framework): MigrationResult {
  const changes: string[] = [];
  const unmapped: string[] = [];
  const mappingTable: { selector: string; property: string; value: string; tailwind: string }[] = [];

  // Extract CSS blocks
  const styleTagRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let cssContent = "";
  let match;

  while ((match = styleTagRegex.exec(code)) !== null) {
    cssContent += match[1] + "\n";
  }

  // If no <style> tags, check if the code itself is CSS
  if (!cssContent && /\{[\s\S]*\}/.test(code) && !/<\w+/.test(code.replace(/<style[^>]*>/gi, ""))) {
    cssContent = code;
  }

  if (!cssContent) {
    return {
      migratedCode: code,
      changes: ["No CSS blocks found to migrate."],
      unmapped: [],
    };
  }

  // Parse each rule
  const ruleRegex = /([^{}@]+)\{([^{}]*)\}/g;
  let ruleMatch;
  const selectorClassMap: { selector: string; classes: string[] }[] = [];

  while ((ruleMatch = ruleRegex.exec(cssContent)) !== null) {
    const selector = ruleMatch[1].trim();
    const body = ruleMatch[2].trim();
    const classes: string[] = [];

    const declarations = body.split(";").filter((s) => s.trim());
    for (const decl of declarations) {
      const colonIdx = decl.indexOf(":");
      if (colonIdx === -1) continue;
      const prop = decl.slice(0, colonIdx).trim();
      const value = decl.slice(colonIdx + 1).trim();

      const twClass = convertPropertyToTailwind(prop, value);
      if (twClass) {
        classes.push(twClass);
        mappingTable.push({ selector, property: prop, value, tailwind: twClass });
        changes.push(`\`${selector}\` { \`${prop}: ${value}\` } -> \`${twClass}\``);
      } else {
        unmapped.push(`${selector}: ${prop}: ${value}`);
      }
    }

    if (classes.length > 0) {
      selectorClassMap.push({ selector, classes });
    }
  }

  // Build mapping table as part of output
  let migratedCode = code;

  // Add a comment block with the mapping
  const mappingLines = [
    "/* Tailwind Migration Mapping:",
    " * ┌─────────────────────────┬────────────────────────┬───────────────────────┐",
    " * │ Selector                │ CSS Property           │ Tailwind Class        │",
    " * ├─────────────────────────┼────────────────────────┼───────────────────────┤",
  ];
  for (const entry of mappingTable) {
    const sel = entry.selector.padEnd(23).slice(0, 23);
    const prop = `${entry.property}: ${entry.value}`.padEnd(22).slice(0, 22);
    const tw = entry.tailwind.padEnd(21).slice(0, 21);
    mappingLines.push(` * │ ${sel} │ ${prop} │ ${tw} │`);
  }
  mappingLines.push(
    " * └─────────────────────────┴────────────────────────┴───────────────────────┘",
    " *",
    " * Suggested classes per selector:"
  );
  for (const entry of selectorClassMap) {
    mappingLines.push(` *   ${entry.selector} -> "${entry.classes.join(" ")}"`);
  }
  mappingLines.push(" */", "");

  migratedCode = mappingLines.join("\n") + "\n" + migratedCode;

  return { migratedCode, changes, unmapped };
}

// ---------------------------------------------------------------------------
// Bootstrap -> Tailwind migration
// ---------------------------------------------------------------------------

function migrateBootstrapToTailwind(code: string, fw: Framework): MigrationResult {
  const changes: string[] = [];
  const unmapped: string[] = [];
  let migratedCode = code;

  const classAttr = fw === "react" ? "className" : "class";
  const classRegex = new RegExp(
    `(${classAttr})\\s*=\\s*"([^"]*)"`,
    "gi"
  );

  migratedCode = migratedCode.replace(classRegex, (fullMatch, attrName: string, classValue: string) => {
    const classes = classValue.split(/\s+/).filter(Boolean);
    const newClasses: string[] = [];
    let anyConverted = false;

    for (const cls of classes) {
      const twEquivalent = BOOTSTRAP_TO_TAILWIND[cls];
      if (twEquivalent) {
        newClasses.push(twEquivalent);
        changes.push(`\`${cls}\` -> \`${twEquivalent}\``);
        anyConverted = true;
      } else {
        // Keep non-Bootstrap classes as-is
        newClasses.push(cls);
        // Only flag it as unmapped if it looks like a Bootstrap class
        if (/^(col-|btn-|alert-|badge-|card-|nav-|d-|flex-|justify-|align-|text-|font-|bg-|border-|rounded-|shadow-|m[tblrxy]?-|p[tblrxy]?-|w-|h-|position-)/.test(cls) && !BOOTSTRAP_TO_TAILWIND[cls]) {
          unmapped.push(cls);
        }
      }
    }

    if (anyConverted) {
      return `${attrName}="${newClasses.join(" ")}"`;
    }
    return fullMatch;
  });

  return { migratedCode, changes, unmapped };
}

// ---------------------------------------------------------------------------
// Inline -> CSS Modules migration
// ---------------------------------------------------------------------------

function migrateInlineToCSSModules(code: string, fw: Framework): MigrationResult {
  const changes: string[] = [];
  const unmapped: string[] = [];
  let migratedCode = code;
  const styleEntries: { name: string; declarations: string[] }[] = [];
  let styleIdx = 0;

  if (fw === "react") {
    // JSX style={{...}} -> className={styles.xxx}
    const jsxStyleRegex = /style\s*=\s*\{\{([\s\S]*?)\}\}/g;
    migratedCode = migratedCode.replace(jsxStyleRegex, (_match, styleContent: string) => {
      const declarations: string[] = [];
      const pairRegex = /(\w+)\s*:\s*(?:"([^"]*)"|'([^']*)'|`([^`]*)`|(\d+[\w%]*)|([\w.]+))/g;
      let pairMatch;

      while ((pairMatch = pairRegex.exec(styleContent)) !== null) {
        const camelProp = pairMatch[1];
        const value = pairMatch[2] ?? pairMatch[3] ?? pairMatch[4] ?? pairMatch[5] ?? pairMatch[6] ?? "";
        const kebabProp = camelProp.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
        let processedValue = value;
        if (/^\d+$/.test(processedValue) && !["opacity", "z-index", "flex-grow", "flex-shrink", "order", "font-weight", "line-height"].includes(kebabProp)) {
          processedValue = `${processedValue}px`;
        }
        declarations.push(`  ${kebabProp}: ${processedValue};`);
        changes.push(`Extracted \`${kebabProp}: ${processedValue}\` to CSS module class`);
      }

      const styleName = `style${styleIdx++}`;
      styleEntries.push({ name: styleName, declarations });
      return `className={styles.${styleName}}`;
    });
  } else {
    // HTML style="..." -> class="xxx" with extracted CSS
    const htmlStyleRegex = /style\s*=\s*"([^"]*)"/gi;
    migratedCode = migratedCode.replace(htmlStyleRegex, (_match, styleContent: string) => {
      const declarations: string[] = [];
      const parts = styleContent.split(";").filter((s: string) => s.trim());
      for (const part of parts) {
        const colonIdx = part.indexOf(":");
        if (colonIdx === -1) continue;
        const prop = part.slice(0, colonIdx).trim();
        const value = part.slice(colonIdx + 1).trim();
        declarations.push(`  ${prop}: ${value};`);
        changes.push(`Extracted \`${prop}: ${value}\` to CSS module class`);
      }

      const styleName = `style${styleIdx++}`;
      styleEntries.push({ name: styleName, declarations });
      return `class="${styleName}"`;
    });
  }

  // Generate the CSS module content
  if (styleEntries.length > 0) {
    const moduleLines = ["\n/* Generated CSS Module (save as component.module.css) */"];
    for (const entry of styleEntries) {
      moduleLines.push(`.${entry.name} {`);
      for (const decl of entry.declarations) {
        moduleLines.push(decl);
      }
      moduleLines.push("}");
      moduleLines.push("");
    }
    migratedCode += "\n" + moduleLines.join("\n");
  }

  return { migratedCode, changes, unmapped };
}

// ---------------------------------------------------------------------------
// Inline -> styled-components migration
// ---------------------------------------------------------------------------

function migrateInlineToStyledComponents(code: string, fw: Framework): MigrationResult {
  const changes: string[] = [];
  const unmapped: string[] = [];
  let migratedCode = code;
  const styledEntries: { componentName: string; tagName: string; declarations: string[] }[] = [];
  let styledIdx = 0;

  // Find all elements with inline styles
  const elementWithStyleRegex = /<(\w+)([^>]*?)style\s*=\s*(?:\{\{([\s\S]*?)\}\}|"([^"]*)")([^>]*?)\/?>/g;
  let match;
  const replacements: { start: number; end: number; replacement: string }[] = [];

  while ((match = elementWithStyleRegex.exec(code)) !== null) {
    const tagName = match[1];
    const beforeStyle = match[2];
    const jsxStyleContent = match[3];
    const htmlStyleContent = match[4];
    const afterStyle = match[5];
    const isSelfClosing = match[0].endsWith("/>");

    const componentName = `Styled${tagName.charAt(0).toUpperCase() + tagName.slice(1)}${styledIdx}`;
    const declarations: string[] = [];

    if (jsxStyleContent) {
      const pairRegex = /(\w+)\s*:\s*(?:"([^"]*)"|'([^']*)'|`([^`]*)`|(\d+[\w%]*)|([\w.]+))/g;
      let pairMatch;
      while ((pairMatch = pairRegex.exec(jsxStyleContent)) !== null) {
        const camelProp = pairMatch[1];
        const value = pairMatch[2] ?? pairMatch[3] ?? pairMatch[4] ?? pairMatch[5] ?? pairMatch[6] ?? "";
        const kebabProp = camelProp.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
        let processedValue = value;
        if (/^\d+$/.test(processedValue) && !["opacity", "z-index", "flex-grow", "flex-shrink", "order", "font-weight", "line-height"].includes(kebabProp)) {
          processedValue = `${processedValue}px`;
        }
        declarations.push(`  ${kebabProp}: ${processedValue};`);
        changes.push(`Extracted \`${kebabProp}: ${processedValue}\` into styled-component \`${componentName}\``);
      }
    } else if (htmlStyleContent) {
      const parts = htmlStyleContent.split(";").filter((s) => s.trim());
      for (const part of parts) {
        const colonIdx = part.indexOf(":");
        if (colonIdx === -1) continue;
        const prop = part.slice(0, colonIdx).trim();
        const value = part.slice(colonIdx + 1).trim();
        declarations.push(`  ${prop}: ${value};`);
        changes.push(`Extracted \`${prop}: ${value}\` into styled-component \`${componentName}\``);
      }
    }

    if (declarations.length > 0) {
      styledEntries.push({ componentName, tagName, declarations });
      const otherAttrs = (beforeStyle + afterStyle).trim();
      const replacement = `<${componentName}${otherAttrs ? " " + otherAttrs : ""}${isSelfClosing ? " />" : ">"}`;
      replacements.push({ start: match.index, end: match.index + match[0].length, replacement });
      styledIdx++;
    }
  }

  // Apply replacements in reverse order
  for (const rep of replacements.reverse()) {
    migratedCode = migratedCode.slice(0, rep.start) + rep.replacement + migratedCode.slice(rep.end);
  }

  // Also replace closing tags
  for (const entry of styledEntries) {
    // Simple replacement of closing tags (this is approximate)
    const closeTagRegex = new RegExp(`</${entry.tagName}>`, "i");
    migratedCode = migratedCode.replace(closeTagRegex, `</${entry.componentName}>`);
  }

  // Generate styled-components code
  if (styledEntries.length > 0) {
    const styledLines = [
      "",
      "/* Generated styled-components (add to your component file) */",
      `import styled from 'styled-components';`,
      "",
    ];
    for (const entry of styledEntries) {
      styledLines.push(`const ${entry.componentName} = styled.${entry.tagName}\``);
      for (const decl of entry.declarations) {
        styledLines.push(decl);
      }
      styledLines.push("`;");
      styledLines.push("");
    }
    migratedCode += "\n" + styledLines.join("\n");
  }

  return { migratedCode, changes, unmapped };
}

// ---------------------------------------------------------------------------
// CSS -> styled-components migration
// ---------------------------------------------------------------------------

function migrateCSSToStyledComponents(code: string, _fw: Framework): MigrationResult {
  const changes: string[] = [];
  const unmapped: string[] = [];

  const styleTagRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let cssContent = "";
  let match;
  while ((match = styleTagRegex.exec(code)) !== null) {
    cssContent += match[1] + "\n";
  }

  if (!cssContent && /\{[\s\S]*\}/.test(code) && !/<\w+/.test(code.replace(/<style[^>]*>/gi, ""))) {
    cssContent = code;
  }

  if (!cssContent) {
    return { migratedCode: code, changes: ["No CSS blocks found to migrate."], unmapped: [] };
  }

  const styledLines = [
    "/* Generated styled-components */",
    `import styled from 'styled-components';`,
    "",
  ];

  const ruleRegex = /([^{}@]+)\{([^{}]*)\}/g;
  let ruleMatch;

  while ((ruleMatch = ruleRegex.exec(cssContent)) !== null) {
    const selector = ruleMatch[1].trim();
    const body = ruleMatch[2].trim();

    // Convert selector to component name
    const componentName = selector
      .replace(/^[.#]/, "")
      .replace(/[^a-zA-Z0-9]/g, " ")
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join("");

    const tagGuess = /^h[1-6]$/i.test(selector) ? selector : /^(p|a|span|div|section|header|footer|nav|main|article|ul|ol|li|button|input)$/i.test(selector) ? selector : "div";

    styledLines.push(`const ${componentName || "StyledComponent"} = styled.${tagGuess}\``);
    styledLines.push(`  ${body}`);
    styledLines.push("`;");
    styledLines.push("");
    changes.push(`Converted \`${selector}\` to styled-component \`${componentName || "StyledComponent"}\``);
  }

  const migratedCode = code + "\n\n" + styledLines.join("\n");
  return { migratedCode, changes, unmapped };
}

// ---------------------------------------------------------------------------
// CSS -> CSS Modules migration
// ---------------------------------------------------------------------------

function migrateCSSToModules(code: string, _fw: Framework): MigrationResult {
  const changes: string[] = [];
  const unmapped: string[] = [];

  const styleTagRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let cssContent = "";
  let match;
  while ((match = styleTagRegex.exec(code)) !== null) {
    cssContent += match[1] + "\n";
  }

  if (!cssContent && /\{[\s\S]*\}/.test(code) && !/<\w+/.test(code.replace(/<style[^>]*>/gi, ""))) {
    cssContent = code;
  }

  if (!cssContent) {
    return { migratedCode: code, changes: ["No CSS blocks found to migrate."], unmapped: [] };
  }

  // CSS Modules: convert global selectors to local class selectors
  let moduleCSS = cssContent;
  const ruleRegex = /([^{}@]+)\{/g;
  let ruleMatch;

  while ((ruleMatch = ruleRegex.exec(cssContent)) !== null) {
    const selector = ruleMatch[1].trim();
    // Convert element selectors to class selectors for CSS modules
    if (/^[a-zA-Z]/.test(selector) && !/^@/.test(selector) && !/^:/.test(selector)) {
      const className = selector.replace(/[^a-zA-Z0-9]/g, "_");
      changes.push(`Converted selector \`${selector}\` to CSS module class \`.${className}\``);
    } else if (/^\./.test(selector)) {
      changes.push(`Kept class selector \`${selector}\` (already CSS module compatible)`);
    }
  }

  const migratedCode = code + "\n\n/* Save the following as component.module.css */\n" + moduleCSS;
  return { migratedCode, changes, unmapped };
}

// ---------------------------------------------------------------------------
// Bootstrap -> CSS Modules / styled-components
// ---------------------------------------------------------------------------

function migrateBootstrapToModulesOrStyled(code: string, fw: Framework, to: ToFormat): MigrationResult {
  // First convert to Tailwind, then note that further manual work is needed
  const twResult = migrateBootstrapToTailwind(code, fw);
  const changes = [...twResult.changes];

  if (to === "css_modules") {
    changes.push("Note: Bootstrap classes were mapped. Extract the resulting styles into CSS module classes for full migration.");
  } else {
    changes.push("Note: Bootstrap classes were mapped. Wrap elements in styled-components with the equivalent CSS for full migration.");
  }

  return { migratedCode: twResult.migratedCode, changes, unmapped: twResult.unmapped };
}

// ---------------------------------------------------------------------------
// Main migration router
// ---------------------------------------------------------------------------

function migrateStyles(
  code: string,
  from: FromFormat,
  to: ToFormat,
  framework: Framework
): MigrationResult {
  const actualFrom = from === "auto" ? detectFromFormat(code) : from;

  switch (actualFrom) {
    case "inline":
      switch (to) {
        case "tailwind":
          return migrateInlineToTailwind(code, framework);
        case "css_modules":
          return migrateInlineToCSSModules(code, framework);
        case "styled_components":
          return migrateInlineToStyledComponents(code, framework);
      }
      break;
    case "css":
      switch (to) {
        case "tailwind":
          return migrateCSSToTailwind(code, framework);
        case "css_modules":
          return migrateCSSToModules(code, framework);
        case "styled_components":
          return migrateCSSToStyledComponents(code, framework);
      }
      break;
    case "bootstrap":
      switch (to) {
        case "tailwind":
          return migrateBootstrapToTailwind(code, framework);
        case "css_modules":
        case "styled_components":
          return migrateBootstrapToModulesOrStyled(code, framework, to);
      }
      break;
  }

  return { migratedCode: code, changes: [], unmapped: [] };
}

// ---------------------------------------------------------------------------
// Tool registration
// ---------------------------------------------------------------------------

export function registerMigrateStyles(server: McpServer): void {
  server.tool(
    "migrate_styles",
    "Convert UI code from one styling approach to another (inline styles, CSS, or Bootstrap to Tailwind, CSS Modules, or styled-components). Handles property mapping, class conversion, and outputs migrated code with a change summary.",
    {
      code: z.string().describe("The UI code to migrate"),
      from: z
        .enum(["inline", "css", "bootstrap", "auto"])
        .default("auto")
        .describe("Source styling format (auto-detected if not specified)"),
      to: z
        .enum(["tailwind", "css_modules", "styled_components"])
        .default("tailwind")
        .describe("Target styling format"),
      framework: z
        .enum(["react", "vue", "svelte", "html", "auto"])
        .default("auto")
        .describe("Framework hint (auto-detected if not specified)"),
    },
    async ({ code, from, to, framework }) => {
      const fw: Framework =
        framework && framework !== "auto" ? (framework as Framework) : detectFramework(code);
      const fromFormat = (from || "auto") as FromFormat;
      const toFormat = (to || "tailwind") as ToFormat;

      const actualFrom = fromFormat === "auto" ? detectFromFormat(code) : fromFormat;
      const result = migrateStyles(code, fromFormat, toFormat, fw);

      const toLabels: Record<ToFormat, string> = {
        tailwind: "Tailwind CSS",
        css_modules: "CSS Modules",
        styled_components: "styled-components",
      };

      const fromLabels: Record<FromFormat, string> = {
        inline: "Inline Styles",
        css: "CSS",
        bootstrap: "Bootstrap",
        auto: "Auto-detected",
      };

      const lines = [
        `# Style Migration Report`,
        ``,
        `**Framework detected:** ${fw}`,
        `**Migration:** ${fromLabels[actualFrom]} -> ${toLabels[toFormat]}`,
        `**Changes made:** ${result.changes.length}`,
        `**Unmapped properties:** ${result.unmapped.length}`,
        ``,
      ];

      // Migrated code
      lines.push(`## Migrated Code`);
      lines.push("```");
      lines.push(result.migratedCode);
      lines.push("```");
      lines.push(``);

      // Changes summary
      if (result.changes.length > 0) {
        lines.push(`## Changes`);
        for (const change of result.changes) {
          lines.push(`- ${change}`);
        }
        lines.push(``);
      }

      // Unmapped
      if (result.unmapped.length > 0) {
        lines.push(`## Unmapped (manual conversion needed)`);
        for (const item of result.unmapped) {
          lines.push(`- ${item}`);
        }
        lines.push(``);
      }

      if (result.changes.length === 0 && result.unmapped.length === 0) {
        lines.push(`No style declarations found to migrate. Make sure the input contains ${fromLabels[actualFrom]} code.`);
      }

      return {
        content: [{ type: "text" as const, text: lines.join("\n") }],
      };
    }
  );
}
