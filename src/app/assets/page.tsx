import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getAuthContext } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";

export default async function AssetsPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/sign-in");

  const assets = await prisma.asset.findMany({
    where: { organizationId: ctx.organizationId },
    orderBy: { hostname: "asc" },
    include: {
      _count: { select: { findings: true } },
      findings: {
        select: { priority: true, status: true },
      },
    },
  });

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <Sidebar current="/assets" isAdmin={ctx.role === "admin"} />
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Assets</h1>
          <span className="text-sm text-zinc-500">{assets.length} total</span>
        </div>

        {assets.length === 0 ? (
          <div className="rounded-lg border bg-white p-12 text-center text-sm text-zinc-400">
            No assets yet. Upload a CSV scan to populate this list.
          </div>
        ) : (
          <div className="rounded-lg border bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b bg-zinc-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Hostname</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">IP</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Service</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Internet-facing</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Findings</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Open Critical</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {assets.map((asset) => {
                  const openCritical = asset.findings.filter(
                    (f) => f.priority === "critical" && f.status === "open"
                  ).length;
                  return (
                    <tr key={asset.id} className="hover:bg-zinc-50">
                      <td className="px-4 py-3 font-mono text-xs text-zinc-900">{asset.hostname}</td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-500">{asset.ip ?? "—"}</td>
                      <td className="px-4 py-3 text-zinc-600">{asset.service ?? "—"}</td>
                      <td className="px-4 py-3">
                        {asset.internetFacing ? (
                          <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                            Yes
                          </span>
                        ) : (
                          <span className="text-zinc-400">No</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-zinc-700">{asset._count.findings}</td>
                      <td className="px-4 py-3">
                        {openCritical > 0 ? (
                          <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                            {openCritical}
                          </span>
                        ) : (
                          <span className="text-zinc-400">0</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
