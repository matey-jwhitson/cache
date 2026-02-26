import { computeBrandSimilarity } from "@/lib/services/embeddings";

export interface GateConfig {
  zeroForbidden?: boolean;
  minReadability?: number;
  minSimilarityToGolden?: number;
  requireCitations?: boolean;
}

export interface GateReport {
  structureErrors: string[];
  forbiddenHits: string[];
  readability: number;
  semanticDrift: "pass" | "fail" | null;
  gateFailures: string[];
}

export function readabilityScore(text: string): number {
  let cleaned = text.replace(/\[[^\]]+\]/g, "");
  cleaned = cleaned.replace(/[#*`]/g, "");

  const sentences = (cleaned.match(/[.!?]+/g) ?? []).length;
  if (sentences === 0) return 0;

  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 0) return 0;

  let syllables = 0;
  for (const raw of words) {
    const word = raw.toLowerCase().replace(/[.,!?;:]/g, "");
    let count = (word.match(/[aeiouy]+/g) ?? []).length;
    if (word.endsWith("e")) count--;
    if (count <= 0) count = 1;
    syllables += count;
  }

  const score =
    206.835 - 1.015 * (words.length / sentences) - 84.6 * (syllables / words.length);
  return Math.max(0, Math.min(100, score));
}

export function scanForbidden(text: string, forbidden: string[]): string[] {
  const lower = text.toLowerCase();
  return forbidden.filter((p) => lower.includes(p.toLowerCase()));
}

export function validateJsonLdStructure(
  artifact: Record<string, unknown>,
  kind: string,
): string[] {
  const errors: string[] = [];

  if (!("@context" in artifact)) errors.push("Missing @context field");
  if (!("@type" in artifact)) errors.push("Missing @type field");

  if (kind === "organization_ld") {
    if (artifact["@type"] !== "Organization")
      errors.push(`Expected @type 'Organization', got '${artifact["@type"]}'`);
    for (const f of ["name", "url"]) {
      if (!(f in artifact)) errors.push(`Missing required field: ${f}`);
    }
  } else if (kind === "software_ld") {
    if (artifact["@type"] !== "SoftwareApplication")
      errors.push(`Expected @type 'SoftwareApplication', got '${artifact["@type"]}'`);
    for (const f of ["name", "applicationCategory"]) {
      if (!(f in artifact)) errors.push(`Missing required field: ${f}`);
    }
  } else if (kind === "faq_page") {
    if (artifact["@type"] !== "FAQPage")
      errors.push(`Expected @type 'FAQPage', got '${artifact["@type"]}'`);
    if (!("mainEntity" in artifact)) errors.push("Missing mainEntity field");
    else if (!Array.isArray(artifact.mainEntity))
      errors.push("mainEntity must be a list");
  } else if (kind === "blog_posting") {
    if (artifact["@type"] !== "BlogPosting")
      errors.push(`Expected @type 'BlogPosting', got '${artifact["@type"]}'`);
    for (const f of ["headline", "author", "publisher"]) {
      if (!(f in artifact)) errors.push(`Missing required field: ${f}`);
    }
  }

  return errors;
}

export async function runContentGates(
  content: { artifact: Record<string, unknown>; text: string; kind: string },
  config: GateConfig = {},
  goldenText?: string,
): Promise<{ ok: boolean; report: GateReport }> {
  const report: GateReport = {
    structureErrors: [],
    forbiddenHits: [],
    readability: 0,
    semanticDrift: null,
    gateFailures: [],
  };

  report.structureErrors = validateJsonLdStructure(content.artifact, content.kind);
  if (report.structureErrors.length > 0) {
    report.gateFailures.push("structure");
  }

  if (config.zeroForbidden !== false) {
    const forbidden: string[] = [];
    report.forbiddenHits = scanForbidden(content.text, forbidden);
    if (report.forbiddenHits.length > 0) {
      report.gateFailures.push("forbidden_phrases");
    }
  }

  const readScore = readabilityScore(content.text);
  report.readability = readScore;
  if (readScore < (config.minReadability ?? 55)) {
    report.gateFailures.push("readability");
  }

  if (goldenText) {
    const minSim = config.minSimilarityToGolden ?? 0.92;
    const similarity = await computeBrandSimilarity(content.text);
    const goldenSim = await computeBrandSimilarity(goldenText);
    const diff = Math.abs(similarity - goldenSim);
    const pass = diff < (1 - minSim);
    report.semanticDrift = pass ? "pass" : "fail";
    if (!pass) report.gateFailures.push("semantic_drift");
  }

  return { ok: report.gateFailures.length === 0, report };
}
