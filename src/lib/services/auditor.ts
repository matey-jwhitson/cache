import { db } from "@/lib/db";
import { getProvider, type Provider, type LLMRequest, LLM_DEFAULTS } from "@/lib/providers";
import { computeBrandSimilarity } from "@/lib/services/embeddings";
import { calculateCost } from "@/lib/services/cost-tracker";
import { detectBrandMention, extractMentionRank } from "@/lib/utils";

export interface AuditOptions {
  limit?: number;
  sample?: number;
  intentFilter?: string;
  modelOverride?: string;
  maxConcurrent?: number;
}

export interface AuditPrompt {
  id: string;
  text: string;
  intentClass: string;
}

async function trackCost(
  provider: string,
  model: string,
  operation: string,
  tokensIn: number,
  tokensOut: number,
  jobRunId?: string,
) {
  const calc = calculateCost(provider, model, tokensIn, tokensOut);
  await db.apiCost.create({
    data: {
      provider,
      model,
      operation,
      jobRunId: jobRunId ?? null,
      tokensIn,
      tokensOut,
      costUsd: calc.costUsd,
    },
  });
}

export async function loadIntents(opts: AuditOptions = {}): Promise<AuditPrompt[]> {
  let intents = await db.intentTaxonomy.findMany();

  if (opts.intentFilter) {
    const filter = opts.intentFilter.toLowerCase();
    intents = intents.filter(
      (i) =>
        i.intentClass.toLowerCase().includes(filter) ||
        i.text.toLowerCase().includes(filter),
    );
  }

  if (opts.sample != null && opts.sample > 0 && opts.sample < 1) {
    const k = Math.floor(intents.length * opts.sample);
    intents = intents.sort(() => Math.random() - 0.5).slice(0, k);
  }

  if (opts.limit != null) {
    intents = intents.slice(0, opts.limit);
  }

  return intents.map((i) => ({
    id: i.id,
    text: i.text,
    intentClass: i.intentClass,
  }));
}

async function auditSinglePrompt(
  provider: Provider,
  prompt: AuditPrompt,
  runId: string,
  modelOverride?: string,
): Promise<boolean> {
  const req: LLMRequest = {
    messages: [{ role: "user", content: prompt.text }],
    model: modelOverride ?? provider.defaultModel,
    temperature: LLM_DEFAULTS.temperature,
    topP: LLM_DEFAULTS.topP,
    maxTokens: LLM_DEFAULTS.maxTokens,
    timeoutMs: LLM_DEFAULTS.timeoutMs,
  };

  const response = await provider.chat(req);

  if (response.error) return false;

  if (response.tokensIn > 0 && response.tokensOut > 0) {
    await trackCost(
      response.provider,
      response.model,
      "audit",
      response.tokensIn,
      response.tokensOut,
    );
  }

  const mentioned = detectBrandMention(response.text);
  const mentionRank = extractMentionRank(response.text);
  const similarity = await computeBrandSimilarity(response.text);

  await db.auditResult.create({
    data: {
      runId,
      promptId: prompt.id,
      provider: response.provider,
      responseText: response.text,
      mentioned,
      mentionRank: mentionRank ?? null,
      similarity,
      meta: {
        tokensIn: response.tokensIn,
        tokensOut: response.tokensOut,
        latencyMs: response.latencyMs,
        intent: prompt.intentClass,
        promptText: prompt.text,
      },
    },
  });

  return true;
}

export async function auditPromptBatch(
  providerName: string,
  prompts: AuditPrompt[],
  runId: string,
  modelOverride?: string,
): Promise<{ successful: number; failed: number }> {
  const provider = getProvider(providerName);
  let successful = 0;
  let failed = 0;

  const settled = await Promise.allSettled(
    prompts.map((p) =>
      auditSinglePrompt(provider, p, runId, modelOverride),
    ),
  );

  for (const r of settled) {
    if (r.status === "fulfilled" && r.value) successful++;
    else failed++;
  }

  return { successful, failed };
}

export async function runAuditForProvider(
  providerName: string,
  options: AuditOptions = {},
): Promise<{ runId: string; successful: number; failed: number }> {
  const provider = getProvider(providerName);
  const prompts = await loadIntents(options);
  const maxConcurrent = options.maxConcurrent ?? 5;

  const run = await db.auditRun.create({
    data: {
      provider: providerName,
      model: options.modelOverride ?? provider.defaultModel,
      totalPrompts: prompts.length,
    },
  });

  let successful = 0;
  let failed = 0;

  const chunks: AuditPrompt[][] = [];
  for (let i = 0; i < prompts.length; i += maxConcurrent) {
    chunks.push(prompts.slice(i, i + maxConcurrent));
  }

  for (const chunk of chunks) {
    const result = await auditPromptBatch(providerName, chunk, run.id, options.modelOverride);
    successful += result.successful;
    failed += result.failed;
  }

  await db.auditRun.update({
    where: { id: run.id },
    data: {
      completedAt: new Date(),
      successful,
      failed,
    },
  });

  return { runId: run.id, successful, failed };
}

export async function runAudit(
  providerNames: string[],
  options: AuditOptions = {},
): Promise<Record<string, { runId: string; successful: number; failed: number }>> {
  const results: Record<string, { runId: string; successful: number; failed: number }> = {};
  for (const name of providerNames) {
    try {
      results[name] = await runAuditForProvider(name, options);
    } catch {
      // provider unavailable or failed entirely — skip
    }
  }
  return results;
}
