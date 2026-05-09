/**
 * Check if an IP address is likely internet-facing.
 * Returns true if the IP is NOT in a known private/reserved range.
 * Returns true for missing/invalid IPs (conservative: assume exposed).
 */
export function isInternetFacing(ip: string | null | undefined): boolean {
  if (!ip || ip.trim() === "") return true;

  const clean = ip.trim();

  // IPv4 private ranges
  if (clean.startsWith("10.")) return false; // 10.0.0.0/8
  if (clean.startsWith("127.")) return false; // 127.0.0.0/8
  if (clean.startsWith("169.254.")) return false; // 169.254.0.0/16

  // 172.16.0.0/12 → 172.16.x.x through 172.31.x.x
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(clean)) return false;

  if (clean.startsWith("192.168.")) return false; // 192.168.0.0/16

  // IPv6 private / loopback / link-local
  if (clean.startsWith("::1")) return false;
  if (clean.startsWith("fe80:")) return false;
  if (clean.startsWith("fc00:") || clean.startsWith("fd00:")) return false;

  return true;
}
