import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";

const bulkUpdateSchema = z.object({
  ids: z.array(z.string()).min(1),
  status: z.enum(["open", "in_review", "remediated", "closed", "risk_accepted"]),
  notes: z.string().optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    const ctx = await requireAuth();
    const body = await request.json();
    const parsed = bulkUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
    }

    const { ids, status, notes } = parsed.data;

    // Role check: analysts cannot set closed or risk_accepted
    if (["closed", "risk_accepted"].includes(status) && ctx.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: admin only status" }, { status: 403 });
    }

    const findings = await prisma.finding.findMany({
      where: { id: { in: ids }, organizationId: ctx.organizationId },
    });

    if (findings.length === 0) {
      return NextResponse.json({ error: "No findings found" }, { status: 404 });
    }

    const updateData: { status: string; remediatedAt?: Date | null; notes?: string } = {
      status,
      remediatedAt: status === "remediated" ? new Date() : status === "open" || status === "in_review" ? null : undefined,
    };
    if (notes !== undefined) updateData.notes = notes;

    const result = await prisma.finding.updateMany({
      where: { id: { in: ids }, organizationId: ctx.organizationId },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        action: "bulk_status_update",
        entityType: "finding",
        entityId: "bulk",
        changes: { ids, count: result.count, to: status, notes },
        userId: ctx.userId,
      },
    });

    return NextResponse.json({ updated: result.count });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
