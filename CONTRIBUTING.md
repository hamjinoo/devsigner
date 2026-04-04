# Contributing to devsigner

## Quick Start

```bash
git clone https://github.com/hamjinoo/devsigner.git
cd devsigner
npm install
npm run build
node test-e2e.mjs
```

To run in development mode (auto-recompile):

```bash
npm run dev
```

To test with MCP Inspector:

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

---

## Project Structure

```
src/
├── index.ts                 # Entry point — McpServer + StdioServerTransport
├── server.ts                # Tool/resource registration hub (imports all tools)
├── constants.ts             # Grid, WCAG, typography constants
├── review.ts                # Shared review logic
├── config/
│   └── project-config.ts    # .devsignerrc.json loading
├── context/
│   └── project-context.ts   # Persistent .devsigner/ session system
├── tools/                   # All 37 MCP tools (one file per tool or group)
├── rules/                   # Design rules engine (spacing, color, typography, layout)
├── parsers/                 # CSS/Tailwind/inline-style extractors, framework detector
├── palettes/                # Color palette generator, presets, formatters
├── components/
│   └── templates/           # Component HTML/framework templates
├── resources/               # MCP resources (design system knowledge)
├── schemas/                 # Database schemas
└── utils/                   # Color math, CSS value parsing
```

Key conventions:
- Each tool file exports a `register*` function that takes `McpServer`.
- `server.ts` is the central hub that calls every register function.
- Rules live in `src/rules/` and are called by `runDesignRules()` in `src/rules/index.ts`.

---

## Adding a New Tool

1. **Create the tool file** in `src/tools/`:

```typescript
// src/tools/my-tool.ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerMyTool(server: McpServer): void {
  server.tool(
    "my_tool",
    "One-line description of what this tool does",
    {
      // Input schema using zod
      input: z.string().describe("The input to analyze"),
      options: z.object({
        verbose: z.boolean().optional().describe("Show detailed output"),
      }).optional(),
    },
    async ({ input, options }) => {
      // Tool logic here
      const result = `Analyzed: ${input}`;

      return {
        content: [{ type: "text", text: result }],
      };
    },
  );
}
```

2. **Register in `server.ts`**:

```typescript
import { registerMyTool } from "./tools/my-tool.js";

// Inside registerAllTools():
registerMyTool(server);
```

3. **Build and test**:

```bash
npm run build
node test-e2e.mjs
```

4. **Test manually** with MCP Inspector:

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

Call your tool in the Inspector UI and verify the output.

---

## Adding a Component Template

Component templates live in `src/tools/component-suggest.ts`.

1. Open `src/tools/component-suggest.ts`.
2. Find the templates map (object keyed by template name).
3. Add your template entry:

```typescript
"my-widget": {
  name: "my-widget",
  description: "A reusable widget for X",
  variants: {
    react: `// React component code here...`,
    html: `<!-- HTML version here -->`,
    // Optionally add: vue, svelte
  },
},
```

4. Update the template count in the tool description if needed.
5. Build and test:

```bash
npm run build
npx @modelcontextprotocol/inspector node dist/index.js
```

Call `component_suggest` with `template: "my-widget"` to verify.

---

## Adding a Design Rule

Design rules live in `src/rules/`. Each file covers one category: `spacing.ts`, `color.ts`, `typography.ts`, `layout.ts`.

1. Open the relevant rule file (e.g., `src/rules/spacing.ts`).
2. Add your check inside the existing check function. Every rule produces a `DesignIssue`:

```typescript
// src/rules/types.ts defines the shape:
interface DesignIssue {
  severity: "error" | "warning" | "info";
  category: "spacing" | "color" | "typography" | "layout";
  message: string;
  suggestion: string;
  line?: number;
}
```

3. Push the issue onto the issues array when the rule is violated:

```typescript
issues.push({
  severity: "warning",
  category: "spacing",
  message: "Margin uses odd value (13px)",
  suggestion: "Use multiples of 4px: 12px or 16px",
  line: declaration.line,
});
```

4. If adding a **new category**, you must also:
   - Create `src/rules/my-category.ts` with a `checkMyCategory()` function.
   - Add the category to `Category` type in `src/rules/types.ts`.
   - Add the category to `FocusArea` in `src/rules/index.ts`.
   - Call `checkMyCategory()` inside `runDesignRules()`.

5. Build and test with a file that triggers your rule.

---

## Code Style

- **TypeScript strict mode** — `tsconfig.json` has strict enabled.
- **No unnecessary external dependencies** — the project has only 3 runtime deps (MCP SDK, zod, puppeteer-core). Avoid adding new ones unless absolutely required.
- **Every tool file exports a `register*` function** — this is the only public API of a tool module.
- **Use zod for input validation** — all tool inputs are defined with zod schemas.
- **ES modules** — the project uses `"type": "module"`. Use `.js` extensions in imports.
- **No default exports** — use named exports everywhere.
- **Keep tools self-contained** — a tool file should contain its logic, not spread across many helper files.

---

## Testing

### Automated end-to-end tests

```bash
npm run build
node test-e2e.mjs
```

This spins up the MCP server, calls every tool, and verifies responses.

### Manual testing with MCP Inspector

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

Use the Inspector UI to call tools interactively. Useful for:
- Verifying new tool output format
- Testing edge cases
- Checking error handling

### What to test

- Tool returns valid MCP response (`content` array with `type: "text"` entries).
- Invalid inputs produce clear error messages, not crashes.
- Tools that read files handle missing files gracefully.
- Tools that use Puppeteer handle missing Chrome gracefully.

---

## Pull Requests

### What to include

- **Title**: Brief description of what changed (e.g., "Add contrast-ratio tool").
- **Description**: What the tool/feature does and why it's useful.
- **Testing**: How you tested it (e2e output, Inspector screenshots).
- **Breaking changes**: If any tool inputs/outputs changed shape.

### Checklist

- [ ] `npm run build` succeeds with no errors
- [ ] `node test-e2e.mjs` passes
- [ ] New tool is registered in `server.ts`
- [ ] Tool description is clear and concise
- [ ] No new runtime dependencies added (or justification provided)

---

## Reporting Issues

When filing an issue, include:

- **devsigner version**: `npx devsigner --version` or check `package.json`
- **Node.js version**: `node --version`
- **OS**: Windows/macOS/Linux and version
- **MCP client**: Claude Desktop, VS Code, MCP Inspector, etc.
- **Steps to reproduce**: exact tool call and input that caused the issue
- **Expected vs actual**: what you expected and what happened
- **Error output**: full error message or stack trace if available

For design rule false positives, include the CSS/HTML that was incorrectly flagged.
