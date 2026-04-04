import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as fsp from "node:fs/promises";
import * as path from "node:path";

// --- Core modules ---
import { parseCode } from "../parsers/index.js";
import { runDesignRules, calculateScore, type FocusArea } from "../rules/index.js";
import type { DesignIssue, Category } from "../rules/types.js";
import { loadConfig } from "../config/project-config.js";

// --- Context ---
import {
  loadContext,
  saveContext,
  addReview,
  type ProjectDesignContext,
  type DesignIdentityData,
  type ReviewEntry,
} from "../context/project-context.js";

// --- Scan project internals ---
import {
  readJsonSafe,
  detectTechStack,
  collectFiles,
  parseTailwindConfig,
  discoverDesignTokens,
  extractProjectColors,
  extractSpacingPatterns,
  extractTypography,
  generateInsights,
  type TechStack,
  type ProjectDesignProfile,
} from "./scan-project.js";

// --- Design identity ---
import {
  matchPersonality,
  generateIdentityPalette,
  getTypographySystem,
  getSpacingSystem,
  getCornerRadius,
  getShadowSystem,
  moodToHue,
} from "./design-identity.js";

// --- Design fix ---
import { applyFixes, type FixResult } from "./design-fix.js";

// --- Style guide ---
import { identityDataToResolved, generateHtml } from "./generate-style-guide.js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_FILE_SIZE = 100 * 1024; // 100 KB

const UI_FILE_GLOB = "**/*.{tsx,jsx,vue,svelte,css,scss}";

const EXCLUDE_DIRS = new Set([
  "node_modules", ".next", "dist", "build", ".git",
]);

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

interface FileReviewResult {
  filePath: string;
  relativePath: string;
  score: number;
  issues: DesignIssue[];
  error?: string;
}

interface AutoFixResult {
  filePath: string;
  relativePath: string;
  scoreBefore: number;
  scoreAfter: number;
  fixCount: number;
  fixes: FixResult[];
}

interface CategoryBreakdown {
  spacing: { total: number; count: number };
  color: { total: number; count: number };
  typography: { total: number; count: number };
  layout: { total: number; count: number };
}

interface TopIssue {
  message: string;
  category: Category;
  severity: DesignIssue["severity"];
  count: number;
  suggestion: string;
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
// Glob matching (same as batch-review.ts)
// ---------------------------------------------------------------------------

function matchesGlob(filePath: string, pattern: string): boolean {
  const braceMatch = pattern.match(/\{([^}]+)\}/);
  if (braceMatch) {
    const alternatives = braceMatch[1].split(",");
    const prefix = pattern.slice(0, braceMatch.index!);
    const suffix = pattern.slice(braceMatch.index! + braceMatch[0].length);
    return alternatives.some((alt) => matchesGlob(filePath, prefix + alt + suffix));
  }

  const regexStr = pattern
    .replace(/\./g, "\\.")
    .replace(/\*\*/g, "<<GLOBSTAR>>")
    .replace(/\*/g, "[^/\\\\]*")
    .replace(/<<GLOBSTAR>>/g, ".*");

  const regex = new RegExp(`${regexStr}$`, "i");
  return regex.test(filePath.replace(/\\/g, "/"));
}

// ---------------------------------------------------------------------------
// Step 1: Scan Project
// ---------------------------------------------------------------------------

async function scanProject(projectPath: string): Promise<{
  profile: ProjectDesignProfile;
  techStack: TechStack;
}> {
  const pkg = await readJsonSafe(path.join(projectPath, "package.json"));

  const [techStack, { raw: tailwindConfig, configColors }, designTokens, colors, spacing, typography] =
    await Promise.all([
      Promise.resolve(detectTechStack(pkg)),
      parseTailwindConfig(projectPath),
      discoverDesignTokens(projectPath),
      extractProjectColors(projectPath, new Set()),
      extractSpacingPatterns(projectPath),
      extractTypography(projectPath),
    ]);

  // Mark which colors are in the tailwind config
  for (const c of colors) {
    c.inConfig = configColors.has(c.hex);
  }

  const allFiles = await collectFiles(projectPath, [
    "**/*.css", "**/*.scss", "**/*.less",
    "**/*.tsx", "**/*.jsx", "**/*.vue", "**/*.svelte",
    "**/*.ts", "**/*.js",
  ]);

  const profileWithoutInsights = {
    techStack,
    designTokens,
    tailwindConfig,
    colors,
    spacing,
    typography,
    filesScanned: allFiles.length,
  };

  const insights = generateInsights(profileWithoutInsights);

  const profile: ProjectDesignProfile = {
    ...profileWithoutInsights,
    insights,
  };

  return { profile, techStack };
}

