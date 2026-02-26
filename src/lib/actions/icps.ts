"use server";

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";

export async function createICP(formData: FormData) {
  await requireAuth();

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const painsRaw = formData.get("pains") as string;
  const jobsRaw = formData.get("jobsToBeDone") as string;
  const geosRaw = formData.get("geos") as string;
  const segmentsRaw = formData.get("segments") as string;

  const split = (s: string) =>
    s ? s.split(",").map((t) => t.trim()).filter(Boolean) : [];

  await db.iCP.create({
    data: {
      name,
      description,
      pains: split(painsRaw),
      jobsToBeDone: split(jobsRaw),
      geos: split(geosRaw),
      segments: split(segmentsRaw),
    },
  });

  return { success: true };
}

export async function deleteICP(id: string) {
  await requireAuth();
  await db.iCP.delete({ where: { id } });
  return { success: true };
}
