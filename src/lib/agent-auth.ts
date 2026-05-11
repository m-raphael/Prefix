import { NextRequest } from "next/server";
import { prisma } from "./db";

export async function requireAgentAuth(req: NextRequest): Promise<{ organizationId: string }> {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) throw new Error("Unauthorized");

  const agentKey = process.env.AGENT_API_KEY;
  if (!agentKey || token !== agentKey) throw new Error("Unauthorized");

  const orgSlug = req.nextUrl.searchParams.get("org");
  if (!orgSlug) throw new Error("org query parameter required");

  const org = await prisma.organization.findUnique({ where: { slug: orgSlug } });
  if (!org) throw new Error("Organization not found");

  return { organizationId: org.id };
}
