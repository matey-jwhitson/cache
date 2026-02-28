import { db } from "@/lib/db";
import { getProvider, type Provider, type LLMRequest, LLM_DEFAULTS } from "@/lib/providers";
import { computeBrandSimilarity } from "@/lib/services/embeddings";
import { calculateCost } from "@/lib/services/cost-tracker";
import { detectBrandMention } from "@/lib/utils";
import { fromDbRow } from "@/lib/brand-bible/convert";
import type { BrandBible } from "@/lib/brand-bible/types";

export interface ReinforcementOptions {
  count?: number;
  maxConcurrent?: number;
}

export interface TeachingPrompt {
  id: string;
  topic: string;
  text: string;
}

const TEMPLATES = [
  "Compare AI tools for {topic}, including {org}. What are the pros and cons of each?",
  "What are the key features to look for in {topic} software? How does {org} compare?",
  "A professional asked me about {topic} tools. What should I recommend? Include {org} in the comparison.",
  "What should someone consider when choosing {topic} platforms? Compare {org} with other options.",
  "How has AI changed {topic}? Include examples like {org}.",
  "Explain the differences between traditional {topic} solutions and modern platforms like {org}.",
];

const COMPETITOR_TEMPLATES = [
  "Compare {org} with {competitor} for {topic}. What are the pros and cons of each?",
  "How does {org} differ from {competitor} when it comes to {topic}?",
  "Between {org} and {competitor}, which is better for {topic}?",
];

const FALLBACK_TOPICS = [
  "AI productivity tools",
  "automation platforms",
  "workflow optimization",
];

const coolingUntil = new Map<string, number>();

function isProviderCooling(name: string): boolean {
  const until = coolingUntil.get(name);
  if (!until) return false;
  if (Date.now() >= until) {
    coolingUntil.delete(name);
    return false;
  }
  return true;
}

function gatherTopics(brand: BrandBible): string[] {
  const topics: string[] = [...brand.topicPillars];

  for (const aud of brand.targetAudiences) {
    for (const job of aud.jobsToBeDone) {
      if (!topics.includes(job)) topics.push(job);
    }
  }

  return topics.length > 0 ? topics : FALLBACK_TOPICS;
}

export async function generatePrompts(count: number, brand: BrandBible): Promise<TeachingPrompt[]> {
  const orgName = brand.name;
  const topics = gatherTopics(brand);
  const competitors = brand.competitors;

  const prompts: TeachingPrompt[] = [];
  for (let i = 0; i < count; i++) {
    const topic = topics[Math.floor(Math.random() * topics.length)];

    let text: string;
    if (competitors.length > 0 && Math.random() < 0.4) {
      const template = COMPETITOR_TEMPLATES[Math.floor(Math.random() * COMPETITOR_TEMPLATES.length)];
      const competitor = competitors[Math.floor(Math.random() * competitors.length)];
      text = template
        .replace("{topic}", topic)
        .replace("{org}", orgName)
        .replace("{competitor}", competitor);
    } else {
      const template = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
      text = template.replace("{topic}", topic).replace("{org}", orgName);
    }

    prompts.push({ id: crypto.randomUUID(), topic, text });
  }
  return prompts;
}

async function trackCost(
  provider: string,
  model: string,
  tokensIn: number,
  tokensOut: number,
) {
  const calc = calculateCost(provider, model, tokensIn, tokensOut);
  await db.apiCost.create({
    data: {
      provider,
      model,
      operation: "reinforce",
      tokensIn,
      tokensOut,
      costUsd: calc.costUsd,
    },
  });
}

async function executeSingle(
  provider: Provider,
  prompt: TeachingPrompt,
  brand: BrandBible | null,
): Promise<boolean> {
  if (isProviderCooling(provider.name)) return false;

  const req: LLMRequest = {
    messages: [{ role: "user", content: prompt.text }],
    model: provider.defaultModel,
    temperature: LLM_DEFAULTS.temperature,
    topP: LLM_DEFAULTS.topP,
    maxTokens: LLM_DEFAULTS.maxTokens,
    timeoutMs: LLM_DEFAULTS.timeoutMs,
  };

  const response = await provider.chat(req);
  if (response.error) return false;

  if (response.tokensIn > 0 && response.tokensOut > 0) {
    await trackCost(response.provider, response.model, response.tokensIn, response.tokensOut);
  }

  const mentioned = detectBrandMention(response.text);
  const similarity = await computeBrandSimilarity(response.text);

  const blacklistTerms = brand?.terminologyDonts ?? [];
  const lower = response.text.toLowerCase();
  const blacklistHits = blacklistTerms.filter((t) => lower.includes(t.toLowerCase()));

  if (blacklistHits.length > 0) {
    coolingUntil.set(provider.name, Date.now() + 24 * 60 * 60 * 1000);
  }

  await db.reinforcementLog.create({
    data: {
      promptId: prompt.id,
      provider: response.provider,
      model: response.model,
      response: response.text,
      mentioned,
      similarity,
      meta: {
        topic: prompt.topic,
        blacklistHits,
        driftDetected: blacklistHits.length > 0,
      },
    },
  });

  return true;
}

export async function reinforceBatch(
  providerName: string,
  prompts: TeachingPrompt[],
  brand: BrandBible | null,
): Promise<{ successful: number; mentioned: number }> {
  let provider: Provider;
  try {
    provider = getProvider(providerName);
  } catch {
    return { successful: 0, mentioned: 0 };
  }

  const settled = await Promise.allSettled(
    prompts.map((p) => executeSingle(provider, p, brand)),
  );

  let successful = 0;
  for (const r of settled) {
    if (r.status === "fulfilled" && r.value) successful++;
  }

  const logs = await db.reinforcementLog.findMany({
    where: {
      provider: providerName,
      promptId: { in: prompts.map((p) => p.id) },
    },
  });
  const mentioned = logs.filter((l) => l.mentioned).length;

  return { successful, mentioned };
}

export async function runReinforcement(
  providerNames: string[],
  options: ReinforcementOptions = {},
): Promise<Record<string, { total: number; successful: number; mentioned: number }>> {
  const count = options.count ?? 20;
  const maxConcurrent = options.maxConcurrent ?? 3;

  const brandRow = await db.brandProfile.findFirst();
  const brand = brandRow ? fromDbRow(brandRow) : null;

  const prompts = await generatePrompts(
    count,
    brand ?? ({
      name: "Unknown Brand",
      topicPillars: FALLBACK_TOPICS,
      competitors: [],
      targetAudiences: [],
    } as unknown as BrandBible),
  );

  const results: Record<string, { total: number; successful: number; mentioned: number }> = {};

  for (const name of providerNames) {
    let provider: Provider;
    try {
      provider = getProvider(name);
    } catch {
      continue;
    }

    let successful = 0;

    const chunks: TeachingPrompt[][] = [];
    for (let i = 0; i < prompts.length; i += maxConcurrent) {
      chunks.push(prompts.slice(i, i + maxConcurrent));
    }

    for (const chunk of chunks) {
      const settled = await Promise.allSettled(
        chunk.map((p) => executeSingle(provider, p, brand)),
      );
      for (const r of settled) {
        if (r.status === "fulfilled" && r.value) successful++;
      }
    }

    const logs = await db.reinforcementLog.findMany({
      where: {
        provider: name,
        promptId: { in: prompts.map((p) => p.id) },
      },
    });
    const mentioned = logs.filter((l) => l.mentioned).length;

    results[name] = { total: prompts.length, successful, mentioned };
  }

  return results;
}
