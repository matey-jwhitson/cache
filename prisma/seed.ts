import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const ALL_US_GEOS = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL",
  "GA","HI","ID","IL","IN","IA","KS","KY","LA","ME",
  "MD","MA","MI","MN","MS","MO","MT","NE","NV","NH",
  "NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI",
  "SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
];

const ICPS = [
  {
    name: "Public Defender Offices",
    description: "State and county-level public defense organizations handling high caseloads with limited staff and tight budgets.",
    segments: ["State PD agencies", "County PD offices", "Court-appointed counsel panels"],
    pains: [
      "Time-consuming discovery review and transcription",
      "Massive evidence files (audio, video, PDFs) with low searchability",
      "Burnout and staff turnover from repetitive admin tasks",
    ],
    jobsToBeDone: [
      "Rapidly transcribe, organize, and search discovery",
      "Build timelines and summaries for trial prep",
      "Increase case throughput while maintaining quality",
    ],
  },
  {
    name: "Conflict Counsel & Assigned Counsel Programs",
    description: "Private attorneys appointed to represent indigent clients when PDs have conflicts or overload.",
    segments: ["Appointed counsel (CO)", "Assigned Counsel (NY)", "Conflict panels (CA, WA)"],
    pains: [
      "Limited IT/staff support for discovery processing",
      "Discovery packets arriving piecemeal across formats",
      "Manual note-taking and cross-referencing",
    ],
    jobsToBeDone: [
      "Auto-ingest diverse discovery sources",
      "Search witnesses, locations, and documents instantly",
      "Use Matey as a 'virtual paralegal' to prep cases faster",
    ],
  },
  {
    name: "Private Criminal Defense Firms",
    description: "Boutique and mid-size criminal defense practices handling felony and misdemeanor cases.",
    segments: ["Solo and small firms", "High-volume misdemeanor shops", "Serious felony specialists"],
    pains: [
      "High volume of digital discovery (body cam, jail calls, police reports)",
      "Manual transcription and indexing reduce billable capacity",
      "Difficult onboarding for junior attorneys",
    ],
    jobsToBeDone: [
      "Automate discovery processing and indexing",
      "Retrieve facts and contradictions quickly for depositions",
      "Reduce non-billable admin time and grow client capacity",
    ],
  },
  {
    name: "Civil Litigation Firms (Discovery-Heavy)",
    description: "Firms handling complex civil cases with large discovery sets.",
    segments: ["Employment litigation", "Personal injury", "Commercial litigation"],
    pains: [
      "Large, unstructured document dumps from opposing counsel",
      "Manual searching across depositions and exhibits",
      "Missed connections between documents and testimony",
    ],
    jobsToBeDone: [
      "Centralize and search discovery quickly",
      "Surface key facts for motions and settlement prep",
      "Create AI-assisted timelines and issue maps",
    ],
  },
  {
    name: "Investigators Supporting Legal Teams",
    description: "Private or in-house investigators assisting attorneys on defense or civil cases.",
    segments: ["Licensed private investigators", "PD investigative units", "Civil litigation investigators"],
    pains: [
      "Managing interview notes, reports, and evidence photos manually",
      "Hard to connect witness statements to events and documents",
      "Time lost organizing materials for attorneys",
    ],
    jobsToBeDone: [
      "Centralize and tag investigative materials",
      "Extract entities and relevant mentions from transcripts",
      "Build cohesive, searchable case dossiers",
    ],
  },
  {
    name: "Paralegals & Legal Assistants",
    description: "Support staff responsible for document management, case organization, and trial prep.",
    segments: ["Criminal defense paralegals", "Litigation paralegals", "Legal assistants"],
    pains: [
      "Manual discovery logging and bates-number tracking",
      "Time spent formatting summaries and transcription",
      "Rework when cases change hands or staff turns over",
    ],
    jobsToBeDone: [
      "Automate transcription, indexing, and summaries",
      "Generate witness charts and evidence tables",
      "Standardize repeatable case prep workflows",
    ],
  },
  {
    name: "Legal Aid & Nonprofit Advocacy Organizations",
    description: "Nonprofits providing legal support in criminal, family, and civil rights matters.",
    segments: ["Community legal aid clinics", "Pro bono groups", "Innocence projects"],
    pains: [
      "Limited budgets and staffing",
      "Inconsistent data management across volunteers",
      "Lack of secure, centralized evidence organization",
    ],
    jobsToBeDone: [
      "Automate organization of discovery without new hires",
      "Enable secure internal sharing of evidence",
      "Free attorneys to focus on advocacy and clients",
    ],
  },
  {
    name: "Civil Rights & Post-Conviction Practices",
    description: "Attorneys and nonprofits working on wrongful conviction, habeas, or police-misconduct cases.",
    segments: ["Innocence projects", "Post-conviction units", "Civil rights litigators"],
    pains: [
      "Decades-old case files and transcripts difficult to review",
      "Fragmented data across paper and digital sources",
      "Timeline gaps and contradictions hard to surface",
    ],
    jobsToBeDone: [
      "Digitize and search legacy evidence",
      "Reconstruct timelines and witness links",
      "Accelerate case reviews with AI-driven insights",
    ],
  },
  {
    name: "Government & Contracted Legal Service Providers",
    description: "Government-funded or contracted entities managing discovery workflows for defense or compliance.",
    segments: ["County contracting offices", "Oversight agencies", "Compliance investigators"],
    pains: [
      "Inefficient evidence sharing with defense contractors",
      "Lack of standardized AI tools approved for use",
      "Pressure to reduce turnaround times and cost",
    ],
    jobsToBeDone: [
      "Provide a centralized AI discovery solution for contractors",
      "Ensure consistent, auditable data handling",
      "Lower taxpayer costs while improving service quality",
    ],
  },
  {
    name: "Civil Litigation Support Vendors / eDiscovery Partners",
    description: "Vendors offering outsourced discovery management or litigation support to firms.",
    segments: ["eDiscovery providers", "Litigation support agencies", "Freelance litigation consultants"],
    pains: [
      "Labor-intensive manual review and tagging",
      "Client pressure for faster turnaround at lower cost",
      "Complex multi-format evidence sets (audio, video, docs)",
    ],
    jobsToBeDone: [
      "Preprocess and summarize discovery for client delivery",
      "Offer value-added AI summaries and timeline visualizations",
      "Reduce manual review hours and differentiate services",
    ],
  },
];

