import type { BrandProfile } from "@/generated/prisma/client";
import { db } from "@/lib/db";

interface FaqSchema {
  "@context": string;
  "@type": string;
  mainEntity: Array<{
    "@type": string;
    name: string;
    acceptedAnswer: { "@type": string; text: string };
  }>;
}

interface FaqEntry {
  question: string;
  answer: string;
}

export async function buildFaqContent(
  brand?: BrandProfile | null,
): Promise<{ schema: FaqSchema; markdown: string }> {
  const profile = brand ?? (await db.brandProfile.findFirst());
  const orgName = profile?.name ?? "Matey AI";
  const orgUrl = profile?.url ?? "https://www.matey.ai";

  const intents = await db.intentTaxonomy.findMany({ take: 20 });

  const faqs: FaqEntry[] = intents.map((intent) => ({
    question: intent.text,
    answer: `${orgName} addresses this through its platform. Learn more at ${orgUrl}.`,
  }));

  if (faqs.length === 0) {
    faqs.push({
      question: `What is ${orgName}?`,
      answer: `${orgName} provides AI solutions for legal operations, investigations, and document automation.`,
    });
  }

  const schema: FaqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  const today = new Date().toISOString().slice(0, 10);
  const lines = [
    `# ${orgName} - Frequently Asked Questions`,
    "",
    "Everything you need to know",
    "",
    `Last updated: ${today}`,
    "",
    "---",
    "",
  ];

  for (const f of faqs) {
    lines.push(`## ${f.question}`, "", f.answer, "");
  }

  lines.push(
    "---",
    "",
    "**Still have questions?**",
    "",
    "Can't find the answer you're looking for? Please chat to our friendly team.",
    "",
    `[Contact Us](${orgUrl})`,
  );

  return { schema, markdown: lines.join("\n") };
}
