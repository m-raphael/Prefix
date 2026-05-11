import type { CsvRow } from "@/lib/csv";
import { parseCsv } from "@/lib/csv";
import { parseNessus } from "./nessus";
import { parseNuclei } from "./nuclei";
import { parseTrivy } from "./trivy";

export type ParseResult = { rows: CsvRow[]; errors: { line: number; message: string }[] };

export type ScanFormat = "csv" | "nessus" | "nuclei" | "trivy" | "unknown";

export function detectFormat(filename: string, content: string): ScanFormat {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "nessus") return "nessus";
  if (ext === "csv") return "csv";

  if (ext === "json" || ext === "jsonl") {
    // Trivy reports always have a top-level "Results" array
    if (/"Results"\s*:/.test(content.slice(0, 500))) return "trivy";
    // Nuclei outputs array of objects with "template-id"
    if (/"template-id"\s*:/.test(content.slice(0, 2000))) return "nuclei";
    return "unknown";
  }

  if (ext === "xml" || content.trimStart().startsWith("<")) {
    if (content.includes("NessusClientData_v2")) return "nessus";
  }

  return "unknown";
}

export function parseAny(filename: string, content: string): ParseResult & { format: ScanFormat } {
  const format = detectFormat(filename, content);

  switch (format) {
    case "nessus":
      return { ...parseNessus(content), format };
    case "nuclei":
      return { ...parseNuclei(content), format };
    case "trivy":
      return { ...parseTrivy(content), format };
    case "csv":
      return { ...parseCsv(content), format };
    default:
      return { rows: [], errors: [{ line: 0, message: "Unrecognised file format. Supported: .nessus, .csv, Nuclei JSON, Trivy JSON" }], format };
  }
}
