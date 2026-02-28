import { inngest } from "@/inngest/client";
import { db } from "@/lib/db";
import { ingestRss } from "@/lib/services/content/ingestion";
import { notifyJobCompleted } from "@/lib/services/notifications";

export const rssPoll = inngest.createFunction(
  {
    id: "rss-poll",
    name: "RSS Poll",
    timeouts: { finish: "10m" },
    retries: 1,
  },
  [{ cron: "0 12 * * *" }, { event: "cache/rss.poll.requested" }],
  async ({ event, step }) => {
    const setup = await step.run("setup", async () => {
      const existingJobId = event?.data?.jobRunId as string | undefined;
      const jobRun = existingJobId
        ? await db.jobRun.findUniqueOrThrow({ where: { id: existingJobId } })
        : await db.jobRun.create({
            data: {
              jobType: "rss_poll",
              status: "running",
              triggeredBy: "inngest",
            },
          });
      const sources = await db.contentSource.findMany({
        where: { enabled: true, sourceType: "rss" },
        select: { id: true, name: true, config: true },
      });
      return {
        jobRunId: jobRun.id,
        startedAt: Date.now(),
        sources: sources.map((s) => ({
          id: s.id,
          name: s.name,
          url: (s.config as { url?: string })?.url ?? null,
        })),
      };
    });

    const { jobRunId, startedAt, sources } = setup;
    let totalItems = 0;
    const errors: string[] = [];

    for (const source of sources) {
      const result = await step.run(`poll-${source.id}`, async () => {
        if (!source.url) {
          return { items: 0, error: `Source "${source.name}" has no URL configured` };
        }
        try {
          const items = await ingestRss(source.url);
          await db.contentSource.update({
            where: { id: source.id },
            data: { lastFetchedAt: new Date() },
          });
          return { items: items.length, error: null };
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Unknown error";
          return { items: 0, error: `Source "${source.name}": ${msg}` };
        }
      });

      totalItems += result.items;
      if (result.error) errors.push(result.error);
    }

    await step.run("complete-job", async () => {
      const durationSeconds = (Date.now() - startedAt) / 1000;
      await db.jobRun.update({
        where: { id: jobRunId },
        data: { status: "success", completedAt: new Date(), durationSeconds },
      });
      await notifyJobCompleted("RSS Poll", true, durationSeconds, {
        sources: sources.length,
        itemsIngested: totalItems,
        errors: errors.length,
      });
    });

    return { success: true, sources: sources.length, totalItems, errors };
  },
);
