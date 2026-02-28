import { inngest } from "@/inngest/client";
import { db } from "@/lib/db";
import {
  generatePrompts,
  reinforceBatch,
  type TeachingPrompt,
} from "@/lib/services/reinforcement";
import { fromDbRow } from "@/lib/brand-bible/convert";
import { getAvailableProviders } from "@/lib/providers";
import { notifyJobCompleted } from "@/lib/services/notifications";

const BATCH_SIZE = 2;

export const reinforcementJob = inngest.createFunction(
  {
    id: "reinforcement",
    name: "Reinforcement",
    timeouts: { finish: "30m" },
    retries: 1,
  },
  [{ cron: "0 15 * * *" }, { event: "cache/reinforce.requested" }],
  async ({ event, step }) => {
    const setup = await step.run("setup", async () => {
      const providers = getAvailableProviders();
      if (providers.length === 0) {
        throw new Error("No LLM providers configured.");
      }

      const brandRow = await db.brandProfile.findFirst();
      const brand = brandRow ? fromDbRow(brandRow) : null;
      const prompts = await generatePrompts(
        20,
        brand ??
          ({
            name: "Unknown Brand",
            topicPillars: [
              "AI productivity tools",
              "automation platforms",
              "workflow optimization",
            ],
            competitors: [],
            targetAudiences: [],
          } as unknown as Parameters<typeof generatePrompts>[1]),
      );

      const existingJobId = event?.data?.jobRunId as string | undefined;
      const jobRun = existingJobId
        ? await db.jobRun.findUniqueOrThrow({ where: { id: existingJobId } })
        : await db.jobRun.create({
            data: {
              jobType: "reinforcement",
              status: "running",
              triggeredBy: event?.data?.jobRunId ? "user" : "inngest",
            },
          });

      return {
        jobRunId: jobRun.id,
        startedAt: Date.now(),
        providerNames: providers.map((p) => p.name),
        prompts: prompts.map((p) => ({ id: p.id, topic: p.topic, text: p.text })),
        brandJson: brand ? JSON.stringify(brand) : null,
      };
    });

    const { jobRunId, startedAt, providerNames, prompts, brandJson } = setup;
    const brand = brandJson ? JSON.parse(brandJson) : null;

    const batches: TeachingPrompt[][] = [];
    for (let i = 0; i < prompts.length; i += BATCH_SIZE) {
      batches.push(prompts.slice(i, i + BATCH_SIZE));
    }

    const totals: Record<string, { successful: number; mentioned: number }> =
      {};

    for (const name of providerNames) {
      totals[name] = { successful: 0, mentioned: 0 };

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const result = await step.run(`${name}-batch-${i}`, async () => {
          return reinforceBatch(name, batch, brand);
        });
        totals[name].successful += result.successful;
        totals[name].mentioned += result.mentioned;
      }
    }

    await step.run("complete-job", async () => {
      const durationSeconds = (Date.now() - startedAt) / 1000;
      const totalMentioned = Object.values(totals).reduce(
        (s, t) => s + t.mentioned,
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

      await notifyJobCompleted("Reinforcement", true, durationSeconds, {
        providers: providerNames.length,
        totalMentioned,
      });
    });

    return { success: true, totals };
  },
);
