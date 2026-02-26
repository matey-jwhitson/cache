import { db } from "@/lib/db";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LocalTime } from "@/components/ui/local-time";
import { cn } from "@/lib/utils";

export default async function AlignmentPage() {
  const results = await db.auditResult.findMany({
    select: {
      provider: true,
      mentioned: true,
      similarity: true,
      meta: true,
    },
  });

  const providers = [...new Set(results.map((r) => r.provider))];
  const intents = [...new Set(results.map((r) => {
    const meta = r.meta as Record<string, unknown> | null;
    return (meta?.intent as string) ?? "unknown";
  }))];

  const heatmap: Record<string, Record<string, { count: number; simSum: number; mentioned: number }>> = {};
  for (const intent of intents) {
    heatmap[intent] = {};
    for (const provider of providers) {
      heatmap[intent][provider] = { count: 0, simSum: 0, mentioned: 0 };
    }
  }

  for (const r of results) {
    const meta = r.meta as Record<string, unknown> | null;
    const intent = (meta?.intent as string) ?? "unknown";
    if (heatmap[intent]?.[r.provider]) {
      heatmap[intent][r.provider].count++;
      heatmap[intent][r.provider].simSum += r.similarity;
      if (r.mentioned) heatmap[intent][r.provider].mentioned++;
    }
  }

  const reinforcementLogs = await db.reinforcementLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const driftDetections = reinforcementLogs.filter((l) => {
    const meta = l.meta as Record<string, unknown> | null;
    return meta?.driftDetected === true;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Intent Alignment</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Heatmap of mention alignment by intent and provider
        </p>
      </div>

      {providers.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center text-sm text-zinc-500">
          No audit data yet — run an audit to see alignment
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Alignment Heatmap</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="px-3 py-2 text-left font-medium text-zinc-400">Intent</th>
                    {providers.map((p) => (
                      <th key={p} className="px-3 py-2 text-center font-medium text-zinc-400">{p}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {intents.map((intent) => (
                    <tr key={intent} className="border-b border-zinc-800/50 last:border-0">
                      <td className="px-3 py-2 font-medium text-white">{intent}</td>
                      {providers.map((provider) => {
                        const cell = heatmap[intent][provider];
                        const rate = cell.count > 0 ? cell.mentioned / cell.count : 0;
                        const sim = cell.count > 0 ? cell.simSum / cell.count : 0;
                        return (
                          <td key={provider} className="px-3 py-2 text-center">
                            <div
                              className={cn(
                                "mx-auto flex h-10 w-16 items-center justify-center rounded-md text-xs font-medium",
                                rate >= 0.7 ? "bg-emerald-500/20 text-emerald-400" :
                                rate >= 0.3 ? "bg-amber-500/20 text-amber-400" :
                                cell.count > 0 ? "bg-red-500/20 text-red-400" :
                                "bg-zinc-800 text-zinc-600",
                              )}
                              title={`Mention: ${(rate * 100).toFixed(0)}% | Sim: ${(sim * 100).toFixed(0)}%`}
                            >
                              {cell.count > 0
                                ? `${(rate * 100).toFixed(0)}%`
                                : "—"}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex gap-4 text-xs text-zinc-500">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm bg-emerald-500/20" /> {"≥70%"}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm bg-amber-500/20" /> {"30–70%"}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm bg-red-500/20" /> {"<30%"}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Drift Detection</CardTitle>
        </CardHeader>
        <CardContent>
          {driftDetections.length === 0 ? (
            <p className="text-sm text-zinc-500">No drift detected</p>
          ) : (
            <div className="space-y-2">
              {driftDetections.map((log) => {
                const meta = log.meta as Record<string, unknown> | null;
                const hits = (meta?.blacklistHits as string[]) ?? [];
                return (
                  <div
                    key={log.id}
                    className="flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3"
                  >
                    <Badge variant="destructive">Drift</Badge>
                    <span className="text-sm text-zinc-300">
                      {log.provider} — forbidden terms: {hits.join(", ")}
                    </span>
                    <LocalTime
                      date={log.createdAt.toISOString()}
                      className="ml-auto text-xs text-zinc-500"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
