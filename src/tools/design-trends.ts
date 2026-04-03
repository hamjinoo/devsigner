import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as fs from "node:fs";
import type { DesignAnalysis } from "./analyze-url.js";

// ─── Aggregation helpers ────────────────────────────────────────────────────

type FocusArea = "colors" | "typography" | "spacing" | "layout" | "shapes" | "all";

function countOccurrences<T extends string | number>(items: T[]): Map<T, number> {
  const map = new Map<T, number>();
  for (const item of items) {
    map.set(item, (map.get(item) || 0) + 1);
  }
  return map;
}

function topN<T>(map: Map<T, number>, n: number): Array<{ value: T; count: number }> {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([value, count]) => ({ value, count }));
}

function pct(count: number, total: number): string {
  if (total === 0) return "0%";
  return `${Math.round((count / total) * 100)}%`;
}

// ─── Section builders ───────────────────────────────────────────────────────

function buildColorTrends(analyses: DesignAnalysis[]): string {
  const total = analyses.length;

  // Color scheme distribution
  const schemes = countOccurrences(analyses.map(a => a.colors.color_scheme));
  const lightCount = schemes.get("light") || 0;
  const darkCount = schemes.get("dark") || 0;
  const mixedCount = schemes.get("mixed") || 0;

  // Most popular hex colors across all sites
  const hexCounts = new Map<string, number>();
  for (const a of analyses) {
    const seen = new Set<string>();
    for (const c of a.colors.palette) {
      if (!seen.has(c.hex)) {
        seen.add(c.hex);
        hexCounts.set(c.hex, (hexCounts.get(c.hex) || 0) + 1);
      }
    }
  }
  const topColors = topN(hexCounts, 10);

  // Average color count
  const avgColorCount = total > 0
    ? Math.round(analyses.reduce((s, a) => s + a.colors.color_count, 0) / total)
    : 0;

  // Accent color trends
  const accentCounts = new Map<string, number>();
  for (const a of analyses) {
    if (a.colors.accent_color) {
      accentCounts.set(a.colors.accent_color, (accentCounts.get(a.colors.accent_color) || 0) + 1);
    }
  }
  const topAccents = topN(accentCounts, 5);

  const lines = [
    `## Color Trends`,
    ``,
    `### Color Scheme Distribution`,
    `| Scheme | Count | Share |`,
    `|--------|-------|-------|`,
    `| Light | ${lightCount} | ${pct(lightCount, total)} |`,
    `| Dark | ${darkCount} | ${pct(darkCount, total)} |`,
    `| Mixed | ${mixedCount} | ${pct(mixedCount, total)} |`,
    ``,
    `### Most Popular Colors (across all sites)`,
    `| Rank | Hex | Sites Using |`,
    `|------|-----|-------------|`,
    ...topColors.map((c, i) => `| ${i + 1} | \`${c.value}\` | ${c.count} (${pct(c.count, total)}) |`),
    ``,
    `**Average color count per site:** ${avgColorCount}`,
    ``,
  ];

  if (topAccents.length > 0) {
    lines.push(`### Top Accent Colors`);
    lines.push(`| Hex | Sites Using |`);
    lines.push(`|-----|-------------|`);
    for (const a of topAccents) {
      lines.push(`| \`${a.value}\` | ${a.count} |`);
    }
    lines.push(``);
  }

  return lines.join("\n");
}

