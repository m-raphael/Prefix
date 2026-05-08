import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4">
      <div className="max-w-md text-center">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
          Prefix
        </h1>
        <p className="mt-4 text-lg text-zinc-600">
          A vulnerability prioritization engine for MSPs and security
          consultants. Stop guessing what to patch first.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/sign-up"
            className="rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Get Started
          </Link>
          <Link
            href="/sign-in"
            className="rounded-lg border border-zinc-300 px-6 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
