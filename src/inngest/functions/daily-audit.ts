import { inngest } from "@/inngest/client";
import { db } from "@/lib/db";
import {
  loadIntents,
  auditPromptBatch,
  type AuditPrompt,
} from "@/lib/services/auditor";
import { getAvailableProviders } from "@/lib/providers";
import { notifyJobCompleted } from "@/lib/services/notifications";

const BATCH_SIZE = 5;

export const dailyAudit = inngest.createFunction(
  {
    id: "daily-audit",
    name: "Daily Audit",
    timeouts: { finish: "45m" },
  },
  [{ cron: "0 9 * * *" }, { event: "cache/audit.requested" }],
  async ({ event, step }) => {
    const setup = await step.run("setup", async () => {
      const providers = getAvailableProviders();
      if (providers.length === 0) {
        throw new Error(
          "No LLM providers configured. Set at least one API key in your Vercel environment variables.",
        );
      }

      const prompts = await loadIntents();
      const existingJobId = event?.data?.jobRunId as string | undefined;

      const jobRun = existingJobId
        ? await db.jobRun.findUniqueOrThrow({
            where: { id: existingJobId },
          })
        : await db.jobRun.create({
            data: {
              jobType: "audit",
              status: "running",
              triggeredBy: "scheduled",
            },
          });

      const providerConfigs: {
        name: string;
        model: string;
        runId: string;
      }[] = [];

      for (const p of providers) {
        const run = await db.auditRun.create({
          data: {
            provider: p.name,
            model: p.defaultModel,
            totalPrompts: prompts.length,
          },
        });
        providerConfigs.push({
          name: p.name,
          model: p.defaultModel,
          runId: run.id,
        });
      }

      return {
        jobRunId: jobRun.id,
        startedAt: Date.now(),
        prompts: prompts.map((p) => ({
          id: p.id,
          text: p.text,
          intentClass: p.intentClass,
        })),
        providerConfigs,
      };
    });

    const { jobRunId, startedAt, prompts, providerConfigs } = setup;

    const batches: AuditPrompt[][] = [];
    for (let i = 0; i < prompts.length; i += BATCH_SIZE) {
      batches.push(prompts.slice(i, i + BATCH_SIZE));
    }

    const totals: Record<string, { successful: number; failed: number }> = {};

    for (const config of providerConfigs) {
      totals[config.name] = { successful: 0, failed: 0 };

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const result = await step.run(
          `${config.name}-batch-${i}`,
          async () => {
            return auditPromptBatch(config.name, batch, config.runId);
          },
        );
        totals[config.name].successful += result.successful;
        totals[config.name].failed += result.failed;
      }

      await step.run(`${config.name}-finalize`, async () => {
        await db.auditRun.update({
          where: { id: config.runId },
          data: {
            completedAt: new Date(),
            successful: totals[config.name].successful,
            failed: totals[config.name].failed,
          },
        });
      });
    }

    await step.run("complete-job", async () => {
      const durationSeconds = (Date.now() - startedAt) / 1000;
      const totalSuccessful = Object.values(totals).reduce(
        (s, t) => s + t.successful,
        0,
      );
      const totalFailed = Object.values(totals).reduce(
        (s, t) => s + t.failed,
        0,
      );

      await db.jobRun.update({
        where: { id: jobRunId },
        data: {
          status: "success",
          completedAt: new Date(),
          durationSeconds,
        },
      });

      await notifyJobCompleted("Daily Audit", true, durationSeconds, {
        providers: providerConfigs.length,
        successful: totalSuccessful,
        failed: totalFailed,
      });
    });

    return { success: true, totals };
  },
);
