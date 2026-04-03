export interface PalettePreset {
  name: string;
  keywords: string[];
  baseHue: number;
  saturation: number;
  description: string;
}

export const PRESETS: PalettePreset[] = [
  {
    name: "Professional",
    keywords: ["professional", "corporate", "business", "enterprise", "formal", "b2b"],
    baseHue: 220,
    saturation: 0.6,
    description: "Blue-based professional palette conveying trust and reliability",
  },
  {
    name: "Fintech",
    keywords: ["fintech", "finance", "banking", "payment", "money", "crypto"],
    baseHue: 230,
    saturation: 0.65,
    description: "Deep blue palette for financial trust and security",
  },
  {
    name: "Healthcare",
    keywords: ["health", "healthcare", "medical", "wellness", "fitness"],
    baseHue: 170,
    saturation: 0.55,
    description: "Teal/green palette evoking health and calm",
  },
  {
    name: "Creative",
    keywords: ["creative", "design", "art", "portfolio", "agency"],
    baseHue: 280,
    saturation: 0.7,
    description: "Purple-based palette for creativity and imagination",
  },
  {
    name: "E-Commerce",
    keywords: ["ecommerce", "shop", "store", "retail", "product", "marketplace"],
    baseHue: 25,
    saturation: 0.75,
    description: "Warm orange palette driving action and energy",
  },
  {
    name: "Education",
    keywords: ["education", "learning", "school", "course", "academy", "study"],
    baseHue: 200,
    saturation: 0.55,
    description: "Calm blue palette for focus and learning",
  },
  {
    name: "SaaS",
    keywords: ["saas", "startup", "tech", "software", "app", "platform", "dashboard"],
    baseHue: 250,
    saturation: 0.6,
    description: "Indigo/violet palette for modern tech products",
  },
  {
    name: "Nature",
    keywords: ["nature", "eco", "green", "sustainable", "organic", "environment"],
    baseHue: 140,
    saturation: 0.5,
    description: "Green palette for sustainability and growth",
  },
  {
    name: "Playful",
    keywords: ["playful", "fun", "game", "kids", "entertainment", "social"],
    baseHue: 330,
    saturation: 0.75,
    description: "Pink/magenta palette for energy and fun",
  },
  {
    name: "Minimal",
    keywords: ["minimal", "clean", "simple", "modern", "elegant"],
    baseHue: 210,
    saturation: 0.15,
    description: "Near-neutral palette for clean minimalist designs",
  },
];

export function findPreset(description: string): PalettePreset {
  const lower = description.toLowerCase();

  let bestMatch = PRESETS[0];
  let bestScore = 0;

  for (const preset of PRESETS) {
    let score = 0;
    for (const keyword of preset.keywords) {
      if (lower.includes(keyword)) {
        score += keyword.length;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = preset;
    }
  }

  return bestMatch;
}
