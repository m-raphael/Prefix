import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { buildReportData } from "@/lib/report-data";

function csvEscape(v: string | number | boolean | null | undefined): string {
  if (v == null) return "";
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth();
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from") ? new Date(searchParams.get("from")!) : undefined;
    const to = searchParams.get("to") ? new Date(searchParams.get("to")!) : undefined;

    const data = await buildReportData(ctx.organizationId, from, to);

    const headers = [
      "hostname", "ip", "service", "internet_facing",
      "cve", "cvss", "kev_flag", "kev_date_added", "fixed_version",
      "priority", "status", "discovered_at", "remediated_at", "notes",
    ];

    const rows = data.findings.map((f) =>
      [
        f.hostname, f.ip, f.service, f.internetFacing,
        f.cve, f.cvss, f.kevFlag, f.kevDateAdded?.toISOString() ?? null, f.fixedVersion,
        f.priority, f.status, f.discoveredAt.toISOString(), f.remediatedAt?.toISOString() ?? null, f.notes,
      ]
        .map(csvEscape)
        .join(",")
    );

    const csv = [headers.join(","), ...rows].join("\n");
    const filename = `prefix-findings-${data.orgName.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.csv`;

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
