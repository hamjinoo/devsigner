import type { StyleDeclaration, StyleBlock } from "../parsers/css-extractor.js";
import type { IndustryRanges } from "../data/reference-ranges.js";
import type { DimensionScore, DesignScorecard } from "./dimensions.js";
import { scoreLabel } from "./dimensions.js";
import { parseColor, contrastRatio, rgbToHex, rgbToHsl } from "../utils/color-utils.js";
import { parseCSSValue, toPx } from "../utils/css-value-parser.js";
import { WCAG_AA_NORMAL, GRID_BASE } from "../constants.js";

// ---------------------------------------------------------------------------
// 1. Consistency — Are patterns repeated?
// ---------------------------------------------------------------------------

export function scoreConsistency(
  declarations: StyleDeclaration[],
  ranges?: IndustryRanges,
): DimensionScore {
  const findings: string[] = [];
  let penalties = 0;

  // Color consistency
  const colors = new Set<string>();
  for (const d of declarations) {
    if (["color", "background-color", "background", "border-color"].includes(d.property)) {
      const rgb = parseColor(d.value);
      if (rgb) colors.add(rgbToHex(rgb));
    }
  }
  const colorMax = ranges?.colorCount.p75 ?? 15;
  if (colors.size > colorMax) {
    penalties += Math.min(30, (colors.size - colorMax) * 3);
    findings.push(`${colors.size} distinct colors (typical: ${ranges?.colorCount.p25 ?? 8}-${colorMax})`);
  }

  // Spacing consistency
  const spacingValues = new Set<number>();
  const spacingProps = ["padding", "padding-top", "padding-right", "padding-bottom", "padding-left",
    "margin", "margin-top", "margin-right", "margin-bottom", "margin-left", "gap"];
  for (const d of declarations) {
    if (spacingProps.includes(d.property)) {
      const parsed = parseCSSValue(d.value);
      if (parsed) {
        const px = toPx(parsed);
        if (px !== null && px > 0) spacingValues.add(px);
      }
    }
  }
  const spacingMax = ranges?.spacingUniqueCount.p75 ?? 30;
  if (spacingValues.size > spacingMax) {
    penalties += Math.min(20, (spacingValues.size - spacingMax) * 2);
    findings.push(`${spacingValues.size} spacing values (typical: ${ranges?.spacingUniqueCount.p25 ?? 10}-${spacingMax})`);
  }

  // Font family consistency
  const fontFamilies = new Set<string>();
  for (const d of declarations) {
    if (d.property === "font-family") fontFamilies.add(d.value.split(",")[0].trim());
  }
  if (fontFamilies.size > 3) {
    penalties += (fontFamilies.size - 3) * 5;
    findings.push(`${fontFamilies.size} different font families`);
  }

  const score = Math.max(0, 100 - penalties);
  return { name: "Consistency", score, label: scoreLabel(score), icon: "🔄", findings };
}

// ---------------------------------------------------------------------------
// 2. Hierarchy — Is there clear visual ordering?
// ---------------------------------------------------------------------------

