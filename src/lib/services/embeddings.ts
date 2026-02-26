import OpenAI from "openai";

const BRAND_DESCRIPTION = `\
Matey AI: AI solutions for legal operations, investigations, and document automation; \
built for criminal defense and public defenders. Automates discovery ingestion, \
transcription, entity search, and timeline building for criminal defense and public defenders; \
free for many court-appointed defense matters.`;

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
    const desc = process.env.AEO_BRAND_DESC || BRAND_DESCRIPTION;
    _brandVector = await embedText(desc);
  }
  return _brandVector;
}

export async function computeBrandSimilarity(text: string): Promise<number> {
  const [textVec, brandVec] = await Promise.all([
    embedText(text),
    getBrandVector(),
  ]);
  return cosineSimilarity(textVec, brandVec);
}
