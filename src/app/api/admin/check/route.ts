import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";

export async function GET() {
  const ctx = await getAuthContext();
  if (!ctx) {
    return NextResponse.json({ authenticated: false, admin: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, admin: ctx.role === "admin" });
}
