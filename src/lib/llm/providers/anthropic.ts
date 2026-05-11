import Anthropic from "@anthropic-ai/sdk";
import type { LLMAdapter, LLMRequest, LLMResponse } from "../types";

export function createAnthropicAdapter(apiKey: string, model: string): LLMAdapter {
  const client = new Anthropic({ apiKey });

  return {
    provider: "anthropic",
    async complete(req: LLMRequest): Promise<LLMResponse> {
      const resolvedModel = req.model ?? model;
      const messages = req.messages
        .filter((m) => m.role !== "system")
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

      const systemMsg =
        req.systemPrompt ??
        req.messages.find((m) => m.role === "system")?.content;

      const response = await client.messages.create({
        model: resolvedModel,
        max_tokens: req.maxTokens ?? 1024,
        ...(systemMsg ? { system: systemMsg } : {}),
        messages,
      });

      const block = response.content[0];
      const text = block.type === "text" ? block.text : "";

      return {
        content: text,
        provider: "anthropic",
        model: resolvedModel,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      };
    },
  };
}
