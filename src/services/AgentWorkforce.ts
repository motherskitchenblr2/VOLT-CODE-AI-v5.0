export interface AgentMessage {
  sender: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface VerificationResult {
  passed: boolean;
  score: number; // 0 to 100
  feedback: string[];
}

export abstract class SeniorAgent {
  constructor(
    public name: string,
    public focusArea: string,
    public weight: number // Weighted voting percentage (Gap 5)
  ) {}

  abstract verify(code: string, context?: any): Promise<VerificationResult>;
}

// 1. Senior Security Specialist
export class SeniorSecurityAgent extends SeniorAgent {
  constructor() {
    super('Senior Security Specialist', 'Vulnerabilities & Key Leakage', 0.35);
  }

  async verify(code: string): Promise<VerificationResult> {
    const feedback: string[] = [];
    let score = 100;

    if (code.match(/sk-or-|gsk_|nvapi-|hf_/i)) {
      feedback.push('[SECURITY] Unencrypted API credentials leak path identified inside source file.');
      score -= 40;
    }
    if (code.includes('eval(')) {
      feedback.push('[SECURITY] Unsafe eval() execution vector detected.');
      score -= 30;
    }
    if (code.includes('dangerouslySetInnerHTML')) {
      feedback.push('[SECURITY] React dangerouslySetInnerHTML used. Validate sanitization parameters.');
      score -= 15;
    }

    return { passed: score >= 70, score, feedback };
  }
}

// 2. Senior QA Tester Specialist
export class SeniorQATesterAgent extends SeniorAgent {
  constructor() {
    super('Senior QA Tester Specialist', 'Types & Test Assertions', 0.25);
  }

  async verify(code: string, context?: any): Promise<VerificationResult> {
    const feedback: string[] = [];
    let score = 100;

    if (code.includes('any') && !code.includes('eslint-disable')) {
      feedback.push('[QA] Loose typing: Implicit "any" type detected. Enforce strict typescript bounds.');
      score -= 15;
    }
    if (code.includes('console.log') && !code.includes('console.error')) {
      feedback.push('[QA] Development residue: console.log should be cleaned before production deployments.');
      score -= 5;
    }

    const isPython = (context?.language === 'python') || 
                     (context?.filePath && context.filePath.endsWith('.py')) ||
                     ((code.includes('def ') || code.includes('import ')) && code.includes(':') && !code.includes('const ') && !code.includes('function '));
    if (isPython) {
      const forbidden = ['const ', 'let ', 'function ', 'require(', '==='];
      const found = forbidden.filter(k => code.includes(k));
      if (found.length > 0) {
        feedback.push(`[QA] [CRITICAL] Python code contains out-of-bounds JS syntax keywords: ${found.map(f => f.trim()).join(', ')}`);
        score = 0; // Force reject
      }
    }

    return { passed: score >= 85, score, feedback };
  }
}

// 3. Senior UI/UX Specialist
export class SeniorUIAgent extends SeniorAgent {
  constructor() {
    super('Senior UI/UX Specialist', 'Stylesheet Specificity & Overflows', 0.20);
  }

  async verify(code: string): Promise<VerificationResult> {
    const feedback: string[] = [];
    let score = 100;

    if ((code.match(/!important/g) || []).length > 5) {
      feedback.push('[UI/UX] Specificity inflating warning: Excessive !important markers found.');
      score -= 20;
    }
    if (code.includes('overflow: hidden') && !code.includes('scroll')) {
      feedback.push('[UI/UX] Layout concern: overflow: hidden added without scroll container validation.');
      score -= 10;
    }

    return { passed: score >= 80, score, feedback };
  }
}

// 4. Senior Architect Specialist
export class SeniorArchitectAgent extends SeniorAgent {
  constructor() {
    super('Senior Architect Specialist', 'Dependencies & Circular Imports', 0.20);
  }

  async verify(code: string, context?: { circularCycles: number }): Promise<VerificationResult> {
    const feedback: string[] = [];
    let score = 100;

    if (context && context.circularCycles > 0) {
      feedback.push(`[ARCHITECTURE] Circular dependency loops identified inside module path context.`);
      score -= 30;
    }

    return { passed: score >= 70, score, feedback };
  }
}

// Consensus Calculator (Gap 5)
export class ConsensusEngine {
  private agents: SeniorAgent[] = [
    new SeniorSecurityAgent(),
    new SeniorQATesterAgent(),
    new SeniorUIAgent(),
    new SeniorArchitectAgent()
  ];

  public async evaluateCodePatch(code: string, context?: any): Promise<{
    passed: boolean;
    compositeScore: number;
    agentBreakdown: Record<string, number>;
    compiledFeedback: string[];
  }> {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('volt_consensus_weights');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          for (const agent of this.agents) {
            if (agent instanceof SeniorSecurityAgent && parsed.security !== undefined) agent.weight = parsed.security;
            if (agent instanceof SeniorQATesterAgent && parsed.qa !== undefined) agent.weight = parsed.qa;
            if (agent instanceof SeniorUIAgent && parsed.ui !== undefined) agent.weight = parsed.ui;
            if (agent instanceof SeniorArchitectAgent && parsed.arch !== undefined) agent.weight = parsed.arch;
          }
        } catch (e) {
          console.error('Failed to parse consensus weights:', e);
        }
      }
    }

    let compositeScore = 0;
    const agentBreakdown: Record<string, number> = {};
    const compiledFeedback: string[] = [];

    for (const agent of this.agents) {
      const res = await agent.verify(code, context);
      const weightedContribution = res.score * agent.weight;
      compositeScore += weightedContribution;
      agentBreakdown[agent.name] = res.score;
      
      if (res.feedback.length > 0) {
        compiledFeedback.push(...res.feedback);
      }
    }

    const passed = compositeScore >= 90; // Enforce strict 90% quality threshold
    return {
      passed,
      compositeScore: Math.round(compositeScore),
      agentBreakdown,
      compiledFeedback
    };
  }
}

// Dynamic Junior Worker
export class JuniorWorker {
  constructor(
    public id: string,
    public specialty: 'CodeGenerator' | 'TestWriter' | 'LinterFixer'
  ) {}

  public async execute(taskDescription: string, code: string, keys: Record<string, string>): Promise<string> {
    const response = await fetch('/api/openrouter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        language: 'auto',
        model: 'llama-3.3-70b-versatile',
        skill: this.specialty === 'CodeGenerator' ? 'Patch Generator' : 'Syntax Repair',
        plugin: this.specialty === 'TestWriter' ? 'Test Runner' : 'Repo Scanner',
        customPrompt: `Task: ${taskDescription}. Generate clean modifications.`,
        keys
      })
    });

    if (!response.ok) throw new Error(`Junior Worker failed execution: HTTP ${response.status}`);
    const data = await response.json();
    return data.fixedCode || code;
  }
}
