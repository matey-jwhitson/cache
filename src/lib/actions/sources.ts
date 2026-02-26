"use server";

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";

export async function addContentSource(formData: FormData) {
  await requireAuth();

  const name = formData.get("name") as string;
  const sourceType = formData.get("sourceType") as string;
  const url = formData.get("url") as string;

  await db.contentSource.create({
    data: {
      name,
      sourceType,
      config: url ? { url } : {},
    },
  });

  return { success: true };
}

export async function submitManualContent(formData: FormData) {
  await requireAuth();

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const author = formData.get("author") as string;

  await db.contentItem.create({
    data: {
      title,
      content,
      author: author || null,
      sourceType: "manual",
      status: "new",
    },
  });

  return { success: true };
}
