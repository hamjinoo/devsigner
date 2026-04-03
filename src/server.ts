import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerDesignReview } from "./tools/design-review.js";
import { registerColorPalette } from "./tools/color-palette.js";
import { registerComponentSuggest } from "./tools/component-suggest.js";
import { registerScanProject } from "./tools/scan-project.js";
import { registerDesignGuide } from "./tools/design-guide.js";
import { registerDesignReference } from "./tools/design-reference.js";
import { registerDesignIdentity } from "./tools/design-identity.js";
import { registerRenderAndReview } from "./tools/render-and-review.js";
import { registerScreenshotReview } from "./tools/screenshot-review.js";
import { registerDesignSession } from "./tools/design-session.js";
import { registerDesignSystemResources } from "./resources/design-systems.js";

export function registerAllTools(server: McpServer): void {
  registerDesignReview(server);
  registerColorPalette(server);
  registerComponentSuggest(server);
  registerScanProject(server);
  registerDesignGuide(server);
  registerDesignReference(server);
  registerDesignIdentity(server);
  registerRenderAndReview(server);
  registerScreenshotReview(server);
  registerDesignSession(server);
  registerDesignSystemResources(server);
}
