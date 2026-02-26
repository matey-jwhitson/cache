import { db } from "@/lib/db";
import { ReinforcementCharts } from "./reinforcement-charts";

export default async function ReinforcementPage() {
  const logs = await db.reinforcementLog.findMany({
    orderBy: { createdAt: "desc" },
  });

  const byProvider: Record<string, { total: number; mentioned: number; simSum: number }> = {};
  for (const log of logs) {
    if (!byProvider[log.provider]) {
      byProvider[log.provider] = { total: 0, mentioned: 0, simSum: 0 };
    }
    byProvider[log.provider].total++;
    if (log.mentioned) byProvider[log.provider].mentioned++;
    byProvider[log.provider].simSum += log.similarity;
  }

  const summaryRows = Object.entries(byProvider).map(([provider, stats]) => ({
    provider,
    total: stats.total,
    mentioned: stats.mentioned,
    mentionRate: ((stats.mentioned / stats.total) * 100).toFixed(1),
    avgSimilarity: ((stats.simSum / stats.total) * 100).toFixed(1),
  }));

  const byDate: Record<string, Record<string, { count: number; mentioned: number }>> = {};
  for (const log of logs) {
    const date = log.createdAt.toISOString().slice(0, 10);
    if (!byDate[date]) byDate[date] = {};
    if (!byDate[date][log.provider]) byDate[date][log.provider] = { count: 0, mentioned: 0 };
    byDate[date][log.provider].count++;
    if (log.mentioned) byDate[date][log.provider].mentioned++;
  }

  const providers = Object.keys(byProvider);
  const dates = Object.keys(byDate).sort();
  const trendData = dates.map((date) => {
    const row: Record<string, unknown> = { date };
    for (const p of providers) {
      const stats = byDate[date]?.[p];
      row[p] = stats ? Math.round((stats.mentioned / stats.count) * 1000) / 10 : null;
    }
    return row;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Reinforcement Impact</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Measure how reinforcement campaigns affect brand mentions
        </p>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-white">Summary by Provider</h2>
        {summaryRows.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center text-sm text-zinc-500">
            No reinforcement data yet — run a reinforcement campaign
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
                {summaryRows.map((row) => (
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

      {trendData.length > 0 && (
        <ReinforcementCharts providers={providers} trendData={trendData} />
      )}
    </div>
  );
}
