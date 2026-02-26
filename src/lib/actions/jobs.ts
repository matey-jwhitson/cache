"use server";

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { inngest } from "@/inngest/client";

export async function triggerAudit() {
  const user = await requireAuth();

  const job = await db.jobRun.create({
    data: {
      jobType: "audit",
      status: "running",
      triggeredBy: user.email ?? "unknown",
    },
  });

  await inngest.send({
    name: "cache/audit.requested",
    data: { jobRunId: job.id },
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

  await inngest.send({
    name: "cache/reinforce.requested",
    data: { jobRunId: job.id },
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

  await inngest.send({
    name: "cache/content.build.requested",
    data: { jobRunId: job.id },
  });

  return { jobId: job.id, status: "started" };
}
