import { describe, it, expect } from "vitest";
import {
  cn,
  detectBrandMention,
  extractMentionRank,
  normalizeText,
} from "@/lib/utils";

describe("detectBrandMention", () => {
  it("detects 'Matey AI' (mixed case)", () => {
    expect(detectBrandMention("Try Matey AI for legal ops.")).toBe(true);
  });

  it("detects 'mateyai' as one word", () => {
    expect(detectBrandMention("Check out mateyai today.")).toBe(true);
  });

  it("detects 'matey' alone", () => {
    expect(detectBrandMention("Use matey for discovery.")).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(detectBrandMention("MATEY AI is great")).toBe(true);
  });

  it("returns false for unrelated text", () => {
    expect(detectBrandMention("CrimD platform is great.")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(detectBrandMention("")).toBe(false);
  });

  it("returns false for text with no brand names", () => {
    expect(detectBrandMention("Legal AI tools comparison")).toBe(false);
  });
});

describe("extractMentionRank", () => {
  it("returns rank from a numbered list", () => {
    const text = [
      "1. LegalZoom",
      "2. Clio",
      "3. Matey AI",
    ].join("\n");
    expect(extractMentionRank(text)).toBe(3);
  });

  it("returns rank 1 when brand is first in numbered list", () => {
    const text = [
      "1. Matey AI",
      "2. Clio",
      "3. LegalZoom",
    ].join("\n");
    expect(extractMentionRank(text)).toBe(1);
  });

  it("handles numbered list with closing parentheses", () => {
    const text = [
      "1) LegalZoom",
      "2) Matey AI",
    ].join("\n");
    expect(extractMentionRank(text)).toBe(2);
  });

  it("returns rank from a bullet list", () => {
    const text = [
      "- LegalZoom",
      "- Clio",
      "- Matey AI",
    ].join("\n");
    expect(extractMentionRank(text)).toBe(3);
  });

  it("handles asterisk bullet lists", () => {
    const text = [
      "* LegalZoom",
      "* Matey AI",
    ].join("\n");
    expect(extractMentionRank(text)).toBe(2);
  });

  it("returns null when brand is not mentioned", () => {
    const text = [
      "1. LegalZoom",
      "2. Clio",
      "3. Westlaw",
    ].join("\n");
    expect(extractMentionRank(text)).toBeNull();
  });

  it("returns null for empty text", () => {
    expect(extractMentionRank("")).toBeNull();
  });

  it("returns null when brand is mentioned but not in a list", () => {
    expect(extractMentionRank("Matey AI is a platform.")).toBeNull();
  });

  it("handles markdown headings as rank increments", () => {
    const text = [
      "## LegalZoom",
      "## Clio",
      "## Matey AI",
    ].join("\n");
    expect(extractMentionRank(text)).toBe(3);
  });
});

describe("normalizeText", () => {
  it("removes fenced code blocks", () => {
    const text = "Hello ```const x = 1;``` world";
    expect(normalizeText(text)).toBe("Hello world");
  });

  it("removes inline code", () => {
    const text = "Use `npm install` to install";
    expect(normalizeText(text)).toBe("Use to install");
  });

  it("strips markdown links, keeps text", () => {
    const text = "Visit [our site](https://example.com) today.";
    expect(normalizeText(text)).toBe("Visit our site today.");
  });

  it("strips bold/italic markers", () => {
    const text = "This is **bold** and *italic* text.";
    expect(normalizeText(text)).toBe("This is bold and italic text.");
  });

  it("removes heading markers", () => {
    const text = "# Heading One\n## Heading Two";
    expect(normalizeText(text)).toBe("Heading One Heading Two");
  });

  it("collapses multiple whitespace", () => {
    const text = "Hello   \n\n  world";
    expect(normalizeText(text)).toBe("Hello world");
  });

  it("trims leading and trailing spaces", () => {
    expect(normalizeText("  hello  ")).toBe("hello");
  });

  it("handles empty string", () => {
    expect(normalizeText("")).toBe("");
  });
});

describe("cn", () => {
  it("merges tailwind classes", () => {
    const result = cn("px-4 py-2", "px-6");
    expect(result).toContain("px-6");
    expect(result).toContain("py-2");
    expect(result).not.toContain("px-4");
  });

  it("handles conditional classes", () => {
    const result = cn("base", false && "hidden", "text-red-500");
    expect(result).toBe("base text-red-500");
  });

  it("returns empty string with no args", () => {
    expect(cn()).toBe("");
  });

  it("handles undefined and null inputs", () => {
    expect(cn("base", undefined, null, "end")).toBe("base end");
  });
});
