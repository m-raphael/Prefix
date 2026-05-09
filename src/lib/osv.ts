import { z } from "zod";

const osvVulnSchema = z.object({
  id: z.string(),
  modified: z.string(),
  published: z.string().optional(),
  details: z.string().optional(),
  severity: z
    .array(
      z.object({
        type: z.string(),
        score: z.string().optional(),
      })
    )
    .optional(),
  affected: z
    .array(
      z.object({
        package: z
          .object({
            ecosystem: z.string(),
            name: z.string(),
          })
          .optional(),
        ranges: z
          .array(
            z.object({
              type: z.string(),
              events: z.array(z.object({ introduced: z.string().optional(), fixed: z.string().optional() })),
            })
          )
          .optional(),
        versions: z.array(z.string()).optional(),
      })
    )
    .optional(),
  references: z
    .array(z.object({ type: z.string(), url: z.string() }))
    .optional(),
});

export type OsvVulnerability = z.infer<typeof osvVulnSchema>;

const OSV_API_URL = process.env.OSV_API_URL || "https://api.osv.dev/v1";

export async function queryOsvByCve(cve: string): Promise<OsvVulnerability | null> {
  try {
    const res = await fetch(`${OSV_API_URL}/vulns/${cve.toUpperCase()}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });

    if (res.status === 404) {
      return null;
    }

    if (!res.ok) {
      throw new Error(`OSV returned ${res.status}: ${res.statusText}`);
    }

    const json = await res.json();
    return osvVulnSchema.parse(json);
  } catch {
    return null;
  }
}

export function extractFixedVersion(osv: OsvVulnerability): string | null {
  for (const affected of osv.affected ?? []) {
    for (const range of affected.ranges ?? []) {
      for (const event of range.events) {
        if (event.fixed) {
          return event.fixed;
        }
      }
    }
  }
  return null;
}
