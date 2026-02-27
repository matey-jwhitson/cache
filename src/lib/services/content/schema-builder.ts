import type { BrandBible } from "@/lib/brand-bible/types";

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
  brand: BrandBible,
  blogPosts: BlogPostInput[] = [],
): OrganizationSchema {
  const description =
    brand.valueProposition || brand.mission || `${brand.name} — ${brand.industry}`;
  const logo = brand.logoUrl || `${brand.url}/logo.png`;
  const host = brand.url.replace(/^https?:\/\//, "");

  const basePillars = brand.topicPillars.length > 0 ? brand.topicPillars : [];
  const blogTopics = extractTopicsFromBlogPosts(blogPosts);
  const baseSet = new Set(basePillars.map((t) => t.toLowerCase()));
  const combined = [
    ...basePillars,
    ...blogTopics.filter((t) => !baseSet.has(t.toLowerCase())),
  ];

  const primaryGeo = brand.geoFocus[0] ?? "US";

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: brand.name,
    url: brand.url,
    description,
    logo,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Support",
      email: `support@${host}`,
    },
    address: {
      "@type": "PostalAddress",
      addressCountry: primaryGeo,
    },
    knowsAbout: combined,
    serviceArea: {
      "@type": "GeoCircle",
      geoMidpoint: {
        "@type": "GeoCoordinates",
        addressCountry: primaryGeo,
      },
    },
  };
}

export function buildSoftwareSchema(brand: BrandBible): SoftwareSchema {
  const description =
    brand.valueProposition || brand.mission || `${brand.name} — ${brand.industry}`;

  const audienceType =
    brand.targetAudiences.length > 0
      ? brand.targetAudiences[0].name
      : "Professionals";

  const keywords = [
    ...brand.topicPillars.slice(0, 5),
    ...brand.productFeatures.slice(0, 3),
    brand.industry,
  ]
    .filter(Boolean)
    .join(", ");

  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `${brand.name} Platform`,
    applicationCategory: brand.industry || "Software",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    url: brand.url,
    description,
    featureList:
      brand.productFeatures.length > 0
        ? brand.productFeatures
        : brand.benefits,
    softwareVersion: "2.0",
    author: {
      "@type": "Organization",
      name: brand.name,
      url: brand.url,
    },
    audience: {
      "@type": "ProfessionalAudience",
      audienceType,
    },
    ...(brand.differentiators.length > 0
      ? { usageInfo: brand.differentiators.join(". ") }
      : {}),
    ...(keywords ? { keywords } : {}),
  };
}
