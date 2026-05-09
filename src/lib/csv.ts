import { z } from "zod";

const csvRowSchema = z.object({
  hostname: z.string().min(1),
  ip: z.string().optional().default(""),
  cve: z.string().regex(/^CVE-\d{4}-\d{4,}$/i, "Invalid CVE format"),
  cvss: z.coerce.number().min(0).max(10).optional(),
  port: z.coerce.number().int().min(1).max(65535).optional(),
  protocol: z.string().optional().default(""),
  service: z.string().optional().default(""),
});

export type CsvRow = z.infer<typeof csvRowSchema>;

export function parseCsv(text: string): {
  headers: string[];
  rows: CsvRow[];
  errors: { line: number; message: string }[];
} {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) {
    return { headers: [], rows: [], errors: [{ line: 0, message: "CSV has no data rows" }] };
  }

  const rawHeaders = splitCsvLine(lines[0]);
  const headers = rawHeaders.map((h) => h.toLowerCase().trim());

  const colMap: Record<string, number> = {};
  headers.forEach((h, i) => {
    colMap[h] = i;
  });

  const requiredCols = ["hostname", "cve"];
  const missingCols = requiredCols.filter((c) => !(c in colMap));
  if (missingCols.length > 0) {
    return {
      headers,
      rows: [],
      errors: [{ line: 0, message: `Missing required columns: ${missingCols.join(", ")}` }],
    };
  }

  const rows: CsvRow[] = [];
  const errors: { line: number; message: string }[] = [];

  for (let i = 1; i < lines.length; i++) {
    const raw = splitCsvLine(lines[i]);
    const get = (name: string): string | undefined => {
      const idx = colMap[name];
      if (idx === undefined) return undefined;
      return raw[idx]?.trim() || undefined;
    };

    const parseResult = csvRowSchema.safeParse({
      hostname: get("hostname"),
      ip: get("ip"),
      cve: get("cve"),
      cvss: get("cvss"),
      port: get("port"),
      protocol: get("protocol"),
      service: get("service"),
    });

    if (parseResult.success) {
      rows.push(parseResult.data);
    } else {
      errors.push({ line: i + 1, message: parseResult.error.issues.map((e: { message: string }) => e.message).join("; ") });
    }
  }

  return { headers, rows, errors };
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}
