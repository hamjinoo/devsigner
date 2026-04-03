import * as core from "@actions/core";
import * as github from "@actions/github";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseCode, runDesignRules, calculateScore } from "../dist/review.js";

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseFocus(raw) {
  if (!raw || raw === "all") return ["all"];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function matchesGlob(filePath, patterns) {
  // Simple glob matching for common patterns like **/*.{tsx,jsx}
  const extensions = [];
  for (const p of patterns) {
    const braceMatch = p.match(/\.\{([^}]+)\}$/);
    if (braceMatch) {
      for (const ext of braceMatch[1].split(",")) {
        extensions.push("." + ext.trim());
      }
    } else {
      const dotMatch = p.match(/\*(\.\w+)$/);
      if (dotMatch) extensions.push(dotMatch[1]);
    }
  }
  if (extensions.length === 0) return true;
  return extensions.some((ext) => filePath.endsWith(ext));
}

function severityIcon(severity) {
  switch (severity) {
    case "error":
      return "\u274C";
    case "warning":
      return "\u26A0\uFE0F";
    case "info":
      return "\u2139\uFE0F";
    default:
      return "\u2022";
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function run() {
  try {
    const threshold = parseInt(core.getInput("threshold") || "50", 10);
    const focusRaw = core.getInput("focus") || "all";
    const includePattern = core.getInput("include") || "**/*.{tsx,jsx,vue,svelte,css,scss}";
    const token = core.getInput("github-token") || process.env.GITHUB_TOKEN;

    if (!token) {
      core.setFailed("github-token is required to post PR comments.");
      return;
    }

    const octokit = github.getOctokit(token);
    const context = github.context;

    if (!context.payload.pull_request) {
      core.info("Not a pull request event -- skipping design review.");
      return;
    }

    const prNumber = context.payload.pull_request.number;
    const owner = context.repo.owner;
    const repo = context.repo.repo;

    // ── 1. Get changed files from the PR ──────────────────────────────────

    const changedFiles = [];
    let page = 1;
    while (true) {
      const { data } = await octokit.rest.pulls.listFiles({
        owner,
        repo,
        pull_number: prNumber,
        per_page: 100,
        page,
      });
      if (data.length === 0) break;
      changedFiles.push(...data);
      if (data.length < 100) break;
      page++;
    }

    // ── 2. Filter by include pattern ──────────────────────────────────────

    const patterns = includePattern.split(",").map((s) => s.trim());
    const focus = parseFocus(focusRaw);

    const filesToReview = changedFiles
      .filter((f) => f.status !== "removed")
      .filter((f) => matchesGlob(f.filename, patterns));

    if (filesToReview.length === 0) {
      core.info("No matching UI files changed in this PR.");
      return;
    }

    core.info(`Found ${filesToReview.length} file(s) to review.`);

    // ── 3. Review each file ───────────────────────────────────────────────

    const results = [];

    for (const file of filesToReview) {
      const filePath = resolve(process.cwd(), file.filename);
      let code;
      try {
        code = await readFile(filePath, "utf-8");
      } catch {
        core.warning(`Could not read ${file.filename} -- skipping.`);
        continue;
      }

      const parsed = parseCode(code, "auto");
      const issues = runDesignRules(parsed.declarations, focus, parsed.blocks);
      const score = calculateScore(issues);

      const errors = issues.filter((i) => i.severity === "error");
      const warnings = issues.filter((i) => i.severity === "warning");
      const infos = issues.filter((i) => i.severity === "info");

      results.push({
        filename: file.filename,
        score,
        errors,
        warnings,
        infos,
        issues,
      });
    }

    if (results.length === 0) {
      core.info("No files could be reviewed.");
      return;
    }

    // ── 4. Build markdown comment ─────────────────────────────────────────

    const lowestScore = Math.min(...results.map((r) => r.score));
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
    const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);

    const lines = [];
    lines.push("## \uD83C\uDFA8 devsigner Design Review");
    lines.push("");

    // Summary table
    lines.push("| File | Score | Errors | Warnings |");
    lines.push("|------|-------|--------|----------|");
    for (const r of results) {
      const scoreLabel =
        r.score < threshold ? `**${r.score}/100** \u274C` : `${r.score}/100`;
      lines.push(
        `| \`${r.filename}\` | ${scoreLabel} | ${r.errors.length} | ${r.warnings.length} |`
      );
    }
    lines.push("");

    // Detailed issues for files that have them
    for (const r of results) {
      if (r.issues.length === 0) continue;

      lines.push(`### Issues in \`${r.filename}\` (${r.score}/100)`);
      for (const issue of r.issues) {
        lines.push(
          `- ${severityIcon(issue.severity)} **[${issue.category}]** ${issue.message}`
        );
        if (issue.suggestion) {
          lines.push(`  ${issue.suggestion}`);
        }
      }
      lines.push("");
    }

    // Threshold summary
    if (lowestScore < threshold) {
      lines.push(
        `> **\u274C Check failed:** ${results.filter((r) => r.score < threshold).length} file(s) scored below the threshold of ${threshold}.`
      );
    } else {
      lines.push(
        `> **\u2705 All files passed** the design review (threshold: ${threshold}).`
      );
    }
    lines.push("");
    lines.push(
      "> Powered by [devsigner](https://github.com/hamjinoo/devsigner)"
    );

    const commentBody = lines.join("\n");

    // ── 5. Post or update PR comment ──────────────────────────────────────

    const commentTag = "<!-- devsigner-design-review -->";
    const fullBody = commentTag + "\n" + commentBody;

    // Look for an existing comment to update (avoid spam on re-runs)
    const { data: existingComments } = await octokit.rest.issues.listComments({
      owner,
      repo,
      issue_number: prNumber,
      per_page: 100,
    });

    const existing = existingComments.find(
      (c) => c.body && c.body.includes(commentTag)
    );

    if (existing) {
      await octokit.rest.issues.updateComment({
        owner,
        repo,
        comment_id: existing.id,
        body: fullBody,
      });
      core.info(`Updated existing review comment #${existing.id}.`);
    } else {
      await octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: prNumber,
        body: fullBody,
      });
      core.info("Posted design review comment on PR.");
    }

    // ── 6. Set outputs & fail if below threshold ──────────────────────────

    core.setOutput("lowest-score", lowestScore.toString());
    core.setOutput("total-errors", totalErrors.toString());
    core.setOutput("total-warnings", totalWarnings.toString());

    if (lowestScore < threshold) {
      core.setFailed(
        `Design review failed: lowest score is ${lowestScore}/100 (threshold: ${threshold}).`
      );
    }
  } catch (error) {
    core.setFailed(`Action failed: ${error.message}`);
  }
}

run();
