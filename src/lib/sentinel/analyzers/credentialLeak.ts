/**
 * SkillSpector rule subset: credential leaks.
 * Flags hardcoded keys/tokens and environment-token harvesting patterns.
 */
import { runRules, type RuleDef, type ScanFinding } from "./index";

const CREDENTIAL_RULES: RuleDef[] = [
  {
    re: /(?:sk-or-|gsk_|nvapi-|hf_)[A-Za-z0-9_-]{20,}/g,
    rule: "credential-llm-key",
    severity: "CRITICAL",
    confidence: 0.9,
    message:
      "Hardcoded LLM API key detected in source. Rotate it and read from env/secrets.",
    fixed: "",
  },
  {
    re: /\b(?:AWS_SECRET_ACCESS_KEY|AWS_ACCESS_KEY_ID|GITHUB_TOKEN|GITHUB_PAT|NVIDIA_API_KEY|HUGGINGFACE_TOKEN)\b\s*[:=]\s*['"][A-Za-z0-9_.-]{8,}['"]/g,
    rule: "credential-hardcoded-secret",
    severity: "HIGH",
    confidence: 0.9,
    message:
      "Hardcoded secret/token assigned to a variable. Do not commit credentials.",
    fixed: "",
  },
  {
    re: /process\.env\.([A-Z][A-Z_]+)/g,
    rule: "credential-env-access",
    severity: "MEDIUM",
    confidence: 0.6,
    message:
      "Environment variable read; ensure secrets are never logged or exfiltrated.",
    fixed: "",
  },
  {
    re: /\.env\b/,
    rule: "credential-dotenv-reference",
    severity: "LOW",
    confidence: 0.6,
    message:
      ".env reference detected. Never commit .env files to version control.",
    fixed: "",
  },
];

export function credentialLeak(code: string): ScanFinding[] {
  return runRules(code, CREDENTIAL_RULES);
}
