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

function extractExcerpt(content: string, maxLen = 300): string {
  const sentences = content.split(/(?<=[.!?])\s+/).filter(Boolean);
  let excerpt = "";
  for (const s of sentences) {
    if ((excerpt + " " + s).trim().length > maxLen) break;
    excerpt = (excerpt + " " + s).trim();
  }
  return excerpt || content.slice(0, maxLen).trim();
}

function findRelevantPost(
  question: string,
  posts: Array<{ title: string; content: string }>,
): { title: string; content: string } | null {
  const qWords = question
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3);

  let bestPost: (typeof posts)[number] | null = null;
  let bestScore = 0;

  for (const post of posts) {
    const haystack = `${post.title} ${post.content}`.toLowerCase();
    const score = qWords.reduce(
      (sum, w) => sum + (haystack.includes(w) ? 1 : 0),
      0,
    );
    if (score > bestScore) {
      bestScore = score;
      bestPost = post;
    }
  }

  return bestScore >= 2 ? bestPost : null;
}

export async function buildFaqContent(
  brand?: BrandProfile | null,
): Promise<{ schema: FaqSchema; markdown: string }> {
  const profile = brand ?? (await db.brandProfile.findFirst());
  const orgName = profile?.name ?? "Matey AI";
  const orgUrl = profile?.url ?? "https://www.matey.ai";

  const intents = await db.intentTaxonomy.findMany({ take: 20 });

  const blogPosts = await db.contentItem.findMany({
    where: { sourceType: "rss" },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { title: true, content: true },
  });

  const faqs: FaqEntry[] = intents.map((intent) => {
    const match = findRelevantPost(intent.text, blogPosts);
    if (match) {
      const excerpt = extractExcerpt(match.content);
      return {
        question: intent.text,
        answer: `${excerpt} Learn more at ${orgUrl}.`,
      };
    }
    return {
      question: intent.text,
      answer: `${orgName} addresses this through its platform. Learn more at ${orgUrl}.`,
    };
  });

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
