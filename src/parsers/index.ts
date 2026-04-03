import type { StyleDeclaration } from "./css-extractor.js";
import { extractCSSBlocks, extractAllDeclarations } from "./css-extractor.js";
import { extractInlineStyles } from "./inline-style-extractor.js";
import { extractTailwindStyles } from "./tailwind-extractor.js";
import { detectFramework, type Framework } from "./framework-detector.js";
import { expandShorthand } from "../utils/css-value-parser.js";

export interface ParsedStyles {
  framework: Framework;
  declarations: StyleDeclaration[];
}

export function parseCode(code: string, frameworkHint?: string): ParsedStyles {
  const framework = frameworkHint && frameworkHint !== "auto"
    ? frameworkHint as Framework
    : detectFramework(code);

  const cssDeclarations = extractAllDeclarations(code);
  const inlineDeclarations = extractInlineStyles(code);
  const tailwindDeclarations = extractTailwindStyles(code);

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

  return { framework, declarations: allDeclarations };
}

export { type StyleDeclaration, type Framework, detectFramework };
