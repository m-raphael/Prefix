import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAgentAuth } from "@/lib/agent-auth";

const patchSchema = z.object({
  status: z.enum(["open", "in_review", "remediated", "closed", "risk_accepted"]).optional(),
  notes: z.string().max(2000).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { organizationId } = await requireAgentAuth(req);
    const { id } = await params;
    const body = patchSchema.parse(await req.json());

    const finding = await prisma.finding.findFirst({ where: { id, organizationId } });
    if (!finding) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await prisma.finding.update({
      where: { id },
      data: {
        ...(body.status ? { status: body.status } : {}),
        ...(body.notes !== undefined ? { notes: body.notes } : {}),
        ...(body.status === "remediated" ? { remediatedAt: new Date() } : {}),
        ...(body.status === "open" || body.status === "in_review" ? { remediatedAt: null } : {}),
      },
    });

    return NextResponse.json({ id: updated.id, status: updated.status, notes: updated.notes });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message === "Unauthorized" ? 401 : message.includes("not found") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
