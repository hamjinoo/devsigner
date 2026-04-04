import { readFile } from "node:fs/promises";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// Config schema
// ---------------------------------------------------------------------------

export interface DevsignerConfig {
  rules: {
    spacing: {
      gridBase: number;
      gridPreferred: number;
      maxDistinctValues: number;
    };
    color: {
      maxDistinctColors: number;
      contrastLevel: "AA" | "AAA";
      allowPureBlack: boolean;
      allowPureWhite: boolean;
    };
    typography: {
      maxFontSizes: number;
      maxFontWeights: number;
      minLineHeight: number;
    };
    layout: {
      maxZIndex: number;
      requireMaxWidth: boolean;
    };
  };

  ignore: string[];

  personality: string;

  allowedColors: string[];
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

export const DEFAULT_CONFIG: DevsignerConfig = {
  rules: {
    spacing: {
      gridBase: 4,
      gridPreferred: 8,
      maxDistinctValues: 6,
    },
    color: {
      maxDistinctColors: 10,
      contrastLevel: "AA",
      allowPureBlack: false,
      allowPureWhite: false,
    },
    typography: {
      maxFontSizes: 6,
      maxFontWeights: 3,
      minLineHeight: 1.4,
    },
    layout: {
      maxZIndex: 100,
      requireMaxWidth: true,
    },
  },
  ignore: [],
  personality: "warm_professional",
  allowedColors: [],
};

// ---------------------------------------------------------------------------
// Deep merge helper
// ---------------------------------------------------------------------------

function deepMerge(
  defaults: Record<string, any>,
  overrides: Record<string, any>,
): Record<string, any> {
  const result: Record<string, any> = { ...defaults };
  for (const key of Object.keys(overrides)) {
    const val = overrides[key];
    if (
      val !== null &&
      val !== undefined &&
      typeof val === "object" &&
      !Array.isArray(val) &&
      typeof defaults[key] === "object" &&
      !Array.isArray(defaults[key])
    ) {
      result[key] = deepMerge(defaults[key], val);
    } else if (val !== undefined) {
      result[key] = val;
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Loader
// ---------------------------------------------------------------------------

export async function loadConfig(projectPath: string): Promise<DevsignerConfig> {
  const configPath = join(projectPath, ".devsignerrc.json");
  try {
    const raw = await readFile(configPath, "utf-8");
    const parsed = JSON.parse(raw);
    return deepMerge(DEFAULT_CONFIG as any, parsed) as DevsignerConfig;
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

// ---------------------------------------------------------------------------
// Helper: check if a rule is ignored
// ---------------------------------------------------------------------------

export function isRuleIgnored(config: DevsignerConfig, ruleName: string): boolean {
  // ruleName format: "category.ruleName" e.g. "color.pureBlack", "spacing.gridPreferred"
  // Also match by category alone e.g. "color" ignores all color rules
  const category = ruleName.split(".")[0];
  return config.ignore.includes(ruleName) || config.ignore.includes(category);
}

// ---------------------------------------------------------------------------
// Helper: check if a color is in the allowed list
// ---------------------------------------------------------------------------

export function isAllowedColor(config: DevsignerConfig, hex: string): boolean {
  return config.allowedColors.some(
    (c) => c.toLowerCase() === hex.toLowerCase(),
  );
}
