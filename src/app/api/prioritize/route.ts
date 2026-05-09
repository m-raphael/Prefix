import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { reScoreOrg } from "@/lib/score";

export async function POST() {
  try {
    const ctx = await requireAuth();

    const result = await reScoreOrg(ctx.organizationId);

    await prisma.auditLog.create({
      data: {
        action: "prioritize",
        entityType: "finding",
        entityId: "bulk",
        changes: result,
        userId: ctx.userId,
      },
    });

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
