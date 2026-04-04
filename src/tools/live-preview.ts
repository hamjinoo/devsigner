import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import http from "node:http";
import { createHash } from "node:crypto";
import { exec } from "node:child_process";
import { wrapInHTML } from "./render-and-review.js";

let currentServer: http.Server | null = null;
let currentHTML = "";
let currentHash = "";
let inactivityTimer: ReturnType<typeof setTimeout> | null = null;
let currentPort = 3333;

const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

function computeHash(content: string): string {
  return createHash("md5").update(content).digest("hex");
}

function resetInactivityTimer(): void {
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
  }
  inactivityTimer = setTimeout(() => {
    shutdownServer();
  }, INACTIVITY_TIMEOUT_MS);
}

function shutdownServer(): void {
  if (currentServer) {
    currentServer.close();
    currentServer = null;
  }
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
    inactivityTimer = null;
  }
  currentHTML = "";
  currentHash = "";
}

function injectAutoRefresh(html: string, hash: string): string {
  const script = `
<script>
(function() {
  document.body.dataset.hash = "${hash}";
  setInterval(async () => {
    try {
      const res = await fetch('/__devsigner_hash');
      const hash = await res.text();
      if (hash !== document.body.dataset.hash) location.reload();
    } catch (e) {
      // server may have shut down
    }
  }, 1000);
})();
</script>`;

  // Inject before closing </body> tag if present, otherwise append
  if (html.includes("</body>")) {
    return html.replace("</body>", `${script}\n</body>`);
  }
  return html + script;
}

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
  exec(command, (err) => {
    if (err) {
      // Silently fail — not critical
    }
  });
}

function startServer(port: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      resetInactivityTimer();

      if (req.url === "/__devsigner_hash") {
        res.writeHead(200, {
          "Content-Type": "text/plain",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-cache",
        });
        res.end(currentHash);
        return;
      }

      // Serve the HTML page for any other request
      const htmlWithRefresh = injectAutoRefresh(currentHTML, currentHash);
      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache",
      });
      res.end(htmlWithRefresh);
    });

    server.on("error", (err) => {
      reject(err);
    });

    server.listen(port, () => {
      currentServer = server;
      currentPort = port;
      resolve();
    });
  });
}

export function registerLivePreview(server: McpServer): void {
  server.tool(
    "live_preview",
    "Start a local HTTP server that serves HTML content for real-time preview in the browser. Subsequent calls update the preview content without restarting the server. The browser auto-refreshes when content changes. Server auto-closes after 5 minutes of inactivity.",
    {
      code: z.string().describe("HTML/JSX code to preview"),
      port: z.number().default(3333).describe("Port number for the local server"),
      open_browser: z
        .boolean()
        .default(true)
        .describe("Whether to open the URL in the default browser"),
    },
    async ({ code, port, open_browser }) => {
      try {
        // Wrap the code in a full HTML document
        const html = wrapInHTML(code, { width: 1280, height: 800 });
        currentHTML = html;
        currentHash = computeHash(html);

        const isNewServer = !currentServer;

        // If a server is already running on a different port, shut it down
        if (currentServer && currentPort !== port) {
          shutdownServer();
        }

        // Start a new server if none is running
        if (!currentServer) {
          await startServer(port);
        }

        // Reset the inactivity timer
        resetInactivityTimer();

        const url = `http://localhost:${port}`;

        // Open browser only for new servers or if explicitly requested
        if (open_browser && isNewServer) {
          openBrowser(url);
        }

        const statusMessage = isNewServer
          ? `Live preview server started at ${url}\nThe browser should open automatically.`
          : `Preview content updated at ${url}\nThe browser will auto-refresh within 1 second.`;

        return {
          content: [
            {
              type: "text" as const,
              text: [
                `## Live Preview`,
                "",
                statusMessage,
                "",
                `- **URL:** ${url}`,
                `- **Port:** ${port}`,
                `- **Auto-refresh:** Enabled (polls every 1 second)`,
                `- **Auto-shutdown:** After 5 minutes of inactivity`,
                "",
                "Call this tool again with updated code to refresh the preview in real time.",
              ].join("\n"),
            },
          ],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [
            {
              type: "text" as const,
              text: `Failed to start live preview: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
