import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    brandProfile: {
      findFirst: vi.fn(),
    },
    intentTaxonomy: {
      findMany: vi.fn(),
    },
  },
}));

import { db } from "@/lib/db";
import { buildFaqContent } from "@/lib/services/content/faq-builder";

const mockBrand = {
  id: 1,
  name: "Matey AI",
  url: "https://www.matey.ai",
  mission: "AI for legal ops",
  positioning: "The leading AI platform for criminal defense.",
  voiceTone: "professional",
  readingLevel: "8th grade",
  brandTerms: [],
  forbiddenPhrases: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockIntents = [
  { id: "1", text: "What is the best legal AI tool?", createdAt: new Date() },
  { id: "2", text: "How do I automate discovery?", createdAt: new Date() },
  { id: "3", text: "What tools help public defenders?", createdAt: new Date() },
];

describe("buildFaqContent", () => {
  beforeEach(() => {
    vi.mocked(db.intentTaxonomy.findMany).mockResolvedValue(mockIntents as any);
    vi.mocked(db.brandProfile.findFirst).mockResolvedValue(mockBrand as any);
  });

  it("returns schema with @type FAQPage", async () => {
    const { schema } = await buildFaqContent(mockBrand as any);
    expect(schema["@type"]).toBe("FAQPage");
  });

  it("returns schema with @context schema.org", async () => {
    const { schema } = await buildFaqContent(mockBrand as any);
    expect(schema["@context"]).toBe("https://schema.org");
  });

  it("has mainEntity items matching intents count", async () => {
    const { schema } = await buildFaqContent(mockBrand as any);
    expect(schema.mainEntity).toHaveLength(3);
  });

  it("each FAQ item has @type Question", async () => {
    const { schema } = await buildFaqContent(mockBrand as any);
    for (const item of schema.mainEntity) {
      expect(item["@type"]).toBe("Question");
    }
  });

  it("each FAQ item has name and acceptedAnswer", async () => {
    const { schema } = await buildFaqContent(mockBrand as any);
    for (const item of schema.mainEntity) {
      expect(item.name).toBeTruthy();
      expect(item.acceptedAnswer).toBeDefined();
      expect(item.acceptedAnswer["@type"]).toBe("Answer");
      expect(item.acceptedAnswer.text).toBeTruthy();
    }
  });

  it("answers reference the brand name", async () => {
    const { schema } = await buildFaqContent(mockBrand as any);
    for (const item of schema.mainEntity) {
      expect(item.acceptedAnswer.text).toContain("Matey AI");
    }
  });

  it("returns markdown content", async () => {
    const { markdown } = await buildFaqContent(mockBrand as any);
    expect(markdown).toContain("Frequently Asked Questions");
    expect(markdown).toContain("Matey AI");
  });

  it("produces a default FAQ when intents are empty", async () => {
    vi.mocked(db.intentTaxonomy.findMany).mockResolvedValue([]);
    const { schema } = await buildFaqContent(mockBrand as any);
    expect(schema.mainEntity).toHaveLength(1);
    expect(schema.mainEntity[0].name).toContain("What is Matey AI");
  });

  it("loads brand from DB when none is provided", async () => {
    const { schema } = await buildFaqContent(null);
    expect(db.brandProfile.findFirst).toHaveBeenCalled();
    expect(schema["@type"]).toBe("FAQPage");
  });
});