function buildTypographyTrends(analyses: DesignAnalysis[]): string {
  const total = analyses.length;

  // Most used fonts
  const fontCounts = new Map<string, number>();
  for (const a of analyses) {
    const seen = new Set<string>();
    for (const f of a.typography.fonts) {
      if (!seen.has(f.family)) {
        seen.add(f.family);
        fontCounts.set(f.family, (fontCounts.get(f.family) || 0) + 1);
      }
    }
  }
  const topFonts = topN(fontCounts, 10);

  // Common font size scales
  const sizeCounts = new Map<number, number>();
  for (const a of analyses) {
    for (const s of a.typography.font_sizes) {
      sizeCounts.set(s.size_px, (sizeCounts.get(s.size_px) || 0) + s.count);
    }
  }
  const topSizes = topN(sizeCounts, 10);

  // Average type scale ratio
  const ratios = analyses.map(a => a.typography.type_scale_ratio).filter((r): r is number => r !== null);
  const avgRatio = ratios.length > 0
    ? Math.round((ratios.reduce((s, r) => s + r, 0) / ratios.length) * 1000) / 1000
    : null;

  // Heading vs body font pairing patterns
  const pairingCounts = new Map<string, number>();
  for (const a of analyses) {
    const heading = a.typography.heading_font || "(same as body)";
    const body = a.typography.body_font || "(unknown)";
    const pair = `${heading} / ${body}`;
    pairingCounts.set(pair, (pairingCounts.get(pair) || 0) + 1);
  }
  const topPairings = topN(pairingCounts, 5);

  const lines = [
    `## Typography Trends`,
    ``,
    `### Most Used Fonts`,
    `| Rank | Font | Sites Using |`,
    `|------|------|-------------|`,
    ...topFonts.map((f, i) => `| ${i + 1} | ${f.value} | ${f.count} (${pct(f.count, total)}) |`),
    ``,
    `### Common Font Sizes`,
    `| Size | Total Usage |`,
    `|------|-------------|`,
    ...topSizes.map(s => `| ${s.value}px | ${s.count} |`),
    ``,
    `**Average type scale ratio:** ${avgRatio !== null ? avgRatio : "N/A (insufficient data)"}`,
    ``,
    `### Heading / Body Font Pairings`,
    `| Pairing | Sites |`,
    `|---------|-------|`,
    ...topPairings.map(p => `| ${p.value} | ${p.count} |`),
    ``,
  ];

  return lines.join("\n");
}

function buildSpacingTrends(analyses: DesignAnalysis[]): string {
  const total = analyses.length;

  // Average grid alignment percentage
  const avgGridAlignment = total > 0
    ? Math.round(analyses.reduce((s, a) => s + a.spacing.grid_aligned_percentage, 0) / total)
    : 0;

  // Most common base units
  const baseUnits = countOccurrences(analyses.map(a => a.spacing.base_unit));
  const topBaseUnits = topN(baseUnits, 5);

  // Density distribution
  const densities = countOccurrences(analyses.map(a => a.spacing.density));
  const spacious = densities.get("spacious") || 0;
  const balanced = densities.get("balanced") || 0;
  const compact = densities.get("compact") || 0;

  const lines = [
    `## Spacing Trends`,
    ``,
    `**Average grid alignment:** ${avgGridAlignment}%`,
    ``,
    `### Most Common Base Units`,
    `| Base Unit | Sites |`,
    `|-----------|-------|`,
    ...topBaseUnits.map(u => `| ${u.value}px | ${u.count} (${pct(u.count, total)}) |`),
    ``,
    `### Density Distribution`,
    `| Density | Count | Share |`,
    `|---------|-------|-------|`,
    `| Spacious | ${spacious} | ${pct(spacious, total)} |`,
    `| Balanced | ${balanced} | ${pct(balanced, total)} |`,
    `| Compact | ${compact} | ${pct(compact, total)} |`,
    ``,
  ];

  return lines.join("\n");
}

function buildLayoutTrends(analyses: DesignAnalysis[]): string {
  const total = analyses.length;

  const sidebarCount = analyses.filter(a => a.layout.has_sidebar).length;
  const heroCount = analyses.filter(a => a.layout.has_hero).length;
  const stickyCount = analyses.filter(a => a.layout.has_sticky_header).length;
  const footerCount = analyses.filter(a => a.layout.has_footer).length;

  // Most common column counts
  const colCounts = countOccurrences(analyses.map(a => a.layout.column_count));
  const topCols = topN(colCounts, 5);

  const lines = [
    `## Layout Trends`,
    ``,
    `### Feature Usage`,
    `| Feature | Count | Share |`,
    `|---------|-------|-------|`,
    `| Sidebar | ${sidebarCount} | ${pct(sidebarCount, total)} |`,
    `| Hero Section | ${heroCount} | ${pct(heroCount, total)} |`,
    `| Sticky Header | ${stickyCount} | ${pct(stickyCount, total)} |`,
    `| Footer | ${footerCount} | ${pct(footerCount, total)} |`,
    ``,
    `### Most Common Column Counts`,
    `| Columns | Sites |`,
    `|---------|-------|`,
    ...topCols.map(c => `| ${c.value} | ${c.count} (${pct(c.count, total)}) |`),
    ``,
  ];

  return lines.join("\n");
}

