import { db } from "@/lib/db";
import { SourcesTabs } from "./sources-tabs";

export default async function SourcesPage() {
  const sources = await db.contentSource.findMany({
    orderBy: { createdAt: "desc" },
  });

  const items = await db.contentItem.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const serializedSources = sources.map((s) => ({
    id: s.id,
    name: s.name,
    sourceType: s.sourceType,
    config: s.config as Record<string, unknown>,
    enabled: s.enabled,
    lastFetchedAt: s.lastFetchedAt?.toISOString() ?? null,
    createdAt: s.createdAt.toISOString(),
  }));

  const serializedItems = items.map((i) => ({
    id: i.id,
    title: i.title,
    author: i.author,
    sourceType: i.sourceType,
    status: i.status,
    createdAt: i.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Content Sources</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Manage RSS feeds, manual content, and uploaded sources
        </p>
      </div>

      <SourcesTabs sources={serializedSources} items={serializedItems} />
    </div>
  );
}
