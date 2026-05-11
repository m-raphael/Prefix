import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { explainCve } from "@/lib/ai-explain";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ cve: string }> }
) {
  try {
    const ctx = await requireAuth();
    const { cve } = await params;
    const body = await req.json().catch(() => ({}));

    const result = await explainCve(cve, ctx.organizationId, {
      hostname: body.hostname,
      service: body.service,
      fixedVersion: body.fixedVersion,
    });

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
