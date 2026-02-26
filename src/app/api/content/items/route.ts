import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? undefined;
  const limit = Math.min(
    Math.max(parseInt(searchParams.get("limit") ?? "50", 10) || 50, 1),
    200,
  );

  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const [count, items] = await Promise.all([
    db.contentItem.count({ where }),
    db.contentItem.findMany({
      where,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({ count, items });
}
