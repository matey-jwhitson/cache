import { db } from "@/lib/db";
import { fromDbRow } from "@/lib/brand-bible/convert";
import { BrandBibleEditor } from "./brand-bible-editor";

export const maxDuration = 60;

export default async function BrandPage() {
  const row = await db.brandProfile.findFirst();
  const brand = row ? fromDbRow(row) : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Brand Bible</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Your brand identity, voice, audiences, and content rules —
          the single source of truth for all AI-generated content and AEO strategy.
        </p>
      </div>

      <BrandBibleEditor initial={brand} />
    </div>
  );
}
