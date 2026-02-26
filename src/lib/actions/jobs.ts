"use server";

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";

export async function triggerAudit() {
  const user = await requireAuth();

  const job = await db.jobRun.create({
    data: {
      jobType: "audit",
      status: "running",
      triggeredBy: user.email ?? "unknown",
    },
  });

  return { jobId: job.id, status: "started" };
}

export async function triggerReinforcement() {
  const user = await requireAuth();

  const job = await db.jobRun.create({
    data: {
      jobType: "reinforcement",
      status: "running",
      triggeredBy: user.email ?? "unknown",
    },
  });

  return { jobId: job.id, status: "started" };
}

export async function triggerContentBuild() {
  const user = await requireAuth();

  const job = await db.jobRun.create({
    data: {
      jobType: "content_build",
      status: "running",
      triggeredBy: user.email ?? "unknown",
    },
  });

  return { jobId: job.id, status: "started" };
}
