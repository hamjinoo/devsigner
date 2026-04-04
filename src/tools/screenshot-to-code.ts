import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { readFile } from "node:fs/promises";
import { extname } from "node:path";
import { loadContext, formatContextSummary, identityToCSS } from "../context/project-context.js";

export function registerScreenshotToCode(server: McpServer): void {
  server.tool(
    "screenshot_to_code",
    "Convert a screenshot/image of a UI into production-ready code. Provide a screenshot (PNG, JPG, WebP) and get back the image plus a structured prompt for the host LLM to generate matching code in your chosen framework and styling approach. Optionally loads your project's design identity from .devsigner/ for consistent output.",
    {
      image_path: z
        .string()
        .describe("Absolute path to the screenshot/image file (PNG, JPG, or WebP)"),
      framework: z
        .enum(["react", "vue", "svelte", "html"])
        .default("react")
        .describe("Target framework for code generation"),
      style: z
        .enum(["tailwind", "inline"])
        .default("tailwind")
        .describe("Styling approach — Tailwind CSS utility classes or inline styles"),
      detail_level: z
        .enum(["exact", "inspired"])
        .default("exact")
        .describe(
          "exact: reproduce the screenshot as closely as possible. inspired: use it as inspiration, adapt to modern best practices and devsigner personality."
        ),
      project_path: z
        .string()
        .optional()
        .describe(
          "Absolute path to the project root. When provided, loads the saved design identity from .devsigner/context.json to inform code generation."
        ),
    },
    async ({ image_path, framework, style, detail_level, project_path }) => {
      try {
        // --- Validate and read the image ---
        const ext = extname(image_path).toLowerCase();
        const supportedExts: Record<string, string> = {
          ".png": "image/png",
          ".jpg": "image/jpeg",
          ".jpeg": "image/jpeg",
          ".webp": "image/webp",
        };

        const mimeType = supportedExts[ext];
        if (!mimeType) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Unsupported image format: ${ext}. Supported formats: PNG, JPG, WebP.`,
              },
            ],
            isError: true,
          };
        }

        const imageBuffer = await readFile(image_path);
        const base64 = imageBuffer.toString("base64");

        // --- Load project identity if available ---
        let identitySection = "";
        if (project_path) {
          try {
            const ctx = await loadContext(project_path);
            if (ctx.identity) {
              const cssVars = identityToCSS(ctx.identity);
              identitySection = [
                "",
                "---",
                "",
                "## Project Design Identity (from .devsigner/context.json)",
                "",
                `**Personality:** ${ctx.identity.personality}`,
                `> ${ctx.identity.signature}`,
                "",
                `**Product:** ${ctx.identity.product}`,
                `**Audience:** ${ctx.identity.audience}`,
                `**Mood:** ${ctx.identity.mood}`,
                "",
                "### Design Tokens (use these in the generated code)",
                "",
                "```css",
                cssVars,
                "```",
                "",
                "### Component Personality",
                `- **Hero treatment:** ${ctx.identity.heroTreatment}`,
                `- **Buttons:** ${ctx.identity.buttonPersonality}`,
                `- **Cards:** ${ctx.identity.cardStyle}`,
                `- **Motion:** ${ctx.identity.motionLevel}`,
                "",
                "### Design Philosophy",
                "**Bold moves:**",
                ...ctx.identity.boldMoves.map((m) => `- ${m}`),
                "**Restraints:**",
                ...ctx.identity.restraints.map((r) => `- ${r}`),
                "",
              ].join("\n");
            }

            // Also include context summary (review history, learned patterns, etc.)
            const summary = formatContextSummary(ctx);
            if (summary.trim()) {
              identitySection += [
                "",
                "### Project Context",
                summary,
                "",
              ].join("\n");
            }
          } catch {
            // If loading fails, continue without identity
          }
        }

        // --- Framework-specific conventions ---
        const frameworkInstructions: Record<string, string> = {
          react: [
            "### React Conventions",
            "- Use **functional components** with hooks (useState, useEffect, etc.)",
            "- Export a single default component",
            "- Use semantic JSX — not divs for everything",
            "- Use `className` for CSS classes (not `class`)",
            "- If the UI has interactive elements, wire up appropriate state with useState",
            "- If the UI has a list/grid of items, map over a data array (define sample data as a const)",
            "- Use TypeScript-compatible patterns (no implicit any)",
          ].join("\n"),
          vue: [
            "### Vue Conventions",
            "- Use **Vue 3 SFC** (Single File Component) with `<script setup lang=\"ts\">`",
            "- Use Composition API (ref, computed, onMounted)",
            "- Template, script, and style sections in that order",
            "- Use semantic HTML elements in the template",
            "- If the UI has interactive elements, use ref() for reactive state",
            "- If the UI has a list/grid of items, use v-for with a data array",
          ].join("\n"),
          svelte: [
            "### Svelte Conventions",
            "- Use **Svelte 4** component format",
            "- Use `$:` reactive declarations for derived state",
            "- Use `{#each}` blocks for lists",
            "- Use `on:click` etc. for event handlers",
            "- Script, markup, and style sections",
            "- Keep it idiomatic — use Svelte's built-in reactivity, not manual state management",
          ].join("\n"),
          html: [
            "### HTML Conventions",
            "- Generate a single, complete HTML file",
            "- Include all CSS in a `<style>` block (or Tailwind CDN link if using Tailwind)",
            "- Include any JavaScript in a `<script>` block at the end of `<body>`",
            "- Use semantic HTML5 elements (header, main, nav, section, article, footer)",
            "- Include a proper `<!DOCTYPE html>`, viewport meta tag, and lang attribute",
          ].join("\n"),
        };

        // --- Style-specific instructions ---
        const styleInstructions: Record<string, string> = {
          tailwind: [
            "### Tailwind CSS Styling",
            "- Use Tailwind CSS utility classes for ALL styling",
            "- Use responsive prefixes: `sm:`, `md:`, `lg:`, `xl:` for breakpoints",
            "- Use `flex`, `grid`, `gap-*` for layout",
            "- Use `text-*`, `font-*`, `tracking-*`, `leading-*` for typography",
            "- Use `p-*`, `m-*`, `space-*` for spacing",
            "- Use `rounded-*`, `shadow-*`, `border-*` for shape",
            "- Use `hover:`, `focus:`, `active:` for interactive states",
            "- Use `dark:` prefix if the screenshot shows dark mode elements",
            "- Prefer Tailwind's color palette (slate, gray, zinc, blue, etc.) unless specific colors from the screenshot need custom values",
            "- For custom colors from the screenshot, use arbitrary values: `bg-[#hex]`, `text-[#hex]`",
          ].join("\n"),
          inline: [
            "### Inline Styles",
            "- Use inline `style` attributes (or a `<style>` block for HTML) for all styling",
            "- Use CSS custom properties (variables) for repeated colors, fonts, and spacing",
            "- Define a design tokens object at the top of the component for reusable values",
            "- Use flexbox and CSS grid for layout",
            "- Include hover/focus states via CSS classes or a style tag (inline styles can't do pseudo-classes)",
          ].join("\n"),
        };

        // --- Detail level instructions ---
        const detailInstructions: Record<string, string> = {
          exact: [
            "### Reproduction Fidelity: EXACT",
            "- Reproduce the screenshot **as closely as possible** — pixel-level fidelity is the goal",
            "- Match the exact colors, spacing, font sizes, border radii, and shadows you see",
            "- Preserve the exact layout structure (columns, rows, gaps, alignment)",
            "- Match button styles, card styles, and form element appearances precisely",
            "- If you can identify the font, use it. Otherwise, use the closest system font match.",
            "- Replicate any icons as close equivalents (use emoji, SVG paths, or describe what icon library to use)",
            "- Do NOT add features or elements not visible in the screenshot",
            "- Do NOT 'improve' the design — match it exactly",
          ].join("\n"),
          inspired: [
            "### Reproduction Fidelity: INSPIRED",
            "- Use the screenshot as **design inspiration**, not a strict template",
            "- Capture the overall feel, layout concept, and visual hierarchy",
            "- **Improve upon** the screenshot's design where possible:",
            "  - Better color contrast and accessibility",
            "  - More consistent spacing (use a spacing scale)",
            "  - Cleaner typography hierarchy",
            "  - Modern UI patterns and micro-interactions",
            "  - Better responsive behavior",
            "- If a project design identity is provided (above), adapt the screenshot's layout to use those design tokens",
            "- Add hover states, focus rings, and transitions that the static screenshot cannot show",
            "- Feel free to substitute superior component patterns (e.g., a better card layout, improved navigation)",
          ].join("\n"),
        };

        // --- Assemble the prompt ---
        const prompt = [
          "## Screenshot to Code",
          "",
          `**Target:** ${framework.toUpperCase()} with ${style === "tailwind" ? "Tailwind CSS" : "Inline Styles"}`,
          `**Fidelity:** ${detail_level === "exact" ? "Exact reproduction" : "Inspired adaptation"}`,
          "",
          "---",
          "",
          "## Instructions",
          "",
          "Analyze the screenshot above and generate complete, production-ready code. Follow these steps:",
          "",
          "### Step 1: Layout Analysis",
          "Identify the high-level layout structure:",
          "- Page sections (header, hero, main content, sidebar, footer)",
          "- Grid/flex layout patterns (columns, rows, how they nest)",
          "- Content flow and visual hierarchy (what draws the eye first, second, third)",
          "",
          "### Step 2: Component Inventory",
          "Identify every UI component visible:",
          "- Navigation (navbar, breadcrumbs, tabs, sidebar nav)",
          "- Content blocks (cards, lists, tables, media sections)",
          "- Interactive elements (buttons, forms, inputs, toggles, dropdowns)",
          "- Decorative elements (dividers, badges, avatars, icons)",
          "",
          "### Step 3: Color Palette Extraction",
          "Extract the color palette from the screenshot:",
          "- Background colors (primary bg, card bg, section bg)",
          "- Text colors (headings, body, muted/secondary text)",
          "- Brand/accent colors (buttons, links, highlights)",
          "- Border and divider colors",
          "- State colors (success, error, warning indicators if visible)",
          "",
          "### Step 4: Typography",
          "Note the typography patterns:",
          "- Heading sizes and weights (h1 through h6 if present)",
          "- Body text size and line height",
          "- Font family feel (sans-serif, serif, monospace, rounded, etc.)",
          "- Letter spacing patterns (tight headings, relaxed body)",
          "- Text alignment patterns",
          "",
          "### Step 5: Spacing Patterns",
          "Identify spacing consistency:",
          "- Page margins/padding",
          "- Section spacing (gap between major blocks)",
          "- Card/container internal padding",
          "- Element spacing (gap between items in a list/grid)",
          "- Fine spacing (icon-to-text gaps, label-to-input gaps)",
          "",
          "### Step 6: Generate Code",
          "Now generate the complete code following these rules:",
          "",
          frameworkInstructions[framework],
          "",
          styleInstructions[style],
          "",
          detailInstructions[detail_level],
          "",
          "### Step 7: Responsive Design",
          "- Make the layout responsive — it should work on mobile, tablet, and desktop",
          "- Stack columns on mobile, side-by-side on desktop",
          "- Adjust font sizes and spacing for smaller screens",
          "- Ensure touch targets are at least 44x44px on mobile",
          "",
          "### Step 8: Accessibility",
          "- Use semantic HTML elements (nav, main, article, section, button, etc.)",
          "- Add appropriate ARIA labels where semantic HTML alone is insufficient",
          "- Ensure all images have alt text",
          "- Ensure sufficient color contrast (WCAG AA minimum: 4.5:1 for text)",
          "- Add focus-visible styles for keyboard navigation",
          "- Use proper heading hierarchy (h1 > h2 > h3, no skipping)",
          identitySection,
          "---",
          "",
          "## Output Format",
          "",
          "Return the complete code in a single fenced code block. The code should be:",
          "- **Complete** — copy-paste ready, no placeholders or TODO comments",
          "- **Self-contained** — all styles, data, and logic in one component/file",
          "- **Commented** — brief comments for major sections (header, hero, features, footer, etc.)",
          "",
          `Generate the code now. Output a single \`\`\`${framework === "html" ? "html" : framework === "vue" ? "vue" : framework === "svelte" ? "svelte" : "tsx"}\`\`\` code block.`,
        ].join("\n");

        return {
          content: [
            {
              type: "image" as const,
              data: base64,
              mimeType,
            },
            {
              type: "text" as const,
              text: prompt,
            },
          ],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [
            {
              type: "text" as const,
              text: `Failed to read image: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
