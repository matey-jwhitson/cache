import OpenAI from "openai";
import type { Provider } from "./base";
import { RateLimitError, APIError, withRateLimit, withRetry } from "./rate-limit";
import { LLM_DEFAULTS, type LLMRequest, type LLMResponse } from "./types";

export class OpenAIProvider implements Provider {
  readonly name = "openai" as const;
  readonly defaultModel: string;
  private client: OpenAI;

  constructor(apiKey: string, model = "gpt-4o") {
    this.defaultModel = model;
    this.client = new OpenAI({ apiKey });
  }

  async chat(req: LLMRequest): Promise<LLMResponse> {
    return withRetry(() => withRateLimit(this.name, () => this.doChat(req)));
  }

  private async doChat(req: LLMRequest): Promise<LLMResponse> {
    const model = req.model || this.defaultModel;
    const start = performance.now();

    try {
      const response = await this.client.chat.completions.create({
        model,
        messages: req.messages as OpenAI.ChatCompletionMessageParam[],
        temperature: req.temperature ?? LLM_DEFAULTS.temperature,
        top_p: req.topP ?? LLM_DEFAULTS.topP,
        max_tokens: req.maxTokens ?? LLM_DEFAULTS.maxTokens,
      });

      const latencyMs = performance.now() - start;

      return {
        provider: "openai",
        model,
        text: response.choices[0]?.message?.content ?? "",
        tokensIn: response.usage?.prompt_tokens ?? 0,
        tokensOut: response.usage?.completion_tokens ?? 0,
        httpStatus: 200,
        latencyMs,
      };
    } catch (err) {
      const latencyMs = performance.now() - start;
      const msg = err instanceof Error ? err.message : String(err);

      if (msg.includes("429") || /rate.?limit/i.test(msg)) {
        throw new RateLimitError(msg);
      }
      if (/5\d{2}/.test(msg)) {
        throw new APIError(msg);
      }

      return {
        provider: "openai",
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
