import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("openai", () => {
  class MockOpenAI {
    chat = { completions: { create: vi.fn() } };
  }
  return { default: MockOpenAI };
});

vi.mock("@anthropic-ai/sdk", () => {
  class MockAnthropic {
    messages = { create: vi.fn() };
  }
  return { default: MockAnthropic };
});

vi.mock("@google/generative-ai", () => {
  class MockGoogleGenerativeAI {
    getGenerativeModel() {
      return { generateContent: vi.fn() };
    }
  }
  return { GoogleGenerativeAI: MockGoogleGenerativeAI };
});

describe("getProvider", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.OPENAI_API_KEY = "test-openai-key";
    process.env.ANTHROPIC_API_KEY = "test-anthropic-key";
    process.env.GEMINI_API_KEY = "test-gemini-key";
    process.env.PPLX_API_KEY = "test-pplx-key";
    process.env.XAI_API_KEY = "test-xai-key";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns an OpenAI provider instance", async () => {
    const { getProvider } = await import("@/lib/providers");
    const provider = getProvider("openai");
    expect(provider).toBeDefined();
    expect(provider.name).toBe("openai");
  });

  it("returns an Anthropic provider instance", async () => {
    const { getProvider } = await import("@/lib/providers");
    const provider = getProvider("anthropic");
    expect(provider).toBeDefined();
    expect(provider.name).toBe("anthropic");
  });

  it("returns a Gemini provider instance", async () => {
    const { getProvider } = await import("@/lib/providers");
    const provider = getProvider("gemini");
    expect(provider).toBeDefined();
    expect(provider.name).toBe("gemini");
  });

  it("returns a Perplexity provider instance", async () => {
    const { getProvider } = await import("@/lib/providers");
    const provider = getProvider("perplexity");
    expect(provider).toBeDefined();
    expect(provider.name).toBe("perplexity");
  });

  it("returns a Grok provider instance", async () => {
    const { getProvider } = await import("@/lib/providers");
    const provider = getProvider("grok");
    expect(provider).toBeDefined();
    expect(provider.name).toBe("grok");
  });

  it("throws for unknown provider", async () => {
    const { getProvider } = await import("@/lib/providers");
    expect(() => getProvider("unknown")).toThrow("Unknown provider: unknown");
  });

  it("throws when env var is missing", async () => {
    delete process.env.OPENAI_API_KEY;
    const { getProvider } = await import("@/lib/providers");
    expect(() => getProvider("openai")).toThrow("Missing env var");
  });
});

describe("getAvailableProviders", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns only providers whose env vars are set", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    process.env.ANTHROPIC_API_KEY = "test-key";
    delete process.env.GEMINI_API_KEY;
    delete process.env.PPLX_API_KEY;
    delete process.env.XAI_API_KEY;

    const { getAvailableProviders } = await import("@/lib/providers");
    const providers = getAvailableProviders();
    const names = providers.map((p) => p.name);
    expect(names).toContain("openai");
    expect(names).toContain("anthropic");
    expect(names).not.toContain("gemini");
    expect(names).not.toContain("perplexity");
    expect(names).not.toContain("grok");
  });

  it("returns empty array when no env vars set", async () => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.PPLX_API_KEY;
    delete process.env.XAI_API_KEY;

    const { getAvailableProviders } = await import("@/lib/providers");
    const providers = getAvailableProviders();
    expect(providers).toHaveLength(0);
  });
});
