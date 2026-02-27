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

  const allIntents = await db.intentTaxonomy.findMany();
  const intentById = Object.fromEntries(
    allIntents.map((i) => [i.id, { text: i.text, intentClass: i.intentClass }]),
  );
  const intentByClass = Object.fromEntries(
    allIntents.map((i) => [i.intentClass, { text: i.text, intentClass: i.intentClass }]),
  );

  const providers = [...new Set(results.map((r) => r.provider))];

  const serialized = results.map((r) => {
    const meta = r.meta as Record<string, unknown>;
    let promptText: string | null = null;
    if (typeof meta?.promptText === "string") {
      promptText = meta.promptText;
    } else if (intentById[r.promptId]) {
      promptText = intentById[r.promptId].text;
    } else if (typeof meta?.intent === "string" && intentByClass[meta.intent]) {
      promptText = intentByClass[meta.intent].text;
    }
    return {
      ...r,
      createdAt: r.createdAt.toISOString(),
      meta,
      promptText,
    };
  });

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
