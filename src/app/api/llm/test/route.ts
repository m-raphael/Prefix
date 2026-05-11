import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { llmComplete } from "@/lib/llm";
import { loadLLMConfig } from "@/lib/llm/config";

export async function GET() {
  try {
    await requireAuth();
    const config = loadLLMConfig();

    const response = await llmComplete({
      messages: [{ role: "user", content: "Reply with: OK" }],
      maxTokens: 16,
    });

    return NextResponse.json({
      status: "ok",
      provider: response.provider,
      model: response.model,
      configuredProvider: config.provider,
      fallback: config.fallbackProvider ?? null,
      response: response.content.trim(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ status: "error", error: message }, { status });
  }
}
