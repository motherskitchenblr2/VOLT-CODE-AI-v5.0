/**
 * SkillSpector rule subset: prompt injection.
 * Scans agent-facing markdown/docstrings for instruction overrides and
 * system-prompt leakage attempts.
 */
import { runRules, type RuleDef, type ScanFinding } from "./index";

const PROMPT_INJECTION_RULES: RuleDef[] = [
  {
    re: /ignore\s+(?:all\s+)?previous\s+(?:instructions|commands|directives)/gi,
    rule: "prompt-injection-ignore-previous",
    severity: "HIGH",
    confidence: 0.75,
    message:
      "Prompt injection attempt: 'ignore previous instructions' override detected.",
    fixed: "",
  },
  {
    re: /disregard\s+(?:all\s+)?(?:prior|previous|above)\s+(?:instructions|rules)/gi,
    rule: "prompt-injection-disregard",
    severity: "HIGH",
    confidence: 0.75,
    message:
      "Prompt injection attempt: 'disregard prior instructions' override detected.",
    fixed: "",
  },
  {
    re: /system\s+prompt\s+leakage|leak\s+(?:the\s+)?system\s+prompt/gi,
    rule: "prompt-injection-system-leak",
    severity: "MEDIUM",
    confidence: 0.75,
    message: "Potential system-prompt leakage attempt detected.",
    fixed: "",
  },
  {
    re: /you\s+are\s+now\s+(?:a|an)\s+(?:different|new|DAN|developer)/gi,
    rule: "prompt-injection-role-shift",
    severity: "MEDIUM",
    confidence: 0.75,
    message: "Role-shift / jailbreak attempt detected.",
    fixed: "",
  },
];

export function promptInjection(code: string): ScanFinding[] {
  return runRules(code, PROMPT_INJECTION_RULES);
}
