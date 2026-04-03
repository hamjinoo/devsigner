/**
 * Generate before/after demo screenshots.
 * Shows devsigner transforming bad code into good design.
 */

import puppeteer from "puppeteer-core";
import { writeFile, mkdir } from "node:fs/promises";

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

// Bad "developer-made" design
const BAD_HTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; background: #fff; }
</style></head>
<body>
<div style="max-width: 480px; margin: 0 auto; padding: 15px;">
  <div style="background: #333; color: #666; padding: 13px; margin-bottom: 7px;">
    <h1 style="font-size: 15px; font-weight: 300; margin-bottom: 5px;">My SaaS Dashboard</h1>
    <p style="font-size: 11px; color: #999;">Welcome back, user</p>
  </div>
  <div style="display: flex; gap: 9px;">
    <div style="flex:1; background:#f0f0f0; padding:18px; border-radius:3px; border:1px solid #ddd;">
      <p style="font-size:10px; color:#999; margin-bottom:3px;">Revenue</p>
      <p style="font-size:22px; font-weight:800; color:#000;">$12,450</p>
    </div>
    <div style="flex:1; background:#f0f0f0; padding:15px; border-radius:7px; border:1px solid #ddd;">
      <p style="font-size:12px; color:#aaa; margin-bottom:5px;">Users</p>
      <p style="font-size:19px; font-weight:600; color:#000;">1,234</p>
    </div>
    <div style="flex:1; background:#f0f0f0; padding:20px; border-radius:5px; border:1px solid #ddd;">
      <p style="font-size:10px; color:#888; margin-bottom:7px;">Growth</p>
      <p style="font-size:25px; font-weight:900; color:#000;">+23%</p>
    </div>
  </div>
  <div style="margin-top:11px; padding:8px 13px; background:#e74c3c; color:#fff; text-align:center; border-radius:2px; font-size:13px;">
    View Full Report →
  </div>
  <div style="margin-top:15px; padding:13px; border:1px solid #eee;">
    <p style="font-size:13px; color:#333; margin-bottom:9px; font-weight:bold;">Recent Activity</p>
    <div style="font-size:11px; color:#666; padding:5px 0; border-bottom:1px solid #eee;">New signup: john@example.com</div>
    <div style="font-size:11px; color:#666; padding:5px 0; border-bottom:1px solid #eee;">Payment received: $49.00</div>
    <div style="font-size:11px; color:#666; padding:5px 0;">Upgrade: Free → Pro</div>
  </div>
