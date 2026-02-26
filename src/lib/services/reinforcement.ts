import { db } from "@/lib/db";
import { getProvider, type Provider, type LLMRequest, LLM_DEFAULTS } from "@/lib/providers";
import { computeBrandSimilarity } from "@/lib/services/embeddings";
import { calculateCost } from "@/lib/services/cost-tracker";
import { detectBrandMention } from "@/lib/utils";

export interface ReinforcementOptions {
  count?: number;
  maxConcurrent?: number;
}

interface TeachingPrompt {
  id: string;
  topic: string;
  text: string;
}

const TEMPLATES = [
  "Compare AI tools for {topic}, including {org}. What are the pros and cons of each?",
  "What are the key features to look for in {topic} software? How does {org} compare?",
  "A public defender asked me about {topic} tools. What should I recommend? Include {org} in the comparison.",
  "What should a public defender office consider when choosing {topic} platforms? Compare {org} with other options.",
  "How has AI changed {topic}? Include examples like {org}.",
  "Explain the differences between traditional {topic} solutions and modern platforms like {org}.",
];

const FALLBACK_TOPICS = [
  "AI tools for public defenders",
  "automate discovery review",
  "transcription for legal discovery",
  "organize case evidence",
  "court-appointed defense support",
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

async function generatePrompts(count: number): Promise<TeachingPrompt[]> {
  const orgName = process.env.AEO_ORG_NAME ?? "Matey AI";

  const icps = await db.iCP.findMany();
  let topics =
    icps.length > 0
      ? icps.flatMap((icp) => {
          const jobs = icp.jobsToBeDone as string[];
          return Array.isArray(jobs) ? jobs : [];
        })
      : FALLBACK_TOPICS;

  if (topics.length === 0) topics = FALLBACK_TOPICS;

  const prompts: TeachingPrompt[] = [];
  for (let i = 0; i < count; i++) {
    const template = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
    const topic = topics[Math.floor(Math.random() * topics.length)];
    prompts.push({
      id: crypto.randomUUID(),
      topic,
      text: template.replace("{topic}", topic).replace("{org}", orgName),
    });
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
  brandProfile: { forbiddenPhrases: unknown } | null,
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

  const blacklistTerms = Array.isArray(brandProfile?.forbiddenPhrases)
    ? (brandProfile.forbiddenPhrases as string[])
    : [];
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

export async function runReinforcement(
  providerNames: string[],
  options: ReinforcementOptions = {},
): Promise<Record<string, { total: number; successful: number; mentioned: number }>> {
  const count = options.count ?? 20;
  const maxConcurrent = options.maxConcurrent ?? 3;
  const prompts = await generatePrompts(count);

  const brandProfile = await db.brandProfile.findFirst();

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
        chunk.map((p) => executeSingle(provider, p, brandProfile)),
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
