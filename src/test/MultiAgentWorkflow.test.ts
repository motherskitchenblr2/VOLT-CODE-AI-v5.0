import { describe, it, expect, vi, beforeEach } from "vitest";
import { triageTask, runOrchestration } from "../services/AgentWorkforce";

describe("triageTask - Task classification", () => {
  it("correctly triages syntax-related requests", () => {
    const res = triageTask("fix syntax errors and linter issues");
    expect(res.requiresLinter).toBe(true);
    expect(res.requiresSecurityScan).toBe(false);
    expect(res.subtasks).toContain(
      "Audit AST structure and verify JS/Python environment isolation",
    );
  });

  it("correctly triages security-related requests", () => {
    const res = triageTask("check for API credentials leak and secure keys");
    expect(res.requiresLinter).toBe(false);
    expect(res.requiresSecurityScan).toBe(true);
    expect(res.subtasks).toContain(
      "Scan for secret keys, eval statement vectors, and XSS leaks",
    );
  });

  it("correctly triages unit test requests", () => {
    const res = triageTask("write some unit assertions and verify results");
    expect(res.requiresTests).toBe(true);
    expect(res.subtasks).toContain(
      "Synthesize unit assertions and verification files",
    );
  });
});

describe("runOrchestration - Self-Correction Flow", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("orchestrates workers and returns success if consensus passes", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          fixedCode: 'print("hello")',
          issues: [],
          summary: "All checks passed",
        }),
    } as unknown as Response);

    const result = await runOrchestration(
      "clean some code syntax",
      'print("hello")',
      "test_user",
      { groq: "mock" },
      { language: "python" },
    );

    expect(result.success).toBe(true);
    expect(result.finalCode).toBe('print("hello")');
    expect(result.history.length).toBeGreaterThan(0);
    expect(result.subtasks.length).toBeGreaterThan(0);
  });
});
