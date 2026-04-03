import type { Palette } from "./generator.js";

export function formatCSSVariables(palette: Palette, darkMode: boolean): string {
  const lines = [":root {"];

  // Primary shades
  for (const [shade, hex] of Object.entries(palette.primary)) {
    lines.push(`  --color-primary-${shade}: ${hex};`);
  }

  // Secondary shades
  for (const [shade, hex] of Object.entries(palette.secondary)) {
    lines.push(`  --color-secondary-${shade}: ${hex};`);
  }

  // Accent shades
  for (const [shade, hex] of Object.entries(palette.accent)) {
    lines.push(`  --color-accent-${shade}: ${hex};`);
  }

  // Semantic colors
  lines.push(`  --color-background: ${palette.background.light};`);
  lines.push(`  --color-foreground: ${palette.foreground.light};`);
  lines.push(`  --color-muted: ${palette.muted.light};`);
  lines.push(`  --color-border: ${palette.border.light};`);
  lines.push(`  --color-success: ${palette.success};`);
  lines.push(`  --color-warning: ${palette.warning};`);
  lines.push(`  --color-error: ${palette.error};`);
  lines.push(`  --color-info: ${palette.info};`);
  lines.push("}");

  if (darkMode) {
    lines.push("");
    lines.push("@media (prefers-color-scheme: dark) {");
    lines.push("  :root {");
    lines.push(`    --color-background: ${palette.background.dark};`);
    lines.push(`    --color-foreground: ${palette.foreground.dark};`);
    lines.push(`    --color-muted: ${palette.muted.dark};`);
    lines.push(`    --color-border: ${palette.border.dark};`);
    lines.push("  }");
    lines.push("}");
  }

  return lines.join("\n");
}

export function formatTailwindConfig(palette: Palette): string {
  const toObj = (shades: Record<string, string>) => {
    const entries = Object.entries(shades)
      .map(([k, v]) => `        ${k}: '${v}'`)
      .join(",\n");
    return `{\n${entries}\n      }`;
  };

  return `// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: ${toObj(palette.primary)},
        secondary: ${toObj(palette.secondary)},
        accent: ${toObj(palette.accent)},
        background: '${palette.background.light}',
        foreground: '${palette.foreground.light}',
        muted: '${palette.muted.light}',
        border: '${palette.border.light}',
        success: '${palette.success}',
        warning: '${palette.warning}',
        error: '${palette.error}',
        info: '${palette.info}',
      },
    },
  },
};`;
}

export function formatDesignTokens(palette: Palette): object {
  return {
    color: {
      primary: Object.fromEntries(
        Object.entries(palette.primary).map(([k, v]) => [k, { value: v, type: "color" }])
      ),
      secondary: Object.fromEntries(
        Object.entries(palette.secondary).map(([k, v]) => [k, { value: v, type: "color" }])
      ),
      accent: Object.fromEntries(
        Object.entries(palette.accent).map(([k, v]) => [k, { value: v, type: "color" }])
      ),
      background: {
        light: { value: palette.background.light, type: "color" },
        dark: { value: palette.background.dark, type: "color" },
      },
      foreground: {
        light: { value: palette.foreground.light, type: "color" },
        dark: { value: palette.foreground.dark, type: "color" },
      },
      success: { value: palette.success, type: "color" },
      warning: { value: palette.warning, type: "color" },
      error: { value: palette.error, type: "color" },
      info: { value: palette.info, type: "color" },
    },
  };
}
