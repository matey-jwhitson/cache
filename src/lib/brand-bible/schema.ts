import { z } from "zod";

const targetAudienceSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  painPoints: z.array(z.string()).default([]),
  goals: z.array(z.string()).default([]),
  jobsToBeDone: z.array(z.string()).default([]),
  geos: z.array(z.string()).default([]),
  segments: z.array(z.string()).default([]),
});

export const brandBibleSchema = z.object({
  name: z.string().min(1, "Brand name is required"),
  url: z.string().min(1, "Website URL is required"),
  logoUrl: z.string().default(""),
  tagline: z.string().default(""),
  mission: z.string().default(""),
  valueProposition: z.string().default(""),
  industry: z.string().default(""),
  geoFocus: z.array(z.string()).default([]),
  voiceAttributes: z.array(z.string()).min(1, "At least one voice attribute is required"),
  tonePerChannel: z.record(z.string(), z.string()).default({}),
  readingLevel: z.string().default(""),
  topicPillars: z.array(z.string()).default([]),
  targetAudiences: z.array(targetAudienceSchema).default([]),
  terminologyDos: z.array(z.string()).default([]),
  terminologyDonts: z.array(z.string()).default([]),
  contentRules: z.array(z.string()).default([]),
  benefits: z.array(z.string()).default([]),
  productFeatures: z.array(z.string()).default([]),
  competitors: z.array(z.string()).default([]),
  differentiators: z.array(z.string()).default([]),
  boilerplateAbout: z.string().default(""),
  boilerplateDisclaimer: z.string().default(""),
});

export type BrandBibleFormData = z.infer<typeof brandBibleSchema>;

const extractionAudienceSchema = z.object({
  name: z.string().describe("Audience segment name, e.g. 'Public Defenders'"),
  description: z.string().describe("Brief description of this audience segment"),
  painPoints: z.array(z.string()).describe("Key pain points this audience experiences"),
  goals: z.array(z.string()).describe("Primary goals and desired outcomes for this audience"),
  jobsToBeDone: z.array(z.string()).describe("Tasks this audience needs to accomplish, e.g. 'Review discovery materials quickly'"),
  geos: z.array(z.string()).describe("Geographic regions where this audience operates, e.g. 'US', 'California'"),
  segments: z.array(z.string()).describe("Sub-segments within this audience, e.g. 'Solo practitioners', 'Mid-size firms'"),
});

export const extractionSchema = z.object({
  name: z.string().describe("The company or brand name"),
  url: z.string().describe("The company website URL"),
  logoUrl: z.string().describe("URL to the company logo image, if mentioned"),
  tagline: z.string().describe("The company tagline or slogan"),
  mission: z.string().describe("The company mission statement"),
  valueProposition: z.string().describe("The core value proposition -- what unique value the company delivers"),
  industry: z.string().describe("The industry or market category, e.g. LegalTech, FinTech, Healthcare, SaaS"),
  geoFocus: z.array(z.string()).describe("Countries or regions where the brand operates, e.g. US, EU, Global"),
  voiceAttributes: z.array(z.string()).describe("Adjectives describing the brand voice, e.g. professional, bold, empathetic, clear"),
  readingLevel: z.string().describe("Target reading level for content, e.g. 'Grade 8-10' or '8th grade'"),
  topicPillars: z.array(z.string()).describe("Topics and themes the brand wants to be known for in AI engine responses"),
  targetAudiences: z.array(extractionAudienceSchema).describe("Ideal customer profiles or target audience segments"),
  terminologyDos: z.array(z.string()).describe("Preferred brand terms and phrases that should always be used"),
  terminologyDonts: z.array(z.string()).describe("Terms and phrases to avoid -- forbidden or off-brand language"),
  contentRules: z.array(z.string()).describe("Mandatory rules for all content, e.g. 'Never use passive voice in headlines', 'Avoid hype words'"),
  benefits: z.array(z.string()).describe("Key benefits and selling points of the product or service"),
  productFeatures: z.array(z.string()).describe("Key product features, capabilities, or services offered"),
  competitors: z.array(z.string()).describe("Names of competing companies or products in the same market"),
  differentiators: z.array(z.string()).describe("What makes this brand unique compared to competitors"),
  boilerplateAbout: z.string().describe("Standard 'About Us' paragraph for the company"),
  boilerplateDisclaimer: z.string().describe("Standard disclaimer or legal notice text, if any"),
});
