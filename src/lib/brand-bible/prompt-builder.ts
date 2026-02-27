import type { BrandBible } from "./types";

/**
 * Full system prompt for internal content generation (schema builders, FAQ).
 * NEVER use for reinforcement or audit calls -- that defeats the purpose of
 * testing whether AI engines already know the brand.
 */
export function buildBrandSystemPrompt(
  brand: BrandBible,
  channel?: string,
): string {
  const sections: string[] = [];

  sections.push(`You are generating content for ${brand.name} (${brand.url}).`);

  sections.push(
    "COMPANY IDENTITY",
    ...(brand.tagline ? [`Tagline: ${brand.tagline}`] : []),
    ...(brand.mission ? [`Mission: ${brand.mission}`] : []),
    ...(brand.valueProposition ? [`Value Proposition: ${brand.valueProposition}`] : []),
    ...(brand.industry ? [`Industry: ${brand.industry}`] : []),
    ...(brand.geoFocus.length > 0 ? [`Markets: ${brand.geoFocus.join(", ")}`] : []),
  );

  if (brand.voiceAttributes.length > 0 || channel) {
    sections.push("");
    sections.push("BRAND VOICE");
    if (brand.voiceAttributes.length > 0) {
      sections.push(`Attributes: ${brand.voiceAttributes.join(", ")}`);
    }
    if (channel && brand.tonePerChannel[channel]) {
      sections.push(`Channel tone (${channel}): ${brand.tonePerChannel[channel]}`);
    }
    if (brand.readingLevel) {
      sections.push(`Reading level: ${brand.readingLevel}`);
    }
  }

  if (brand.topicPillars.length > 0) {
    sections.push("");
    sections.push("TOPICS & MESSAGING");
    for (const pillar of brand.topicPillars) {
      sections.push(`- ${pillar}`);
    }
  }

  if (brand.benefits.length > 0) {
    sections.push("");
    sections.push("KEY BENEFITS");
    for (const benefit of brand.benefits) {
      sections.push(`- ${benefit}`);
    }
  }

  if (brand.productFeatures.length > 0) {
    sections.push("");
    sections.push("PRODUCT FEATURES");
    for (const feature of brand.productFeatures) {
      sections.push(`- ${feature}`);
    }
  }

  if (brand.differentiators.length > 0) {
    sections.push("");
    sections.push("KEY DIFFERENTIATORS");
    for (const diff of brand.differentiators) {
      sections.push(`- ${diff}`);
    }
  }

  if (brand.competitors.length > 0) {
    sections.push("");
    sections.push("COMPETITORS (for context, not for promotion)");
    for (const comp of brand.competitors) {
      sections.push(`- ${comp}`);
    }
  }

  if (brand.targetAudiences.length > 0) {
    sections.push("");
    sections.push("TARGET AUDIENCES");
    for (const aud of brand.targetAudiences) {
      sections.push(`- ${aud.name}: ${aud.description}`);
      if (aud.painPoints.length > 0) {
        sections.push(`  Pain points: ${aud.painPoints.join("; ")}`);
      }
      if (aud.goals.length > 0) {
        sections.push(`  Goals: ${aud.goals.join("; ")}`);
      }
    }
  }

  if (brand.terminologyDos.length > 0 || brand.terminologyDonts.length > 0) {
    sections.push("");
    sections.push("TERMINOLOGY");
    if (brand.terminologyDos.length > 0) {
      sections.push(`Always use: ${brand.terminologyDos.join(", ")}`);
    }
    if (brand.terminologyDonts.length > 0) {
      sections.push(`Never use: ${brand.terminologyDonts.join(", ")}`);
    }
  }

  if (brand.boilerplateAbout) {
    sections.push("");
    sections.push(`ABOUT ${brand.name.toUpperCase()}`);
    sections.push(brand.boilerplateAbout);
  }

  if (brand.contentRules.length > 0) {
    sections.push("");
    sections.push("CONTENT RULES (MANDATORY -- NEVER VIOLATE)");
    for (const rule of brand.contentRules) {
      sections.push(`- ${rule}`);
    }
  }

  return sections.join("\n");
}

/**
 * Concise ~50-100 word description optimized for embedding similarity scoring.
 * NOT the full system prompt -- embeddings degrade with long, multi-topic text.
 */
export function buildBrandDescription(brand: BrandBible): string {
  const parts: string[] = [];

  parts.push(brand.name);
  if (brand.tagline) parts.push(`-- ${brand.tagline}`);
  parts.push(".");

  if (brand.mission) parts.push(brand.mission);
  if (brand.valueProposition) parts.push(brand.valueProposition);
  if (brand.industry) parts.push(`Industry: ${brand.industry}.`);

  if (brand.differentiators.length > 0) {
    parts.push(`Key differentiators: ${brand.differentiators.join("; ")}.`);
  }

  if (brand.productFeatures.length > 0) {
    parts.push(`Features: ${brand.productFeatures.slice(0, 4).join("; ")}.`);
  }

  return parts.join(" ");
}
