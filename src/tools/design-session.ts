import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  loadContext,
  saveIdentity,
  addReview,
  addDecision,
  addLearnedPattern,
  addRejection,
  formatContextSummary,
  identityToCSS,
  type DesignIdentityData,
  type ReviewEntry,
} from "../context/project-context.js";

export function registerDesignSession(server: McpServer): void {
  // --- Tool 1: Initialize / Load Session ---
  server.tool(
    "design_session",
    "Start or resume a design session for a project. Returns the full design context: active identity, review history, score trends, recurring issues, learned patterns, and rejected suggestions. Call this at the start of any design conversation to get the full picture.",
    {
      project_path: z.string().describe("Absolute path to the project directory"),
    },
    async ({ project_path }) => {
      const ctx = await loadContext(project_path);

      if (!ctx.identity && ctx.reviewHistory.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: [
                "# New Design Session",
                "",
                `Project: \`${project_path}\``,
                "",
                "No design context found yet. This is a fresh project.",
                "",
                "**Recommended first steps:**",
                "1. Run `design_identity` to create a design personality for this product",
                "2. Run `scan_project` to analyze the existing codebase",
                "3. Then start reviewing and iterating on components",
                "",
                "The `.devsigner/context.json` file will track all design decisions,",
                "review scores, patterns, and preferences across sessions.",
              ].join("\n"),
            },
          ],
        };
      }

      const summary = formatContextSummary(ctx);

      const lines = [
        "# Design Session Resumed",
        "",
        `Project: \`${project_path}\``,
        `Last updated: ${ctx.updatedAt}`,
        "",
        summary,
      ];

      if (ctx.identity) {
        lines.push(
          "",
          "---",
          "",
          "## Active CSS Variables",
          "",
          "```css",
          identityToCSS(ctx.identity),
          "```",
        );
      }

      return {
        content: [{ type: "text" as const, text: lines.join("\n") }],
      };
    }
  );

  // --- Tool 2: Save Identity to Project ---
  server.tool(
    "save_identity",
    "Save a design identity to the project's .devsigner/ folder. This makes the identity persistent — all future reviews and component suggestions will reference it. Call this after design_identity to lock in the design direction.",
    {
      project_path: z.string().describe("Absolute path to the project directory"),
      personality: z.string().describe("Personality archetype name"),
      signature: z.string().describe("One-line design philosophy"),
      product: z.string(),
      audience: z.string(),
      mood: z.string(),
      bold_moves: z.array(z.string()).describe("Where to be bold"),
      restraints: z.array(z.string()).describe("Where to restrain"),
      palette: z.record(z.string()).describe("Color palette key-value pairs"),
      typography: z.record(z.string()).describe("Typography tokens"),
      spacing: z.record(z.string()).describe("Spacing tokens"),
      corners: z.record(z.string()).describe("Border radius tokens"),
      shadows: z.record(z.string()).describe("Shadow tokens"),
      hero_treatment: z.string(),
      button_personality: z.string(),
      card_style: z.string(),
      motion_level: z.string(),
    },
    async (args) => {
      const identity: DesignIdentityData = {
        personality: args.personality,
        signature: args.signature,
        product: args.product,
        audience: args.audience,
        mood: args.mood,
        boldMoves: args.bold_moves,
        restraints: args.restraints,
        palette: args.palette,
        typography: args.typography,
        spacing: args.spacing,
        corners: args.corners,
        shadows: args.shadows,
        heroTreatment: args.hero_treatment,
        buttonPersonality: args.button_personality,
        cardStyle: args.card_style,
        motionLevel: args.motion_level,
      };

      await saveIdentity(args.project_path, identity);

      return {
        content: [
          {
            type: "text" as const,
            text: [
              `# Identity Saved`,
              ``,
              `Design identity "${identity.personality}" saved to \`${args.project_path}/.devsigner/context.json\``,
              ``,
              `> ${identity.signature}`,
              ``,
              `All future design reviews and component suggestions for this project will reference this identity.`,
              ``,
              `**Next steps:**`,
              `- Review existing components against this identity`,
              `- Generate new components that match this personality`,
              `- The identity will evolve as you iterate`,
            ].join("\n"),
          },
        ],
      };
    }
  );

  // --- Tool 3: Log a Review Result ---
  server.tool(
    "log_review",
    "Log a design review result to the project's history. This builds up the score trend and identifies recurring issues. Call this after every design_review to maintain continuity.",
    {
      project_path: z.string().describe("Absolute path to the project directory"),
      file: z.string().optional().describe("File that was reviewed"),
      score: z.number().describe("Design score (0-100)"),
      top_issues: z.array(z.string()).describe("Top 3-5 issues found"),
      fixes_applied: z.array(z.string()).default([]).describe("Fixes that were applied"),
    },
    async ({ project_path, file, score, top_issues, fixes_applied }) => {
      const entry: ReviewEntry = {
        timestamp: new Date().toISOString(),
        file,
        score,
        issueCount: top_issues.length,
        topIssues: top_issues,
        fixesApplied: fixes_applied,
      };

      await addReview(project_path, entry);
      const ctx = await loadContext(project_path);

      // Calculate trend
      const recent = ctx.reviewHistory.slice(-5);
      const avgScore = Math.round(recent.reduce((s, r) => s + r.score, 0) / recent.length);

      let trendMsg = "";
      if (recent.length >= 2) {
        const prev = recent[recent.length - 2].score;
        const diff = score - prev;
        if (diff > 0) trendMsg = `Score improved by ${diff} points since last review.`;
        else if (diff < 0) trendMsg = `Score dropped by ${Math.abs(diff)} points since last review.`;
        else trendMsg = "Score unchanged since last review.";
      }

      return {
        content: [
          {
            type: "text" as const,
            text: [
              `# Review Logged`,
              ``,
              `Score: **${score}/100** | ${file ? `File: ${file}` : ""}`,
              `Total reviews: ${ctx.reviewHistory.length} | Average (last 5): ${avgScore}/100`,
              trendMsg,
              ``,
              fixes_applied.length > 0
                ? `**Fixes applied:** ${fixes_applied.join(", ")}`
                : "**No fixes applied yet.** Consider addressing the top issues.",
            ].join("\n"),
          },
        ],
      };
    }
  );

  // --- Tool 4: Record a Design Decision ---
  server.tool(
    "log_decision",
    "Record a design decision for the project. Tracks WHY choices were made so future sessions understand the reasoning. Use this when changing colors, layout, components, or any design direction.",
    {
      project_path: z.string().describe("Absolute path to the project directory"),
      decision: z.string().describe("What was decided (e.g., 'Changed primary color to #2563eb')"),
      reason: z.string().describe("Why (e.g., 'Better contrast on dark backgrounds, matches brand guidelines')"),
    },
    async ({ project_path, decision, reason }) => {
      await addDecision(project_path, decision, reason, "manual");

      return {
        content: [
          {
            type: "text" as const,
            text: `Decision recorded: **${decision}** — ${reason}`,
          },
        ],
      };
    }
  );

  // --- Tool 5: Learn / Reject Patterns ---
  server.tool(
    "design_feedback",
    "Tell devsigner what works and what doesn't for this project. Positive feedback teaches patterns to repeat. Negative feedback prevents suggestions from recurring. This is how the design evolves over time.",
    {
      project_path: z.string().describe("Absolute path to the project directory"),
      type: z.enum(["positive", "negative"]).describe("Was this suggestion good or bad?"),
      pattern: z.string().describe("What pattern to learn or reject (e.g., 'Large border radius on cards works well' or 'Stop suggesting gradient backgrounds')"),
    },
    async ({ project_path, type, pattern }) => {
      if (type === "positive") {
        await addLearnedPattern(project_path, pattern);
      } else {
        await addRejection(project_path, pattern);
      }

      const ctx = await loadContext(project_path);

      return {
        content: [
          {
            type: "text" as const,
            text: [
              type === "positive"
                ? `Learned: **${pattern}** — will apply this pattern going forward.`
                : `Rejected: **${pattern}** — won't suggest this again.`,
              ``,
              `Learned patterns: ${ctx.learnedPatterns.length} | Rejected: ${ctx.rejectedSuggestions.length}`,
            ].join("\n"),
          },
        ],
      };
    }
  );
}
