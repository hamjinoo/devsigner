import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerDesignReview } from "./tools/design-review.js";
import { registerColorPalette } from "./tools/color-palette.js";
import { registerComponentSuggest } from "./tools/component-suggest.js";

export function registerAllTools(server: McpServer): void {
  registerDesignReview(server);
  registerColorPalette(server);
  registerComponentSuggest(server);
}