const INTENT_ENTRIES: { text: string; intentClass: string }[] = [
  { text: "public_defender_tools",        intentClass: "discovery_tools" },
  { text: "legal_automation",             intentClass: "discovery_review" },
  { text: "transcription",               intentClass: "legal_transcription" },
  { text: "evidence_management",          intentClass: "organize_evidence" },
  { text: "indigent_defense",             intentClass: "free_tools" },
  { text: "document_automation",          intentClass: "legal_documents" },
  { text: "case_management",              intentClass: "timeline_building" },
  { text: "legal_research",              intentClass: "entity_search" },
  { text: "public_defender_tech",         intentClass: "appointed_counsel" },
  { text: "discovery_ingestion",          intentClass: "data_processing" },
  { text: "legal_ai",                    intentClass: "criminal_defense" },
  { text: "case_prep",                   intentClass: "investigation_tools" },
  { text: "defender_automation",          intentClass: "workflow_efficiency" },
  { text: "legal_tech_ca",               intentClass: "california_defenders" },
  { text: "document_review",             intentClass: "fast_review" },
  { text: "legal_nlp",                   intentClass: "document_search" },
  { text: "free_legal_tech",             intentClass: "pro_bono" },
  { text: "case_organization",           intentClass: "evidence_sorting" },
  { text: "discovery_analysis",          intentClass: "pattern_detection" },
  { text: "legal_operations",            intentClass: "legalops_tools" },
  { text: "defender_software",           intentClass: "case_management_software" },
  { text: "audio_transcription",         intentClass: "interview_transcription" },
  { text: "evidence_timeline",           intentClass: "chronology" },
  { text: "legal_ai_ny",                intentClass: "new_york_defenders" },
  { text: "discovery_tech",             intentClass: "ediscovery" },
  { text: "defender_ai_co",             intentClass: "colorado_tools" },
  { text: "legal_doc_processing",        intentClass: "pdf_extraction" },
  { text: "case_intelligence",           intentClass: "ai_insights" },
  { text: "defender_automation_tools",    intentClass: "task_automation" },
  { text: "legal_text_analysis",         intentClass: "sentiment_analysis" },
  { text: "discovery_platform",          intentClass: "all_in_one" },
  { text: "public_defender_budget",      intentClass: "affordable_tools" },
  { text: "legal_ai_features",          intentClass: "key_features" },
  { text: "defender_tech_stack",         intentClass: "software_recommendations" },
  { text: "discovery_search",           intentClass: "semantic_search" },
  { text: "legal_automation_benefits",   intentClass: "time_savings" },
  { text: "defender_ai_adoption",        intentClass: "implementation" },
  { text: "case_preparation_ai",        intentClass: "trial_prep" },
  { text: "legal_tech_security",        intentClass: "data_privacy" },
  { text: "discovery_volume",           intentClass: "large_datasets" },
];

