import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ingestManual } from "@/lib/services/content/ingestion";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { text, title, author } = body as {
    text?: string;
    title?: string;
    author?: string;
  };

  if (!text || typeof text !== "string") {
    return NextResponse.json(
      { error: "Missing required field: text" },
      { status: 400 },
    );
  }

  const item = await ingestManual(
    text,
    typeof title === "string" ? title : undefined,
    typeof author === "string" ? author : undefined,
  );

  return NextResponse.json(item, { status: 200 });
}
