import { z } from "zod";

const kevItemSchema = z.object({
  cveID: z.string(),
  vendorProject: z.string().optional(),
  product: z.string().optional(),
  vulnerabilityName: z.string().optional(),
  dateAdded: z.string().optional(),
  shortDescription: z.string().optional(),
  requiredAction: z.string().optional(),
  dueDate: z.string().optional(),
  knownRansomwareCampaignUse: z.string().optional(),
  notes: z.string().optional(),
});

const kevFeedSchema = z.object({
  title: z.string(),
  catalogVersion: z.union([
    z.string(),
    z.object({ dateReleased: z.string(), version: z.number() }),
  ]),
  count: z.number(),
  vulnerabilities: z.array(kevItemSchema),
});

export type KevFeed = z.infer<typeof kevFeedSchema>;
export type KevItem = z.infer<typeof kevItemSchema>;

const KEV_API_URL =
  process.env.KEV_API_URL ||
  "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json";

export async function fetchKevFeed(): Promise<KevFeed> {
  const res = await fetch(KEV_API_URL, {
    headers: { Accept: "application/json" },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`KEV feed returned ${res.status}: ${res.statusText}`);
  }

  const json = await res.json();
  return kevFeedSchema.parse(json);
}

export function parseKevDate(dateStr: string | undefined): Date | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d;
}
