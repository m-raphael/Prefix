import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { createElement, type ReactElement } from "react";
import { verifyReportToken } from "@/lib/signed-url";
import { buildReportData } from "@/lib/report-data";
import { ReportDocument } from "@/lib/pdf-document";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const payload = verifyReportToken(decodeURIComponent(token));

    const from = payload.from ? new Date(payload.from) : undefined;
    const to = payload.to ? new Date(payload.to) : undefined;

    const data = await buildReportData(payload.orgId, from, to);
    const buffer = await renderToBuffer(
      createElement(ReportDocument, { data }) as ReactElement<DocumentProps>
    );

    const filename = `prefix-report-${data.orgName.toLowerCase().replace(/\s+/g, "-")}.pdf`;

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message.includes("expired") ? 410 : message.includes("Invalid") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
