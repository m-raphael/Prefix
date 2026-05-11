import { prisma } from "./db";

export type ReportFinding = {
  id: string;
  priority: string;
  status: string;
  notes: string | null;
  discoveredAt: Date;
  remediatedAt: Date | null;
  hostname: string;
  ip: string | null;
  service: string | null;
  internetFacing: boolean;
  cve: string;
  cvss: number | null;
  description: string | null;
  kevFlag: boolean;
  kevDateAdded: Date | null;
  fixedVersion: string | null;
};

export type ReportData = {
  orgName: string;
  generatedAt: Date;
  from: Date | null;
  to: Date | null;
  totals: { critical: number; high: number; medium: number; low: number; total: number };
  kevMatches: ReportFinding[];
  findings: ReportFinding[];
};

export async function buildReportData(
  organizationId: string,
  from?: Date,
  to?: Date
): Promise<ReportData> {
  const org = await prisma.organization.findUniqueOrThrow({ where: { id: organizationId } });

  const findings = await prisma.finding.findMany({
    where: {
      organizationId,
      ...(from || to
        ? { discoveredAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
        : {}),
    },
    include: { asset: true, vulnerability: true },
    orderBy: [{ priority: "asc" }, { vulnerability: { cvss: "desc" } }],
  });

  const PRIORITY_ORDER = ["critical", "high", "medium", "low"];

  const mapped: ReportFinding[] = findings
    .sort((a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority))
    .map((f) => ({
      id: f.id,
      priority: f.priority,
      status: f.status,
      notes: f.notes,
      discoveredAt: f.discoveredAt,
      remediatedAt: f.remediatedAt,
      hostname: f.asset.hostname,
      ip: f.asset.ip,
      service: f.asset.service,
      internetFacing: f.asset.internetFacing,
      cve: f.vulnerability.cve,
      cvss: f.vulnerability.cvss,
      description: f.vulnerability.description,
      kevFlag: f.vulnerability.kevFlag,
      kevDateAdded: f.vulnerability.kevDateAdded,
      fixedVersion: f.vulnerability.fixedVersion,
    }));

  const totals = mapped.reduce(
    (acc, f) => {
      acc[f.priority as keyof typeof acc]++;
      acc.total++;
      return acc;
    },
    { critical: 0, high: 0, medium: 0, low: 0, total: 0 }
  );

  return {
    orgName: org.name,
    generatedAt: new Date(),
    from: from ?? null,
    to: to ?? null,
    totals,
    kevMatches: mapped.filter((f) => f.kevFlag),
    findings: mapped,
  };
}
