export interface StyleDeclaration {
  property: string;
  value: string;
  line?: number;
}

export interface StyleBlock {
  selector: string;
  declarations: StyleDeclaration[];
}

export function extractCSSBlocks(code: string): StyleBlock[] {
  const blocks: StyleBlock[] = [];

  // Match <style> tags content
  const styleTagRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let styleMatch;
  while ((styleMatch = styleTagRegex.exec(code)) !== null) {
    blocks.push(...parseCSSString(styleMatch[1]));
  }

  // Match CSS-like blocks in raw CSS input (no <style> tag)
  if (blocks.length === 0 && /\{[\s\S]*\}/.test(code) && !/<\w+/.test(code)) {
    blocks.push(...parseCSSString(code));
  }

  return blocks;
}

function parseCSSString(css: string): StyleBlock[] {
  const blocks: StyleBlock[] = [];
  const ruleRegex = /([^{}]+)\{([^{}]*)\}/g;
  let match;

  while ((match = ruleRegex.exec(css)) !== null) {
    const selector = match[1].trim();
    const body = match[2].trim();

    if (!body) continue;

    const declarations: StyleDeclaration[] = [];
    const declParts = body.split(";");

    for (const part of declParts) {
      const colonIdx = part.indexOf(":");
      if (colonIdx === -1) continue;

      const property = part.slice(0, colonIdx).trim();
      const value = part.slice(colonIdx + 1).trim();

      if (property && value) {
        declarations.push({ property, value });
      }
    }

    if (declarations.length > 0) {
      blocks.push({ selector, declarations });
    }
  }

  return blocks;
}

export function extractAllDeclarations(code: string): StyleDeclaration[] {
  const blocks = extractCSSBlocks(code);
  return blocks.flatMap((b) => b.declarations);
}
