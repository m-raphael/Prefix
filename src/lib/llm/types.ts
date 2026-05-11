export type LLMProvider =
  | "anthropic"
  | "openai-compatible"
  | "openrouter"
  | "groq"
  | "together"
  | "nvidia"
  | "xai"
  | "huggingface";

export interface LLMMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface LLMRequest {
  messages: LLMMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

export interface LLMResponse {
  content: string;
  provider: LLMProvider;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
}

export interface LLMAdapter {
  provider: LLMProvider;
  complete(req: LLMRequest): Promise<LLMResponse>;
}
