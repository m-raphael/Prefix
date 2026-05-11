import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { parseAny } from "@/lib/parsers";
import { isInternetFacing } from "@/lib/ip";
import { reScoreOrg } from "@/lib/score";

export async function POST(request: Request) {
  try {
    const ctx = await requireAuth();

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const content = await file.text();
    const { rows, errors, format } = parseAny(file.name, content);

    if (errors.length > 0 && rows.length === 0) {
      return NextResponse.json({ error: errors[0].message, details: errors }, { status: 400 });
    }

    let assetsCreated = 0, assetsUpdated = 0;
    let vulnsCreated = 0, vulnsUpdated = 0;
    let findingsCreated = 0, findingsUpdated = 0;

    for (const row of rows) {
      const internetFacing = isInternetFacing(row.ip);

      const asset = await prisma.asset.upsert({
        where: { hostname_organizationId: { hostname: row.hostname, organizationId: ctx.organizationId } },
        update: { ip: row.ip || null, port: row.port || null, protocol: row.protocol || null, service: row.service || null, internetFacing },
        create: { hostname: row.hostname, ip: row.ip || null, port: row.port || null, protocol: row.protocol || null, service: row.service || null, internetFacing, organizationId: ctx.organizationId },
      });
      asset.createdAt.getTime() === asset.updatedAt.getTime() ? assetsCreated++ : assetsUpdated++;

      const vuln = await prisma.vulnerability.upsert({
        where: { cve_organizationId: { cve: row.cve.toUpperCase(), organizationId: ctx.organizationId } },
        update: { cvss: row.cvss ?? null },
        create: { cve: row.cve.toUpperCase(), cvss: row.cvss ?? null, organizationId: ctx.organizationId },
      });
      vuln.createdAt.getTime() === vuln.updatedAt.getTime() ? vulnsCreated++ : vulnsUpdated++;

      const existing = await prisma.finding.findUnique({
        where: { assetId_vulnerabilityId: { assetId: asset.id, vulnerabilityId: vuln.id } },
      });
      if (existing) {
        await prisma.finding.update({ where: { id: existing.id }, data: { updatedAt: new Date() } });
        findingsUpdated++;
      } else {
        await prisma.finding.create({ data: { assetId: asset.id, vulnerabilityId: vuln.id, organizationId: ctx.organizationId } });
        findingsCreated++;
      }
    }

    const scoreResult = await reScoreOrg(ctx.organizationId);

    await prisma.auditLog.create({
      data: {
        action: "ingest",
        entityType: "finding",
        entityId: "bulk",
        changes: { format, rowsProcessed: rows.length, assetsCreated, assetsUpdated, vulnsCreated, vulnsUpdated, findingsCreated, findingsUpdated, parseErrors: errors.length, ...scoreResult },
        userId: ctx.userId,
      },
    });

    return NextResponse.json({ format, rowsProcessed: rows.length, assetsCreated, assetsUpdated, vulnsCreated, vulnsUpdated, findingsCreated, findingsUpdated, parseErrors: errors.length, errorDetails: errors.slice(0, 10) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
