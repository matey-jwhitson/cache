"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

interface BrandProfileData {
  name: string;
  url: string;
  mission?: string;
  positioning?: string;
  voiceTone?: string;
  readingLevel?: string;
  brandTerms?: string[];
  forbiddenPhrases?: string[];
}

export async function upsertBrandProfile(data: BrandProfileData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const profile = await db.brandProfile.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      name: data.name,
      url: data.url,
      mission: data.mission ?? null,
      positioning: data.positioning ?? null,
      voiceTone: data.voiceTone ?? null,
      readingLevel: data.readingLevel ?? null,
      brandTerms: data.brandTerms ?? [],
      forbiddenPhrases: data.forbiddenPhrases ?? [],
    },
    update: {
      name: data.name,
      url: data.url,
      mission: data.mission ?? null,
      positioning: data.positioning ?? null,
      voiceTone: data.voiceTone ?? null,
      readingLevel: data.readingLevel ?? null,
      brandTerms: data.brandTerms ?? [],
      forbiddenPhrases: data.forbiddenPhrases ?? [],
    },
  });

  await db.auditLog.create({
    data: {
      entityType: "BrandProfile",
      entityId: String(profile.id),
      action: "upsert",
      details: { name: data.name, url: data.url },
    },
  });

  return profile;
}

export async function getBrandProfile() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  return db.brandProfile.findFirst();
}
