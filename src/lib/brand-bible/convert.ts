import type { BrandProfile } from "@/generated/prisma/client";
import type { BrandBible, TargetAudience } from "./types";

export function fromDbRow(row: BrandProfile): BrandBible {
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    logoUrl: row.logoUrl,
    tagline: row.tagline,
    mission: row.mission ?? "",
    valueProposition: row.valueProposition ?? "",
    industry: row.industry,
    geoFocus: asStringArray(row.geoFocus),
    voiceAttributes: asStringArray(row.voiceAttributes),
    tonePerChannel: asRecord(row.tonePerChannel),
    readingLevel: row.readingLevel ?? "",
    topicPillars: asStringArray(row.topicPillars),
    targetAudiences: asAudienceArray(row.targetAudiences),
    terminologyDos: asStringArray(row.terminologyDos),
    terminologyDonts: asStringArray(row.terminologyDonts),
    contentRules: asStringArray(row.contentRules),
    benefits: asStringArray(row.benefits),
    productFeatures: asStringArray(row.productFeatures),
    competitors: asStringArray(row.competitors),
    differentiators: asStringArray(row.differentiators),
    boilerplateAbout: row.boilerplateAbout,
    boilerplateDisclaimer: row.boilerplateDisclaimer,
    rawDocument: row.rawDocument,
  };
}

function asStringArray(val: unknown): string[] {
  return Array.isArray(val) ? val.filter((v): v is string => typeof v === "string") : [];
}

function asRecord(val: unknown): Record<string, string> {
  if (val && typeof val === "object" && !Array.isArray(val)) {
    return val as Record<string, string>;
  }
  return {};
}

function asAudienceArray(val: unknown): TargetAudience[] {
  if (!Array.isArray(val)) return [];
  return val.map((item) => {
    const obj = item as Record<string, unknown>;
    return {
      name: (obj.name as string) ?? "",
      description: (obj.description as string) ?? "",
      painPoints: asStringArray(obj.painPoints),
      goals: asStringArray(obj.goals),
      jobsToBeDone: asStringArray(obj.jobsToBeDone),
      geos: asStringArray(obj.geos),
      segments: asStringArray(obj.segments),
    };
  });
}
