import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAvailableProviders, type LLMRequest, LLM_DEFAULTS } from "@/lib/providers";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const testProviders = url.searchParams.get("test") === "providers";
  const checks: Record<string, unknown> = {};

  checks.env = {
    AUTH_SECRET: !!process.env.AUTH_SECRET,
    NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    AUTH_URL: process.env.AUTH_URL,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID
      ? `${process.env.GOOGLE_CLIENT_ID.substring(0, 12)}...`
      : "MISSING",
    GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
    DATABASE_URL: process.env.DATABASE_URL
      ? `${process.env.DATABASE_URL.substring(0, 30)}...`
      : "MISSING",
    INNGEST_EVENT_KEY: !!process.env.INNGEST_EVENT_KEY,
    INNGEST_SIGNING_KEY: !!process.env.INNGEST_SIGNING_KEY,
    OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
    ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
    GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
    PPLX_API_KEY: !!process.env.PPLX_API_KEY,
    XAI_API_KEY: !!process.env.XAI_API_KEY,
  };

  try {
    const userCount = await db.user.count();
    checks.database = { connected: true, userCount };
  } catch (e) {
    checks.database = {
      connected: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }

  try {
    const accountCount = await db.account.count();
    checks.accounts = { count: accountCount };
  } catch (e) {
    checks.accounts = {
      error: e instanceof Error ? e.message : String(e),
    };
  }

  try {
    const recentJobs = await db.jobRun.findMany({
      take: 5,
      orderBy: { startedAt: "desc" },
    });
    checks.recentJobs = recentJobs.map((j) => ({
      id: j.id,
      type: j.jobType,
      status: j.status,
      startedAt: j.startedAt.toISOString(),
      durationSeconds: j.durationSeconds,
      error: j.errorMessage,
    }));
  } catch (e) {
    checks.recentJobs = {
      error: e instanceof Error ? e.message : String(e),
    };
  }

  try {
    const recentRuns = await db.auditRun.findMany({
      take: 8,
      orderBy: { startedAt: "desc" },
    });
    checks.recentAuditRuns = recentRuns.map((r) => ({
      id: r.id,
      provider: r.provider,
      model: r.model,
      totalPrompts: r.totalPrompts,
      successful: r.successful,
      failed: r.failed,
      startedAt: r.startedAt.toISOString(),
      completedAt: r.completedAt?.toISOString() ?? null,
    }));
  } catch (e) {
    checks.recentAuditRuns = {
      error: e instanceof Error ? e.message : String(e),
    };
  }

  try {
    const recentResults = await db.auditResult.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, promptId: true, provider: true, createdAt: true },
    });
    const promptIds = recentResults.map((r) => r.promptId);
    const matchingIntents = await db.intentTaxonomy.findMany({
      where: { id: { in: promptIds } },
      select: { id: true, text: true },
    });
    const intentCount = await db.intentTaxonomy.count();
    checks.promptIdCheck = {
      recentResults: recentResults.map((r) => ({
        id: r.id,
        promptId: r.promptId,
        provider: r.provider,
        createdAt: r.createdAt.toISOString(),
      })),
      matchingIntents: matchingIntents.map((i) => ({
        id: i.id,
        text: i.text.substring(0, 60),
      })),
      totalIntentsInDb: intentCount,
      allMatched: recentResults.every((r) =>
        matchingIntents.some((i) => i.id === r.promptId),
      ),
    };
  } catch (e) {
    checks.promptIdCheck = {
      error: e instanceof Error ? e.message : String(e),
    };
  }

  if (testProviders) {
    const providers = getAvailableProviders();
    const testReq: LLMRequest = {
      messages: [{ role: "user", content: "Say hello in one word." }],
      model: "",
      temperature: LLM_DEFAULTS.temperature,
      maxTokens: 20,
      timeoutMs: 10_000,
    };

    const settled = await Promise.allSettled(
      providers.map(async (p) => {
        const resp = await p.chat({ ...testReq, model: p.defaultModel });
        return {
          name: p.name,
          model: p.defaultModel,
          ok: !resp.error,
          text: resp.text?.substring(0, 100),
          error: resp.error ?? null,
          latencyMs: Math.round(resp.latencyMs),
        };
      }),
    );

    const testResults: Record<string, unknown> = {};
    for (let i = 0; i < providers.length; i++) {
      const r = settled[i];
      if (r.status === "fulfilled") {
        testResults[r.value.name] = r.value;
      } else {
        testResults[providers[i].name] = {
          model: providers[i].defaultModel,
          ok: false,
          error: r.reason instanceof Error ? r.reason.message : String(r.reason),
        };
      }
    }
    checks.providerTest = testResults;
  }

  return NextResponse.json(checks, { status: 200 });
}
