import { db } from "@/lib/db";
import { ControlPanelActions } from "./control-panel-actions";
import {
  getLatestAuditSummary,
  type SerializedJob,
} from "@/lib/actions/job-actions";

export default async function ControlPanelPage() {
  const [jobs, auditSummary, gapAnalysis] = await Promise.all([
    db.jobRun.findMany({ orderBy: { startedAt: "desc" }, take: 20 }),
    getLatestAuditSummary().catch(() => null),
    db.auditResult.findMany({
      where: { mentioned: false },
      orderBy: { createdAt: "desc" },
      take: 10,
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Control Panel</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Run operations and monitor job status
        </p>
      </div>

      <ControlPanelActions initialJobs={serializedJobs} initialSummary={auditSummary} />

      <div>
        <h2 className="mb-4 text-lg font-semibold text-white">
          Keyword Gap Analysis
        </h2>
        {gapAnalysis.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center text-sm text-zinc-500">
            No gaps detected — run an audit to populate
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/80">
                  <th className="px-4 py-3 text-left font-medium text-zinc-400">Provider</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-400">Prompt ID</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-400">Similarity</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-400">Response</th>
                </tr>
              </thead>
              <tbody className="bg-zinc-900">
                {gapAnalysis.map((result) => (
                  <tr key={result.id} className="border-b border-zinc-800/50 last:border-0">
                    <td className="px-4 py-3 text-white">{result.provider}</td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-400">
                      {result.promptId.slice(0, 12)}...
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      {(result.similarity * 100).toFixed(1)}%
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 text-zinc-400">
                      {result.responseText.slice(0, 80)}...
                    </td>
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
