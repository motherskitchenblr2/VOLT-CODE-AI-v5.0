/**
 * SkillSpector rule subset: dangerous dynamic execution.
 * Matches eval(), new Function(), vm.runInContext() — all attacker-controllable
 * code paths. Neutralizing the call is a deterministic, safe auto-fix.
 */
import { runRules, type RuleDef, type ScanFinding } from "./index";

const AST_EXECUTION_RULES: RuleDef[] = [
  {
    re: /\beval\s*\(/g,
    rule: "ast-execution-eval",
    severity: "CRITICAL",
    confidence: 0.95,
    message: "Dynamic code execution via eval() is blocked by Sentinel.",
    fixed: "/* Sentinel blocked dynamic eval() execution */",
  },
  {
    re: /\bnew\s+Function\s*\(/g,
    rule: "ast-execution-new-function",
    severity: "CRITICAL",
    confidence: 0.95,
    message:
      "Dynamic code execution via new Function() is blocked by Sentinel.",
    fixed: "/* Sentinel blocked dynamic new Function() execution */",
  },
  {
    re: /\bvm\.runInContext\s*\(/g,
    rule: "ast-execution-vm-runincontext",
    severity: "CRITICAL",
    confidence: 0.95,
    message:
      "Dynamic code execution via vm.runInContext() is blocked by Sentinel.",
    fixed: "/* Sentinel blocked dynamic vm.runInContext() execution */",
  },
];

export function astExecution(code: string): ScanFinding[] {
  return runRules(code, AST_EXECUTION_RULES);
}
