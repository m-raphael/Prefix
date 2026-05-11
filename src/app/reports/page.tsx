import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";
import { ExportControls } from "@/components/export-controls";
import { prisma } from "@/lib/db";

export default async function ReportsPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/sign-in");

  const counts = await prisma.finding.groupBy({
    by: ["priority"],
    where: { organizationId: ctx.organizationId },
    _count: { id: true },
  });

  const statusCounts = await prisma.finding.groupBy({
    by: ["status"],
    where: { organizationId: ctx.organizationId },
    _count: { id: true },
  });

  const total = counts.reduce((s, c) => s + c._count.id, 0);
  const open = statusCounts.find((c) => c.status === "open")?._count.id ?? 0;
  const remediated = statusCounts.find((c) => c.status === "remediated")?._count.id ?? 0;

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <Sidebar current="/reports" isAdmin={ctx.role === "admin"} />
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-semibold tracking-tight mb-6">Reports</h1>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="rounded-lg border bg-white p-4">
            <p className="text-sm text-zinc-500">Total Findings</p>
            <p className="mt-1 text-3xl font-bold text-zinc-900">{total}</p>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <p className="text-sm text-zinc-500">Open</p>
            <p className="mt-1 text-3xl font-bold text-orange-600">{open}</p>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <p className="text-sm text-zinc-500">Remediated</p>
            <p className="mt-1 text-3xl font-bold text-green-600">{remediated}</p>
          </div>
        </div>

        <div className="max-w-lg">
          <ExportControls />
        </div>
      </main>
    </div>
  );
}
