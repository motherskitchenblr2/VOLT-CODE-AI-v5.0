/**
 * Settings view — workspace backup, provider keys, gateway probe,
 * checkpoints, live provider availability, agent mode, sentinel,
 * token usage, theme, session import/export.
 *
 * Shared state (API keys, selectedModel, agentMode, etc.) comes from
 * VoltContext. App-owned state/handlers are passed as props.
 *
 * Built on design system tokens (design-system/volt-code-ai/MASTER.md).
 * All colors, spacing, shadows, and typography use --ds-* CSS variables.
 * Every button has cursor-pointer, focus-visible ring, and 200ms hover transition.
 * No emojis as icons — Lucide SVG only.
 */
import React from "react";
import { Download, RefreshCw } from "lucide-react";
import { AIProviderSelector } from "../AIProviderSelector";
import { useVolt } from "../../context/VoltContext";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Panel } from "../ui/Panel";
import { Input } from "../ui/Input";

interface Session {
  id: string;
  timestamp: string;
  language: string;
  originalCode: string;
  fixedCode: string;
  issues: Array<{
    id: number;
    type: string;
    severity: "Critical" | "High" | "Medium" | "Low";
    description: string;
    explanation: string;
    original: string;
    fixed: string;
  }>;
  summary: string;
  tokensUsed?: number;
  promptTokens?: number;
  completionTokens?: number;
  modelUsed?: string;
}

