"use client";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { ReportData, ReportFinding } from "./report-data";

Font.register({
  family: "Helvetica",
  fonts: [
    { src: "Helvetica" },
    { src: "Helvetica-Bold", fontWeight: "bold" },
  ],
});

const COLORS = {
  critical: "#dc2626",
  high: "#ea580c",
  medium: "#ca8a04",
  low: "#16a34a",
  text: "#111827",
  muted: "#6b7280",
  border: "#e5e7eb",
  bg: "#f9fafb",
  white: "#ffffff",
  accent: "#1d4ed8",
};

const s = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 9, color: COLORS.text, padding: 40, lineHeight: 1.4 },
  header: { borderBottomWidth: 2, borderBottomColor: COLORS.accent, marginBottom: 20, paddingBottom: 12 },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: COLORS.accent, marginBottom: 4 },
  headerMeta: { fontSize: 8, color: COLORS.muted },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: "bold", color: COLORS.accent, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: 4 },
  summaryRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  summaryCard: { flex: 1, padding: 10, borderRadius: 4, alignItems: "center" },
  summaryCount: { fontSize: 20, fontWeight: "bold", color: COLORS.white },
  summaryLabel: { fontSize: 7, color: COLORS.white, textTransform: "uppercase", letterSpacing: 0.5 },
  table: { width: "100%" },
  tableHeader: { flexDirection: "row", backgroundColor: COLORS.bg, padding: "5 8", borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tableRow: { flexDirection: "row", padding: "5 8", borderBottomWidth: 1, borderBottomColor: COLORS.border },
  th: { fontSize: 7, fontWeight: "bold", color: COLORS.muted, textTransform: "uppercase" },
  td: { fontSize: 8 },
  badge: { paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3, fontSize: 7, fontWeight: "bold", color: COLORS.white },
  kevBadge: { backgroundColor: "#7c3aed", paddingHorizontal: 4, paddingVertical: 2, borderRadius: 3, fontSize: 7, fontWeight: "bold", color: COLORS.white },
  footer: { position: "absolute", bottom: 24, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 6 },
  footerText: { fontSize: 7, color: COLORS.muted },
  alertBox: { backgroundColor: "#fef2f2", borderLeftWidth: 3, borderLeftColor: COLORS.critical, padding: 10, marginBottom: 8, borderRadius: 2 },
  alertTitle: { fontSize: 9, fontWeight: "bold", color: COLORS.critical, marginBottom: 2 },
  alertText: { fontSize: 8, color: COLORS.text },
});

const PRIORITY_BG: Record<string, string> = {
  critical: COLORS.critical,
  high: COLORS.high,
  medium: COLORS.medium,
  low: COLORS.low,
};

