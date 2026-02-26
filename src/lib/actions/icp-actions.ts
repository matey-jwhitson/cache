"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

interface ICPData {
  name: string;
  description?: string;
  pains?: string[];
  jobsToBeDone?: string[];
  geos?: string[];
  segments?: string[];
}

const SEED_ICPS: ICPData[] = [
  {
    name: "Public Defenders",
    description: "Court-appointed attorneys handling criminal defense cases",
    pains: [
      "Overwhelming caseloads",
      "Limited time for discovery review",
      "Manual transcription of evidence",
    ],
    jobsToBeDone: [
      "Review discovery materials quickly",
      "Transcribe audio/video evidence",
      "Extract key entities from documents",
    ],
    geos: ["US"],
    segments: ["Legal", "Government"],
  },
  {
    name: "Criminal Defense Attorneys",
    description: "Private practice attorneys specializing in criminal defense",
    pains: [
      "Cost of discovery tools",
      "Time-consuming evidence review",
      "Keeping up with large digital evidence volumes",
    ],
    jobsToBeDone: [
      "Automate discovery ingestion",
      "Generate timelines from case documents",
      "Search across all case evidence",
    ],
    geos: ["US"],
    segments: ["Legal"],
  },
];

export async function listICPs() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  return db.iCP.findMany({ orderBy: { createdAt: "asc" } });
}

export async function createICP(data: ICPData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  if (!data.name || typeof data.name !== "string") {
    throw new Error("Name is required");
  }

  return db.iCP.create({
    data: {
      name: data.name,
      description: data.description ?? null,
      pains: data.pains ?? [],
      jobsToBeDone: data.jobsToBeDone ?? [],
      geos: data.geos ?? [],
      segments: data.segments ?? [],
    },
  });
}

export async function deleteICP(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  if (!id) throw new Error("ID is required");

  const existing = await db.iCP.findUnique({ where: { id } });
  if (!existing) throw new Error("ICP not found");

  await db.iCP.delete({ where: { id } });
  return { deleted: true };
}

export async function reloadFromSeed() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await db.iCP.deleteMany();

  const created = [];
  for (const seed of SEED_ICPS) {
    const icp = await db.iCP.create({
      data: {
        name: seed.name,
        description: seed.description ?? null,
        pains: seed.pains ?? [],
        jobsToBeDone: seed.jobsToBeDone ?? [],
        geos: seed.geos ?? [],
        segments: seed.segments ?? [],
      },
    });
    created.push(icp);
  }

  return created;
}
