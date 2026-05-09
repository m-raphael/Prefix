"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FindingDetail } from "./finding-detail";

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

export function FindingsTable({
  findings,
  pagination,
  isAdmin,
  onPageChange,
  onBulkUpdate,
}: {
  findings: Finding[];
  pagination: Pagination;
  isAdmin: boolean;
  onPageChange: (page: number) => void;
  onBulkUpdate: (ids: string[], status: string) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [detailId, setDetailId] = useState<string | null>(null);

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selected.length === findings.length) {
      setSelected([]);
    } else {
      setSelected(findings.map((f) => f.id));
    }
  };

  const clearSelection = () => setSelected([]);

  const priorityColor: Record<string, string> = {
    critical: "bg-red-100 text-red-700 hover:bg-red-100",
    high: "bg-orange-100 text-orange-700 hover:bg-orange-100",
    medium: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
    low: "bg-green-100 text-green-700 hover:bg-green-100",
  };

  const statusColor: Record<string, string> = {
    open: "bg-gray-100 text-gray-700 hover:bg-gray-100",
    in_review: "bg-blue-100 text-blue-700 hover:bg-blue-100",
    remediated: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
    closed: "bg-green-100 text-green-700 hover:bg-green-100",
    risk_accepted: "bg-orange-100 text-orange-700 hover:bg-orange-100",
  };

  const statusOptions = [
    { value: "open", label: "Open" },
    { value: "in_review", label: "In Review" },
    { value: "remediated", label: "Remediated" },
    { value: "closed", label: "Closed", adminOnly: true },
    { value: "risk_accepted", label: "Risk Accepted", adminOnly: true },
  ];

  const detailFinding = findings.find((f) => f.id === detailId) || null;

  return (
    <div>
      {selected.length > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border bg-white p-3">
          <span className="text-sm text-zinc-600">{selected.length} selected</span>
          <select
            className="rounded-md border px-2 py-1 text-sm"
            onChange={(e) => {
              if (e.target.value) {
                onBulkUpdate(selected, e.target.value);
                setSelected([]);
              }
            }}
            defaultValue=""
          >
            <option value="">Set status to...</option>
            {statusOptions
              .filter((s) => !s.adminOnly || isAdmin)
              .map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
          </select>
          <Button variant="ghost" size="sm" onClick={clearSelection}>
            Cancel
          </Button>
        </div>
      )}

      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={selected.length === findings.length && findings.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Hostname</TableHead>
              <TableHead>CVE</TableHead>
              <TableHead>CVSS</TableHead>
              <TableHead>KEV</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Discovered</TableHead>
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {findings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-8 text-center text-zinc-400">
                  No findings match your filters.
                </TableCell>
              </TableRow>
            ) : (
              findings.map((f) => (
                <TableRow key={f.id}>
                  <TableCell>
                    <Checkbox
                      checked={selected.includes(f.id)}
                      onCheckedChange={() => toggleSelect(f.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{f.asset.hostname}</TableCell>
                  <TableCell>{f.vulnerability.cve}</TableCell>
                  <TableCell>{f.vulnerability.cvss ?? "—"}</TableCell>
                  <TableCell>
                    {f.vulnerability.kevFlag ? (
                      <Badge className="bg-red-100 text-red-700 hover:bg-red-100">KEV</Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={priorityColor[f.priority] ?? ""}>
                      {f.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColor[f.status] ?? ""}>
                      {f.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-zinc-500">
                    {new Date(f.discoveredAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => setDetailId(f.id)}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-zinc-500">
            Showing {(pagination.page - 1) * pagination.limit + 1} -{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => onPageChange(pagination.page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => onPageChange(pagination.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {detailFinding && (
        <FindingDetail
          finding={detailFinding}
          isAdmin={isAdmin}
          onClose={() => setDetailId(null)}
          onStatusChange={(status) => {
            onBulkUpdate([detailFinding.id], status);
            setDetailId(null);
          }}
        />
      )}
    </div>
  );
}
