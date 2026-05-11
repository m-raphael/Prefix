import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { createElement, type ReactElement } from "react";
import { requireAuth } from "@/lib/auth";
import { buildReportData } from "@/lib/report-data";
import { signReportToken } from "@/lib/signed-url";
import { ReportDocument } from "@/lib/pdf-document";

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth();
    const body = await req.json().catch(() => ({}));
    const from = body.from ? new Date(body.from) : undefined;
    const to = body.to ? new Date(body.to) : undefined;
    const share = body.share === true;

    const data = await buildReportData(ctx.organizationId, from, to);
    const buffer = await renderToBuffer(
      createElement(ReportDocument, { data }) as ReactElement<DocumentProps>
    );

    if (share) {
      const token = signReportToken({
        orgId: ctx.organizationId,
        type: "pdf",
        ...(from ? { from: from.toISOString() } : {}),
        ...(to ? { to: to.toISOString() } : {}),
      });
      const url = `/api/reports/share/${token}`;
      return NextResponse.json({ url });
    }

    const filename = `prefix-report-${data.orgName.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.pdf`;

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": buffer.byteLength.toString(),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
