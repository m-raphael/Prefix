import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) redirect("/sign-in");

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
          <a
            href="#"
            className="rounded-md px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
          >
            Admin
          </a>
        </nav>
      </aside>
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Vulnerability Dashboard
        </h1>
        <div className="mt-6 grid grid-cols-4 gap-4">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-600">Critical</p>
            <p className="mt-1 text-2xl font-bold text-red-700">0</p>
          </div>
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
            <p className="text-sm text-orange-600">High</p>
            <p className="mt-1 text-2xl font-bold text-orange-700">0</p>
          </div>
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <p className="text-sm text-yellow-600">Medium</p>
            <p className="mt-1 text-2xl font-bold text-yellow-700">0</p>
          </div>
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="text-sm text-green-600">Low</p>
            <p className="mt-1 text-2xl font-bold text-green-700">0</p>
          </div>
        </div>
        <div className="mt-8 rounded-lg border bg-white p-8 text-center text-zinc-500">
          No findings yet. Upload a CSV or sync the KEV feed to get started.
        </div>
      </main>
    </div>
  );
}
