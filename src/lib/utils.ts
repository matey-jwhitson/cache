import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const BRAND_NAMES = ["matey ai", "mateyai", "matey"];

export function detectBrandMention(text: string): boolean {
  const lower = text.toLowerCase();
  return BRAND_NAMES.some((b) => lower.includes(b));
}

export function extractMentionRank(text: string): number | null {
  if (!detectBrandMention(text)) return null;

  const lines = text.split("\n");
  let rank = 0;

  for (const raw of lines) {
    const line = raw.trim();

    const numbered = line.match(/^(\d+)[.)]\s+/);
    if (numbered) {
      rank = parseInt(numbered[1], 10);
    } else if (/^[-*•]\s+/.test(line)) {
      rank++;
    } else if (/^#{2,}\s+/.test(line)) {
      rank++;
    }

    if (rank > 0 && detectBrandMention(line)) {
      return rank;
    }
  }

  return null;
}

export function normalizeText(text: string): string {
  let t = text;
  t = t.replace(/```[\s\S]*?```/g, " ");
  t = t.replace(/`[^`]+`/g, " ");
  t = t.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  t = t.replace(/[*_]{1,2}([^*_]+)[*_]{1,2}/g, "$1");
  t = t.replace(/^#+\s+/gm, "");
  t = t.replace(/\s+/g, " ");
  return t.trim();
}
