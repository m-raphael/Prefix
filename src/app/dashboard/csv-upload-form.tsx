"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CsvUploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, number> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
    setResult(null);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setResult(null);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/ingest/csv", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Upload failed");
      } else {
        setResult(data);
        if (inputRef.current) inputRef.current.value = "";
        setFile(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <div>
        <Label htmlFor="csv-file" className="text-xs text-zinc-500">
          CSV file
        </Label>
        <Input
          id="csv-file"
          ref={inputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="mt-1"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {result && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
          <p>Processed {result.rowsProcessed} rows</p>
          <p className="mt-1 text-green-600">
            Assets: +{result.assetsCreated} / Vulns: +{result.vulnsCreated} / Findings: +{result.findingsCreated}
          </p>
          {result.parseErrors > 0 && (
            <p className="mt-1 text-yellow-600">{result.parseErrors} parse errors skipped</p>
          )}
        </div>
      )}

      <Button type="submit" disabled={!file || loading} size="sm">
        {loading ? "Uploading..." : "Upload CSV"}
      </Button>
    </form>
  );
}