function buildShapesTrends(analyses: DesignAnalysis[]): string {
  const total = analyses.length;

  // Corner style distribution
  const cornerStyles = countOccurrences(analyses.map(a => a.shapes.corner_style));
  const sharp = cornerStyles.get("sharp") || 0;
  const subtle = cornerStyles.get("subtle") || 0;
  const rounded = cornerStyles.get("rounded") || 0;
  const pill = cornerStyles.get("pill") || 0;

  // Shadow style distribution
  const shadowStyles = countOccurrences(analyses.map(a => a.shapes.shadow_style));
  const noShadow = shadowStyles.get("none") || 0;
  const subtleShadow = shadowStyles.get("subtle") || 0;
  const mediumShadow = shadowStyles.get("medium") || 0;
  const dramatic = shadowStyles.get("dramatic") || 0;

  // Most common border-radius values
  const radiusCounts = new Map<number, number>();
  for (const a of analyses) {
    for (const r of a.shapes.border_radii) {
      radiusCounts.set(r.value_px, (radiusCounts.get(r.value_px) || 0) + r.count);
    }
  }
  const topRadii = topN(radiusCounts, 8);

  const lines = [
    `## Shape Trends`,
    ``,
    `### Corner Style Distribution`,
    `| Style | Count | Share |`,
    `|-------|-------|-------|`,
    `| Sharp | ${sharp} | ${pct(sharp, total)} |`,
    `| Subtle | ${subtle} | ${pct(subtle, total)} |`,
    `| Rounded | ${rounded} | ${pct(rounded, total)} |`,
    `| Pill | ${pill} | ${pct(pill, total)} |`,
    ``,
    `### Shadow Style Distribution`,
    `| Style | Count | Share |`,
    `|-------|-------|-------|`,
    `| None | ${noShadow} | ${pct(noShadow, total)} |`,
    `| Subtle | ${subtleShadow} | ${pct(subtleShadow, total)} |`,
    `| Medium | ${mediumShadow} | ${pct(mediumShadow, total)} |`,
    `| Dramatic | ${dramatic} | ${pct(dramatic, total)} |`,
    ``,
    `### Most Common Border Radius Values`,
    `| Radius | Total Usage |`,
    `|--------|-------------|`,
    ...topRadii.map(r => `| ${r.value}px | ${r.count} |`),
    ``,
  ];

  return lines.join("\n");
}

