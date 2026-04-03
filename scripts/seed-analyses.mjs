/**
 * Seed the design analysis database by analyzing top design sites.
 * Uses Puppeteer directly — no devsigner imports (avoids build issues).
 * Run with: node scripts/seed-analyses.mjs
 */

import puppeteer from "puppeteer-core";
import { writeFile, mkdir } from "node:fs/promises";

// Find Chrome
async function findChrome() {
  const { access } = await import("node:fs/promises");
  const paths = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    process.env.LOCALAPPDATA + "\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
  ];
  for (const p of paths) {
    try { await access(p); return p; } catch {}
  }
  return null;
}

// Extract design data from page (runs in browser context)
async function extractFromPage(page) {
  return await page.evaluate(() => {
    const els = document.querySelectorAll("*");
    const colorMap = {};
    const bgColors = [];
    const textColors = [];
    const fontMap = {};
    const sizeMap = {};
    const weightMap = {};
    const spacingMap = {};
    const radiusMap = {};
    const shadowMap = {};
    const headingTags = new Set(["H1","H2","H3","H4","H5","H6"]);

    for (const el of els) {
      const s = window.getComputedStyle(el);
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;

      // Colors
      const bg = s.backgroundColor;
      const fg = s.color;
      if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") {
        colorMap[bg] = (colorMap[bg] || 0) + 1;
        bgColors.push(bg);
      }
      if (fg) {
        colorMap[fg] = (colorMap[fg] || 0) + 1;
        textColors.push(fg);
      }

      // Fonts
      const family = s.fontFamily.split(",")[0].trim().replace(/['"]/g, "");
      const size = Math.round(parseFloat(s.fontSize));
      const weight = parseInt(s.fontWeight) || 400;
      const isH = headingTags.has(el.tagName);

      if (!fontMap[family]) fontMap[family] = { count: 0, heading: false, body: false };
      fontMap[family].count++;
      if (isH) fontMap[family].heading = true; else fontMap[family].body = true;

      if (size > 0) sizeMap[size] = (sizeMap[size] || 0) + 1;
      weightMap[weight] = (weightMap[weight] || 0) + 1;

      // Spacing
      for (const prop of ["marginTop","marginBottom","paddingTop","paddingBottom","paddingLeft","paddingRight","gap"]) {
        const v = Math.round(parseFloat(s[prop]));
        if (v > 0 && v < 500) spacingMap[v] = (spacingMap[v] || 0) + 1;
      }

      // Shapes
      const rad = Math.round(parseFloat(s.borderRadius));
      if (rad > 0) radiusMap[rad] = (radiusMap[rad] || 0) + 1;
      if (s.boxShadow !== "none") shadowMap[s.boxShadow] = (shadowMap[s.boxShadow] || 0) + 1;
    }

    // Layout
    const mainEl = document.querySelector("main, [role='main'], .container, article");
    const maxW = mainEl ? mainEl.getBoundingClientRect().width : document.body.getBoundingClientRect().width;

    return {
      title: document.title,
      colors: { map: colorMap, bg: [...new Set(bgColors)].slice(0,15), text: [...new Set(textColors)].slice(0,15) },
      fonts: fontMap,
      sizes: sizeMap,
      weights: weightMap,
      spacing: spacingMap,
      radii: radiusMap,
      shadows: shadowMap,
      layout: {
        maxWidth: Math.round(maxW),
        viewportWidth: window.innerWidth,
        hasSidebar: !!document.querySelector("aside, [class*='sidebar']"),
        hasHero: !!document.querySelector("[class*='hero'], header + section"),
        hasStickyHeader: Array.from(document.querySelectorAll("header, nav")).some(e => { const p = window.getComputedStyle(e).position; return p === "sticky" || p === "fixed"; }),
        hasFooter: !!document.querySelector("footer"),
      },
    };
  });
}

// Parse rgb string to hex
function rgbToHex(str) {
  const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return null;
  return "#" + [m[1],m[2],m[3]].map(x => parseInt(x).toString(16).padStart(2,"0")).join("");
}

// Process raw data into structured analysis
function processAnalysis(url, raw) {
  // Colors
  const colorEntries = Object.entries(raw.colors.map).sort((a,b) => b[1] - a[1]);
  const total = colorEntries.reduce((s,[,c]) => s + c, 0);
  const palette = colorEntries.slice(0,15).map(([c, count]) => ({
    raw: c, hex: rgbToHex(c) || c, count, pct: Math.round(count/total*100),
  }));

  const bgHex = raw.colors.bg.map(c => rgbToHex(c)).filter(Boolean);
  const textHex = raw.colors.text.map(c => rgbToHex(c)).filter(Boolean);
  const dominantBg = bgHex[0] || "#ffffff";

  // Determine if dark or light
  const bgR = parseInt(dominantBg.slice(1,3),16) || 0;
  const bgG = parseInt(dominantBg.slice(3,5),16) || 0;
  const bgB = parseInt(dominantBg.slice(5,7),16) || 0;
  const luminance = (bgR*0.299 + bgG*0.587 + bgB*0.114) / 255;
  const colorScheme = luminance < 0.3 ? "dark" : luminance > 0.7 ? "light" : "mixed";

  // Typography
  const fonts = Object.entries(raw.fonts).map(([f,d]) => ({
    family: f, count: d.count, heading: d.heading, body: d.body
  })).sort((a,b) => b.count - a.count);

  const sizes = Object.entries(raw.sizes).map(([s,c]) => ({
    px: parseInt(s), count: c
  })).sort((a,b) => b.px - a.px);

  const weights = Object.entries(raw.weights).map(([w,c]) => ({
    weight: parseInt(w), count: c
  })).sort((a,b) => b.count - a.count);

  // Spacing
  const spacingVals = Object.entries(raw.spacing).map(([v,c]) => ({
    px: parseInt(v), count: c
  })).sort((a,b) => b.count - a.count);

  const totalSpacing = spacingVals.reduce((s,v) => s + v.count, 0);
  const gridAligned = spacingVals.filter(v => v.px % 4 === 0).reduce((s,v) => s + v.count, 0);
  const avgSpacing = totalSpacing > 0 ? spacingVals.reduce((s,v) => s + v.px * v.count, 0) / totalSpacing : 16;
  const density = avgSpacing > 24 ? "spacious" : avgSpacing < 12 ? "compact" : "balanced";

  // Shapes
  const radii = Object.entries(raw.radii).map(([r,c]) => ({ px: parseInt(r), count: c })).sort((a,b) => b.count - a.count);
  const avgRadius = radii.length > 0 ? radii.reduce((s,r) => s + r.px * r.count, 0) / radii.reduce((s,r) => s + r.count, 0) : 0;
  const cornerStyle = avgRadius < 2 ? "sharp" : avgRadius < 6 ? "subtle" : avgRadius < 16 ? "rounded" : "pill";
  const shadowCount = Object.values(raw.shadows).reduce((s,c) => s + c, 0);
  const shadowStyle = shadowCount === 0 ? "none" : "subtle";

  // Personality — scoring system (matches analyze-url.ts)
  const scores = {
    "Bold Minimal": 0, "Warm Professional": 0, "Energetic Pop": 0,
    "Elegant Editorial": 0, "Data Dense": 0, "Soft Wellness": 0,
  };
  // Bold Minimal
  if (colorScheme === "dark") scores["Bold Minimal"] += 3;
  if (shadowStyle === "none") scores["Bold Minimal"] += 2;
  if (palette.length < 8) scores["Bold Minimal"] += 2;
  if (cornerStyle === "sharp" || cornerStyle === "subtle") scores["Bold Minimal"] += 1;
  if (density === "spacious") scores["Bold Minimal"] += 2;
  // Warm Professional
  if (colorScheme === "light") scores["Warm Professional"] += 3;
  if (shadowStyle === "subtle") scores["Warm Professional"] += 2;
  if (cornerStyle === "rounded") scores["Warm Professional"] += 2;
  if (density === "balanced") scores["Warm Professional"] += 1;
  if (palette.length >= 8 && palette.length <= 15) scores["Warm Professional"] += 1;
  // Energetic Pop
  if (palette.length > 15) scores["Energetic Pop"] += 3;
  if (cornerStyle === "pill") scores["Energetic Pop"] += 2;
  if (shadowStyle === "dramatic") scores["Energetic Pop"] += 2;
  if (density === "balanced") scores["Energetic Pop"] += 1;
  // Elegant Editorial
  if (fonts.some(f => f.family.toLowerCase().includes("serif") && f.heading)) scores["Elegant Editorial"] += 4;
  if (shadowStyle === "none") scores["Elegant Editorial"] += 2;
  if (density === "spacious") scores["Elegant Editorial"] += 2;
  if (cornerStyle === "sharp") scores["Elegant Editorial"] += 1;
  // Data Dense
  if (density === "compact") scores["Data Dense"] += 3;
  if (shadowStyle === "none") scores["Data Dense"] += 2;
  if (palette.length < 6) scores["Data Dense"] += 2;
  if (cornerStyle === "sharp" || cornerStyle === "subtle") scores["Data Dense"] += 1;
  // Soft Wellness
  if (cornerStyle === "pill") scores["Soft Wellness"] += 3;
  if (shadowStyle === "subtle") scores["Soft Wellness"] += 2;
  if (density === "spacious") scores["Soft Wellness"] += 2;
  if (colorScheme === "light") scores["Soft Wellness"] += 1;
  if (palette.length < 10) scores["Soft Wellness"] += 1;

  const personality = Object.entries(scores).sort((a,b) => b[1] - a[1])[0][0];

  // Industry — URL first, then title fallback (matches analyze-url.ts)
  const domainMap = {
    "stripe.com": "fintech", "wise.com": "fintech", "mercury.com": "fintech",
    "github.com": "developer_tools", "vercel.com": "developer_tools", "supabase.com": "developer_tools",
    "tailwindcss.com": "developer_tools", "nextjs.org": "developer_tools", "astro.build": "developer_tools",
    "vitejs.dev": "developer_tools", "posthog.com": "developer_tools", "resend.com": "developer_tools",
    "clerk.com": "developer_tools", "cal.com": "saas", "raycast.com": "developer_tools",
    "figma.com": "design_tools", "framer.com": "design_tools",
    "shopify.com": "ecommerce", "gumroad.com": "ecommerce",
    "duolingo.com": "education", "coursera.org": "education",
    "calm.com": "healthcare", "headspace.com": "healthcare",
    "discord.com": "social", "slack.com": "social",
    "notion.so": "saas", "linear.app": "saas", "todoist.com": "saas",
    "1password.com": "saas", "arc.net": "saas",
  };
  let industry = "general";
  for (const [domain, ind] of Object.entries(domainMap)) {
    if (url.includes(domain)) { industry = ind; break; }
  }
  if (industry === "general") {
    const t = raw.title.toLowerCase();
    if (/bank|finance|pay|money|crypto/i.test(t)) industry = "fintech";
    else if (/health|medical|wellness|calm/i.test(t)) industry = "healthcare";
    else if (/shop|store|buy|cart/i.test(t)) industry = "ecommerce";
    else if (/learn|course|edu/i.test(t)) industry = "education";
    else if (/dev|code|api|git|deploy|build/i.test(t)) industry = "developer_tools";
  }

  return {
    url,
    analyzed_at: new Date().toISOString(),
    page_title: raw.title,
    colors: {
      palette: palette.slice(0,10),
      dominant_bg: dominantBg,
      primary_text: textHex[0] || "#000000",
      color_scheme: colorScheme,
      unique_count: palette.length,
    },
    typography: {
      fonts: fonts.slice(0,5),
      sizes: sizes.slice(0,8),
      weights: weights.slice(0,4),
      heading_font: fonts.find(f => f.heading)?.family || fonts[0]?.family,
      body_font: fonts.find(f => f.body)?.family || fonts[0]?.family,
    },
    spacing: {
      top_values: spacingVals.slice(0,10),
      grid_aligned_pct: totalSpacing > 0 ? Math.round(gridAligned/totalSpacing*100) : 0,
      density,
      unique_count: spacingVals.length,
    },
    layout: raw.layout,
    shapes: {
      corner_style: cornerStyle,
      shadow_style: shadowStyle,
      top_radii: radii.slice(0,5),
    },
    overall: {
      personality,
      industry,
      complexity: Math.min(100, palette.length * 3 + sizes.length * 5 + spacingVals.length * 2),
    },
  };
}

// ─── Main ────────────────────────────────────────────────────────────────────

const SITES = [
  "https://stripe.com", "https://mercury.com", "https://wise.com", "https://linear.app",
  "https://vercel.com", "https://notion.so", "https://github.com", "https://supabase.com",
  "https://tailwindcss.com", "https://nextjs.org", "https://astro.build", "https://vitejs.dev",
  "https://figma.com", "https://framer.com",
  "https://shopify.com", "https://gumroad.com",
  "https://duolingo.com", "https://coursera.org",
  "https://calm.com", "https://headspace.com",
  "https://discord.com", "https://slack.com",
  "https://todoist.com", "https://1password.com",
  "https://arc.net", "https://raycast.com",
  "https://posthog.com", "https://resend.com",
  "https://clerk.com", "https://cal.com",
];

const OUTPUT = "d:/Documents/devsigner/data/seed-analyses.json";

async function main() {
  const chrome = await findChrome();
  if (!chrome) { console.error("Chrome not found"); process.exit(1); }

  console.log(`Chrome: ${chrome}`);
  console.log(`Analyzing ${SITES.length} sites...\n`);

  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });

  const results = [];
  let ok = 0, fail = 0;

  for (let i = 0; i < SITES.length; i++) {
    const url = SITES[i];
    process.stdout.write(`[${i+1}/${SITES.length}] ${url}... `);

    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1440, height: 900 });
      await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36");
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
      await new Promise(r => setTimeout(r, 2500));

      const raw = await extractFromPage(page);
      await page.close();

      const analysis = processAnalysis(url, raw);
      results.push(analysis);
      ok++;
      console.log(`✅ ${analysis.overall.personality} | ${analysis.overall.industry} | ${analysis.colors.unique_count} colors`);
    } catch (e) {
      fail++;
      console.log(`❌ ${e.message.slice(0,60)}`);
    }

    if (i < SITES.length - 1) await new Promise(r => setTimeout(r, 3000));
  }

  await browser.close();

  await mkdir("d:/Documents/devsigner/data", { recursive: true });
  await writeFile(OUTPUT, JSON.stringify(results, null, 2));

  console.log(`\n${"=".repeat(50)}`);
  console.log(`${ok} succeeded, ${fail} failed`);
  console.log(`Saved: ${OUTPUT}`);
}

main().catch(console.error);
