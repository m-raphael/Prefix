import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { parseCsv } from "@/lib/csv";

export async function POST(request: Request) {
  try {
    const ctx = await requireAuth();

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const text = await file.text();
    const { rows, errors } = parseCsv(text);

    if (errors.length > 0 && rows.length === 0) {
      return NextResponse.json({ error: "CSV parse failed", details: errors }, { status: 400 });
    }

    let assetsCreated = 0;
    let assetsUpdated = 0;
    let vulnsCreated = 0;
    let vulnsUpdated = 0;
    let findingsCreated = 0;
    let findingsUpdated = 0;

    for (const row of rows) {
      const asset = await prisma.asset.upsert({
        where: { hostname_organizationId: { hostname: row.hostname, organizationId: ctx.organizationId } },
        update: {
          ip: row.ip || null,
          port: row.port || null,
          protocol: row.protocol || null,
          service: row.service || null,
        },
        create: {
          hostname: row.hostname,
          ip: row.ip || null,
          port: row.port || null,
          protocol: row.protocol || null,
          service: row.service || null,
          organizationId: ctx.organizationId,
        },
      });

      if (asset.createdAt.getTime() === asset.updatedAt.getTime()) {
        assetsCreated++;
      } else {
        assetsUpdated++;
      }

      const vuln = await prisma.vulnerability.upsert({
        where: { cve_organizationId: { cve: row.cve.toUpperCase(), organizationId: ctx.organizationId } },
        update: {
          cvss: row.cvss ?? null,
        },
        create: {
          cve: row.cve.toUpperCase(),
          cvss: row.cvss ?? null,
          organizationId: ctx.organizationId,
        },
      });

      if (vuln.createdAt.getTime() === vuln.updatedAt.getTime()) {
        vulnsCreated++;
      } else {
        vulnsUpdated++;
      }

      const existingFinding = await prisma.finding.findUnique({
        where: { assetId_vulnerabilityId: { assetId: asset.id, vulnerabilityId: vuln.id } },
      });

      if (existingFinding) {
        await prisma.finding.update({
          where: { id: existingFinding.id },
          data: { updatedAt: new Date() },
        });
        findingsUpdated++;
      } else {
        await prisma.finding.create({
          data: {
            assetId: asset.id,
            vulnerabilityId: vuln.id,
            organizationId: ctx.organizationId,
          },
        });
        findingsCreated++;
      }
    }

    await prisma.auditLog.create({
      data: {
        action: "csv_ingest",
        entityType: "finding",
        entityId: "bulk",
        changes: { assetsCreated, assetsUpdated, vulnsCreated, vulnsUpdated, findingsCreated, findingsUpdated, parseErrors: errors.length },
        userId: ctx.userId,
      },
    });

    return NextResponse.json({
      rowsProcessed: rows.length,
      assetsCreated,
      assetsUpdated,
      vulnsCreated,
      vulnsUpdated,
      findingsCreated,
      findingsUpdated,
      parseErrors: errors.length,
      errorDetails: errors.slice(0, 10),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
