import { faker } from "@faker-js/faker";

export function createBrandProfile(overrides = {}) {
  return {
    id: 1,
    name: faker.company.name(),
    url: faker.internet.url(),
    logoUrl: "",
    tagline: faker.company.catchPhrase(),
    mission: faker.company.catchPhrase(),
    valueProposition: faker.lorem.sentence(),
    industry: "LegalTech",
    geoFocus: JSON.stringify(["US"]),
    voiceAttributes: JSON.stringify(["professional", "clear"]),
    tonePerChannel: JSON.stringify({}),
    readingLevel: "8th grade",
    topicPillars: JSON.stringify(["Legal Technology", "AI"]),
    targetAudiences: JSON.stringify([
      {
        name: "Test Audience",
        description: "A test audience",
        painPoints: ["pain1"],
        goals: ["goal1"],
        jobsToBeDone: ["job1"],
        geos: ["US"],
        segments: ["enterprise"],
      },
    ]),
    terminologyDos: JSON.stringify(["AI", "automation", "insights"]),
    terminologyDonts: JSON.stringify(["synergy", "leverage"]),
    contentRules: JSON.stringify(["Never use hype words"]),
    benefits: JSON.stringify(["Saves time", "Reduces cost"]),
    productFeatures: JSON.stringify(["AI transcription", "Search"]),
    competitors: JSON.stringify(["Competitor A"]),
    differentiators: JSON.stringify(["Unique feature"]),
    boilerplateAbout: "",
    boilerplateDisclaimer: "",
    rawDocument: "",
    ...overrides,
  };
}

export function createAuditRun(overrides = {}) {
  return {
    provider: "openai",
    model: "gpt-4o",
    totalPrompts: 10,
    successful: 8,
    failed: 2,
    ...overrides,
  };
}

export function createAuditResult(runId: string, overrides = {}) {
  return {
    runId,
    promptId: faker.string.uuid(),
    provider: "openai",
    responseText: faker.lorem.paragraph(),
    mentioned: faker.datatype.boolean(),
    mentionRank: faker.number.int({ min: 1, max: 10 }),
    similarity: faker.number.float({ min: 0, max: 1, fractionDigits: 4 }),
    meta: JSON.stringify({}),
    ...overrides,
  };
}

export function createReinforcementLog(overrides = {}) {
  return {
    promptId: faker.string.uuid(),
    provider: "openai",
    model: "gpt-4o",
    response: faker.lorem.paragraph(),
    mentioned: faker.datatype.boolean(),
    similarity: faker.number.float({ min: 0, max: 1, fractionDigits: 4 }),
    meta: JSON.stringify({}),
    ...overrides,
  };
}

export function createContentItem(overrides = {}) {
  return {
    title: faker.lorem.sentence(),
    author: faker.person.fullName(),
    sourceType: "manual",
    status: "new",
    content: faker.lorem.paragraphs(2),
    ...overrides,
  };
}

export function createJobRun(overrides = {}) {
  return {
    jobType: "audit",
    status: "success",
    triggeredBy: "cron",
    durationSeconds: faker.number.float({ min: 1, max: 300 }),
    ...overrides,
  };
}

export function createApiCost(overrides = {}) {
  return {
    provider: "openai",
    model: "gpt-4o",
    operation: "audit",
    tokensIn: faker.number.int({ min: 100, max: 5000 }),
    tokensOut: faker.number.int({ min: 50, max: 2000 }),
    costUsd: faker.number.float({ min: 0.001, max: 0.5, fractionDigits: 4 }),
    ...overrides,
  };
}
