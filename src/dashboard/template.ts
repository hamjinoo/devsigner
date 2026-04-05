import type { DashboardData } from "./collector.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function scoreColor(score: number): string {
  if (score >= 90) return "#22c55e";
  if (score >= 70) return "#eab308";
  if (score >= 50) return "#f97316";
  return "#ef4444";
}

function scoreLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Fair";
  return "Poor";
}

function severityIcon(s: string): string {
  if (s === "error") return `<span class="sev sev-error">ERR</span>`;
  if (s === "warning") return `<span class="sev sev-warn">WARN</span>`;
  return `<span class="sev sev-info">INFO</span>`;
}

function catIcon(c: string): string {
  const icons: Record<string, string> = {
    spacing: "📐",
    color: "🎨",
    typography: "🔤",
    layout: "📏",
  };
  return icons[c] ?? "📋";
}

function techBadge(label: string | null, fallback?: string): string {
  if (!label) return fallback ? `<span class="badge badge-muted">${esc(fallback)}</span>` : "";
  return `<span class="badge">${esc(label)}</span>`;
}

// ---------------------------------------------------------------------------
// Score ring SVG
// ---------------------------------------------------------------------------

function scoreRing(score: number, size = 180): string {
  const r = (size - 20) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  const color = scoreColor(score);

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="score-ring">
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}"
        fill="none" stroke="#2a2a2f" stroke-width="12" />
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}"
        fill="none" stroke="${color}" stroke-width="12"
        stroke-linecap="round"
        stroke-dasharray="${circumference}"
        stroke-dashoffset="${offset}"
        transform="rotate(-90 ${size / 2} ${size / 2})"
        class="score-ring-progress" />
      <text x="${size / 2}" y="${size / 2 - 8}" text-anchor="middle" class="score-number" fill="${color}">${score}</text>
      <text x="${size / 2}" y="${size / 2 + 18}" text-anchor="middle" class="score-label" fill="#888">${scoreLabel(score)}</text>
    </svg>`;
}

function radarChart(dimensions: Array<{ name: string; score: number; icon: string }>, size = 220): string {
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - 40) / 2;
  const n = dimensions.length;
  const angleStep = (2 * Math.PI) / n;

  // Grid rings
  const rings = [0.25, 0.5, 0.75, 1.0];
  const gridLines = rings.map((pct) => {
    const points = [];
    for (let i = 0; i < n; i++) {
      const angle = i * angleStep - Math.PI / 2;
      points.push(`${cx + r * pct * Math.cos(angle)},${cy + r * pct * Math.sin(angle)}`);
    }
    return `<polygon points="${points.join(" ")}" fill="none" stroke="#2a2a35" stroke-width="1" />`;
  }).join("");

  // Axis lines
  const axes = dimensions.map((_, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#2a2a35" stroke-width="1" />`;
  }).join("");

  // Data polygon
  const dataPoints = dimensions.map((d, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const pct = d.score / 100;
    return `${cx + r * pct * Math.cos(angle)},${cy + r * pct * Math.sin(angle)}`;
  });
  const dataPolygon = `<polygon points="${dataPoints.join(" ")}" fill="rgba(139,92,246,0.2)" stroke="#8b5cf6" stroke-width="2" />`;

  // Data points
  const dots = dimensions.map((d, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const pct = d.score / 100;
    const x = cx + r * pct * Math.cos(angle);
    const y = cy + r * pct * Math.sin(angle);
    return `<circle cx="${x}" cy="${y}" r="4" fill="${scoreColor(d.score)}" />`;
  }).join("");

  // Labels
  const labels = dimensions.map((d, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const lx = cx + (r + 18) * Math.cos(angle);
    const ly = cy + (r + 18) * Math.sin(angle);
    const anchor = Math.abs(Math.cos(angle)) < 0.1 ? "middle" : Math.cos(angle) > 0 ? "start" : "end";
    return `<text x="${lx}" y="${ly + 4}" text-anchor="${anchor}" fill="#a1a1aa" font-size="11">${d.icon} ${d.score}</text>`;
  }).join("");

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="radar-chart">
    ${gridLines}${axes}${dataPolygon}${dots}${labels}
  </svg>`;
}

// ---------------------------------------------------------------------------
// Main template
// ---------------------------------------------------------------------------

export function renderDashboard(data: DashboardData): string {
  const {
    projectName, techStack, overallScore, totalFiles, totalIssues,
    distribution, categoryScores, topIssues, files, colors, typography,
    spacing, scorecard, scannedAt,
  } = data;

  // Category cards
  const categoryCards = categoryScores.map((cs) => `
    <div class="card cat-card">
      <div class="cat-icon">${catIcon(cs.category)}</div>
      <div class="cat-score" style="color:${scoreColor(cs.avgScore)}">${cs.avgScore}</div>
      <div class="cat-name">${cs.category}</div>
      <div class="cat-issues">${cs.issueCount} issue${cs.issueCount !== 1 ? "s" : ""}</div>
    </div>
  `).join("");

  // Distribution bar
  const total = distribution.excellent + distribution.good + distribution.fair + distribution.poor;
  const distBar = total > 0 ? `
    <div class="dist-bar">
      ${distribution.excellent > 0 ? `<div class="dist-seg dist-excellent" style="width:${(distribution.excellent / total) * 100}%" title="${distribution.excellent} excellent"></div>` : ""}
      ${distribution.good > 0 ? `<div class="dist-seg dist-good" style="width:${(distribution.good / total) * 100}%" title="${distribution.good} good"></div>` : ""}
      ${distribution.fair > 0 ? `<div class="dist-seg dist-fair" style="width:${(distribution.fair / total) * 100}%" title="${distribution.fair} fair"></div>` : ""}
      ${distribution.poor > 0 ? `<div class="dist-seg dist-poor" style="width:${(distribution.poor / total) * 100}%" title="${distribution.poor} poor"></div>` : ""}
    </div>
    <div class="dist-legend">
      <span><span class="dot" style="background:#22c55e"></span> Excellent ${distribution.excellent}</span>
      <span><span class="dot" style="background:#eab308"></span> Good ${distribution.good}</span>
      <span><span class="dot" style="background:#f97316"></span> Fair ${distribution.fair}</span>
      <span><span class="dot" style="background:#ef4444"></span> Poor ${distribution.poor}</span>
    </div>
  ` : "";

  // Color palette
  const colorSwatches = colors.slice(0, 30).map((c) => `
    <div class="swatch" title="${esc(c.hex)} (used ${c.count}x)">
      <div class="swatch-color" style="background:${esc(c.hex)}"></div>
      <div class="swatch-hex">${esc(c.hex)}</div>
      <div class="swatch-count">${c.count}x</div>
    </div>
  `).join("");

  // Typography
  const fontList = Object.entries(typography.fonts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([font, count]) => `<div class="typo-item"><span class="typo-name" style="font-family:${esc(font)}">${esc(font)}</span><span class="typo-count">${count}x</span></div>`)
    .join("");

  const sizeList = Object.entries(typography.sizes)
    .sort(([a], [b]) => parseFloat(a) - parseFloat(b))
    .map(([size, count]) => `<div class="typo-size-item"><span class="typo-size-preview" style="font-size:min(${esc(size)}, 32px)">${esc(size)}</span><span class="typo-count">${count}x</span></div>`)
    .join("");

  // Spacing
  const spacingItems = spacing.slice(0, 20).map((s) => {
    const w = Math.min(s.px, 120);
    return `
      <div class="spacing-item">
        <div class="spacing-bar-wrap">
          <div class="spacing-bar ${s.gridAligned ? "grid-aligned" : "grid-off"}" style="width:${w}px"></div>
        </div>
        <span class="spacing-val">${esc(s.value)}</span>
        <span class="spacing-px">${s.px}px</span>
        <span class="typo-count">${s.count}x</span>
        ${s.gridAligned ? '<span class="grid-badge">grid</span>' : '<span class="grid-badge off">off-grid</span>'}
      </div>`;
  }).join("");

  // Top issues
  const issueRows = topIssues.map((ti) => `
    <div class="issue-row">
      <div class="issue-head">
        ${severityIcon(ti.severity)}
        <span class="issue-cat">${esc(ti.category)}</span>
        <span class="issue-count">${ti.count} file${ti.count !== 1 ? "s" : ""}</span>
      </div>
      <div class="issue-msg">${esc(ti.message)}</div>
      <div class="issue-fix">${esc(ti.suggestion)}</div>
    </div>
  `).join("");

  // File list
  const fileRows = files.map((f) => {
    const errors = f.issues.filter((i) => i.severity === "error").length;
    const warns = f.issues.filter((i) => i.severity === "warning").length;
    const infos = f.issues.filter((i) => i.severity === "info").length;
    const issueDetails = f.issues.map((i) => `
      <div class="file-issue">
        ${severityIcon(i.severity)}
        <span class="issue-cat">${esc(i.category)}</span>
        <span>${esc(i.message)}</span>
      </div>
    `).join("");

    return `
      <div class="file-row">
        <div class="file-head" onclick="this.parentElement.classList.toggle('expanded')">
          <span class="file-score" style="color:${scoreColor(f.score)}">${f.score}</span>
          <span class="file-path">${esc(f.relativePath)}</span>
          <span class="file-issues-summary">
            ${errors > 0 ? `<span class="sev sev-error">${errors}</span>` : ""}
            ${warns > 0 ? `<span class="sev sev-warn">${warns}</span>` : ""}
            ${infos > 0 ? `<span class="sev sev-info">${infos}</span>` : ""}
          </span>
          <button class="preview-btn" onclick="event.stopPropagation(); loadPreview('${esc(f.relativePath)}', this)">Preview</button>
          <span class="expand-icon">&#9660;</span>
        </div>
        ${f.issues.length > 0 ? `<div class="file-details">${issueDetails}</div>` : ""}
        <div class="preview-panel" id="preview-${f.relativePath.replace(/[^a-zA-Z0-9]/g, "-")}"></div>
      </div>`;
  }).join("");

  // Tech stack badges
  const techBadges = [
    techBadge(techStack.framework),
    techBadge(techStack.cssFramework),
    techBadge(techStack.componentLibrary),
    techBadge(techStack.language, techStack.language),
    techBadge(techStack.buildTool),
  ].filter(Boolean).join(" ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>devsigner — ${esc(projectName)}</title>
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg: #0f0f13;
  --surface: #1a1a21;
  --surface2: #22222b;
  --border: #2a2a35;
  --text: #e4e4e7;
  --text2: #a1a1aa;
  --text3: #71717a;
  --accent: #8b5cf6;
  --radius: 12px;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
  min-height: 100vh;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px;
}

/* Header */
header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 40px;
  flex-wrap: wrap;
  gap: 16px;
}
.logo {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.5px;
}
.logo span { color: var(--accent); }
.meta { color: var(--text3); font-size: 13px; }
.badges { display: flex; gap: 6px; flex-wrap: wrap; }
.badge {
  display: inline-block;
  padding: 4px 10px;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 12px;
  color: var(--text2);
  font-weight: 500;
}
.badge-muted { opacity: 0.5; }

/* Hero */
.hero {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 32px;
  align-items: start;
  margin-bottom: 40px;
}
.hero-scores {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
.hero-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.radar-chart { display: block; margin: 0 auto; }
.stat-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px;
  text-align: center;
}
.stat-value { font-size: 32px; font-weight: 700; }
.stat-label { font-size: 13px; color: var(--text3); margin-top: 4px; }

.score-ring { display: block; margin: 0 auto; }
.score-number { font-size: 48px; font-weight: 800; font-family: inherit; }
.score-label { font-size: 14px; font-weight: 500; font-family: inherit; }
.score-ring-progress { transition: stroke-dashoffset 1s ease; }

/* Section */
section { margin-bottom: 40px; }
.section-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 8px;
}
.section-title::before {
  content: '';
  width: 3px;
  height: 18px;
  background: var(--accent);
  border-radius: 2px;
}

/* Cards */
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px;
}

/* Category grid */
.cat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.cat-card { text-align: center; }
.cat-icon { font-size: 28px; margin-bottom: 8px; }
.cat-score { font-size: 36px; font-weight: 800; }
.cat-name { font-size: 13px; color: var(--text3); text-transform: capitalize; margin-top: 2px; }
.cat-issues { font-size: 12px; color: var(--text3); margin-top: 4px; }

/* Distribution */
.dist-bar {
  display: flex;
  height: 12px;
  border-radius: 6px;
  overflow: hidden;
  background: var(--surface2);
  margin-bottom: 12px;
}
.dist-seg { min-width: 4px; transition: width 0.5s ease; }
.dist-excellent { background: #22c55e; }
.dist-good { background: #eab308; }
.dist-fair { background: #f97316; }
.dist-poor { background: #ef4444; }
.dist-legend {
  display: flex;
  gap: 20px;
  font-size: 13px;
  color: var(--text2);
}
.dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 4px;
  vertical-align: middle;
}

/* Colors */
.color-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.swatch {
  text-align: center;
  cursor: default;
}
.swatch-color {
  width: 56px;
  height: 56px;
  border-radius: 10px;
  border: 2px solid var(--border);
  margin-bottom: 4px;
  transition: transform 0.15s;
}
.swatch:hover .swatch-color { transform: scale(1.1); }
.swatch-hex { font-size: 11px; color: var(--text2); font-family: monospace; }
.swatch-count { font-size: 10px; color: var(--text3); }

/* Typography */
.typo-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}
.typo-item, .typo-size-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--surface2);
  border-radius: 8px;
  margin-bottom: 6px;
}
.typo-name { font-size: 14px; }
.typo-size-preview { color: var(--text); }
.typo-count { font-size: 12px; color: var(--text3); min-width: 40px; text-align: right; }

/* Spacing */
.spacing-list { max-width: 600px; }
.spacing-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 0;
}
.spacing-bar-wrap { width: 120px; flex-shrink: 0; }
.spacing-bar {
  height: 8px;
  border-radius: 4px;
  min-width: 2px;
}
.spacing-bar.grid-aligned { background: var(--accent); }
.spacing-bar.grid-off { background: #ef4444; }
.spacing-val { font-family: monospace; font-size: 13px; min-width: 60px; }
.spacing-px { font-size: 12px; color: var(--text3); min-width: 40px; }
.grid-badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(139,92,246,0.15);
  color: var(--accent);
  font-weight: 600;
}
.grid-badge.off {
  background: rgba(239,68,68,0.15);
  color: #ef4444;
}

/* Issues */
.issue-row {
  padding: 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  margin-bottom: 8px;
}
.issue-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}
.issue-cat {
  font-size: 12px;
  color: var(--text3);
  text-transform: capitalize;
}
.issue-count {
  margin-left: auto;
  font-size: 12px;
  color: var(--text3);
}
.issue-msg { font-size: 14px; color: var(--text); margin-bottom: 4px; }
.issue-fix { font-size: 13px; color: var(--text2); padding-left: 8px; border-left: 2px solid var(--border); }

.sev {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.5px;
}
.sev-error { background: rgba(239,68,68,0.15); color: #ef4444; }
.sev-warn { background: rgba(234,179,8,0.15); color: #eab308; }
.sev-info { background: rgba(59,130,246,0.15); color: #3b82f6; }

/* Files */
.file-list { max-height: 600px; overflow-y: auto; }
.file-row {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  margin-bottom: 6px;
  background: var(--surface);
  cursor: pointer;
  transition: background 0.15s;
}
.file-row:hover { background: var(--surface2); }
.file-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
}
.file-score {
  font-size: 18px;
  font-weight: 700;
  min-width: 36px;
  text-align: center;
}
.file-path {
  font-family: monospace;
  font-size: 13px;
  color: var(--text2);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.file-issues-summary {
  display: flex;
  gap: 4px;
}
.expand-icon {
  font-size: 10px;
  color: var(--text3);
  transition: transform 0.2s;
}
.file-row.expanded .expand-icon { transform: rotate(180deg); }
.file-details {
  display: none;
  padding: 0 16px 12px;
  border-top: 1px solid var(--border);
}
.file-row.expanded .file-details { display: block; padding-top: 12px; }
.file-issue {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  font-size: 13px;
  color: var(--text2);
}

/* Footer */
footer {
  text-align: center;
  padding: 32px 0;
  color: var(--text3);
  font-size: 13px;
}
footer a { color: var(--accent); text-decoration: none; }

/* Responsive */
@media (max-width: 768px) {
  .hero { grid-template-columns: 1fr; text-align: center; }
  .hero-stats { grid-template-columns: 1fr; }
  .cat-grid { grid-template-columns: repeat(2, 1fr); }
  .typo-grid { grid-template-columns: 1fr; }
}

/* Empty state */
.empty { color: var(--text3); font-style: italic; padding: 20px; text-align: center; }

/* Preview button */
.preview-btn {
  padding: 4px 12px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
  white-space: nowrap;
}
.preview-btn:hover { opacity: 0.85; }
.preview-btn:disabled { opacity: 0.4; cursor: wait; }

/* Preview panel */
.preview-panel {
  display: none;
  padding: 20px 16px;
  border-top: 1px solid var(--border);
}
.preview-panel.loaded { display: block; }
.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.preview-scores {
  display: flex;
  gap: 24px;
  align-items: center;
}
.preview-score-item {
  text-align: center;
}
.preview-score-val {
  font-size: 28px;
  font-weight: 800;
}
.preview-score-label {
  font-size: 11px;
  color: var(--text3);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.preview-arrow {
  font-size: 24px;
  color: var(--text3);
}
.preview-delta {
  font-size: 14px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 6px;
}
.preview-delta.positive { background: rgba(34,197,94,0.15); color: #22c55e; }
.preview-delta.zero { background: rgba(161,161,170,0.15); color: var(--text3); }

.preview-compare {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}
.preview-side {
  background: var(--surface2);
  border-radius: var(--radius);
  overflow: hidden;
}
.preview-side-label {
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text2);
  background: var(--bg);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.preview-side img {
  width: 100%;
  display: block;
}

.preview-fixes {
  background: var(--surface2);
  border-radius: var(--radius);
  padding: 16px;
}
.preview-fixes h4 {
  font-size: 13px;
  color: var(--text2);
  margin-bottom: 12px;
}
.fix-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  font-size: 13px;
  border-bottom: 1px solid var(--border);
}
.fix-item:last-child { border-bottom: none; }
.fix-before {
  font-family: monospace;
  color: #ef4444;
  text-decoration: line-through;
  font-size: 12px;
}
.fix-after {
  font-family: monospace;
  color: #22c55e;
  font-size: 12px;
}
.fix-arrow { color: var(--text3); }

.preview-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px;
  color: var(--text3);
}
.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
</head>
<body>
<div class="container">

<header>
  <div>
    <div class="logo">dev<span>signer</span></div>
    <div class="meta">${esc(projectName)} &middot; scanned ${new Date(scannedAt).toLocaleString()}</div>
  </div>
  <div class="badges">${techBadges}</div>
</header>

<div class="hero">
  <div class="hero-scores">
    <div>${scoreRing(scorecard.overall, 160)}</div>
    <div>${radarChart(scorecard.dimensions)}</div>
  </div>
  <div class="hero-stats">
    <div class="stat-card">
      <div class="stat-value">${totalFiles}</div>
      <div class="stat-label">Files Reviewed</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${totalIssues}</div>
      <div class="stat-label">Total Issues</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${colors.length}</div>
      <div class="stat-label">Distinct Colors</div>
    </div>
    ${scorecard.dimensions.map((d) => `
    <div class="stat-card">
      <div class="stat-value" style="color:${scoreColor(d.score)};font-size:24px">${d.icon} ${d.score}</div>
      <div class="stat-label">${d.name}</div>
    </div>`).join("")}
  </div>
</div>

<section>
  <div class="section-title">Category Breakdown</div>
  <div class="cat-grid">${categoryCards}</div>
</section>

<section>
  <div class="section-title">Score Distribution</div>
  <div class="card">${distBar || '<div class="empty">No files reviewed</div>'}</div>
</section>

${colors.length > 0 ? `
<section>
  <div class="section-title">Color Palette (${colors.length} colors)</div>
  <div class="card">
    <div class="color-grid">${colorSwatches}</div>
  </div>
