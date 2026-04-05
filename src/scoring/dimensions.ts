export interface DimensionScore {
  name: string;
  score: number;        // 0-100
  label: string;        // "Excellent" | "Good" | "Fair" | "Poor"
  icon: string;         // emoji
  findings: string[];   // Top specific findings
}

export interface DesignScorecard {
  overall: number;
  dimensions: DimensionScore[];
  industryPercentile: number | null;
}

export function scoreLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Fair";
  return "Poor";
}

export function formatScorecard(scorecard: DesignScorecard): string {
  const lines: string[] = [];

  lines.push("## Design Scorecard");
  lines.push("");
  lines.push("| Dimension | Score | Status |");
  lines.push("|-----------|-------|--------|");

  for (const dim of scorecard.dimensions) {
    lines.push(`| ${dim.icon} ${dim.name} | **${dim.score}**/100 | ${dim.label} |`);
  }

  lines.push("");
  lines.push(`**Overall: ${scorecard.overall}/100** (${scoreLabel(scorecard.overall)})`);

  if (scorecard.industryPercentile !== null) {
    lines.push(`**Industry percentile:** Top ${100 - scorecard.industryPercentile}%`);
  }

  lines.push("");

  // Detailed findings for dimensions with issues
  const problemDims = scorecard.dimensions.filter((d) => d.findings.length > 0 && d.score < 90);
  if (problemDims.length > 0) {
    lines.push("### Key Findings");
    lines.push("");
    for (const dim of problemDims) {
      lines.push(`**${dim.icon} ${dim.name}** (${dim.score}/100)`);
      for (const finding of dim.findings.slice(0, 3)) {
        lines.push(`- ${finding}`);
      }
      lines.push("");
    }
  }

  return lines.join("\n");
}
