/**
 * Expand design database with 70 more sites.
 * Appends to existing seed-analyses.json.
 */

import puppeteer from "puppeteer-core";
import { readFile, writeFile, mkdir } from "node:fs/promises";

async function findChrome() {
  const { access } = await import("node:fs/promises");
  const paths = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    process.env.LOCALAPPDATA + "\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  ];
  for (const p of paths) {
    try { await access(p); return p; } catch {}
  }
  return null;
}

async function extractFromPage(page) {
  return await page.evaluate(() => {
    const els = document.querySelectorAll("*");
    const colorMap = {}, bgColors = [], textColors = [];
    const fontMap = {}, sizeMap = {}, weightMap = {}, spacingMap = {}, radiusMap = {}, shadowMap = {};
    const headingTags = new Set(["H1","H2","H3","H4","H5","H6"]);

    for (const el of els) {
      const s = window.getComputedStyle(el);
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;

      const bg = s.backgroundColor, fg = s.color;
      if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") { colorMap[bg] = (colorMap[bg]||0)+1; bgColors.push(bg); }
      if (fg) { colorMap[fg] = (colorMap[fg]||0)+1; textColors.push(fg); }

      const family = s.fontFamily.split(",")[0].trim().replace(/['"]/g,"");
      const size = Math.round(parseFloat(s.fontSize));
      const weight = parseInt(s.fontWeight)||400;
      const isH = headingTags.has(el.tagName);
      if(!fontMap[family]) fontMap[family]={count:0,heading:false,body:false};
      fontMap[family].count++; if(isH) fontMap[family].heading=true; else fontMap[family].body=true;
      if(size>0) sizeMap[size]=(sizeMap[size]||0)+1;
      weightMap[weight]=(weightMap[weight]||0)+1;

      for(const prop of ["marginTop","marginBottom","paddingTop","paddingBottom","paddingLeft","paddingRight","gap"]){
        const v=Math.round(parseFloat(s[prop])); if(v>0&&v<500) spacingMap[v]=(spacingMap[v]||0)+1;
      }
      const rad=Math.round(parseFloat(s.borderRadius)); if(rad>0) radiusMap[rad]=(radiusMap[rad]||0)+1;
      if(s.boxShadow!=="none") shadowMap[s.boxShadow]=(shadowMap[s.boxShadow]||0)+1;
    }
    const mainEl = document.querySelector("main,[role='main'],.container,article");
    return {
      title: document.title,
      colors:{map:colorMap,bg:[...new Set(bgColors)].slice(0,15),text:[...new Set(textColors)].slice(0,15)},
      fonts:fontMap, sizes:sizeMap, weights:weightMap, spacing:spacingMap, radii:radiusMap, shadows:shadowMap,
      layout:{
        maxWidth:Math.round(mainEl?mainEl.getBoundingClientRect().width:document.body.getBoundingClientRect().width),
        viewportWidth:window.innerWidth,
        hasSidebar:!!document.querySelector("aside,[class*='sidebar']"),
        hasHero:!!document.querySelector("[class*='hero'],header+section"),
        hasStickyHeader:Array.from(document.querySelectorAll("header,nav")).some(e=>{const p=window.getComputedStyle(e).position;return p==="sticky"||p==="fixed"}),
        hasFooter:!!document.querySelector("footer"),
      },
    };
  });
}

function rgbToHex(str){const m=str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);if(!m)return null;return"#"+[m[1],m[2],m[3]].map(x=>parseInt(x).toString(16).padStart(2,"0")).join("");}

function processAnalysis(url, raw) {
  const colorEntries=Object.entries(raw.colors.map).sort((a,b)=>b[1]-a[1]);
  const total=colorEntries.reduce((s,[,c])=>s+c,0);
  const palette=colorEntries.slice(0,15).map(([c,count])=>({hex:rgbToHex(c)||c,count,pct:Math.round(count/total*100)}));
  const bgHex=raw.colors.bg.map(c=>rgbToHex(c)).filter(Boolean);
  const dominantBg=bgHex[0]||"#ffffff";
  const bgR=parseInt(dominantBg.slice(1,3),16)||0,bgG=parseInt(dominantBg.slice(3,5),16)||0,bgB=parseInt(dominantBg.slice(5,7),16)||0;
  const luminance=(bgR*0.299+bgG*0.587+bgB*0.114)/255;
  const colorScheme=luminance<0.3?"dark":luminance>0.7?"light":"mixed";

  const fonts=Object.entries(raw.fonts).map(([f,d])=>({family:f,count:d.count,heading:d.heading,body:d.body})).sort((a,b)=>b.count-a.count);
  const sizes=Object.entries(raw.sizes).map(([s,c])=>({px:parseInt(s),count:c})).sort((a,b)=>b.px-a.px);
  const spacingVals=Object.entries(raw.spacing).map(([v,c])=>({px:parseInt(v),count:c})).sort((a,b)=>b.count-a.count);
  const totalS=spacingVals.reduce((s,v)=>s+v.count,0);
  const gridAligned=spacingVals.filter(v=>v.px%4===0).reduce((s,v)=>s+v.count,0);
  const avgSpacing=totalS>0?spacingVals.reduce((s,v)=>s+v.px*v.count,0)/totalS:16;
  const density=avgSpacing>24?"spacious":avgSpacing<12?"compact":"balanced";

  const radii=Object.entries(raw.radii).map(([r,c])=>({px:parseInt(r),count:c})).sort((a,b)=>b.count-a.count);
  const avgRadius=radii.length>0?radii.reduce((s,r)=>s+r.px*r.count,0)/radii.reduce((s,r)=>s+r.count,0):0;
  const cornerStyle=avgRadius<2?"sharp":avgRadius<6?"subtle":avgRadius<16?"rounded":"pill";
  const shadowCount=Object.values(raw.shadows).reduce((s,c)=>s+c,0);
  const shadowStyle=shadowCount===0?"none":"subtle";

  // Scoring personality
  const sc={"Bold Minimal":0,"Warm Professional":0,"Energetic Pop":0,"Elegant Editorial":0,"Data Dense":0,"Soft Wellness":0};
  if(colorScheme==="dark")sc["Bold Minimal"]+=3; if(shadowStyle==="none")sc["Bold Minimal"]+=2; if(palette.length<8)sc["Bold Minimal"]+=2; if(cornerStyle==="sharp"||cornerStyle==="subtle")sc["Bold Minimal"]+=1; if(density==="spacious")sc["Bold Minimal"]+=2;
  if(colorScheme==="light")sc["Warm Professional"]+=3; if(shadowStyle==="subtle")sc["Warm Professional"]+=2; if(cornerStyle==="rounded")sc["Warm Professional"]+=2; if(density==="balanced")sc["Warm Professional"]+=1;
  if(palette.length>15)sc["Energetic Pop"]+=3; if(cornerStyle==="pill")sc["Energetic Pop"]+=2; if(shadowStyle==="dramatic")sc["Energetic Pop"]+=2;
  if(fonts.some(f=>f.family.toLowerCase().includes("serif")&&f.heading))sc["Elegant Editorial"]+=4; if(shadowStyle==="none")sc["Elegant Editorial"]+=2; if(density==="spacious")sc["Elegant Editorial"]+=2;
  if(density==="compact")sc["Data Dense"]+=3; if(shadowStyle==="none")sc["Data Dense"]+=2; if(palette.length<6)sc["Data Dense"]+=2;
  if(cornerStyle==="pill")sc["Soft Wellness"]+=3; if(shadowStyle==="subtle")sc["Soft Wellness"]+=2; if(density==="spacious")sc["Soft Wellness"]+=2; if(colorScheme==="light")sc["Soft Wellness"]+=1;
  const personality=Object.entries(sc).sort((a,b)=>b[1]-a[1])[0][0];

  // Industry
  const dm={"stripe.com":"fintech","wise.com":"fintech","mercury.com":"fintech","revolut.com":"fintech","plaid.com":"fintech","brex.com":"fintech","ramp.com":"fintech","github.com":"developer_tools","vercel.com":"developer_tools","supabase.com":"developer_tools","tailwindcss.com":"developer_tools","nextjs.org":"developer_tools","astro.build":"developer_tools","vitejs.dev":"developer_tools","posthog.com":"developer_tools","resend.com":"developer_tools","clerk.com":"developer_tools","railway.app":"developer_tools","render.com":"developer_tools","planetscale.com":"developer_tools","turso.tech":"developer_tools","neon.tech":"developer_tools","deno.com":"developer_tools","bun.sh":"developer_tools","figma.com":"design_tools","framer.com":"design_tools","canva.com":"design_tools","webflow.com":"design_tools","shopify.com":"ecommerce","gumroad.com":"ecommerce","lemonsqueezy.com":"ecommerce","duolingo.com":"education","coursera.org":"education","calm.com":"healthcare","headspace.com":"healthcare","discord.com":"social","slack.com":"social","notion.so":"saas","linear.app":"saas","todoist.com":"saas","1password.com":"saas","arc.net":"saas","cal.com":"saas","raycast.com":"developer_tools","loom.com":"saas","airtable.com":"saas","retool.com":"saas","zapier.com":"saas","intercom.com":"saas","hubspot.com":"saas","mailchimp.com":"saas","twilio.com":"developer_tools","algolia.com":"developer_tools","sentry.io":"developer_tools","datadog.com":"developer_tools","segment.com":"developer_tools","amplitude.com":"saas","mixpanel.com":"saas"};
  let industry="general";
  for(const[d,i]of Object.entries(dm)){if(url.includes(d)){industry=i;break;}}

  return{url,analyzed_at:new Date().toISOString(),page_title:raw.title,
    colors:{palette:palette.slice(0,10),dominant_bg:dominantBg,color_scheme:colorScheme,unique_count:palette.length},
    typography:{fonts:fonts.slice(0,5),sizes:sizes.slice(0,8),heading_font:fonts.find(f=>f.heading)?.family||fonts[0]?.family,body_font:fonts.find(f=>f.body)?.family||fonts[0]?.family},
    spacing:{top_values:spacingVals.slice(0,10),grid_aligned_pct:totalS>0?Math.round(gridAligned/totalS*100):0,density,unique_count:spacingVals.length},
    layout:raw.layout,
    shapes:{corner_style:cornerStyle,shadow_style:shadowStyle,top_radii:radii.slice(0,5)},
    overall:{personality,industry,complexity:Math.min(100,palette.length*3+sizes.length*5+spacingVals.length*2)}};
}

const EXTRA_SITES = [
  // Dev Tools
  "https://railway.app", "https://render.com", "https://neon.tech", "https://turso.tech",
  "https://deno.com", "https://bun.sh", "https://sentry.io",
  // SaaS
  "https://loom.com", "https://airtable.com", "https://retool.com", "https://zapier.com",
  "https://intercom.com", "https://amplitude.com", "https://mixpanel.com",
  // Design
  "https://webflow.com", "https://canva.com",
  // Fintech
  "https://revolut.com", "https://plaid.com", "https://brex.com", "https://ramp.com",
  // Ecommerce
  "https://lemonsqueezy.com",
  // Well-designed sites
  "https://monzo.com", "https://pitch.com", "https://rows.com", "https://cron.com",
  "https://craft.do", "https://things3.com", "https://bear.app", "https://superhuman.com",
  "https://hey.com", "https://basecamp.com", "https://twist.com",
  "https://www.producthunt.com", "https://dribbble.com", "https://behance.net",
  "https://awwwards.com", "https://httpie.io", "https://insomnia.rest",
  "https://warp.dev", "https://fig.io", "https://iterm2.com",
  "https://hyper.is", "https://kitty.app",
  // Startups with good design
  "https://liveblocks.io", "https://convex.dev", "https://upstash.com",
  "https://inngest.com", "https://trigger.dev", "https://unkey.dev",
  "https://axiom.co", "https://tinybird.co", "https://grafbase.com",
];

const OUTPUT = "d:/Documents/devsigner/data/seed-analyses.json";

async function main() {
  const chrome = await findChrome();
  if (!chrome) { console.error("Chrome not found"); process.exit(1); }

  // Load existing
  let existing = [];
  try { existing = JSON.parse(await readFile(OUTPUT, "utf-8")); } catch {}
  const existingUrls = new Set(existing.map(e => e.url));

  // Filter out already analyzed
  const toAnalyze = EXTRA_SITES.filter(u => !existingUrls.has(u));
  console.log(`Chrome: ${chrome}`);
  console.log(`${toAnalyze.length} new sites to analyze (${existing.length} existing)\n`);

  const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ["--no-sandbox","--disable-setuid-sandbox","--disable-gpu"] });
  const results = [...existing];
  let ok = 0, fail = 0;

  for (let i = 0; i < toAnalyze.length; i++) {
    const url = toAnalyze[i];
    process.stdout.write(`[${i+1}/${toAnalyze.length}] ${url}... `);
    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1440, height: 900 });
      await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36");
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
      await new Promise(r => setTimeout(r, 2000));
      const raw = await extractFromPage(page);
      await page.close();
      const analysis = processAnalysis(url, raw);
      results.push(analysis);
      ok++;
      console.log(`✅ ${analysis.overall.personality} | ${analysis.overall.industry}`);
    } catch (e) {
      fail++;
      console.log(`❌ ${e.message.slice(0,50)}`);
    }
    if (i < toAnalyze.length - 1) await new Promise(r => setTimeout(r, 2500));
  }

  await browser.close();
  await writeFile(OUTPUT, JSON.stringify(results, null, 2));
  console.log(`\n${ok} succeeded, ${fail} failed. Total: ${results.length} sites.`);
}

main().catch(console.error);
