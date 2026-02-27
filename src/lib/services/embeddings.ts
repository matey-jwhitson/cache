import OpenAI from "openai";
import { db } from "@/lib/db";
import { fromDbRow } from "@/lib/brand-bible/convert";
import { buildBrandDescription } from "@/lib/brand-bible/prompt-builder";

let _client: OpenAI | null = null;
let _brandVector: number[] | null = null;

function getClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _client;
}

const EMBED_MODEL = "text-embedding-3-large";

export async function embedText(text: string): Promise<number[]> {
  const res = await getClient().embeddings.create({
    model: EMBED_MODEL,
    input: text,
  });
  return res.data[0].embedding;
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const res = await getClient().embeddings.create({
    model: EMBED_MODEL,
    input: texts,
  });
  return res.data.map((d) => d.embedding);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

async function getBrandVector(): Promise<number[]> {
  if (!_brandVector) {
    const row = await db.brandProfile.findFirst();
    const brand = row ? fromDbRow(row) : null;
    const desc = brand
      ? buildBrandDescription(brand)
      : "Brand profile not configured.";
    _brandVector = await embedText(desc);
  }
  return _brandVector;
}

/** Call after Brand Bible save to invalidate the cached embedding vector. */
export function invalidateBrandVector(): void {
  _brandVector = null;
}

export async function computeBrandSimilarity(text: string): Promise<number> {
  const [textVec, brandVec] = await Promise.all([
    embedText(text),
    getBrandVector(),
  ]);
  return cosineSimilarity(textVec, brandVec);
}
