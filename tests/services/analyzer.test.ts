import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    auditResult: {
      aggregate: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { db } from "@/lib/db";
import { getKPIs, getIntentBreakdown } from "@/lib/services/analyzer";

describe("getKPIs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns structure with mentionRate, avgSimilarity, avgMentionRank, totalPrompts", async () => {
    vi.mocked(db.auditResult.aggregate).mockResolvedValue({
      _count: { id: 100 },
      _avg: { similarity: 0.75, mentionRank: 3.2 },
    } as any);
    vi.mocked(db.auditResult.count).mockResolvedValue(60);

    const kpis = await getKPIs();

    expect(kpis).toHaveProperty("mentionRate");
    expect(kpis).toHaveProperty("avgSimilarity");
    expect(kpis).toHaveProperty("avgMentionRank");
    expect(kpis).toHaveProperty("totalPrompts");
  });

  it("calculates mentionRate as mentions / total", async () => {
    vi.mocked(db.auditResult.aggregate).mockResolvedValue({
      _count: { id: 100 },
      _avg: { similarity: 0.8, mentionRank: 2 },
    } as any);
    vi.mocked(db.auditResult.count).mockResolvedValue(40);

    const kpis = await getKPIs();
    expect(kpis.mentionRate).toBe(0.4);
    expect(kpis.totalPrompts).toBe(100);
  });

  it("returns 0 mentionRate when total is zero", async () => {
    vi.mocked(db.auditResult.aggregate).mockResolvedValue({
      _count: { id: 0 },
      _avg: { similarity: null, mentionRank: null },
    } as any);
    vi.mocked(db.auditResult.count).mockResolvedValue(0);

    const kpis = await getKPIs();
    expect(kpis.mentionRate).toBe(0);
    expect(kpis.avgSimilarity).toBe(0);
    expect(kpis.avgMentionRank).toBeNull();
  });

  it("uses avgSimilarity from aggregate", async () => {
    vi.mocked(db.auditResult.aggregate).mockResolvedValue({
      _count: { id: 50 },
      _avg: { similarity: 0.65, mentionRank: null },
    } as any);
    vi.mocked(db.auditResult.count).mockResolvedValue(25);

    const kpis = await getKPIs();
    expect(kpis.avgSimilarity).toBe(0.65);
    expect(kpis.avgMentionRank).toBeNull();
  });

  it("passes provider filter to query", async () => {
    vi.mocked(db.auditResult.aggregate).mockResolvedValue({
      _count: { id: 10 },
      _avg: { similarity: 0.9, mentionRank: 1 },
    } as any);
    vi.mocked(db.auditResult.count).mockResolvedValue(8);

    await getKPIs({ provider: "openai" });

    expect(db.auditResult.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ provider: "openai" }),
      }),
    );
  });
});

describe("getIntentBreakdown", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an array", async () => {
    vi.mocked(db.auditResult.findMany).mockResolvedValue([]);

    const breakdown = await getIntentBreakdown();
    expect(Array.isArray(breakdown)).toBe(true);
  });

  it("maps audit results to breakdown items", async () => {
    vi.mocked(db.auditResult.findMany).mockResolvedValue([
      {
        provider: "openai",
        promptId: "p1",
        mentioned: true,
        mentionRank: 1,
        similarity: 0.92,
        responseText: "Matey AI is a great tool for legal professionals and more text here to test snippet truncation...",
        meta: {},
        createdAt: new Date(),
      },
    ] as any);

    const breakdown = await getIntentBreakdown();
    expect(breakdown).toHaveLength(1);
    expect(breakdown[0]).toHaveProperty("provider", "openai");
    expect(breakdown[0]).toHaveProperty("promptId", "p1");
    expect(breakdown[0]).toHaveProperty("mentioned", true);
    expect(breakdown[0]).toHaveProperty("mentionRank", 1);
    expect(breakdown[0]).toHaveProperty("similarity", 0.92);
    expect(breakdown[0]).toHaveProperty("responseSnippet");
    expect(breakdown[0]).toHaveProperty("meta");
  });

  it("truncates responseSnippet to 150 characters", async () => {
    const longText = "x".repeat(300);
    vi.mocked(db.auditResult.findMany).mockResolvedValue([
      {
        provider: "openai",
        promptId: "p2",
        mentioned: false,
        mentionRank: null,
        similarity: 0.5,
        responseText: longText,
        meta: null,
        createdAt: new Date(),
      },
    ] as any);

    const breakdown = await getIntentBreakdown();
    expect(breakdown[0].responseSnippet.length).toBe(150);
  });

  it("respects limit option", async () => {
    vi.mocked(db.auditResult.findMany).mockResolvedValue([]);

    await getIntentBreakdown({ limit: 10 });

    expect(db.auditResult.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 10 }),
    );
  });
});
