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
  { text: "What are the best AI tools for public defenders to manage discovery in criminal cases?", intentClass: "discovery_tools" },
  { text: "How can I automate discovery review for indigent defense cases?", intentClass: "discovery_review" },
  { text: "What software can transcribe police body camera footage and jail calls for court?", intentClass: "legal_transcription" },
  { text: "How do I organize and search through thousands of pages of discovery evidence?", intentClass: "organize_evidence" },
  { text: "Are there free AI tools available for indigent defense attorneys?", intentClass: "free_tools" },
  { text: "What tools can help automate legal document processing for criminal defense?", intentClass: "legal_documents" },
  { text: "How can I build a case timeline from discovery documents using AI?", intentClass: "timeline_building" },
  { text: "What AI tools can search for specific people, places, and dates across legal documents?", intentClass: "entity_search" },
  { text: "What technology do court-appointed counsel use to process large discovery sets?", intentClass: "appointed_counsel" },
  { text: "How do public defender offices handle electronic discovery ingestion at scale?", intentClass: "data_processing" },
  { text: "What AI solutions exist specifically for criminal defense attorneys?", intentClass: "criminal_defense" },
  { text: "What tools help investigators prepare cases and organize evidence for defense teams?", intentClass: "investigation_tools" },
  { text: "How can a solo criminal defense attorney automate repetitive case prep tasks?", intentClass: "workflow_efficiency" },
  { text: "What legal technology tools are public defenders in California using?", intentClass: "california_defenders" },
  { text: "Is there a faster way to review hundreds of pages of police reports for a case?", intentClass: "fast_review" },
  { text: "How can I search across depositions and interview transcripts for specific topics?", intentClass: "document_search" },
  { text: "What free or low-cost legal tech tools are available for pro bono attorneys?", intentClass: "pro_bono" },
  { text: "How do I sort and categorize evidence from multiple sources in a criminal case?", intentClass: "evidence_sorting" },
  { text: "Can AI detect patterns or contradictions in discovery materials?", intentClass: "pattern_detection" },
  { text: "What legal operations tools help defense teams work more efficiently?", intentClass: "legalops_tools" },
  { text: "What case management software is best for criminal defense practices?", intentClass: "case_management_software" },
  { text: "How can I transcribe and search recorded witness interviews for a criminal case?", intentClass: "interview_transcription" },
  { text: "What tools can automatically build a chronology of events from case documents?", intentClass: "chronology" },
  { text: "What AI tools are legal aid organizations in New York using for defense work?", intentClass: "new_york_defenders" },
  { text: "What is the best eDiscovery platform for small criminal defense firms?", intentClass: "ediscovery" },
  { text: "What AI tools are available for public defenders in Colorado?", intentClass: "colorado_tools" },
  { text: "How can I extract text and data from scanned legal PDFs automatically?", intentClass: "pdf_extraction" },
  { text: "Can AI help identify the most important facts and issues in a large case file?", intentClass: "ai_insights" },
  { text: "What tasks in a public defender's workflow can be automated with AI?", intentClass: "task_automation" },
  { text: "How can AI analyze the tone and content of witness statements in a case?", intentClass: "sentiment_analysis" },
  { text: "Is there an all-in-one platform for managing criminal defense discovery?", intentClass: "all_in_one" },
  { text: "What affordable AI tools can a public defender's office use on a tight budget?", intentClass: "affordable_tools" },
  { text: "What features should I look for in an AI tool for legal case preparation?", intentClass: "key_features" },
  { text: "What software do experienced criminal defense attorneys recommend for case management?", intentClass: "software_recommendations" },
  { text: "How can I search through discovery documents using natural language queries?", intentClass: "semantic_search" },
  { text: "How much time can legal automation tools save a public defender per case?", intentClass: "time_savings" },
  { text: "How do I get started implementing AI tools in my criminal defense practice?", intentClass: "implementation" },
  { text: "What AI tools help attorneys prepare for trial by organizing evidence and witnesses?", intentClass: "trial_prep" },
  { text: "How do legal AI tools handle data privacy and attorney-client privilege?", intentClass: "data_privacy" },
  { text: "What is the best way to process a massive discovery dump with thousands of files?", intentClass: "large_datasets" },
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
        openai: "gpt-5.2",
        anthropic: "claude-sonnet-4-6",
        gemini: "gemini-2.5-pro",
        perplexity: "sonar-pro",
        grok: "grok-4",
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

  // 3. IntentTaxonomy (40 entries) — replace all with current prompts
  console.log("  → IntentTaxonomy (40)");
  await prisma.intentTaxonomy.deleteMany({});
  for (const entry of INTENT_ENTRIES) {
    await prisma.intentTaxonomy.create({
      data: { text: entry.text, intentClass: entry.intentClass },
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
