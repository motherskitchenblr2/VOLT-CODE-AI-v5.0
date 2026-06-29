import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TriageAgent, MultiAgentOrchestrator } from '../services/AgentWorkforce';

describe('TriageAgent - Task classification', () => {
  const triage = new TriageAgent();

  it('correctly triages syntax-related requests', () => {
    const res = triage.triage('fix syntax errors and linter issues');
    expect(res.requiresLinter).toBe(true);
    expect(res.requiresSecurityScan).toBe(false);
    expect(res.subtasks).toContain('Audit AST structure and verify JS/Python environment isolation');
  });

  it('correctly triages security-related requests', () => {
    const res = triage.triage('check for API credentials leak and secure keys');
    expect(res.requiresLinter).toBe(false);
    expect(res.requiresSecurityScan).toBe(true);
    expect(res.subtasks).toContain('Scan for secret keys, eval statement vectors, and XSS leaks');
  });

  it('correctly triages unit test requests', () => {
    const res = triage.triage('write some unit assertions and verify results');
    expect(res.requiresTests).toBe(true);
    expect(res.subtasks).toContain('Synthesize unit assertions and verification files');
  });
});

describe('MultiAgentOrchestrator - Self-Correction Flow', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('orchestrates workers and returns success if consensus passes', async () => {
    // Mock the openrouter and database logWorkflowTask endpoints
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        fixedCode: 'print("hello")',
        issues: [],
        summary: 'All checks passed'
      })
    } as any);

    const orchestrator = new MultiAgentOrchestrator();
    const result = await orchestrator.runOrchestration(
      'clean some code syntax',
      'print("hello")',
      'test_user',
      { groq: 'mock' },
      { language: 'python' }
    );

    expect(result.success).toBe(true);
    expect(result.finalCode).toBe('print("hello")');
    expect(result.history.length).toBeGreaterThan(0);
    expect(result.subtasks.length).toBeGreaterThan(0);
  });
});
