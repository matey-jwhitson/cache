"use server";

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";

export async function upsertBrandProfile(formData: FormData) {
  await requireAuth();

  const name = formData.get("name") as string;
  const url = formData.get("url") as string;
  const mission = formData.get("mission") as string;
  const positioning = formData.get("positioning") as string;
  const voiceTone = formData.get("voiceTone") as string;
  const readingLevel = formData.get("readingLevel") as string;
  const brandTermsRaw = formData.get("brandTerms") as string;
  const forbiddenPhrasesRaw = formData.get("forbiddenPhrases") as string;

  const brandTerms = brandTermsRaw
    ? brandTermsRaw.split(",").map((t) => t.trim()).filter(Boolean)
    : [];
  const forbiddenPhrases = forbiddenPhrasesRaw
    ? forbiddenPhrasesRaw.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  await db.brandProfile.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      name,
      url,
      mission,
      positioning,
      voiceTone,
      readingLevel,
      brandTerms,
      forbiddenPhrases,
    },
    update: {
      name,
      url,
      mission,
      positioning,
      voiceTone,
      readingLevel,
      brandTerms,
      forbiddenPhrases,
    },
  });

  return { success: true };
}
