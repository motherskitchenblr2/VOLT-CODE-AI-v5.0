/**
 * SkillSpector rule subset: prompt injection.
 * Scans agent-facing markdown/docstrings for instruction overrides and
 * system-prompt leakage attempts.
 */
import { lineColumnOf, type ScanFinding } from "./index";

type SeverityType = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

const PROMPT_INJECTION_PATTERNS: Array<{
  re: RegExp;
  rule: string;
  severity: SeverityType;
  message: string;
}> = [
  {
    re: /ignore\s+(?:all\s+)?previous\s+(?:instructions|commands|directives)/gi,
    rule: "prompt-injection-ignore-previous",
    severity: "HIGH",
    message:
      "Prompt injection attempt: 'ignore previous instructions' override detected.",
  },
  {
    re: /disregard\s+(?:all\s+)?(?:prior|previous|above)\s+(?:instructions|rules)/gi,
    rule: "prompt-injection-disregard",
    severity: "HIGH",
    message:
      "Prompt injection attempt: 'disregard prior instructions' override detected.",
  },
  {
    re: /system\s+prompt\s+leakage|leak\s+(?:the\s+)?system\s+prompt/gi,
    rule: "prompt-injection-system-leak",
    severity: "MEDIUM",
    message: "Potential system-prompt leakage attempt detected.",
  },
  {
    re: /you\s+are\s+now\s+(?:a|an)\s+(?:different|new|DAN|developer)/gi,
    rule: "prompt-injection-role-shift",
    severity: "MEDIUM",
    message: "Role-shift / jailbreak attempt detected.",
  },
];

export function promptInjection(code: string): ScanFinding[] {
  const findings: ScanFinding[] = [];
  for (const { re, rule, severity, message } of PROMPT_INJECTION_PATTERNS) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(code))) {
      const { line, column } = lineColumnOf(code, m.index);
      findings.push({
        rule_id: rule,
        severity,
        confidence: 0.75,
        location: { line, column },
        message,
        original: m[0],
        fixed: m[0], // no deterministic fix; read-only finding
      });
    }
  }
  return findings;
}
