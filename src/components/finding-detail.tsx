"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type AiResult = { summary: string; remediation: string; cached: boolean } | null;

export function FindingDetail({
  finding,
  isAdmin,
  onClose,
  onStatusChange,
}: {
  finding: {
    id: string;
    status: string;
    priority: string;
    discoveredAt: string;
    notes: string | null;
    remediatedAt: string | null;
    asset: { hostname: string; ip: string | null; port: number | null; service: string | null; internetFacing: boolean };
    vulnerability: { cve: string; cvss: number | null; description: string | null; kevFlag: boolean; kevDateAdded: string | null; fixedVersion: string | null };
  };
  isAdmin: boolean;
  onClose: () => void;
  onStatusChange: (status: string) => void;
}) {
  const [aiResult, setAiResult] = useState<AiResult>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const priorityColor: Record<string, string> = {
    critical: "bg-red-100 text-red-700",
    high: "bg-orange-100 text-orange-700",
    medium: "bg-yellow-100 text-yellow-700",
    low: "bg-green-100 text-green-700",
  };

  const statusColor: Record<string, string> = {
    open: "bg-gray-100 text-gray-700",
    in_review: "bg-blue-100 text-blue-700",
    remediated: "bg-yellow-100 text-yellow-700",
    closed: "bg-green-100 text-green-700",
    risk_accepted: "bg-orange-100 text-orange-700",
  };

  const statusOptions = [
    { value: "open", label: "Open" },
    { value: "in_review", label: "In Review" },
    { value: "remediated", label: "Remediated" },
    { value: "closed", label: "Closed", adminOnly: true },
    { value: "risk_accepted", label: "Risk Accepted", adminOnly: true },
  ];

  async function fetchAiExplanation() {
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch(`/api/ai/explain/${encodeURIComponent(finding.vulnerability.cve)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hostname: finding.asset.hostname,
          service: finding.asset.service,
          fixedVersion: finding.vulnerability.fixedVersion,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? res.statusText);
      setAiResult(await res.json());
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "Failed to fetch explanation");
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {finding.vulnerability.cve}
            <Badge className={priorityColor[finding.priority] ?? ""}>
              {finding.priority}
            </Badge>
            <Badge className={statusColor[finding.status] ?? ""}>
              {finding.status.replace("_", " ")}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {finding.asset.hostname} ({finding.asset.ip ?? "—"}) — port {finding.asset.port ?? "—"} / {finding.asset.service ?? "—"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div>
            <h4 className="font-semibold text-zinc-900">Description</h4>
            <p className="mt-1 text-zinc-600">
              {finding.vulnerability.description ?? "No description available."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-zinc-900">CVSS Score</h4>
              <p className="mt-1 text-zinc-600">{finding.vulnerability.cvss ?? "—"}</p>
            </div>
            <div>
              <h4 className="font-semibold text-zinc-900">KEV Status</h4>
              <p className="mt-1 text-zinc-600">
                {finding.vulnerability.kevFlag ? "Listed in CISA KEV" : "Not in KEV"}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-zinc-900">Fixed Version</h4>
              <p className="mt-1 text-zinc-600">{finding.vulnerability.fixedVersion ?? "—"}</p>
            </div>
            <div>
              <h4 className="font-semibold text-zinc-900">Internet Facing</h4>
              <p className="mt-1 text-zinc-600">{finding.asset.internetFacing ? "Yes" : "No"}</p>
            </div>
          </div>

          {/* AI Explanation */}
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-blue-900 text-sm">AI Explanation</h4>
              {!aiResult && (
                <Button size="sm" variant="outline" onClick={fetchAiExplanation} disabled={aiLoading}
                  className="h-7 text-xs border-blue-200 text-blue-700 hover:bg-blue-100">
                  {aiLoading ? "Generating…" : "Explain this vulnerability"}
                </Button>
              )}
              {aiResult && (
                <span className="text-xs text-blue-400">{aiResult.cached ? "cached" : "fresh"}</span>
              )}
            </div>

            {aiError && <p className="text-xs text-red-600">{aiError}</p>}

            {aiResult && (
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-blue-800 mb-1">Plain-language summary</p>
                  <p className="text-sm text-blue-900">{aiResult.summary}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-blue-800 mb-1">Remediation steps</p>
                  <p className="text-sm text-blue-900 whitespace-pre-line">{aiResult.remediation}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={fetchAiExplanation} disabled={aiLoading}
                  className="h-6 text-xs text-blue-500 px-0 hover:bg-transparent">
                  {aiLoading ? "Refreshing…" : "Refresh"}
                </Button>
              </div>
            )}
          </div>

          <div>
            <h4 className="font-semibold text-zinc-900">Notes</h4>
            <p className="mt-1 text-zinc-600">{finding.notes ?? "No notes."}</p>
          </div>

          <div>
            <h4 className="font-semibold text-zinc-900">Change Status</h4>
            <div className="mt-2 flex flex-wrap gap-2">
              {statusOptions
                .filter((s) => !s.adminOnly || isAdmin)
                .map((s) => (
                  <Button
                    key={s.value}
                    variant={finding.status === s.value ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => onStatusChange(s.value)}
                  >
                    {s.label}
                  </Button>
                ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
