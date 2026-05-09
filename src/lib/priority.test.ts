import { describe, it, expect } from "vitest";
import { scoreFinding } from "./priority";

function asset(overrides: Partial<{ internetFacing: boolean }> = {}) {
  return { internetFacing: true, ...overrides };
}

function vuln(overrides: Partial<{ kevFlag: boolean; cvss: number | null; fixedVersion: string | null }> = {}) {
  return { kevFlag: false, cvss: null, fixedVersion: null, ...overrides };
}

describe("scoreFinding", () => {
  // Tier 1 — Critical
  it("marks KEV findings as critical regardless of other factors", () => {
    expect(scoreFinding(asset(), vuln({ kevFlag: true, cvss: 0 }))).toBe("critical");
    expect(scoreFinding(asset(), vuln({ kevFlag: true, cvss: 9.8 }))).toBe("critical");
    expect(scoreFinding(asset({ internetFacing: false }), vuln({ kevFlag: true, cvss: 9.8 }))).toBe("critical");
  });

  // Tier 2 — High
  it("marks CVSS >= 9.0 + internet-facing as high", () => {
    expect(scoreFinding(asset(), vuln({ cvss: 9.0 }))).toBe("high");
    expect(scoreFinding(asset(), vuln({ cvss: 10.0 }))).toBe("high");
  });

  it("does not mark CVSS >= 9.0 + internal as high", () => {
    expect(scoreFinding(asset({ internetFacing: false }), vuln({ cvss: 9.8 }))).toBe("medium");
  });

  // Tier 3 — Medium
  it("marks CVSS >= 7.0 as medium", () => {
    expect(scoreFinding(asset(), vuln({ cvss: 7.0 }))).toBe("medium");
    expect(scoreFinding(asset(), vuln({ cvss: 8.9 }))).toBe("medium");
  });

  it("marks findings with a known fix as medium", () => {
    expect(scoreFinding(asset(), vuln({ cvss: 5.0, fixedVersion: "1.2.3" }))).toBe("medium");
  });

  it("marks findings with OSV fixed version as medium", () => {
    expect(scoreFinding(asset(), vuln({ cvss: 5.0 }), { fixedVersion: "2.0.0" })).toBe("medium");
  });

  // Tier 4 — Low
  it("marks CVSS < 7.0 with no fix as low", () => {
    expect(scoreFinding(asset(), vuln({ cvss: 6.9 }))).toBe("low");
    expect(scoreFinding(asset(), vuln({ cvss: 0.0 }))).toBe("low");
    expect(scoreFinding(asset(), vuln({ cvss: null }))).toBe("low");
  });

  it("marks internal-only low-CVSS as low", () => {
    expect(scoreFinding(asset({ internetFacing: false }), vuln({ cvss: 5.0 }))).toBe("low");
  });

  // Edge cases
  it("handles missing CVSS gracefully", () => {
    expect(scoreFinding(asset(), vuln({ cvss: null }))).toBe("low");
    expect(scoreFinding(asset(), vuln({ cvss: undefined }))).toBe("low");
  });

  it("prefers critical over high when both KEV and high CVSS", () => {
    expect(scoreFinding(asset(), vuln({ kevFlag: true, cvss: 10.0 }))).toBe("critical");
  });
});
