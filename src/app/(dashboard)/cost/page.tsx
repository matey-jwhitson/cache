import { db } from "@/lib/db";
import { MetricCard } from "@/components/dashboard/metric-card";
import { CostCharts } from "./cost-charts";

export default async function CostPage() {
  const costs = await db.apiCost.findMany({
    orderBy: { timestamp: "desc" },
  });

  const totalSpend = costs.reduce((s, c) => s + c.costUsd, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todaySpend = costs
    .filter((c) => c.timestamp >= today)
    .reduce((s, c) => s + c.costUsd, 0);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const last30 = costs.filter((c) => c.timestamp >= thirtyDaysAgo);
  const daysWithData = new Set(last30.map((c) => c.timestamp.toISOString().slice(0, 10))).size;
  const projectedMonthly = daysWithData > 0
    ? (last30.reduce((s, c) => s + c.costUsd, 0) / daysWithData) * 30
    : 0;

  const byProvider: Record<string, number> = {};
  const byOperation: Record<string, number> = {};
  for (const c of costs) {
    byProvider[c.provider] = (byProvider[c.provider] ?? 0) + c.costUsd;
    byOperation[c.operation] = (byOperation[c.operation] ?? 0) + c.costUsd;
  }

  const providerChartData = Object.entries(byProvider).map(([name, value]) => ({
    name,
    value: Math.round(value * 100) / 100,
  }));

  const operationChartData = Object.entries(byOperation).map(([name, value]) => ({
    name,
    value: Math.round(value * 100) / 100,
  }));

  const recentCosts = costs.slice(0, 50);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Cost Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Track API spend across providers and operations
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Total Spend"
          value={`$${totalSpend.toFixed(4)}`}
          detail={`${costs.length} API calls`}
        />
        <MetricCard
          label="Today"
          value={`$${todaySpend.toFixed(4)}`}
        />
        <MetricCard
          label="Projected Monthly"
          value={`$${projectedMonthly.toFixed(2)}`}
          detail="Based on last 30 days"
        />
      </div>

      <CostCharts
        providerData={providerChartData}
        operationData={operationChartData}
      />

      <div>
        <h2 className="mb-4 text-lg font-semibold text-white">Recent Costs</h2>
        {recentCosts.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center text-sm text-zinc-500">
            No cost data yet — run operations to generate
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/80">
                  <th className="px-4 py-3 text-left font-medium text-zinc-400">Provider</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-400">Model</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-400">Operation</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-400">Tokens In</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-400">Tokens Out</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-400">Cost</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-400">Time</th>
                </tr>
              </thead>
              <tbody className="bg-zinc-900">
                {recentCosts.map((c) => (
                  <tr key={c.id} className="border-b border-zinc-800/50 last:border-0">
                    <td className="px-4 py-3 text-white">{c.provider}</td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-400">{c.model}</td>
                    <td className="px-4 py-3 text-zinc-300">{c.operation}</td>
                    <td className="px-4 py-3 text-right text-zinc-300">{c.tokensIn.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-zinc-300">{c.tokensOut.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-mono text-zinc-200">${c.costUsd.toFixed(6)}</td>
                    <td className="px-4 py-3 text-zinc-400">{c.timestamp.toLocaleString()}</td>
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
