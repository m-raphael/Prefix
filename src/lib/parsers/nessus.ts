import { XMLParser } from "fast-xml-parser";
import type { CsvRow } from "@/lib/csv";

export function parseNessus(xml: string): { rows: CsvRow[]; errors: { line: number; message: string }[] } {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_", isArray: (name) => ["ReportHost", "ReportItem", "cve", "tag"].includes(name) });

  let doc: Record<string, unknown>;
  try {
    doc = parser.parse(xml);
  } catch (e) {
    return { rows: [], errors: [{ line: 0, message: `XML parse error: ${e instanceof Error ? e.message : String(e)}` }] };
  }

  const report = (doc?.NessusClientData_v2 as Record<string, unknown>)?.Report as Record<string, unknown> | undefined;
  if (!report) {
    return { rows: [], errors: [{ line: 0, message: "Not a valid .nessus file (missing NessusClientData_v2/Report)" }] };
  }

  const hosts = (report.ReportHost as unknown[]) ?? [];
  const rows: CsvRow[] = [];
  const errors: { line: number; message: string }[] = [];

  for (const host of hosts) {
    const h = host as Record<string, unknown>;
    const hostName = (h["@_name"] as string) ?? "";

    const tags = (h.HostProperties as Record<string, unknown>)?.tag as Record<string, string>[] | undefined;
    const getTag = (name: string) => tags?.find((t) => t["@_name"] === name)?.["#text"] ?? "";
    const ip = getTag("host-ip") || getTag("host-ipv4");
    const hostname = getTag("host-fqdn") || getTag("netbios-name") || hostName;

    const items = (h.ReportItem as unknown[]) ?? [];
    for (const item of items) {
      const it = item as Record<string, unknown>;

      // Skip informational (severity 0) and items with no CVE
      const cves = (it.cve as string[] | string | undefined) ?? [];
      const cveList = Array.isArray(cves) ? cves : [cves];
      if (cveList.length === 0) continue;

      const port = parseInt(String(it["@_port"] ?? "0"), 10) || undefined;
      const protocol = (it["@_protocol"] as string) || undefined;
      const service = (it["@_svc_name"] as string) || undefined;

      // Prefer CVSSv3, fall back to v2
      const cvssRaw =
        it.cvss3_base_score ?? it.cvss_base_score ?? it["cvss3-base-score"] ?? it["cvss-base-score"];
      const cvss = cvssRaw != null ? parseFloat(String(cvssRaw)) : undefined;

      for (const cve of cveList) {
        const cveStr = String(cve).trim().toUpperCase();
        if (!/^CVE-\d{4}-\d{4,}$/.test(cveStr)) {
          errors.push({ line: 0, message: `Skipped invalid CVE: ${cveStr} on host ${hostname}` });
          continue;
        }
        rows.push({
          hostname,
          ip,
          cve: cveStr,
          cvss: cvss != null && !isNaN(cvss) ? cvss : undefined,
          port,
          protocol,
          service,
        });
      }
    }
  }

  return { rows, errors };
}
