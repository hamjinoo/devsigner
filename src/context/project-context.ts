import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

export interface DesignIdentityData {
  personality: string;
  signature: string;
  product: string;
  audience: string;
  mood: string;
  boldMoves: string[];
  restraints: string[];
  palette: Record<string, string>;
  typography: Record<string, string>;
  spacing: Record<string, string>;
  corners: Record<string, string>;
  shadows: Record<string, string>;
  heroTreatment: string;
  buttonPersonality: string;
  cardStyle: string;
  motionLevel: string;
}

export interface ReviewEntry {
  timestamp: string;
  file?: string;
  score: number;
  issueCount: number;
  topIssues: string[];
  fixesApplied: string[];
}

export interface DesignDecision {
  timestamp: string;
  decision: string;
  reason: string;
  context: string;
}

export interface ProjectDesignContext {
  version: number;
  createdAt: string;
  updatedAt: string;
  identity: DesignIdentityData | null;
  reviewHistory: ReviewEntry[];
  decisions: DesignDecision[];
  learnedPatterns: string[];
  rejectedSuggestions: string[];
}

const EMPTY_CONTEXT: ProjectDesignContext = {
  version: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  identity: null,
  reviewHistory: [],
  decisions: [],
  learnedPatterns: [],
  rejectedSuggestions: [],
};

function getContextDir(projectPath: string): string {
  return join(projectPath, ".devsigner");
}

function getContextFile(projectPath: string): string {
  return join(getContextDir(projectPath), "context.json");
}

export async function loadContext(projectPath: string): Promise<ProjectDesignContext> {
  try {
    const raw = await readFile(getContextFile(projectPath), "utf-8");
    return JSON.parse(raw) as ProjectDesignContext;
  } catch {
    return { ...EMPTY_CONTEXT, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  }
}

export async function saveContext(projectPath: string, context: ProjectDesignContext): Promise<void> {
  const dir = getContextDir(projectPath);
  await mkdir(dir, { recursive: true });
  context.updatedAt = new Date().toISOString();
  await writeFile(getContextFile(projectPath), JSON.stringify(context, null, 2), "utf-8");
}

export async function saveIdentity(projectPath: string, identity: DesignIdentityData): Promise<void> {
  const ctx = await loadContext(projectPath);
  ctx.identity = identity;
  ctx.decisions.push({
    timestamp: new Date().toISOString(),
    decision: `Design identity set to "${identity.personality}"`,
    reason: `Product: ${identity.product}, Mood: ${identity.mood}`,
    context: "design_identity tool",
  });
  await saveContext(projectPath, ctx);
}

export async function addReview(projectPath: string, entry: ReviewEntry): Promise<void> {
  const ctx = await loadContext(projectPath);
  ctx.reviewHistory.push(entry);
  // Keep last 50 reviews
  if (ctx.reviewHistory.length > 50) {
    ctx.reviewHistory = ctx.reviewHistory.slice(-50);
  }
  await saveContext(projectPath, ctx);
}

export async function addDecision(projectPath: string, decision: string, reason: string, tool: string): Promise<void> {
  const ctx = await loadContext(projectPath);
  ctx.decisions.push({
    timestamp: new Date().toISOString(),
    decision,
    reason,
    context: tool,
  });
  await saveContext(projectPath, ctx);
}

export async function addLearnedPattern(projectPath: string, pattern: string): Promise<void> {
  const ctx = await loadContext(projectPath);
  if (!ctx.learnedPatterns.includes(pattern)) {
    ctx.learnedPatterns.push(pattern);
    await saveContext(projectPath, ctx);
  }
}

export async function addRejection(projectPath: string, suggestion: string): Promise<void> {
  const ctx = await loadContext(projectPath);
  if (!ctx.rejectedSuggestions.includes(suggestion)) {
    ctx.rejectedSuggestions.push(suggestion);
    await saveContext(projectPath, ctx);
  }
}

export function formatContextSummary(ctx: ProjectDesignContext): string {
  const lines: string[] = [];

  if (ctx.identity) {
    lines.push(`## Active Design Identity: ${ctx.identity.personality}`);
    lines.push(`> ${ctx.identity.signature}`);
    lines.push(`Product: ${ctx.identity.product} | Audience: ${ctx.identity.audience}`);
    lines.push(``);
  }

  if (ctx.reviewHistory.length > 0) {
    const recent = ctx.reviewHistory.slice(-5);
    const avgScore = Math.round(recent.reduce((s, r) => s + r.score, 0) / recent.length);
    const trend = recent.length >= 2
      ? recent[recent.length - 1].score > recent[recent.length - 2].score
        ? "improving"
        : recent[recent.length - 1].score < recent[recent.length - 2].score
          ? "declining"
          : "stable"
      : "not enough data";

    lines.push(`## Review History`);
    lines.push(`Reviews: ${ctx.reviewHistory.length} total | Recent avg score: ${avgScore}/100 | Trend: ${trend}`);

    // Most common issues
    const allIssues = recent.flatMap((r) => r.topIssues);
    const issueCounts = new Map<string, number>();
    for (const issue of allIssues) {
      issueCounts.set(issue, (issueCounts.get(issue) || 0) + 1);
    }
    const recurring = [...issueCounts.entries()]
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1]);

    if (recurring.length > 0) {
      lines.push(`\nRecurring issues (keep appearing):`);
      for (const [issue, count] of recurring) {
        lines.push(`- ${issue} (${count}x)`);
      }
    }
    lines.push(``);
  }

  if (ctx.decisions.length > 0) {
    lines.push(`## Recent Decisions`);
    const recent = ctx.decisions.slice(-5);
    for (const d of recent) {
      lines.push(`- **${d.decision}** — ${d.reason} (via ${d.context})`);
    }
    lines.push(``);
  }

  if (ctx.learnedPatterns.length > 0) {
    lines.push(`## Learned Patterns (what works for this project)`);
    for (const p of ctx.learnedPatterns) {
      lines.push(`- ${p}`);
    }
    lines.push(``);
  }

  if (ctx.rejectedSuggestions.length > 0) {
    lines.push(`## Rejected Suggestions (don't suggest these again)`);
    for (const r of ctx.rejectedSuggestions) {
      lines.push(`- ~~${r}~~`);
    }
  }

  return lines.join("\n");
}

// Generate CSS variables from stored identity
export function identityToCSS(identity: DesignIdentityData): string {
  const lines = [":root {"];
  for (const [key, value] of Object.entries(identity.palette)) {
    lines.push(`  --color-${key.replace(/_/g, "-")}: ${value};`);
  }
  for (const [key, value] of Object.entries(identity.typography)) {
    const cssKey = key.replace(/_/g, "-");
    lines.push(`  --${cssKey}: ${value};`);
  }
  for (const [key, value] of Object.entries(identity.spacing)) {
    lines.push(`  --space-${key.replace(/_/g, "-")}: ${value};`);
  }
  for (const [key, value] of Object.entries(identity.corners)) {
    lines.push(`  --radius-${key}: ${value};`);
  }
  for (const [key, value] of Object.entries(identity.shadows)) {
    lines.push(`  --shadow-${key}: ${value};`);
  }
  lines.push("}");
  return lines.join("\n");
}
