import { describe, it, expect, vi } from "vitest";
import {
  readabilityScore,
  scanForbidden,
  validateJsonLdStructure,
} from "@/lib/services/content/validators";

vi.mock("@/lib/services/embeddings", () => ({
  computeBrandSimilarity: vi.fn().mockResolvedValue(0.95),
}));

describe("scanForbidden", () => {
  it("detects forbidden phrases present in text", () => {
    const hits = scanForbidden(
      "We leverage synergy for growth",
      ["synergy", "leverage"],
    );
    expect(hits).toContain("synergy");
    expect(hits).toContain("leverage");
  });

  it("is case-insensitive", () => {
    const hits = scanForbidden("Big SYNERGY ahead", ["synergy"]);
    expect(hits).toHaveLength(1);
  });

  it("returns empty array when no forbidden phrases match", () => {
    const hits = scanForbidden("This text is clean.", ["synergy", "leverage"]);
    expect(hits).toHaveLength(0);
  });

  it("returns empty array when forbidden list is empty", () => {
    const hits = scanForbidden("Any text here", []);
    expect(hits).toHaveLength(0);
  });
});

describe("readabilityScore", () => {
  it("returns a number", () => {
    const score = readabilityScore("This is a simple test sentence.");
    expect(typeof score).toBe("number");
  });

  it("returns a value between 0 and 100", () => {
    const score = readabilityScore(
      "The cat sat on the mat. It was a good day. The sun was shining.",
    );
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("returns 0 for empty text", () => {
    expect(readabilityScore("")).toBe(0);
  });

  it("returns 0 for text without sentences", () => {
    expect(readabilityScore("no punctuation here")).toBe(0);
  });

  it("scores simple text higher than complex text", () => {
    const simpleScore = readabilityScore(
      "The cat sat on the mat. It was a good day.",
    );
    const complexScore = readabilityScore(
      "The multifaceted epistemological ramifications necessitate comprehensive deliberation. Anthropological considerations substantiate the aforementioned proposition.",
    );
    expect(simpleScore).toBeGreaterThan(complexScore);
  });
});

describe("validateJsonLdStructure", () => {
  it("reports missing @context", () => {
    const errors = validateJsonLdStructure({ "@type": "Organization" }, "organization_ld");
    expect(errors).toContain("Missing @context field");
  });

  it("reports missing @type", () => {
    const errors = validateJsonLdStructure({ "@context": "https://schema.org" }, "organization_ld");
    expect(errors).toContain("Missing @type field");
  });

  it("validates Organization schema requires name and url", () => {
    const errors = validateJsonLdStructure(
      { "@context": "https://schema.org", "@type": "Organization" },
      "organization_ld",
    );
    expect(errors).toContain("Missing required field: name");
    expect(errors).toContain("Missing required field: url");
  });

  it("validates Organization schema accepts correct data", () => {
    const errors = validateJsonLdStructure(
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Test",
        url: "https://example.com",
      },
      "organization_ld",
    );
    expect(errors).toHaveLength(0);
  });

  it("validates SoftwareApplication schema", () => {
    const errors = validateJsonLdStructure(
      {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "Test App",
        applicationCategory: "LegalTech",
      },
      "software_ld",
    );
    expect(errors).toHaveLength(0);
  });

  it("reports wrong @type for software_ld", () => {
    const errors = validateJsonLdStructure(
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Test",
        applicationCategory: "LegalTech",
      },
      "software_ld",
    );
    expect(errors.some((e) => e.includes("Expected @type 'SoftwareApplication'"))).toBe(true);
  });

  it("validates FAQPage schema", () => {
    const errors = validateJsonLdStructure(
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [],
      },
      "faq_page",
    );
    expect(errors).toHaveLength(0);
  });

  it("reports non-array mainEntity for FAQPage", () => {
    const errors = validateJsonLdStructure(
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: "not-an-array",
      },
      "faq_page",
    );
    expect(errors).toContain("mainEntity must be a list");
  });
});