export interface SettingsViewProps {
  exportWorkspaceData: () => void;
  importWorkspaceData: (file: File) => void;
  createCheckpoint: (filePath: string, code: string) => Promise<string>;
  onRestoreCheckpoint: (checkpointId: string) => Promise<void>;
  lastCheckpointId: string | null;
  setLastCheckpointId: (id: string | null) => void;
  code: string;
  loadedFilePath: string;
  gatewayLoading: boolean;
  gatewayLogs: string[];
  gatewayQuery: (
    payload: { code: string; language: string; model: string; skill: string; plugin: string; customPrompt?: string },
    keys: { groqKey?: string; openrouterKey?: string; nvidiaKey?: string; huggingfaceKey?: string },
  ) => Promise<void>;
  refreshLiveProviders: () => void;
  liveProviderLoading: boolean;
  liveProviderUpdated: number | null;
  liveProviderAvailability: Array<{
    provider: string;
    label: string;
    connected: boolean;
    freeCount: number;
    paidCount: number;
  }>;
  vaultStored: boolean;
  vaultSyncState: "idle" | "saving" | "saved" | "error";
  debounceDelay: number;
  setDebounceDelay: (v: number) => void;
  autoApplyFixes: boolean;
  setAutoApplyFixes: (v: boolean) => void;
  enableSentinel: boolean;
  setEnableSentinel: (v: boolean) => void;
  showTokenUsage: boolean;
  setShowTokenUsage: (v: boolean) => void;
  sessions: Session[];
  setSessions: React.Dispatch<React.SetStateAction<Session[]>>;
  addLog: (msg: string, level?: "info" | "success" | "error" | "warn") => void;
  showToast: (msg: string, level?: "info" | "success" | "error" | "warn") => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  exportWorkspaceData,
  importWorkspaceData,
  createCheckpoint,
  onRestoreCheckpoint,
  lastCheckpointId,
  setLastCheckpointId,
  code,
  loadedFilePath,
  gatewayLoading,
  gatewayLogs,
  gatewayQuery,
  refreshLiveProviders,
  liveProviderLoading,
  liveProviderUpdated,
  liveProviderAvailability,
  vaultStored,
  vaultSyncState,
  debounceDelay,
  setDebounceDelay,
  autoApplyFixes,
  setAutoApplyFixes,
  enableSentinel,
  setEnableSentinel,
  showTokenUsage,
  setShowTokenUsage,
  sessions,
  setSessions,
  addLog,
  showToast,
}) => {
  const {
    selectedModel,
    setSelectedModel,
    openrouterKey,
    setOpenrouterKey,
    groqKey,
    setGroqKey,
    nvidiaKey,
    setNvidiaKey,
    huggingfaceKey,
    setHuggingfaceKey,
    selectedSkill,
    selectedPlugin,
    agentMode,
    setAgentMode,
  } = useVolt();

  const modelOptionsAll = [
    { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B", tag: "BALANCED", ctx: "128K", color: "#F97316", provider: "Groq", tier: "FREE" },
    { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B", tag: "FAST", ctx: "128K", color: "#60A5FA", provider: "Groq", tier: "FREE" },
    { id: "deepseek-r1-distill-llama-70b", name: "DeepSeek R1 Distill Llama 70B", tag: "REASONING", ctx: "128K", color: "#3B82F6", provider: "Groq", tier: "FREE" },
    { id: "gemma2-9b-it", name: "Gemma 2 9B", tag: "FAST", ctx: "8K", color: "#EF4444", provider: "Groq", tier: "FREE" },
    { id: "openrouter/auto", name: "OpenRouter Auto", tag: "BALANCED", ctx: "varies", color: "#FF5F00", provider: "OpenRouter", tier: "FREE" },
    { id: "qwen/qwen-2.5-coder-32b-instruct", name: "Qwen 2.5 Coder 32B", tag: "CODING", ctx: "32K", color: "#9333EA", provider: "OpenRouter", tier: "FREE" },
  ];

  const FREE_MODELS = modelOptionsAll.filter((m) => m.tier === "FREE");

  const toggleSwitch = (
    checked: boolean,
    onToggle: () => void,
  ) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={onToggle}
      className="w-16 h-8 text-xs font-bold"
    >
      {checked ? "ON" : "OFF"}
    </Button>
  );

  return (
    <Panel padded={true} className="p-4 sm:p-8 max-w-2xl mx-auto pb-24">
      <h1 className="text-2xl sm:text-3xl font-bold mb-8 text-[#F8FAFC]">SETTINGS</h1>
      <div className="space-y-6">
        {/* Workspace Backup */}
        <Card padded={true} elevated={false} className="border border-[var(--ds-color-border)] rounded-[var(--ds-radius-lg)]">
          <div className="text-lg font-bold mb-1 text-[#F8FAFC]">Workspace Backup</div>
          <p className="text-[10px] text-[#94A3B8] mb-4">
            Export or restore all sessions, todos, repo links and keys as a
            single JSON file. Keep it safe — it contains your API keys.
          </p>
          <div className="flex gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={exportWorkspaceData}
            >
              <Download className="w-4 h-4" />
              EXPORT BACKUP
            </Button>
            <button
              onClick={() => {
                const f = document.createElement("input");
                f.type = "file";
                f.accept = "application/json,.json";
                f.onchange = (e: Event) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) importWorkspaceData(file);
                  f.value = "";
                };
                f.click();
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border)] bg-[#334155]/20 text-[#94A3B8] text-xs font-bold cursor-pointer hover:bg-[#334155]/40 transition-all duration-200"
            >
              <RefreshCw className="w-4 h-4" />
              RESTORE BACKUP
            </button>
          </div>
        </Card>

        {/* Default Model */}
        <Card padded={true} elevated={false} className="border border-[var(--ds-color-border)] rounded-[var(--ds-radius-lg)]">
          <div className="text-lg font-bold mb-4 text-[#F8FAFC]">Default Model</div>
          <select
            value={selectedModel.id}
            onChange={(e) => {
              const model = FREE_MODELS.find((m) => m.id === e.target.value)!;
              setSelectedModel(model);
            }}
            className="w-full bg-[#1B2336] border border-[var(--ds-color-border)] rounded-[var(--ds-radius-lg)] px-4 py-2.5 text-sm font-mono text-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFFFFF] cursor-pointer"
          >
            {Array.from(new Set(FREE_MODELS.map((m) => m.provider))).map(
              (provider) => (
                <optgroup key={provider} label={provider}>
                  {FREE_MODELS.filter((m) => m.provider === provider).map(
                    (model) => (
                      <option key={model.id} value={model.id}>
                        {model.name} ({model.tag} • {model.ctx})
                      </option>
                    ),
                  )}
                </optgroup>
              ),
            )}
          </select>
        </Card>

        {/* Provider API Keys */}
        <Card padded={true} elevated={false} className="border border-[var(--ds-color-border)] rounded-[var(--ds-radius-lg)] space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-lg font-bold text-[#F8FAFC]">Provider API Keys</div>
            <div className="flex items-center gap-2">
              {vaultStored && (
                <span className="flex items-center gap-1 text-[10px] text-[#22C55E] font-semibold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] shadow-[0_0_6px_#22c55e]" />
                  Vault
                </span>
              )}
              {vaultSyncState === "saving" && (
                <span className="text-[10px] text-[#22C55E] font-semibold uppercase tracking-wider">
                  Syncing…
                </span>
              )}
              {vaultSyncState === "saved" && (
                <span className="text-[10px] text-[#22C55E] font-semibold uppercase tracking-wider">
                  Saved
                </span>
              )}
              {vaultSyncState === "error" && (
                <span className="text-[10px] text-[#EF4444] font-semibold uppercase tracking-wider">
                  Sync failed
                </span>
              )}
            </div>
          </div>
          <p className="text-[10px] text-[#94A3B8] -mt-2 mb-1">
            Keys are encrypted and stored in the MongoDB secret vault.
            Entering a key auto-syncs it to the vault.
          </p>
          <Input
            label="OpenRouter Key"
            value={openrouterKey}
            onChange={(e) => {
              setOpenrouterKey(e.target.value);
              localStorage.setItem("volt_openrouter_key", e.target.value);
            }}
            placeholder="sk-or-..."
            type="password"
          />
          <Input
            label="Groq Key"
            value={groqKey}
            onChange={(e) => {
              setGroqKey(e.target.value);
              localStorage.setItem("volt_groq_key", e.target.value);
            }}
            placeholder="gsk_..."
            type="password"
          />
          <Input
            label="NVIDIA Key"
            value={nvidiaKey}
            onChange={(e) => {
              setNvidiaKey(e.target.value);
              localStorage.setItem("volt_nvidia_key", e.target.value);
            }}
            placeholder="nvapi-..."
            type="password"
          />
          <Input
            label="HuggingFace Key"
            value={huggingfaceKey}
            onChange={(e) => {
              setHuggingfaceKey(e.target.value);
              localStorage.setItem("volt_huggingface_key", e.target.value);
            }}
            placeholder="hf_..."
            type="password"
          />
        </Card>

        {/* Gateway Console */}
        <Card padded={true} elevated={false} className="border border-[var(--ds-color-border)] rounded-[var(--ds-radius-lg)]">
          <div className="text-lg font-bold mb-2 text-[#F8FAFC]">Gateway Console</div>
          <p className="text-[11px] text-[#94A3B8] mb-3">
            Runs a probe through the provider fallback chain (skips
            providers without keys) and shows the routing log.
          </p>
          <Button
            variant="ghost"
            size="sm"
            disabled={gatewayLoading}
            onClick={async () => {
              await gatewayQuery(
                {
                  code: "// gateway probe",
                  language: "javascript",
                  model: selectedModel.id,
                  skill: selectedSkill,
                  plugin: selectedPlugin,
                },
                { groqKey, openrouterKey, nvidiaKey, huggingfaceKey },
              );
              addLog("Gateway probe finished", "info");
            }}
          >
            {gatewayLoading ? "PROBING..." : "RUN PROBE"}
          </Button>
          <div className="mt-3 max-h-40 overflow-y-auto space-y-1">
            {gatewayLogs.length === 0 && (
              <p className="text-[11px] text-[#94A3B8]">No gateway activity yet.</p>
            )}
            {gatewayLogs.slice(-20).map((l, i) => (
              <div key={i} className="text-[10px] font-mono text-[#94A3B8]">{l}</div>
            ))}
          </div>
        </Card>

        {/* Provider & Model Picker */}
        <Card padded={true} elevated={false} className="border border-[var(--ds-color-border)] rounded-[var(--ds-radius-lg)]">
          <div className="text-lg font-bold mb-2 text-[#F8FAFC]">Provider & Model Picker</div>
          <p className="text-[11px] text-[#94A3B8] mb-3">
            Pick a provider/model; matching live models apply to the engine.
          </p>
          <AIProviderSelector
            onProviderChange={(p) =>
              addLog(`Provider selected: ${p.name}`, "info")
            }
            onModelChange={(m) => {
              const hit = modelOptionsAll.find((x) => x.id === m.id);
              if (hit) setSelectedModel(hit);
              addLog(
                `Model selected: ${m.name}${hit ? " (live)" : " (catalog only)"}`,
                hit ? "success" : "info",
              );
            }}
          />
        </Card>

        {/* Workspace Checkpoints */}
        <Card padded={true} elevated={false} className="border border-[var(--ds-color-border)] rounded-[var(--ds-radius-lg)]">
          <div className="text-lg font-bold mb-2 text-[#F8FAFC]">Workspace Checkpoints</div>
          <p className="text-[11px] text-[#94A3B8] mb-3">
            Snapshot the editor before risky edits; restore any time.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                const id = await createCheckpoint(
                  loadedFilePath || "editor.txt",
                  code,
                );
                setLastCheckpointId(id);
                addLog(`Checkpoint created: ${id}`, "success");
              }}
            >
              CREATE CHECKPOINT
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={!lastCheckpointId}
              onClick={async () => {
                if (!lastCheckpointId) return;
                await onRestoreCheckpoint(lastCheckpointId);
                addLog(`Restored checkpoint ${lastCheckpointId}`, "success");
              }}
            >
              RESTORE LAST
            </Button>
            {lastCheckpointId && (
              <span className="text-[10px] font-mono text-[#94A3B8] self-center">
                {lastCheckpointId}
              </span>
            )}
          </div>
        </Card>

        {/* Live Provider Availability */}
        <Card padded={true} elevated={false} className="border border-[var(--ds-color-border)] rounded-[var(--ds-radius-lg)]">
          <div className="flex items-center justify-between mb-4">
            <div className="text-lg font-bold text-[#F8FAFC]">
              Live Provider Availability
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshLiveProviders}
              disabled={liveProviderLoading}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${liveProviderLoading ? "animate-spin" : ""}`} />
              {liveProviderLoading ? "Checking..." : "Refresh"}
            </Button>
          </div>
          {liveProviderUpdated && (
            <p className="text-[10px] text-[#94A3B8] mb-3 font-mono">
              Last checked:{" "}
              {new Date(liveProviderUpdated).toLocaleTimeString()} ·
              auto-refresh 30 min
            </p>
          )}
          {liveProviderAvailability.length === 0 ? (
            <p className="text-xs text-[#94A3B8]">
              No live model data yet. Press Refresh to load the model
              catalog from connected providers.
            </p>
          ) : (
            <div className="space-y-2">
              {[...liveProviderAvailability]
                .sort(
                  (a, b) =>
                    Number(b.connected) - Number(a.connected) ||
                    b.freeCount - a.freeCount,
                )
                .map((provider) => (
                  <div
                    key={provider.provider}
                    className="p-3 border border-[var(--ds-color-border)] rounded-[var(--ds-radius-lg)] flex items-center justify-between bg-[#1B2336]"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          provider.connected
                            ? "bg-[#22C55E] shadow-[0_0_8px_#22c55e]"
                            : "bg-[#EF4444]"
                        }`}
                      />
                      <span className="text-sm font-bold text-[#F8FAFC]">
                        {provider.label}
                      </span>
                      {provider.connected ? (
                        <span className="text-[10px] text-[#22C55E] font-semibold uppercase">
                          Connected
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#EF4444] font-semibold uppercase">
                          Offline
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] font-mono text-[#94A3B8]">
                      {provider.freeCount} free / {provider.paidCount} paid
                    </div>
                  </div>
                ))}
            </div>
          )}
        </Card>

        {/* Agent Mode Default */}
        <Card padded={true} elevated={false} className="border border-[var(--ds-color-border)] rounded-[var(--ds-radius-lg)]">
          <div className="text-lg font-bold mb-4 text-[#F8FAFC]">Agent Mode Default</div>
          <select
            value={agentMode}
            onChange={(e) => setAgentMode(e.target.value as string)}
            className="w-full bg-[#1B2336] border border-[var(--ds-color-border)] rounded-[var(--ds-radius-lg)] px-4 py-2.5 text-sm font-mono text-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFFFFF] cursor-pointer"
          >
            {["manual", "assist", "auto-syntax", "auto-debug", "team-review"].map(
              (mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ),
            )}
          </select>
        </Card>

        {/* Sentinel Debounce Delay */}
        <Card padded={true} elevated={false} className="border border-[var(--ds-color-border)] rounded-[var(--ds-radius-lg)]">
          <div className="text-lg font-bold mb-2 text-[#F8FAFC]">Sentinel Debounce Delay</div>
          <div className="text-sm text-[#22C55E] mb-3">
            Delay after typing before passive analysis runs: {debounceDelay} ms
          </div>
          <input
            type="range"
            min="100"
            max="2000"
            step="50"
            value={debounceDelay}
            onChange={(e) => setDebounceDelay(Number(e.target.value))}
            className="w-full accent-[#22C55E] bg-[#334155]/20 h-1.5 rounded-lg appearance-none cursor-pointer"
          />
        </Card>

        {/* Auto-Apply Fixes */}
        <Card padded={true} elevated={false} className="border border-[var(--ds-color-border)] rounded-[var(--ds-radius-lg)]">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-bold text-[#F8FAFC]">Auto-Apply Fixes</div>
              <div className="text-sm text-[#94A3B8] mt-1">
                Automatically apply all fixes without confirmation
              </div>
            </div>
            {toggleSwitch(autoApplyFixes, () => setAutoApplyFixes(!autoApplyFixes))}
          </div>
        </Card>

        {/* Sentinel Live Monitoring */}
        <Card padded={true} elevated={false} className="border border-[var(--ds-color-border)] rounded-[var(--ds-radius-lg)]">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-bold text-[#F8FAFC]">
                Sentinel Live Monitoring
              </div>
              <div className="text-sm text-[#94A3B8] mt-1">
                Enable real-time code monitoring watchdog
              </div>
            </div>
            {toggleSwitch(enableSentinel, () => setEnableSentinel(!enableSentinel))}
          </div>
        </Card>

        {/* Show Token Usage Panel */}
        <Card padded={true} elevated={false} className="border border-[var(--ds-color-border)] rounded-[var(--ds-radius-lg)]">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-bold text-[#F8FAFC]">
                Show Token Usage Panel
              </div>
              <div className="text-sm text-[#94A3B8] mt-1">
                Show prompt, completion, and cost estimates after runs
              </div>
            </div>
            {toggleSwitch(showTokenUsage, () => setShowTokenUsage(!showTokenUsage))}
          </div>
        </Card>

        {/* Theme */}
        <Card padded={true} elevated={false} className="border border-[var(--ds-color-border)] rounded-[var(--ds-radius-lg)]">
          <div className="text-lg font-bold mb-2 text-[#F8FAFC]">Theme</div>
          <div className="text-sm text-[#94A3B8] font-semibold">
            Charcoal Black + Neon Orange (locked)
          </div>
        </Card>

        {/* Session actions */}
        <Button
          variant="primary"
          size="md"
          onClick={() => {
            const dataStr =
              "data:text/json;charset=utf-8," +
              encodeURIComponent(JSON.stringify(sessions));
            const downloadAnchor = document.createElement("a");
            downloadAnchor.setAttribute("href", dataStr);
            downloadAnchor.setAttribute(
              "download",
              `volt-sessions-${Date.now()}.json`,
            );
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
            showToast("Sessions exported successfully!", "success");
          }}
          className="w-full px-6 py-4 rounded-[var(--ds-radius-lg)] border border-[var(--ds-color-border)] text-[#22C55E] font-bold hover:bg-[#22C55E]/20 transition-all mb-3 cursor-pointer"
        >
          EXPORT ALL SESSIONS (JSON)
        </Button>

        <Button
          variant="destructive"
          size="md"
          onClick={() => {
            localStorage.removeItem("codeSessions");
            setSessions([]);
            showToast("All sessions cleared!", "success");
          }}
          className="w-full px-6 py-4 rounded-[var(--ds-radius-lg)] text-[#EF4444] border border-[#EF4444]/40 font-bold hover:bg-[#EF4444]/20 transition-all cursor-pointer"
        >
          CLEAR ALL SESSIONS
        </Button>
      </div>
    </Panel>
  );
};
