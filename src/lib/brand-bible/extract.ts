import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { extractionSchema } from "./schema";

const SYSTEM_PROMPT = `You are a brand strategist AI specializing in AI engine optimization (AEO). \
Given a brand document, extract structured brand data that will be used to optimize how AI engines \
(ChatGPT, Gemini, Perplexity, etc.) understand and represent this brand.

Extract as much as you can from the document. If a field is not explicitly mentioned, infer it from \
context. Pay special attention to identifying:
- Competitors and market positioning
- Key differentiators and unique value
- Product features and capabilities
- Target audiences with their pain points, goals, and jobs to be done
- Preferred and forbidden terminology

Return empty strings or empty arrays only when there is absolutely no relevant information.`;

export async function extractBrandData(rawText: string) {
  const { object } = await generateObject({
    model: openai("gpt-4o"),
    schema: extractionSchema,
    system: SYSTEM_PROMPT,
    prompt: rawText,
    abortSignal: AbortSignal.timeout(50_000),
  });

  return object;
}
