"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LocalTime } from "@/components/ui/local-time";
import {
  triggerAudit,
  triggerReinforcement,
  triggerContentBuild,
  triggerRssPoll,
} from "@/lib/actions/jobs";
import {
  getJobHistory,
  getLatestAuditSummary,
  type SerializedJob,
  type AuditSummary,
} from "@/lib/actions/job-actions";
import {
  Radar,
  Repeat,
  FileCode,
  Rss,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";

function jobStatusVariant(status: string) {
  switch (status) {
    case "success":
      return "success" as const;
    case "failed":
      return "destructive" as const;
    case "running":
      return "warning" as const;
    default:
      return "default" as const;
  }
}

function ElapsedTime({ startedAt }: { startedAt: string }) {
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    function tick() {
      const seconds = Math.floor(
        (Date.now() - new Date(startedAt).getTime()) / 1000,
      );
      if (seconds < 60) {
        setElapsed(`${seconds}s`);
      } else if (seconds < 3600) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        setElapsed(`${m}m ${s}s`);
      } else {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        setElapsed(`${h}h ${m}m`);
      }
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  return <span className="tabular-nums text-amber-400">{elapsed}</span>;
}

function IndeterminateBar() {
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-800">
      <div
        className="h-full w-1/4 rounded-full bg-amber-500"
        style={{ animation: "indeterminate 1.5s ease-in-out infinite" }}
      />
    </div>
  );
}

interface Toast {
  id: number;
  message: string;
  type: "success" | "error";
}

export function ControlPanelActions({
  initialJobs,
  initialSummary,
}: {
  initialJobs: SerializedJob[];
  initialSummary: AuditSummary | null;
}) {
  const [isPending, setIsPending] = useState(false);
  const [jobs, setJobs] = useState(initialJobs);
  const [summary, setSummary] = useState(initialSummary);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const prevJobsRef = useRef(initialJobs);

  const hasRunningJob = jobs.some((j) => j.status === "running");

  const addToast = useCallback(
    (message: string, type: "success" | "error") => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 6000);
    },
    [],
  );

  const refreshData = useCallback(async () => {
    try {
      const [freshJobs, freshSummary] = await Promise.all([
        getJobHistory(20),
        getLatestAuditSummary(),
      ]);

      const prevRunning = prevJobsRef.current.filter(
        (j) => j.status === "running",
      );
      for (const prev of prevRunning) {
        const now = freshJobs.find((j) => j.id === prev.id);
        if (now && now.status === "success" && now.jobType === "audit") {
          const provCount = freshSummary?.providers.length ?? 0;
          const prompts = freshSummary?.totals.prompts ?? 0;
          const rate = freshSummary
            ? (freshSummary.totals.mentionRate * 100).toFixed(1)
            : "0";
          addToast(
            `Audit complete — ${prompts} prompts across ${provCount} providers, ${rate}% mention rate`,
            "success",
          );
        } else if (now && now.status === "failed") {
          addToast(
            `${now.jobType} failed: ${now.errorMessage ?? "unknown error"}`,
            "error",
          );
        }
      }

      prevJobsRef.current = freshJobs;
      setJobs(freshJobs);
      setSummary(freshSummary);
    } catch {
      /* polling failure is non-fatal */
    }
  }, [addToast]);

  useEffect(() => {
    if (!hasRunningJob) return;
    const id = setInterval(refreshData, 8000);
    return () => clearInterval(id);
  }, [hasRunningJob, refreshData]);

  async function run(
    action: () => Promise<{ jobId: string; status: string; error?: string }>,
    label: string,
  ) {
    setIsPending(true);
    try {
      const result = await action();
      if (result.error) {
        addToast(`${label} failed: ${result.error}`, "error");
      } else {
        addToast(`${label} started successfully`, "success");
      }
      await refreshData();
    } catch {
      addToast(`Failed to start ${label}`, "error");
      await refreshData();
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => run(triggerAudit, "Audit")}
          disabled={isPending}
          className="gap-2"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Radar className="h-4 w-4" />
          )}
          Run Audit
        </Button>
        <Button
          onClick={() => run(triggerReinforcement, "Reinforcement")}
          disabled={isPending}
          variant="secondary"
          className="gap-2"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Repeat className="h-4 w-4" />
          )}
          Run Reinforcement
        </Button>
        <Button
          onClick={() => run(triggerContentBuild, "Content Build")}
          disabled={isPending}
          variant="secondary"
          className="gap-2"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileCode className="h-4 w-4" />
          )}
          Run Content Build
        </Button>
        <Button
          onClick={() => run(triggerRssPoll, "RSS Poll")}
          disabled={isPending}
          variant="secondary"
          className="gap-2"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Rss className="h-4 w-4" />
          )}
          Poll RSS Feeds
        </Button>
      </div>

      {/* Toast notifications */}
      {toasts.length > 0 && (
        <div className="space-y-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium ${
                toast.type === "success"
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-red-500/10 text-red-400"
              }`}
            >
              {toast.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 shrink-0" />
              )}
              {toast.message}
            </div>
          ))}
        </div>
      )}

      {/* Job History */}
      <div>
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-lg font-semibold text-white">Job History</h2>
          {hasRunningJob && (
            <span className="flex items-center gap-1.5 text-xs text-amber-400">
              <Loader2 className="h-3 w-3 animate-spin" />
              Polling for updates...
            </span>
          )}
        </div>
        {jobs.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center text-sm text-zinc-500">
            No jobs have been run yet
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/80">
                  <th className="px-4 py-3 text-left font-medium text-zinc-400">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-400">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-400">
                    Triggered By
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-400">
                    Started
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-400">
                    Duration
                  </th>
                </tr>
              </thead>
              <tbody className="bg-zinc-900">
                {jobs.map((job) => (
                  <tr
                    key={job.id}
                    className="border-b border-zinc-800/50 last:border-0"
                  >
                    <td className="px-4 py-3 font-medium text-white">
                      {job.jobType}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <Badge variant={jobStatusVariant(job.status)}>
                            {job.status}
                          </Badge>
                        </div>
                        {job.status === "running" && <IndeterminateBar />}
                        {job.status === "failed" && job.errorMessage && (
                          <span className="text-xs text-red-400/80">
                            {job.errorMessage}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      {job.triggeredBy ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      <LocalTime date={job.startedAt} />
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      {job.status === "running" ? (
                        <ElapsedTime startedAt={job.startedAt} />
                      ) : job.durationSeconds != null ? (
                        `${job.durationSeconds.toFixed(1)}s`
                      ) : (
                        "—"
                      )}
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