</div>
</body></html>`;

// Good "devsigner-improved" design
const GOOD_HTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Inter, system-ui, -apple-system, sans-serif; background: #fafafa; color: #111; }
</style></head>
<body>
<div style="max-width: 480px; margin: 0 auto; padding: 24px 20px;">
  <div style="margin-bottom: 24px;">
    <p style="font-size: 12px; font-weight: 500; color: #6b7280; letter-spacing: 0.04em; text-transform: uppercase;">Dashboard</p>
    <h1 style="font-size: 24px; font-weight: 700; color: #111; margin-top: 4px; letter-spacing: -0.02em;">Welcome back</h1>
  </div>
  <div style="display: flex; gap: 12px; margin-bottom: 16px;">
    <div style="flex:1; background:#fff; padding:20px; border-radius:16px; border:1px solid #f0f0f0;">
      <p style="font-size:12px; font-weight:500; color:#6b7280; margin-bottom:8px;">Revenue</p>
      <p style="font-size:24px; font-weight:700; color:#111; letter-spacing:-0.02em;">$12,450</p>
      <p style="font-size:12px; color:#22c55e; margin-top:4px;">↑ 12% from last month</p>
    </div>
    <div style="flex:1; background:#fff; padding:20px; border-radius:16px; border:1px solid #f0f0f0;">
      <p style="font-size:12px; font-weight:500; color:#6b7280; margin-bottom:8px;">Users</p>
      <p style="font-size:24px; font-weight:700; color:#111; letter-spacing:-0.02em;">1,234</p>
      <p style="font-size:12px; color:#22c55e; margin-top:4px;">↑ 8% from last month</p>
    </div>
  </div>
  <div style="background:#fff; padding:20px; border-radius:16px; border:1px solid #f0f0f0; margin-bottom:16px;">
    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:4px;">
      <p style="font-size:12px; font-weight:500; color:#6b7280;">Growth</p>
      <span style="font-size:12px; color:#6b7280;">This quarter</span>
    </div>
    <p style="font-size:32px; font-weight:700; color:#111; letter-spacing:-0.03em;">+23%</p>
    <div style="margin-top:12px; height:4px; background:#f0f0f0; border-radius:9999px; overflow:hidden;">
      <div style="width:68%; height:100%; background:linear-gradient(90deg, #3b82f6, #6366f1); border-radius:9999px;"></div>
    </div>
  </div>
  <button style="width:100%; padding:14px; background:#111; color:#fff; border:none; border-radius:12px; font-size:14px; font-weight:600; cursor:pointer; letter-spacing:-0.01em;">
    View Full Report
  </button>
  <div style="margin-top:24px;">
    <p style="font-size:14px; font-weight:600; color:#111; margin-bottom:12px;">Recent Activity</p>
    <div style="background:#fff; border-radius:12px; border:1px solid #f0f0f0; overflow:hidden;">
      <div style="padding:14px 16px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid #f5f5f5;">
        <div>
          <p style="font-size:14px; color:#111;">New signup</p>
          <p style="font-size:12px; color:#6b7280;">john@example.com</p>
        </div>
        <span style="font-size:11px; color:#6b7280;">2m ago</span>
      </div>
      <div style="padding:14px 16px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid #f5f5f5;">
        <div>
          <p style="font-size:14px; color:#111;">Payment received</p>
          <p style="font-size:12px; color:#6b7280;">$49.00 — Pro plan</p>
        </div>
        <span style="font-size:11px; color:#6b7280;">15m ago</span>
      </div>
      <div style="padding:14px 16px; display:flex; align-items:center; justify-content:space-between;">
        <div>
          <p style="font-size:14px; color:#111;">Upgrade</p>
          <p style="font-size:12px; color:#6b7280;">Free → Pro</p>
        </div>
        <span style="font-size:12px; font-weight:500; color:#22c55e; background:#f0fdf4; padding:2px 8px; border-radius:9999px;">Active</span>
      </div>
    </div>
  </div>
</div>
</body></html>`;

async function main() {
  const chrome = await findChrome();
  if (!chrome) { console.error("Chrome not found"); process.exit(1); }

  await mkdir("d:/Documents/devsigner/docs/demo", { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: true,
    args: ["--no-sandbox"],
  });

  // Before screenshot
  const page1 = await browser.newPage();
  await page1.setViewport({ width: 480, height: 800, deviceScaleFactor: 2 });
  await page1.setContent(BAD_HTML, { waitUntil: "domcontentloaded" });
  await new Promise(r => setTimeout(r, 500));
  await page1.screenshot({ path: "d:/Documents/devsigner/docs/demo/before.png", fullPage: true });
  await page1.close();
  console.log("✅ Before screenshot saved");

  // After screenshot
  const page2 = await browser.newPage();
  await page2.setViewport({ width: 480, height: 800, deviceScaleFactor: 2 });
  await page2.setContent(GOOD_HTML, { waitUntil: "domcontentloaded" });
  await new Promise(r => setTimeout(r, 500));
  await page2.screenshot({ path: "d:/Documents/devsigner/docs/demo/after.png", fullPage: true });
  await page2.close();
  console.log("✅ After screenshot saved");

  await browser.close();
  console.log("Done! Screenshots in docs/demo/");
}

main().catch(console.error);