function fmt(d: Date | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function PriorityBadge({ priority }: { priority: string }) {
  return (
    <View style={[s.badge, { backgroundColor: PRIORITY_BG[priority] ?? "#6b7280" }]}>
      <Text>{priority.toUpperCase()}</Text>
    </View>
  );
}

function FindingRow({ f, i }: { f: ReportFinding; i: number }) {
  const bg = i % 2 === 0 ? COLORS.white : COLORS.bg;
  return (
    <View style={[s.tableRow, { backgroundColor: bg }]}>
      <View style={{ width: "14%" }}><Text style={s.td}>{f.hostname}</Text></View>
      <View style={{ width: "15%" }}><Text style={[s.td, { color: COLORS.accent }]}>{f.cve}</Text></View>
      <View style={{ width: "7%", alignItems: "center" }}><Text style={s.td}>{f.cvss?.toFixed(1) ?? "—"}</Text></View>
      <View style={{ width: "8%" }}>
        {f.kevFlag && <View style={s.kevBadge}><Text>KEV</Text></View>}
      </View>
      <View style={{ width: "10%" }}><PriorityBadge priority={f.priority} /></View>
      <View style={{ width: "10%" }}><Text style={s.td}>{f.status.replace("_", " ")}</Text></View>
      <View style={{ width: "12%" }}><Text style={s.td}>{fmt(f.discoveredAt)}</Text></View>
      <View style={{ flex: 1 }}><Text style={s.td}>{f.fixedVersion ? `Fix: ${f.fixedVersion}` : (f.description?.slice(0, 60) ?? "—")}</Text></View>
    </View>
  );
}

export function ReportDocument({ data }: { data: ReportData }) {
  const dateRange =
    data.from || data.to
      ? `${fmt(data.from)} – ${fmt(data.to)}`
      : "All time";

  return (
    <Document title={`Fix This First — ${data.orgName}`} author="Prefix">
      <Page size="A4" orientation="landscape" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerTitle}>Fix This First</Text>
          <Text style={s.headerMeta}>
            {data.orgName} · Generated {fmt(data.generatedAt)} · Period: {dateRange}
          </Text>
        </View>

        {/* Summary cards */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Executive Summary</Text>
          <View style={s.summaryRow}>
            {(["critical", "high", "medium", "low"] as const).map((p) => (
              <View key={p} style={[s.summaryCard, { backgroundColor: PRIORITY_BG[p] }]}>
                <Text style={s.summaryCount}>{data.totals[p]}</Text>
                <Text style={s.summaryLabel}>{p}</Text>
              </View>
            ))}
            <View style={[s.summaryCard, { backgroundColor: COLORS.accent }]}>
              <Text style={s.summaryCount}>{data.totals.total}</Text>
              <Text style={s.summaryLabel}>Total</Text>
            </View>
          </View>
          {data.kevMatches.length > 0 && (
            <View style={s.alertBox}>
              <Text style={s.alertTitle}>
                ⚠ {data.kevMatches.length} CISA KEV Match{data.kevMatches.length > 1 ? "es" : ""} — Immediate Action Required
              </Text>
              <Text style={s.alertText}>
                The following vulnerabilities are actively exploited in the wild per CISA's Known Exploited Vulnerabilities catalog:{" "}
                {data.kevMatches.map((f) => f.cve).join(", ")}.
              </Text>
            </View>
          )}
        </View>

        {/* Critical KEV items */}
        {data.kevMatches.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Critical KEV Items — Fix Immediately</Text>
            {data.kevMatches.map((f) => (
              <View key={f.id} style={{ marginBottom: 6, paddingLeft: 8, borderLeftWidth: 2, borderLeftColor: COLORS.critical }}>
                <Text style={{ fontSize: 9, fontWeight: "bold" }}>
                  {f.cve} — {f.hostname} {f.ip ? `(${f.ip})` : ""} {f.service ? `· ${f.service}` : ""}
                </Text>
                <Text style={{ fontSize: 8, color: COLORS.muted }}>
                  CVSS {f.cvss?.toFixed(1) ?? "N/A"} · KEV added {fmt(f.kevDateAdded)} · {f.fixedVersion ? `Fix available: ${f.fixedVersion}` : "No fix version in database"}
                </Text>
                {f.description && (
                  <Text style={{ fontSize: 8, color: COLORS.text, marginTop: 2 }}>{f.description.slice(0, 200)}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Full findings table */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Full Finding List ({data.totals.total})</Text>
          <View style={s.table}>
            <View style={s.tableHeader}>
              <Text style={[s.th, { width: "14%" }]}>Hostname</Text>
              <Text style={[s.th, { width: "15%" }]}>CVE</Text>
              <Text style={[s.th, { width: "7%" }]}>CVSS</Text>
              <Text style={[s.th, { width: "8%" }]}>KEV</Text>
              <Text style={[s.th, { width: "10%" }]}>Priority</Text>
              <Text style={[s.th, { width: "10%" }]}>Status</Text>
              <Text style={[s.th, { width: "12%" }]}>Discovered</Text>
              <Text style={[s.th, { flex: 1 }]}>Fix / Notes</Text>
            </View>
            {data.findings.map((f, i) => <FindingRow key={f.id} f={f} i={i} />)}
          </View>
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>Prefix · Confidential · {data.orgName}</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
