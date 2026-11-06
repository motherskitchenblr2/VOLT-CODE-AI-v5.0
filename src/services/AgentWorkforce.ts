export interface AgentMessage {
  sender: string;
  role: "system" | "user" | "assistant";
  content: string;
}

export interface VerificationResult {
  passed: boolean;
  score: number; // 0 to 100
  feedback: string[];
}

export interface VerifyContext {
  language?: string;
  filePath?: string;
}

export abstract class SeniorAgent {
  constructor(
    public name: string,
    public focusArea: string,
    public weight: number,
  ) {}
  abstract verify(
    code: string,
    context?: VerifyContext,
  ): Promise<VerificationResult>;
}

// 1. Senior Security Specialist
export class SeniorSecurityAgent extends SeniorAgent {
  constructor() {
    super("Senior Security Specialist", "Vulnerabilities & Key Leakage", 0.35);
  }
  async verify(code: string): Promise<VerificationResult> {
    const feedback: string[] = [];
    let score = 100;
    if (code.match(/sk-or-|gsk_|nvapi-|hf_/i)) {
      feedback.push(
        "[SECURITY] Unencrypted API credentials leak path identified inside source file.",
      );
      score -= 40;
    }
    if (code.includes("eval(")) {
      feedback.push("[SECURITY] Unsafe eval() execution vector detected.");
      score -= 30;
    }
    if (code.includes("dangerouslySetInnerHTML")) {
      feedback.push(
        "[SECURITY] React dangerouslySetInnerHTML used. Validate sanitization parameters.",
      );
      score -= 15;
    }
    return { passed: score >= 70, score, feedback };
  }
}

// 2. Senior QA Tester Specialist (Python guardrails)
export class SeniorQATesterAgent extends SeniorAgent {
  constructor() {
    super("Senior QA Tester Specialist", "Types & Test Assertions", 0.25);
  }
  async verify(
    code: string,
    context?: VerifyContext,
  ): Promise<VerificationResult> {
    const feedback: string[] = [];
    let score = 100;
    if (code.includes("any") && !code.includes("eslint-disable")) {
      feedback.push(
        '[QA] Loose typing: Implicit "any" type detected. Enforce strict typescript bounds.',
      );
      score -= 15;
    }
    if (code.includes("console.log") && !code.includes("console.error")) {
      feedback.push(
        "[QA] Development residue: console.log should be cleaned before production deployments.",
      );
      score -= 5;
    }
    const isPython =
      context?.language === "python" ||
      (context?.filePath && context.filePath.endsWith(".py")) ||
      ((code.includes("def ") || code.includes("import ")) &&
        code.includes(":") &&
        !code.includes("const ") &&
        !code.includes("function "));
    if (isPython) {
      const forbidden = ["const ", "let ", "function ", "require(", "==="];
      const found = forbidden.filter((k) => code.includes(k));
      if (found.length > 0) {
        feedback.push(
          `[QA] [CRITICAL] Python code contains out-of-bounds JS syntax keywords: ${found.map((f) => f.trim()).join(", ")}`,
        );
        score = 0;
      }
    }
    return { passed: score >= 85, score, feedback };
  }
}

// 3. Senior UI/UX Specialist
export class SeniorUIAgent extends SeniorAgent {
  constructor() {
    super("Senior UI/UX Specialist", "Stylesheet Specificity & Overflows", 0.2);
  }
  async verify(code: string): Promise<VerificationResult> {
    const feedback: string[] = [];
    let score = 100;
    if ((code.match(/!important/g) || []).length > 5) {
      feedback.push(
        "[UI/UX] Specificity inflating warning: Excessive !important markers found.",
      );
      score -= 20;
    }
    if (code.includes("overflow: hidden") && !code.includes("scroll")) {
      feedback.push(
        "[UI/UX] Layout concern: overflow: hidden added without scroll container validation.",
      );
      score -= 10;
    }
    return { passed: score >= 80, score, feedback };
  }
}

// 4. Senior Architect Specialist
export class SeniorArchitectAgent extends SeniorAgent {
  constructor() {
    super(
      "Senior Architect Specialist",
      "Dependencies & Circular Imports",
      0.2,
    );
  }
  async verify(
    _code: string,
    _context?: VerifyContext,
  ): Promise<VerificationResult> {
    const feedback: string[] = [];
    const score = 100;
    // # ponytail: circular dependency detection requires AST/module graph; ceiling: no auto-detect, upgrade: integrate madge or ts-circular-analyzer
    return { passed: score >= 70, score, feedback };
  }
}

// Consensus calculator over the four senior agents.
export class ConsensusEngine {
  private agents: SeniorAgent[] = [
    new SeniorSecurityAgent(),
    new SeniorQATesterAgent(),
    new SeniorUIAgent(),
    new SeniorArchitectAgent(),
  ];

  public async evaluateCodePatch(code: string, context?: VerifyContext) {
    let compositeScore = 0;
    const agentBreakdown: Record<string, number> = {};
    const compiledFeedback: string[] = [];
    for (const agent of this.agents) {
      const res = await agent.verify(code, context);
      const weightedContribution = res.score * agent.weight;
      compositeScore += weightedContribution;
      agentBreakdown[agent.name] = res.score;
      if (res.feedback.length > 0) compiledFeedback.push(...res.feedback);
    }
    const passed = compositeScore >= 90;
    return {
      passed,
      compositeScore: Math.round(compositeScore),
      agentBreakdown,
      compiledFeedback,
    };
  }
}

