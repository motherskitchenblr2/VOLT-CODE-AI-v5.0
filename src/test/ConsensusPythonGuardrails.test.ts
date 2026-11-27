import { describe, it, expect } from "vitest";
import { rules } from "../services/AgentWorkforce";

const qaRule = rules.find((r) => r.name === "Senior QA Tester Specialist")!;

describe("QA Rule - Python Guardrails", () => {
  it("allows valid python code", async () => {
    const validPython = `
def process_data(session_data):
    role = session_data["role"]
    if role == "admin":
        return True
    return False
`;
    const result = await qaRule.fn(validPython, { language: "python" });
    expect(result.passed).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(85);
    expect(result.feedback.length).toBe(0);
  });

  it("rejects python code containing const keyword", async () => {
    const invalidPython = `
def process_data(session_data):
    const role = session_data["role"]
    if role == "admin":
        return True
    return False
`;
    const result = await qaRule.fn(invalidPython, { language: "python" });
    expect(result.passed).toBe(false);
    expect(result.score).toBe(0);
    expect(
      result.feedback.some((f: string) =>
        f.includes("Python code contains out-of-bounds JS syntax"),
      ),
    ).toBe(true);
  });

  it("rejects python code containing === accessor", async () => {
    const invalidPython = `
def process_data(session_data):
    role = session_data["role"]
    if role === "admin":
        return True
    return False
`;
    const result = await qaRule.fn(invalidPython, { language: "python" });
    expect(result.passed).toBe(false);
    expect(result.score).toBe(0);
    expect(result.feedback.some((f: string) => f.includes("==="))).toBe(true);
  });

  it("rejects python code containing JS function definition", async () => {
    const invalidPython = `
function process_data(session_data) {
    let role = session_data["role"]
    if (role === "admin") {
        return true
    }
    return false
}
`;
    const result = await qaRule.fn(invalidPython, { language: "python" });
    expect(result.passed).toBe(false);
    expect(result.score).toBe(0);
  });
});