</section>
` : ""}

<section>
  <div class="section-title">Typography</div>
  <div class="typo-grid">
    <div class="card">
      <h3 style="font-size:14px;color:var(--text2);margin-bottom:12px">Font Families</h3>
      ${fontList || '<div class="empty">No fonts detected</div>'}
    </div>
    <div class="card">
      <h3 style="font-size:14px;color:var(--text2);margin-bottom:12px">Font Sizes</h3>
      ${sizeList || '<div class="empty">No sizes detected</div>'}
    </div>
  </div>
</section>

${spacing.length > 0 ? `
<section>
  <div class="section-title">Spacing Analysis</div>
  <div class="card">
    <div class="spacing-list">${spacingItems}</div>
  </div>
</section>
` : ""}

${topIssues.length > 0 ? `
<section>
  <div class="section-title">Top Issues</div>
  ${issueRows}
</section>
` : ""}

<section>
  <div class="section-title">All Files (${files.length})</div>
  <div class="file-list">${fileRows || '<div class="empty">No UI files found</div>'}</div>
</section>

<footer>
  Powered by <a href="https://github.com/hamjinoo/devsigner">devsigner</a> &middot; The design assistant for developers
</footer>

</div>

<script>
function scoreColor(s) {
  if (s >= 90) return '#22c55e';
  if (s >= 70) return '#eab308';
  if (s >= 50) return '#f97316';
  return '#ef4444';
}

function escHtml(s) {
  var d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

async function loadPreview(filePath, btn) {
  var panelId = 'preview-' + filePath.replace(/[^a-zA-Z0-9]/g, '-');
  var panel = document.getElementById(panelId);
  if (!panel) return;

  if (panel.classList.contains('loaded')) {
    panel.classList.remove('loaded');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Rendering...';

  panel.innerHTML = '<div class="preview-loading"><div class="spinner"></div>Rendering before/after...</div>';
  panel.classList.add('loaded');

  try {
    var res = await fetch('/api/preview?file=' + encodeURIComponent(filePath));
    var data = await res.json();

    if (data.error) {
      panel.innerHTML = '<div class="preview-loading" style="color:#ef4444">' + escHtml(String(data.error)) + '</div>';
      return;
    }

    var delta = data.scoreAfter - data.scoreBefore;
    var deltaClass = delta > 0 ? 'positive' : 'zero';
    var deltaText = delta > 0 ? ('+' + delta) : (delta === 0 ? 'no change' : String(delta));

    var fixItems = (data.fixes || []).slice(0, 15).map(function(f) {
      return '<div class="fix-item">' +
        '<span class="fix-before">' + escHtml(f.before) + '</span>' +
        '<span class="fix-arrow">&rarr;</span>' +
        '<span class="fix-after">' + escHtml(f.after) + '</span>' +
        '</div>';
    }).join('');

    panel.innerHTML =
      '<div class="preview-header">' +
        '<div class="preview-scores">' +
          '<div class="preview-score-item">' +
            '<div class="preview-score-val" style="color:' + scoreColor(data.scoreBefore) + '">' + data.scoreBefore + '</div>' +
            '<div class="preview-score-label">Before</div>' +
          '</div>' +
          '<div class="preview-arrow">&rarr;</div>' +
          '<div class="preview-score-item">' +
            '<div class="preview-score-val" style="color:' + scoreColor(data.scoreAfter) + '">' + data.scoreAfter + '</div>' +
            '<div class="preview-score-label">After</div>' +
          '</div>' +
          '<div class="preview-delta ' + deltaClass + '">' + deltaText + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="preview-compare">' +
        '<div class="preview-side">' +
          '<div class="preview-side-label">Before</div>' +
          '<img src="data:image/png;base64,' + data.beforeImage + '" alt="Before">' +
        '</div>' +
        '<div class="preview-side">' +
          '<div class="preview-side-label">After</div>' +
          '<img src="data:image/png;base64,' + data.afterImage + '" alt="After">' +
        '</div>' +
      '</div>' +
      (fixItems ? '<div class="preview-fixes"><h4>Changes Applied (' + data.fixes.length + ')</h4>' + fixItems + '</div>' : '');

  } catch (err) {
    panel.innerHTML = '<div class="preview-loading" style="color:#ef4444">Failed to render: ' + escHtml(err.message || String(err)) + '</div>';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Preview';
  }
}
</script>
</body>
</html>`;
}
