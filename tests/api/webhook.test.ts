import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db", () => ({
  db: {
    contentItem: {
      create: vi.fn(),
    },
  },
}));

import { db } from "@/lib/db";
import { POST } from "@/app/api/webhook/route";

function buildRequest(body: unknown, headers?: Record<string, string>): NextRequest {
  const init: RequestInit & { headers?: Record<string, string> } = {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: {
      "content-type": "application/json",
      ...headers,
    },
  };
  return new NextRequest("http://localhost:3000/api/webhook", init);
}

describe("POST /api/webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.WEBHOOK_SECRET;
    vi.mocked(db.contentItem.create).mockResolvedValue({
      id: "test-id-123",
      title: "Test",
      content: "Body",
      author: null,
      sourceType: "webhook",
      status: "new",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
  });

  it("returns 202 for valid payload", async () => {
    const req = buildRequest({ title: "Test Article", text: "Content body" });
    const res = await POST(req);
    expect(res.status).toBe(202);
    const json = await res.json();
    expect(json.id).toBe("test-id-123");
  });

  it("stores author and source_type when provided", async () => {
    const req = buildRequest({
      title: "Test",
      text: "Content",
      author: "Jane",
      source_type: "rss",
    });
    await POST(req);
    expect(db.contentItem.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        author: "Jane",
        sourceType: "rss",
      }),
    });
  });

  it("returns 400 when text is missing", async () => {
    const req = buildRequest({ title: "Test" });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("text");
  });

  it("returns 400 when title is missing", async () => {
    const req = buildRequest({ text: "Body content" });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("title");
  });

  it("returns 400 for invalid JSON", async () => {
    const req = buildRequest("not valid json {{{");
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when text is not a string", async () => {
    const req = buildRequest({ title: "Test", text: 123 });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("defaults sourceType to 'webhook' when not provided", async () => {
    const req = buildRequest({ title: "Test", text: "Content" });
    await POST(req);
    expect(db.contentItem.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        sourceType: "webhook",
      }),
    });
  });
});
