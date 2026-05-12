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

const COLUMN_ALIASES: Record<string, string> = {
  host: "hostname",
  "host name": "hostname",
  asset: "hostname",
  target: "hostname",
  ip_address: "ip",
  "ip address": "ip",
  ipaddress: "ip",
  cve_id: "cve",
  cve_number: "cve",
  vulnerability: "cve",
  vuln: "cve",
  vuln_id: "cve",
  vulnerability_id: "cve",
  cvss_score: "cvss",
  cvss_base: "cvss",
  score: "cvss",
  port_number: "port",
  proto: "protocol",
  svc: "service",
};

function normalizeHeader(h: string): string {
  const lower = h.toLowerCase().trim().replace(/^"|"$/g, "");
  return COLUMN_ALIASES[lower] ?? lower;
}

function detectDelimiter(line: string): string {
  const counts = { ",": 0, ";": 0, "\t": 0 };
  for (const ch of line) {
    if (ch in counts) counts[ch as keyof typeof counts]++;
  }
  if (counts[";"] > counts[","] && counts[";"] > counts["\t"]) return ";";
  if (counts["\t"] > counts[","] && counts["\t"] > counts[";"]) return "\t";
  return ",";
}

export function parseCsv(text: string): {
  headers: string[];
  rows: CsvRow[];
  errors: { line: number; message: string }[];
} {
  // Strip BOM
  const cleaned = text.replace(/^﻿/, "").trim();
  const lines = cleaned.split(/\r?\n/);
  if (lines.length < 2) {
    return { headers: [], rows: [], errors: [{ line: 0, message: "CSV has no data rows" }] };
  }

  const delimiter = detectDelimiter(lines[0]);
  const rawHeaders = splitCsvLine(lines[0], delimiter);
  const headers = rawHeaders.map(normalizeHeader);

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
    const raw = splitCsvLine(lines[i], delimiter);
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

function splitCsvLine(line: string, delimiter = ","): string[] {
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
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}
