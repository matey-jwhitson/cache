export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RateLimitError";
  }
}

export class APIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "APIError";
  }
}

const MAX_CONCURRENCY: Record<string, number> = {
  openai: 10,
  anthropic: 5,
  gemini: 5,
  perplexity: 3,
  grok: 2,
};

const activeCounts = new Map<string, number>();

function getLimit(provider: string): number {
  return MAX_CONCURRENCY[provider] ?? 5;
}

export async function withRateLimit<T>(
  provider: string,
  fn: () => Promise<T>,
): Promise<T> {
  const limit = getLimit(provider);

  while ((activeCounts.get(provider) ?? 0) >= limit) {
    await new Promise((r) => setTimeout(r, 50));
  }

  activeCounts.set(provider, (activeCounts.get(provider) ?? 0) + 1);
  try {
    return await fn();
  } finally {
    activeCounts.set(provider, (activeCounts.get(provider) ?? 0) - 1);
  }
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  minWaitMs = 1_000,
  maxWaitMs = 10_000,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (
        !(err instanceof RateLimitError) &&
        !(err instanceof APIError)
      ) {
        throw err;
      }
      if (attempt === maxAttempts) break;

      const waitMs = Math.min(
        minWaitMs * Math.pow(2, attempt - 1),
        maxWaitMs,
      );
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }

  throw lastError;
}
