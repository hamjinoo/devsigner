/**
 * HTML Restructure — reorganize layout for better design
 *
 * Detects common UI patterns (nav, hero, cards, footer, CTA)
 * and adds structural improvements: flexbox nav, grid cards,
 * centered hero, proper section wrapping.
 *
 * Does NOT change content — only reorganizes layout.
 */

// ---------------------------------------------------------------------------
// Nav: logo left, links center, CTA right
// ---------------------------------------------------------------------------

function restructureNav(html: string): string {
  // Match <nav> or <header> containing links and possibly a button
  return html.replace(
    /(<(?:nav|header)[^>]*>)([\s\S]*?)(<\/(?:nav|header)>)/gi,
    (match, open: string, inner: string, close: string) => {
      // Check if it has links and possibly a button
      const links = inner.match(/<a[^>]*>[\s\S]*?<\/a>/gi);
      const buttons = inner.match(/<button[^>]*>[\s\S]*?<\/button>/gi);

      if (!links || links.length < 2) return match;

      // First link is likely the logo/brand
      const logo = links[0];
      const navLinks = links.slice(1);
      const cta = buttons?.[0] ?? "";

      // Remove old content and rebuild
      const addStyle = open.includes("style=") ? open : open.replace(">", ` style="display:flex;align-items:center;justify-content:space-between;padding:16px 24px;gap:24px;max-width:1200px;margin:0 auto">`);

      return `${addStyle}
  <div style="font-weight:700;font-size:18px">${logo}</div>
  <div style="display:flex;gap:24px;align-items:center">${navLinks.join("\n    ")}</div>
  <div style="display:flex;gap:12px;align-items:center">${cta}</div>
${close}`;
    },
  );
}

// ---------------------------------------------------------------------------
// Hero: center content, constrain width, button group
// ---------------------------------------------------------------------------

function restructureHero(html: string): string {
  return html.replace(
    /(<(?:div|section)[^>]*class="[^"]*hero[^"]*"[^>]*>)([\s\S]*?)(<\/(?:div|section)>)/gi,
    (match, open: string, inner: string, close: string) => {
      // Add centering and padding
      const heroStyle = "display:flex;flex-direction:column;align-items:center;text-align:center;padding:96px 24px;max-width:800px;margin:0 auto";
      const styledOpen = open.includes("style=")
        ? open.replace(/style="[^"]*"/, `style="${heroStyle}"`)
        : open.replace(">", ` style="${heroStyle}">`);

      // Wrap buttons in a flex row
      let processedInner = inner;
      const buttonMatches = inner.match(/<button[^>]*>[\s\S]*?<\/button>/gi);
      if (buttonMatches && buttonMatches.length >= 2) {
        // Find the buttons and wrap them
        const firstButton = buttonMatches[0];
        const lastButton = buttonMatches[buttonMatches.length - 1];
        const buttonsHtml = buttonMatches.join("\n      ");

        // Remove individual buttons and add grouped
        for (const btn of buttonMatches) {
          processedInner = processedInner.replace(btn, "");
        }
        // Remove empty divs that might have held buttons
        processedInner = processedInner.replace(/<div[^>]*>\s*<\/div>/g, "");
        processedInner += `\n    <div style="display:flex;gap:12px;margin-top:24px">\n      ${buttonsHtml}\n    </div>`;
      }

      return `${styledOpen}${processedInner}${close}`;
    },
  );
}

// ---------------------------------------------------------------------------
// Cards: add grid layout
// ---------------------------------------------------------------------------

function restructureCards(html: string): string {
  // Find a container with multiple .card children
  return html.replace(
    /(<(?:div|section)[^>]*class="[^"]*grid[^"]*"[^>]*>)([\s\S]*?)(<\/(?:div|section)>)/gi,
    (match, open: string, inner: string, close: string) => {
      const cardCount = (inner.match(/class="[^"]*card[^"]*"/gi) || []).length;
      if (cardCount < 2) return match;

      const gridStyle = `display:grid;grid-template-columns:repeat(${Math.min(cardCount, 3)}, 1fr);gap:24px`;
      const styledOpen = open.includes("style=")
        ? open.replace(/style="[^"]*"/, `style="${gridStyle}"`)
        : open.replace(">", ` style="${gridStyle}">`);

      return `${styledOpen}${inner}${close}`;
    },
  );
}

