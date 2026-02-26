import { describe, it, expect, vi, beforeEach } from "vitest";
import { cosineSimilarity } from "@/lib/services/embeddings";

vi.mock("openai", () => {
  const mockCreate = vi.fn().mockResolvedValue({
    data: [{ embedding: [0.1, 0.2, 0.3] }],
  });
  class MockOpenAI {
    embeddings = { create: mockCreate };
  }
  return { default: MockOpenAI };
});

describe("cosineSimilarity", () => {
  it("returns 1 for identical vectors", () => {
    const v = [1, 2, 3];
    expect(cosineSimilarity(v, v)).toBeCloseTo(1.0, 5);
  });

  it("returns 0 for orthogonal vectors", () => {
    const a = [1, 0, 0];
    const b = [0, 1, 0];
    expect(cosineSimilarity(a, b)).toBeCloseTo(0, 5);
  });

  it("returns -1 for opposite vectors", () => {
    const a = [1, 2, 3];
    const b = [-1, -2, -3];
    expect(cosineSimilarity(a, b)).toBeCloseTo(-1.0, 5);
  });

  it("returns 0 when one vector is all zeros", () => {
    const a = [0, 0, 0];
    const b = [1, 2, 3];
    expect(cosineSimilarity(a, b)).toBe(0);
  });

  it("handles unit vectors correctly", () => {
    const a = [1, 0];
    const b = [Math.SQRT1_2, Math.SQRT1_2];
    expect(cosineSimilarity(a, b)).toBeCloseTo(Math.SQRT1_2, 5);
  });

  it("works with longer vectors", () => {
    const a = Array.from({ length: 100 }, (_, i) => i);
    const b = Array.from({ length: 100 }, (_, i) => i * 2);
    expect(cosineSimilarity(a, b)).toBeCloseTo(1.0, 5);
  });
});

describe("computeBrandSimilarity", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("calls embedText and returns a number", async () => {
    const mod = await import("@/lib/services/embeddings");
    const result = await mod.computeBrandSimilarity("test legal AI tool");
    expect(typeof result).toBe("number");
    expect(result).toBeGreaterThanOrEqual(-1);
    expect(result).toBeLessThanOrEqual(1);
  });
});
