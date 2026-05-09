import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { fetchKevFeed, parseKevDate } from "@/lib/kev";

export async function POST() {
  try {
    const ctx = await requireAdmin();

    const feed = await fetchKevFeed();

    let inserted = 0;
    let updated = 0;

    for (const item of feed.vulnerabilities) {
      const cve = item.cveID.trim();
      if (!cve) continue;

      const existing = await prisma.vulnerability.findUnique({
        where: { cve_organizationId: { cve, organizationId: ctx.organizationId } },
      });

      const kevDate = parseKevDate(item.dateAdded);
      const description = item.shortDescription || item.vulnerabilityName || "";

      if (existing) {
        if (!existing.kevFlag || existing.description !== description || existing.kevDateAdded?.toISOString() !== kevDate?.toISOString()) {
          await prisma.vulnerability.update({
            where: { id: existing.id },
            data: {
              kevFlag: true,
              kevDateAdded: kevDate,
              description,
            },
          });
          updated++;
        }
      } else {
        await prisma.vulnerability.create({
          data: {
            cve,
            description,
            kevFlag: true,
            kevDateAdded: kevDate,
            organizationId: ctx.organizationId,
          },
        });
        inserted++;
      }
    }

    await prisma.auditLog.create({
      data: {
        action: "kev_sync",
        entityType: "vulnerability",
        entityId: "bulk",
        changes: { inserted, updated, feedVersion: feed.catalogVersion.version },
        userId: ctx.userId,
      },
    });

    return NextResponse.json({ inserted, updated, total: feed.vulnerabilities.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
