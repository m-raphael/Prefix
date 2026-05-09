import { prisma } from "./db";
import { scoreFinding } from "./priority";
import { queryOsvByCve, extractFixedVersion } from "./osv";

export type ScoreResult = {
  critical: number;
  high: number;
  medium: number;
  low: number;
  changed: number;
  total: number;
};

export async function reScoreOrg(organizationId: string): Promise<ScoreResult> {
  const findings = await prisma.finding.findMany({
    where: { organizationId },
    include: { asset: true, vulnerability: true },
  });

  let critical = 0;
  let high = 0;
  let medium = 0;
  let low = 0;
  let changed = 0;

  for (const finding of findings) {
    const osv = await queryOsvByCve(finding.vulnerability.cve);
    const fixedVersion = osv ? extractFixedVersion(osv) : null;

    const priority = scoreFinding(
      finding.asset,
      { ...finding.vulnerability, fixedVersion: fixedVersion ?? finding.vulnerability.fixedVersion },
      osv ? { fixedVersion } : undefined
    );

    if (finding.priority !== priority) {
      await prisma.finding.update({
        where: { id: finding.id },
        data: { priority },
      });
      changed++;
    }

    if (priority === "critical") critical++;
    else if (priority === "high") high++;
    else if (priority === "medium") medium++;
    else low++;
  }

  return { critical, high, medium, low, changed, total: findings.length };
}
