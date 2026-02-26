"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function addRssFeed(url: string, name: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  if (!url || typeof url !== "string") throw new Error("URL is required");
  if (!name || typeof name !== "string") throw new Error("Name is required");

  return db.contentSource.create({
    data: {
      name,
      sourceType: "rss",
      config: { url },
      enabled: true,
    },
  });
}

export async function listContentSources() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  return db.contentSource.findMany({ orderBy: { createdAt: "desc" } });
}

export async function deleteContentSource(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  if (!id) throw new Error("ID is required");

  const existing = await db.contentSource.findUnique({ where: { id } });
  if (!existing) throw new Error("Content source not found");

  await db.contentSource.delete({ where: { id } });
  return { deleted: true };
}
