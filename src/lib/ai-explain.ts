import { prisma } from "./db";
import { llmComplete } from "./llm";

const CACHE_TTL_DAYS = 30;

type ExplainResult = {
  summary: string;
  remediation: string;
  cached: boolean;
};

export async function explainCve(
  cve: string,
  organizationId: string,
  context?: { hostname?: string; service?: string; fixedVersion?: string | null }
): Promise<ExplainResult> {
  const vuln = await prisma.vulnerability.findFirst({
    where: { cve, organizationId },
  });

  if (!vuln) throw new Error(`CVE ${cve} not found`);

  const stale =
    !vuln.aiUpdatedAt ||
    Date.now() - vuln.aiUpdatedAt.getTime() > CACHE_TTL_DAYS * 86_400_000;

  if (vuln.aiSummary && vuln.aiRemediation && !stale) {
    return { summary: vuln.aiSummary, remediation: vuln.aiRemediation, cached: true };
  }

  const ctxLines = [
    context?.hostname ? `Affected host: ${context.hostname}` : null,
    context?.service ? `Service: ${context.service}` : null,
    context?.fixedVersion ? `Known fix version: ${context.fixedVersion}` : null,
    vuln.cvss != null ? `CVSS score: ${vuln.cvss}` : null,
    vuln.kevFlag ? `This CVE is in the CISA Known Exploited Vulnerabilities catalog.` : null,
    vuln.description ? `Database description: ${vuln.description}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const prompt = `You are a cybersecurity analyst assistant. Given the following vulnerability information, provide:
1. A plain-language explanation (2-3 sentences) of what this vulnerability is and why it matters. Avoid jargon. Write for a non-technical stakeholder.
2. Concrete remediation steps (3-5 bullet points) specific to the context provided.

Vulnerability: ${cve}
${ctxLines}

Respond in this exact JSON format:
{
  "summary": "...",
  "remediation": "..."
}
Only return the JSON object. No markdown fences.`;

  const response = await llmComplete({
    messages: [{ role: "user", content: prompt }],
    maxTokens: 512,
    temperature: 0.2,
  });

  let summary = "";
  let remediation = "";

  try {
    const parsed = JSON.parse(response.content.trim());
    summary = parsed.summary ?? "";
    remediation = parsed.remediation ?? "";
  } catch {
    summary = response.content.trim().slice(0, 500);
    remediation = "See vendor advisory for remediation guidance.";
  }

  await prisma.vulnerability.update({
    where: { id: vuln.id },
    data: { aiSummary: summary, aiRemediation: remediation, aiUpdatedAt: new Date() },
  });

  return { summary, remediation, cached: false };
}
