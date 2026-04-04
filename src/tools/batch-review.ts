import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as fsp from "node:fs/promises";
import * as path from "node:path";
import { parseCode } from "../parsers/index.js";
import { runDesignRules, calculateScore, type FocusArea } from "../rules/index.js";
import type { DesignIssue, Category } from "../rules/types.js";
import { loadConfig } from "../config/project-config.js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_FILE_SIZE = 100 * 1024; // 100 KB

const DEFAULT_INCLUDE = "**/*.{tsx,jsx,vue,svelte,css,scss}";

const DEFAULT_EXCLUDE = ["node_modules", ".next", "dist", "build", ".git"];

// Binary-looking extensions to skip even if glob matches
const BINARY_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".bmp", ".ico", ".webp", ".avif",
  ".woff", ".woff2", ".ttf", ".eot", ".otf",
  ".mp3", ".mp4", ".wav", ".ogg", ".webm",
  ".zip", ".tar", ".gz", ".br",
  ".pdf", ".doc", ".docx",
  ".exe", ".dll", ".so", ".dylib",
  ".map",
]);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FileResult {
  filePath: string;
  relativePath: string;
  score: number;
  issues: DesignIssue[];
  error?: string;
}

interface ScoreDistribution {
  excellent: number; // 90+
  good: number;      // 70-89
  fair: number;      // 50-69
  poor: number;      // below 50
}

interface TopIssue {
  message: string;
  category: Category;
  severity: DesignIssue["severity"];
  count: number;
  suggestion: string;
}

interface CategoryBreakdown {
  spacing: { total: number; count: number };
  color: { total: number; count: number };
  typography: { total: number; count: number };
  layout: { total: number; count: number };
}

// ---------------------------------------------------------------------------
// Recursive directory walker
// ---------------------------------------------------------------------------

