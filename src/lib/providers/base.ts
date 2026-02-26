import type { LLMRequest, LLMResponse } from "./types";

export interface Provider {
  readonly name: string;
  readonly defaultModel: string;
  chat(req: LLMRequest): Promise<LLMResponse>;
}
