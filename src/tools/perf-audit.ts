import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { detectFramework, type Framework } from "../parsers/framework-detector.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Severity = "error" | "warning" | "info";
type CWVMetric = "CLS" | "LCP" | "FID/INP" | "General";

interface PerfIssue {
  metric: CWVMetric;
  severity: Severity;
  description: string;
  element: string;
  suggestion: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function snippet(el: string, max = 120): string {
  const s = el.replace(/\s+/g, " ").trim();
  return s.length > max ? s.slice(0, max) + "..." : s;
}

function findTags(code: string, tagRegex: RegExp): string[] {
  const results: string[] = [];
  let m: RegExpExecArray | null;
  const flags = tagRegex.flags.includes("g") ? tagRegex.flags : tagRegex.flags + "g";
  const re = new RegExp(tagRegex.source, flags);
  while ((m = re.exec(code)) !== null) {
    results.push(m[0]);
  }
  return results;
}

function hasAttr(tag: string, attrName: string): boolean {
  const escaped = attrName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}(?:\\s*=|\\s|>|\\/)`, "i").test(tag);
}

function getAttrValue(tag: string, attrName: string): string | null {
  const escaped = attrName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`${escaped}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|\\{([^}]*)\\})`, "i");
  const m = tag.match(re);
  if (!m) return null;
  return m[1] ?? m[2] ?? m[3] ?? null;
}

// ---------------------------------------------------------------------------
// CLS checks
// ---------------------------------------------------------------------------

function checkImagesWithoutDimensions(code: string, _fw: Framework): PerfIssue[] {
  const issues: PerfIssue[] = [];
  const imgTags = findTags(code, /<img\b[^>]*\/?>/gi);

  for (const tag of imgTags) {
    const hasWidth = hasAttr(tag, "width") || /\bstyle\s*=\s*["'][^"']*width\s*:/i.test(tag);
    const hasHeight = hasAttr(tag, "height") || /\bstyle\s*=\s*["'][^"']*height\s*:/i.test(tag);

    if (!hasWidth || !hasHeight) {
      issues.push({
        metric: "CLS",
        severity: "error",
        description: "Image missing explicit width/height attributes, causing layout shift on load.",
        element: snippet(tag),
        suggestion: "Add explicit `width` and `height` attributes to the <img> tag, or use CSS `aspect-ratio`.",
      });
    }
  }
  return issues;
}

function checkDynamicContentWithoutSpace(code: string, fw: Framework): PerfIssue[] {
  const issues: PerfIssue[] = [];

  // Detect conditional rendering that may inject content without reserved space
  const conditionalPatterns: RegExp[] = [];

  if (fw === "react") {
    conditionalPatterns.push(/\{[^}]*\?\s*(<[^>]+>[\s\S]*?)\s*:\s*null\s*\}/g);
    conditionalPatterns.push(/\{[^}]*&&\s*(<[^>]+>)/g);
  } else if (fw === "vue") {
    conditionalPatterns.push(/<[^>]*\bv-if\b[^>]*>/gi);
    conditionalPatterns.push(/<[^>]*\bv-show\b[^>]*>/gi);
  } else if (fw === "svelte") {
    conditionalPatterns.push(/\{#if\b[^}]*\}[\s\S]*?\{\/if\}/g);
  }

  for (const pattern of conditionalPatterns) {
    const matches = findTags(code, pattern);
    for (const match of matches) {
      // Check if there's a min-height or fixed dimensions nearby
      if (!/min-height|min-width|aspect-ratio|height\s*[:=]/i.test(match)) {
        issues.push({
          metric: "CLS",
          severity: "warning",
          description: "Dynamic content insertion without reserved space may cause layout shift.",
          element: snippet(match),
          suggestion: "Reserve space with `min-height` or a skeleton/placeholder so the layout does not shift when content appears.",
        });
      }
    }
  }
  return issues;
}

function checkFontDisplaySwap(code: string): PerfIssue[] {
  const issues: PerfIssue[] = [];
  const fontFaceBlocks = findTags(code, /@font-face\s*\{[^}]*\}/gi);

  for (const block of fontFaceBlocks) {
    if (!/font-display\s*:\s*(swap|optional)/i.test(block)) {
      issues.push({
        metric: "CLS",
        severity: "warning",
        description: "@font-face rule missing `font-display: swap` or `optional`, causing invisible text flash (FOIT) and layout shift.",
        element: snippet(block),
        suggestion: "Add `font-display: swap;` or `font-display: optional;` to the @font-face rule.",
      });
    }
  }

  // Also check Google Fonts links without display param
  const linkTags = findTags(code, /<link\b[^>]*fonts\.googleapis\.com[^>]*>/gi);
  for (const tag of linkTags) {
    if (!/display=swap|display=optional/i.test(tag)) {
      issues.push({
        metric: "CLS",
        severity: "warning",
        description: "Google Fonts link missing `&display=swap` parameter.",
        element: snippet(tag),
        suggestion: "Add `&display=swap` to the Google Fonts URL to prevent layout shift from font loading.",
      });
    }
  }
  return issues;
}

function checkEmbedDimensions(code: string): PerfIssue[] {
  const issues: PerfIssue[] = [];
  const embedTags = findTags(code, /<(iframe|embed|object|video)\b[^>]*>/gi);

  for (const tag of embedTags) {
    const hasWidth = hasAttr(tag, "width") || /\bstyle\s*=\s*["'][^"']*width\s*:/i.test(tag);
    const hasHeight = hasAttr(tag, "height") || /\bstyle\s*=\s*["'][^"']*height\s*:/i.test(tag);

    if (!hasWidth || !hasHeight) {
      issues.push({
        metric: "CLS",
        severity: "error",
        description: "Embedded content (iframe/embed/object/video) without fixed dimensions causes layout shift.",
        element: snippet(tag),
        suggestion: "Set explicit `width` and `height` attributes, or wrap in a container with a fixed aspect-ratio.",
      });
    }
  }
  return issues;
}

// ---------------------------------------------------------------------------
// LCP checks
// ---------------------------------------------------------------------------

function checkHeroImagePriority(code: string): PerfIssue[] {
  const issues: PerfIssue[] = [];
  const imgTags = findTags(code, /<img\b[^>]*\/?>/gi);

  // Heuristic: the first <img> in the document is likely the hero/LCP image
  if (imgTags.length > 0) {
    const firstImg = imgTags[0];
    const hasEager = /loading\s*=\s*["']eager["']/i.test(firstImg);
    const hasFetchPriority = /fetchpriority\s*=\s*["']high["']/i.test(firstImg);
    const hasLazy = /loading\s*=\s*["']lazy["']/i.test(firstImg);

    if (hasLazy) {
      issues.push({
        metric: "LCP",
        severity: "error",
        description: "First image has `loading=\"lazy\"` which delays the LCP element.",
        element: snippet(firstImg),
        suggestion: "Remove `loading=\"lazy\"` from above-the-fold hero images. Use `loading=\"eager\"` and `fetchpriority=\"high\"` instead.",
      });
    } else if (!hasEager && !hasFetchPriority) {
      issues.push({
        metric: "LCP",
        severity: "warning",
        description: "First image (likely hero/LCP element) missing `loading=\"eager\"` or `fetchpriority=\"high\"`.",
        element: snippet(firstImg),
        suggestion: "Add `fetchpriority=\"high\"` to your hero/LCP image to prioritize its loading.",
      });
    }
  }
  return issues;
}

