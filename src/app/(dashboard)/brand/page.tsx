import { db } from "@/lib/db";
import { BrandForm } from "./brand-form";

export default async function BrandPage() {
  const brand = await db.brandProfile.findFirst();

  const initial = brand
    ? {
        name: brand.name,
        url: brand.url,
        mission: brand.mission ?? "",
        positioning: brand.positioning ?? "",
        voiceTone: brand.voiceTone ?? "",
        readingLevel: brand.readingLevel ?? "",
        brandTerms: Array.isArray(brand.brandTerms) ? (brand.brandTerms as string[]).join(", ") : "",
        forbiddenPhrases: Array.isArray(brand.forbiddenPhrases) ? (brand.forbiddenPhrases as string[]).join(", ") : "",
      }
    : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Brand Profile</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Configure your brand identity for content generation and monitoring
        </p>
      </div>

      <BrandForm initial={initial} />
    </div>
  );
}
