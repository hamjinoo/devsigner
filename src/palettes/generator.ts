import { hslToRgb, rgbToHex, rgbToHsl, parseColor, contrastRatio, generateShadeScale, type HSL } from "../utils/color-utils.js";
import { findPreset } from "./presets.js";
import { WCAG_AA_NORMAL } from "../constants.js";

export interface Palette {
  primary: Record<string, string>;
  secondary: Record<string, string>;
  accent: Record<string, string>;
  background: { light: string; dark: string };
  foreground: { light: string; dark: string };
  muted: { light: string; dark: string };
  border: { light: string; dark: string };
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface ContrastReport {
  pair: [string, string];
  ratio: number;
  wcagAA: boolean;
  wcagAAA: boolean;
}

export interface GeneratedPalette {
  palette: Palette;
  contrastReport: ContrastReport[];
  presetUsed: string;
}

export function generatePalette(description: string, baseColorHex?: string): GeneratedPalette {
  const preset = findPreset(description);

  let baseHsl: HSL;

  if (baseColorHex) {
    const rgb = parseColor(baseColorHex);
    if (rgb) {
      baseHsl = rgbToHsl(rgb);
    } else {
      baseHsl = { h: preset.baseHue, s: preset.saturation, l: 0.5 };
    }
  } else {
    baseHsl = { h: preset.baseHue, s: preset.saturation, l: 0.5 };
  }

  // Generate harmonious secondary (analogous: +30 degrees)
  const secondaryHsl: HSL = {
    h: (baseHsl.h + 30) % 360,
    s: baseHsl.s * 0.85,
    l: 0.5,
  };

  // Accent (complementary: +180 degrees, adjusted)
  const accentHsl: HSL = {
    h: (baseHsl.h + 180) % 360,
    s: Math.min(baseHsl.s * 1.2, 0.9),
    l: 0.5,
  };

  const primary = generateShadeScale(baseHsl);
  const secondary = generateShadeScale(secondaryHsl);
  const accent = generateShadeScale(accentHsl);

  const palette: Palette = {
    primary,
    secondary,
    accent,
    background: {
      light: "#fafafa",
      dark: "#0a0a0a",
    },
    foreground: {
      light: "#171717",
      dark: "#ededed",
    },
    muted: {
      light: "#f5f5f5",
      dark: "#262626",
    },
    border: {
      light: "#e5e5e5",
      dark: "#404040",
    },
    success: rgbToHex(hslToRgb({ h: 142, s: 0.7, l: 0.45 })),
    warning: rgbToHex(hslToRgb({ h: 38, s: 0.92, l: 0.50 })),
    error: rgbToHex(hslToRgb({ h: 0, s: 0.84, l: 0.60 })),
    info: rgbToHex(hslToRgb({ h: 210, s: 0.8, l: 0.56 })),
  };

  // Contrast report
  const contrastReport: ContrastReport[] = [];
  const pairs: [string, string, string, string][] = [
    ["Primary 500 on light bg", primary["500"], palette.background.light, ""],
    ["Primary 500 on dark bg", primary["500"], palette.background.dark, ""],
    ["Foreground on light bg", palette.foreground.light, palette.background.light, ""],
    ["Foreground on dark bg", palette.foreground.dark, palette.background.dark, ""],
  ];

  for (const [, color1, color2] of pairs) {
    const rgb1 = parseColor(color1);
    const rgb2 = parseColor(color2);
    if (rgb1 && rgb2) {
      const ratio = contrastRatio(rgb1, rgb2);
      contrastReport.push({
        pair: [color1, color2],
        ratio: Math.round(ratio * 100) / 100,
        wcagAA: ratio >= WCAG_AA_NORMAL,
        wcagAAA: ratio >= 7,
      });
    }
  }

  return { palette, contrastReport, presetUsed: preset.name };
}