export function scoreHierarchy(declarations: StyleDeclaration[], blocks: StyleBlock[] = []): DimensionScore {
  const findings: string[] = [];
  let penalties = 0;

  // Font size scale analysis
  const fontSizes: number[] = [];
  for (const d of declarations) {
    if (d.property === "font-size") {
      const parsed = parseCSSValue(d.value);
      if (parsed) {
        const px = toPx(parsed);
        if (px !== null && px > 0) fontSizes.push(px);
      }
    }
  }

  const uniqueSizes = [...new Set(fontSizes)].sort((a, b) => a - b);

  if (uniqueSizes.length >= 2) {
    // Check if sizes form a reasonable scale (ratio between 1.1 and 1.5)
    let tooCloseCount = 0;
    for (let i = 1; i < uniqueSizes.length; i++) {
      const ratio = uniqueSizes[i] / uniqueSizes[i - 1];
      if (ratio < 1.1 && uniqueSizes[i] > 12) {
        tooCloseCount++;
      }
    }
    if (tooCloseCount > 0) {
      penalties += tooCloseCount * 8;
      findings.push(`${tooCloseCount} font size steps are too close (< 1.1x ratio) — weak hierarchy`);
    }

    // Check max/min ratio (should be at least 2x for clear hierarchy)
    const range = uniqueSizes[uniqueSizes.length - 1] / uniqueSizes[0];
    if (range < 1.5 && uniqueSizes.length > 2) {
      penalties += 15;
      findings.push(`Font size range is too narrow (${uniqueSizes[0]}px-${uniqueSizes[uniqueSizes.length - 1]}px, ${range.toFixed(1)}x)`);
    }
  } else if (uniqueSizes.length <= 1 && fontSizes.length > 3) {
    penalties += 20;
    findings.push("Only 1 font size used — no visual hierarchy");
  }

  // Font weight differentiation
  const weights = new Set<string>();
  for (const d of declarations) {
    if (d.property === "font-weight") weights.add(d.value);
  }
  if (weights.size <= 1 && fontSizes.length > 5) {
    penalties += 10;
    findings.push("Only 1 font weight — headings and body text look the same");
  }

  // Button hierarchy check (research: primary/secondary/tertiary distinction is critical)
  // Detect if there are multiple button-like styles with different visual weights
  const bgColors = new Set<string>();
  const borderStyles = new Set<string>();
  for (const block of blocks) {
    const hasBg = block.declarations.some((d) => d.property === "background-color" || d.property === "background");
    const hasBorder = block.declarations.some((d) => d.property === "border" || d.property === "border-color");
    if (hasBg) {
      for (const d of block.declarations) {
        if (d.property === "background-color" || d.property === "background") bgColors.add(d.value);
      }
    }
    if (hasBorder) borderStyles.add("border");
  }
  // If there are buttons but all have same styling, flag it
  if (bgColors.size === 1 && blocks.length > 3) {
    penalties += 8;
    findings.push("All elements share the same background — no visual hierarchy between primary and secondary actions");
  }

  const score = Math.max(0, 100 - penalties);
  return { name: "Hierarchy", score, label: scoreLabel(score), icon: "📐", findings };
}

// ---------------------------------------------------------------------------
// 3. Accessibility — WCAG compliance
// ---------------------------------------------------------------------------

export function scoreAccessibility(
  declarations: StyleDeclaration[],
  blocks: StyleBlock[],
): DimensionScore {
  const findings: string[] = [];
  let totalPairs = 0;
  let passingPairs = 0;

  // Check contrast across blocks
  for (const block of blocks) {
    let textColor: string | null = null;
    let bgColor: string | null = null;

    for (const decl of block.declarations) {
      const rgb = parseColor(decl.value);
      if (!rgb) continue;
      if (decl.property === "color") textColor = rgbToHex(rgb);
      else if (decl.property === "background-color" || decl.property === "background") bgColor = rgbToHex(rgb);
    }

    if (textColor && bgColor) {
      totalPairs++;
      const textRgb = parseColor(textColor);
      const bgRgb = parseColor(bgColor);
      if (textRgb && bgRgb) {
        const ratio = contrastRatio(textRgb, bgRgb);
        if (ratio >= WCAG_AA_NORMAL) {
          passingPairs++;
        } else {
          findings.push(`Low contrast: ${textColor} on ${bgColor} (${ratio.toFixed(1)}:1, need ${WCAG_AA_NORMAL}:1)`);
        }
      }
    }
  }

  // Check for text on assumed white background
  for (const decl of declarations) {
    if (decl.property === "color") {
      const rgb = parseColor(decl.value);
      if (rgb) {
        const bgRgb = parseColor("#ffffff");
        if (bgRgb) {
          const ratio = contrastRatio(rgb, bgRgb);
          if (ratio < 3) {
            totalPairs++;
            findings.push(`Very low contrast: ${decl.value} on white (${ratio.toFixed(1)}:1)`);
          }
        }
      }
    }
  }

  let score: number;
  if (totalPairs === 0) {
    score = 100; // No pairs to check
  } else {
    score = Math.round((passingPairs / totalPairs) * 100);
  }

  if (findings.length === 0 && totalPairs > 0) {
    findings.push(`All ${totalPairs} color pair(s) pass WCAG AA`);
  }

  return { name: "Accessibility", score, label: scoreLabel(score), icon: "♿", findings };
}

