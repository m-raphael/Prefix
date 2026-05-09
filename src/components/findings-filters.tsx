"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const priorities = [
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const statuses = [
  { value: "open", label: "Open" },
  { value: "in_review", label: "In Review" },
  { value: "remediated", label: "Remediated" },
  { value: "closed", label: "Closed" },
  { value: "risk_accepted", label: "Risk Accepted" },
];

export function FindingsFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function getArray(key: string) {
    const vals: string[] = [];
    searchParams.forEach((v, k) => {
      if (k === key) vals.push(v);
    });
    return vals;
  }

  const selectedPriorities = getArray("priority");
  const selectedStatuses = getArray("status");
  const kev = searchParams.get("kev");
  const asset = searchParams.get("asset") ?? "";
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";

  function buildParams(updates: Record<string, string | string[] | null>) {
    const sp = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      sp.delete(key);
      if (value === null) continue;
      if (Array.isArray(value)) {
        for (const v of value) sp.append(key, v);
      } else {
        sp.set(key, value);
      }
    }
    sp.set("page", "1");
    return sp.toString();
  }

  function toggleArray(key: string, value: string) {
    const current = getArray(key);
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    return next.length > 0 ? next : null;
  }

  return (
    <div className="space-y-4 rounded-lg border bg-white p-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Label className="text-xs text-zinc-500">Priority</Label>
          <div className="mt-1 flex flex-wrap gap-1">
            {priorities.map((p) => (
              <Button
                key={p.value}
                variant={selectedPriorities.includes(p.value) ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  router.push(`?${buildParams({ priority: toggleArray("priority", p.value) })}`)
                }
              >
                {p.label}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-xs text-zinc-500">Status</Label>
          <div className="mt-1 flex flex-wrap gap-1">
            {statuses.map((s) => (
              <Button
                key={s.value}
                variant={selectedStatuses.includes(s.value) ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  router.push(`?${buildParams({ status: toggleArray("status", s.value) })}`)
                }
              >
                {s.label}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-xs text-zinc-500">KEV Only</Label>
          <div className="mt-1 flex items-center gap-2">
            <input
              type="checkbox"
              checked={kev === "true"}
              onChange={(e) =>
                router.push(`?${buildParams({ kev: e.target.checked ? "true" : null })}`)
              }
              className="h-4 w-4 rounded border-gray-300"
            />
            <span className="text-sm text-zinc-600">Show only KEV</span>
          </div>
        </div>

        <div>
          <Label className="text-xs text-zinc-500">Asset Search</Label>
          <Input
            className="mt-1"
            placeholder="Hostname..."
            value={asset}
            onChange={(e) =>
              router.push(`?${buildParams({ asset: e.target.value || null })}`)
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Label className="text-xs text-zinc-500">From</Label>
          <Input
            type="date"
            className="mt-1"
            value={from}
            onChange={(e) =>
              router.push(`?${buildParams({ from: e.target.value || null })}`)
            }
          />
        </div>
        <div>
          <Label className="text-xs text-zinc-500">To</Label>
          <Input
            type="date"
            className="mt-1"
            value={to}
            onChange={(e) =>
              router.push(`?${buildParams({ to: e.target.value || null })}`)
            }
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("?page=1")}
        >
          Clear Filters
        </Button>
      </div>
    </div>
  );
}
