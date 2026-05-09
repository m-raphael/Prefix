import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Run a callback inside a Prisma transaction with RLS scoped to the given org.
 * Uses SET LOCAL so the session variable is transaction-scoped and safe with connection pooling.
 */
export async function withOrg<T>(organizationId: string, callback: (tx: PrismaClient) => Promise<T>): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await (tx as PrismaClient).$executeRawUnsafe(
      `SET LOCAL app.current_org_id = '${organizationId.replace(/'/g, "''")}'`
    );
    return callback(tx as PrismaClient);
  });
}
