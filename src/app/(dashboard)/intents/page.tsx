import { db } from "@/lib/db";
import { IntentExplorer } from "./intent-explorer";

export default async function IntentsPage() {
  const results = await db.auditResult.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      provider: true,
      promptId: true,
      mentioned: true,
      mentionRank: true,
      similarity: true,
      responseText: true,
      createdAt: true,
      meta: true,
    },
  });

  const providers = [...new Set(results.map((r) => r.provider))];

  const serialized = results.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    meta: r.meta as Record<string, unknown>,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Intent Explorer</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Explore audit results by provider and intent
        </p>
      </div>

      <IntentExplorer results={serialized} providers={providers} />
    </div>
  );
}
