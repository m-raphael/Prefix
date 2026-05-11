import type { CsvRow } from "@/lib/csv";

type TrivyVuln = {
  VulnerabilityID?: string;
  Severity?: string;
  CVSS?: {
    nvd?: { V3Score?: number; V2Score?: number };
    redhat?: { V3Score?: number };
    [key: string]: { V3Score?: number; V2Score?: number } | undefined;
  };
};

type TrivyResult = {
  Target?: string;
  Vulnerabilities?: TrivyVuln[] | null;
};

type TrivyReport = {
  Results?: TrivyResult[];
  SchemaVersion?: number;
};

export function parseTrivy(json: string): { rows: CsvRow[]; errors: { line: number; message: string }[] } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { rows: [], errors: [{ line: 0, message: "Invalid JSON" }] };
  }

  const report = parsed as TrivyReport;
  if (!report.Results) {
    return { rows: [], errors: [{ line: 0, message: "Not a Trivy report (missing Results array)" }] };
  }

  const rows: CsvRow[] = [];
  const errors: { line: number; message: string }[] = [];

  for (const result of report.Results) {
    const hostname = result.Target ?? "unknown";
    const vulns = result.Vulnerabilities ?? [];

    for (const v of vulns) {
      const cve = v.VulnerabilityID ?? "";
      if (!/^CVE-\d{4}-\d{4,}$/i.test(cve)) continue;

      // Best-effort CVSS: try NVD v3 → any provider v3 → NVD v2
      let cvss: number | undefined;
      if (v.CVSS) {
        cvss =
          v.CVSS.nvd?.V3Score ??
          Object.values(v.CVSS).find((p) => p?.V3Score != null)?.V3Score ??
          v.CVSS.nvd?.V2Score;
      }

      rows.push({
        hostname,
        cve: cve.toUpperCase(),
        cvss,
      });
    }
  }

  return { rows, errors };
}
