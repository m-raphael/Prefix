import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { KevSyncButton } from "./kev-sync-button";
import { CsvUploadForm } from "./csv-upload-form";
import { PrioritizeButton } from "./prioritize-button";
import { FindingsSection } from "./findings-section";
import { ExportControls } from "@/components/export-controls";

export default async function DashboardPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { clerkId },
    include: { organization: true },
  });

  if (!user) redirect("/sign-in");

  const isAdmin = user.role === "admin";

  const counts = await prisma.finding.groupBy({
    by: ["priority"],
    where: { organizationId: user.organizationId },
    _count: { id: true },
  });

  const critical = counts.find((c) => c.priority === "critical")?._count.id ?? 0;
  const high = counts.find((c) => c.priority === "high")?._count.id ?? 0;
  const medium = counts.find((c) => c.priority === "medium")?._count.id ?? 0;
  const low = counts.find((c) => c.priority === "low")?._count.id ?? 0;

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <aside className="w-64 border-r bg-white p-6">
        <h2 className="text-lg font-semibold tracking-tight">Prefix</h2>
        <nav className="mt-8 flex flex-col gap-2">
          <a
            href="/dashboard"
            className="rounded-md bg-zinc-100 px-3 py-2 text-sm font-medium"
          >
            Dashboard
          </a>
          <a
            href="#"
            className="rounded-md px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
          >
            Assets
          </a>
          <a
            href="#"
            className="rounded-md px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
          >
            Reports
          </a>
          {isAdmin && (
            <a
              href="#"
              className="rounded-md px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
            >
              Admin
            </a>
          )}
        </nav>
      </aside>
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">
            Vulnerability Dashboard
          </h1>
          <div className="flex items-center gap-3">
            <PrioritizeButton />
            {isAdmin && <KevSyncButton />}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-4 gap-4">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-600">Critical</p>
            <p className="mt-1 text-2xl font-bold text-red-700">{critical}</p>
          </div>
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
            <p className="text-sm text-orange-600">High</p>
            <p className="mt-1 text-2xl font-bold text-orange-700">{high}</p>
          </div>
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <p className="text-sm text-yellow-600">Medium</p>
            <p className="mt-1 text-2xl font-bold text-yellow-700">{medium}</p>
          </div>
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="text-sm text-green-600">Low</p>
            <p className="mt-1 text-2xl font-bold text-green-700">{low}</p>
          </div>
        </div>

        <Suspense fallback={<div className="mt-8 text-sm text-zinc-400">Loading findings...</div>}>
          <FindingsSection isAdmin={isAdmin} />
        </Suspense>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-lg border bg-white p-6">
            <h2 className="text-sm font-semibold text-zinc-900">Ingest Scan Data</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Upload a CSV export from your vulnerability scanner.
            </p>
            <CsvUploadForm />
          </div>

          <div className="rounded-lg border bg-white p-6">
            <h2 className="text-sm font-semibold text-zinc-900">Recent Activity</h2>
            <RecentActivity orgId={user.organizationId} />
          </div>

          <div className="rounded-lg border bg-white p-6">
            <h2 className="text-sm font-semibold text-zinc-900 mb-4">Export</h2>
            <ExportControls />
          </div>
        </div>
      </main>
    </div>
  );
}

async function RecentActivity({ orgId }: { orgId: string }) {
  const logs = await prisma.auditLog.findMany({
    where: {
      user: { organizationId: orgId },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { user: { select: { email: true } } },
  });

  if (logs.length === 0) {
    return (
      <p className="mt-4 text-sm text-zinc-400">
        No activity yet. Sync KEV or upload a CSV to get started.
      </p>
    );
  }

  return (
    <ul className="mt-4 space-y-3">
      {logs.map((log) => (
        <li key={log.id} className="flex items-center justify-between text-sm">
          <span className="text-zinc-700">
            {log.action === "kev_sync" && "KEV sync completed"}
            {log.action === "csv_ingest" && "CSV ingested"}
            {log.action !== "kev_sync" && log.action !== "csv_ingest" && log.action}
          </span>
          <span className="text-zinc-400">
            {log.createdAt.toLocaleDateString()}
          </span>
        </li>
      ))}
    </ul>
  );
}
