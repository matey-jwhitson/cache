import { db } from "@/lib/db";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LocalTime } from "@/components/ui/local-time";
import { cn } from "@/lib/utils";

function humanizeSlug(slug: string): string {
  return slug
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function AlignmentPage() {
  const [results, allIntents, reinforcementLogs] = await Promise.all([
    db.auditResult.findMany({
      orderBy: { createdAt: "desc" },
      take: 1000,
      select: {
        provider: true,
        mentioned: true,
        similarity: true,
        meta: true,
        promptId: true,
      },
    }),
    db.intentTaxonomy.findMany(),
    db.reinforcementLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const intentById = new Map(allIntents.map((i) => [i.id, i]));
  const intentByClass = new Map(allIntents.map((i) => [i.intentClass, i]));

  function resolveIntentLabel(r: (typeof results)[0]): string {
    const meta = r.meta as Record<string, unknown> | null;
    const intentSlug = (meta?.intent as string) ?? "unknown";

    const byId = intentById.get(r.promptId);
    if (byId) return byId.text;

    const byClass = intentByClass.get(intentSlug);
    if (byClass) return byClass.text;

    return humanizeSlug(intentSlug);
  }

  function resolveIntentGroup(r: (typeof results)[0]): string {
    const meta = r.meta as Record<string, unknown> | null;
    return (meta?.intent as string) ?? "unknown";
  }

  const providers = [...new Set(results.map((r) => r.provider))].sort();
  const intentSlugs = [...new Set(results.map(resolveIntentGroup))];

  const intentLabels = new Map<string, string>();
  for (const slug of intentSlugs) {
    const match = results.find((r) => resolveIntentGroup(r) === slug);
    if (match) {
      intentLabels.set(slug, resolveIntentLabel(match));
    } else {
      intentLabels.set(slug, humanizeSlug(slug));
    }
  }

  const heatmap: Record<
    string,
    Record<string, { count: number; simSum: number; mentioned: number }>
  > = {};
  for (const slug of intentSlugs) {
    heatmap[slug] = {};
    for (const provider of providers) {
      heatmap[slug][provider] = { count: 0, simSum: 0, mentioned: 0 };
    }
  }

  for (const r of results) {
    const slug = resolveIntentGroup(r);
    if (heatmap[slug]?.[r.provider]) {
      heatmap[slug][r.provider].count++;
      heatmap[slug][r.provider].simSum += r.similarity;
      if (r.mentioned) heatmap[slug][r.provider].mentioned++;
    }
  }

  const totalResults = results.length;
  const totalMentioned = results.filter((r) => r.mentioned).length;
  const overallRate = totalResults > 0 ? totalMentioned / totalResults : 0;

  const driftDetections = reinforcementLogs.filter((l) => {
    const meta = l.meta as Record<string, unknown> | null;
    return meta?.driftDetected === true;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Brand Alignment</h1>
        <p className="mt-1 text-sm text-zinc-400">
          When we ask AI models questions your customers would ask, how often do
          they recommend your brand? This page breaks that down by question
          category and AI provider.
        </p>
      </div>

      {providers.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center text-sm text-zinc-500">
          No audit data yet &mdash; run an audit from the Control Panel to see
          alignment results.
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Questions Tested
              </p>
              <p className="mt-1 text-2xl font-bold text-white">
                {intentSlugs.length}
              </p>
              <p className="mt-0.5 text-xs text-zinc-500">
                unique question categories
              </p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                AI Providers
              </p>
              <p className="mt-1 text-2xl font-bold text-white">
                {providers.length}
              </p>
              <p className="mt-0.5 text-xs text-zinc-500">
                {providers.join(", ")}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Overall Mention Rate
              </p>
              <p
                className={cn(
                  "mt-1 text-2xl font-bold",
                  overallRate >= 0.7
                    ? "text-emerald-400"
                    : overallRate >= 0.3
                      ? "text-amber-400"
                      : "text-red-400",
                )}
              >
                {(overallRate * 100).toFixed(1)}%
              </p>
              <p className="mt-0.5 text-xs text-zinc-500">
                across {totalResults.toLocaleString()} total responses
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Mention Rate by Question &amp; Provider</CardTitle>
              <p className="text-sm text-zinc-400">
                Each cell shows how often the AI provider mentioned your brand
                when asked that type of question. Green is good ({"\u2265"}70%),
                amber is moderate (30&ndash;70%), and red means your brand is
                rarely mentioned ({"<"}30%).
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="px-3 py-2 text-left font-medium text-zinc-400">
                        Question Category
                      </th>
                      {providers.map((p) => (
                        <th
                          key={p}
                          className="px-3 py-2 text-center font-medium text-zinc-400 capitalize"
                        >
                          {p}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {intentSlugs.map((slug) => (
                      <tr
                        key={slug}
                        className="border-b border-zinc-800/50 last:border-0"
                      >
                        <td className="max-w-xs px-3 py-2 text-white">
                          <span
                            className="line-clamp-2 text-sm"
                            title={intentLabels.get(slug) ?? slug}
                          >
                            {intentLabels.get(slug) ?? slug}
                          </span>
                        </td>
                        {providers.map((provider) => {
                          const cell = heatmap[slug][provider];
                          const rate =
                            cell.count > 0 ? cell.mentioned / cell.count : 0;
                          const sim =
                            cell.count > 0 ? cell.simSum / cell.count : 0;
                          return (
                            <td key={provider} className="px-3 py-2 text-center">
                              <div
                                className={cn(
                                  "mx-auto flex h-10 w-16 items-center justify-center rounded-md text-xs font-medium",
                                  rate >= 0.7
                                    ? "bg-emerald-500/20 text-emerald-400"
                                    : rate >= 0.3
                                      ? "bg-amber-500/20 text-amber-400"
                                      : cell.count > 0
                                        ? "bg-red-500/20 text-red-400"
                                        : "bg-zinc-800 text-zinc-600",
                                )}
                                title={`Mentioned: ${(rate * 100).toFixed(0)}% | Similarity: ${(sim * 100).toFixed(0)}% | ${cell.mentioned}/${cell.count} responses`}
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

              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-zinc-500">
                <span className="font-medium text-zinc-400">Legend:</span>
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-sm bg-emerald-500/20" />
                  {"\u2265"}70% &mdash; Strong alignment
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-sm bg-amber-500/20" />
                  30&ndash;70% &mdash; Moderate
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-sm bg-red-500/20" />
                  {"<"}30% &mdash; Needs improvement
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-sm bg-zinc-800" />
                  No data
                </span>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Drift Detection</CardTitle>
          <p className="text-sm text-zinc-400">
            Drift occurs when an AI provider starts using language that
            contradicts your brand positioning&mdash;like mentioning competitor
            names or off-brand terms. These are flagged automatically during
            reinforcement runs.
          </p>
        </CardHeader>
        <CardContent>
          {driftDetections.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No drift detected &mdash; all recent AI responses are consistent
              with your brand guidelines.
            </p>
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
                      <span className="font-medium capitalize">
                        {log.provider}
                      </span>{" "}
                      used off-brand terms:{" "}
                      <span className="font-mono text-xs text-red-300">
                        {hits.join(", ")}
                      </span>
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
