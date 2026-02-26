import Anthropic from "@anthropic-ai/sdk";
import type { Provider } from "./base";
import { RateLimitError, APIError, withRateLimit, withRetry } from "./rate-limit";
import { LLM_DEFAULTS, type LLMRequest, type LLMResponse } from "./types";

export class AnthropicProvider implements Provider {
  readonly name = "anthropic" as const;
  readonly defaultModel: string;
  private client: Anthropic;

  constructor(apiKey: string, model = "claude-sonnet-4-6") {
    this.defaultModel = model;
    this.client = new Anthropic({ apiKey });
  }

  async chat(req: LLMRequest): Promise<LLMResponse> {
    return withRetry(() => withRateLimit(this.name, () => this.doChat(req)));
  }

  private convertMessages(
    messages: Array<{ role: string; content: string }>,
  ): { system: string; converted: Array<{ role: "user" | "assistant"; content: string }> } {
    let system = "";
    const converted: Array<{ role: "user" | "assistant"; content: string }> = [];

    for (const msg of messages) {
      if (msg.role === "system") {
        system = msg.content;
      } else if (msg.role === "user" || msg.role === "assistant") {
        converted.push({ role: msg.role, content: msg.content });
      }
    }

    return { system, converted };
  }

  private async doChat(req: LLMRequest): Promise<LLMResponse> {
    const model = req.model || this.defaultModel;
    const start = performance.now();

    try {
      const { system, converted } = this.convertMessages(req.messages);

      const response = await this.client.messages.create({
        model,
        messages: converted,
        ...(system ? { system } : {}),
        temperature: req.temperature ?? LLM_DEFAULTS.temperature,
        top_p: req.topP ?? LLM_DEFAULTS.topP,
        max_tokens: req.maxTokens ?? LLM_DEFAULTS.maxTokens,
      });

      const latencyMs = performance.now() - start;

      let text = "";
      for (const block of response.content) {
        if (block.type === "text") {
          text += block.text;
        }
      }

      return {
        provider: "anthropic",
        model,
        text,
        tokensIn: response.usage?.input_tokens ?? 0,
        tokensOut: response.usage?.output_tokens ?? 0,
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
        provider: "anthropic",
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
