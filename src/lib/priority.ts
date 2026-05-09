export type Priority = "critical" | "high" | "medium" | "low";

type AssetLike = { internetFacing: boolean };
type VulnerabilityLike = { kevFlag: boolean; cvss: number | null; fixedVersion: string | null };
type OsvDataLike = { fixedVersion?: string | null };

export function scoreFinding(
  asset: AssetLike,
  vulnerability: VulnerabilityLike,
  osvData?: OsvDataLike
): Priority {
  // Tier 1 — Critical: actively exploited
  if (vulnerability.kevFlag) {
    return "critical";
  }

  // Tier 2 — High: severe CVSS on internet-facing asset
  if ((vulnerability.cvss ?? 0) >= 9.0 && asset.internetFacing) {
    return "high";
  }

  // Tier 3 — Medium: notable CVSS or known fix available
  if ((vulnerability.cvss ?? 0) >= 7.0) {
    return "medium";
  }

  const hasFix =
    vulnerability.fixedVersion || osvData?.fixedVersion;
  if (hasFix) {
    return "medium";
  }

  // Tier 4 — Low: everything else
  return "low";
}
