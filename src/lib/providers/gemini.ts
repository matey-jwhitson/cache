import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Provider } from "./base";
import { RateLimitError, APIError, withRateLimit, withRetry } from "./rate-limit";
import { LLM_DEFAULTS, type LLMRequest, type LLMResponse } from "./types";

export class GeminiProvider implements Provider {
  readonly name = "gemini" as const;
  readonly defaultModel: string;
  private genAI: GoogleGenerativeAI;

  constructor(apiKey: string, model = "gemini-1.5-pro") {
    this.defaultModel = model;
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async chat(req: LLMRequest): Promise<LLMResponse> {
    return withRetry(() => withRateLimit(this.name, () => this.doChat(req)));
  }

  private convertToPrompt(
    messages: Array<{ role: string; content: string }>,
  ): string {
    const parts: string[] = [];
    for (const msg of messages) {
      if (msg.role === "system") parts.push(`Instructions: ${msg.content}`);
      else if (msg.role === "user") parts.push(`User: ${msg.content}`);
      else if (msg.role === "assistant") parts.push(`Assistant: ${msg.content}`);
    }
    return parts.join("\n\n");
  }

  private async doChat(req: LLMRequest): Promise<LLMResponse> {
    const modelName = req.model || this.defaultModel;
    const start = performance.now();

    try {
      const model = this.genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: req.temperature ?? LLM_DEFAULTS.temperature,
          topP: req.topP ?? LLM_DEFAULTS.topP,
          maxOutputTokens: req.maxTokens ?? LLM_DEFAULTS.maxTokens,
        },
      });

      const prompt = this.convertToPrompt(req.messages);
      const result = await model.generateContent(prompt);
      const response = result.response;
      const latencyMs = performance.now() - start;

      const text = response.text() ?? "";
      const usage = response.usageMetadata;

      const tokensIn = usage?.promptTokenCount ?? Math.round(prompt.split(/\s+/).length * 1.3);
      const tokensOut = usage?.candidatesTokenCount ?? Math.round(text.split(/\s+/).length * 1.3);

      return {
        provider: "gemini",
        model: modelName,
        text,
        tokensIn,
        tokensOut,
        httpStatus: 200,
        latencyMs,
      };
    } catch (err) {
      const latencyMs = performance.now() - start;
      const msg = err instanceof Error ? err.message : String(err);

      if (/quota|rate/i.test(msg)) {
        throw new RateLimitError(msg);
      }
      if (/50[0-3]/.test(msg)) {
        throw new APIError(msg);
      }

      return {
        provider: "gemini",
        model: modelName,
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
