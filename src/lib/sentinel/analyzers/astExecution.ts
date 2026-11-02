/**
 * SkillSpector rule subset: dangerous dynamic execution.
 * Matches eval(), new Function(), vm.runInContext() — all attacker-controllable
 * code paths. Neutralizing the call is a deterministic, safe auto-fix.
 */
import { lineColumnOf, type ScanFinding } from "./index";

const DANGEROUS_CALLS: Array<{
  re: RegExp;
  rule: string;
  label: string;
  message: string;
}> = [
  {
    re: /\beval\s*\(/g,
    rule: "ast-execution-eval",
    label: "eval()",
    message: "Dynamic code execution via eval() is blocked by Sentinel.",
  },
  {
    re: /\bnew\s+Function\s*\(/g,
    rule: "ast-execution-new-function",
    label: "new Function()",
    message: "Dynamic code execution via new Function() is blocked by Sentinel.",
  },
  {
    re: /\bvm\.runInContext\s*\(/g,
    rule: "ast-execution-vm-runincontext",
    label: "vm.runInContext()",
    message: "Dynamic code execution via vm.runInContext() is blocked by Sentinel.",
  },
];

export function astExecution(code: string): ScanFinding[] {
  const findings: ScanFinding[] = [];
  for (const { re, rule, label, message } of DANGEROUS_CALLS) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(code))) {
      const { line, column } = lineColumnOf(code, m.index);
      findings.push({
        rule_id: rule,
        severity: "CRITICAL",
        confidence: 0.95,
        location: { line, column },
        message,
        original: m[0],
        fixed: `/* Sentinel blocked dynamic ${label} execution */`,
      });
    }
  }
  return findings;
}
