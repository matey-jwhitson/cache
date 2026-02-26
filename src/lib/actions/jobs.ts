"use server";

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { inngest } from "@/inngest/client";

function requireInngest() {
  if (!process.env.INNGEST_EVENT_KEY) {
    throw new Error(
      "INNGEST_EVENT_KEY is not configured. Add it to your Vercel environment variables.",
    );
  }
}

async function createAndDispatch(
  jobType: string,
  eventName: string,
  triggeredBy: string,
) {
  const job = await db.jobRun.create({
    data: { jobType, status: "running", triggeredBy },
  });

  try {
    requireInngest();
    await inngest.send({
      name: eventName,
      data: { jobRunId: job.id },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to dispatch job";

    await db.jobRun.update({
      where: { id: job.id },
      data: {
        status: "failed",
        completedAt: new Date(),
        errorMessage: message,
      },
    });

    throw new Error(message);
  }

  return { jobId: job.id, status: "started" };
}

export async function triggerAudit() {
  const user = await requireAuth();
  return createAndDispatch(
    "audit",
    "cache/audit.requested",
    user.email ?? "unknown",
  );
}

export async function triggerReinforcement() {
  const user = await requireAuth();
  return createAndDispatch(
    "reinforcement",
    "cache/reinforce.requested",
    user.email ?? "unknown",
  );
}

export async function triggerContentBuild() {
  const user = await requireAuth();
  return createAndDispatch(
    "content_build",
    "cache/content.build.requested",
    user.email ?? "unknown",
  );
}
