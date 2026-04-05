/**
 * Tailwind Transform — improve design through Tailwind class upgrades
 *
 * Detects Tailwind classes in code and replaces/adds them for better design.
 * Works with JSX (className) and HTML (class).
 */

// ---------------------------------------------------------------------------
// Color upgrades — replace generic colors with better palette
// ---------------------------------------------------------------------------

const COLOR_UPGRADES: Record<string, Record<string, string>> = {
  neutral: {
    "bg-white": "bg-white",
    "bg-gray-100": "bg-slate-50",
    "bg-gray-200": "bg-slate-100",
    "bg-gray-50": "bg-slate-50",
    "text-black": "text-slate-900",
    "text-gray-500": "text-slate-500",
    "text-gray-600": "text-slate-600",
    "text-gray-700": "text-slate-700",
    "text-gray-400": "text-slate-400",
    "border-gray-200": "border-slate-200",
    "border-gray-300": "border-slate-200",
  },
  warm: {
    "bg-white": "bg-white",
    "bg-gray-100": "bg-orange-50",
    "bg-gray-50": "bg-amber-50",
    "text-black": "text-stone-900",
    "text-gray-500": "text-stone-500",
    "text-gray-600": "text-stone-600",
    "border-gray-200": "border-stone-200",
  },
  cool: {
    "bg-white": "bg-white",
    "bg-gray-100": "bg-sky-50",
    "bg-gray-50": "bg-slate-50",
    "text-black": "text-slate-900",
    "text-gray-500": "text-slate-500",
    "text-gray-600": "text-slate-600",
    "border-gray-200": "border-slate-200",
  },
  bold: {
    "bg-white": "bg-slate-950",
    "bg-gray-100": "bg-slate-900",
    "bg-gray-50": "bg-slate-900",
    "text-black": "text-white",
    "text-white": "text-white",
    "text-gray-500": "text-slate-400",
    "text-gray-600": "text-slate-300",
    "border-gray-200": "border-slate-800",
  },
};

// ---------------------------------------------------------------------------
// Typography upgrades
// ---------------------------------------------------------------------------

const TYPO_UPGRADES: Record<string, string> = {
  // Improve heading sizes
  "text-xl": "text-xl font-semibold tracking-tight",
  "text-2xl": "text-2xl font-bold tracking-tight",
  "text-3xl": "text-3xl font-bold tracking-tight",
  "text-4xl": "text-4xl font-extrabold tracking-tight",
  "text-5xl": "text-5xl font-extrabold tracking-tight",
};

// ---------------------------------------------------------------------------
// Component pattern upgrades
// ---------------------------------------------------------------------------

interface ClassUpgrade {
  match: RegExp;
  replace: string;
}

function getButtonUpgrades(mood: string): ClassUpgrade[] {
  const primary = mood === "bold" ? "bg-white text-slate-900 hover:bg-slate-100" : "bg-indigo-600 text-white hover:bg-indigo-700";
  const secondary = mood === "bold" ? "bg-slate-800 text-white border border-slate-700 hover:bg-slate-700" : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50";

  return [
    // Primary buttons - add missing styles
    {
      match: /(?:className|class)="([^"]*\bbg-blue-500\b[^"]*)"/g,
      replace: `$0`.replace("bg-blue-500", `${primary} shadow-sm transition-all duration-150`),
    },
  ];
}

// ---------------------------------------------------------------------------
// Main transform
// ---------------------------------------------------------------------------

