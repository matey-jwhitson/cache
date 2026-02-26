"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { inngest } from "@/inngest/client";

export async function triggerAudit() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await inngest.send({ name: "cache/audit.requested", data: {} });
  return { triggered: true, job: "audit" };
}

export async function triggerReinforcement() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await inngest.send({ name: "cache/reinforce.requested", data: {} });
  return { triggered: true, job: "reinforcement" };
}

export async function triggerContentBuild() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await inngest.send({ name: "cache/content.build.requested", data: {} });
  return { triggered: true, job: "content_build" };
}

export async function getJobHistory(limit?: number) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const take = Math.min(Math.max(limit ?? 50, 1), 200);

  return db.jobRun.findMany({
    take,
    orderBy: { startedAt: "desc" },
  });
}
