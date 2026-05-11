import type { CsvRow } from "@/lib/csv";

type NucleiResult = {
  "template-id"?: string;
  host?: string;
  ip?: string;
  info?: { severity?: string; name?: string };
  "matched-at"?: string;
};

// Rough severity → CVSS mapping for Nuclei (no native CVSS scores)
const severityCvss: Record<string, number> = {
  critical: 9.5,
  high: 7.5,
  medium: 5.0,
  low: 2.5,
  info: 0,
};

export function parseNuclei(json: string): { rows: CsvRow[]; errors: { line: number; message: string }[] } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { rows: [], errors: [{ line: 0, message: "Invalid JSON" }] };
  }

  const results: NucleiResult[] = Array.isArray(parsed) ? parsed : [parsed as NucleiResult];
  const rows: CsvRow[] = [];
  const errors: { line: number; message: string }[] = [];

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const templateId = r["template-id"] ?? "";

    // Only process CVE templates
    if (!/^CVE-\d{4}-\d{4,}$/i.test(templateId)) continue;

    const rawHost = r.host ?? r["matched-at"] ?? "";
    const hostname = rawHost.replace(/^https?:\/\//, "").split(":")[0].split("/")[0];
    if (!hostname) {
      errors.push({ line: i + 1, message: `Missing host on template ${templateId}` });
      continue;
    }

    const severity = r.info?.severity?.toLowerCase() ?? "info";
    const cvss = severityCvss[severity] ?? 0;

    rows.push({
      hostname,
      ip: r.ip ?? "",
      cve: templateId.toUpperCase(),
      cvss,
    });
  }

  return { rows, errors };
}