function checkLargeBackgroundImages(code: string): PerfIssue[] {
  const issues: PerfIssue[] = [];
  const bgImageRegex = /background(?:-image)?\s*:\s*[^;]*url\s*\(\s*["']?([^"')]+)["']?\s*\)/gi;
  let match;

  while ((match = bgImageRegex.exec(code)) !== null) {
    const url = match[1];
    // Flag large image patterns (no actual file size check, just heuristics)
    if (/\.(png|jpg|jpeg|bmp|tiff)$/i.test(url) && !/\.(svg|webp|avif)$/i.test(url)) {
      issues.push({
        metric: "LCP",
        severity: "warning",
        description: "Large background image uses a non-optimized format. CSS background images are not preloaded by the browser.",
        element: snippet(match[0]),
        suggestion: "Use WebP/AVIF format. For LCP elements, consider using an <img> tag with `fetchpriority=\"high\"` or add a `<link rel=\"preload\">` for the image.",
      });
    }
  }
  return issues;
}

function checkRenderBlockingCSS(code: string): PerfIssue[] {
  const issues: PerfIssue[] = [];
  const importRegex = /@import\s+(?:url\s*\()?["']?([^"');\s]+)["']?\)?[^;]*;/gi;
  let match;

  while ((match = importRegex.exec(code)) !== null) {
    issues.push({
      metric: "LCP",
      severity: "error",
      description: "CSS `@import` is render-blocking and creates a waterfall of network requests.",
      element: snippet(match[0]),
      suggestion: "Replace `@import` with a `<link>` tag or bundle CSS at build time. Each @import adds a sequential round-trip.",
    });
  }
  return issues;
}

