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
