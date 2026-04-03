export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

const NAMED_COLORS: Record<string, string> = {
  black: "#000000", white: "#ffffff", red: "#ff0000", green: "#008000",
  blue: "#0000ff", yellow: "#ffff00", cyan: "#00ffff", magenta: "#ff00ff",
  gray: "#808080", grey: "#808080", orange: "#ffa500", purple: "#800080",
  pink: "#ffc0cb", brown: "#a52a2a", navy: "#000080", teal: "#008080",
  maroon: "#800000", olive: "#808000", lime: "#00ff00", aqua: "#00ffff",
  silver: "#c0c0c0", fuchsia: "#ff00ff", transparent: "#00000000",
};

export function parseColor(color: string): RGB | null {
  const trimmed = color.trim().toLowerCase();

  if (NAMED_COLORS[trimmed]) {
    return hexToRgb(NAMED_COLORS[trimmed]);
  }

  if (trimmed.startsWith("#")) {
    return hexToRgb(trimmed);
  }

  const rgbMatch = trimmed.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgbMatch) {
    return { r: parseInt(rgbMatch[1]), g: parseInt(rgbMatch[2]), b: parseInt(rgbMatch[3]) };
  }

  const hslMatch = trimmed.match(/hsla?\(\s*(\d+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%/);
  if (hslMatch) {
    return hslToRgb({
      h: parseInt(hslMatch[1]),
      s: parseFloat(hslMatch[2]) / 100,
      l: parseFloat(hslMatch[3]) / 100,
    });
  }

  return null;
}

export function hexToRgb(hex: string): RGB | null {
  const cleaned = hex.replace("#", "");
  let fullHex = cleaned;

  if (cleaned.length === 3) {
    fullHex = cleaned[0] + cleaned[0] + cleaned[1] + cleaned[1] + cleaned[2] + cleaned[2];
  } else if (cleaned.length === 8) {
    fullHex = cleaned.slice(0, 6);
  } else if (cleaned.length !== 6) {
    return null;
  }

  const num = parseInt(fullHex, 16);
  if (isNaN(num)) return null;

  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

export function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l };
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h: number;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;

  return { h: Math.round(h * 360), s, l };
}

export function hslToRgb(hsl: HSL): RGB {
  const { h, s, l } = hsl;

  if (s === 0) {
    const val = Math.round(l * 255);
    return { r: val, g: val, b: val };
  }

  const hue2rgb = (p: number, q: number, t: number): number => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hNorm = h / 360;

  return {
    r: Math.round(hue2rgb(p, q, hNorm + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, hNorm) * 255),
    b: Math.round(hue2rgb(p, q, hNorm - 1 / 3) * 255),
  };
}

export function relativeLuminance(rgb: RGB): number {
  const [rs, gs, bs] = [rgb.r, rgb.g, rgb.b].map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function contrastRatio(color1: RGB, color2: RGB): number {
  const l1 = relativeLuminance(color1);
  const l2 = relativeLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function generateShadeScale(baseHsl: HSL): Record<string, string> {
  const shades: Record<string, string> = {};
  const steps = [
    { name: "50", l: 0.97 },
    { name: "100", l: 0.94 },
    { name: "200", l: 0.86 },
    { name: "300", l: 0.76 },
    { name: "400", l: 0.64 },
    { name: "500", l: 0.50 },
    { name: "600", l: 0.40 },
    { name: "700", l: 0.32 },
    { name: "800", l: 0.24 },
    { name: "900", l: 0.17 },
    { name: "950", l: 0.10 },
  ];

  for (const step of steps) {
    const rgb = hslToRgb({ h: baseHsl.h, s: baseHsl.s, l: step.l });
    shades[step.name] = rgbToHex(rgb);
  }

  return shades;
}