function checkExcessiveCustomProperties(code: string): PerfIssue[] {
  const issues: PerfIssue[] = [];
  const customPropRegex = /--[\w-]+\s*:/g;
  const matches = code.match(customPropRegex) || [];
  const uniqueProps = new Set(matches.map((m) => m.replace(/\s*:$/, "")));

  if (uniqueProps.size > 50) {
    issues.push({
      metric: "LCP",
      severity: "info",
      description: `Found ${uniqueProps.size} unique CSS custom properties. Excessive custom properties can slow style recalculation.`,
      element: `${uniqueProps.size} CSS custom properties (--*)`,
      suggestion: "Consolidate CSS custom properties. Consider grouping related values or using a CSS-in-JS solution that tree-shakes unused variables.",
    });
  }
  return issues;
}

// ---------------------------------------------------------------------------
// FID/INP checks
// ---------------------------------------------------------------------------

function checkHeavyBoxShadowOnHover(code: string): PerfIssue[] {
  const issues: PerfIssue[] = [];
  // Find :hover blocks with box-shadow
  const hoverBlockRegex = /:hover\s*\{([^}]*)\}/gi;
  let match;

  while ((match = hoverBlockRegex.exec(code)) !== null) {
    const body = match[1];
    const shadowMatch = body.match(/box-shadow\s*:\s*([^;]+)/i);
    if (shadowMatch) {
      const shadowValue = shadowMatch[1];
      // Complex = multiple shadows (commas) or large blur values
      const commaCount = (shadowValue.match(/,/g) || []).length;
      const blurValues = shadowValue.match(/\d+px/g) || [];
      const hasLargeBlur = blurValues.some((v) => parseInt(v) > 20);

      if (commaCount >= 2 || hasLargeBlur) {
        issues.push({
          metric: "FID/INP",
          severity: "warning",
          description: "Complex box-shadow on :hover causes expensive paint operations on every hover interaction.",
          element: snippet(match[0]),
          suggestion: "Simplify the box-shadow or use `filter: drop-shadow()` which can be GPU-accelerated. Avoid multiple shadow layers on hover.",
        });
      }
    }
  }
  return issues;
}

function checkCSSFilterOnLargeElements(code: string): PerfIssue[] {
  const issues: PerfIssue[] = [];
  const filterRegex = /filter\s*:\s*([^;]+)/gi;
  let match;

  while ((match = filterRegex.exec(code)) !== null) {
    const filterValue = match[1].trim();
    if (/blur|brightness|contrast|saturate|hue-rotate/i.test(filterValue)) {
      // Check if the rule context contains large element selectors or high dimensions
      const context = code.substring(Math.max(0, match.index - 200), match.index + match[0].length + 50);
      const hasLargeDimensions = /width\s*:\s*100|height\s*:\s*100|100vw|100vh|100%/i.test(context);
      const isBackdrop = /backdrop-filter/i.test(match[0]);

      if (hasLargeDimensions || isBackdrop) {
        issues.push({
          metric: "FID/INP",
          severity: "warning",
          description: "CSS filter (blur, brightness, etc.) on large or full-viewport elements causes expensive repaints.",
          element: snippet(match[0]),
          suggestion: "Limit filters to small elements. For backdrop-filter, ensure the element covers only the needed area. Consider using `will-change: filter` if animated.",
        });
      } else {
        issues.push({
          metric: "FID/INP",
          severity: "info",
          description: "CSS filter property detected. Filters cause repaint and can impact interaction responsiveness.",
          element: snippet(match[0]),
          suggestion: "Ensure this filter is not applied to large elements. Use `will-change: filter` if animating.",
        });
      }
    }
  }
  return issues;
}

