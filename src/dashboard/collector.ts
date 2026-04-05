import * as path from "node:path";
import * as fsp from "node:fs/promises";
import { parseCode } from "../parsers/index.js";
import { runDesignRules, calculateScore, type RuleContext } from "../rules/index.js";
import { loadConfig } from "../config/project-config.js";
import { getRangesForAll } from "../data/reference-ranges.js";
import { loadContext } from "../context/project-context.js";
import {
  readJsonSafe,
  detectTechStack,
  extractProjectColors,
  extractSpacingPatterns,
  extractTypography,
  type TechStack,
  type ProjectDesignProfile,
} from "../tools/scan-project.js";
import type { DesignIssue, Category, Severity } from "../rules/types.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FileResult {
  relativePath: string;
  score: number;
  issues: DesignIssue[];
  error?: string;
}

export interface TopIssue {
  message: string;
  category: Category;
  severity: Severity;
  count: number;
  suggestion: string;
}

export interface CategoryScore {
  category: Category;
  avgScore: number;
  issueCount: number;
}

export interface ColorInfo {
  hex: string;
  count: number;
  properties: string[];
}

export interface DashboardData {
  projectPath: string;
  projectName: string;
  techStack: TechStack;
  overallScore: number;
  totalFiles: number;
  totalIssues: number;
  distribution: { excellent: number; good: number; fair: number; poor: number };
  categoryScores: CategoryScore[];
  topIssues: TopIssue[];
  files: FileResult[];
  colors: ColorInfo[];
  typography: { fonts: Record<string, number>; sizes: Record<string, number>; weights: Record<string, number> };
  spacing: { value: string; px: number; count: number; gridAligned: boolean }[];
  reviewHistory: { timestamp: string; score: number; issueCount: number }[];
  scannedAt: string;
}

// ---------------------------------------------------------------------------
// File walking
// ---------------------------------------------------------------------------

const UI_EXTENSIONS = new Set([".tsx", ".jsx", ".vue", ".svelte", ".css", ".scss"]);
const SKIP_DIRS = new Set(["node_modules", ".next", "dist", "build", ".git", ".devsigner", "coverage", "__pycache__"]);
const MAX_FILE_SIZE = 100 * 1024;

async function walkUI(dir: string): Promise<string[]> {
  const results: string[] = [];
  let entries: string[];
  try {
    entries = await fsp.readdir(dir);
  } catch {
    return results;
  }
  for (const name of entries) {
    if (SKIP_DIRS.has(name)) continue;
    const full = path.join(dir, name);
    let stat;
    try {
      stat = await fsp.stat(full);
    } catch {
      continue;
    }
    if (stat.isDirectory()) {
      results.push(...(await walkUI(full)));
    } else if (stat.isFile() && UI_EXTENSIONS.has(path.extname(name).toLowerCase())) {
      if (stat.size <= MAX_FILE_SIZE) results.push(full);
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Core collector
// ---------------------------------------------------------------------------

export async function collectDashboardData(projectPath: string): Promise<DashboardData> {
  const absPath = path.resolve(projectPath);
  const projectName = path.basename(absPath);

  // Parallel: tech stack, config, context, file list, colors, typography, spacing
  const [pkg, config, context, uiFiles] = await Promise.all([
    readJsonSafe(path.join(absPath, "package.json")),
    loadConfig(absPath),
    loadContext(absPath),
    walkUI(absPath),
  ]);

  const techStack = detectTechStack(pkg);

  const [colors, typography, spacing] = await Promise.all([
    extractProjectColors(absPath, new Set<string>()),
    extractTypography(absPath),
    extractSpacingPatterns(absPath),
  ]);

  // Review each file
  const files: FileResult[] = [];
  for (const filePath of uiFiles) {
    const relativePath = path.relative(absPath, filePath).replace(/\\/g, "/");
    try {
      const code = await fsp.readFile(filePath, "utf-8");
      if (code.includes("\0")) {
        files.push({ relativePath, score: -1, issues: [], error: "Binary file" });
        continue;
      }
      const parsed = parseCode(code, "auto");
      if (parsed.declarations.length === 0 && parsed.blocks.length === 0) {
        files.push({ relativePath, score: 100, issues: [] });
        continue;
      }
      // Build reference-aware context
      const ruleContext: RuleContext = { ranges: getRangesForAll() };
      const issues = runDesignRules(parsed.declarations, ["all"], parsed.blocks, config, ruleContext);
      const score = calculateScore(issues);
      files.push({ relativePath, score, issues });
    } catch (err) {
      files.push({ relativePath, score: -1, issues: [], error: String(err) });
    }
  }

  // Aggregate
  const reviewed = files.filter((f) => f.score >= 0);
  const overallScore = reviewed.length > 0
    ? Math.round(reviewed.reduce((s, f) => s + f.score, 0) / reviewed.length)
    : 100;

  const distribution = { excellent: 0, good: 0, fair: 0, poor: 0 };
  for (const f of reviewed) {
    if (f.score >= 90) distribution.excellent++;
    else if (f.score >= 70) distribution.good++;
    else if (f.score >= 50) distribution.fair++;
    else distribution.poor++;
  }

  // Category scores
  const catMap: Record<Category, { total: number; count: number; issues: number }> = {
    spacing: { total: 0, count: 0, issues: 0 },
    color: { total: 0, count: 0, issues: 0 },
    typography: { total: 0, count: 0, issues: 0 },
    layout: { total: 0, count: 0, issues: 0 },
  };
  for (const f of reviewed) {
    for (const cat of ["spacing", "color", "typography", "layout"] as Category[]) {
      const catIssues = f.issues.filter((i) => i.category === cat);
      catMap[cat].total += calculateScore(catIssues);
      catMap[cat].count++;
      catMap[cat].issues += catIssues.length;
    }
  }
  const categoryScores: CategoryScore[] = (["spacing", "color", "typography", "layout"] as Category[]).map((cat) => ({
    category: cat,
    avgScore: catMap[cat].count > 0 ? Math.round(catMap[cat].total / catMap[cat].count) : 100,
    issueCount: catMap[cat].issues,
  }));

  // Top issues
  const issueMap = new Map<string, TopIssue>();
  for (const f of reviewed) {
    for (const issue of f.issues) {
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
  const topIssues = [...issueMap.values()].sort((a, b) => b.count - a.count).slice(0, 10);

  // Color info
  const colorInfos: ColorInfo[] = colors.map((c) => ({
    hex: c.hex,
    count: c.count,
    properties: c.properties,
  }));

  // Review history from context
  const reviewHistory = context.reviewHistory.map((r) => ({
    timestamp: r.timestamp,
    score: r.score,
    issueCount: r.issueCount,
  }));

  return {
    projectPath: absPath,
    projectName,
    techStack,
    overallScore,
    totalFiles: reviewed.length,
    totalIssues: reviewed.reduce((s, f) => s + f.issues.length, 0),
    distribution,
    categoryScores,
    topIssues,
    files: reviewed.sort((a, b) => a.score - b.score),
    colors: colorInfos.sort((a, b) => b.count - a.count),
    typography,
    spacing: spacing.sort((a, b) => b.count - a.count),
    reviewHistory,
    scannedAt: new Date().toISOString(),
  };
}
