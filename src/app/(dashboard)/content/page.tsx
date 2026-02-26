import { db } from "@/lib/db";
import { ContentSections } from "./content-sections";

export default async function ContentPage() {
  const artifacts = await db.contentArtifact.findMany({
    orderBy: { createdAt: "desc" },
  });

  const grouped: Record<string, { id: string; path: string; content: string; createdAt: string }[]> = {
    organization: [],
    software: [],
    faq: [],
    blog: [],
  };

  for (const a of artifacts) {
    const kind = a.kind.toLowerCase();
    const serialized = {
      id: a.id,
      path: a.path,
      content: a.content,
      createdAt: a.createdAt.toISOString(),
    };
    if (kind.includes("blog")) grouped.blog.push(serialized);
    else if (kind.includes("org")) grouped.organization.push(serialized);
    else if (kind.includes("soft") || kind.includes("app")) grouped.software.push(serialized);
    else if (kind.includes("faq")) grouped.faq.push(serialized);
    else grouped.organization.push(serialized);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Content</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Generated JSON-LD structured data and FAQ content
        </p>
      </div>

      {artifacts.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center text-sm text-zinc-500">
          No content artifacts yet — run a content build to generate
        </div>
      ) : (
        <ContentSections grouped={grouped} />
      )}
    </div>
  );
}
