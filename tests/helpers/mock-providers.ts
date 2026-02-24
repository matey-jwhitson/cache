import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

const openaiHandler = http.post(
  "https://api.openai.com/v1/chat/completions",
  () => {
    return HttpResponse.json({
      id: "chatcmpl-test",
      object: "chat.completion",
      created: Date.now(),
      model: "gpt-4o",
      choices: [
        {
          index: 0,
          message: { role: "assistant", content: "Mock OpenAI response" },
          finish_reason: "stop",
        },
      ],
      usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
    });
  }
);

const openaiEmbeddingsHandler = http.post(
  "https://api.openai.com/v1/embeddings",
  () => {
    const embedding = Array.from({ length: 3072 }, () => Math.random() * 0.01);
    return HttpResponse.json({
      object: "list",
      data: [{ object: "embedding", embedding, index: 0 }],
      model: "text-embedding-3-large",
      usage: { prompt_tokens: 5, total_tokens: 5 },
    });
  }
);

const anthropicHandler = http.post(
  "https://api.anthropic.com/v1/messages",
  () => {
    return HttpResponse.json({
      id: "msg_test",
      type: "message",
      role: "assistant",
      content: [{ type: "text", text: "Mock Anthropic response" }],
      model: "claude-sonnet-4-20250514",
      stop_reason: "end_turn",
      usage: { input_tokens: 10, output_tokens: 20 },
    });
  }
);

const geminiHandler = http.post(
  "https://generativelanguage.googleapis.com/v1beta/models/*",
  () => {
    return HttpResponse.json({
      candidates: [
        {
          content: {
            parts: [{ text: "Mock Gemini response" }],
            role: "model",
          },
          finishReason: "STOP",
        },
      ],
      usageMetadata: {
        promptTokenCount: 10,
        candidatesTokenCount: 20,
        totalTokenCount: 30,
      },
    });
  }
);

const perplexityHandler = http.post(
  "https://api.perplexity.ai/chat/completions",
  () => {
    return HttpResponse.json({
      id: "pplx-test",
      model: "sonar",
      choices: [
        {
          index: 0,
          message: { role: "assistant", content: "Mock Perplexity response" },
          finish_reason: "stop",
        },
      ],
      usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
    });
  }
);

const grokHandler = http.post(
  "https://api.x.ai/v1/chat/completions",
  () => {
    return HttpResponse.json({
      id: "grok-test",
      model: "grok-3",
      choices: [
        {
          index: 0,
          message: { role: "assistant", content: "Mock Grok response" },
          finish_reason: "stop",
        },
      ],
      usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
    });
  }
);

export const handlers = [
  openaiHandler,
  openaiEmbeddingsHandler,
  anthropicHandler,
  geminiHandler,
  perplexityHandler,
  grokHandler,
];

export const server = setupServer(...handlers);
