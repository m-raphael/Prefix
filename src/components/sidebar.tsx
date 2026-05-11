import Link from "next/link";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/assets", label: "Assets" },
  { href: "/reports", label: "Reports" },
];

export function Sidebar({ current, isAdmin }: { current: string; isAdmin: boolean }) {
  return (
    <aside className="w-64 border-r bg-white p-6 shrink-0">
      <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
        Prefix
      </Link>
      <nav className="mt-8 flex flex-col gap-1">
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              current === href
                ? "bg-zinc-100 text-zinc-900"
                : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
            }`}
          >
            {label}
          </Link>
        ))}
        {isAdmin && (
          <Link
            href="/admin"
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              current === "/admin"
                ? "bg-zinc-100 text-zinc-900"
                : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
            }`}
          >
            Admin
          </Link>
        )}
      </nav>
    </aside>
  );
}