async function walkDirectory(
  dir: string,
  excludeDirs: Set<string>,
): Promise<string[]> {
  const results: string[] = [];

  let entries: string[];
  try {
    entries = await fsp.readdir(dir);
  } catch {
    return results;
  }

  for (const name of entries) {
    if (excludeDirs.has(name)) continue;

    const fullPath = path.join(dir, name);

    let stat;
    try {
      stat = await fsp.stat(fullPath);
    } catch {
      continue;
    }

    if (stat.isDirectory()) {
      const children = await walkDirectory(fullPath, excludeDirs);
      results.push(...children);
    } else if (stat.isFile()) {
      results.push(fullPath);
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Glob matching (simple minimatch-like for brace patterns)
// ---------------------------------------------------------------------------

function matchesGlob(filePath: string, pattern: string): boolean {
  // Expand brace patterns like "**/*.{tsx,jsx}" into individual extensions
  const braceMatch = pattern.match(/\{([^}]+)\}/);
  if (braceMatch) {
    const alternatives = braceMatch[1].split(",");
    const prefix = pattern.slice(0, braceMatch.index!);
    const suffix = pattern.slice(braceMatch.index! + braceMatch[0].length);
    return alternatives.some((alt) => matchesGlob(filePath, prefix + alt + suffix));
  }

  // Convert glob pattern to regex
  const regexStr = pattern
    .replace(/\./g, "\\.")
    .replace(/\*\*/g, "<<GLOBSTAR>>")
    .replace(/\*/g, "[^/\\\\]*")
    .replace(/<<GLOBSTAR>>/g, ".*");

  const regex = new RegExp(`${regexStr}$`, "i");
  return regex.test(filePath.replace(/\\/g, "/"));
}

// ---------------------------------------------------------------------------
// Per-file review
// ---------------------------------------------------------------------------

async function reviewFile(
  filePath: string,
  projectPath: string,
  focus: FocusArea[],
  config?: Awaited<ReturnType<typeof loadConfig>>,
): Promise<FileResult> {
  const relativePath = path.relative(projectPath, filePath).replace(/\\/g, "/");

  try {
    const stat = await fsp.stat(filePath);
    if (stat.size > MAX_FILE_SIZE) {
      return { filePath, relativePath, score: -1, issues: [], error: "Skipped: file too large" };
    }

    if (BINARY_EXTENSIONS.has(path.extname(filePath).toLowerCase())) {
      return { filePath, relativePath, score: -1, issues: [], error: "Skipped: binary file" };
    }

    const code = await fsp.readFile(filePath, "utf-8");

    // Quick binary check: if file has null bytes, skip it
    if (code.includes("\0")) {
      return { filePath, relativePath, score: -1, issues: [], error: "Skipped: binary file" };
    }

    const parsed = parseCode(code, "auto");

    // If no declarations were extracted, there's nothing to review
    if (parsed.declarations.length === 0 && parsed.blocks.length === 0) {
      return { filePath, relativePath, score: 100, issues: [] };
    }

    const issues = runDesignRules(parsed.declarations, focus, parsed.blocks, config);
    const score = calculateScore(issues);

    return { filePath, relativePath, score, issues };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { filePath, relativePath, score: -1, issues: [], error: `Error: ${message}` };
  }
}

// ---------------------------------------------------------------------------
// Aggregate report generation
// ---------------------------------------------------------------------------

function generateReport(
  results: FileResult[],
  topN: number,
  projectPath: string,
): string {
  // Filter to only successfully reviewed files (score >= 0)
  const reviewed = results.filter((r) => r.score >= 0);
  const skipped = results.filter((r) => r.score < 0);

  if (reviewed.length === 0) {
    return [
      "# Batch Design Review Report",
      "",
      `**Project:** \`${projectPath}\``,
      "",
      `No reviewable UI files found. ${skipped.length} file(s) were skipped.`,
    ].join("\n");
  }

  // ── Project Score ──
  const totalScore = reviewed.reduce((sum, r) => sum + r.score, 0);
  const projectScore = Math.round(totalScore / reviewed.length);

  // ── Score Distribution ──
  const dist: ScoreDistribution = { excellent: 0, good: 0, fair: 0, poor: 0 };
  for (const r of reviewed) {
    if (r.score >= 90) dist.excellent++;
    else if (r.score >= 70) dist.good++;
    else if (r.score >= 50) dist.fair++;
    else dist.poor++;
  }

  // ── Top Issues (grouped by message, counted) ──
  const issueMap = new Map<string, TopIssue>();
  for (const r of reviewed) {
    for (const issue of r.issues) {
      const key = `${issue.severity}:${issue.category}:${issue.message}`;
      const existing = issueMap.get(key);
      if (existing) {
        existing.count++;
      } else {
        issueMap.set(key, {
          message: issue.message,
          category: issue.category,
          severity: issue.severity,
          count: 1,
          suggestion: issue.suggestion,
        });
      }
    }
  }

  const topIssues = [...issueMap.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  // ── Worst & Best Files ──
  const sorted = [...reviewed].sort((a, b) => a.score - b.score);
  const worstFiles = sorted.slice(0, topN);
  const bestFiles = sorted.slice(-topN).reverse();

  // ── Category Breakdown ──
  const catBreakdown: CategoryBreakdown = {
    spacing: { total: 0, count: 0 },
    color: { total: 0, count: 0 },
    typography: { total: 0, count: 0 },
    layout: { total: 0, count: 0 },
  };

  for (const r of reviewed) {
    const categories = new Set(r.issues.map((i) => i.category));
    // For each category present in issues, compute a sub-score
    for (const cat of (["spacing", "color", "typography", "layout"] as Category[])) {
      const catIssues = r.issues.filter((i) => i.category === cat);
      const catScore = calculateScore(catIssues);
      catBreakdown[cat].total += catScore;
      catBreakdown[cat].count++;
    }
  }

  // ── Recommendations ──
  const recommendations = deriveRecommendations(topIssues, dist, catBreakdown, reviewed.length);

  // ── Compose Report ──
  const lines: string[] = [];

  lines.push("# Batch Design Review Report");
  lines.push("");
  lines.push(`**Project:** \`${projectPath}\``);
  lines.push(`**Date:** ${new Date().toISOString().slice(0, 10)}`);
  lines.push("");

  // Summary table
  lines.push("## Summary");
  lines.push("");
  lines.push("| Metric | Value |");
  lines.push("|--------|-------|");
  lines.push(`| **Project Score** | **${projectScore}/100** |`);
  lines.push(`| Files Reviewed | ${reviewed.length} |`);
  lines.push(`| Files Skipped | ${skipped.length} |`);
  lines.push(`| Total Issues | ${reviewed.reduce((s, r) => s + r.issues.length, 0)} |`);
  lines.push("");

  // Score distribution
  lines.push("## Score Distribution");
  lines.push("");
  lines.push("| Bucket | Count | Percentage |");
  lines.push("|--------|-------|------------|");
  const pct = (n: number) => `${((n / reviewed.length) * 100).toFixed(1)}%`;
  lines.push(`| Excellent (90-100) | ${dist.excellent} | ${pct(dist.excellent)} |`);
  lines.push(`| Good (70-89) | ${dist.good} | ${pct(dist.good)} |`);
  lines.push(`| Fair (50-69) | ${dist.fair} | ${pct(dist.fair)} |`);
  lines.push(`| Poor (0-49) | ${dist.poor} | ${pct(dist.poor)} |`);
  lines.push("");

  // Category breakdown
  lines.push("## Category Breakdown");
  lines.push("");
  lines.push("| Category | Average Score |");
  lines.push("|----------|---------------|");
  for (const cat of (["spacing", "color", "typography", "layout"] as Category[])) {
    const { total, count } = catBreakdown[cat];
    const avg = count > 0 ? Math.round(total / count) : 100;
    lines.push(`| ${cat.charAt(0).toUpperCase() + cat.slice(1)} | ${avg}/100 |`);
  }
  lines.push("");

  // Top Issues
  if (topIssues.length > 0) {
    lines.push("## Top Issues Across Project");
    lines.push("");
    lines.push("| # | Severity | Category | Issue | Occurrences |");
    lines.push("|---|----------|----------|-------|-------------|");
    for (let i = 0; i < topIssues.length; i++) {
      const t = topIssues[i];
      lines.push(`| ${i + 1} | ${t.severity} | ${t.category} | ${t.message} | ${t.count} |`);
    }
    lines.push("");
  }

  // Worst files
  if (worstFiles.length > 0) {
    lines.push(`## Worst Files (Bottom ${Math.min(topN, worstFiles.length)})`);
    lines.push("");
    for (const f of worstFiles) {
      lines.push(`### \`${f.relativePath}\` — Score: ${f.score}/100`);
      if (f.issues.length > 0) {
        const errors = f.issues.filter((i) => i.severity === "error");
        const warnings = f.issues.filter((i) => i.severity === "warning");
        const infos = f.issues.filter((i) => i.severity === "info");
        lines.push(`- ${errors.length} errors, ${warnings.length} warnings, ${infos.length} suggestions`);
        // Show top 5 issues per file
        const top5 = [...f.issues]
          .sort((a, b) => {
            const order = { error: 0, warning: 1, info: 2 };
            return order[a.severity] - order[b.severity];
          })
          .slice(0, 5);
        for (const issue of top5) {
          lines.push(`- **[${issue.severity}][${issue.category}]** ${issue.message}`);
          lines.push(`  → ${issue.suggestion}`);
        }
      }
      lines.push("");
    }
  }

  // Best files
  if (bestFiles.length > 0) {
    lines.push(`## Best Files (Top ${Math.min(topN, bestFiles.length)})`);
    lines.push("");
    lines.push("| File | Score |");
    lines.push("|------|-------|");
    for (const f of bestFiles) {
      lines.push(`| \`${f.relativePath}\` | ${f.score}/100 |`);
    }
    lines.push("");
  }

  // Recommendations
  if (recommendations.length > 0) {
    lines.push("## Recommendations");
    lines.push("");
    lines.push("Top actions to improve your project score:");
    lines.push("");
    for (let i = 0; i < recommendations.length; i++) {
      lines.push(`${i + 1}. ${recommendations[i]}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Derive top-3 recommendations
// ---------------------------------------------------------------------------

function deriveRecommendations(
  topIssues: TopIssue[],
  dist: ScoreDistribution,
  catBreakdown: CategoryBreakdown,
  fileCount: number,
): string[] {
  const recs: string[] = [];

  // Find the weakest category
  let weakestCat: Category = "spacing";
  let weakestAvg = 100;
  for (const cat of (["spacing", "color", "typography", "layout"] as Category[])) {
    const { total, count } = catBreakdown[cat];
    const avg = count > 0 ? total / count : 100;
    if (avg < weakestAvg) {
      weakestAvg = avg;
      weakestCat = cat;
    }
  }

  if (weakestAvg < 80) {
    recs.push(
      `**Focus on ${weakestCat}** — it is the weakest category with an average score of ${Math.round(weakestAvg)}/100. ` +
      `Addressing ${weakestCat} issues will have the highest overall impact.`,
    );
  }

  // Most common error-severity issue
  const topError = topIssues.find((t) => t.severity === "error");
  if (topError) {
    recs.push(
      `**Fix "${topError.message}"** — this error appears in ${topError.count} file(s). ` +
      `${topError.suggestion}`,
    );
  }

  // Most common warning-severity issue (if different from error)
  const topWarning = topIssues.find((t) => t.severity === "warning");
  if (topWarning && recs.length < 3) {
    recs.push(
      `**Address "${topWarning.message}"** — this warning appears in ${topWarning.count} file(s). ` +
      `${topWarning.suggestion}`,
    );
  }

  // If many poor files, suggest focusing on them
  if (dist.poor > 0 && recs.length < 3) {
    const poorPct = ((dist.poor / fileCount) * 100).toFixed(0);
    recs.push(
      `**Prioritize the ${dist.poor} file(s) scoring below 50** (${poorPct}% of reviewed files). ` +
      `Fixing errors in these files will yield the biggest score improvement.`,
    );
  }

  // Fallback: suggest consistency
  if (recs.length < 3) {
    recs.push(
      `**Establish a design token system** — extract repeated values into CSS custom properties or design tokens ` +
      `to improve consistency across the project.`,
    );
  }

  return recs.slice(0, 3);
}

// ---------------------------------------------------------------------------
// Tool registration
// ---------------------------------------------------------------------------

export function registerBatchReview(server: McpServer): void {
  server.tool(
    "batch_review",
    "Scan a project directory, review all UI files (TSX, JSX, Vue, Svelte, CSS, SCSS), and return a comprehensive project-wide design quality report with scores, issue breakdown, and actionable recommendations.",
    {
      project_path: z.string().describe("Absolute path to the project directory to scan"),
      include: z
        .string()
        .default(DEFAULT_INCLUDE)
        .describe('Glob pattern for files to include (default: "**/*.{tsx,jsx,vue,svelte,css,scss}")'),
      exclude: z
        .array(z.string())
        .default(DEFAULT_EXCLUDE)
        .describe('Directories to skip (default: ["node_modules", ".next", "dist", "build", ".git"])'),
      focus: z
        .array(z.enum(["spacing", "color", "typography", "layout", "all"]))
        .default(["all"])
        .describe("Which design aspects to review"),
      top_n: z
        .number()
        .default(10)
        .describe("How many worst/best files to show in detail (default: 10)"),
    },
    async ({ project_path, include, exclude, focus, top_n }) => {
      try {
        // Verify the project path exists
        const stat = await fsp.stat(project_path).catch(() => null);
        if (!stat || !stat.isDirectory()) {
          return {
            content: [{ type: "text" as const, text: `Error: "${project_path}" is not a valid directory.` }],
            isError: true,
          };
        }

        // Load project config if available
        const config = await loadConfig(project_path);

        // Walk directory and collect matching files
        const excludeSet = new Set(exclude);
        const allFiles = await walkDirectory(project_path, excludeSet);
        const matchingFiles = allFiles.filter((f) => matchesGlob(f, include));

        if (matchingFiles.length === 0) {
          return {
            content: [{
              type: "text" as const,
              text: [
                "# Batch Design Review Report",
                "",
                `**Project:** \`${project_path}\``,
                "",
                `No files matching \`${include}\` were found (excluding: ${exclude.join(", ")}).`,
              ].join("\n"),
            }],
          };
        }

        // Review each file
        const results: FileResult[] = [];
        for (const filePath of matchingFiles) {
          const result = await reviewFile(filePath, project_path, focus as FocusArea[], config);
          results.push(result);
        }

        // Generate the aggregate report
        const report = generateReport(results, top_n, project_path);

        return {
          content: [{ type: "text" as const, text: report }],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: "text" as const, text: `Batch review failed: ${message}` }],
          isError: true,
        };
      }
    },
  );
}