function checkTransformWithoutWillChange(code: string): PerfIssue[] {
  const issues: PerfIssue[] = [];

  // Find CSS blocks with transition/animation on transform but without will-change
  const blockRegex = /([^{}]+)\{([^{}]*)\}/g;
  let match;

  while ((match = blockRegex.exec(code)) !== null) {
    const selector = match[1].trim();
    const body = match[2];

    const hasTransformTransition = /transition[^;]*transform/i.test(body);
    const hasAnimation = /animation\s*:/i.test(body);
    const hasTransform = /transform\s*:/i.test(body);
    const hasWillChange = /will-change\s*:/i.test(body);

    if ((hasTransformTransition || (hasAnimation && hasTransform)) && !hasWillChange) {
      issues.push({
        metric: "FID/INP",
        severity: "info",
        description: "Animated `transform` without `will-change` may not be GPU-accelerated.",
        element: snippet(`${selector} { ... }`),
        suggestion: "Add `will-change: transform` to hint the browser to promote the element to its own compositing layer. Remove it when the animation ends.",
      });
    }
  }
  return issues;
}

function checkForcedSyncLayout(code: string): PerfIssue[] {
  const issues: PerfIssue[] = [];

  // Detect patterns like: element.style.X = ...; ... element.offsetHeight
  const writeProps = ["style\\.", "className", "innerHTML", "innerText", "textContent"];
  const readProps = ["offsetHeight", "offsetWidth", "offsetTop", "offsetLeft",
    "clientHeight", "clientWidth", "clientTop", "clientLeft",
    "scrollHeight", "scrollWidth", "scrollTop", "scrollLeft",
    "getBoundingClientRect", "getComputedStyle"];

  // Build a regex that finds write followed by read within a short span
  for (const readProp of readProps) {
    const readRegex = new RegExp(`\\.${readProp}\\b`, "g");
    let readMatch;
    while ((readMatch = readRegex.exec(code)) !== null) {
      // Look backwards for a write in the preceding 500 chars
      const preceding = code.substring(Math.max(0, readMatch.index - 500), readMatch.index);
      const hasWrite = writeProps.some((wp) => new RegExp(`\\.${wp}`, "i").test(preceding));
      if (hasWrite) {
        const context = code.substring(Math.max(0, readMatch.index - 60), readMatch.index + readProp.length + 1);
        issues.push({
          metric: "FID/INP",
          severity: "error",
          description: "Potential forced synchronous layout: DOM write followed by geometry read (layout thrashing).",
          element: snippet(context),
          suggestion: "Batch DOM reads before DOM writes. Use `requestAnimationFrame()` to separate read and write phases.",
        });
        break; // One warning per pattern is enough
      }
    }
  }
  return issues;
}

// ---------------------------------------------------------------------------
// General performance checks
// ---------------------------------------------------------------------------

function checkExcessiveDOMDepth(code: string): PerfIssue[] {
  const issues: PerfIssue[] = [];
  let maxDepth = 0;
  let currentDepth = 0;
  let deepestSnippetStart = 0;

  const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*\/?>/g;
  let match;

  while ((match = tagRegex.exec(code)) !== null) {
    const fullTag = match[0];
    const isSelfClosing = /\/>$/.test(fullTag) || /^<(img|br|hr|input|meta|link|col|area|base|source|track|wbr)\b/i.test(fullTag);
    const isClosing = fullTag.startsWith("</");

    if (isClosing) {
      currentDepth = Math.max(0, currentDepth - 1);
    } else if (!isSelfClosing) {
      currentDepth++;
      if (currentDepth > maxDepth) {
        maxDepth = currentDepth;
        deepestSnippetStart = match.index;
      }
    }
  }

  if (maxDepth > 15) {
    const deepSnippet = code.substring(deepestSnippetStart, deepestSnippetStart + 120);
    issues.push({
      metric: "General",
      severity: "warning",
      description: `Excessive DOM nesting depth: ${maxDepth} levels. Deep DOM trees slow style calculation and layout.`,
      element: snippet(deepSnippet),
      suggestion: "Flatten the DOM structure. Aim for a maximum depth of 15 levels. Use CSS Grid/Flexbox to reduce wrapper elements.",
    });
  }
  return issues;
}

