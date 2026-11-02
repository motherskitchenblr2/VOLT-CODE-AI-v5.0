/**
 * SkillSpector rule subset: credential leaks.
 * Flags hardcoded keys/tokens and environment-token harvesting patterns.
 */
import { lineColumnOf, type ScanFinding } from "./index";

type SeverityType = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

const CREDENTIAL_PATTERNS: Array<{
  re: RegExp;
  rule: string;
  severity: SeverityType;
  message: string;
}> = [
  {
    re: /(?:sk-or-|gsk_|nvapi-|hf_)[A-Za-z0-9_-]{20,}/g,
    rule: "credential-llm-key",
    severity: "CRITICAL",
    message: "Hardcoded LLM API key detected in source. Rotate it and read from env/secrets.",
  },
  {
    re: /\b(?:AWS_SECRET_ACCESS_KEY|AWS_ACCESS_KEY_ID|GITHUB_TOKEN|GITHUB_PAT|NVIDIA_API_KEY|HUGGINGFACE_TOKEN)\b\s*[:=]\s*['"][A-Za-z0-9_.-]{8,}['"]/g,
    rule: "credential-hardcoded-secret",
    severity: "HIGH",
    message: "Hardcoded secret/token assigned to a variable. Do not commit credentials.",
  },
  {
    re: /process\.env\.([A-Z][A-Z_]+)/g,
    rule: "credential-env-access",
    severity: "MEDIUM",
    message: "Environment variable read; ensure secrets are never logged or exfiltrated.",
  },
  {
    re: /\.env\b/,
    rule: "credential-dotenv-reference",
    severity: "LOW",
    message: ".env reference detected. Never commit .env files to version control.",
  },
];

export function credentialLeak(code: string): ScanFinding[] {
  const findings: ScanFinding[] = [];
  for (const { re, rule, severity, message } of CREDENTIAL_PATTERNS) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(code))) {
      const { line, column } = lineColumnOf(code, m.index);
      findings.push({
        rule_id: rule,
        severity,
        confidence: rule === "credential-llm-key" || rule === "credential-hardcoded-secret" ? 0.9 : 0.6,
        location: { line, column },
        message,
        original: m[0],
        fixed: m[0], // no deterministic fix for credentials; read-only finding
      });
    }
  }
  return findings;
}
