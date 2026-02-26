"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

const STALE_JOB_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

export interface SerializedJob {
  id: string;
  jobType: string;
  status: string;
  triggeredBy: string | null;
  startedAt: string;
  completedAt: string | null;
  durationSeconds: number | null;
  errorMessage: string | null;
}

function serializeJob(job: {
  id: string;
  jobType: string;
  status: string;
  triggeredBy: string | null;
  startedAt: Date;
  completedAt: Date | null;
  durationSeconds: number | null;
  errorMessage: string | null;
}): SerializedJob {
  return {
    id: job.id,
    jobType: job.jobType,
    status: job.status,
    triggeredBy: job.triggeredBy,
    startedAt: job.startedAt.toISOString(),
    completedAt: job.completedAt?.toISOString() ?? null,
    durationSeconds: job.durationSeconds,
    errorMessage: job.errorMessage,
  };
}

async function cleanupStaleJobs() {
  const cutoff = new Date(Date.now() - STALE_JOB_THRESHOLD_MS);

  await db.jobRun.updateMany({
    where: {
      status: "running",
      startedAt: { lt: cutoff },
    },
    data: {
      status: "failed",
      completedAt: new Date(),
      errorMessage: "Job timed out — no completion signal received",
    },
  });
}

export async function getJobHistory(limit?: number): Promise<SerializedJob[]> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await cleanupStaleJobs();

  const take = Math.min(Math.max(limit ?? 50, 1), 200);

  const jobs = await db.jobRun.findMany({
    take,
    orderBy: { startedAt: "desc" },
  });

  return jobs.map(serializeJob);
}

export interface AuditSummary {
  ranAt: string;
  providers: {
    name: string;
    model: string;
    totalPrompts: number;
    successful: number;
    failed: number;
    mentionRate: number;
    avgSimilarity: number;
  }[];
  totals: {
    prompts: number;
    mentioned: number;
    mentionRate: number;
    avgSimilarity: number;
    avgRank: number;
  };
}

export async function getLatestAuditSummary(): Promise<AuditSummary | null> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const latestRuns = await db.auditRun.findMany({
    orderBy: { startedAt: "desc" },
    take: 10,
  });

  if (latestRuns.length === 0) return null;

  const mostRecentTime = latestRuns[0].startedAt;
  const fiveMinBefore = new Date(mostRecentTime.getTime() - 5 * 60 * 1000);
  const batchRuns = latestRuns.filter((r) => r.startedAt >= fiveMinBefore);

  const runIds = batchRuns.map((r) => r.id);
  const results = await db.auditResult.findMany({
    where: { runId: { in: runIds } },
  });

  const totalPrompts = results.length;
  const mentioned = results.filter((r) => r.mentioned);
  const mentionRate = totalPrompts > 0 ? mentioned.length / totalPrompts : 0;
  const avgSimilarity =
    totalPrompts > 0
      ? results.reduce((s, r) => s + r.similarity, 0) / totalPrompts
      : 0;
  const withRank = mentioned.filter((r) => r.mentionRank != null);
  const avgRank =
    withRank.length > 0
      ? withRank.reduce((s, r) => s + (r.mentionRank ?? 0), 0) / withRank.length
      : 0;

  const providers = batchRuns.map((run) => {
    const providerResults = results.filter((r) => r.runId === run.id);
    const provMentioned = providerResults.filter((r) => r.mentioned);
    const provTotal = providerResults.length;
    return {
      name: run.provider,
      model: run.model,
      totalPrompts: run.totalPrompts,
      successful: run.successful,
      failed: run.failed,
      mentionRate: provTotal > 0 ? provMentioned.length / provTotal : 0,
      avgSimilarity:
        provTotal > 0
          ? providerResults.reduce((s, r) => s + r.similarity, 0) / provTotal
          : 0,
    };
  });

  return {
    ranAt: mostRecentTime.toISOString(),
    providers,
    totals: {
      prompts: totalPrompts,
      mentioned: mentioned.length,
      mentionRate,
      avgSimilarity,
      avgRank,
    },
  };
}
