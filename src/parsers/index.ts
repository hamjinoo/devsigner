import type { StyleDeclaration, StyleBlock } from "./css-extractor.js";
import { extractCSSBlocks, extractAllDeclarations } from "./css-extractor.js";
import { extractInlineStyles, extractInlineStyleBlocks } from "./inline-style-extractor.js";
import { extractTailwindStyles, extractTailwindStyleBlocks } from "./tailwind-extractor.js";
import { detectFramework, type Framework } from "./framework-detector.js";
import { expandShorthand } from "../utils/css-value-parser.js";

export interface ParsedStyles {
  framework: Framework;
  declarations: StyleDeclaration[];
  blocks: StyleBlock[];
}

export function parseCode(code: string, frameworkHint?: string): ParsedStyles {
  const framework = frameworkHint && frameworkHint !== "auto"
    ? frameworkHint as Framework
    : detectFramework(code);

  const cssDeclarations = extractAllDeclarations(code);
  const inlineDeclarations = extractInlineStyles(code);
  const tailwindDeclarations = extractTailwindStyles(code);

  // Collect blocks (preserving per-selector / per-element grouping)
  const cssBlocks = extractCSSBlocks(code);
  const inlineBlocks = extractInlineStyleBlocks(code);
  const tailwindBlocks = extractTailwindStyleBlocks(code);
  const allBlocks = [...cssBlocks, ...inlineBlocks, ...tailwindBlocks];

  // Expand shorthands
  const allDeclarations: StyleDeclaration[] = [];

  for (const decl of [...cssDeclarations, ...inlineDeclarations, ...tailwindDeclarations]) {
    if (decl.property === "padding" || decl.property === "margin") {
      const expanded = expandShorthand(decl.property, decl.value);
      for (const [prop, val] of Object.entries(expanded)) {
        allDeclarations.push({ property: prop, value: val, line: decl.line });
      }
    } else {
      allDeclarations.push(decl);
    }
  }

  return { framework, declarations: allDeclarations, blocks: allBlocks };
}

export { type StyleDeclaration, type StyleBlock, type Framework, detectFramework };