function checkTooManyUniqueCSSValues(code: string): PerfIssue[] {
  const issues: PerfIssue[] = [];

  // Extract all CSS declarations
  const declRegex = /[\w-]+\s*:\s*[^;{}]+/g;
  const allValues = new Set<string>();
  let match;

  while ((match = declRegex.exec(code)) !== null) {
    allValues.add(match[0].trim().toLowerCase());
  }

  if (allValues.size > 200) {
    issues.push({
      metric: "General",
      severity: "info",
      description: `Found ${allValues.size} unique CSS declarations. This may indicate bloated, non-systematic styles.`,
      element: `${allValues.size} unique CSS declarations`,
      suggestion: "Adopt a design token system or utility classes. Consolidate repeated values into CSS custom properties.",
    });
  }
  return issues;
}

function checkLargeInlineStyles(code: string): PerfIssue[] {
  const issues: PerfIssue[] = [];

  // HTML style="..."
  const htmlStyleRegex = /style\s*=\s*"([^"]*)"/gi;
  let match;
  while ((match = htmlStyleRegex.exec(code)) !== null) {
    if (match[1].length > 500) {
      issues.push({
        metric: "General",
        severity: "warning",
        description: `Inline style exceeds 500 characters (${match[1].length} chars). Large inline styles are hard to maintain and increase HTML payload.`,
        element: snippet(match[0]),
        suggestion: "Move styles to a CSS class or stylesheet. Inline styles cannot be cached separately and increase document size.",
      });
    }
  }

  // JSX style={{ ... }}
  const jsxStyleRegex = /style\s*=\s*\{\{([\s\S]*?)\}\}/g;
  while ((match = jsxStyleRegex.exec(code)) !== null) {
    if (match[1].length > 500) {
      issues.push({
        metric: "General",
        severity: "warning",
        description: `JSX inline style object exceeds 500 characters (${match[1].length} chars). Large inline styles increase bundle size and cause re-renders.`,
        element: snippet(match[0]),
        suggestion: "Extract into a separate style object or use CSS modules / styled-components to keep styles outside the render path.",
      });
    }
  }
  return issues;
}

