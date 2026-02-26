import { inngest } from "@/inngest/client";
import { db } from "@/lib/db";
import { runAuditForProvider } from "@/lib/services/auditor";
import { getAvailableProviders } from "@/lib/providers";
import { notifyJobCompleted } from "@/lib/services/notifications";

export const dailyAudit = inngest.createFunction(
  {
    id: "daily-audit",
    name: "Daily Audit",
    timeouts: { finish: "45m" },
  },
  [{ cron: "0 9 * * *" }, { event: "cache/audit.requested" }],
  async ({ event, step }) => {
    const startedAt = Date.now();
    const providers = getAvailableProviders();

    if (providers.length === 0) {
      throw new Error(
        "No LLM providers configured. Set at least one API key (OPENAI_API_KEY, ANTHROPIC_API_KEY, etc.) in your Vercel environment variables.",
      );
    }

    const providerNames = providers.map((p) => p.name);
    const existingJobId = event?.data?.jobRunId as string | undefined;

    const jobRun = existingJobId
      ? await db.jobRun.findUniqueOrThrow({ where: { id: existingJobId } })
      : await db.jobRun.create({
          data: {
            jobType: "audit",
            status: "running",
            triggeredBy: "scheduled",
          },
        });

    try {
      const allResults: Record<
        string,
        { runId: string; successful: number; failed: number }
      > = {};

      for (const name of providerNames) {
        const result = await step.run(`audit-${name}`, async () => {
          return runAuditForProvider(name);
        });
        allResults[name] = result;
      }

      const durationSeconds = (Date.now() - startedAt) / 1000;

      await step.run("finalize-success", async () => {
        await db.jobRun.update({
          where: { id: jobRun.id },
          data: {
            status: "success",
            completedAt: new Date(),
            durationSeconds,
          },
        });

        const totalSuccessful = Object.values(allResults).reduce(
          (sum, r) => sum + r.successful,
          0,
        );
        const totalFailed = Object.values(allResults).reduce(
          (sum, r) => sum + r.failed,
          0,
        );

        await notifyJobCompleted("Daily Audit", true, durationSeconds, {
          providers: providerNames.length,
          successful: totalSuccessful,
          failed: totalFailed,
        });
      });

      return { success: true, results: allResults };
    } catch (error) {
      const durationSeconds = (Date.now() - startedAt) / 1000;
      const message =
        error instanceof Error ? error.message : "Unknown error";

      await db.jobRun.update({
        where: { id: jobRun.id },
        data: {
          status: "failed",
          completedAt: new Date(),
          durationSeconds,
          errorMessage: message,
        },
      });

      await notifyJobCompleted("Daily Audit", false, durationSeconds, {
        error: message,
      });

      throw error;
    }
  },
);
