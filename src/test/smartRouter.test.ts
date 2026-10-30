import { describe, it, expect } from "vitest";
import { classifyTask, smartRoute, type SmartModel } from "../lib/smartRouter";

const OR = { provider: "OpenRouter", models: [{ id: "cohere/north-mini-code:free", name: "North Mini Code (free)", provider: "OpenRouter" as const, tier: "FREE" as const, context: 256000 }, { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet", provider: "OpenRouter" as const, tier: "PAID" as const, context: 200000 }] };
const GROQ = { provider: "Groq", models: [{ id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B", provider: "Groq" as const, tier: "FREE" as const, context: 128000 }] };

describe("smartRouter", () => {
  it("classifies tasks", () => {
    expect(classifyTask("autonomous", "Code Analysis")).toBe("code");
    expect(classifyTask("assist", "Logic & Reasoning")).toBe("reasoning");
    expect(classifyTask("chat", "Chat")).toBe("chat");
    expect(classifyTask("autonomous", "Security Audit")).toBe("review");
  });

  it("routes code to OpenRouter free model when connected", () => {
    const r = smartRoute("code", [GROQ, OR]);
    expect(r?.provider).toBe("OpenRouter");
    expect(r?.model.id).toBe("cohere/north-mini-code:free");
  });

  it("never routes to paid when free exists", () => {
    const r = smartRoute("code", [OR]);
    expect(r?.model.tier).toBe("FREE");
  });

  it("falls back to any connected free model", () => {
    const r = smartRoute("code", [GROQ]);
    expect(r?.provider).toBe("Groq");
    expect(r?.model.id).toBe("llama-3.3-70b-versatile");
  });

  it("returns null with no connected providers", () => {
    expect(smartRoute("code", [])).toBeNull();
  });
});
