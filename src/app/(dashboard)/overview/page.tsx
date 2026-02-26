import { db } from "@/lib/db";
import { MetricCard } from "@/components/dashboard/metric-card";

export default async function OverviewPage() {
  const results = await db.auditResult.findMany();

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
      ? mentionedWithRank.reduce((s, r) => s + (r.mentionRank ?? 0), 0) / mentionedWithRank.length
      : 0;

  const byProvider: Record<string, { total: number; mentioned: number; simSum: number }> = {};
  for (const r of results) {
    if (!byProvider[r.provider]) {
      byProvider[r.provider] = { total: 0, mentioned: 0, simSum: 0 };
    }
    byProvider[r.provider].total++;
    if (r.mentioned) byProvider[r.provider].mentioned++;
    byProvider[r.provider].simSum += r.similarity;
  }

  const providerRows = Object.entries(byProvider).map(([provider, stats]) => ({
    provider,
    total: stats.total,
    mentioned: stats.mentioned,
    mentionRate: ((stats.mentioned / stats.total) * 100).toFixed(1),
    avgSimilarity: (stats.simSum / stats.total * 100).toFixed(1),
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Overview</h1>
        <p className="mt-1 text-sm text-zinc-400">
          High-level AEO performance metrics across all providers
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total Prompts"
          value={totalPrompts.toLocaleString()}
        />
        <MetricCard
          label="Mention Rate"
          value={`${(mentionRate * 100).toFixed(1)}%`}
          trend={mentionRate > 0.5 ? "up" : mentionRate > 0 ? "flat" : "down"}
        />
        <MetricCard
          label="Avg Similarity"
          value={`${(avgSimilarity * 100).toFixed(1)}%`}
        />
        <MetricCard
          label="Avg Mention Rank"
          value={avgRank > 0 ? `#${avgRank.toFixed(1)}` : "—"}
        />
      </div>

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
                  <th className="px-4 py-3 text-left font-medium text-zinc-400">Provider</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-400">Total</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-400">Mentioned</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-400">Mention Rate</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-400">Avg Similarity</th>
                </tr>
              </thead>
              <tbody className="bg-zinc-900">
                {providerRows.map((row) => (
                  <tr key={row.provider} className="border-b border-zinc-800/50 last:border-0">
                    <td className="px-4 py-3 font-medium text-white">{row.provider}</td>
                    <td className="px-4 py-3 text-right text-zinc-300">{row.total}</td>
                    <td className="px-4 py-3 text-right text-zinc-300">{row.mentioned}</td>
                    <td className="px-4 py-3 text-right text-zinc-300">{row.mentionRate}%</td>
                    <td className="px-4 py-3 text-right text-zinc-300">{row.avgSimilarity}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
