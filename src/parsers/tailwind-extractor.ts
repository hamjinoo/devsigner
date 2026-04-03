import type { StyleDeclaration, StyleBlock } from "./css-extractor.js";

const TAILWIND_MAP: Record<string, StyleDeclaration> = {};

// Spacing: p-*, m-*, gap-*
const spacingScale: Record<string, string> = {
  "0": "0px", "0.5": "2px", "1": "4px", "1.5": "6px", "2": "8px", "2.5": "10px",
  "3": "12px", "3.5": "14px", "4": "16px", "5": "20px", "6": "24px", "7": "28px",
  "8": "32px", "9": "36px", "10": "40px", "11": "44px", "12": "48px", "14": "56px",
  "16": "64px", "20": "80px", "24": "96px", "28": "112px", "32": "128px",
  "px": "1px",
};

const spacingPrefixes: Record<string, string[]> = {
  "p": ["padding"],
  "px": ["padding-left", "padding-right"],
  "py": ["padding-top", "padding-bottom"],
  "pt": ["padding-top"],
  "pr": ["padding-right"],
  "pb": ["padding-bottom"],
  "pl": ["padding-left"],
  "m": ["margin"],
  "mx": ["margin-left", "margin-right"],
  "my": ["margin-top", "margin-bottom"],
  "mt": ["margin-top"],
  "mr": ["margin-right"],
  "mb": ["margin-bottom"],
  "ml": ["margin-left"],
  "gap": ["gap"],
};

for (const [prefix, properties] of Object.entries(spacingPrefixes)) {
  for (const [scale, value] of Object.entries(spacingScale)) {
    for (const prop of properties) {
      TAILWIND_MAP[`${prefix}-${scale}`] = { property: prop, value };
    }
  }
}

// Font sizes
const fontSizes: Record<string, { size: string; lineHeight: string }> = {
  "text-xs": { size: "12px", lineHeight: "16px" },
  "text-sm": { size: "14px", lineHeight: "20px" },
  "text-base": { size: "16px", lineHeight: "24px" },
  "text-lg": { size: "18px", lineHeight: "28px" },
  "text-xl": { size: "20px", lineHeight: "28px" },
  "text-2xl": { size: "24px", lineHeight: "32px" },
  "text-3xl": { size: "30px", lineHeight: "36px" },
  "text-4xl": { size: "36px", lineHeight: "40px" },
  "text-5xl": { size: "48px", lineHeight: "1" },
  "text-6xl": { size: "60px", lineHeight: "1" },
};

for (const [cls, { size }] of Object.entries(fontSizes)) {
  TAILWIND_MAP[cls] = { property: "font-size", value: size };
}

// Font weights
const fontWeights: Record<string, string> = {
  "font-thin": "100", "font-extralight": "200", "font-light": "300",
  "font-normal": "400", "font-medium": "500", "font-semibold": "600",
  "font-bold": "700", "font-extrabold": "800", "font-black": "900",
};

for (const [cls, weight] of Object.entries(fontWeights)) {
  TAILWIND_MAP[cls] = { property: "font-weight", value: weight };
}

// Border radius
const borderRadius: Record<string, string> = {
  "rounded-none": "0px", "rounded-sm": "2px", "rounded": "4px",
  "rounded-md": "6px", "rounded-lg": "8px", "rounded-xl": "12px",
  "rounded-2xl": "16px", "rounded-3xl": "24px", "rounded-full": "9999px",
};

for (const [cls, value] of Object.entries(borderRadius)) {
  TAILWIND_MAP[cls] = { property: "border-radius", value };
}

// Width constraints
const maxWidths: Record<string, string> = {
  "max-w-xs": "320px", "max-w-sm": "384px", "max-w-md": "448px",
  "max-w-lg": "512px", "max-w-xl": "576px", "max-w-2xl": "672px",
  "max-w-3xl": "768px", "max-w-4xl": "896px", "max-w-5xl": "1024px",
  "max-w-6xl": "1152px", "max-w-7xl": "1280px", "max-w-prose": "65ch",
};

for (const [cls, value] of Object.entries(maxWidths)) {
  TAILWIND_MAP[cls] = { property: "max-width", value };
}

export function extractTailwindStyles(code: string): StyleDeclaration[] {
  return extractTailwindStyleBlocks(code).flatMap((b) => b.declarations);
}

export function extractTailwindStyleBlocks(code: string): StyleBlock[] {
  const blocks: StyleBlock[] = [];
  const classRegex = /(?:className|class)\s*=\s*(?:"([^"]*)"|'([^']*)'|\{`([^`]*)`\})/g;
  let match;
  let elementIdx = 0;

  while ((match = classRegex.exec(code)) !== null) {
    const classString = match[1] || match[2] || match[3] || "";
    const classes = classString.split(/\s+/).filter(Boolean);
    const declarations: StyleDeclaration[] = [];

    for (const cls of classes) {
      // Strip responsive/state prefixes (e.g., md:p-4 -> p-4, hover:bg-blue-500 -> bg-blue-500)
      const baseClass = cls.replace(/^(?:sm|md|lg|xl|2xl|hover|focus|active|disabled|dark):/, "");

      if (TAILWIND_MAP[baseClass]) {
        declarations.push({ ...TAILWIND_MAP[baseClass] });
      }

      // Handle Tailwind color classes (bg-*, text-*, border-*)
      const colorMatch = baseClass.match(/^(bg|text|border)-([\w]+-\d+)$/);
      if (colorMatch) {
        const propMap: Record<string, string> = {
          bg: "background-color",
          text: "color",
          border: "border-color",
        };
        declarations.push({
          property: propMap[colorMatch[1]],
          value: `tailwind:${colorMatch[2]}`,
        });
      }
    }

    if (declarations.length > 0) {
      blocks.push({ selector: `[tailwind-${elementIdx++}]`, declarations });
    }
  }

  return blocks;
}
