import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";
import { prisma } from "@/lib/db";

export default async function AdminPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/sign-in");
  if (ctx.role !== "admin") redirect("/dashboard");

  const [org, users] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: ctx.organizationId },
    }),
    prisma.user.findMany({
      where: { organizationId: ctx.organizationId },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <Sidebar current="/admin" isAdmin={true} />
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-semibold tracking-tight mb-6">Admin</h1>

        <section className="mb-8">
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-3">Organization</h2>
          <div className="rounded-lg border bg-white p-6 space-y-2 text-sm">
            <div className="flex gap-4">
              <span className="w-24 text-zinc-500">Name</span>
              <span className="font-medium text-zinc-900">{org?.name}</span>
            </div>
            <div className="flex gap-4">
              <span className="w-24 text-zinc-500">Slug</span>
              <span className="font-mono text-zinc-700">{org?.slug}</span>
            </div>
            <div className="flex gap-4">
              <span className="w-24 text-zinc-500">Created</span>
              <span className="text-zinc-700">{org?.createdAt.toLocaleDateString()}</span>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-3">
            Users ({users.length})
          </h2>
          <div className="rounded-lg border bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b bg-zinc-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Role</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3 text-zinc-900">{u.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          u.role === "admin"
                            ? "bg-zinc-900 text-white"
                            : "bg-zinc-100 text-zinc-700"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-500">{u.createdAt.toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
