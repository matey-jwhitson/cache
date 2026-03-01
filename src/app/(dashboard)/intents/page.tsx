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
        <h1 className="text-2xl font-bold text-white">Audit Detail Explorer</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Drill into every question we asked AI models and see exactly how they
          responded &mdash; did they mention Matey, and what did they say?
        </p>
      </div>

      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 px-5 py-4">
        <p className="text-sm font-medium text-blue-300">
          How to read this page
        </p>
        <p className="mt-1 text-sm leading-relaxed text-zinc-400">
          During each audit, we ask AI models (GPT, Claude, Gemini, Grok) the
          same questions your potential customers might ask &mdash; things like{" "}
          <em>&ldquo;What AI tools help public defenders manage discovery?&rdquo;</em>{" "}
          Each row below is one question + one AI model&rsquo;s answer. A{" "}
          <span className="font-medium text-emerald-400">Mentioned</span> badge
          means the AI recommended Matey in its response. A{" "}
          <span className="font-medium text-red-400">Not Mentioned</span> badge
          means it didn&rsquo;t. The goal is to increase the mention rate over
          time through content strategy and reinforcement &mdash; so Matey shows
          up when it matters most.
        </p>
      </div>

      <IntentExplorer results={serialized} providers={providers} />
    </div>
  );
}
