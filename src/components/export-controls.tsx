"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ExportControls() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState<"pdf" | "csv" | "share" | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function dateParams() {
    const p: Record<string, string> = {};
    if (from) p.from = from;
    if (to) p.to = to;
    return p;
  }

  async function downloadPdf() {
    setLoading("pdf");
    setError(null);
    try {
      const res = await fetch("/api/reports/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dateParams()),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? res.statusText);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `prefix-report-${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(null);
    }
  }

  function downloadCsv() {
    const params = new URLSearchParams(dateParams());
    const url = `/api/reports/csv${params.size ? "?" + params.toString() : ""}`;
    window.location.href = url;
  }

  async function createShareLink() {
    setLoading("share");
    setError(null);
    setShareUrl(null);
    try {
      const res = await fetch("/api/reports/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...dateParams(), share: true }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? res.statusText);
      const { url } = await res.json();
      setShareUrl(`${window.location.origin}${url}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(null);
    }
  }

  async function copyLink() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Export Report</h3>
        <span className="text-xs text-muted-foreground">Shared links expire in 7 days</span>
      </div>

      <div className="flex gap-3 items-end">
        <div className="space-y-1">
          <Label className="text-xs" htmlFor="rpt-from">From</Label>
          <Input id="rpt-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-8 text-xs w-36" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs" htmlFor="rpt-to">To</Label>
          <Input id="rpt-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-8 text-xs w-36" />
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button size="sm" onClick={downloadPdf} disabled={loading !== null}>
          {loading === "pdf" ? "Generating…" : "Download PDF"}
        </Button>
        <Button size="sm" variant="outline" onClick={downloadCsv} disabled={loading !== null}>
          Download CSV
        </Button>
        <Button size="sm" variant="outline" onClick={createShareLink} disabled={loading !== null}>
          {loading === "share" ? "Generating…" : "Create Share Link"}
        </Button>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {shareUrl && (
        <div className="flex gap-2 items-center">
          <Input value={shareUrl} readOnly className="h-8 text-xs font-mono flex-1" />
          <Button size="sm" variant="outline" onClick={copyLink}>
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>
      )}
    </div>
  );
}