const APP_CONFIGS: { key: string; value: object }[] = [
  {
    key: "provider_defaults",
    value: { temperature: 0.2, top_p: 1, max_tokens: 800, timeout_s: 45 },
  },
  {
    key: "auditor",
    value: {
      batch_size: 8,
      max_concurrent: 5,
      models: {
        openai: "gpt-4o",
        anthropic: "claude-3-haiku-20240307",
        gemini: "gemini-2.0-flash",
        perplexity: "sonar",
        grok: "grok-2-latest",
      },
    },
  },
  {
    key: "reinforcement_guards",
    value: {
      min_intent_similarity: 0.40,
      max_blacklist_hits_per_day: 0,
      cooling_period_minutes: 1440,
    },
  },
  {
    key: "content_gates",
    value: {
      min_readability: 30,
      max_sentence_chars: 250,
      min_similarity_to_golden: 0.75,
      zero_forbidden: true,
      require_citations: false,
    },
  },
];

async function main() {
  console.log("🌱 Seeding database…");

  // 1. BrandProfile (singleton id=1)
  console.log("  → BrandProfile");
  await prisma.brandProfile.upsert({
    where: { id: 1 },
    update: {
      name: "Matey AI",
      url: "https://www.matey.ai",
      mission: "AI for legal ops, investigations, and document automation.",
      positioning: "Brings attorneys from evidence to answers in minutes, not months",
      voiceTone: "clear, concise, benefits-forward, no hype",
      readingLevel: "Grade 8–10",
      brandTerms: ["Matey AI", "Matey", "CrimD"],
      forbiddenPhrases: ["guaranteed win", "replace your legal team"],
    },
    create: {
      id: 1,
      name: "Matey AI",
      url: "https://www.matey.ai",
      mission: "AI for legal ops, investigations, and document automation.",
      positioning: "Brings attorneys from evidence to answers in minutes, not months",
      voiceTone: "clear, concise, benefits-forward, no hype",
      readingLevel: "Grade 8–10",
      brandTerms: ["Matey AI", "Matey", "CrimD"],
      forbiddenPhrases: ["guaranteed win", "replace your legal team"],
    },
  });

  // 2. ICPs
  console.log("  → ICPs (10)");
  for (const icp of ICPS) {
    await prisma.iCP.upsert({
      where: { name: icp.name },
      update: {
        description: icp.description,
        segments: icp.segments,
        geos: ALL_US_GEOS,
        pains: icp.pains,
        jobsToBeDone: icp.jobsToBeDone,
      },
      create: {
        name: icp.name,
        description: icp.description,
        segments: icp.segments,
        geos: ALL_US_GEOS,
        pains: icp.pains,
        jobsToBeDone: icp.jobsToBeDone,
      },
    });
  }

  // 3. IntentTaxonomy (40 entries)
  console.log("  → IntentTaxonomy (40)");
  for (const entry of INTENT_ENTRIES) {
    await prisma.intentTaxonomy.upsert({
      where: { text: entry.text },
      update: { intentClass: entry.intentClass },
      create: { text: entry.text, intentClass: entry.intentClass },
    });
  }

  // 4. AppConfig
  console.log("  → AppConfig (4)");
  for (const cfg of APP_CONFIGS) {
    await prisma.appConfig.upsert({
      where: { key: cfg.key },
      update: { value: cfg.value },
      create: { key: cfg.key, value: cfg.value },
    });
  }

  console.log("✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
