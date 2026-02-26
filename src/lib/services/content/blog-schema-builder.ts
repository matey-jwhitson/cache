import type { BrandProfile } from "@/generated/prisma/client";

interface BlogPostingSchema {
  "@context": string;
  "@type": string;
  headline: string;
  author: { "@type": string; name: string; url: string };
  publisher: {
    "@type": string;
    name: string;
    url: string;
    logo: { "@type": string; url: string };
  };
  datePublished: string;
  description: string;
  mainEntityOfPage: { "@type": string; "@id": string };
}

interface BlogPostRecord {
  title: string;
  author: string | null;
  content: string;
  createdAt: Date;
}

function summarize(text: string, maxLen = 160): string {
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  let result = "";
  for (const s of sentences) {
    if ((result + " " + s).trim().length > maxLen) break;
    result = (result + " " + s).trim();
  }
  return result || text.slice(0, maxLen).trim();
}

export function buildBlogPostingSchemas(
  posts: BlogPostRecord[],
  brand: BrandProfile,
): BlogPostingSchema[] {
  const orgName = brand.name;
  const orgUrl = brand.url;

  return posts.map((post) => ({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    author: {
      "@type": post.author ? "Person" : "Organization",
      name: post.author ?? orgName,
      url: orgUrl,
    },
    publisher: {
      "@type": "Organization",
      name: orgName,
      url: orgUrl,
      logo: { "@type": "ImageObject", url: `${orgUrl}/logo.png` },
    },
    datePublished: post.createdAt.toISOString().slice(0, 10),
    description: summarize(post.content),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": orgUrl,
    },
  }));
}