// ---------------------------------------------------------------------------
// Step 2: Generate/Load Identity
// ---------------------------------------------------------------------------

async function resolveIdentity(
  projectPath: string,
  context: ProjectDesignContext,
  productDescription?: string,
  audience?: string,
  mood?: string,
): Promise<{ identity: DesignIdentityData | null; isNew: boolean }> {
  // If identity already exists in context, use it
  if (context.identity) {
    return { identity: context.identity, isNew: false };
  }

  // If product_description is provided, generate a new identity
  if (productDescription) {
    const effectiveAudience = audience || "general users";
    const effectiveMood = mood || "professional";

    const personality = matchPersonality(
      `${productDescription} ${effectiveAudience}`,
      "",
      effectiveMood,
    );

    const baseHue = moodToHue(effectiveMood);
    const palette = generateIdentityPalette(personality, baseHue);
    const typography = getTypographySystem(personality.typographyVoice);
    const spacing = getSpacingSystem(personality.contentDensity);
    const corners = getCornerRadius(personality.cornerStyle);
    const shadows = getShadowSystem(personality.shadowStyle);

    const identity: DesignIdentityData = {
      personality: personality.name,
      signature: personality.signature,
      product: productDescription,
      audience: effectiveAudience,
      mood: effectiveMood,
      boldMoves: personality.boldMoves,
      restraints: personality.restraints,
      palette,
      typography,
      spacing,
      corners,
      shadows,
      heroTreatment: personality.heroTreatment,
      buttonPersonality: personality.buttonPersonality,
      cardStyle: personality.cardStyle,
      motionLevel: personality.motionLevel,
    };

    return { identity, isNew: true };
  }

  return { identity: null, isNew: false };
}

// ---------------------------------------------------------------------------
// Step 3: Batch Review
// ---------------------------------------------------------------------------

async function reviewFile(
  filePath: string,
  projectPath: string,
  config?: Awaited<ReturnType<typeof loadConfig>>,
): Promise<FileReviewResult> {
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

    if (code.includes("\0")) {
      return { filePath, relativePath, score: -1, issues: [], error: "Skipped: binary file" };
    }

    const parsed = parseCode(code, "auto");

    if (parsed.declarations.length === 0 && parsed.blocks.length === 0) {
      return { filePath, relativePath, score: 100, issues: [] };
    }

    const focus: FocusArea[] = ["all"];
    const issues = runDesignRules(parsed.declarations, focus, parsed.blocks, config);
    const score = calculateScore(issues);

    return { filePath, relativePath, score, issues };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { filePath, relativePath, score: -1, issues: [], error: `Error: ${message}` };
  }
}

async function batchReview(
  projectPath: string,
  config?: Awaited<ReturnType<typeof loadConfig>>,
): Promise<FileReviewResult[]> {
  const allFiles = await walkDirectory(projectPath, EXCLUDE_DIRS);
  const matchingFiles = allFiles.filter((f) => matchesGlob(f, UI_FILE_GLOB));

  const results: FileReviewResult[] = [];
  for (const filePath of matchingFiles) {
    const result = await reviewFile(filePath, projectPath, config);
    results.push(result);
  }

  return results;
}

// ---------------------------------------------------------------------------
// Step 5: Auto Fix
// ---------------------------------------------------------------------------