function buildOverallTrends(analyses: DesignAnalysis[]): string {
  const total = analyses.length;

  // Personality distribution
  const personalities = countOccurrences(analyses.map(a => a.overall.design_personality));
  const topPersonalities = topN(personalities, 10);

  // Industry distribution
  const industries = countOccurrences(analyses.map(a => a.overall.estimated_industry));
  const topIndustries = topN(industries, 10);

  // Complexity score distribution
  const scores = analyses.map(a => a.overall.complexity_score);
  const avgComplexity = total > 0 ? Math.round(scores.reduce((s, v) => s + v, 0) / total) : 0;
  const minComplexity = total > 0 ? Math.min(...scores) : 0;
  const maxComplexity = total > 0 ? Math.max(...scores) : 0;

  // Buckets for complexity
  const low = scores.filter(s => s < 33).length;
  const mid = scores.filter(s => s >= 33 && s < 66).length;
  const high = scores.filter(s => s >= 66).length;

  const lines = [
    `## Overall Trends`,
    ``,
    `### Personality Distribution`,
    `| Personality | Count | Share |`,
    `|-------------|-------|-------|`,
    ...topPersonalities.map(p => `| ${p.value} | ${p.count} | ${pct(p.count, total)} |`),
    ``,
    `### Industry Distribution`,
    `| Industry | Count | Share |`,
    `|----------|-------|-------|`,
    ...topIndustries.map(ind => `| ${ind.value} | ${ind.count} | ${pct(ind.count, total)} |`),
    ``,
    `### Complexity Score Distribution`,
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Average | ${avgComplexity}/100 |`,
    `| Minimum | ${minComplexity}/100 |`,
    `| Maximum | ${maxComplexity}/100 |`,
    ``,
    `| Range | Count | Share |`,
    `|-------|-------|-------|`,
    `| Low (0-32) | ${low} | ${pct(low, total)} |`,
    `| Medium (33-65) | ${mid} | ${pct(mid, total)} |`,
    `| High (66-100) | ${high} | ${pct(high, total)} |`,
    ``,
  ];

  return lines.join("\n");
}

// ─── Tool Registration ──────────────────────────────────────────────────────

export function registerDesignTrends(server: McpServer): void {
  server.tool(
    "design_trends",
    "Analyze a collection of design analyses to identify trends. Reads a JSON file of DesignAnalysis results (from batch_analyze) and generates a markdown report with aggregated statistics on colors, typography, spacing, layout, shapes, and overall patterns.",
    {
      data_path: z
        .string()
        .describe("Path to the JSON file containing analyses (from batch_analyze)"),
      focus: z
        .enum(["colors", "typography", "spacing", "layout", "shapes", "all"])
        .default("all")
        .describe("Which aspect to focus the report on"),
    },
    async ({ data_path, focus }) => {
      try {
        // Read and parse the data file
        if (!fs.existsSync(data_path)) {
          return {
            content: [
              {
                type: "text" as const,
                text: `File not found: ${data_path}\n\nRun batch_analyze first to generate analysis data.`,
              },
            ],
            isError: true,
          };
        }

        let analyses: DesignAnalysis[];
        try {
          const raw = fs.readFileSync(data_path, "utf-8");
          const parsed = JSON.parse(raw);
          if (!Array.isArray(parsed)) {
            return {
              content: [
                {
                  type: "text" as const,
                  text: `Invalid data format: expected a JSON array in ${data_path}`,
                },
              ],
              isError: true,
            };
          }
          analyses = parsed;
        } catch (parseErr) {
          const msg = parseErr instanceof Error ? parseErr.message : String(parseErr);
          return {
            content: [
              {
                type: "text" as const,
                text: `Failed to parse ${data_path}: ${msg}`,
              },
            ],
            isError: true,
          };
        }

        if (analyses.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `No analyses found in ${data_path}. Run batch_analyze to collect data first.`,
              },
            ],
            isError: true,
          };
        }

        // Build report
        const sections: string[] = [
          `# Design Trends Report`,
          ``,
          `**Source:** \`${data_path}\``,
          `**Sites analyzed:** ${analyses.length}`,
          `**Focus:** ${focus}`,
          `**Generated:** ${new Date().toISOString()}`,
          ``,
          `---`,
          ``,
        ];

        const builders: Record<FocusArea, () => string[]> = {
          colors: () => [buildColorTrends(analyses)],
          typography: () => [buildTypographyTrends(analyses)],
          spacing: () => [buildSpacingTrends(analyses)],
          layout: () => [buildLayoutTrends(analyses)],
          shapes: () => [buildShapesTrends(analyses)],
          all: () => [
            buildColorTrends(analyses),
            `---\n`,
            buildTypographyTrends(analyses),
            `---\n`,
            buildSpacingTrends(analyses),
            `---\n`,
            buildLayoutTrends(analyses),
            `---\n`,
            buildShapesTrends(analyses),
            `---\n`,
            buildOverallTrends(analyses),
          ],
        };

        sections.push(...builders[focus]());

        // Add insights summary at the end
        if (focus === "all") {
          sections.push(`---\n`);
          sections.push(`## Key Insights\n`);

          // Dominant color scheme
          const schemeMap = countOccurrences(analyses.map(a => a.colors.color_scheme));
          const topScheme = topN(schemeMap, 1)[0];
          if (topScheme) {
            sections.push(
              `- **Dominant color scheme:** ${topScheme.value} (${pct(topScheme.count, analyses.length)} of sites)`,
            );
          }

          // Most popular font
          const fontMap = new Map<string, number>();
          for (const a of analyses) {
            for (const f of a.typography.fonts) {
              fontMap.set(f.family, (fontMap.get(f.family) || 0) + 1);
            }
          }
          const topFont = topN(fontMap, 1)[0];
          if (topFont) {
            sections.push(
              `- **Most popular font:** ${topFont.value} (used on ${topFont.count} sites)`,
            );
          }

          // Dominant personality
          const persMap = countOccurrences(analyses.map(a => a.overall.design_personality));
          const topPers = topN(persMap, 1)[0];
          if (topPers) {
            sections.push(
              `- **Dominant personality:** ${topPers.value} (${pct(topPers.count, analyses.length)})`,
            );
          }

          // Spacing preference
          const densMap = countOccurrences(analyses.map(a => a.spacing.density));
          const topDens = topN(densMap, 1)[0];
          if (topDens) {
            sections.push(
              `- **Spacing preference:** ${topDens.value} (${pct(topDens.count, analyses.length)})`,
            );
          }

          // Corner style
          const cornerMap = countOccurrences(analyses.map(a => a.shapes.corner_style));
          const topCorner = topN(cornerMap, 1)[0];
          if (topCorner) {
            sections.push(
              `- **Corner style trend:** ${topCorner.value} (${pct(topCorner.count, analyses.length)})`,
            );
          }

          sections.push(``);
        }

        return {
          content: [{ type: "text" as const, text: sections.join("\n") }],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: "text" as const, text: `Design trends analysis failed: ${message}` }],
          isError: true,
        };
      }
    },
  );
}
