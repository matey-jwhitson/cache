import { db } from "@/lib/db";

export interface AppConfigData {
  auditor: {
    maxConcurrent: number;
    defaultSample: number;
    models: Record<string, string>;
  };
  reinforcement: {
    count: number;
    coolingPeriodMinutes: number;
    minIntentSimilarity: number;
  };
  providerDefaults: {
    temperature: number;
    topP: number;
    maxTokens: number;
    timeoutMs: number;
  };
  contentGates: {
    zeroForbidden: boolean;
    minReadability: number;
    minSimilarityToGolden: number;
    requireCitations: boolean;
  };
}

const DEFAULTS: AppConfigData = {
  auditor: {
    maxConcurrent: 5,
    defaultSample: 1.0,
    models: {
      openai: "gpt-5.2",
      anthropic: "claude-sonnet-4-6",
      gemini: "gemini-2.5-pro",
      perplexity: "sonar-pro",
      grok: "grok-4",
    },
  },
  reinforcement: {
    count: 20,
    coolingPeriodMinutes: 1440,
    minIntentSimilarity: 0.8,
  },
  providerDefaults: {
    temperature: 0.2,
    topP: 1.0,
    maxTokens: 800,
    timeoutMs: 45_000,
  },
  contentGates: {
    zeroForbidden: true,
    minReadability: 55,
    minSimilarityToGolden: 0.92,
    requireCitations: true,
  },
};

export async function loadConfig(): Promise<AppConfigData> {
  try {
    const rows = await db.appConfig.findMany();
    const overrides: Record<string, unknown> = {};
    for (const row of rows) {
      overrides[row.key] = row.value;
    }

    return deepMerge(
      DEFAULTS as unknown as Record<string, unknown>,
      overrides,
    ) as unknown as AppConfigData;
  } catch {
    return DEFAULTS;
  }
}

function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key]) &&
      target[key] &&
      typeof target[key] === "object" &&
      !Array.isArray(target[key])
    ) {
      result[key] = deepMerge(
        target[key] as Record<string, unknown>,
        source[key] as Record<string, unknown>,
      );
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

export { DEFAULTS as CONFIG_DEFAULTS };
