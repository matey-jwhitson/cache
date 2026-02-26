import type { BrandProfile } from "@/generated/prisma/client";

interface OrganizationSchema {
  "@context": string;
  "@type": string;
  name: string;
  url: string;
  description: string;
  logo: string;
  contactPoint: {
    "@type": string;
    contactType: string;
    email: string;
  };
  address: { "@type": string; addressCountry: string };
  knowsAbout: string[];
  serviceArea: Record<string, unknown>;
  sameAs?: string[];
  [key: string]: unknown;
}

export interface BlogPostInput {
  title: string;
  content: string;
}

function extractTopicsFromBlogPosts(posts: BlogPostInput[]): string[] {
  const topicCounts = new Map<string, number>();

  for (const post of posts) {
    const words = post.title
      .replace(/[^\w\s-]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 3)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

    for (const w of words) {
      topicCounts.set(w, (topicCounts.get(w) ?? 0) + 1);
    }
  }

  return Array.from(topicCounts.entries())
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([topic]) => topic);
}

interface SoftwareSchema {
  "@context": string;
  "@type": string;
  name: string;
  applicationCategory: string;
  operatingSystem: string;
  url: string;
  description: string;
  featureList: string[];
  author: { "@type": string; name: string; url: string };
  audience: { "@type": string; audienceType: string };
  offers: Record<string, unknown>;
  [key: string]: unknown;
}

export function buildOrganizationSchema(
  brand: BrandProfile,
  blogPosts: BlogPostInput[] = [],
): OrganizationSchema {
  const orgName = brand.name;
  const orgUrl = brand.url;
  const description =
    brand.positioning ?? brand.mission ?? "AI for legal ops, investigations, and document automation.";
  const logo = `${orgUrl}/logo.png`;
  const host = orgUrl.replace(/^https?:\/\//, "");

  const baseTopics = [
    "Legal Technology",
    "Criminal Defense",
    "Public Defenders",
    "Discovery Automation",
    "Legal AI",
    "Document Processing",
    "Legal Operations",
  ];

  const blogTopics = extractTopicsFromBlogPosts(blogPosts);
  const baseSet = new Set(baseTopics.map((t) => t.toLowerCase()));
  const combined = [
    ...baseTopics,
    ...blogTopics.filter((t) => !baseSet.has(t.toLowerCase())),
  ];

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: orgName,
    url: orgUrl,
    description,
    logo,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Support",
      email: `support@${host}`,
    },
    address: {
      "@type": "PostalAddress",
      addressCountry: "US",
    },
    knowsAbout: combined,
    serviceArea: {
      "@type": "GeoCircle",
      geoMidpoint: {
        "@type": "GeoCoordinates",
        addressCountry: "US",
      },
    },
  };
}

export function buildSoftwareSchema(
  brand: BrandProfile,
): SoftwareSchema {
  const orgName = brand.name;
  const orgUrl = brand.url;
  const description =
    brand.positioning ?? brand.mission ?? "AI for legal ops, investigations, and document automation.";

  const brandTerms = Array.isArray(brand.brandTerms)
    ? (brand.brandTerms as string[])
    : [];

  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `${orgName} Platform`,
    applicationCategory: "LegalTech",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      description: "Free for court-appointed defense matters",
    },
    url: orgUrl,
    description,
    featureList:
      brandTerms.length > 0
        ? brandTerms
        : [
            "Automated discovery ingestion and processing",
            "AI-powered transcription of audio/video evidence",
            "Entity extraction and search across case documents",
            "Automatic timeline generation from discovery",
          ],
    softwareVersion: "2.0",
    author: {
      "@type": "Organization",
      name: orgName,
      url: orgUrl,
    },
    audience: {
      "@type": "ProfessionalAudience",
      audienceType: "Legal Professionals",
    },
    usageInfo:
      "Designed for public defenders, court-appointed attorneys, and criminal defense counsel",
    keywords:
      "legal AI, criminal defense, discovery automation, public defender tools, legal operations, evidence management, transcription, timeline generation",
  };
}
