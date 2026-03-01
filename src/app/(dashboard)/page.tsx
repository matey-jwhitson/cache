import { db } from "@/lib/db";
import Link from "next/link";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LocalTime } from "@/components/ui/local-time";
import { cn } from "@/lib/utils";
import { ControlPanelActions } from "./control-panel-actions";
import {
  getLatestAuditSummary,
  type SerializedJob,
} from "@/lib/actions/job-actions";

export default async function DashboardPage() {
  const [
    jobs,
    auditSummary,
    latestRuns,
    intentCount,
    reinforcementLogs,
    lastReinforcementJob,
  ] = await Promise.all([
    db.jobRun.findMany({ orderBy: { startedAt: "desc" }, take: 20 }),
    getLatestAuditSummary().catch(() => null),
    db.auditRun.findMany({ orderBy: { startedAt: "desc" }, take: 10 }),
    db.intentTaxonomy.count(),
    db.reinforcementLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 1000,
    }),
    db.jobRun.findFirst({
      where: { jobType: "reinforcement" },
      orderBy: { startedAt: "desc" },
    }),
  ]);

  const serializedJobs: SerializedJob[] = jobs.map((job) => ({
    id: job.id,
    jobType: job.jobType,
    status: job.status,
    triggeredBy: job.triggeredBy,
    startedAt: job.startedAt.toISOString(),
    completedAt: job.completedAt?.toISOString() ?? null,
    durationSeconds: job.durationSeconds,
    errorMessage: job.errorMessage,
  }));

  const recentRunIds = latestRuns
    .filter((r) => r.completedAt != null)
    .slice(0, 8)
    .map((r) => r.id);

  const results = await db.auditResult.findMany({
    where: { runId: { in: recentRunIds } },
    include: { run: { select: { model: true, startedAt: true } } },
  });

  // --- Audit metrics ---
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
      ? mentionedWithRank.reduce((s, r) => s + (r.mentionRank ?? 0), 0) /
        mentionedWithRank.length
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

  // --- Reinforcement metrics ---
  const rTotal = reinforcementLogs.length;
  const rMentioned = reinforcementLogs.filter((l) => l.mentioned).length;
  const rMentionRate = rTotal > 0 ? rMentioned / rTotal : 0;
  const rDriftCount = reinforcementLogs.filter((l) => {
    const meta = l.meta as Record<string, unknown> | null;
    return meta?.driftDetected === true;
  }).length;

  const rByProvider: Record<
    string,
    { total: number; mentioned: number; simSum: number }
  > = {};
  for (const l of reinforcementLogs) {
    if (!rByProvider[l.provider]) {
      rByProvider[l.provider] = { total: 0, mentioned: 0, simSum: 0 };
    }
    rByProvider[l.provider].total++;
    if (l.mentioned) rByProvider[l.provider].mentioned++;
    rByProvider[l.provider].simSum += l.similarity;
  }

  const lastRunTime = latestRuns[0]?.startedAt;
  const uniqueProviders = [...new Set(results.map((r) => r.provider))];

  return (
    <div className="space-y-10">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Your AI Engine Optimization command center &mdash; run jobs, monitor
          results, and track brand visibility across AI models.
        </p>
      </div>

      {/* Actions + Job Status */}
      <ControlPanelActions
        initialJobs={serializedJobs}
        initialSummary={auditSummary}
      />

      {/* How AEO Works */}
      <Card>
        <CardHeader>
          <CardTitle>How AEO Works</CardTitle>
          <p className="text-sm text-zinc-400">
            Two automated processes work together in a continuous loop to get
            your brand recommended by AI models.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-sm font-bold text-blue-400">
                  1
                </div>
                <h4 className="text-sm font-semibold text-white">
                  Audit (Measure)
                </h4>
                <Badge variant="secondary">Daily</Badge>
              </div>
              <p className="text-xs leading-relaxed text-zinc-400">
                Every day, we ask {intentCount} real customer questions to each
                AI model (GPT, Claude, Gemini, Grok) and check: did they mention
                Matey? Where in the list? How relevant was the response? This
                gives you a baseline score for brand visibility.
              </p>
              {lastRunTime && (
                <p className="mt-3 text-xs text-zinc-500">
                  Last ran <LocalTime date={lastRunTime.toISOString()} /> across{" "}
                  {uniqueProviders.length} providers
                </p>
              )}
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-sm font-bold text-purple-400">
                  2
                </div>
                <h4 className="text-sm font-semibold text-white">
                  Reinforce (Improve)
                </h4>
                <Badge variant="secondary">Daily</Badge>
              </div>
              <p className="text-xs leading-relaxed text-zinc-400">
                After measuring, we send teaching prompts to each AI model that
                position Matey alongside competitors in your space. These prompts
                use your Brand Bible &mdash; your value props, topics, and target
                audiences &mdash; to train the models to associate Matey with the
                right queries. Over time, this increases the chance models
                recommend you organically.
              </p>
              {lastReinforcementJob?.startedAt && (
                <p className="mt-3 text-xs text-zinc-500">
                  Last ran{" "}
                  <LocalTime
                    date={lastReinforcementJob.startedAt.toISOString()}
                  />
                </p>
              )}
            </div>
          </div>

          <div className="mt-5 rounded-lg border border-zinc-800/50 bg-zinc-800/20 px-4 py-3">
            <p className="text-xs leading-relaxed text-zinc-400">
              <span className="font-medium text-zinc-300">The goal:</span>{" "}
              Audit measures your starting point. Reinforcement moves the needle.
              Over weeks, you should see mention rates climb as AI models learn
              to associate your brand with the right topics. The{" "}
              <Link
                href="/trends"
                className="font-medium text-blue-400 hover:text-blue-300"
              >
                Trends
              </Link>{" "}
              page tracks this progress over time.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ===== AUDIT METRICS ===== */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-5 w-1 rounded-full bg-blue-500" />
          <h2 className="text-lg font-semibold text-white">Audit Results</h2>
          <span className="text-xs text-zinc-500">
            How well do AI models know your brand right now?
          </span>
        </div>

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
            detail={
              avgSimilarity >= 0.5
                ? "LLMs are talking about your space — reinforce to close the gap"
                : avgSimilarity >= 0.2
                  ? "LLMs discuss related topics but don't connect them to your brand yet"
                  : avgSimilarity > 0
                    ? "Responses are far from your brand positioning"
                    : "No data yet"
            }
            trend={
              avgSimilarity >= 0.5
                ? "up"
                : avgSimilarity > 0
                  ? "flat"
                  : undefined
            }
          />
          <MetricCard
            label="Avg Mention Rank"
            value={avgRank > 0 ? `#${avgRank.toFixed(1)}` : "—"}
            detail={
              avgRank > 0
                ? "Position in the LLM's recommendation list (lower is better)"
                : "No brand mentions detected yet"
            }
          />
        </div>

        {providerRows.length > 0 && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-medium text-zinc-400">
                Audit Breakdown by Provider
              </h3>
              <Link
                href="/intents"
                className="text-xs font-medium text-blue-400 hover:text-blue-300"
              >
                Explore all audit details →
              </Link>
            </div>
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
                      <td className="px-4 py-3 font-medium capitalize text-white">
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
          </div>
        )}
      </section>

      {/* ===== REINFORCEMENT IMPACT ===== */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-5 w-1 rounded-full bg-purple-500" />
          <h2 className="text-lg font-semibold text-white">
            Reinforcement Impact
          </h2>
          <span className="text-xs text-zinc-500">
            Is the training actually working?
          </span>
        </div>

        {rTotal === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center text-sm text-zinc-500">
            No reinforcement data yet &mdash; the daily reinforcement job will
            generate data after its first run.
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                label="Teaching Prompts Sent"
                value={rTotal.toLocaleString()}
                detail="Total reinforcement interactions across all providers"
              />
              <MetricCard
                label="Post-Reinforcement Mention Rate"
                value={`${(rMentionRate * 100).toFixed(1)}%`}
                detail={`${rMentioned} of ${rTotal} reinforcement responses mentioned your brand`}
                trend={
                  rMentionRate > 0.5
                    ? "up"
                    : rMentionRate > 0
                      ? "flat"
                      : "down"
                }
              />
              <MetricCard
                label="Drift Alerts"
                value={rDriftCount.toString()}
                detail={
                  rDriftCount === 0
                    ? "No off-brand language detected"
                    : `${rDriftCount} responses used forbidden terminology`
                }
                trend={rDriftCount === 0 ? "up" : "down"}
              />
              <MetricCard
                label="Providers Reached"
                value={Object.keys(rByProvider).length.toString()}
                detail={Object.keys(rByProvider).join(", ") || "None yet"}
              />
            </div>

            <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 px-4 py-3">
              <p className="text-xs leading-relaxed text-zinc-400">
                <span className="font-medium text-purple-300">
                  How reinforcement works:
                </span>{" "}
                We generate comparison prompts from your Brand Bible (e.g.,{" "}
                <em>
                  &ldquo;Compare Matey AI with [competitor] for discovery
                  review&rdquo;
                </em>
                ) and send them to each AI model. The model&rsquo;s response is
                then checked for brand mentions and similarity. Over time, this
                trains the models to associate your brand with the right topics.
                If a model uses off-brand language, it triggers a{" "}
                <Link
                  href="/alignment"
                  className="font-medium text-purple-300 hover:text-purple-200"
                >
                  drift alert
                </Link>{" "}
                and that provider is paused for 24 hours.
              </p>
            </div>
          </>
        )}
      </section>

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
                direct measure of brand visibility &mdash; if an AI recommends
                you by name, users discover you.
              </dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-white">
                Semantic Similarity
              </dt>
              <dd className="mt-1 text-xs leading-relaxed text-zinc-400">
                How closely the LLM&apos;s response aligns with your brand
                description, measured via embedding cosine similarity
                (0&ndash;100%). Even without a direct mention, high similarity
                means the LLM is talking about your problem space.
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
                Drift Detection
              </dt>
              <dd className="mt-1 text-xs leading-relaxed text-zinc-400">
                During reinforcement, if an AI model uses language from your
                &quot;don&apos;t say&quot; list (set in your Brand Bible), it
                triggers a drift alert. That provider is then paused for 24
                hours to prevent reinforcing bad patterns.
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
