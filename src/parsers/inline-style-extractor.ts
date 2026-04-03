import type { StyleDeclaration } from "./css-extractor.js";

export function extractInlineStyles(code: string): StyleDeclaration[] {
  const declarations: StyleDeclaration[] = [];

  // HTML style="..."
  const htmlStyleRegex = /style\s*=\s*"([^"]*)"/gi;
  let match;
  while ((match = htmlStyleRegex.exec(code)) !== null) {
    declarations.push(...parseStyleString(match[1]));
  }

  // JSX style={{ ... }}
  const jsxStyleRegex = /style\s*=\s*\{\{([\s\S]*?)\}\}/g;
  while ((match = jsxStyleRegex.exec(code)) !== null) {
    declarations.push(...parseJSXStyleObject(match[1]));
  }

  return declarations;
}

function parseStyleString(style: string): StyleDeclaration[] {
  const declarations: StyleDeclaration[] = [];
  const parts = style.split(";");

  for (const part of parts) {
    const colonIdx = part.indexOf(":");
    if (colonIdx === -1) continue;

    const property = part.slice(0, colonIdx).trim();
    const value = part.slice(colonIdx + 1).trim();

    if (property && value) {
      declarations.push({ property, value });
    }
  }

  return declarations;
}

function parseJSXStyleObject(jsxStyle: string): StyleDeclaration[] {
  const declarations: StyleDeclaration[] = [];
  const pairRegex = /(\w+)\s*:\s*(?:"([^"]*)"|'([^']*)'|(\d+[\w%]*))/g;
  let match;

  while ((match = pairRegex.exec(jsxStyle)) !== null) {
    const camelCase = match[1];
    const value = match[2] || match[3] || match[4];
    const property = camelToKebab(camelCase);

    if (property && value) {
      declarations.push({ property, value: typeof value === "string" && /^\d+$/.test(value) ? `${value}px` : value });
    }
  }

  return declarations;
}

function camelToKebab(str: string): string {
  return str.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}
