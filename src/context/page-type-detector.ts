/**
 * Detects the page type from UI code by analyzing structural signals.
 * Used to apply context-appropriate design standards.
 */

export type PageType =
  | "landing"
  | "dashboard"
  | "pricing"
  | "blog"
  | "auth"
  | "ecommerce"
  | "docs"
  | "settings"
  | "unknown";

interface Signal {
  pattern: RegExp;
  weight: number;
}

const PAGE_SIGNALS: Record<PageType, Signal[]> = {
  landing: [
    { pattern: /hero|Hero/g, weight: 3 },
    { pattern: /cta|CTA|call.?to.?action/gi, weight: 3 },
    { pattern: /testimonial|Testimonial/g, weight: 2 },
    { pattern: /feature|Feature/g, weight: 1 },
    { pattern: /Get\s?Started|Sign\s?Up\s?Free|Try\s?(It\s)?Free|Start\s?Free/gi, weight: 2 },
    { pattern: /gradient|linear-gradient/g, weight: 1 },
    { pattern: /landing/gi, weight: 3 },
  ],
  dashboard: [
    { pattern: /sidebar|Sidebar|side-bar/gi, weight: 3 },
    { pattern: /dashboard|Dashboard/g, weight: 4 },
    { pattern: /<table|<thead|<tbody/gi, weight: 2 },
    { pattern: /chart|Chart|graph|Graph/g, weight: 2 },
    { pattern: /stat|metric|analytics/gi, weight: 1 },
    { pattern: /grid-cols-[3-9]|grid-cols-1[0-2]/g, weight: 1 },
    { pattern: /data-?card|stat-?card/gi, weight: 2 },
  ],
  pricing: [
    { pattern: /pricing|Pricing/g, weight: 4 },
    { pattern: /\$\d+|\$\s?\d+/g, weight: 3 },
    { pattern: /\/month|\/year|\/mo|per\s?month/gi, weight: 3 },
    { pattern: /free\s?tier|pro\s?plan|enterprise|basic|premium/gi, weight: 2 },
    { pattern: /plan|Plan/g, weight: 1 },
  ],
  blog: [
    { pattern: /<article/gi, weight: 4 },
    { pattern: /blog|Blog|post|Post/g, weight: 2 },
    { pattern: /prose|reading|read-time/gi, weight: 2 },
    { pattern: /max-w-(?:prose|2xl|3xl)|max-width:\s*(?:65ch|700px|800px)/gi, weight: 2 },
    { pattern: /author|Author|published|date/gi, weight: 1 },
  ],
  auth: [
    { pattern: /login|Login|sign.?in|Sign.?In/gi, weight: 3 },
    { pattern: /password|Password/g, weight: 3 },
    { pattern: /email|Email/g, weight: 1 },
    { pattern: /forgot.?password|reset.?password/gi, weight: 2 },
    { pattern: /register|Register|sign.?up|Sign.?Up/gi, weight: 2 },
    { pattern: /type="password"|type='password'/g, weight: 4 },
  ],
  ecommerce: [
    { pattern: /cart|Cart|basket/gi, weight: 3 },
    { pattern: /add.?to.?cart|buy.?now/gi, weight: 4 },
    { pattern: /product|Product/g, weight: 1 },
    { pattern: /price|Price|\$\d/g, weight: 1 },
    { pattern: /checkout|Checkout/g, weight: 3 },
    { pattern: /quantity|qty/gi, weight: 2 },
  ],
  docs: [
    { pattern: /documentation|docs|Docs/gi, weight: 3 },
    { pattern: /breadcrumb|Breadcrumb/gi, weight: 2 },
    { pattern: /table.?of.?contents|toc/gi, weight: 3 },
    { pattern: /<code|<pre|```/g, weight: 1 },
    { pattern: /sidebar.*nav|nav.*sidebar/gi, weight: 2 },
    { pattern: /api.?reference/gi, weight: 3 },
  ],
  settings: [
    { pattern: /settings|Settings|preferences/gi, weight: 4 },
    { pattern: /toggle|Toggle|switch|Switch/g, weight: 1 },
    { pattern: /save.?changes|update.?profile/gi, weight: 3 },
    { pattern: /notification|account|profile/gi, weight: 1 },
    { pattern: /form.*input|input.*form/gi, weight: 1 },
  ],
  unknown: [],
};

export function detectPageType(code: string): PageType {
  const scores: Record<PageType, number> = {
    landing: 0,
    dashboard: 0,
    pricing: 0,
    blog: 0,
    auth: 0,
    ecommerce: 0,
    docs: 0,
    settings: 0,
    unknown: 0,
  };

  for (const [pageType, signals] of Object.entries(PAGE_SIGNALS) as Array<[PageType, Signal[]]>) {
    for (const signal of signals) {
      const matches = code.match(signal.pattern);
      if (matches) {
        scores[pageType] += signal.weight * matches.length;
      }
    }
  }

  // Find the highest scoring page type
  let best: PageType = "unknown";
  let bestScore = 0;

  for (const [pageType, score] of Object.entries(scores) as Array<[PageType, number]>) {
    if (pageType === "unknown") continue;
    if (score > bestScore) {
      bestScore = score;
      best = pageType;
    }
  }

  // Require a minimum confidence threshold
  if (bestScore < 3) return "unknown";

  return best;
}

/**
 * Suggest an industry based on detected page type.
 * This is a rough heuristic — the user can override via the `industry` parameter.
 */
export function suggestIndustry(pageType: PageType): string | undefined {
  const map: Partial<Record<PageType, string>> = {
    dashboard: "saas",
    pricing: "saas",
    ecommerce: "ecommerce",
    docs: "developer_tools",
    blog: "general",
  };
  return map[pageType];
}
