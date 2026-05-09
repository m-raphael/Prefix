import { auth as clerkAuth } from "@clerk/nextjs/server";
import { prisma } from "./db";

export type AuthContext = {
  userId: string;
  clerkId: string;
  role: string;
  organizationId: string;
};

export async function getAuthContext(): Promise<AuthContext | null> {
  const { userId: clerkId } = await clerkAuth();
  if (!clerkId) return null;

  const user = await prisma.user.findUnique({
    where: { clerkId },
  });

  if (!user) return null;

  return {
    userId: user.id,
    clerkId: user.clerkId,
    role: user.role,
    organizationId: user.organizationId,
  };
}

export async function requireAuth(): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx) {
    throw new Error("Unauthorized");
  }
  return ctx;
}

export async function requireAdmin(): Promise<AuthContext> {
  const ctx = await requireAuth();
  if (ctx.role !== "admin") {
    throw new Error("Forbidden");
  }
  return ctx;
}