// ---------------------------------------------------------------------------
// 4. Harmony — Color harmony and visual coherence
// ---------------------------------------------------------------------------

export function scoreHarmony(declarations: StyleDeclaration[], blocks: StyleBlock[] = []): DimensionScore {
  const findings: string[] = [];
  let penalties = 0;

  // Collect all colors as HSL
  const hslColors: Array<{ h: number; s: number; l: number; hex: string }> = [];
  for (const d of declarations) {
    if (["color", "background-color", "background", "border-color"].includes(d.property)) {
      const rgb = parseColor(d.value);
      if (rgb) {
        const hex = rgbToHex(rgb);
        const hsl = rgbToHsl(rgb);
        hslColors.push({ ...hsl, hex });
      }
    }
  }

  if (hslColors.length < 2) {
    return { name: "Harmony", score: 100, label: "Excellent", icon: "🎨", findings: ["Too few colors to assess harmony"] };
  }

  // Saturation spread — too wide means jarring
  const saturations = hslColors.filter((c) => c.s > 0.05).map((c) => c.s);
  if (saturations.length >= 2) {
    const satRange = Math.max(...saturations) - Math.min(...saturations);
    if (satRange > 0.5) {
      penalties += 15;
      findings.push(`Wide saturation range (${(Math.min(...saturations) * 100).toFixed(0)}%-${(Math.max(...saturations) * 100).toFixed(0)}%) — colors may clash`);
    }
  }

  // Check for near-duplicate colors (visually similar but different hex)
  const uniqueHexes = [...new Set(hslColors.map((c) => c.hex))];
  let nearDupes = 0;
  for (let i = 0; i < uniqueHexes.length; i++) {
    for (let j = i + 1; j < uniqueHexes.length; j++) {
      const c1 = hslColors.find((c) => c.hex === uniqueHexes[i])!;
      const c2 = hslColors.find((c) => c.hex === uniqueHexes[j])!;
      const hueDiff = Math.abs(c1.h - c2.h);
      const satDiff = Math.abs(c1.s - c2.s);
      const lightDiff = Math.abs(c1.l - c2.l);
      if (hueDiff < 15 && satDiff < 0.1 && lightDiff < 0.1) {
        nearDupes++;
      }
    }
  }
  if (nearDupes > 0) {
    penalties += nearDupes * 5;
    findings.push(`${nearDupes} near-duplicate color pair(s) — consolidate for cleaner palette`);
  }

  // Visual overload check (research: using borders + shadows + colors simultaneously = amateur)
  for (const block of blocks) {
    const props = new Set(block.declarations.map((d) => d.property));
    const hasBorder = props.has("border") || props.has("border-color");
    const hasShadow = props.has("box-shadow");
    const hasBgColor = props.has("background-color") || props.has("background");
    const hasOutline = props.has("outline");
    const visualTechniques = [hasBorder, hasShadow, hasBgColor, hasOutline].filter(Boolean).length;
    if (visualTechniques >= 3) {
      penalties += 8;
      findings.push("Multiple grouping techniques on same element (border + shadow + background) — use one visual technique per grouping");
      break; // Only flag once
    }
  }

  // Grid alignment of spacing values
  const spacingProps = ["padding", "padding-top", "padding-right", "padding-bottom", "padding-left",
    "margin", "margin-top", "margin-right", "margin-bottom", "margin-left", "gap"];
  let totalSpacing = 0;
  let gridAligned = 0;
  for (const d of declarations) {
    if (spacingProps.includes(d.property)) {
      const parsed = parseCSSValue(d.value);
      if (parsed) {
        const px = toPx(parsed);
        if (px !== null && px > 0) {
          totalSpacing++;
          if (px % GRID_BASE === 0) gridAligned++;
        }
      }
    }
  }
  if (totalSpacing > 0) {
    const gridPct = Math.round((gridAligned / totalSpacing) * 100);
    if (gridPct < 70) {
      penalties += Math.round((70 - gridPct) * 0.4);
      findings.push(`Only ${gridPct}% of spacing values are grid-aligned (${GRID_BASE}px)`);
    }
  }

  const score = Math.max(0, 100 - penalties);
  return { name: "Harmony", score, label: scoreLabel(score), icon: "🎨", findings };
}

