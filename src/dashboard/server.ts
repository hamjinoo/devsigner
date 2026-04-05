import http from "node:http";
import { exec } from "node:child_process";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { collectDashboardData } from "./collector.js";
import { renderDashboard } from "./template.js";
import { transformAndRender } from "../pipeline/transform.js";
import { designTransform } from "../generator/transform.js";

function openBrowser(url: string): void {
  const platform = process.platform;
  let command: string;
  if (platform === "win32") {
    command = `start "" "${url}"`;
  } else if (platform === "darwin") {
    command = `open "${url}"`;
  } else {
    command = `xdg-open "${url}"`;
  }
  exec(command, () => {});
}

function parseQuery(url: string): Record<string, string> {
  const idx = url.indexOf("?");
  if (idx === -1) return {};
  const params: Record<string, string> = {};
  for (const pair of url.slice(idx + 1).split("&")) {
    const [k, v] = pair.split("=");
    if (k) params[decodeURIComponent(k)] = decodeURIComponent(v ?? "");
  }
  return params;
}

function renderTransformPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>devsigner — Design Transform</title>
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --bg: #0f0f13; --surface: #1a1a21; --surface2: #22222b;
  --border: #2a2a35; --text: #e4e4e7; --text2: #a1a1aa; --text3: #71717a;
  --accent: #8b5cf6; --radius: 12px;
}
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; }
.container { max-width: 1400px; margin: 0 auto; padding: 32px 24px; }
.logo { font-size: 24px; font-weight: 700; letter-spacing: -0.5px; margin-bottom: 8px; }
.logo span { color: var(--accent); }
.subtitle { color: var(--text3); font-size: 14px; margin-bottom: 32px; }
.layout { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
.panel { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
.panel-header { padding: 12px 16px; background: var(--surface2); border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
.panel-title { font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text2); }
.panel-body { padding: 16px; }
textarea { width: 100%; height: 400px; background: var(--bg); color: var(--text); border: 1px solid var(--border); border-radius: 8px; padding: 16px; font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: 13px; line-height: 1.6; resize: vertical; outline: none; }
textarea:focus { border-color: var(--accent); }
.controls { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
select, .ctrl-btn { padding: 8px 16px; background: var(--surface2); color: var(--text); border: 1px solid var(--border); border-radius: 8px; font-size: 13px; font-family: inherit; cursor: pointer; }
select:focus { border-color: var(--accent); outline: none; }
.ctrl-btn { background: var(--accent); color: #fff; border: none; font-weight: 600; transition: opacity 0.15s; }
.ctrl-btn:hover { opacity: 0.85; }
.ctrl-btn:disabled { opacity: 0.4; cursor: wait; }
.result { display: none; margin-top: 24px; }
.result.visible { display: block; }
.compare { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
.compare-side { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
.compare-label { padding: 8px 12px; font-size: 12px; font-weight: 600; color: var(--text2); background: var(--surface2); text-transform: uppercase; letter-spacing: 0.5px; text-align: center; }
.compare-side img { width: 100%; display: block; }
.info { padding: 16px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); }
.info p { color: var(--text2); font-size: 13px; margin-bottom: 8px; }
.info strong { color: var(--text); }
.tokens { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.token { display: flex; align-items: center; gap: 6px; padding: 4px 10px; background: var(--surface2); border-radius: 6px; font-size: 11px; font-family: monospace; color: var(--text2); }
.token-swatch { width: 14px; height: 14px; border-radius: 4px; border: 1px solid var(--border); }
.loading { display: none; align-items: center; justify-content: center; gap: 12px; padding: 60px; color: var(--text3); }
.loading.visible { display: flex; }
.spinner { width: 20px; height: 20px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.back { color: var(--accent); text-decoration: none; font-size: 13px; display: inline-block; margin-bottom: 16px; }
</style>
</head>
<body>
<div class="container">
  <a href="/" class="back">&larr; Back to Dashboard</a>
  <div class="logo">dev<span>signer</span> Transform</div>
  <div class="subtitle">Paste your UI code. Get a beautiful design.</div>

  <div class="controls">
    <select id="mood">
      <option value="neutral">Neutral</option>
      <option value="warm">Warm</option>
      <option value="cool">Cool</option>
      <option value="bold">Bold</option>
      <option value="soft">Soft</option>
    </select>
    <select id="industry">
      <option value="">Auto-detect</option>
      <option value="saas">SaaS</option>
      <option value="fintech">Fintech</option>
      <option value="ecommerce">E-commerce</option>
      <option value="developer_tools">Developer Tools</option>
      <option value="healthcare">Healthcare</option>
      <option value="education">Education</option>
    </select>
    <button class="ctrl-btn" id="transformBtn" onclick="runTransform()">Transform Design</button>
  </div>

  <div style="margin-top: 16px;">
    <textarea id="codeInput" placeholder="Paste your HTML / React / Vue code here...

Example:
<div class='hero'>
  <h1>Build Better Apps</h1>
  <p>The fastest way to ship products.</p>
  <button>Get Started</button>
</div>"></textarea>
  </div>

  <div class="loading" id="loading">
    <div class="spinner"></div>
    Generating design...
  </div>

  <div class="result" id="result">
    <div class="compare">
      <div class="compare-side">
        <div class="compare-label">Before</div>
        <img id="beforeImg" src="" alt="Before">
      </div>
      <div class="compare-side">
        <div class="compare-label">After — devsigner</div>
        <img id="afterImg" src="" alt="After">
      </div>
    </div>
    <div class="info" id="info"></div>
  </div>
</div>

<script>
async function runTransform() {
  var code = document.getElementById('codeInput').value.trim();
  if (!code) return;

  var btn = document.getElementById('transformBtn');
  var loading = document.getElementById('loading');
  var result = document.getElementById('result');

  btn.disabled = true;
  btn.textContent = 'Transforming...';
  loading.classList.add('visible');
  result.classList.remove('visible');

  try {
    var res = await fetch('/api/transform-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: code,
        mood: document.getElementById('mood').value,
        industry: document.getElementById('industry').value || undefined,
      }),
    });
    var data = await res.json();

    if (data.error) {
      alert('Error: ' + data.error);
      return;
    }

    document.getElementById('beforeImg').src = 'data:image/png;base64,' + data.beforeImage;
    document.getElementById('afterImg').src = 'data:image/png;base64,' + data.afterImage;

    var tokensHtml = Object.entries(data.tokens || {}).map(function(entry) {
      var isColor = entry[1].startsWith('#');
      var swatch = isColor ? '<div class="token-swatch" style="background:' + entry[1] + '"></div>' : '';
      return '<div class="token">' + swatch + entry[0].replace('--ds-', '') + ': ' + entry[1] + '</div>';
    }).join('');

    document.getElementById('info').innerHTML =
      '<p><strong>Page type:</strong> ' + (data.pageType || 'unknown') + '</p>' +
      '<p><strong>Design:</strong> ' + (data.description || '') + '</p>' +
      '<div class="tokens">' + tokensHtml + '</div>';

    result.classList.add('visible');
  } catch (err) {
    alert('Failed: ' + (err.message || err));
  } finally {
    btn.disabled = false;
    btn.textContent = 'Transform Design';
    loading.classList.remove('visible');
  }
}
</script>
</body>
</html>`;
}

export async function startDashboard(projectPath: string, port = 4567): Promise<void> {
  console.log(`\n  devsigner dashboard\n`);
  console.log(`  Scanning ${projectPath} ...\n`);

  const startTime = Date.now();
  let data = await collectDashboardData(projectPath);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`  Done in ${elapsed}s — ${data.totalFiles} files, score ${data.overallScore}/100\n`);

  let html = renderDashboard(data);

  const server = http.createServer(async (req, res) => {
    const url = req.url ?? "/";
    const pathname = url.split("?")[0];

    // API: full data
    if (pathname === "/api/data") {
      res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-cache" });
      res.end(JSON.stringify(data));
      return;
    }

    // API: rescan
    if (pathname === "/api/rescan") {
      console.log("  Rescanning...");
      try {
        data = await collectDashboardData(projectPath);
        html = renderDashboard(data);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ score: data.overallScore, files: data.totalFiles }));
        console.log(`  Rescan complete — score ${data.overallScore}/100`);
      } catch (err) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end(String(err));
      }
      return;
    }

    // API: transform a live URL
    if (pathname === "/api/transform-url") {
      const query = parseQuery(url);
      const siteUrl = query.url;
      const mood = query.mood ?? "neutral";

      if (!siteUrl) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Missing ?url= parameter" }));
        return;
      }

      console.log(`  Transforming URL: ${siteUrl} (mood: ${mood})`);

      try {
        const puppeteer = await import("puppeteer-core");
        const { findChrome } = await import("../tools/render-and-review.js");
        const chromePath = await findChrome();
        if (!chromePath) throw new Error("Chrome not found");

        const browser = await puppeteer.default.launch({
          executablePath: chromePath,
          headless: true,
          args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });
        await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
        await page.goto(siteUrl, { waitUntil: "domcontentloaded", timeout: 20000 });
        await new Promise((r) => setTimeout(r, 2000));

        // Screenshot BEFORE
        const beforeScreenshot = (await page.screenshot({ type: "png", encoding: "base64" })) as string;

        // Generate design system tokens
        const { generateDesignSystem } = await import("../generator/design-system.js");
        const ds = generateDesignSystem({
          mood: mood as "warm" | "cool" | "neutral" | "bold" | "soft",
        });

        // DIRECT STYLE INJECTION: walk every element and override visual properties
        // This keeps layout + content + images intact, only changes appearance
        await page.evaluate((tokens) => {
          const allElements = document.querySelectorAll("*");
          const s = (el: HTMLElement, prop: string, val: string) =>
            el.style.setProperty(prop, val, "important");

          for (const el of Array.from(allElements) as HTMLElement[]) {
            const tag = el.tagName.toLowerCase();
            const computed = window.getComputedStyle(el);

            // Font family for all text
            if (computed.fontFamily) {
              s(el, "font-family", "'Inter', -apple-system, sans-serif");
            }

            // Text color (not on images/svgs)
            if (tag !== "img" && tag !== "svg" && tag !== "video" && tag !== "canvas") {
              const currentColor = computed.color;
              if (currentColor) {
                // Keep it proportional — dark text stays dark, light text stays light
                const match = currentColor.match(/\d+/g);
                if (match) {
                  const [r, g, b] = match.map(Number);
                  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
                  if (luminance < 0.3) {
                    s(el, "color", tokens.text);
                  } else if (luminance > 0.7) {
                    s(el, "color", tokens.textLight || "#ffffff");
                  } else {
                    s(el, "color", tokens.textSecondary);
                  }
                }
              }
            }

            // Background color — keep proportional
            const bgColor = computed.backgroundColor;
            if (bgColor && bgColor !== "rgba(0, 0, 0, 0)" && bgColor !== "transparent") {
              const match = bgColor.match(/\d+/g);
              if (match) {
                const [r, g, b] = match.map(Number);
                const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
                if (luminance > 0.9) {
                  s(el, "background-color", tokens.bg);
                } else if (luminance > 0.7) {
                  s(el, "background-color", tokens.surface);
                } else if (luminance < 0.2) {
                  s(el, "background-color", tokens.dark);
                } else {
                  // Mid-tone backgrounds → use primary
                  s(el, "background-color", tokens.primary);
                }
              }
            }

            // Border radius
            const radius = parseFloat(computed.borderRadius);
            if (radius > 0) {
              s(el, "border-radius", tokens.radius);
            }

            // Border color
            if (computed.borderColor && computed.borderStyle !== "none" && computed.borderWidth !== "0px") {
              s(el, "border-color", tokens.border);
            }

            // Headings — adjust size and weight
            if (tag === "h1") {
              s(el, "font-weight", "800");
              s(el, "letter-spacing", "-0.03em");
            } else if (tag === "h2") {
              s(el, "font-weight", "700");
              s(el, "letter-spacing", "-0.02em");
            } else if (tag === "h3" || tag === "h4") {
              s(el, "font-weight", "600");
            }

            // Buttons
            if (tag === "button" || tag === "a" && el.getAttribute("role") === "button") {
              s(el, "border-radius", tokens.radius);
              s(el, "font-weight", "500");
              s(el, "transition", "all 0.15s ease");
            }

            // Links
            if (tag === "a" && el.getAttribute("role") !== "button") {
              s(el, "color", tokens.primary);
              s(el, "text-decoration", "none");
            }

            // Box shadows — standardize
            if (computed.boxShadow && computed.boxShadow !== "none") {
              s(el, "box-shadow", tokens.shadow);
            }
          }
        }, {
          text: ds.tokens["--ds-text"],
          textSecondary: ds.tokens["--ds-text-secondary"],
          textLight: "#ffffff",
          bg: ds.tokens["--ds-bg"],
          surface: ds.tokens["--ds-surface"],
          dark: ds.tokens["--ds-text"],
          primary: ds.tokens["--ds-primary"],
          border: ds.tokens["--ds-border"],
          radius: ds.tokens["--ds-radius"],
          shadow: ds.tokens["--ds-shadow-md"],
        });

        // Wait for reflow
        await new Promise((r) => setTimeout(r, 500));

        // Screenshot AFTER
        const afterScreenshot = (await page.screenshot({ type: "png", encoding: "base64" })) as string;

        await browser.close();

        const result = {
          afterScreenshot,
          designSystem: ds,
          pageType: "unknown",
        };

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          url: siteUrl,
          pageType: result.pageType,
          description: result.designSystem.description,
          beforeImage: beforeScreenshot,
          afterImage: result.afterScreenshot,
          tokens: result.designSystem.tokens,
        }));
        console.log(`  URL transform done: ${siteUrl}`);
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: String(err) }));
      }
      return;
    }

    // API: before/after preview
    if (pathname === "/api/preview") {
      const query = parseQuery(url);
      const file = query.file;
      if (!file) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Missing ?file= parameter" }));
        return;
      }

      const filePath = resolve(data.projectPath, file);
      console.log(`  Rendering preview: ${file}`);

      try {
        const code = await readFile(filePath, "utf-8");
        const result = await transformAndRender(code);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          file,
          scoreBefore: result.scoreBefore,
          scoreAfter: result.scoreAfter,
          beforeImage: result.beforeScreenshot,
          afterImage: result.afterScreenshot,
          fixes: result.fixes,
          fixedCode: result.fixedCode,
        }));
        console.log(`  Preview done: ${file} (${result.scoreBefore} → ${result.scoreAfter})`);
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: String(err) }));
      }
      return;
    }

    // API: design transform (full redesign)
    if (pathname === "/api/transform") {
      const query = parseQuery(url);
      const file = query.file;
      const mood = query.mood ?? "neutral";
      const industry = query.industry;

      if (!file) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Missing ?file= parameter" }));
        return;
      }

      const filePath = resolve(data.projectPath, file);
      console.log(`  Transforming design: ${file} (mood: ${mood})`);

      try {
        const code = await readFile(filePath, "utf-8");
        const result = await designTransform(code, {
          industry,
          mood: mood as "warm" | "cool" | "neutral" | "bold" | "soft",
        });

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          file,
          pageType: result.pageType,
          description: result.designSystem.description,
          beforeImage: result.beforeScreenshot,
          afterImage: result.afterScreenshot,
          tokens: result.designSystem.tokens,
        }));
        console.log(`  Transform done: ${file} → ${result.designSystem.description}`);
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: String(err) }));
      }
      return;
    }

    // API: transform code directly (POST)
    if (pathname === "/api/transform-code" && req.method === "POST") {
      let body = "";
      req.on("data", (chunk: Buffer) => { body += chunk.toString(); });
      req.on("end", async () => {
        try {
          const { code, mood, industry } = JSON.parse(body);
          if (!code) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Missing code" }));
            return;
          }
          console.log(`  Transforming code (${code.length} chars, mood: ${mood ?? "neutral"})`);
          const result = await designTransform(code, {
            industry,
            mood: mood ?? "neutral",
          });
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({
            pageType: result.pageType,
            description: result.designSystem.description,
            beforeImage: result.beforeScreenshot,
            afterImage: result.afterScreenshot,
            tokens: result.designSystem.tokens,
          }));
          console.log(`  Transform done: ${result.pageType}`);
        } catch (err) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: String(err) }));
        }
      });
      return;
    }

    // Transform playground page
    if (pathname === "/transform") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(renderTransformPage());
      return;
    }

    // Dashboard HTML
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache" });
    res.end(html);
  });

  server.listen(port, () => {
    const url = `http://localhost:${port}`;
    console.log(`  Dashboard running at ${url}`);
    console.log(`  Press Ctrl+C to stop\n`);
    openBrowser(url);
  });
}
