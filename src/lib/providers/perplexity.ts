import type { Provider } from "./base";
import { RateLimitError, APIError, withRateLimit, withRetry } from "./rate-limit";
import { LLM_DEFAULTS, type LLMRequest, type LLMResponse } from "./types";

const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions";

export class PerplexityProvider implements Provider {
  readonly name = "perplexity" as const;
  readonly defaultModel: string;
  private apiKey: string;

  constructor(apiKey: string, model = "llama-3.1-sonar-large-128k-online") {
    this.defaultModel = model;
    this.apiKey = apiKey;
  }

  async chat(req: LLMRequest): Promise<LLMResponse> {
    return withRetry(() => withRateLimit(this.name, () => this.doChat(req)));
  }

  private async doChat(req: LLMRequest): Promise<LLMResponse> {
    const model = req.model || this.defaultModel;
    const start = performance.now();

    try {
      const res = await fetch(PERPLEXITY_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: req.messages,
          temperature: req.temperature ?? LLM_DEFAULTS.temperature,
          top_p: req.topP ?? LLM_DEFAULTS.topP,
          max_tokens: req.maxTokens ?? LLM_DEFAULTS.maxTokens,
        }),
        signal: AbortSignal.timeout(req.timeoutMs ?? LLM_DEFAULTS.timeoutMs),
      });

      const latencyMs = performance.now() - start;

      if (res.status === 429) {
        throw new RateLimitError(`Rate limit: ${res.status}`);
      }
      if (res.status >= 500) {
        throw new APIError(`Server error: ${res.status}`);
      }

      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
        usage?: { prompt_tokens?: number; completion_tokens?: number };
      };

      const text = data.choices?.[0]?.message?.content ?? "";
      const tokensIn = data.usage?.prompt_tokens ?? 0;
      const tokensOut = data.usage?.completion_tokens ?? 0;

      return {
        provider: "perplexity",
        model,
        text,
        tokensIn,
        tokensOut,
        httpStatus: res.status,
        latencyMs,
      };
    } catch (err) {
      if (err instanceof RateLimitError || err instanceof APIError) throw err;

      const latencyMs = performance.now() - start;
      const msg = err instanceof Error ? err.message : String(err);

      return {
        provider: "perplexity",
        model,
        text: "",
        tokensIn: 0,
        tokensOut: 0,
        httpStatus: 500,
        latencyMs,
        error: msg,
      };
    }
  }
}
