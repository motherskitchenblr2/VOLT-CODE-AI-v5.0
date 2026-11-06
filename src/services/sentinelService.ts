/**
 * Sentinel service — native static analyzers only.
 * No MCP/subprocess dependency. Instant, in-browser feedback.
 */
import {
  analyzeCodeBuffer,
  computeRiskScore,
  riskLevel,
  type RiskLevel,
  type ScanFinding,
} from "../lib/sentinel/analyzers";

export interface SentinelScanResult {
  findings: ScanFinding[];
  riskScore: number;
  level: RiskLevel;
  summary: string;
  scannedAt: string;
}

function localScan(code: string): SentinelScanResult {
  const findings = analyzeCodeBuffer(code);
  const riskScore = computeRiskScore(findings);
  const level = riskLevel(riskScore);
  const summary =
    findings.length === 0
      ? "No SkillSpector findings."
      : `${findings.length} finding(s), risk ${riskScore}/100`;
  return {
    findings,
    riskScore,
    level,
    summary,
    scannedAt: new Date().toISOString(),
  };
}

/**
 * Inspect the active editor buffer. Returns structured findings + risk score.
 */
export async function inspectBuffer(
  code: string,
  _language: string,
  _context?: object,
): Promise<SentinelScanResult> {
  return localScan(code);
}

/**
 * HTTP bridge handler for `/api/sentinel/scan`.
 * Accepts { code, language, context } and returns structured findings.
 */
export function handleSentinelScan(payload: {
  code?: string;
  language?: string;
  context?: object;
}): SentinelScanResult {
  const code = payload.code ?? "";
  return localScan(code);
}

export default { inspectBuffer, handleSentinelScan };