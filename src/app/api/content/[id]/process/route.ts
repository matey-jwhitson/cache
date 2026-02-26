import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const item = await db.contentItem.findUnique({ where: { id } });
  if (!item) {
    return NextResponse.json({ error: "Content item not found" }, { status: 404 });
  }

  await db.contentItem.update({
    where: { id },
    data: { status: "processing" },
  });

  return NextResponse.json(
    { message: "Processing started", id: item.id },
    { status: 202 },
  );
}
