import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";

const updateSchema = z.object({
  status: z.enum(["open", "in_review", "remediated", "closed", "risk_accepted"]).optional(),
  notes: z.string().optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireAuth();
    const { id } = await params;

    const finding = await prisma.finding.findFirst({
      where: { id, organizationId: ctx.organizationId },
    });

    if (!finding) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
    }

    const { status, notes } = parsed.data;

    // Role check: analysts cannot set closed or risk_accepted
    if (status && ["closed", "risk_accepted"].includes(status) && ctx.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: admin only status" }, { status: 403 });
    }

    const updateData: { status?: string; notes?: string; remediatedAt?: Date | null } = {};
    if (status) {
      updateData.status = status;
      if (status === "remediated") {
        updateData.remediatedAt = new Date();
      } else if (status === "open" || status === "in_review") {
        updateData.remediatedAt = null;
      }
    }
    if (notes !== undefined) updateData.notes = notes;

    const updated = await prisma.finding.update({
      where: { id },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        action: "status_update",
        entityType: "finding",
        entityId: id,
        changes: { from: finding.status, to: status, notes },
        userId: ctx.userId,
        findingId: id,
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
