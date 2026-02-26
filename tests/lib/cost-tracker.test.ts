import { describe, it, expect } from "vitest";
import {
  calculateCost,
  estimateAuditCost,
  getMonthlyProjection,
} from "@/lib/services/cost-tracker";

describe("calculateCost", () => {
  it("calculates cost for openai/gpt-4o", () => {
    const result = calculateCost("openai", "gpt-4o", 1_000_000, 1_000_000);
    expect(result.costUsd).toBe(12.5);
    expect(result.provider).toBe("openai");
    expect(result.model).toBe("gpt-4o");
    expect(result.tokensIn).toBe(1_000_000);
    expect(result.tokensOut).toBe(1_000_000);
  });

  it("calculates cost for openai/gpt-4o-mini", () => {
    const result = calculateCost("openai", "gpt-4o-mini", 1_000_000, 1_000_000);
    expect(result.costUsd).toBe(0.75);
  });

  it("calculates cost for anthropic/claude-3-haiku", () => {
    const result = calculateCost(
      "anthropic",
      "claude-3-haiku-20240307",
      1_000_000,
      1_000_000,
    );
    expect(result.costUsd).toBe(1.5);
  });

  it("maps 'gemini' provider to google pricing", () => {
    const result = calculateCost(
      "gemini",
      "gemini-2.0-flash",
      1_000_000,
      1_000_000,
    );
    expect(result.costUsd).toBe(0.375);
  });

  it("maps 'grok' provider to xai pricing", () => {
    const result = calculateCost(
      "grok",
      "grok-2-latest",
      1_000_000,
      1_000_000,
    );
    expect(result.costUsd).toBe(12);
  });

  it("uses fallback pricing for unknown provider", () => {
    const result = calculateCost("unknown", "model-x", 1_000_000, 1_000_000);
    expect(result.costUsd).toBe(4);
  });

  it("returns zero cost when tokens are zero", () => {
    const result = calculateCost("openai", "gpt-4o", 0, 0);
    expect(result.costUsd).toBe(0);
  });

  it("falls back to first model pricing when model is unknown", () => {
    const result = calculateCost("openai", "unknown-model", 1_000_000, 1_000_000);
    expect(result.costUsd).toBe(12.5);
  });

  it("is case-insensitive on provider name", () => {
    const result = calculateCost("OpenAI", "gpt-4o", 1_000_000, 1_000_000);
    expect(result.costUsd).toBe(12.5);
  });
});

describe("estimateAuditCost", () => {
  it("returns a positive number with default args", () => {
    const cost = estimateAuditCost();
    expect(cost).toBeGreaterThan(0);
    expect(typeof cost).toBe("number");
  });

  it("scales with number of prompts", () => {
    const cost20 = estimateAuditCost(20);
    const cost40 = estimateAuditCost(40);
    expect(cost40).toBeGreaterThan(cost20);
    expect(cost40).toBeCloseTo(cost20 * 2, 2);
  });

  it("returns 0 for zero prompts", () => {
    expect(estimateAuditCost(0)).toBe(0);
  });
});

describe("getMonthlyProjection", () => {
  it("projects monthly cost from daily average", () => {
    const result = getMonthlyProjection(10, 5.0);
    expect(result).toBe(15);
  });

  it("returns 0 when no history days", () => {
    expect(getMonthlyProjection(0, 100)).toBe(0);
  });

  it("handles a single day of history", () => {
    const result = getMonthlyProjection(1, 2.0);
    expect(result).toBe(60);
  });

  it("rounds to two decimal places", () => {
    const result = getMonthlyProjection(7, 1.11);
    expect(result).toBe(4.76);
  });
});
