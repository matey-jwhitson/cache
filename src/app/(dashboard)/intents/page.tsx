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

  const promptIds = [...new Set(results.map((r) => r.promptId))];
  const intents = await db.intentTaxonomy.findMany({
    where: { id: { in: promptIds } },
  });
  const intentMap = Object.fromEntries(
    intents.map((i) => [i.id, { text: i.text, intentClass: i.intentClass }]),
  );

  const providers = [...new Set(results.map((r) => r.provider))];

  const serialized = results.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    meta: r.meta as Record<string, unknown>,
    promptText: intentMap[r.promptId]?.text ?? null,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Intent Explorer</h1>
        <p className="mt-1 text-sm text-zinc-400">
          See every prompt sent during audits and what each LLM responded
        </p>
      </div>

      <IntentExplorer results={serialized} providers={providers} />
    </div>
  );
}
