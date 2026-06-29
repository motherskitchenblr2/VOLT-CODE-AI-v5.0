import { describe, it, expect } from 'vitest';
import { SeniorQATesterAgent } from '../services/AgentWorkforce';

describe('SeniorQATesterAgent - Python Guardrails', () => {
  const agent = new SeniorQATesterAgent();

  it('allows valid python code', async () => {
    const validPython = `
def process_data(session_data):
    role = session_data["role"]
    if role == "admin":
        return True
    return False
`;
    const result = await agent.verify(validPython, { language: 'python' });
    expect(result.passed).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(85);
    expect(result.feedback.length).toBe(0);
  });

  it('rejects python code containing const keyword', async () => {
    const invalidPython = `
def process_data(session_data):
    const role = session_data["role"]
    if role == "admin":
        return True
    return False
`;
    const result = await agent.verify(invalidPython, { language: 'python' });
    expect(result.passed).toBe(false);
    expect(result.score).toBe(0);
    expect(result.feedback.some(f => f.includes('Python code contains out-of-bounds JS syntax'))).toBe(true);
  });

  it('rejects python code containing === accessor', async () => {
    const invalidPython = `
def process_data(session_data):
    role = session_data["role"]
    if role === "admin":
        return True
    return False
`;
    const result = await agent.verify(invalidPython, { language: 'python' });
    expect(result.passed).toBe(false);
    expect(result.score).toBe(0);
    expect(result.feedback.some(f => f.includes('==='))).toBe(true);
  });

  it('rejects python code containing JS function definition', async () => {
    const invalidPython = `
function process_data(session_data) {
    let role = session_data["role"]
    if (role === "admin") {
        return true
    }
    return false
}
`;
    const result = await agent.verify(invalidPython, { language: 'python' });
    expect(result.passed).toBe(false);
    expect(result.score).toBe(0);
  });
});