// ---------------------------------------------------------------------------
// Sections: add container wrapping and spacing
// ---------------------------------------------------------------------------

function restructureSections(html: string): string {
  return html.replace(
    /<section([^>]*)>([\s\S]*?)<\/section>/gi,
    (match, attrs: string, inner: string) => {
      // Don't double-wrap if already has container styling
      if (attrs.includes("max-width") || inner.includes("max-width")) return match;

      const sectionStyle = "padding:80px 24px";
      const containerStyle = "max-width:1200px;margin:0 auto";

      const styledAttrs = attrs.includes("style=")
        ? attrs.replace(/style="([^"]*)"/, `style="$1;${sectionStyle}"`)
        : `${attrs} style="${sectionStyle}"`;

      return `<section${styledAttrs}><div style="${containerStyle}">${inner}</div></section>`;
    },
  );
}

// ---------------------------------------------------------------------------
// Footer: multi-column layout
// ---------------------------------------------------------------------------

function restructureFooter(html: string): string {
  return html.replace(
    /(<footer[^>]*>)([\s\S]*?)(<\/footer>)/gi,
    (match, open: string, inner: string, close: string) => {
      const footerStyle = "display:flex;justify-content:space-between;align-items:center;padding:32px 24px;max-width:1200px;margin:0 auto;flex-wrap:wrap;gap:16px";
      const styledOpen = open.includes("style=")
        ? open.replace(/style="[^"]*"/, `style="${footerStyle}"`)
        : open.replace(">", ` style="${footerStyle}">`);

      return `${styledOpen}${inner}${close}`;
    },
  );
}

// ---------------------------------------------------------------------------
// Card content: add internal padding and structure
// ---------------------------------------------------------------------------

function restructureCardContent(html: string): string {
  return html.replace(
    /(<(?:div|article)[^>]*class="[^"]*card[^"]*"[^>]*>)([\s\S]*?)(<\/(?:div|article)>)/gi,
    (match, open: string, inner: string, close: string) => {
      const cardStyle = "padding:32px;border-radius:12px;background:var(--ds-surface, #f8f9fa);border:1px solid var(--ds-border, #e5e7eb)";

      if (open.includes("style=")) {
        return match; // Already styled
      }

      return `${open.replace(">", ` style="${cardStyle}">`)}${inner}${close}`;
    },
  );
}

// ---------------------------------------------------------------------------
// CTA section: center and add background
// ---------------------------------------------------------------------------

function restructureCTA(html: string): string {
  return html.replace(
    /(<(?:div|section)[^>]*class="[^"]*cta[^"]*"[^>]*>)([\s\S]*?)(<\/(?:div|section)>)/gi,
    (match, open: string, inner: string, close: string) => {
      const ctaStyle = "text-align:center;padding:80px 24px;background:var(--ds-surface, #f8f9fa);border-radius:16px;max-width:800px;margin:0 auto";

      const styledOpen = open.includes("style=")
        ? open.replace(/style="[^"]*"/, `style="${ctaStyle}"`)
        : open.replace(">", ` style="${ctaStyle}">`);

      return `${styledOpen}${inner}${close}`;
    },
  );
}

// ---------------------------------------------------------------------------
// Body: ensure good defaults
// ---------------------------------------------------------------------------

function addBodyDefaults(html: string): string {
  // Add body styling if not present
  if (html.includes("<body") && !html.includes("body {") && !html.includes("body{")) {
    return html.replace("<body", `<body style="margin:0;padding:0"`);
  }
  return html;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function restructureHTML(html: string): string {
  let result = html;

  result = addBodyDefaults(result);
  result = restructureNav(result);
  result = restructureHero(result);
  result = restructureCards(result);
  result = restructureCardContent(result);
  result = restructureSections(result);
  result = restructureCTA(result);
  result = restructureFooter(result);

  return result;
}