// ---------------------------------------------------------------------------
// 5. Density — Appropriate use of whitespace
// ---------------------------------------------------------------------------

export function scoreDensity(
  declarations: StyleDeclaration[],
  pageType?: string,
  ranges?: IndustryRanges,
): DimensionScore {
  const findings: string[] = [];
  let penalties = 0;

  // Analyze spacing values
  const spacingPx: number[] = [];
  const spacingProps = ["padding", "padding-top", "padding-right", "padding-bottom", "padding-left",
    "margin", "margin-top", "margin-right", "margin-bottom", "margin-left", "gap"];
  for (const d of declarations) {
    if (spacingProps.includes(d.property)) {
      const parsed = parseCSSValue(d.value);
      if (parsed) {
        const px = toPx(parsed);
        if (px !== null && px > 0) spacingPx.push(px);
      }
    }
  }

  if (spacingPx.length === 0) {
    return { name: "Density", score: 100, label: "Excellent", icon: "📦", findings: ["No spacing declarations to analyze"] };
  }

  const avgSpacing = spacingPx.reduce((a, b) => a + b, 0) / spacingPx.length;
  const maxSpacing = Math.max(...spacingPx);

  // Context-aware density check
  if (pageType === "landing" || pageType === "pricing") {
    // Landing pages should be spacious
    if (avgSpacing < 16) {
      penalties += 15;
      findings.push(`Average spacing is tight (${avgSpacing.toFixed(0)}px) for a ${pageType} page — consider more breathing room`);
    }
    if (maxSpacing < 32) {
      penalties += 10;
      findings.push(`Largest spacing is only ${maxSpacing}px — ${pageType} pages typically need 48-80px section gaps`);
    }
  } else if (pageType === "dashboard") {
    // Dashboards should be compact
    if (avgSpacing > 32) {
      penalties += 10;
      findings.push(`Average spacing is wide (${avgSpacing.toFixed(0)}px) for a dashboard — dashboards benefit from compact layouts`);
    }
  }

  // General: check if there's any large spacing for sections
  const hasLargeSpacing = spacingPx.some((v) => v >= 32);
  if (!hasLargeSpacing && spacingPx.length > 5) {
    penalties += 10;
    findings.push("No spacing values >= 32px — sections may feel cramped");
  }

  // Center-alignment overuse (research: centering everything = amateur anti-pattern)
  let centerCount = 0;
  let totalAlignments = 0;
  for (const d of declarations) {
    if (d.property === "text-align") {
      totalAlignments++;
      if (d.value === "center") centerCount++;
    }
  }
  if (totalAlignments > 2 && centerCount / totalAlignments > 0.7) {
    penalties += 10;
    findings.push(`${centerCount}/${totalAlignments} text-align declarations are center — body text should be left-aligned for readability`);
  }

  const score = Math.max(0, 100 - penalties);
  return { name: "Density", score, label: scoreLabel(score), icon: "📦", findings };
}

