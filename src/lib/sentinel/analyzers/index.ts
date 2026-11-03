/**
 * SkillSpector analyzer composition.
 * Runs every rule subset, de-duplicates by rule_id (one finding per rule per
 * scan to avoid noise), and computes the composite risk score.
 *
 * Weighting (SkillSpector): CRITICAL +50, HIGH +25, MEDIUM +10, LOW +5.
 * Score capped at 100.
 */
import { astExecution } from "./astExecution";
import { credentialLeak } from "./credentialLeak";
import { promptInjection } from "./promptInjection";

export interface ScanLocation {
  line: number;
  column: number;
}

export interface ScanFinding {
  rule_id: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  confidence: number;
  location: ScanLocation;
  message: string;
  original: string;
  fixed: string;
}

/** 1-based line + column of a character index in a string. */
export function lineColumnOf(code: string, index: number): ScanLocation {
  const before = code.slice(0, index);
  const line = before.split("\n").length;
  const lastNewline = before.lastIndexOf("\n");
  const column = lastNewline === -1 ? index + 1 : index - lastNewline;
  return { line, column };
}

const WEIGHT: Record<string, number> = {
  CRITICAL: 50,
  HIGH: 25,
  MEDIUM: 10,
  LOW: 5,
};

const ANALYZERS = [astExecution, credentialLeak, promptInjection];

export type RiskLevel = "green" | "yellow" | "red";

export function analyzeCodeBuffer(code: string): ScanFinding[] {
  const findings = ANALYZERS.flatMap((analyze) => analyze(code));
  const seen = new Set<string>();
  return findings.filter((f) => {
    if (seen.has(f.rule_id)) return false;
    seen.add(f.rule_id);
    return true;
  });
}

export function computeRiskScore(findings: ScanFinding[]): number {
  let score = 0;
  for (const f of findings) score += WEIGHT[f.severity] ?? 0;
  return Math.min(score, 100);
}

export function riskLevel(score: number): RiskLevel {
  if (score === 0) return "green";
  if (score < 50) return "yellow";
  return "red";
}

export function levelLabel(level: RiskLevel, findingCount: number): string {
  switch (level) {
    case "green":
      return `🟢 Sentinel Active (${findingCount} issues)`;
    case "yellow":
      return `🟡 Sentinel Alert (${findingCount} findings)`;
    case "red":
      return `🔴 Critical Risk Blocked`;
  }
}
