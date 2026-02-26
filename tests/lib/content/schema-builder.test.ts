import { describe, it, expect } from "vitest";
import {
  buildOrganizationSchema,
  buildSoftwareSchema,
} from "@/lib/services/content/schema-builder";

const mockBrand = {
  id: 1,
  name: "Matey AI",
  url: "https://www.matey.ai",
  mission: "AI for legal ops",
  positioning: "The leading AI platform for criminal defense.",
  voiceTone: "professional",
  readingLevel: "8th grade",
  brandTerms: ["discovery automation", "transcription", "timeline building"],
  forbiddenPhrases: ["synergy"],
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("buildOrganizationSchema", () => {
  it("returns an object with @context schema.org", () => {
    const schema = buildOrganizationSchema(mockBrand as any);
    expect(schema["@context"]).toBe("https://schema.org");
  });

  it("has @type Organization", () => {
    const schema = buildOrganizationSchema(mockBrand as any);
    expect(schema["@type"]).toBe("Organization");
  });

  it("uses brand name", () => {
    const schema = buildOrganizationSchema(mockBrand as any);
    expect(schema.name).toBe("Matey AI");
  });

  it("uses brand url", () => {
    const schema = buildOrganizationSchema(mockBrand as any);
    expect(schema.url).toBe("https://www.matey.ai");
  });

  it("uses positioning as description when available", () => {
    const schema = buildOrganizationSchema(mockBrand as any);
    expect(schema.description).toBe(mockBrand.positioning);
  });

  it("falls back to mission when positioning is null", () => {
    const brand = { ...mockBrand, positioning: null };
    const schema = buildOrganizationSchema(brand as any);
    expect(schema.description).toBe(mockBrand.mission);
  });

  it("builds logo URL from brand url", () => {
    const schema = buildOrganizationSchema(mockBrand as any);
    expect(schema.logo).toBe("https://www.matey.ai/logo.png");
  });

  it("includes contactPoint with email derived from host", () => {
    const schema = buildOrganizationSchema(mockBrand as any);
    expect(schema.contactPoint.email).toBe("support@www.matey.ai");
    expect(schema.contactPoint["@type"]).toBe("ContactPoint");
  });

  it("includes knowsAbout array", () => {
    const schema = buildOrganizationSchema(mockBrand as any);
    expect(Array.isArray(schema.knowsAbout)).toBe(true);
    expect(schema.knowsAbout.length).toBeGreaterThan(0);
  });

  it("includes address with US country", () => {
    const schema = buildOrganizationSchema(mockBrand as any);
    expect(schema.address.addressCountry).toBe("US");
  });
});

describe("buildSoftwareSchema", () => {
  it("returns an object with @context schema.org", () => {
    const schema = buildSoftwareSchema(mockBrand as any);
    expect(schema["@context"]).toBe("https://schema.org");
  });

  it("has @type SoftwareApplication", () => {
    const schema = buildSoftwareSchema(mockBrand as any);
    expect(schema["@type"]).toBe("SoftwareApplication");
  });

  it("names the software with 'Platform' suffix", () => {
    const schema = buildSoftwareSchema(mockBrand as any);
    expect(schema.name).toBe("Matey AI Platform");
  });

  it("has applicationCategory LegalTech", () => {
    const schema = buildSoftwareSchema(mockBrand as any);
    expect(schema.applicationCategory).toBe("LegalTech");
  });

  it("uses brand terms as featureList when available", () => {
    const schema = buildSoftwareSchema(mockBrand as any);
    expect(schema.featureList).toEqual(mockBrand.brandTerms);
  });

  it("uses default feature list when brandTerms is empty", () => {
    const brand = { ...mockBrand, brandTerms: [] };
    const schema = buildSoftwareSchema(brand as any);
    expect(schema.featureList.length).toBe(4);
    expect(schema.featureList[0]).toContain("Automated discovery");
  });

  it("includes author organization", () => {
    const schema = buildSoftwareSchema(mockBrand as any);
    expect(schema.author.name).toBe("Matey AI");
    expect(schema.author["@type"]).toBe("Organization");
  });

  it("includes audience targeting legal professionals", () => {
    const schema = buildSoftwareSchema(mockBrand as any);
    expect(schema.audience.audienceType).toBe("Legal Professionals");
  });

  it("includes offers with free pricing", () => {
    const schema = buildSoftwareSchema(mockBrand as any);
    expect(schema.offers).toHaveProperty("@type", "Offer");
  });
});
