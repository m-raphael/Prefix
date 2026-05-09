"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { FindingsTable } from "@/components/findings-table";
import { FindingsFilters } from "@/components/findings-filters";
import { Button } from "@/components/ui/button";

type Finding = {
  id: string;
  status: string;
  priority: string;
  discoveredAt: string;
  notes: string | null;
  remediatedAt: string | null;
  asset: { hostname: string; ip: string | null; port: number | null; service: string | null; internetFacing: boolean };
  vulnerability: { cve: string; cvss: number | null; description: string | null; kevFlag: boolean; kevDateAdded: string | null; fixedVersion: string | null };
};

type Pagination = { page: number; limit: number; total: number; totalPages: number };

export function FindingsSection({ isAdmin }: { isAdmin: boolean }) {
  const searchParams = useSearchParams();
  const [findings, setFindings] = useState<Finding[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 25, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFindings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/findings?${searchParams.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to fetch findings");
      } else {
        setFindings(data.findings);
        setPagination(data.pagination);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchFindings();
  }, [fetchFindings]);

  async function handlePageChange(page: number) {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set("page", String(page));
    window.history.pushState(null, "", `?${sp.toString()}`);
    // Trigger re-fetch via effect
    const event = new PopStateEvent("popstate");
    window.dispatchEvent(event);
  }

  async function handleBulkUpdate(ids: string[], status: string) {
    try {
      const res = await fetch("/api/findings/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, status }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Bulk update failed");
      } else {
        await fetchFindings();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    }
  }

  return (
    <div className="mt-8 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Findings</h2>
        <Button variant="ghost" size="sm" onClick={fetchFindings} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <FindingsFilters />

      <FindingsTable
        findings={findings}
        pagination={pagination}
        isAdmin={isAdmin}
        onPageChange={handlePageChange}
        onBulkUpdate={handleBulkUpdate}
      />
    </div>
  );
}
