import { inngest } from "@/inngest/client";
import { db } from "@/lib/db";
import { runReinforcement } from "@/lib/services/reinforcement";
import { getAvailableProviders } from "@/lib/providers";
import { notifyJobCompleted } from "@/lib/services/notifications";

export const reinforcementJob = inngest.createFunction(
  { id: "reinforcement", name: "Reinforcement" },
  [{ cron: "0 */12 * * *" }, { event: "cache/reinforce.requested" }],
  async () => {
    const startedAt = Date.now();

    const providerNames = getAvailableProviders().map((p) => p.name);

    const jobRun = await db.jobRun.create({
      data: {
        jobType: "reinforcement",
        status: "running",
        triggeredBy: "inngest",
      },
    });

    try {
      const results = await runReinforcement(providerNames);

      const durationSeconds = (Date.now() - startedAt) / 1000;
      await db.jobRun.update({
        where: { id: jobRun.id },
        data: {
          status: "success",
          completedAt: new Date(),
          durationSeconds,
        },
      });

      const totalMentioned = Object.values(results).reduce(
        (sum, r) => sum + r.mentioned,
        0,
      );

      await notifyJobCompleted("Reinforcement", true, durationSeconds, {
        providers: providerNames.length,
        totalMentioned,
      });

      return { success: true, results };
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

      await notifyJobCompleted("Reinforcement", false, durationSeconds, {
        error: message,
      });

      throw error;
    }
  },
);