// ---------------------------------------------------------------------------
// 6. Interactivity — Are interactive states designed?
// Research: "Every user action needs visible feedback"
// Research: "All interactive elements need hover/active/focus states"
// ---------------------------------------------------------------------------

export function scoreInteractivity(
  declarations: StyleDeclaration[],
  blocks: StyleBlock[],
  code?: string,
): DimensionScore {
  const findings: string[] = [];
  let penalties = 0;

  // Check for hover states in CSS
  const hasHover = code ? /(:hover|hover:)/.test(code) : false;
  const hasFocus = code ? /(:focus|focus:)/.test(code) : false;
  const hasActive = code ? /(:active|active:)/.test(code) : false;
  const hasTransition = declarations.some((d) => d.property === "transition" || d.property === "transition-property");
  const hasDisabled = code ? /(:disabled|disabled:|opacity:\s*0\.[3-5])/.test(code) : false;

  // Count interactive elements (buttons, links, inputs)
  const hasButtons = code ? /<button|type="submit"|type="button"|\.btn|btn-/i.test(code) : false;
  const hasInputs = code ? /<input|<textarea|<select/i.test(code) : false;
  const hasLinks = code ? /<a\s/i.test(code) : false;
  const interactiveCount = [hasButtons, hasInputs, hasLinks].filter(Boolean).length;

  if (interactiveCount === 0) {
    return { name: "Interactivity", score: 100, label: "Excellent", icon: "👆", findings: ["No interactive elements detected"] };
  }

  // Missing hover state
  if (!hasHover && interactiveCount > 0) {
    penalties += 20;
    findings.push("No hover states defined — interactive elements should have visible hover feedback");
  }

  // Missing focus state
  if (!hasFocus && (hasInputs || hasButtons)) {
    penalties += 15;
    findings.push("No focus states — keyboard users can't see which element is active");
  }

  // Missing transitions
  if (!hasTransition && interactiveCount > 0) {
    penalties += 10;
    findings.push("No CSS transitions — state changes feel jarring without smooth transitions");
  }

  // Missing disabled state
  if (hasButtons && !hasDisabled) {
    penalties += 5;
    findings.push("No disabled state styling — buttons should visually indicate when inactive");
  }

  // Check for cursor: pointer on clickable elements
  const hasCursorPointer = declarations.some((d) => d.property === "cursor" && d.value === "pointer");
  if (hasButtons && !hasCursorPointer) {
    penalties += 5;
    findings.push("No cursor: pointer on interactive elements");
  }

  if (penalties === 0) {
    findings.push("Interactive states are well covered ✓");
  }

  const score = Math.max(0, 100 - penalties);
  return { name: "Interactivity", score, label: scoreLabel(score), icon: "👆", findings };
}

// ---------------------------------------------------------------------------
// Aggregate scorecard
// ---------------------------------------------------------------------------

export function computeScorecard(
  declarations: StyleDeclaration[],
  blocks: StyleBlock[],
  options?: {
    pageType?: string;
    ranges?: IndustryRanges;
    code?: string;
  },
): DesignScorecard {
  const consistency = scoreConsistency(declarations, options?.ranges);
  const hierarchy = scoreHierarchy(declarations, blocks);
  const accessibility = scoreAccessibility(declarations, blocks);
  const harmony = scoreHarmony(declarations, blocks);
  const density = scoreDensity(declarations, options?.pageType, options?.ranges);
  const interactivity = scoreInteractivity(declarations, blocks, options?.code);

  const dimensions = [consistency, hierarchy, accessibility, harmony, density, interactivity];

  // Weighted average (research-backed weights)
  const weights = [0.20, 0.20, 0.15, 0.15, 0.15, 0.15];
  const overall = Math.round(
    dimensions.reduce((sum, dim, i) => sum + dim.score * weights[i], 0),
  );

  return {
    overall,
    dimensions,
    industryPercentile: null,
  };
}
