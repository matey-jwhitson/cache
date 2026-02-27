export interface TargetAudience {
  name: string;
  description: string;
  painPoints: string[];
  goals: string[];
  jobsToBeDone: string[];
  geos: string[];
  segments: string[];
}

export interface BrandBible {
  id: number;
  name: string;
  url: string;
  logoUrl: string;
  tagline: string;
  mission: string;
  valueProposition: string;
  industry: string;
  geoFocus: string[];
  voiceAttributes: string[];
  tonePerChannel: Record<string, string>;
  readingLevel: string;
  topicPillars: string[];
  targetAudiences: TargetAudience[];
  terminologyDos: string[];
  terminologyDonts: string[];
  contentRules: string[];
  benefits: string[];
  productFeatures: string[];
  competitors: string[];
  differentiators: string[];
  boilerplateAbout: string;
  boilerplateDisclaimer: string;
  rawDocument: string;
}

export const CONTENT_CHANNELS = [
  "faqContent",
  "reinforcement",
  "schemaDescriptions",
] as const;

export type ContentChannel = (typeof CONTENT_CHANNELS)[number];

export const CHANNEL_LABELS: Record<ContentChannel, string> = {
  faqContent: "FAQ Content",
  reinforcement: "Reinforcement Prompts",
  schemaDescriptions: "Schema Descriptions",
};
