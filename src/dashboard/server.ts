import http from "node:http";
import { exec } from "node:child_process";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { collectDashboardData } from "./collector.js";
import { renderDashboard } from "./template.js";
import { transformAndRender } from "../pipeline/transform.js";

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
