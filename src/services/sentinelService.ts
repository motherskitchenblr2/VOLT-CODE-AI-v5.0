/**
 * Sentinel service — SkillSpector integration.
 *
 * Two execution pathways:
 *  a) Direct MCP / local subprocess — `skillspector mcp`, gated behind
 *     VITE_SENTINEL_MCP (not installed by default; gracefully falls back).
 *  b) Native TypeScript static analyzers — always available, instant,
 *     in-browser feedback (the default 24/7 engine).
 *
 * Also exports `handleSentinelScan`, the HTTP-bridge handler shape for
 * `/api/sentinel/scan` (JSON payload { code, language, context } → structured
 * findings). This app is a Vite SPA with no backend server, so the handler is
 * exported for server-side mounting; it can also be called directly.
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

function mcpEnabled(): boolean {
  try {
    return (
      typeof import.meta !== "undefined" &&
      (import.meta as { env?: Record<string, string> }).env
        ?.VITE_SENTINEL_MCP === "true"
    );
  } catch {
    return false;
  }
}

async function skillspectorMcpScan(
  _code: string,
  _language: string,
  _context?: object,
): Promise<SentinelScanResult> {
  // Placeholder for `skillspector mcp` integration. Not installed by default.
  throw new Error(
    "skillspector mcp not configured (set VITE_SENTINEL_MCP=true)",
  );
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
 * Defaults to the native static analyzers; uses `skillspector mcp` only when
 * explicitly enabled via VITE_SENTINEL_MCP.
 */
export async function inspectBuffer(
  code: string,
  language: string,
  context?: object,
): Promise<SentinelScanResult> {
  if (mcpEnabled()) {
    try {
      return await skillspectorMcpScan(code, language, context);
    } catch {
      // Fall through to local analyzers on any MCP failure.
    }
  }
  return localScan(code);
}

/**
 * HTTP bridge handler for `/api/sentinel/scan`.
 * Accepts { code, language, context } and returns structured findings
 * (rule_id, severity, confidence, location, message, suggested_patch).
 */
export function handleSentinelScan(payload: {
  code?: string;
  language?: string;
  context?: object;
}): SentinelScanResult {
  const code = payload.code ?? "";
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

export default { inspectBuffer, handleSentinelScan };
