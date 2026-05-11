import type { LLMProvider } from "./types";

export interface LLMConfig {
  provider: LLMProvider;
  model: string;
  fallbackProvider?: LLMProvider;
  fallbackModel?: string;
  anthropicApiKey?: string;
  openaiApiKey?: string;
  openaiBaseUrl?: string;
  openaiModel?: string;
  openrouterApiKey?: string;
  groqApiKey?: string;
  togetherApiKey?: string;
  xaiApiKey?: string;
  huggingfaceApiKey?: string;
  nvidiaApiKey?: string;
  nvidiaNimApiBase?: string;
  localLlmBaseUrl?: string;
  localLlmApiKey?: string;
  localLlmModel?: string;
}

const PROVIDER_DEFAULTS: Record<LLMProvider, { baseUrl: string; defaultModel: string }> = {
  anthropic: {
    baseUrl: "https://api.anthropic.com",
    defaultModel: "claude-sonnet-4-6",
  },
  "openai-compatible": {
    baseUrl: "http://localhost:11434/v1",
    defaultModel: "llama3.2",
  },
  openrouter: {
    baseUrl: "https://openrouter.ai/api/v1",
    defaultModel: "meta-llama/llama-3.1-8b-instruct:free",
  },
  groq: {
    baseUrl: "https://api.groq.com/openai/v1",
    defaultModel: "llama-3.1-70b-versatile",
  },
  together: {
    baseUrl: "https://api.together.xyz/v1",
    defaultModel: "meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo",
  },
  nvidia: {
    baseUrl: "https://integrate.api.nvidia.com/v1",
    defaultModel: "meta/llama-3.1-70b-instruct",
  },
  xai: {
    baseUrl: "https://api.x.ai/v1",
    defaultModel: "grok-beta",
  },
  huggingface: {
    baseUrl: "https://api-inference.huggingface.co/v1",
    defaultModel: "mistralai/Mistral-7B-Instruct-v0.3",
  },
};

export function getProviderDefaults(provider: LLMProvider) {
  return PROVIDER_DEFAULTS[provider];
}

export function loadLLMConfig(): LLMConfig {
  const provider = (process.env.LLM_PROVIDER ?? "nvidia") as LLMProvider;
  const model = process.env.LLM_MODEL ?? PROVIDER_DEFAULTS[provider]?.defaultModel ?? "";

  return {
    provider,
    model,
    fallbackProvider: process.env.LLM_FALLBACK_PROVIDER as LLMProvider | undefined,
    fallbackModel: process.env.LLM_FALLBACK_MODEL,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    openaiApiKey: process.env.OPENAI_API_KEY,
    openaiBaseUrl: process.env.OPENAI_BASE_URL,
    openaiModel: process.env.OPENAI_MODEL,
    openrouterApiKey: process.env.OPENROUTER_API_KEY,
    groqApiKey: process.env.GROQ_API_KEY,
    togetherApiKey: process.env.TOGETHER_API_KEY,
    xaiApiKey: process.env.XAI_API_KEY,
    huggingfaceApiKey: process.env.HUGGINGFACE_API_KEY,
    nvidiaApiKey: process.env.NVIDIA_API_KEY,
    nvidiaNimApiBase: process.env.NVIDIA_NIM_API_BASE,
    localLlmBaseUrl: process.env.LOCAL_LLM_BASE_URL,
    localLlmApiKey: process.env.LOCAL_LLM_API_KEY,
    localLlmModel: process.env.LOCAL_LLM_MODEL,
  };
}
