import OpenAI from "openai";
import type { LLMAdapter, LLMProvider, LLMRequest, LLMResponse } from "../types";

interface OpenAICompatibleOptions {
  apiKey: string;
  baseUrl: string;
  model: string;
  provider: LLMProvider;
}

export function createOpenAICompatibleAdapter(opts: OpenAICompatibleOptions): LLMAdapter {
  const client = new OpenAI({ apiKey: opts.apiKey, baseURL: opts.baseUrl });

  return {
    provider: opts.provider,
    async complete(req: LLMRequest): Promise<LLMResponse> {
      const resolvedModel = req.model ?? opts.model;
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

      const systemMsg =
        req.systemPrompt ??
        req.messages.find((m) => m.role === "system")?.content;

      if (systemMsg) {
        messages.push({ role: "system", content: systemMsg });
      }

      for (const m of req.messages.filter((m) => m.role !== "system")) {
        messages.push({ role: m.role as "user" | "assistant", content: m.content });
      }

      const response = await client.chat.completions.create({
        model: resolvedModel,
        messages,
        max_tokens: req.maxTokens ?? 1024,
        temperature: req.temperature ?? 0.2,
      });

      return {
        content: response.choices[0]?.message?.content ?? "",
        provider: opts.provider,
        model: resolvedModel,
        inputTokens: response.usage?.prompt_tokens,
        outputTokens: response.usage?.completion_tokens,
      };
    },
  };
}
