import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
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
      error: j.errorMessage,
    }));
  } catch (e) {
    checks.recentJobs = {
      error: e instanceof Error ? e.message : String(e),
    };
  }

  return NextResponse.json(checks, { status: 200 });
}
