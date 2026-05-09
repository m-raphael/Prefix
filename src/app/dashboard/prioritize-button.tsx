"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function PrioritizeButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    critical: number;
    high: number;
    medium: number;
    low: number;
    changed: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/prioritize", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Prioritization failed");
      } else {
        setResult({
          critical: data.critical,
          high: data.high,
          medium: data.medium,
          low: data.low,
          changed: data.changed,
        });
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
          Scored {result.changed} changed — C:{result.critical} H:{result.high} M:{result.medium} L:{result.low}
        </span>
      )}
      {error && <span className="text-sm text-red-600">{error}</span>}
      <Button onClick={handleClick} disabled={loading} size="sm" variant="outline">
        {loading ? "Scoring..." : "Run Prioritization"}
      </Button>
    </div>
  );
}
