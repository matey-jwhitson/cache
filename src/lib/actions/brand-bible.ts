"use server";

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { brandBibleSchema, type BrandBibleFormData } from "@/lib/brand-bible/schema";
import { extractBrandData } from "@/lib/brand-bible/extract";
import { invalidateBrandVector } from "@/lib/services/embeddings";

export async function analyzeBrandDocument(rawText: string) {
  await requireAuth();

  if (!rawText || rawText.trim().length < 20) {
    throw new Error("Please provide at least a few sentences of brand text to analyze.");
  }

  const extracted = await extractBrandData(rawText);
  return extracted;
}

export async function saveBrandBible(data: BrandBibleFormData, rawDocument?: string) {
  await requireAuth();

  const parsed = brandBibleSchema.parse(data);

  const clean = <T extends string>(arr: T[]) => arr.filter(Boolean);

  const payload = {
    name: parsed.name,
    url: parsed.url,
    logoUrl: parsed.logoUrl,
    tagline: parsed.tagline,
    mission: parsed.mission || null,
    valueProposition: parsed.valueProposition || null,
    industry: parsed.industry,
    geoFocus: clean(parsed.geoFocus),
    voiceAttributes: clean(parsed.voiceAttributes),
    tonePerChannel: parsed.tonePerChannel,
    readingLevel: parsed.readingLevel || null,
    topicPillars: clean(parsed.topicPillars),
    targetAudiences: parsed.targetAudiences.map((a) => ({
      name: a.name,
      description: a.description,
      painPoints: clean(a.painPoints),
      goals: clean(a.goals),
      jobsToBeDone: clean(a.jobsToBeDone),
      geos: clean(a.geos),
      segments: clean(a.segments),
    })),
    terminologyDos: clean(parsed.terminologyDos),
    terminologyDonts: clean(parsed.terminologyDonts),
    contentRules: clean(parsed.contentRules),
    benefits: clean(parsed.benefits),
    productFeatures: clean(parsed.productFeatures),
    competitors: clean(parsed.competitors),
    differentiators: clean(parsed.differentiators),
    boilerplateAbout: parsed.boilerplateAbout,
    boilerplateDisclaimer: parsed.boilerplateDisclaimer,
    ...(rawDocument !== undefined ? { rawDocument } : {}),
  };

  await db.brandProfile.upsert({
    where: { id: 1 },
    create: { id: 1, ...payload },
    update: payload,
  });

  invalidateBrandVector();
  revalidatePath("/brand");
  return { success: true };
}
