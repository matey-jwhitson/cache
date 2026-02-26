import { inngest } from "@/inngest/client";
import { db } from "@/lib/db";
import {
  buildOrganizationSchema,
  buildSoftwareSchema,
} from "@/lib/services/content/schema-builder";
import { buildFaqContent } from "@/lib/services/content/faq-builder";
import {
  runContentGates,
  type GateConfig,
} from "@/lib/services/content/validators";
import { notifyJobCompleted } from "@/lib/services/notifications";

export const weeklyContent = inngest.createFunction(
  { id: "weekly-content", name: "Weekly Content Build" },
  [{ cron: "0 10 * * 1" }, { event: "cache/content.build.requested" }],
  async () => {
    const startedAt = Date.now();

    const jobRun = await db.jobRun.create({
      data: {
        jobType: "content_build",
        status: "running",
        triggeredBy: "inngest",
      },
    });

    try {
      const brand = await db.brandProfile.findFirst();
      if (!brand) throw new Error("BrandProfile not found");

      const gateConfig: GateConfig = {
        zeroForbidden: true,
        minReadability: 55,
        minSimilarityToGolden: 0.92,
      };

      const orgSchema = buildOrganizationSchema(brand);
      const orgText = JSON.stringify(orgSchema, null, 2);
      const orgGate = await runContentGates(
        {
          artifact: orgSchema as unknown as Record<string, unknown>,
          text: orgText,
          kind: "organization_ld",
        },
        gateConfig,
      );

      await db.contentArtifact.create({
        data: {
          kind: "organization_ld",
          path: "/schema/organization.json",
          content: orgText,
        },
      });

      const softwareSchema = buildSoftwareSchema(brand);
      const softwareText = JSON.stringify(softwareSchema, null, 2);
      const softwareGate = await runContentGates(
        {
          artifact: softwareSchema as unknown as Record<string, unknown>,
          text: softwareText,
          kind: "software_ld",
        },
        gateConfig,
      );

      await db.contentArtifact.create({
        data: {
          kind: "software_ld",
          path: "/schema/software.json",
          content: softwareText,
        },
      });

      const faq = await buildFaqContent(brand);
      const faqText = JSON.stringify(faq.schema, null, 2);
      const faqGate = await runContentGates(
        {
          artifact: faq.schema as unknown as Record<string, unknown>,
          text: faq.markdown,
          kind: "faq_page",
        },
        gateConfig,
      );

      await db.contentArtifact.create({
        data: {
          kind: "faq_page",
          path: "/schema/faq.json",
          content: faqText,
        },
      });

      await db.contentArtifact.create({
        data: {
          kind: "faq_markdown",
          path: "/content/faq.md",
          content: faq.markdown,
        },
      });

      const durationSeconds = (Date.now() - startedAt) / 1000;
      await db.jobRun.update({
        where: { id: jobRun.id },
        data: {
          status: "success",
          completedAt: new Date(),
          durationSeconds,
        },
      });

      const gateResults = {
        organization: orgGate.ok ? "pass" : "fail",
        software: softwareGate.ok ? "pass" : "fail",
        faq: faqGate.ok ? "pass" : "fail",
      };

      await notifyJobCompleted(
        "Weekly Content Build",
        true,
        durationSeconds,
        gateResults,
      );

      return { success: true, gates: gateResults };
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

      await notifyJobCompleted(
        "Weekly Content Build",
        false,
        durationSeconds,
        { error: message },
      );

      throw error;
    }
  },
);
