export interface SmartModel {
  id: string;
  name: string;
  provider: "Groq" | "OpenRouter" | "NVIDIA" | "HuggingFace";
  tier: "FREE" | "PAID";
  context: number;
}

export type TaskKind = "code" | "reasoning" | "chat" | "review";

export function classifyTask(agentMode: string, skill: string): TaskKind {
  const s = `${agentMode} ${skill}`.toLowerCase();
  if (s.includes("reason") || s.includes("logic") || s.includes("architect")) return "reasoning";
  if (s.includes("review") || s.includes("security") || s.includes("audit") || s.includes("lint")) return "review";
  if (s.includes("chat") || s.includes("explain") || s.includes("meet")) return "chat";
  return "code";
}

const PREF: Record<TaskKind, string[]> = {
  code: ["OpenRouter", "Groq", "NVIDIA", "HuggingFace"],
  reasoning: ["OpenRouter", "Groq", "NVIDIA", "HuggingFace"],
  chat: ["Groq", "OpenRouter", "NVIDIA", "HuggingFace"],
  review: ["OpenRouter", "NVIDIA", "Groq", "HuggingFace"],
};

const KEYWORDS: Record<TaskKind, string[]> = {
  code: ["code", "coder", "deepseek", "qwen", "gpt", "north"],
  reasoning: ["reason", "think", "deepseek", "r1", "o1", "distill"],
  chat: ["chat", "llama", "gemma", "min", "north", "instruct"],
  review: ["security", "guard", "audit", "review", "judge", "safer"],
};

export interface RouteResult {
  provider: string;
  model: SmartModel;
  kind: TaskKind;
}

function score(m: SmartModel, kw: string[]): number {
  const hay = `${m.id} ${m.name}`.toLowerCase();
  let s = 0;
  for (const k of kw) if (hay.includes(k)) s++;
  return -s; // lower = better match (sorted ascending)
}

export function smartRoute(
  kind: TaskKind,
  providers: Array<{ provider: string; models: SmartModel[] }>,
): RouteResult | null {
  const connected = providers.filter((p) => p.models.length > 0);
  if (!connected.length) return null;
  for (const pref of PREF[kind]) {
    const p = connected.find((x) => x.provider === pref);
    if (!p) continue;
    const kw = KEYWORDS[kind];
    const scored = p.models
      .filter((m) => m.tier === "FREE")
      .sort((a, b) => score(a, kw) - score(b, kw) || b.context - a.context);
    if (scored.length) return { provider: p.provider, model: scored[0], kind };
  }
  const anyFree = connected
    .flatMap((p) => p.models.filter((m) => m.tier === "FREE").map((m) => ({ provider: p.provider, model: m })))
    .sort((a, b) => b.model.context - a.model.context);
  return anyFree.length ? { ...anyFree[0], kind } : null;
}