async function autoFixFiles(
  results: FileReviewResult[],
  projectPath: string,
): Promise<AutoFixResult[]> {
  const fixResults: AutoFixResult[] = [];

  // Only fix files scoring below 70
  const filesToFix = results.filter((r) => r.score >= 0 && r.score < 70);

  for (const fileResult of filesToFix) {
    try {
      const code = await fsp.readFile(fileResult.filePath, "utf-8");
      const { fixedCode, fixes } = applyFixes(code, "moderate");

      if (fixes.length === 0) continue;

      // Calculate score after fix
      const parsedAfter = parseCode(fixedCode, "auto");
      const issuesAfter = runDesignRules(
        parsedAfter.declarations,
        ["all"] as FocusArea[],
        parsedAfter.blocks,
      );
      const scoreAfter = calculateScore(issuesAfter);

      // Write back to file
      await fsp.writeFile(fileResult.filePath, fixedCode, "utf-8");

      fixResults.push({
        filePath: fileResult.filePath,
        relativePath: fileResult.relativePath,
        scoreBefore: fileResult.score,
        scoreAfter,
        fixCount: fixes.length,
        fixes,
      });
    } catch {
      // Skip files that can't be fixed
    }
  }

  return fixResults;
}

// ---------------------------------------------------------------------------
// Step 6: Style Guide Generation
// ---------------------------------------------------------------------------

async function generateStyleGuide(
  projectPath: string,
  identity: DesignIdentityData,
): Promise<string> {
  const resolved = identityDataToResolved(identity);
  const html = generateHtml(resolved);
  const outputPath = path.join(projectPath, ".devsigner", "style-guide.html");

  await fsp.mkdir(path.dirname(outputPath), { recursive: true });
  await fsp.writeFile(outputPath, html, "utf-8");

  return outputPath;
}

// ---------------------------------------------------------------------------
// Report Generation
// ---------------------------------------------------------------------------