function checkImportantOveruse(code: string): PerfIssue[] {
  const issues: PerfIssue[] = [];
  const importantMatches = code.match(/!important/gi) || [];

  if (importantMatches.length > 5) {
    issues.push({
      metric: "General",
      severity: "warning",
      description: `Found ${importantMatches.length} uses of !important. This indicates CSS specificity wars and maintenance problems.`,
      element: `${importantMatches.length}x !important`,
      suggestion: "Refactor CSS to avoid !important. Use more specific selectors, BEM naming, or CSS modules to manage specificity cleanly.",
    });
  } else if (importantMatches.length > 0) {
    issues.push({
      metric: "General",
      severity: "info",
      description: `Found ${importantMatches.length} use(s) of !important.`,
      element: `${importantMatches.length}x !important`,
      suggestion: "Keep !important usage to a minimum. It overrides the cascade and makes styles harder to debug.",
    });
  }
  return issues;
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

function calculatePerfScore(issues: PerfIssue[]): number {
  let score = 100;

  for (const issue of issues) {
    switch (issue.severity) {
      case "error":
        score -= 12;
        break;
      case "warning":
        score -= 5;
        break;
      case "info":
        score -= 2;
        break;
    }
  }

  return Math.max(0, Math.min(100, score));
}

// ---------------------------------------------------------------------------
// Main audit runner
// ---------------------------------------------------------------------------

function runPerfAudit(code: string, framework: Framework): PerfIssue[] {
  const issues: PerfIssue[] = [];

  // CLS checks
  issues.push(...checkImagesWithoutDimensions(code, framework));
  issues.push(...checkDynamicContentWithoutSpace(code, framework));
  issues.push(...checkFontDisplaySwap(code));
  issues.push(...checkEmbedDimensions(code));

  // LCP checks
  issues.push(...checkHeroImagePriority(code));
  issues.push(...checkLargeBackgroundImages(code));
  issues.push(...checkRenderBlockingCSS(code));
  issues.push(...checkExcessiveCustomProperties(code));

  // FID/INP checks
  issues.push(...checkHeavyBoxShadowOnHover(code));
  issues.push(...checkCSSFilterOnLargeElements(code));
  issues.push(...checkTransformWithoutWillChange(code));
  issues.push(...checkForcedSyncLayout(code));

  // General performance
  issues.push(...checkExcessiveDOMDepth(code));
  issues.push(...checkTooManyUniqueCSSValues(code));
  issues.push(...checkLargeInlineStyles(code));
  issues.push(...checkImportantOveruse(code));

  return issues;
}

// ---------------------------------------------------------------------------
// Tool registration
// ---------------------------------------------------------------------------

export function registerPerfAudit(server: McpServer): void {
  server.tool(
    "perf_audit",
    "Analyze UI code for design choices that hurt performance from a Core Web Vitals perspective (CLS, LCP, FID/INP). Pure regex/heuristic analysis, no browser needed.",
    {
      code: z.string().describe("The UI code to audit (HTML, CSS, React, Vue, or Svelte)"),
      framework: z
        .enum(["react", "vue", "svelte", "html", "auto"])
        .default("auto")
        .describe("Framework hint (auto-detected if not specified)"),
    },
    async ({ code, framework }) => {
      const fw: Framework =
        framework && framework !== "auto" ? (framework as Framework) : detectFramework(code);

      const issues = runPerfAudit(code, fw);
      const score = calculatePerfScore(issues);

      // Group by metric
      const grouped: Record<CWVMetric, PerfIssue[]> = {
        CLS: [],
        LCP: [],
        "FID/INP": [],
        General: [],
      };
      for (const issue of issues) {
        grouped[issue.metric].push(issue);
      }

      const errors = issues.filter((i) => i.severity === "error");
      const warnings = issues.filter((i) => i.severity === "warning");
      const infos = issues.filter((i) => i.severity === "info");

      let summary: string;
      if (score >= 90) {
        summary = "Excellent! Your code follows strong performance best practices.";
      } else if (score >= 70) {
        summary = "Good foundation, but some performance improvements are recommended.";
      } else if (score >= 50) {
        summary = "Several performance issues found. Addressing these will improve Core Web Vitals.";
      } else {
        summary = "Major performance issues detected. These will likely impact real user experience metrics.";
      }

      const lines = [
        `# Performance Audit Report`,
        ``,
        `**Framework detected:** ${fw}`,
        `**Performance Score:** ${score}/100`,
        `**Summary:** ${summary}`,
        ``,
        `**Issues found:** ${errors.length} errors, ${warnings.length} warnings, ${infos.length} suggestions`,
        ``,
      ];

      const metricLabels: Record<CWVMetric, string> = {
        CLS: "CLS (Cumulative Layout Shift)",
        LCP: "LCP (Largest Contentful Paint)",
        "FID/INP": "FID/INP (Interaction to Next Paint)",
        General: "General Performance",
      };

      for (const metric of ["CLS", "LCP", "FID/INP", "General"] as CWVMetric[]) {
        const metricIssues = grouped[metric];
        if (metricIssues.length === 0) continue;

        const metricErrors = metricIssues.filter((i) => i.severity === "error").length;
        const metricWarnings = metricIssues.filter((i) => i.severity === "warning").length;
        const metricInfos = metricIssues.filter((i) => i.severity === "info").length;

        lines.push(`## ${metricLabels[metric]}`);
        lines.push(
          `*${metricErrors} error(s), ${metricWarnings} warning(s), ${metricInfos} suggestion(s)*`
        );
        lines.push(``);

        for (const issue of metricIssues) {
          const icon =
            issue.severity === "error" ? "[ERROR]" : issue.severity === "warning" ? "[WARN]" : "[INFO]";
          lines.push(`- **${icon}** ${issue.description}`);
          lines.push(`  Element: \`${issue.element}\``);
          lines.push(`  Fix: ${issue.suggestion}`);
          lines.push(``);
        }
      }

      if (issues.length === 0) {
        lines.push(`No performance issues detected. Your code looks well-optimized!`);
      }

      return {
        content: [{ type: "text" as const, text: lines.join("\n") }],
      };
    }
  );
}
