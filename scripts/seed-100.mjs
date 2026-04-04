/**
 * Add 20 more sites to reach 100+ total.
 * Focuses on award-winning and highly-designed sites.
 */
import puppeteer from "puppeteer-core";
import { readFile, writeFile, mkdir } from "node:fs/promises";

async function findChrome() {
  const { access } = await import("node:fs/promises");
  for (const p of [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Users\\jinwoo\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  ]) { try { await access(p); return p; } catch {} }
  return null;
}

async function extract(page) {
  return await page.evaluate(() => {
    const els = document.querySelectorAll("*");
    const cm={},bg=[],tx=[],fm={},sz={},wt={},sp={},rd={},sh={};
    const HT = new Set(["H1","H2","H3","H4","H5","H6"]);
    for (const el of els) {
      const s=window.getComputedStyle(el),r=el.getBoundingClientRect();
      if(!r.width&&!r.height) continue;
      const b=s.backgroundColor,f=s.color;
      if(b&&b!=="rgba(0, 0, 0, 0)"&&b!=="transparent"){cm[b]=(cm[b]||0)+1;bg.push(b)}
      if(f){cm[f]=(cm[f]||0)+1;tx.push(f)}
      const fam=s.fontFamily.split(",")[0].trim().replace(/['"]/g,"");
      const si=Math.round(parseFloat(s.fontSize)),w=parseInt(s.fontWeight)||400;
      if(!fm[fam])fm[fam]={c:0,h:false,b:false};fm[fam].c++;
      if(HT.has(el.tagName))fm[fam].h=true;else fm[fam].b=true;
      if(si>0)sz[si]=(sz[si]||0)+1;wt[w]=(wt[w]||0)+1;
      for(const p of["marginTop","marginBottom","paddingTop","paddingBottom","paddingLeft","paddingRight","gap"]){
        const v=Math.round(parseFloat(s[p]));if(v>0&&v<500)sp[v]=(sp[v]||0)+1}
      const ra=Math.round(parseFloat(s.borderRadius));if(ra>0)rd[ra]=(rd[ra]||0)+1;
      if(s.boxShadow!=="none")sh[s.boxShadow]=(sh[s.boxShadow]||0)+1;
    }
    const m=document.querySelector("main,[role='main'],.container,article");
    return{title:document.title,colors:{map:cm,bg:[...new Set(bg)].slice(0,15),text:[...new Set(tx)].slice(0,15)},
      fonts:fm,sizes:sz,weights:wt,spacing:sp,radii:rd,shadows:sh,
      layout:{maxWidth:Math.round(m?m.getBoundingClientRect().width:document.body.getBoundingClientRect().width),
        viewportWidth:window.innerWidth,
        hasSidebar:!!document.querySelector("aside,[class*='sidebar']"),
        hasHero:!!document.querySelector("[class*='hero'],header+section"),
        hasStickyHeader:Array.from(document.querySelectorAll("header,nav")).some(e=>{const p=window.getComputedStyle(e).position;return p==="sticky"||p==="fixed"}),
        hasFooter:!!document.querySelector("footer")}};
  });
}

function hex(s){const m=s.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);if(!m)return null;return"#"+[m[1],m[2],m[3]].map(x=>parseInt(x).toString(16).padStart(2,"0")).join("")}

function process(url, raw) {
  const ce=Object.entries(raw.colors.map).sort((a,b)=>b[1]-a[1]);
  const t=ce.reduce((s,[,c])=>s+c,0);
  const pl=ce.slice(0,15).map(([c,n])=>({hex:hex(c)||c,count:n,pct:Math.round(n/t*100)}));
  const bh=raw.colors.bg.map(c=>hex(c)).filter(Boolean);
  const db=bh[0]||"#ffffff";
  const R=parseInt(db.slice(1,3),16)||0,G=parseInt(db.slice(3,5),16)||0,B=parseInt(db.slice(5,7),16)||0;
  const l=(R*0.299+G*0.587+B*0.114)/255;
  const cs=l<0.3?"dark":l>0.7?"light":"mixed";
  const fo=Object.entries(raw.fonts).map(([f,d])=>({family:f,count:d.c,heading:d.h,body:d.b})).sort((a,b)=>b.count-a.count);
  const si=Object.entries(raw.sizes).map(([s,c])=>({px:parseInt(s),count:c})).sort((a,b)=>b.px-a.px);
  const sv=Object.entries(raw.spacing).map(([v,c])=>({px:parseInt(v),count:c})).sort((a,b)=>b.count-a.count);
  const ts=sv.reduce((s,v)=>s+v.count,0);
  const ga=sv.filter(v=>v.px%4===0).reduce((s,v)=>s+v.count,0);
  const as=ts>0?sv.reduce((s,v)=>s+v.px*v.count,0)/ts:16;
  const dn=as>24?"spacious":as<12?"compact":"balanced";
  const ra=Object.entries(raw.radii).map(([r,c])=>({px:parseInt(r),count:c})).sort((a,b)=>b.count-a.count);
  const ar=ra.length>0?ra.reduce((s,r)=>s+r.px*r.count,0)/ra.reduce((s,r)=>s+r.count,0):0;
  const co=ar<2?"sharp":ar<6?"subtle":ar<16?"rounded":"pill";
  const sc=Object.values(raw.shadows).reduce((s,c)=>s+c,0);
  const ss=sc===0?"none":"subtle";
  const scores={"Bold Minimal":0,"Warm Professional":0,"Energetic Pop":0,"Elegant Editorial":0,"Data Dense":0,"Soft Wellness":0};
  if(cs==="dark")scores["Bold Minimal"]+=3;if(ss==="none")scores["Bold Minimal"]+=2;if(pl.length<8)scores["Bold Minimal"]+=2;if(co==="sharp"||co==="subtle")scores["Bold Minimal"]+=1;if(dn==="spacious")scores["Bold Minimal"]+=2;
  if(cs==="light")scores["Warm Professional"]+=3;if(ss==="subtle")scores["Warm Professional"]+=2;if(co==="rounded")scores["Warm Professional"]+=2;if(dn==="balanced")scores["Warm Professional"]+=1;
  if(pl.length>15)scores["Energetic Pop"]+=3;if(co==="pill")scores["Energetic Pop"]+=2;if(ss==="dramatic")scores["Energetic Pop"]+=2;
  if(fo.some(f=>f.family.toLowerCase().includes("serif")&&f.heading))scores["Elegant Editorial"]+=4;if(ss==="none")scores["Elegant Editorial"]+=2;if(dn==="spacious")scores["Elegant Editorial"]+=2;
  if(dn==="compact")scores["Data Dense"]+=3;if(ss==="none")scores["Data Dense"]+=2;if(pl.length<6)scores["Data Dense"]+=2;
  if(co==="pill")scores["Soft Wellness"]+=3;if(ss==="subtle")scores["Soft Wellness"]+=2;if(dn==="spacious")scores["Soft Wellness"]+=2;if(cs==="light")scores["Soft Wellness"]+=1;
  const pe=Object.entries(scores).sort((a,b)=>b[1]-a[1])[0][0];
  const dm={"stripe.com":"fintech","linear.app":"saas","notion.so":"saas","vercel.com":"developer_tools","github.com":"developer_tools","figma.com":"design_tools","framer.com":"design_tools","shopify.com":"ecommerce","airbnb.com":"ecommerce","spotify.com":"entertainment","netflix.com":"entertainment","twitch.tv":"entertainment","medium.com":"media","substack.com":"media","openai.com":"ai","anthropic.com":"ai","midjourney.com":"ai","replicate.com":"ai","huggingface.co":"ai","vercel.com":"developer_tools","railway.app":"developer_tools","fly.io":"developer_tools","cloudflare.com":"developer_tools","digitalocean.com":"developer_tools","aws.amazon.com":"developer_tools","firebase.google.com":"developer_tools"};
  let ind="general";for(const[d,i]of Object.entries(dm)){if(url.includes(d)){ind=i;break}}
  return{url,analyzed_at:new Date().toISOString(),page_title:raw.title,colors:{palette:pl.slice(0,10),dominant_bg:db,color_scheme:cs,unique_count:pl.length},typography:{fonts:fo.slice(0,5),sizes:si.slice(0,8),heading_font:fo.find(f=>f.heading)?.family||fo[0]?.family,body_font:fo.find(f=>f.body)?.family||fo[0]?.family},spacing:{top_values:sv.slice(0,10),grid_aligned_pct:ts>0?Math.round(ga/ts*100):0,density:dn,unique_count:sv.length},layout:raw.layout,shapes:{corner_style:co,shadow_style:ss,top_radii:ra.slice(0,5)},overall:{personality:pe,industry:ind,complexity:Math.min(100,pl.length*3+si.length*5+sv.length*2)}};
}

const SITES = [
  "https://airbnb.com", "https://spotify.com", "https://medium.com",
  "https://substack.com", "https://openai.com", "https://anthropic.com",
  "https://replicate.com", "https://huggingface.co",
  "https://fly.io", "https://cloudflare.com", "https://digitalocean.com",
  "https://firebase.google.com",
  "https://twitch.tv", "https://pinterest.com",
  "https://dropbox.com", "https://zoom.us", "https://figma.com/community",
  "https://linear.app/changelog", "https://vercel.com/templates",
  "https://tailwindui.com",
];

const OUTPUT = "d:/Documents/devsigner/data/seed-analyses.json";

async function main() {
  const chrome = await findChrome();
  if(!chrome){console.error("No Chrome");process.exit(1)}
  let existing=[];try{existing=JSON.parse(await readFile(OUTPUT,"utf-8"))}catch{}
  const urls=new Set(existing.map(e=>e.url));
  const todo=SITES.filter(u=>!urls.has(u));
  console.log(`${todo.length} new (${existing.length} existing)\n`);
  const browser=await puppeteer.launch({executablePath:chrome,headless:true,args:["--no-sandbox","--disable-setuid-sandbox"]});
  const results=[...existing];let ok=0,fail=0;
  for(let i=0;i<todo.length;i++){
    const url=todo[i];console.log(`[${i+1}/${todo.length}] ${url}... `);
    try{const p=await browser.newPage();await p.setViewport({width:1440,height:900});
      await p.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36");
      await p.goto(url,{waitUntil:"domcontentloaded",timeout:15000});await new Promise(r=>setTimeout(r,2000));
      const raw=await extract(p);await p.close();const a=process(url,raw);results.push(a);ok++;
      console.log(`✅ ${a.overall.personality} | ${a.overall.industry}`);
    }catch(e){fail++;console.log(`❌ ${e.message.slice(0,50)}`)}
    if(i<todo.length-1)await new Promise(r=>setTimeout(r,2500));
  }
  await browser.close();await writeFile(OUTPUT,JSON.stringify(results,null,2));
  console.log(`\n${ok} ok, ${fail} fail. Total: ${results.length}`);
}
main().catch(console.error);
