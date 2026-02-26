import { db } from "@/lib/db";
import { TrendsCharts } from "./trends-charts";

export default async function TrendsPage() {
  const results = await db.auditResult.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      provider: true,
      mentioned: true,
      similarity: true,
      createdAt: true,
    },
  });

  const providers = [...new Set(results.map((r) => r.provider))];

  const byDate: Record<string, Record<string, { count: number; mentioned: number; simSum: number }>> = {};
  for (const r of results) {
    const date = r.createdAt.toISOString().slice(0, 10);
    if (!byDate[date]) byDate[date] = {};
    if (!byDate[date][r.provider]) {
      byDate[date][r.provider] = { count: 0, mentioned: 0, simSum: 0 };
    }
    byDate[date][r.provider].count++;
    if (r.mentioned) byDate[date][r.provider].mentioned++;
    byDate[date][r.provider].simSum += r.similarity;
  }

  const dates = Object.keys(byDate).sort();

  const mentionData = dates.map((date) => {
    const row: Record<string, unknown> = { date };
    for (const p of providers) {
      const stats = byDate[date][p];
      row[p] = stats ? Math.round((stats.mentioned / stats.count) * 1000) / 10 : null;
    }
    return row;
  });

  const similarityData = dates.map((date) => {
    const row: Record<string, unknown> = { date };
    for (const p of providers) {
      const stats = byDate[date][p];
      row[p] = stats ? Math.round((stats.simSum / stats.count) * 1000) / 10 : null;
    }
    return row;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Trends</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Track mention rate and similarity over time by provider
        </p>
      </div>

      {providers.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center text-sm text-zinc-500">
          No audit data yet — run an audit to see trends
        </div>
      ) : (
        <TrendsCharts
          providers={providers}
          mentionData={mentionData}
          similarityData={similarityData}
        />
      )}
    </div>
  );
}
