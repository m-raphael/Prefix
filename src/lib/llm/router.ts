import { loadLLMConfig, getProviderDefaults } from "./config";
import { createAnthropicAdapter } from "./providers/anthropic";
import { createOpenAICompatibleAdapter } from "./providers/openai-compatible";
import type { LLMAdapter, LLMProvider, LLMRequest, LLMResponse } from "./types";

function buildAdapter(provider: LLMProvider, config: ReturnType<typeof loadLLMConfig>): LLMAdapter {
  const defaults = getProviderDefaults(provider);

  switch (provider) {
    case "anthropic": {
      if (!config.anthropicApiKey) throw new Error("ANTHROPIC_API_KEY is required for provider=anthropic");
      return createAnthropicAdapter(config.anthropicApiKey, config.model);
    }

    case "openai-compatible": {
      const baseUrl = config.localLlmBaseUrl ?? config.openaiBaseUrl ?? defaults.baseUrl;
      const apiKey = config.localLlmApiKey ?? config.openaiApiKey ?? "ollama";
      const model = config.localLlmModel ?? config.openaiModel ?? config.model ?? defaults.defaultModel;
      return createOpenAICompatibleAdapter({ apiKey, baseUrl, model, provider });
    }

    case "openrouter": {
      if (!config.openrouterApiKey) throw new Error("OPENROUTER_API_KEY is required for provider=openrouter");
      return createOpenAICompatibleAdapter({
        apiKey: config.openrouterApiKey,
        baseUrl: defaults.baseUrl,
        model: config.model ?? defaults.defaultModel,
        provider,
      });
    }

    case "groq": {
      if (!config.groqApiKey) throw new Error("GROQ_API_KEY is required for provider=groq");
      return createOpenAICompatibleAdapter({
        apiKey: config.groqApiKey,
        baseUrl: defaults.baseUrl,
        model: config.model ?? defaults.defaultModel,
        provider,
      });
    }

    case "together": {
      if (!config.togetherApiKey) throw new Error("TOGETHER_API_KEY is required for provider=together");
      return createOpenAICompatibleAdapter({
        apiKey: config.togetherApiKey,
        baseUrl: defaults.baseUrl,
        model: config.model ?? defaults.defaultModel,
        provider,
      });
    }

    case "nvidia": {
      if (!config.nvidiaApiKey) throw new Error("NVIDIA_API_KEY is required for provider=nvidia");
      const baseUrl = config.nvidiaNimApiBase ?? defaults.baseUrl;
      return createOpenAICompatibleAdapter({
        apiKey: config.nvidiaApiKey,
        baseUrl,
        model: config.model ?? defaults.defaultModel,
        provider,
      });
    }

    case "xai": {
      if (!config.xaiApiKey) throw new Error("XAI_API_KEY is required for provider=xai");
      return createOpenAICompatibleAdapter({
        apiKey: config.xaiApiKey,
        baseUrl: defaults.baseUrl,
        model: config.model ?? defaults.defaultModel,
        provider,
      });
    }

    case "huggingface": {
      if (!config.huggingfaceApiKey) throw new Error("HUGGINGFACE_API_KEY is required for provider=huggingface");
      return createOpenAICompatibleAdapter({
        apiKey: config.huggingfaceApiKey,
        baseUrl: defaults.baseUrl,
        model: config.model ?? defaults.defaultModel,
        provider,
      });
    }

    default:
      throw new Error(`Unknown LLM provider: ${provider}`);
  }
}

export async function llmComplete(req: LLMRequest): Promise<LLMResponse> {
  const config = loadLLMConfig();

  try {
    const adapter = buildAdapter(config.provider, config);
    return await adapter.complete(req);
  } catch (primaryErr) {
    if (config.fallbackProvider) {
      const fallbackConfig = { ...config, provider: config.fallbackProvider, model: config.fallbackModel ?? config.model };
      const fallback = buildAdapter(config.fallbackProvider, fallbackConfig);
      return await fallback.complete(req);
    }
    throw primaryErr;
  }
}
