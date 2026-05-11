import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAgentAuth } from "@/lib/agent-auth";

export async function GET(req: NextRequest) {
  try {
    const { organizationId } = await requireAgentAuth(req);
    const { searchParams } = req.nextUrl;

    const priority = searchParams.get("priority") ?? undefined;
    const status = searchParams.get("status") ?? undefined;
    const kevOnly = searchParams.get("kev") === "true";
    const take = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);
    const skip = parseInt(searchParams.get("offset") ?? "0", 10);

    const findings = await prisma.finding.findMany({
      where: {
        organizationId,
        ...(priority ? { priority } : {}),
        ...(status ? { status } : {}),
        ...(kevOnly ? { vulnerability: { kevFlag: true } } : {}),
      },
      include: {
        asset: { select: { hostname: true, ip: true, service: true, internetFacing: true } },
        vulnerability: {
          select: {
            cve: true, cvss: true, kevFlag: true, fixedVersion: true,
            aiSummary: true, aiRemediation: true,
          },
        },
      },
      orderBy: [{ priority: "asc" }, { vulnerability: { cvss: "desc" } }],
      take,
      skip,
    });

    const total = await prisma.finding.count({
      where: {
        organizationId,
        ...(priority ? { priority } : {}),
        ...(status ? { status } : {}),
        ...(kevOnly ? { vulnerability: { kevFlag: true } } : {}),
      },
    });

    return NextResponse.json({ total, offset: skip, limit: take, findings });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message === "Unauthorized" ? 401 : message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
