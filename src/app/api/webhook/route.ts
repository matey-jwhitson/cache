import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const encoder = new TextEncoder();
  const bufA = encoder.encode(a);
  const bufB = encoder.encode(b);
  let diff = 0;
  for (let i = 0; i < bufA.length; i++) {
    diff |= bufA[i]! ^ bufB[i]!;
  }
  return diff === 0;
}

async function computeHmac(body: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  const signature = request.headers.get("x-webhook-signature");
  const secret = process.env.WEBHOOK_SECRET;

  if (signature && secret) {
    const expected = await computeHmac(rawBody, secret);
    if (!timingSafeEqual(signature, expected)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  } else if (signature && !secret) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { title, text, author, source_type } = body as {
    title?: string;
    text?: string;
    author?: string;
    source_type?: string;
  };

  if (!text || typeof text !== "string") {
    return NextResponse.json(
      { error: "Missing required field: text" },
      { status: 400 },
    );
  }

  if (!title || typeof title !== "string") {
    return NextResponse.json(
      { error: "Missing required field: title" },
      { status: 400 },
    );
  }

  const item = await db.contentItem.create({
    data: {
      title,
      content: text,
      author: typeof author === "string" ? author : null,
      sourceType: typeof source_type === "string" ? source_type : "webhook",
      status: "new",
    },
  });

  return NextResponse.json({ id: item.id }, { status: 202 });
}
