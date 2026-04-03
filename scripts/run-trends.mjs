import { readFile } from "node:fs/promises";

const data = JSON.parse(await readFile("d:/Documents/devsigner/data/seed-analyses.json", "utf-8"));

console.log(`\n${"=".repeat(60)}`);
console.log(`  devsigner Design Trends Report (${data.length} sites)`);
console.log(`${"=".repeat(60)}\n`);

// Personality distribution
const personalities = {};
data.forEach(d => { personalities[d.overall.personality] = (personalities[d.overall.personality] || 0) + 1; });
console.log("## Personality Distribution");
Object.entries(personalities).sort((a,b) => b[1]-a[1]).forEach(([p,c]) => {
  const pct = Math.round(c/data.length*100);
  const bar = "█".repeat(Math.round(pct/3));
  console.log(`  ${p.padEnd(20)} ${bar} ${c} (${pct}%)`);
});

// Color scheme
console.log("\n## Color Scheme");
const schemes = {};
data.forEach(d => { schemes[d.colors.color_scheme] = (schemes[d.colors.color_scheme] || 0) + 1; });
Object.entries(schemes).sort((a,b) => b[1]-a[1]).forEach(([s,c]) => {
  console.log(`  ${s.padEnd(10)} ${c} sites (${Math.round(c/data.length*100)}%)`);
});

// Corner style
console.log("\n## Corner Style");
const corners = {};
data.forEach(d => { corners[d.shapes.corner_style] = (corners[d.shapes.corner_style] || 0) + 1; });
Object.entries(corners).sort((a,b) => b[1]-a[1]).forEach(([s,c]) => {
  console.log(`  ${s.padEnd(10)} ${c} sites (${Math.round(c/data.length*100)}%)`);
});

// Density
console.log("\n## Spacing Density");
const densities = {};
data.forEach(d => { densities[d.spacing.density] = (densities[d.spacing.density] || 0) + 1; });
Object.entries(densities).sort((a,b) => b[1]-a[1]).forEach(([s,c]) => {
  console.log(`  ${s.padEnd(10)} ${c} sites (${Math.round(c/data.length*100)}%)`);
});

// Top fonts
console.log("\n## Top Heading Fonts");
const headingFonts = {};
data.forEach(d => {
  if (d.typography.heading_font) headingFonts[d.typography.heading_font] = (headingFonts[d.typography.heading_font] || 0) + 1;
});
Object.entries(headingFonts).sort((a,b) => b[1]-a[1]).slice(0,10).forEach(([f,c]) => {
  console.log(`  ${f.padEnd(25)} ${c} sites`);
});

// Industry
console.log("\n## Industry Distribution");
const industries = {};
data.forEach(d => { industries[d.overall.industry] = (industries[d.overall.industry] || 0) + 1; });
Object.entries(industries).sort((a,b) => b[1]-a[1]).forEach(([i,c]) => {
  console.log(`  ${i.padEnd(20)} ${c} sites`);
});

// Grid alignment
const avgGrid = Math.round(data.reduce((s,d) => s + d.spacing.grid_aligned_pct, 0) / data.length);
console.log(`\n## Grid Alignment`);
console.log(`  Average: ${avgGrid}% on 4px grid`);

// Average complexity
const avgComplexity = Math.round(data.reduce((s,d) => s + d.overall.complexity, 0) / data.length);
console.log(`\n## Complexity`);
console.log(`  Average: ${avgComplexity}/100`);

// Layout features
const stickyPct = Math.round(data.filter(d => d.layout.hasStickyHeader).length / data.length * 100);
const heroPct = Math.round(data.filter(d => d.layout.hasHero).length / data.length * 100);
const footerPct = Math.round(data.filter(d => d.layout.hasFooter).length / data.length * 100);
console.log(`\n## Layout Patterns`);
console.log(`  Sticky header: ${stickyPct}%`);
console.log(`  Hero section: ${heroPct}%`);
console.log(`  Footer: ${footerPct}%`);

// Sites by personality
console.log(`\n## Sites by Personality`);
Object.entries(personalities).sort((a,b) => b[1]-a[1]).forEach(([p]) => {
  const sites = data.filter(d => d.overall.personality === p).map(d => d.page_title || d.url);
  console.log(`  ${p}: ${sites.join(", ")}`);
});

console.log(`\n${"=".repeat(60)}`);