function generateWizardReport(opts: {
  projectPath: string;
  profile: ProjectDesignProfile;
  techStack: TechStack;
  identity: DesignIdentityData | null;
  identityIsNew: boolean;
  results: FileReviewResult[];
  autoFixResults: AutoFixResult[] | null;
  styleGuidePath: string | null;
}): string {
  const { projectPath, profile, techStack, identity, identityIsNew, results, autoFixResults, styleGuidePath } = opts;

  const reviewed = results.filter((r) => r.score >= 0);
  const skipped = results.filter((r) => r.score < 0);

  const lines: string[] = [];

  // ── Header ──
  lines.push("# Design Wizard Report");
  lines.push("");
  lines.push(`**Project:** \`${projectPath}\``);
  lines.push(`**Date:** ${new Date().toISOString().slice(0, 10)}`);
  lines.push(`**Files Scanned:** ${profile.filesScanned} | **UI Files Reviewed:** ${reviewed.length} | **Skipped:** ${skipped.length}`);
  lines.push("");
  lines.push("---");
  lines.push("");

  // ── Step 1: Project Overview ──
  lines.push("## 1. Project Overview");
  lines.push("");
  lines.push("| Aspect | Detected |");
  lines.push("|--------|----------|");
  lines.push(`| Framework | ${techStack.framework ?? "None detected"} |`);
  lines.push(`| CSS Framework | ${techStack.cssFramework ?? "Plain CSS"} |`);
  lines.push(`| Component Library | ${techStack.componentLibrary ?? "None detected"} |`);
  lines.push(`| Language | ${techStack.language} |`);
  lines.push(`| Build Tool | ${techStack.buildTool ?? "Unknown"} |`);
  lines.push(`| Design Tokens | ${profile.designTokens.length} found |`);
  lines.push(`| Distinct Colors | ${profile.colors.length} |`);
  lines.push(`| Spacing Values | ${profile.spacing.length} |`);
  lines.push("");

  if (profile.insights.length > 0) {
    lines.push("**Project Insights:**");
    for (const insight of profile.insights) {
      lines.push(`- ${insight}`);
    }
    lines.push("");
  }

  // ── Step 2: Design Identity ──
  lines.push("---");
  lines.push("");
  lines.push("## 2. Design Identity");
  lines.push("");

  if (identity) {
    const tag = identityIsNew ? " (Newly Generated)" : " (Loaded from .devsigner/context.json)";
    lines.push(`**Personality:** ${identity.personality}${tag}`);
    lines.push(`> *"${identity.signature}"*`);
    lines.push("");
    lines.push(`**Product:** ${identity.product}`);
    lines.push(`**Audience:** ${identity.audience}`);
    lines.push(`**Mood:** ${identity.mood}`);
    lines.push("");
    lines.push("**Bold Moves:**");
    for (const m of identity.boldMoves) {
      lines.push(`- ${m}`);
    }
    lines.push("");
    lines.push("**Restraints:**");
    for (const r of identity.restraints) {
      lines.push(`- ${r}`);
    }
    lines.push("");
    lines.push("**Key Colors:**");
    lines.push(`| Role | Value |`);
    lines.push(`|------|-------|`);
    const colorKeys = ["primary", "accent", "background_light", "background_dark", "text_primary", "border"];
    for (const key of colorKeys) {
      if (identity.palette[key]) {
        const label = key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        lines.push(`| ${label} | \`${identity.palette[key]}\` |`);
      }
    }
    lines.push("");
  } else {
    lines.push("*No design identity found or generated. Pass `product_description` to create one.*");
    lines.push("");
  }

  // ── Step 3: Overall Design Score ──
  lines.push("---");
  lines.push("");
  lines.push("## 3. Design Quality Score");
  lines.push("");

  if (reviewed.length === 0) {
    lines.push("No reviewable UI files found.");
    lines.push("");
  } else {
    const totalScore = reviewed.reduce((sum, r) => sum + r.score, 0);
    const projectScore = Math.round(totalScore / reviewed.length);

    // Score emoji/grade
    const grade = projectScore >= 90 ? "A" : projectScore >= 80 ? "B" : projectScore >= 70 ? "C" : projectScore >= 50 ? "D" : "F";

    lines.push(`### Overall Score: **${projectScore}/100** (Grade: ${grade})`);
    lines.push("");

    // Score distribution
    let excellent = 0, good = 0, fair = 0, poor = 0;
    for (const r of reviewed) {
      if (r.score >= 90) excellent++;
      else if (r.score >= 70) good++;
      else if (r.score >= 50) fair++;
      else poor++;
    }

    lines.push("| Bucket | Count | Percentage |");
    lines.push("|--------|-------|------------|");
    const pct = (n: number) => `${((n / reviewed.length) * 100).toFixed(1)}%`;
    lines.push(`| Excellent (90-100) | ${excellent} | ${pct(excellent)} |`);
    lines.push(`| Good (70-89) | ${good} | ${pct(good)} |`);
    lines.push(`| Fair (50-69) | ${fair} | ${pct(fair)} |`);
    lines.push(`| Poor (0-49) | ${poor} | ${pct(poor)} |`);
    lines.push("");

    // ── Category Breakdown ──
    const catBreakdown: CategoryBreakdown = {
      spacing: { total: 0, count: 0 },
      color: { total: 0, count: 0 },
      typography: { total: 0, count: 0 },
      layout: { total: 0, count: 0 },
    };

    for (const r of reviewed) {
      for (const cat of (["spacing", "color", "typography", "layout"] as Category[])) {
        const catIssues = r.issues.filter((i) => i.category === cat);
        const catScore = calculateScore(catIssues);
        catBreakdown[cat].total += catScore;
        catBreakdown[cat].count++;
      }
    }

    lines.push("### Category Breakdown");
    lines.push("");
    lines.push("| Category | Average Score | Status |");
    lines.push("|----------|---------------|--------|");
    for (const cat of (["spacing", "color", "typography", "layout"] as Category[])) {
      const { total, count } = catBreakdown[cat];
      const avg = count > 0 ? Math.round(total / count) : 100;
      const status = avg >= 90 ? "Excellent" : avg >= 70 ? "Good" : avg >= 50 ? "Needs Work" : "Critical";
      lines.push(`| ${cat.charAt(0).toUpperCase() + cat.slice(1)} | ${avg}/100 | ${status} |`);
    }
    lines.push("");

    // ── Top 5 Critical Issues ──
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
      .sort((a, b) => {
        const severityOrder = { error: 0, warning: 1, info: 2 };
        if (severityOrder[a.severity] !== severityOrder[b.severity]) {
          return severityOrder[a.severity] - severityOrder[b.severity];
        }
        return b.count - a.count;
      })
      .slice(0, 5);

    if (topIssues.length > 0) {
      lines.push("---");
      lines.push("");
      lines.push("## 4. Top 5 Critical Issues to Fix");
      lines.push("");

      for (let i = 0; i < topIssues.length; i++) {
        const t = topIssues[i];
        lines.push(`### ${i + 1}. [${t.severity.toUpperCase()}] ${t.message}`);
        lines.push(`**Category:** ${t.category} | **Affected files:** ${t.count}`);
        lines.push(`**Fix:** ${t.suggestion}`);
        lines.push("");
      }
    }

    // ── File-by-File Scores (worst to best) ──
    const sorted = [...reviewed].sort((a, b) => a.score - b.score);

    lines.push("---");
    lines.push("");
    lines.push("## 5. File-by-File Scores (Worst to Best)");
    lines.push("");
    lines.push("| # | File | Score | Issues |");
    lines.push("|---|------|-------|--------|");
    for (let i = 0; i < sorted.length; i++) {
      const r = sorted[i];
      const errors = r.issues.filter((i) => i.severity === "error").length;
      const warnings = r.issues.filter((i) => i.severity === "warning").length;
      const infos = r.issues.filter((i) => i.severity === "info").length;
      const issueStr = errors || warnings || infos
        ? `${errors}E ${warnings}W ${infos}I`
        : "Clean";
      lines.push(`| ${i + 1} | \`${r.relativePath}\` | ${r.score}/100 | ${issueStr} |`);
    }
    lines.push("");

    // ── Detailed worst files ──
    const worstFiles = sorted.filter((r) => r.score < 70).slice(0, 5);
    if (worstFiles.length > 0) {
      lines.push("### Files Needing Immediate Attention");
      lines.push("");
      for (const f of worstFiles) {
        lines.push(`#### \`${f.relativePath}\` -- Score: ${f.score}/100`);
        const topFileIssues = [...f.issues]
          .sort((a, b) => {
            const order = { error: 0, warning: 1, info: 2 };
            return order[a.severity] - order[b.severity];
          })
          .slice(0, 5);
        for (const issue of topFileIssues) {
          lines.push(`- **[${issue.severity}]** [${issue.category}] ${issue.message}`);
          lines.push(`  Fix: ${issue.suggestion}`);
        }
        lines.push("");
      }
    }

    // ── Recommendations ──
    lines.push("---");
    lines.push("");
    lines.push("## 6. Recommendations");
    lines.push("");

    // Find weakest category
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

    const recs: string[] = [];

    if (weakestAvg < 80) {
      recs.push(
        `**Focus on ${weakestCat}** -- it is the weakest category at ${Math.round(weakestAvg)}/100. Fixing ${weakestCat} issues across the project will have the highest overall impact.`,
      );
    }

    const topError = topIssues.find((t) => t.severity === "error");
    if (topError) {
      recs.push(
        `**Fix "${topError.message}"** -- this error appears in ${topError.count} file(s). ${topError.suggestion}`,
      );
    }

    const topWarning = topIssues.find((t) => t.severity === "warning");
    if (topWarning && recs.length < 5) {
      recs.push(
        `**Address "${topWarning.message}"** -- this warning appears in ${topWarning.count} file(s). ${topWarning.suggestion}`,
      );
    }

    if (poor > 0) {
      recs.push(
        `**Prioritize the ${poor} file(s) scoring below 50** (${((poor / reviewed.length) * 100).toFixed(0)}% of reviewed files) for the biggest score improvement.`,
      );
    }

    if (!identity) {
      recs.push(
        `**Generate a design identity** -- run design_wizard with \`product_description\` to get a cohesive personality, color palette, typography system, and spacing scale for your project.`,
      );
    }

    if (profile.designTokens.length === 0) {
      recs.push(
        `**Establish a design token system** -- extract repeated values into CSS custom properties or design tokens to improve consistency across the project.`,
      );
    }

    for (let i = 0; i < Math.min(recs.length, 5); i++) {
      lines.push(`${i + 1}. ${recs[i]}`);
    }
    lines.push("");
  }

  // ── Step 5: Auto Fix Results ──
  if (autoFixResults && autoFixResults.length > 0) {
    lines.push("---");
    lines.push("");
    lines.push("## Auto-Fix Results");
    lines.push("");
    lines.push(`**${autoFixResults.length} file(s) were automatically fixed.**`);
    lines.push("");
    lines.push("| File | Before | After | Fixes |");
    lines.push("|------|--------|-------|-------|");
    for (const fix of autoFixResults) {
      const delta = fix.scoreAfter - fix.scoreBefore;
      const arrow = delta > 0 ? "+" : "";
      lines.push(`| \`${fix.relativePath}\` | ${fix.scoreBefore}/100 | ${fix.scoreAfter}/100 (${arrow}${delta}) | ${fix.fixCount} |`);
    }
    lines.push("");

    // Show details for top 3 most-fixed files
    const topFixed = [...autoFixResults].sort((a, b) => b.fixCount - a.fixCount).slice(0, 3);
    for (const fix of topFixed) {
      lines.push(`### \`${fix.relativePath}\` (${fix.fixCount} fixes)`);
      const grouped: Record<string, FixResult[]> = {};
      for (const f of fix.fixes) {
        if (!grouped[f.category]) grouped[f.category] = [];
        grouped[f.category].push(f);
      }
      for (const [category, fixes] of Object.entries(grouped)) {
        lines.push(`**${category.charAt(0).toUpperCase() + category.slice(1)}:**`);
        for (const f of fixes.slice(0, 5)) {
          lines.push(`- ${f.description}: \`${f.before}\` -> \`${f.after}\``);
        }
        if (fixes.length > 5) {
          lines.push(`- ...and ${fixes.length - 5} more ${category} fixes`);
        }
      }
      lines.push("");
    }
  } else if (autoFixResults !== null) {
    lines.push("---");
    lines.push("");
    lines.push("## Auto-Fix Results");
    lines.push("");
    lines.push("No files required automatic fixes (all files scoring >= 70 or no fixable issues found).");
    lines.push("");
  }

  // ── Step 6: Style Guide ──
  if (styleGuidePath) {
    lines.push("---");
    lines.push("");
    lines.push("## Style Guide");
    lines.push("");
    lines.push(`A visual style guide has been generated and saved to:`);
    lines.push(`\`${styleGuidePath}\``);
    lines.push("");
    lines.push("Open this file in a browser to see the complete visual reference including color swatches, typography scale, spacing, border radius, shadows, button styles, card examples, and design guidelines.");
    lines.push("");
  }

  // ── Session Info ──
  lines.push("---");
  lines.push("");
  lines.push("## Session");
  lines.push("");
  lines.push(`Results saved to \`${path.join(projectPath, ".devsigner", "context.json")}\``);
  lines.push("");
  lines.push("*Run `design_wizard` again to track progress over time. Previous results are stored in the review history.*");

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Tool Registration
// ---------------------------------------------------------------------------

export function registerDesignWizard(server: McpServer): void {
  server.tool(
    "design_wizard",
    "Run a complete design improvement pipeline on a project — scan tech stack, generate or load design identity, review all UI files, produce a comprehensive report with scores and recommendations, optionally auto-fix issues and generate a visual style guide. This is the one-command-does-everything design consultation tool.",
    {
      project_path: z
        .string()
        .describe("Absolute path to the project directory to analyze and improve"),
      product_description: z
        .string()
        .optional()
        .describe("What the product is, used for identity generation (e.g., 'fintech dashboard for small businesses')"),
      audience: z
        .string()
        .optional()
        .describe("Who uses the product (e.g., '20-30s startup founders, tech-savvy')"),
      mood: z
        .string()
        .optional()
        .describe("Desired feeling of the design (e.g., 'trustworthy but not boring, modern, warm')"),
      auto_fix: z
        .boolean()
        .default(false)
        .describe("Whether to automatically fix design issues in files scoring below 70 (writes changes to disk)"),
      generate_guide: z
        .boolean()
        .default(true)
        .describe("Whether to generate a visual HTML style guide in .devsigner/style-guide.html"),
    },
    async ({ project_path, product_description, audience, mood, auto_fix, generate_guide }) => {
      try {
        // Validate path
        const stat = await fsp.stat(project_path).catch(() => null);
        if (!stat || !stat.isDirectory()) {
          return {
            content: [{ type: "text" as const, text: `Error: "${project_path}" is not a valid directory.` }],
            isError: true,
          };
        }

        // ── Step 1: Scan Project ──
        const { profile, techStack } = await scanProject(project_path);

        // ── Step 2: Generate/Load Identity ──
        const context = await loadContext(project_path);
        const { identity, isNew: identityIsNew } = await resolveIdentity(
          project_path,
          context,
          product_description,
          audience,
          mood,
        );

        // Save identity if newly generated
        if (identity && identityIsNew) {
          context.identity = identity;
          context.decisions.push({
            timestamp: new Date().toISOString(),
            decision: `Design identity set to "${identity.personality}"`,
            reason: `Product: ${identity.product}, Mood: ${identity.mood}`,
            context: "design_wizard",
          });
          await saveContext(project_path, context);
        }

        // ── Step 3: Batch Review ──
        const config = await loadConfig(project_path);
        const results = await batchReview(project_path, config);

        // ── Step 4: Auto Fix (optional) ──
        let autoFixResults: AutoFixResult[] | null = null;
        if (auto_fix) {
          autoFixResults = await autoFixFiles(results, project_path);
        }

        // ── Step 5: Style Guide (optional) ──
        let styleGuidePath: string | null = null;
        if (generate_guide && identity) {
          try {
            styleGuidePath = await generateStyleGuide(project_path, identity);
          } catch {
            // Non-fatal: report generation failure in the output
            styleGuidePath = null;
          }
        }

        // ── Step 6: Save Session ──
        const reviewed = results.filter((r) => r.score >= 0);
        if (reviewed.length > 0) {
          const totalScore = reviewed.reduce((sum, r) => sum + r.score, 0);
          const avgScore = Math.round(totalScore / reviewed.length);
          const allIssues = reviewed.flatMap((r) => r.issues);

          // Collect top issues
          const issueCountMap = new Map<string, number>();
          for (const issue of allIssues) {
            const key = issue.message;
            issueCountMap.set(key, (issueCountMap.get(key) || 0) + 1);
          }
          const topIssueMessages = [...issueCountMap.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([msg]) => msg);

          const fixesApplied = autoFixResults
            ? autoFixResults.flatMap((f) => f.fixes.map((fix) => `${f.relativePath}: ${fix.description}`)).slice(0, 10)
            : [];

          const reviewEntry: ReviewEntry = {
            timestamp: new Date().toISOString(),
            file: "(project-wide wizard review)",
            score: avgScore,
            issueCount: allIssues.length,
            topIssues: topIssueMessages,
            fixesApplied,
          };

          await addReview(project_path, reviewEntry);
        }

        // ── Generate Report ──
        const report = generateWizardReport({
          projectPath: project_path,
          profile,
          techStack,
          identity,
          identityIsNew,
          results,
          autoFixResults,
          styleGuidePath,
        });

        return {
          content: [{ type: "text" as const, text: report }],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: "text" as const, text: `Design wizard failed: ${message}` }],
          isError: true,
        };
      }
    },
  );
}
