import { db } from "@/lib/db";

export interface KPIs {
  mentionRate: number;
  avgSimilarity: number;
  avgMentionRank: number | null;
  totalPrompts: number;
}

export interface AnalyzerOptions {
  provider?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface TrendPoint {
  provider: string;
  date: string;
  totalPrompts: number;
  mentions: number;
  mentionRate: number;
  avgSimilarity: number;
}

export interface IntentBreakdown {
  provider: string;
  promptId: string;
  mentioned: boolean;
  mentionRank: number | null;
  similarity: number;
  responseSnippet: string;
  meta: unknown;
}

function dateFilter(opts: AnalyzerOptions) {
  const where: Record<string, unknown> = {};
  if (opts.provider) where.provider = opts.provider;
  if (opts.startDate || opts.endDate) {
    const createdAt: Record<string, Date> = {};
    if (opts.startDate) createdAt.gte = opts.startDate;
    if (opts.endDate) createdAt.lte = opts.endDate;
    where.createdAt = createdAt;
  }
  return where;
}

export async function getKPIs(options: AnalyzerOptions = {}): Promise<KPIs> {
  const where = dateFilter(options);

  const agg = await db.auditResult.aggregate({
    where,
    _count: { id: true },
    _avg: { similarity: true, mentionRank: true },
  });

  const mentionCount = await db.auditResult.count({
    where: { ...where, mentioned: true },
  });

  const total = agg._count.id;

  return {
    totalPrompts: total,
    mentionRate: total > 0 ? mentionCount / total : 0,
    avgSimilarity: agg._avg.similarity ?? 0,
    avgMentionRank: agg._avg.mentionRank ?? null,
  };
}

export async function getTrends(
  options: AnalyzerOptions & { lastNRuns?: number } = {},
): Promise<TrendPoint[]> {
  const where = dateFilter(options);

  const results = await db.auditResult.findMany({
    where,
    orderBy: { createdAt: "asc" },
    take: 1000,
  });

  const grouped = new Map<string, typeof results>();
  for (const r of results) {
    const date = r.createdAt.toISOString().slice(0, 10);
    const key = `${r.provider}|${date}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(r);
  }

  const trends: TrendPoint[] = [];
  for (const [key, rows] of grouped) {
    const [provider, date] = key.split("|");
    const mentions = rows.filter((r) => r.mentioned).length;
    const avgSim =
      rows.reduce((s, r) => s + r.similarity, 0) / rows.length;

    trends.push({
      provider,
      date,
      totalPrompts: rows.length,
      mentions,
      mentionRate: rows.length > 0 ? mentions / rows.length : 0,
      avgSimilarity: Math.round(avgSim * 1000) / 1000,
    });
  }

  trends.sort((a, b) => {
    if (a.provider !== b.provider) return a.provider.localeCompare(b.provider);
    return a.date.localeCompare(b.date);
  });

  if (options.lastNRuns) {
    const byProvider = new Map<string, TrendPoint[]>();
    for (const t of trends) {
      if (!byProvider.has(t.provider)) byProvider.set(t.provider, []);
      byProvider.get(t.provider)!.push(t);
    }
    const trimmed: TrendPoint[] = [];
    for (const arr of byProvider.values()) {
      trimmed.push(...arr.slice(-options.lastNRuns));
    }
    return trimmed;
  }

  return trends;
}

export async function getIntentBreakdown(
  options: AnalyzerOptions & { limit?: number } = {},
): Promise<IntentBreakdown[]> {
  const where = dateFilter(options);

  const results = await db.auditResult.findMany({
    where,
    take: options.limit ?? 50,
    orderBy: { createdAt: "desc" },
  });

  return results.map((r) => ({
    provider: r.provider,
    promptId: r.promptId,
    mentioned: r.mentioned,
    mentionRank: r.mentionRank,
    similarity: r.similarity,
    responseSnippet: r.responseText.slice(0, 150),
    meta: r.meta,
  }));
}
