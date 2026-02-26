import { db } from "@/lib/db";
import Link from "next/link";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LocalTime } from "@/components/ui/local-time";

export default async function OverviewPage() {
  const [results, latestRuns, intentCount] = await Promise.all([
    db.auditResult.findMany({
      include: { run: { select: { model: true, startedAt: true } } },
    }),
    db.auditRun.findMany({ orderBy: { startedAt: "desc" }, take: 10 }),
    db.intentTaxonomy.count(),
  ]);

  const samplePrompts = await db.auditResult.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      provider: true,
      promptId: true,
      responseText: true,
      mentioned: true,
      mentionRank: true,
      similarity: true,
      meta: true,
    },
  });

  const promptIds = samplePrompts.map((s) => s.promptId);
  const intents = await db.intentTaxonomy.findMany({
    where: { id: { in: promptIds } },
  });
  const intentMap = new Map(intents.map((i) => [i.id, i]));

  const totalPrompts = results.length;
  const mentioned = results.filter((r) => r.mentioned);
  const mentionRate = totalPrompts > 0 ? mentioned.length / totalPrompts : 0;
  const avgSimilarity =
    totalPrompts > 0
      ? results.reduce((s, r) => s + r.similarity, 0) / totalPrompts
      : 0;
  const mentionedWithRank = mentioned.filter((r) => r.mentionRank != null);
  const avgRank =
    mentionedWithRank.length > 0
      ? mentionedWithRank.reduce(
          (s, r) => s + (r.mentionRank ?? 0),
          0,
        ) / mentionedWithRank.length
      : 0;

  const byProvider: Record<
    string,
    { total: number; mentioned: number; simSum: number; model: string }
  > = {};
  for (const r of results) {
    if (!byProvider[r.provider]) {
      byProvider[r.provider] = {
        total: 0,
        mentioned: 0,
        simSum: 0,
        model: r.run?.model ?? "—",
      };
    }
    byProvider[r.provider].total++;
    if (r.mentioned) byProvider[r.provider].mentioned++;
    byProvider[r.provider].simSum += r.similarity;
  }

  const providerRows = Object.entries(byProvider).map(([provider, stats]) => ({
    provider,
    model: stats.model,
    total: stats.total,
    mentioned: stats.mentioned,
    mentionRate: ((stats.mentioned / stats.total) * 100).toFixed(1),
    avgSimilarity: ((stats.simSum / stats.total) * 100).toFixed(1),
  }));

  const lastRunTime = latestRuns[0]?.startedAt;
  const uniqueProviders = [...new Set(results.map((r) => r.provider))];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Overview</h1>
        <p className="mt-1 text-sm text-zinc-400">
          AEO audit results — how well AI models know your brand
        </p>
      </div>

      {/* How the Audit Works */}
      <Card>
        <CardHeader>
          <CardTitle>How the Audit Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-sm font-bold text-blue-400">
                1
              </div>
              <h4 className="text-sm font-semibold text-white">
                Send Prompts
              </h4>
              <p className="text-xs leading-relaxed text-zinc-400">
                {intentCount} questions from your intent library are sent to
                each LLM provider. These are real questions your potential
                users ask — like{" "}
                <em>&quot;What are the best AI tools for public defenders?&quot;</em>
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-sm font-bold text-amber-400">
                2
              </div>
              <h4 className="text-sm font-semibold text-white">
                Analyze Responses
              </h4>
              <p className="text-xs leading-relaxed text-zinc-400">
                Each response is checked for{" "}
                <strong className="text-zinc-300">brand mentions</strong>{" "}
                (does the LLM name Matey AI?),{" "}
                <strong className="text-zinc-300">mention rank</strong>{" "}
                (what position in the list?), and{" "}
                <strong className="text-zinc-300">semantic similarity</strong>{" "}
                (how closely does the response relate to what you do?).
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-sm font-bold text-emerald-400">
                3
              </div>
              <h4 className="text-sm font-semibold text-white">
                Track Progress
              </h4>
              <p className="text-xs leading-relaxed text-zinc-400">
                Over time, as you reinforce your brand with content and
                structured data, these numbers should improve. The goal: every
                major LLM should mention Matey AI when users ask about your
                space.
              </p>
            </div>
          </div>
          {lastRunTime && (
            <div className="mt-4 flex items-center gap-2 border-t border-zinc-800 pt-4 text-xs text-zinc-500">
              Last audit ran <LocalTime date={lastRunTime.toISOString()} />{" "}
              across {uniqueProviders.length} provider
              {uniqueProviders.length !== 1 ? "s" : ""} with {intentCount}{" "}
              prompts each
            </div>
          )}
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-white">Key Metrics</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Total Responses"
            value={totalPrompts.toLocaleString()}
            detail={`${intentCount} prompts × ${uniqueProviders.length} providers`}
          />
          <MetricCard
            label="Mention Rate"
            value={`${(mentionRate * 100).toFixed(1)}%`}
            detail={`${mentioned.length} of ${totalPrompts} responses mention your brand`}
            trend={
              mentionRate > 0.5
                ? "up"
                : mentionRate > 0
                  ? "flat"
                  : "down"
            }
          />
          <MetricCard
            label="Avg Similarity"
            value={`${(avgSimilarity * 100).toFixed(1)}%`}
            detail="Semantic closeness to your brand description"
          />
          <MetricCard
            label="Avg Mention Rank"
            value={avgRank > 0 ? `#${avgRank.toFixed(1)}` : "—"}
            detail={
              avgRank > 0
                ? "Position in the LLM's recommendation list"
                : "No brand mentions detected yet"
            }
          />
        </div>
      </div>

      {/* Provider Breakdown */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-white">
          Provider Breakdown
        </h2>
        {providerRows.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center text-sm text-zinc-500">
            No audit data yet — run an audit to see provider metrics
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/80">
                  <th className="px-4 py-3 text-left font-medium text-zinc-400">
                    Provider
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-400">
                    Model
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-400">
                    Responses
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-400">
                    Mentioned
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-400">
                    Mention Rate
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-400">
                    Avg Similarity
                  </th>
                </tr>
              </thead>
              <tbody className="bg-zinc-900">
                {providerRows.map((row) => (
                  <tr
                    key={row.provider}
                    className="border-b border-zinc-800/50 last:border-0"
                  >
                    <td className="px-4 py-3 font-medium text-white">
                      {row.provider}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-400">
                      {row.model}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-300">
                      {row.total}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-300">
                      {row.mentioned}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-300">
                      {row.mentionRate}%
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-300">
                      {row.avgSimilarity}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sample Prompt/Response Pairs */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Sample Audit Results
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              What your audit actually asked and what the LLMs responded
            </p>
          </div>
          <Link
            href="/intents"
            className="text-xs font-medium text-blue-400 hover:text-blue-300"
          >
            View all in Intent Explorer →
          </Link>
        </div>
        {samplePrompts.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center text-sm text-zinc-500">
            No audit results yet — run an audit to see responses
          </div>
        ) : (
          <div className="space-y-3">
            {samplePrompts.map((result) => {
              const intent = intentMap.get(result.promptId);
              const meta = result.meta as Record<string, unknown> | null;
              return (
                <div
                  key={result.id}
                  className="rounded-xl border border-zinc-800 bg-zinc-900"
                >
                  <div className="flex items-start gap-3 px-4 py-3">
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">{result.provider}</Badge>
                        <Badge
                          variant={
                            result.mentioned ? "success" : "destructive"
                          }
                        >
                          {result.mentioned ? "Mentioned" : "Not Mentioned"}
                        </Badge>
                        {result.mentionRank != null && (
                          <Badge variant="outline">
                            Rank #{result.mentionRank}
                          </Badge>
                        )}
                        <span className="text-xs text-zinc-500">
                          Similarity: {(result.similarity * 100).toFixed(1)}%
                        </span>
                        {meta?.intent && (
                          <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-500">
                            {meta.intent as string}
                          </span>
                        )}
                      </div>
                      {intent && (
                        <div className="rounded-lg bg-blue-500/5 px-3 py-2">
                          <p className="text-xs font-medium text-blue-300">
                            Prompt:
                          </p>
                          <p className="mt-0.5 text-sm text-zinc-300">
                            {intent.text}
                          </p>
                        </div>
                      )}
                      <div className="rounded-lg bg-zinc-950 px-3 py-2">
                        <p className="text-xs font-medium text-zinc-500">
                          Response (excerpt):
                        </p>
                        <p className="mt-0.5 line-clamp-4 text-xs leading-relaxed text-zinc-400">
                          {result.responseText}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Metric Definitions */}
      <Card>
        <CardHeader>
          <CardTitle>What These Metrics Mean</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 md:grid-cols-2">
            <div>
              <dt className="text-sm font-semibold text-white">
                Mention Rate
              </dt>
              <dd className="mt-1 text-xs leading-relaxed text-zinc-400">
                The percentage of LLM responses that explicitly name
                &quot;Matey AI&quot; or &quot;Matey&quot;. This is the most
                direct measure of brand visibility — if an AI recommends you
                by name, users discover you.
              </dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-white">
                Semantic Similarity
              </dt>
              <dd className="mt-1 text-xs leading-relaxed text-zinc-400">
                How closely the LLM&apos;s response aligns with your brand
                description, measured via embedding cosine similarity (0–100%).
                Even without a direct mention, high similarity means the LLM
                is talking about your problem space.
              </dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-white">
                Mention Rank
              </dt>
              <dd className="mt-1 text-xs leading-relaxed text-zinc-400">
                When the LLM does mention you, where in its list? #1 means
                you&apos;re the first recommendation. Lower is better.
              </dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-white">
                Provider Coverage
              </dt>
              <dd className="mt-1 text-xs leading-relaxed text-zinc-400">
                Each provider (OpenAI, Anthropic, Google, Perplexity, xAI)
                has its own training data and knowledge. Strong AEO means
                visibility across all of them, not just one.
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
