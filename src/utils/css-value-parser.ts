export interface CSSValue {
  value: number;
  unit: string;
}

export function parseCSSValue(raw: string): CSSValue | null {
  const trimmed = raw.trim();
  if (trimmed === "0") return { value: 0, unit: "px" };

  const match = trimmed.match(/^(-?[\d.]+)(px|rem|em|%|vh|vw|vmin|vmax|ch|ex|pt)?$/);
  if (!match) return null;

  return {
    value: parseFloat(match[1]),
    unit: match[2] || "px",
  };
}

export function toPx(cssValue: CSSValue, baseFontSize = 16): number | null {
  switch (cssValue.unit) {
    case "px":
      return cssValue.value;
    case "rem":
      return cssValue.value * baseFontSize;
    case "em":
      return cssValue.value * baseFontSize;
    case "pt":
      return cssValue.value * (4 / 3);
    default:
      return null;
  }
}

export function expandShorthand(property: string, value: string): Record<string, string> {
  const parts = value.trim().split(/\s+/);

  if (property === "padding" || property === "margin") {
    if (parts.length === 1) {
      return {
        [`${property}-top`]: parts[0],
        [`${property}-right`]: parts[0],
        [`${property}-bottom`]: parts[0],
        [`${property}-left`]: parts[0],
      };
    }
    if (parts.length === 2) {
      return {
        [`${property}-top`]: parts[0],
        [`${property}-right`]: parts[1],
        [`${property}-bottom`]: parts[0],
        [`${property}-left`]: parts[1],
      };
    }
    if (parts.length === 3) {
      return {
        [`${property}-top`]: parts[0],
        [`${property}-right`]: parts[1],
        [`${property}-bottom`]: parts[2],
        [`${property}-left`]: parts[1],
      };
    }
    if (parts.length === 4) {
      return {
        [`${property}-top`]: parts[0],
        [`${property}-right`]: parts[1],
        [`${property}-bottom`]: parts[2],
        [`${property}-left`]: parts[3],
      };
    }
  }

  return { [property]: value };
}
