import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const ctx = await requireAuth();
    const searchParams = request.nextUrl.searchParams;

    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "25", 10)));
    const skip = (page - 1) * limit;

    const priorities = searchParams.getAll("priority");
    const statuses = searchParams.getAll("status");
    const kev = searchParams.get("kev");
    const asset = searchParams.get("asset");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const sortBy = searchParams.get("sortBy") ?? "discoveredAt";
    const sortOrder = searchParams.get("sortOrder") ?? "desc";

    const where: Prisma.FindingWhereInput = { organizationId: ctx.organizationId };

    if (priorities.length > 0) {
      where.priority = { in: priorities };
    }
    if (statuses.length > 0) {
      where.status = { in: statuses };
    }
    if (kev === "true" || kev === "false") {
      where.vulnerability = { kevFlag: kev === "true" };
    }
    if (asset) {
      where.asset = { hostname: { contains: asset, mode: "insensitive" } };
    }
    if (from || to) {
      where.discoveredAt = {};
      if (from) where.discoveredAt.gte = new Date(from);
      if (to) where.discoveredAt.lte = new Date(to);
    }

    const validSortFields = ["discoveredAt", "priority", "status", "createdAt", "updatedAt"];
    const orderBy: Prisma.FindingOrderByWithRelationInput = {};
    if (validSortFields.includes(sortBy)) {
      orderBy[sortBy as keyof Prisma.FindingOrderByWithRelationInput] = sortOrder === "asc" ? "asc" : "desc";
    } else {
      orderBy.discoveredAt = "desc";
    }

    const [findings, total] = await Promise.all([
      prisma.finding.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          asset: { select: { hostname: true, ip: true, port: true, service: true, internetFacing: true } },
          vulnerability: { select: { cve: true, cvss: true, description: true, kevFlag: true, kevDateAdded: true, fixedVersion: true } },
        },
      }),
      prisma.finding.count({ where }),
    ]);

    return NextResponse.json({
      findings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
