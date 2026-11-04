/**
 * Settings view — workspace backup, provider keys, gateway probe,
 * checkpoints, live provider availability, agent mode, sentinel,
 * token usage, theme, session import/export.
 *
 * Shared state (API keys, selectedModel, agentMode, etc.) comes from
 * VoltContext. App-owned state/handlers are passed as props.
 */
import React from "react";
import { Download, RefreshCw } from "lucide-react";
import { AIProviderSelector } from "../AIProviderSelector";
import { useVolt } from "../../context/VoltContext";

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
  // Backup/restore
  exportWorkspaceData: () => void;
  importWorkspaceData: (file: File) => void;
  // Checkpoints
  createCheckpoint: (filePath: string, code: string) => Promise<string>;
  onRestoreCheckpoint: (checkpointId: string) => Promise<void>;
  lastCheckpointId: string | null;
  setLastCheckpointId: (id: string | null) => void;
  code: string;
  loadedFilePath: string;
  // Gateway
  gatewayLoading: boolean;
  gatewayLogs: string[];
  gatewayQuery: (
    payload: { code: string; language: string; model: string; skill: string; plugin: string; customPrompt?: string },
    keys: { groqKey?: string; openrouterKey?: string; nvidiaKey?: string; huggingfaceKey?: string },
  ) => Promise<void>;
  // Live providers
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
  // UI state
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
  // Sessions
  sessions: Session[];
  setSessions: React.Dispatch<React.SetStateAction<Session[]>>;
  // Logging/toast
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
    <button
      onClick={onToggle}
      className={`w-16 h-8 rounded-full transition-all cursor-pointer ${
        checked ? "vol-acc-bg" : "vol-wash"
      }`}
    >
      <div
        className={`w-6 h-6 bg-white rounded-full transition-all ${
          checked ? "ml-9" : "ml-1"
        }`}
      />
    </button>
  );

  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto pb-24">
      <h1 className="text-2xl sm:text-3xl font-bold mb-8">SETTINGS</h1>
      <div className="space-y-6">
        {/* Workspace Backup */}
        <div className="border vol-ring rounded-xl p-6 vol-panel">
          <div className="text-lg font-bold mb-1">Workspace Backup</div>
          <p className="text-[10px] vol-t2 mb-4">
            Export or restore all sessions, todos, repo links and keys as a
            single JSON file. Keep it safe — it contains your API keys.
          </p>
          <div className="flex gap-3">
            <button
              onClick={exportWorkspaceData}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl vol-acc-bg text-black text-xs font-bold cursor-pointer"
            >
              <Download className="w-4 h-4" />
              EXPORT BACKUP
            </button>
            <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl vol-well border vol-ring-strong vol-accent text-xs font-bold cursor-pointer hover:vol-acc-wash">
              <RefreshCw className="w-4 h-4" />
              RESTORE BACKUP
              <input
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) importWorkspaceData(f);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        </div>

        {/* Default Model */}
        <div className="border vol-ring rounded-xl p-6 vol-panel">
          <div className="text-lg font-bold mb-4">Default Model</div>
          <select
            value={selectedModel.id}
            onChange={(e) => {
              const model = FREE_MODELS.find(
                (m) => m.id === e.target.value,
              )!;
              setSelectedModel(model);
            }}
            className="w-full vol-well border vol-ring-strong px-4 py-3 rounded vol-t1 cursor-pointer font-mono font-semibold"
          >
            {Array.from(new Set(FREE_MODELS.map((m) => m.provider))).map(
              (provider) => (
                <optgroup
                  key={provider}
                  label={provider}
                  className="vol-elev vol-accent font-bold"
                >
                  {FREE_MODELS.filter((m) => m.provider === provider).map(
                    (model) => (
                      <option
                        key={model.id}
                        value={model.id}
                        className="vol-elev vol-t1 font-normal"
                      >
                        {model.name} ({model.tag} • {model.ctx})
                      </option>
                    ),
                  )}
                </optgroup>
              ),
            )}
          </select>
        </div>

        {/* Provider API Keys */}
        <div className="border vol-ring rounded-xl p-6 vol-panel space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-lg font-bold">Provider API Keys</div>
            <div className="flex items-center gap-2">
              {vaultStored && (
                <span className="flex items-center gap-1 text-[10px] text-green-400 font-semibold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_6px_#22c55e]" />
                  Vault
                </span>
              )}
              {vaultSyncState === "saving" && (
                <span className="text-[10px] vol-accent font-semibold uppercase tracking-wider">
                  Syncing…
                </span>
              )}
              {vaultSyncState === "saved" && (
                <span className="text-[10px] text-green-400 font-semibold uppercase tracking-wider">
                  Saved
                </span>
              )}
              {vaultSyncState === "error" && (
                <span className="text-[10px] text-red-400 font-semibold uppercase tracking-wider">
                  Sync failed
                </span>
              )}
            </div>
          </div>
          <p className="text-[10px] vol-t2 -mt-2 mb-1">
            Keys are encrypted and stored in the MongoDB secret vault.
            Entering a key auto-syncs it to the vault.
          </p>

          <div>
            <label className="block text-xs vol-accent-soft mb-1 tracking-wider uppercase font-semibold">
              OpenRouter Key
            </label>
            <input
              type="password"
              value={openrouterKey}
              onChange={(e) => {
                setOpenrouterKey(e.target.value);
                localStorage.setItem("volt_openrouter_key", e.target.value);
              }}
              placeholder="sk-or-..."
              className="w-full vol-well border vol-ring-strong px-4 py-2.5 rounded-xl vol-t1 text-xs outline-none focus:vol-ring-hi font-mono"
            />
          </div>

          <div>
            <label className="block text-xs vol-accent-soft mb-1 tracking-wider uppercase font-semibold">
              Groq Key
            </label>
            <input
              type="password"
              value={groqKey}
              onChange={(e) => {
                setGroqKey(e.target.value);
                localStorage.setItem("volt_groq_key", e.target.value);
              }}
              placeholder="gsk_..."
              className="w-full vol-well border vol-ring-strong px-4 py-2.5 rounded-xl vol-t1 text-xs outline-none focus:vol-ring-hi font-mono"
            />
          </div>

          <div>
            <label className="block text-xs vol-accent-soft mb-1 tracking-wider uppercase font-semibold">
              NVIDIA Key
            </label>
            <input
              type="password"
              value={nvidiaKey}
              onChange={(e) => {
                setNvidiaKey(e.target.value);
                localStorage.setItem("volt_nvidia_key", e.target.value);
              }}
              placeholder="nvapi-..."
              className="w-full vol-well border vol-ring-strong px-4 py-2.5 rounded-xl vol-t1 text-xs outline-none focus:vol-ring-hi font-mono"
            />
          </div>

          <div>
            <label className="block text-xs vol-accent-soft mb-1 tracking-wider uppercase font-semibold">
              HuggingFace Key
            </label>
            <input
              type="password"
              value={huggingfaceKey}
              onChange={(e) => {
                setHuggingfaceKey(e.target.value);
                localStorage.setItem("volt_huggingface_key", e.target.value);
              }}
              placeholder="hf_..."
              className="w-full vol-well border vol-ring-strong px-4 py-2.5 rounded-xl vol-t1 text-xs outline-none focus:vol-ring-hi font-mono"
            />
          </div>
        </div>

        {/* Gateway Console */}
        <div className="border vol-ring rounded-xl p-6 vol-panel">
          <div className="text-lg font-bold mb-2">Gateway Console</div>
          <p className="text-[11px] vol-t2 mb-3">
            Runs a probe through the provider fallback chain (skips
            providers without keys) and shows the routing log.
          </p>
          <button
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
            className="px-3 py-2.5 rounded-xl vol-acc-bg text-black text-xs font-black cursor-pointer disabled:opacity-60"
          >
            {gatewayLoading ? "PROBING..." : "RUN PROBE"}
          </button>
          <div className="mt-3 max-h-40 overflow-y-auto space-y-1">
            {gatewayLogs.length === 0 && (
              <p className="text-[11px] vol-t2">No gateway activity yet.</p>
            )}
            {gatewayLogs.slice(-20).map((l, i) => (
              <div key={i} className="text-[10px] font-mono vol-t2">
                {l}
              </div>
            ))}
          </div>
        </div>

        {/* Provider & Model Picker */}
        <div className="border vol-ring rounded-xl p-6 vol-panel">
          <div className="text-lg font-bold mb-2">
            Provider & Model Picker
          </div>
          <p className="text-[11px] vol-t2 mb-3">
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
        </div>

        {/* Workspace Checkpoints */}
        <div className="border vol-ring rounded-xl p-6 vol-panel">
          <div className="text-lg font-bold mb-2">
            Workspace Checkpoints
          </div>
          <p className="text-[11px] vol-t2 mb-3">
            Snapshot the editor before risky edits; restore any time.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={async () => {
                const id = await createCheckpoint(
                  loadedFilePath || "editor.txt",
                  code,
                );
                setLastCheckpointId(id);
                addLog(`Checkpoint created: ${id}`, "success");
              }}
              className="px-3 py-2.5 rounded-xl vol-acc-bg text-black text-xs font-black cursor-pointer disabled:opacity-60"
            >
              CREATE CHECKPOINT
            </button>
            <button
              disabled={!lastCheckpointId}
              onClick={async () => {
                if (!lastCheckpointId) return;
                await onRestoreCheckpoint(lastCheckpointId);
                addLog(
                  `Restored checkpoint ${lastCheckpointId}`,
                  "success",
                );
              }}
              className="px-3 py-2.5 rounded-xl vol-well border vol-ring vol-accent text-xs font-black cursor-pointer disabled:opacity-50"
            >
              RESTORE LAST
            </button>
            {lastCheckpointId && (
              <span className="text-[10px] font-mono vol-t2 self-center">
                {lastCheckpointId}
              </span>
            )}
          </div>
        </div>

        {/* Live Provider Availability */}
        <div className="border vol-ring rounded-xl p-6 vol-panel">
          <div className="flex items-center justify-between mb-4">
            <div className="text-lg font-bold">
              Live Provider Availability
            </div>
            <button
              onClick={refreshLiveProviders}
              className="flex items-center gap-1.5 text-xs vol-accent hover:vol-accent disabled:opacity-50"
              disabled={liveProviderLoading}
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${liveProviderLoading ? "animate-spin" : ""}`}
              />
              {liveProviderLoading ? "Checking..." : "Refresh"}
            </button>
          </div>

          {liveProviderUpdated && (
            <p className="text-[10px] vol-t2 mb-3 font-mono">
              Last checked:{" "}
              {new Date(liveProviderUpdated).toLocaleTimeString()} ·
              auto-refresh 30 min
            </p>
          )}

          {liveProviderAvailability.length === 0 ? (
            <p className="text-xs vol-t2">
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
                    className="p-3 vol-panel border vol-line rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          provider.connected
                            ? "bg-green-500 shadow-[0_0_8px_#22c55e]"
                            : "bg-red-500"
                        }`}
                      />
                      <span className="text-sm font-bold vol-t1">
                        {provider.label}
                      </span>
                      {provider.connected ? (
                        <span className="text-[10px] text-green-400 font-semibold uppercase">
                          Connected
                        </span>
                      ) : (
                        <span className="text-[10px] text-red-400 font-semibold uppercase">
                          Offline
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] vol-t2 font-mono">
                      {provider.freeCount} free / {provider.paidCount} paid
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Agent Mode Default */}
        <div className="border vol-ring rounded-xl p-6 vol-panel">
          <div className="text-lg font-bold mb-4">Agent Mode Default</div>
          <select
            value={agentMode}
            onChange={(e) => setAgentMode(e.target.value as string)}
            className="w-full vol-well border vol-ring-strong px-4 py-3 rounded vol-t1 cursor-pointer font-semibold"
          >
            {["manual", "assist", "auto-syntax", "auto-debug", "team-review"].map(
              (mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ),
            )}
          </select>
        </div>

        {/* Sentinel Debounce Delay */}
        <div className="border vol-ring rounded-xl p-6 vol-panel">
          <div className="text-lg font-bold mb-2">
            Sentinel Debounce Delay
          </div>
          <div className="text-sm vol-accent-soft mb-3">
            Delay after typing before passive analysis runs: {debounceDelay}
            ms
          </div>
          <input
            type="range"
            min="100"
            max="2000"
            step="50"
            value={debounceDelay}
            onChange={(e) => setDebounceDelay(Number(e.target.value))}
            className="w-full accent-[#FF5F00] vol-wash h-1.5 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Auto-Apply Fixes */}
        <div className="border vol-ring rounded-xl p-6 vol-panel">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-bold">Auto-Apply Fixes</div>
              <div className="text-sm vol-accent-soft mt-1">
                Automatically apply all fixes without confirmation
              </div>
            </div>
            {toggleSwitch(autoApplyFixes, () => setAutoApplyFixes(!autoApplyFixes))}
          </div>
        </div>

        {/* Sentinel Live Monitoring */}
        <div className="border vol-ring rounded-xl p-6 vol-panel">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-bold">
                Sentinel Live Monitoring
              </div>
              <div className="text-sm vol-accent-soft mt-1">
                Enable real-time code monitoring watchdog
              </div>
            </div>
            {toggleSwitch(enableSentinel, () => setEnableSentinel(!enableSentinel))}
          </div>
        </div>

        {/* Show Token Usage Panel */}
        <div className="border vol-ring rounded-xl p-6 vol-panel">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-bold">
                Show Token Usage Panel
              </div>
              <div className="text-sm vol-accent-soft mt-1">
                Show prompt, completion, and cost estimates after runs
              </div>
            </div>
            {toggleSwitch(showTokenUsage, () => setShowTokenUsage(!showTokenUsage))}
          </div>
        </div>

        {/* Theme */}
        <div className="border vol-ring rounded-xl p-6 vol-panel">
          <div className="text-lg font-bold mb-2">Theme</div>
          <div className="vol-accent-soft font-semibold">
            Charcoal Black + Neon Orange (locked)
          </div>
        </div>

        {/* Session actions */}
        <button
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
          className="w-full px-6 py-4 rounded-xl border vol-ring-strong vol-accent font-bold hover:vol-acc-wash transition-all mb-3 cursor-pointer"
        >
          EXPORT ALL SESSIONS (JSON)
        </button>

        <button
          onClick={() => {
            localStorage.removeItem("codeSessions");
            setSessions([]);
            showToast("All sessions cleared!", "success");
          }}
          className="w-full px-6 py-4 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 font-bold transition-all cursor-pointer"
        >
          CLEAR ALL SESSIONS
        </button>
      </div>
    </div>
  );
};
