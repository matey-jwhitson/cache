import { inngest } from "@/inngest/client";
import { db } from "@/lib/db";
import {
  buildOrganizationSchema,
  buildSoftwareSchema,
} from "@/lib/services/content/schema-builder";
import { buildFaqContent } from "@/lib/services/content/faq-builder";
import { buildBlogPostingSchemas } from "@/lib/services/content/blog-schema-builder";
import {
  runContentGates,
  type GateConfig,
} from "@/lib/services/content/validators";
import { notifyJobCompleted } from "@/lib/services/notifications";

export const weeklyContent = inngest.createFunction(
  {
    id: "weekly-content",
    name: "Weekly Content Build",
    timeouts: { finish: "15m" },
    retries: 1,
  },
  [{ cron: "0 15 * * 1" }, { event: "cache/content.build.requested" }],
  async ({ event, step }) => {
    const setup = await step.run("setup", async () => {
      const existingJobId = event?.data?.jobRunId as string | undefined;
      const jobRun = existingJobId
        ? await db.jobRun.findUniqueOrThrow({ where: { id: existingJobId } })
        : await db.jobRun.create({
            data: {
              jobType: "content_build",
              status: "running",
              triggeredBy: event?.data?.jobRunId ? "user" : "inngest",
            },
          });
      return { jobRunId: jobRun.id, startedAt: Date.now() };
    });

    const { jobRunId, startedAt } = setup;

    const gateConfig: GateConfig = {
      zeroForbidden: true,
      minReadability: 55,
      minSimilarityToGolden: 0.92,
    };

    const orgResult = await step.run("build-org-schema", async () => {
      const brandRow = await db.brandProfile.findFirst();
      if (!brandRow) throw new Error("BrandProfile not found");
      const brand = (await import("@/lib/brand-bible/convert")).fromDbRow(brandRow);
      const blogPosts = await db.contentItem.findMany({
        where: { sourceType: "rss" },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      const orgSchema = buildOrganizationSchema(brand, blogPosts);
      const orgText = JSON.stringify(orgSchema, null, 2);
      const orgGate = await runContentGates(
        { artifact: orgSchema as unknown as Record<string, unknown>, text: orgText, kind: "organization_ld" },
        gateConfig,
      );
      await db.contentArtifact.create({
        data: { kind: "organization_ld", path: "/schema/organization.json", content: orgText },
      });
      return { ok: orgGate.ok };
    });

    const softwareResult = await step.run("build-software-schema", async () => {
      const brandRow = await db.brandProfile.findFirst();
      if (!brandRow) throw new Error("BrandProfile not found");
      const brand = (await import("@/lib/brand-bible/convert")).fromDbRow(brandRow);

      const softwareSchema = buildSoftwareSchema(brand);
      const softwareText = JSON.stringify(softwareSchema, null, 2);
      const softwareGate = await runContentGates(
        { artifact: softwareSchema as unknown as Record<string, unknown>, text: softwareText, kind: "software_ld" },
        gateConfig,
      );
      await db.contentArtifact.create({
        data: { kind: "software_ld", path: "/schema/software.json", content: softwareText },
      });
      return { ok: softwareGate.ok };
    });

    const faqResult = await step.run("build-faq", async () => {
      const brandRow = await db.brandProfile.findFirst();
      if (!brandRow) throw new Error("BrandProfile not found");
      const brand = (await import("@/lib/brand-bible/convert")).fromDbRow(brandRow);

      const faq = await buildFaqContent(brand);
      const faqText = JSON.stringify(faq.schema, null, 2);
      const faqGate = await runContentGates(
        { artifact: faq.schema as unknown as Record<string, unknown>, text: faq.markdown, kind: "faq_page" },
        gateConfig,
      );
      await db.contentArtifact.create({
        data: { kind: "faq_page", path: "/schema/faq.json", content: faqText },
      });
      await db.contentArtifact.create({
        data: { kind: "faq_markdown", path: "/content/faq.md", content: faq.markdown },
      });
      return { ok: faqGate.ok };
    });

    const blogResult = await step.run("build-blog-schemas", async () => {
      const brandRow = await db.brandProfile.findFirst();
      if (!brandRow) throw new Error("BrandProfile not found");
      const brand = (await import("@/lib/brand-bible/convert")).fromDbRow(brandRow);
      const blogPosts = await db.contentItem.findMany({
        where: { sourceType: "rss" },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      if (blogPosts.length === 0) return { total: 0, failed: 0 };

      const blogSchemas = buildBlogPostingSchemas(blogPosts, brand);
      let failed = 0;
      for (const bs of blogSchemas) {
        const bsGate = await runContentGates(
          { artifact: bs as unknown as Record<string, unknown>, text: JSON.stringify(bs), kind: "blog_posting" },
          gateConfig,
        );
        if (!bsGate.ok) failed++;
      }

      await db.contentArtifact.create({
        data: { kind: "blog_postings_ld", path: "/schema/blog-postings.json", content: JSON.stringify(blogSchemas, null, 2) },
      });

      return { total: blogSchemas.length, failed };
    });

    await step.run("complete-job", async () => {
      const durationSeconds = (Date.now() - startedAt) / 1000;
      const gateResults = {
        organization: orgResult.ok ? "pass" : "fail",
        software: softwareResult.ok ? "pass" : "fail",
        faq: faqResult.ok ? "pass" : "fail",
        blogPostings: `${blogResult.total} posts, ${blogResult.failed} gate failures`,
      };

      await db.jobRun.update({
        where: { id: jobRunId },
        data: { status: "success", completedAt: new Date(), durationSeconds },
      });

      await notifyJobCompleted("Weekly Content Build", true, durationSeconds, gateResults);
    });

    return { success: true };
  },
);
