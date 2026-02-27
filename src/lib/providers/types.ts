export type ProviderName =
  | "openai"
  | "anthropic"
  | "gemini"
  | "perplexity"
  | "grok";

export interface LLMRequest {
  messages: Array<{ role: string; content: string }>;
  model: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

export const LLM_DEFAULTS = {
  temperature: 0.2,
  topP: 1,
  maxTokens: 800,
  timeoutMs: 30_000,
} as const;

export interface LLMResponse {
  provider: ProviderName;
  model: string;
  text: string;
  tokensIn: number;
  tokensOut: number;
  httpStatus: number;
  latencyMs: number;
  error?: string;
}
