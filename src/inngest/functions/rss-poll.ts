import { inngest } from "@/inngest/client";
import { db } from "@/lib/db";
import { ingestRss } from "@/lib/services/content/ingestion";
import { notifyJobCompleted } from "@/lib/services/notifications";

export const rssPoll = inngest.createFunction(
  { id: "rss-poll", name: "RSS Poll" },
  [{ cron: "0 6 * * *" }, { event: "cache/rss.poll.requested" }],
  async () => {
    const startedAt = Date.now();

    const jobRun = await db.jobRun.create({
      data: {
        jobType: "rss_poll",
        status: "running",
        triggeredBy: "inngest",
      },
    });

    try {
      const sources = await db.contentSource.findMany({
        where: { enabled: true, sourceType: "rss" },
      });

      let totalItems = 0;
      const errors: string[] = [];

      for (const source of sources) {
        try {
          const config = source.config as { url?: string };
          const feedUrl = config.url;
          if (!feedUrl) {
            errors.push(`Source "${source.name}" has no URL configured`);
            continue;
          }

          const items = await ingestRss(feedUrl);
          totalItems += items.length;

          await db.contentSource.update({
            where: { id: source.id },
            data: { lastFetchedAt: new Date() },
          });
        } catch (err) {
          const msg =
            err instanceof Error ? err.message : "Unknown error";
          errors.push(`Source "${source.name}": ${msg}`);
        }
      }

      const durationSeconds = (Date.now() - startedAt) / 1000;
      await db.jobRun.update({
        where: { id: jobRun.id },
        data: {
          status: "success",
          completedAt: new Date(),
          durationSeconds,
        },
      });

      await notifyJobCompleted("RSS Poll", true, durationSeconds, {
        sources: sources.length,
        itemsIngested: totalItems,
        errors: errors.length,
      });

      return { success: true, sources: sources.length, totalItems, errors };
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

      await notifyJobCompleted("RSS Poll", false, durationSeconds, {
        error: message,
      });

      throw error;
    }
  },
);
