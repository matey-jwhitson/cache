const PRICING: Record<string, Record<string, { input: number; output: number }>> = {
  openai: {
    "gpt-4o": { input: 2.5, output: 10.0 },
    "gpt-4o-mini": { input: 0.15, output: 0.6 },
  },
  anthropic: {
    "claude-3-haiku-20240307": { input: 0.25, output: 1.25 },
    "claude-3-5-sonnet-latest": { input: 3.0, output: 15.0 },
    "claude-3-5-sonnet-20241022": { input: 3.0, output: 15.0 },
  },
  google: {
    "gemini-2.0-flash": { input: 0.075, output: 0.3 },
    "gemini-1.5-pro": { input: 1.25, output: 5.0 },
  },
  perplexity: {
    sonar: { input: 1.0, output: 1.0 },
    "sonar-pro": { input: 3.0, output: 15.0 },
  },
  xai: {
    "grok-2-latest": { input: 2.0, output: 10.0 },
    "grok-beta": { input: 2.0, output: 10.0 },
  },
};

const PROVIDER_MAP: Record<string, string> = {
  openai: "openai",
  anthropic: "anthropic",
  gemini: "google",
  perplexity: "perplexity",
  grok: "xai",
};

export interface CostCalculation {
  provider: string;
  model: string;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
}

export function calculateCost(
  provider: string,
  model: string,
  tokensIn: number,
  tokensOut: number,
): CostCalculation {
  const normalized = PROVIDER_MAP[provider.toLowerCase()] ?? provider.toLowerCase();

  if (!(normalized in PRICING)) {
    return {
      provider,
      model,
      tokensIn,
      tokensOut,
      costUsd: (tokensIn * 1.0 + tokensOut * 3.0) / 1_000_000,
    };
  }

  const models = PRICING[normalized];
  const modelPricing = models[model] ?? Object.values(models)[0];

  const cost =
    (tokensIn / 1_000_000) * modelPricing.input +
    (tokensOut / 1_000_000) * modelPricing.output;

  return {
    provider,
    model,
    tokensIn,
    tokensOut,
    costUsd: Math.round(cost * 10000) / 10000,
  };
}

export function estimateAuditCost(
  numPrompts = 40,
  _numProviders = 5,
): number {
  const avgIn = 150;
  const avgOut = 200;
  let total = 0;

  for (const models of Object.values(PRICING)) {
    const pricing = Object.values(models)[0];
    total +=
      (avgIn * numPrompts) / 1_000_000 * pricing.input +
      (avgOut * numPrompts) / 1_000_000 * pricing.output;
  }

  return Math.round(total * 100) / 100;
}

export function estimateReinforcementCost(
  numPrompts = 25,
  _numProviders = 5,
): number {
  const avgIn = 200;
  const avgOut = 300;
  let total = 0;

  for (const models of Object.values(PRICING)) {
    const pricing = Object.values(models)[0];
    total +=
      (avgIn * numPrompts) / 1_000_000 * pricing.input +
      (avgOut * numPrompts) / 1_000_000 * pricing.output;
  }

  return Math.round(total * 100) / 100;
}

export function estimateContentBuildCost(): number {
  const avgIn = 500;
  const avgOut = 1000;
  const numPieces = 3;
  const pricing = PRICING.openai["gpt-4o"];

  const cost =
    (avgIn * numPieces) / 1_000_000 * pricing.input +
    (avgOut * numPieces) / 1_000_000 * pricing.output;

  return Math.round(cost * 100) / 100;
}

export function getMonthlyProjection(
  daysHistory: number,
  totalSpent: number,
): number {
  if (daysHistory === 0) return 0;
  const dailyAvg = totalSpent / daysHistory;
  return Math.round(dailyAvg * 30 * 100) / 100;
}
