import type { Provider } from "./base";
import { OpenAIProvider } from "./openai";
import { AnthropicProvider } from "./anthropic";
import { GeminiProvider } from "./gemini";
import { PerplexityProvider } from "./perplexity";
import { GrokProvider } from "./grok";

export type { Provider } from "./base";
export type { LLMRequest, LLMResponse, ProviderName } from "./types";
export { LLM_DEFAULTS } from "./types";
export { RateLimitError, APIError } from "./rate-limit";
export { OpenAIProvider } from "./openai";
export { AnthropicProvider } from "./anthropic";
export { GeminiProvider } from "./gemini";
export { PerplexityProvider } from "./perplexity";
export { GrokProvider } from "./grok";

function env(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env var: ${key}`);
  return v;
}

export function getProvider(name: string): Provider {
  switch (name.toLowerCase()) {
    case "openai":
      return new OpenAIProvider(env("OPENAI_API_KEY"));
    case "anthropic":
      return new AnthropicProvider(env("ANTHROPIC_API_KEY"));
    case "gemini":
      return new GeminiProvider(env("GEMINI_API_KEY"));
    case "perplexity":
      return new PerplexityProvider(env("PPLX_API_KEY"));
    case "grok":
      return new GrokProvider(env("XAI_API_KEY"));
    default:
      throw new Error(`Unknown provider: ${name}`);
  }
}

const PROVIDER_NAMES = ["openai", "anthropic", "gemini", "perplexity", "grok"] as const;

export function getAvailableProviders(): Provider[] {
  const providers: Provider[] = [];
  for (const name of PROVIDER_NAMES) {
    try {
      providers.push(getProvider(name));
    } catch {
      // env var missing — skip
    }
  }
  return providers;
}
