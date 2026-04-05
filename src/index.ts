import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerAllTools } from "./server.js";

const args = process.argv.slice(2);

if (args[0] === "serve") {
  // Dashboard mode
  const { startDashboard } = await import("./dashboard/server.js");
  const projectPath = args[1] || process.cwd();
  const portFlag = args.indexOf("--port");
  const port = portFlag !== -1 && args[portFlag + 1] ? parseInt(args[portFlag + 1], 10) : 4567;
  await startDashboard(projectPath, port);
} else {
  // MCP server mode (default)
  const server = new McpServer({
    name: "devsigner",
    version: "1.0.0",
  });

  registerAllTools(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
