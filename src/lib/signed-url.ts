import { createHmac, timingSafeEqual } from "crypto";

const SECRET = process.env.REPORT_SECRET ?? process.env.CLERK_SECRET_KEY ?? "dev-secret";

export type SignedReportPayload = {
  orgId: string;
  type: "pdf" | "csv";
  from?: string;
  to?: string;
  exp: number;
};

export function signReportToken(payload: Omit<SignedReportPayload, "exp">, ttlSeconds = 604800): string {
  const full: SignedReportPayload = { ...payload, exp: Math.floor(Date.now() / 1000) + ttlSeconds };
  const data = Buffer.from(JSON.stringify(full)).toString("base64url");
  const sig = createHmac("sha256", SECRET).update(data).digest("base64url");
  return `${data}.${sig}`;
}

export function verifyReportToken(token: string): SignedReportPayload {
  const dot = token.lastIndexOf(".");
  if (dot === -1) throw new Error("Invalid token");

  const data = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac("sha256", SECRET).update(data).digest("base64url");

  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    throw new Error("Invalid token signature");
  }

  const payload: SignedReportPayload = JSON.parse(Buffer.from(data, "base64url").toString());

  if (Math.floor(Date.now() / 1000) > payload.exp) {
    throw new Error("Token expired");
  }

  return payload;
}
