"use server";

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { inngest } from "@/inngest/client";

async function dispatchOrFail(
  jobId: string,
  eventName: string,
) {
  try {
    await inngest.send({
      name: eventName,
      data: { jobRunId: jobId },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to dispatch job";

    await db.jobRun.update({
      where: { id: jobId },
      data: {
        status: "failed",
        completedAt: new Date(),
        errorMessage: `Dispatch failed: ${message}`,
      },
    });

    throw new Error(`Job dispatch failed: ${message}`);
  }
}

export async function triggerAudit() {
  const user = await requireAuth();

  const job = await db.jobRun.create({
    data: {
      jobType: "audit",
      status: "running",
      triggeredBy: user.email ?? "unknown",
    },
  });

  await dispatchOrFail(job.id, "cache/audit.requested");
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

  await dispatchOrFail(job.id, "cache/reinforce.requested");
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

  await dispatchOrFail(job.id, "cache/content.build.requested");
  return { jobId: job.id, status: "started" };
}