export function transformTailwind(code: string, mood: string = "neutral"): string {
  let result = code;
  const isTailwind = /(?:className|class)="[^"]*\b(?:flex|grid|p-|m-|bg-|text-|rounded|shadow)\b/.test(code);

  if (!isTailwind) return code;

  // 1. Apply color upgrades
  const colorMap = COLOR_UPGRADES[mood] ?? COLOR_UPGRADES.neutral;
  for (const [from, to] of Object.entries(colorMap)) {
    if (from !== to) {
      result = result.replace(new RegExp(`\\b${from}\\b`, "g"), to);
    }
  }

  // 2. Add missing essentials to common patterns

  // Buttons without proper styling
  result = result.replace(
    /(<button[^>]*(?:className|class)=")([^"]*?)(")/g,
    (match, pre, classes, post) => {
      let upgraded = classes;

      // If button has no padding, add it
      if (!/(^|\s)p[xy]?-/.test(classes)) {
        upgraded += " px-4 py-2";
      }

      // If button has no border-radius, add it
      if (!/(^|\s)rounded/.test(classes)) {
        upgraded += " rounded-lg";
      }

      // If button has no font-weight, add it
      if (!/(^|\s)font-/.test(classes)) {
        upgraded += " font-medium";
      }

      // If button has no transition, add it
      if (!/(^|\s)transition/.test(classes)) {
        upgraded += " transition-colors";
      }

      // If it's a primary-looking button (no variant class), ensure good defaults
      if (!/(^|\s)(bg-|border|outline|ghost|secondary)/.test(classes)) {
        upgraded += " bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm";
      }

      return `${pre}${upgraded.trim()}${post}`;
    },
  );

  // Cards: add shadow, rounded, padding if missing
  result = result.replace(
    /(<(?:div|article)[^>]*(?:className|class)="[^"]*\bcard\b[^"]*")([^>]*>)/g,
    (match) => {
      let upgraded = match;
      if (!/rounded/.test(match)) {
        upgraded = upgraded.replace(/(card)/, "$1 rounded-xl");
      }
      if (!/shadow/.test(match)) {
        upgraded = upgraded.replace(/(card)/, "$1 shadow-sm hover:shadow-md transition-shadow");
      }
      if (!/\bp-/.test(match)) {
        upgraded = upgraded.replace(/(card)/, "$1 p-6");
      }
      if (!/border/.test(match)) {
        upgraded = upgraded.replace(/(card)/, "$1 border border-slate-200");
      }
      return upgraded;
    },
  );

  // Hero sections: ensure proper padding and centering
  result = result.replace(
    /(<(?:div|section)[^>]*(?:className|class)="[^"]*\bhero\b[^"]*")([^>]*>)/g,
    (match) => {
      let upgraded = match;
      if (!/py-/.test(match) && !/p-/.test(match)) {
        upgraded = upgraded.replace(/(hero)/, "$1 py-24 px-6");
      }
      if (!/text-center/.test(match)) {
        upgraded = upgraded.replace(/(hero)/, "$1 text-center");
      }
      if (!/max-w-/.test(match)) {
        upgraded = upgraded.replace(/(hero)/, "$1 max-w-4xl mx-auto");
      }
      return upgraded;
    },
  );

  // Grid containers: ensure proper grid setup
  result = result.replace(
    /(<(?:div|section)[^>]*(?:className|class)="[^"]*\bgrid\b[^"]*")([^>]*>)/g,
    (match) => {
      let upgraded = match;
      if (!/grid-cols/.test(match)) {
        upgraded = upgraded.replace(/(grid\b)/, "$1 grid-cols-1 md:grid-cols-3");
      }
      if (!/gap-/.test(match)) {
        upgraded = upgraded.replace(/(grid\b)/, "$1 gap-6");
      }
      return upgraded;
    },
  );

  // Nav: ensure flex layout
  result = result.replace(
    /(<nav[^>]*(?:className|class)="[^"]*")([^>]*>)/g,
    (match) => {
      let upgraded = match;
      if (!/flex/.test(match)) {
        upgraded = upgraded.replace(/(className|class)="/, `$1="flex items-center justify-between px-6 py-4 `);
      }
      return upgraded;
    },
  );

  // Sections: add vertical padding
  result = result.replace(
    /(<section[^>]*(?:className|class)=")([^"]*?)(")/g,
    (match, pre, classes, post) => {
      if (!/py-/.test(classes) && !/p-/.test(classes)) {
        return `${pre}${classes} py-20 px-6${post}`;
      }
      return match;
    },
  );

  // 3. Clean up double spaces
  result = result.replace(/  +/g, " ");
  result = result.replace(/" /g, '"');
  result = result.replace(/ "/g, '"');

  return result;
}
