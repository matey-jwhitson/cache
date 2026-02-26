import { db } from "@/lib/db";
import { ICPList } from "./icp-list";

export default async function ICPsPage() {
  const icps = await db.iCP.findMany({
    orderBy: { createdAt: "desc" },
  });

  const serialized = icps.map((icp) => ({
    id: icp.id,
    name: icp.name,
    description: icp.description,
    pains: icp.pains as string[],
    jobsToBeDone: icp.jobsToBeDone as string[],
    geos: icp.geos as string[],
    segments: icp.segments as string[],
    createdAt: icp.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">ICPs</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Manage Ideal Customer Profiles for targeted content
        </p>
      </div>

      <ICPList icps={serialized} />
    </div>
  );
}