// Dynamic junior worker that calls the /api/openrouter endpoint.
export class JuniorWorker {
  constructor(
    public id: string,
    public specialty: "CodeGenerator" | "TestWriter" | "LinterFixer",
  ) {}
  public async execute(
    taskDescription: string,
    code: string,
    keys: Record<string, string>,
  ) {
    const response = await fetch("/api/openrouter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        language: "auto",
        model: "llama-3.3-70b-versatile",
        skill:
          this.specialty === "CodeGenerator"
            ? "Patch Generator"
            : "Syntax Repair",
        plugin:
          this.specialty === "TestWriter" ? "Test Runner" : "Repo Scanner",
        customPrompt: `Task: ${taskDescription}. Generate clean modifications.`,
        keys,
      }),
    });
    if (!response.ok)
      throw new Error(
        `Junior Worker failed execution: HTTP ${response.status}`,
      );
    const data = await response.json();
    return data.fixedCode || code;
  }
}

// Triage agent — classifies tasks, no network.
export class TriageAgent {
  public triage(taskDescription: string) {
    const desc = (taskDescription || "").toLowerCase();
    const subtasks: string[] = ["Generate primary code patch"];
    let requiresLinter = false;
    let requiresSecurityScan = false;
    let requiresTests = false;
    if (
      desc.includes("syntax") ||
      desc.includes("linter") ||
      desc.includes("fix") ||
      desc.includes("error")
    ) {
      requiresLinter = true;
      subtasks.push(
        "Audit AST structure and verify JS/Python environment isolation",
      );
    }
    if (
      desc.includes("security") ||
      desc.includes("leak") ||
      desc.includes("key") ||
      desc.includes("credentials") ||
      desc.includes("safe")
    ) {
      requiresSecurityScan = true;
      subtasks.push(
        "Scan for secret keys, eval statement vectors, and XSS leaks",
      );
    }
    if (
      desc.includes("test") ||
      desc.includes("verify") ||
      desc.includes("assert") ||
      desc.includes("check")
    ) {
      requiresTests = true;
      subtasks.push("Synthesize unit assertions and verification files");
    }
    return { requiresLinter, requiresSecurityScan, requiresTests, subtasks };
  }
}

export interface OrchestratorResult {
  success: boolean;
  finalCode: string;
  history: Array<{ attempt: number; score: number; feedback: string[] }>;
  subtasks: string[];
}

// Self-correction loop. logWorkflowTask is a no-op local log (no /api/database).
export class MultiAgentOrchestrator {
  private consensusEngine = new ConsensusEngine();
  private triageAgent = new TriageAgent();

  public async runOrchestration(
    taskDescription: string,
    originalCode: string,
    username: string,
    keys: Record<string, string>,
    context?: VerifyContext,
  ): Promise<OrchestratorResult> {
    const triageReport = this.triageAgent.triage(taskDescription);
    const history: Array<{
      attempt: number;
      score: number;
      feedback: string[];
    }> = [];
    this.logWorkflowTask(
      username,
      `triage_${Date.now()}`,
      "COMPLETED",
      `Triaged: subtasks = [${triageReport.subtasks.join(", ")}]`,
      context?.filePath || "unknown",
    );
    let currentCode = originalCode;
    let attempts = 0;
    let success = false;
    const maxAttempts = 3;
    while (attempts < maxAttempts) {
      attempts++;
      const currentAttemptId = `attempt_${attempts}_${Date.now()}`;
      this.logWorkflowTask(
        username,
        currentAttemptId,
        "RUNNING",
        `Starting patch generation attempt ${attempts}`,
        context?.filePath || "unknown",
      );
      const workers: Promise<string>[] = [];
      const generator = new JuniorWorker(
        `generator_${attempts}`,
        "CodeGenerator",
      );
      workers.push(
        generator.execute(
          `Attempt ${attempts}. Generate code to solve: ${taskDescription}. Previous feedback if any: ${history.map((h) => h.feedback.join(" ")).join(". ")}`,
          currentCode,
          keys,
        ),
      );
      if (triageReport.requiresLinter) {
        const linter = new JuniorWorker(`linter_${attempts}`, "LinterFixer");
        workers.push(
          linter.execute(
            `Ensure no syntax issues in: ${taskDescription}`,
            currentCode,
            keys,
          ),
        );
      }
      const results = await Promise.all(workers);
      const patchedCode = results[0];
      const evalResult = await this.consensusEngine.evaluateCodePatch(
        patchedCode,
        context,
      );
      history.push({
        attempt: attempts,
        score: evalResult.compositeScore,
        feedback: evalResult.compiledFeedback,
      });
      if (evalResult.passed) {
        currentCode = patchedCode;
        success = true;
        this.logWorkflowTask(
          username,
          currentAttemptId,
          "COMPLETED",
          `Consensus passed with score ${evalResult.compositeScore}/100`,
          context?.filePath || "unknown",
        );
        break;
      } else {
        currentCode = patchedCode;
        this.logWorkflowTask(
          username,
          currentAttemptId,
          "FAILED",
          `Consensus rejected with score ${evalResult.compositeScore}/100. Feedback: ${evalResult.compiledFeedback.join("; ")}`,
          context?.filePath || "unknown",
        );
      }
    }
    return {
      success,
      finalCode: currentCode,
      history,
      subtasks: triageReport.subtasks,
    };
  }

  private logWorkflowTask(
    username: string,
    taskId: string,
    status: string,
    logs: string,
    targetFile: string,
  ) {
    // No-op local audit log; no /api/database call (no backend in this SPA).
    console.log(`[WORKFLOW] ${taskId} ${status}: ${logs} (${targetFile})`);
  }
}
