"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function KevSyncButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ inserted: number; updated: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSync() {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/kev/sync", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Sync failed");
      } else {
        setResult({ inserted: data.inserted, updated: data.updated });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {result && (
        <span className="text-sm text-green-600">
          Synced: {result.inserted} new, {result.updated} updated
        </span>
      )}
      {error && (
        <span className="text-sm text-red-600">{error}</span>
      )}
      <Button onClick={handleSync} disabled={loading} size="sm">
        {loading ? "Syncing..." : "Sync KEV"}
      </Button>
    </div>
  );
}
