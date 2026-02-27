import { describe, it, expect } from "vitest";
import {
  buildOrganizationSchema,
  buildSoftwareSchema,
} from "@/lib/services/content/schema-builder";
import type { BrandBible } from "@/lib/brand-bible/types";

const mockBrand: BrandBible = {
  id: 1,
  name: "Matey AI",
  url: "https://www.matey.ai",
  logoUrl: "https://www.matey.ai/logo.png",
  tagline: "From evidence to answers in minutes",
  mission: "AI for legal ops",
  valueProposition: "The leading AI platform for criminal defense.",
  industry: "LegalTech",
  geoFocus: ["US"],
  voiceAttributes: ["professional"],
  tonePerChannel: {},
  readingLevel: "8th grade",
  topicPillars: ["Legal Technology", "Criminal Defense", "Discovery Automation"],
  targetAudiences: [
    {
      name: "Public Defenders",
      description: "Court-appointed attorneys",
      painPoints: ["Overwhelming caseloads"],
      goals: ["Faster case prep"],
      jobsToBeDone: ["Review discovery"],
      geos: ["US"],
      segments: ["Legal"],
    },
  ],
  terminologyDos: ["Matey AI", "CrimD"],
  terminologyDonts: ["synergy"],
  contentRules: [],
  benefits: ["Automated discovery processing"],
  productFeatures: ["discovery automation", "transcription", "timeline building"],
  competitors: ["Relativity"],
  differentiators: ["Free for court-appointed defense"],
  boilerplateAbout: "",
  boilerplateDisclaimer: "",
  rawDocument: "",
};

describe("buildOrganizationSchema", () => {
  it("returns an object with @context schema.org", () => {
    const schema = buildOrganizationSchema(mockBrand);
    expect(schema["@context"]).toBe("https://schema.org");
  });

  it("has @type Organization", () => {
    const schema = buildOrganizationSchema(mockBrand);
    expect(schema["@type"]).toBe("Organization");
  });

  it("uses brand name", () => {
    const schema = buildOrganizationSchema(mockBrand);
    expect(schema.name).toBe("Matey AI");
  });

  it("uses brand url", () => {
    const schema = buildOrganizationSchema(mockBrand);
    expect(schema.url).toBe("https://www.matey.ai");
  });

  it("uses valueProposition as description when available", () => {
    const schema = buildOrganizationSchema(mockBrand);
    expect(schema.description).toBe(mockBrand.valueProposition);
  });

  it("falls back to mission when valueProposition is empty", () => {
    const brand = { ...mockBrand, valueProposition: "" };
    const schema = buildOrganizationSchema(brand);
    expect(schema.description).toBe(mockBrand.mission);
  });

  it("uses logoUrl for logo field", () => {
    const schema = buildOrganizationSchema(mockBrand);
    expect(schema.logo).toBe("https://www.matey.ai/logo.png");
  });

  it("includes contactPoint with email derived from host", () => {
    const schema = buildOrganizationSchema(mockBrand);
    expect(schema.contactPoint.email).toBe("support@www.matey.ai");
    expect(schema.contactPoint["@type"]).toBe("ContactPoint");
  });

  it("includes knowsAbout from topicPillars", () => {
    const schema = buildOrganizationSchema(mockBrand);
    expect(Array.isArray(schema.knowsAbout)).toBe(true);
    expect(schema.knowsAbout).toContain("Legal Technology");
  });

  it("includes address with geoFocus country", () => {
    const schema = buildOrganizationSchema(mockBrand);
    expect(schema.address.addressCountry).toBe("US");
  });
});

describe("buildSoftwareSchema", () => {
  it("returns an object with @context schema.org", () => {
    const schema = buildSoftwareSchema(mockBrand);
    expect(schema["@context"]).toBe("https://schema.org");
  });

  it("has @type SoftwareApplication", () => {
    const schema = buildSoftwareSchema(mockBrand);
    expect(schema["@type"]).toBe("SoftwareApplication");
  });

  it("names the software with 'Platform' suffix", () => {
    const schema = buildSoftwareSchema(mockBrand);
    expect(schema.name).toBe("Matey AI Platform");
  });

  it("uses industry as applicationCategory", () => {
    const schema = buildSoftwareSchema(mockBrand);
    expect(schema.applicationCategory).toBe("LegalTech");
  });

  it("uses productFeatures as featureList", () => {
    const schema = buildSoftwareSchema(mockBrand);
    expect(schema.featureList).toEqual(mockBrand.productFeatures);
  });

  it("falls back to benefits when productFeatures is empty", () => {
    const brand = { ...mockBrand, productFeatures: [] };
    const schema = buildSoftwareSchema(brand);
    expect(schema.featureList).toEqual(mockBrand.benefits);
  });

  it("includes author organization", () => {
    const schema = buildSoftwareSchema(mockBrand);
    expect(schema.author.name).toBe("Matey AI");
    expect(schema.author["@type"]).toBe("Organization");
  });

  it("uses first targetAudience as audience type", () => {
    const schema = buildSoftwareSchema(mockBrand);
    expect(schema.audience.audienceType).toBe("Public Defenders");
  });

  it("includes offers", () => {
    const schema = buildSoftwareSchema(mockBrand);
    expect(schema.offers).toHaveProperty("@type", "Offer");
  });
});
