/**
 * Editor view — the fast single-file prompt-to-code scratchpad.
 *
 * Shared state (code, language, selectedModel, etc.) comes from VoltContext.
 * View-specific state and handlers are passed as props from the shell.
 */
import React from "react";
import { ChevronDown, Zap, Settings, Activity, Bot, Bug, X, Send } from "lucide-react";
import { useVolt } from "../../context/VoltContext";

const pluginOptions = [
  "Test Runner",
  "Console Trace",
  "Diff Reviewer",
  "Repo Scanner",
  "API Schema Reader",
  "Dependency Audit",
];

const skillOptions = [
  "Syntax Repair",
  "Bug Isolation",
  "Patch Generator",
  "Fix Verification",
  "Root Cause Drilldown",
  "Regression Guard",
];

const modeOptions: string[] = [
  "manual",
  "assist",
  "auto-syntax",
  "auto-debug",
  "team-review",
];

const ControlAccordion: React.FC<{
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  children: React.ReactNode;
}> = ({ title, icon, defaultOpen = false, className, children }) => {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div
      className={`border vol-ring-strong rounded-xl vol-panel overflow-hidden ${className ?? ""}`}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3 py-2 vol-surface text-left cursor-pointer"
        aria-expanded={open}
      >
        {icon}
        <div className="flex-1 min-w-0">
          <div className="text-[10px] vol-accent tracking-widest uppercase font-bold">
            {title}
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 shrink-0 vol-accent-soft transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <div className="px-3 py-2 vol-surface border-t vol-line">
          {children}
        </div>
      )}
    </div>
  );
};

const languages = [
  { value: "auto", label: "Auto Detect" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "cpp", label: "C++" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "yaml", label: "YAML" },
  { value: "unknown", label: "Plain Text" },
];

interface EditorViewProps {
  splitView: boolean;
  setSplitView: (v: boolean) => void;
  isAnalyzing: boolean;
  showAgentChat: boolean;
  setShowAgentChat: (v: boolean) => void;
  bossInput: string;
  setBossInput: (v: string) => void;
  isBossLoading: boolean;
  bossMessages: Array<{ role: string; content: string }>;
  showTokenUsage: boolean;
  tokensUsed: number;
  promptTokens: number;
  completionTokens: number;
  sentinelLevel: "green" | "yellow" | "red";
  sentinelLabel: string;
  sentinelSummary: string;
  issues: Array<{ id: number; severity: string; message: string }>;
  fixedCode: string;
  addLog: (msg: string, level?: "info" | "success" | "error" | "warn") => void;
  handleCodeChange: (code: string) => void;
  analyzeCode: () => void;
  applyAllFixes: () => void;
  sendBossMessage: (content: string) => void;
}

export const EditorView: React.FC<EditorViewProps> = ({
  splitView,
  setSplitView,
  isAnalyzing,
  showAgentChat,
  setShowAgentChat,
  bossInput,
  setBossInput,
  isBossLoading,
  bossMessages,
  showTokenUsage,
  tokensUsed,
  promptTokens,
  completionTokens,
  sentinelLevel,
  sentinelLabel,
  sentinelSummary,
  issues,
  fixedCode,
  addLog,
  handleCodeChange,
  analyzeCode,
  applyAllFixes,
  sendBossMessage,
}) => {
  const {
    code,
    language,
    setLanguage,
    detectedLanguage,
    selectedModel,
    setSelectedModel,
    selectedPlugin,
    setSelectedPlugin,
    selectedSkill,
    setSelectedSkill,
    agentMode,
    setAgentMode,
  } = useVolt();

  const modelOptionsAll: Array<{ id: string; name: string; tag: string; ctx: string; color: string; provider: string; tier?: string }> = [
    { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B", tag: "BALANCED", ctx: "128K", color: "#F97316", provider: "Groq", tier: "FREE" },
    { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B", tag: "FAST", ctx: "128K", color: "#60A5FA", provider: "Groq", tier: "FREE" },
    { id: "deepseek-r1-distill-llama-70b", name: "DeepSeek R1 Distill Llama 70B", tag: "REASONING", ctx: "128K", color: "#3B82F6", provider: "Groq", tier: "FREE" },
    { id: "gemma2-9b-it", name: "Gemma 2 9B", tag: "FAST", ctx: "8K", color: "#EF4444", provider: "Groq", tier: "FREE" },
  ];

  const modelGroups = Array.from(
    new Set(modelOptionsAll.map((m) => m.provider)),
  ).map((prov) => [prov, modelOptionsAll.filter((m) => m.provider === prov)]);

  const renderModelSelect = () => (
    <div className="flex shrink-0 flex-wrap items-center gap-2 border vol-ring-strong rounded-xl px-3 py-2 vol-panel sm:gap-3 sm:px-4">
      <div className="vol-accent-soft text-[10px] sm:text-xs tracking-wider">
        ENGINE
      </div>
      <select
        value={selectedModel.id}
        onChange={(e) => {
          const model = modelOptionsAll.find((m) => m.id === e.target.value);
          if (model) {
            setSelectedModel(model);
            addLog(
              `Selected execution model: ${model.name} (${model.provider}${model.tier === "FREE" ? " · FREE" : ""})`,
              "info",
            );
          }
        }}
        className="h-7 w-[140px] max-w-[140px] text-xs font-mono bg-transparent border border-neutral-700 rounded-full px-2.5 py-1 text-neutral-200 cursor-pointer truncate outline-none focus:border-neutral-500"
      >
        {modelGroups.map(([provider, models]) => (
          <optgroup
            key={provider}
            label={`${provider}${models.some((m) => m.tier === "FREE") ? " · free" : ""}`}
          >
            {models.map((model) => (
              <option
                key={model.id}
                value={model.id}
                className="bg-neutral-900 text-neutral-200"
              >
                {model.tier === "FREE" ? "★ " : ""}
                {model.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );

  const renderSelect = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    options: string[],
  ) => (
    <div
      className="flex shrink-0 items-center gap-2 border vol-ring-strong rounded-xl px-3 py-2 vol-panel sm:gap-3 sm:px-4"
      title={`${label}: ${value}`}
    >
      <div className="shrink-0 vol-accent-soft text-[10px] sm:text-xs tracking-wider">
        {label}
      </div>
      <ChevronDown className="w-4 h-4 shrink-0 vol-accent-soft" />
      <select
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          addLog(`Updated config: ${label} -> ${e.target.value}`, "info");
        }}
        className="bg-transparent vol-t1 outline-none w-[92px] sm:w-auto sm:min-w-[130px] max-w-[92px] sm:max-w-none truncate text-xs cursor-pointer"
      >
        {options.map((option) => (
          <option key={option} value={option} className="vol-elev vol-t1">
            {option}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="flex flex-col min-h-[100dvh] overflow-y-auto pb-28 sm:pb-16">
      {/* Editor Toolbar Header */}
      <div className="hidden md:block border-b vol-ring p-3 sm:p-6 shrink-0 vol-surface">
        <div className="mb-1 flex justify-between items-start">
          <div>
            <div className="text-lg sm:text-2xl font-bold leading-tight">
              MULTI-LANGUAGE EDITOR
            </div>
            <div className="text-[10px] sm:text-xs vol-accent-soft font-semibold tracking-wide">
              AI Bug Finder, Agent Runner & Telemetrist
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setSplitView((v) => !v)}
              className={`px-3 py-1.5 rounded-lg border vol-ring text-xs font-black cursor-pointer ${
                splitView ? "vol-acc-bg text-black" : "hover:vol-wash vol-t2"
              }`}
            >
              {splitView ? "SPLIT ✓" : "SPLIT"}
            </button>
            <button
              onClick={() => setShowShortcutsCheatSheet(true)}
              className="px-3 py-1.5 rounded-lg border vol-line hover:vol-wash vol-t2 hover:vol-t1 text-xs font-semibold cursor-pointer"
            >
              SHORTCUTS [?]
            </button>
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border vol-ring text-xs font-bold cursor-pointer ${
                sentinelLevel === "green"
                  ? "vol-well vol-t1"
                  : sentinelLevel === "yellow"
                    ? "vol-acc-wash vol-accent"
                    : "bg-red-500/20 border-red-500/40 text-red-400"
              }`}
              title={sentinelSummary}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  sentinelLevel === "green"
                    ? "bg-green-500"
                    : sentinelLevel === "yellow"
                      ? "bg-yellow-500"
                      : "bg-red-500"
                }`}
              ></span>
              {sentinelLabel}
            </div>
          </div>
        </div>

        {/* Horizontal control rail */}
        <div className="space-y-2">
          <ControlAccordion
            title="ENGINE & MODEL"
            icon={<Zap className="w-4 h-4" />}
            defaultOpen={true}
          >
            {renderModelSelect()}
          </ControlAccordion>

          <ControlAccordion
            title="CONFIG"
            icon={<Settings className="w-4 h-4" />}
            defaultOpen={false}
          >
            <div className="flex flex-row gap-2 overflow-x-auto no-scrollbar py-1">
              {renderSelect(
                "Plugin",
                selectedPlugin,
                setSelectedPlugin,
                pluginOptions,
              )}
              {renderSelect(
                "Skill",
                selectedSkill,
                setSelectedSkill,
                skillOptions,
              )}
              {renderSelect(
                "Mode",
                agentMode,
                (v) => setAgentMode(v as string),
                modeOptions,
              )}
              <div className="flex flex-col gap-1 shrink-0">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  title={`Language: ${languages.find((l) => l.value === language)?.label ?? language}`}
                  className="vol-well border vol-ring-strong px-3 py-2 text-sm rounded focus:outline-none focus:vol-ring-hi cursor-pointer vol-t1 font-semibold shrink-0 w-full max-w-[120px] truncate"
                >
                  {languages.map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </select>
                <div
                  title={`Detected language: ${detectedLanguage.toUpperCase()}`}
                  className="px-3 py-2 rounded vol-acc-wash vol-accent text-sm font-semibold shrink-0 whitespace-nowrap"
                >
                  DETECTED: {detectedLanguage.toUpperCase()}
                </div>
              </div>
            </div>
          </ControlAccordion>

          <ControlAccordion
            title="OPERATION MODE"
            icon={<Activity className="w-4 h-4" />}
            defaultOpen={false}
            className="hidden md:block"
          >
            <div className="flex items-center gap-2 border vol-ring-strong rounded-xl px-2 py-1 sm:px-4 sm:py-1.5 vol-panel select-none">
              <div className="text-[9px] vol-accent tracking-wider uppercase font-bold">
                Operation Mode
              </div>
              <div className="flex items-center gap-1.5 vol-well rounded-lg p-1">
                <button
                  onClick={() => {
                    setAgentMode("manual");
                    addLog("Switched operation mode to MANUAL", "info");
                  }}
                  className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all cursor-pointer ${
                    agentMode === "manual"
                      ? "bg-red-500/20 text-red-400 border border-red-500/40 shadow-sm shadow-red-500/10"
                      : "vol-t2 hover:vol-t1"
                  }`}
                >
                  Manual Mode
                </button>
                <button
                  onClick={() => {
                    setAgentMode("assist");
                    addLog(
                      "Switched operation mode to AUTONOMOUS (ASSIST)",
                      "info",
                    );
                  }}
                  className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all cursor-pointer ${
                    agentMode !== "manual"
                      ? "vol-acc-wash vol-accent border vol-ring-strong shadow-sm shadow-[#FF5F00]/10"
                      : "vol-t2 hover:vol-t1"
                  }`}
                >
                  Autonomous Mode
                </button>
              </div>
            </div>
          </ControlAccordion>

          {showTokenUsage && tokensUsed > 0 && (
            <ControlAccordion
              title="TOKEN USAGE"
              icon={<GitPullRequest className="w-4 h-4" />}
              defaultOpen={false}
            >
              <div className="p-2 sm:p-3 rounded-xl border vol-ring vol-panel flex items-center gap-3 sm:gap-6 flex-wrap">
                <div>
                  <div className="vol-accent text-[10px] tracking-wider font-bold">
                    TOTAL CONSUMPTION
                  </div>
                  <div className="vol-t1 font-extrabold text-lg">
                    {tokensUsed} <span className="text-xs vol-t2 font-normal">tokens</span>
                  </div>
                </div>
                <div className="h-8 w-px vol-wash"></div>
                <div className="text-xs vol-t2 space-y-0.5 select-none">
                  <div>Prompt: {promptTokens}</div>
                  <div>Completion: {completionTokens}</div>
                </div>
              </div>
            </ControlAccordion>
          )}
        </div>

        {/* Mobile: slim horizontal slider rail */}
        <div className="block md:hidden overflow-x-auto no-scrollbar scroll-smooth border-b border-neutral-800 bg-neutral-950/90 px-2 py-1.5 backdrop-blur z-20">
          <div className="flex items-center gap-1.5 min-w-max">
            <div className="flex flex-col items-start gap-0.5">
              <span className="text-[8px] font-mono text-neutral-500 uppercase tracking-wider">
                ENGINE
              </span>
              <select
                value={selectedModel.id}
                onChange={(e) => {
                  const model = modelOptionsAll.find(
                    (m) => m.id === e.target.value,
                  );
                  if (model) {
                    setSelectedModel(model);
                    addLog(
                      `Selected execution model: ${model.name} (${model.provider}${model.tier === "FREE" ? " · FREE" : ""})`,
                      "info",
                    );
                  }
                }}
                className="h-7 w-[140px] max-w-[140px] text-xs font-mono bg-transparent border border-neutral-700 rounded-full px-2.5 py-1 text-neutral-200 cursor-pointer truncate outline-none focus:border-neutral-500"
              >
                {modelGroups.map(([provider, models]) => (
                  <optgroup
                    key={provider}
                    label={provider + (models.some((m) => m.tier === "FREE") ? " · free" : "")}
                  >
                    {models.map((model) => (
                      <option
                        key={model.id}
                        value={model.id}
                        className="bg-neutral-900 text-neutral-200"
                      >
                        {model.tier === "FREE" ? "★ " : ""}
                        {model.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div className="flex flex-col items-start gap-0.5">
              <span className="text-[8px] font-mono text-neutral-500 uppercase tracking-wider">
                PLUGIN
              </span>
              <select
                value={selectedPlugin}
                onChange={(e) => {
                  setSelectedPlugin(e.target.value);
                  addLog(
                    `Updated config: Plugin -> ${e.target.value}`,
                    "info",
                  );
                }}
                className="h-7 text-xs bg-transparent border border-neutral-800 rounded-full px-2.5 py-1 text-neutral-200 cursor-pointer truncate outline-none focus:border-neutral-500"
              >
                {pluginOptions.map((option) => (
                  <option key={option} value={option} className="bg-neutral-900 text-neutral-200">
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col items-start gap-0.5">
              <span className="text-[8px] font-mono text-neutral-500 uppercase tracking-wider">
                SKILL
              </span>
              <select
                value={selectedSkill}
                onChange={(e) => {
                  setSelectedSkill(e.target.value);
                  addLog(
                    `Updated config: Skill -> ${e.target.value}`,
                    "info",
                  );
                }}
                className="h-7 text-xs bg-transparent border border-neutral-800 rounded-full px-2.5 py-1 text-neutral-200 cursor-pointer truncate outline-none focus:border-neutral-500"
              >
                {skillOptions.map((option) => (
                  <option key={option} value={option} className="bg-neutral-900 text-neutral-200">
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col items-start gap-0.5">
              <span className="text-[8px] font-mono text-neutral-500 uppercase tracking-wider">
                MODE
              </span>
              <select
                value={agentMode}
                onChange={(e) => {
                  setAgentMode(e.target.value as string);
                  addLog(`Updated config: Mode -> ${e.target.value}`, "info");
                }}
                className="h-7 text-xs bg-transparent border border-neutral-800 rounded-full px-2.5 py-1 text-neutral-200 cursor-pointer truncate outline-none focus:border-neutral-500"
              >
                {modeOptions.map((option) => (
                  <option key={option} value={option} className="bg-neutral-900 text-neutral-200">
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col items-start gap-0.5">
              <span className="text-[8px] font-mono text-neutral-500 uppercase tracking-wider">
                LANG
              </span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="h-7 text-xs bg-transparent border border-neutral-800 rounded-full px-2.5 py-1 text-neutral-200 cursor-pointer truncate outline-none focus:border-neutral-500"
              >
                {languages.map((l) => (
                  <option key={l.value} value={l.value} className="bg-neutral-900 text-neutral-200">
                    {l.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col items-start gap-0.5">
              <span className="text-[8px] font-mono text-neutral-500 uppercase tracking-wider">
                DETECTED
              </span>
              <div className="h-7 text-xs bg-neutral-800 border border-neutral-700 rounded-full px-2.5 py-1 text-neutral-200 cursor-pointer truncate">
                {detectedLanguage.toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main editor area - canvas */}
      <div className="flex-1 overflow-y-auto">
        {/* Editor canvas will be injected here by SplitEditorLayout when splitView is active */}
        <textarea
          value={code}
          onChange={(e) => handleCodeChange(e.target.value)}
          spellCheck={false}
          className="w-full min-h-[400px] vol-panel border vol-line rounded-lg p-4 font-mono text-sm vol-t1 caret-[#FF5F00] focus:vol-ring-hi outline-none resize-none"
        />
      </div>

      {/* Action bar */}
      <div className="border-t vol-ring p-4 vol-surface">
        <div className="flex gap-2 sm:flex-wrap justify-center">
          <button
            onClick={analyzeCode}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-6 py-3 rounded-xl vol-well border-2 vol-ring-strong vol-accent font-bold disabled:opacity-60 transition-all cursor-pointer"
          >
            <Bug className="w-5 h-5" />
            {isAnalyzing ? "ANALYZING..." : "RUN AI ANALYSIS"}
          </button>
          <button
            onClick={() => setShowAgentChat(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl vol-panel border vol-ring-strong vol-accent font-bold hover:vol-well transition-all cursor-pointer"
          >
            <Bot className="w-5 h-5" />
            VOLT AGENTS
          </button>
          {fixedCode && (
            <button
              onClick={applyAllFixes}
              className="flex items-center gap-2 px-6 py-3 rounded-xl vol-acc-bg text-black font-bold shadow-[0_0_25px_rgba(255,95,0,0.5)] hover:vol-accbg-hi transition-all cursor-pointer"
            >
              <Zap className="w-5 h-5" />
              FIX ALL ({issues.length})
            </button>
          )}
        </div>
      </div>

      {/* Agent Chat HUD */}
      <div className="hidden md:block absolute left-6 bottom-6 z-50 select-none">
        {showAgentChat ? (
          <div className="w-96 flex flex-col rounded-xl vol-panel border vol-ring-strong shadow-[0_0_25px_rgba(255,95,0,0.25)] overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b vol-ring">
              <span className="text-[10px] font-bold tracking-widest vol-accent flex items-center gap-2">
                <Bot className="w-3.5 h-3.5" />
                VOLT AGENTS · {isBossLoading ? "THINKING..." : "ONLINE"}
              </span>
              <button
                onClick={() => setShowAgentChat(false)}
                className="vol-t2 hover:vol-t1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="max-h-56 overflow-y-auto p-3 space-y-2">
              {bossMessages.slice(-8).map((m, i) => (
                <div
                  key={i}
                  className={`text-[11px] leading-snug rounded-lg px-2.5 py-2 ${
                    m.role === "user"
                      ? "vol-acc-wash vol-accent-soft"
                      : "vol-wash vol-t1/85"
                  }`}
                >
                  <span className="block text-[9px] font-bold tracking-wider opacity-60 mb-1">
                    {m.role === "user" ? "YOU" : "VOLT CORE"}
                  </span>
                  {m.content}
                </div>
              ))}
            </div>
            <div className="flex gap-2 p-2 border-t vol-ring">
              <input
                value={bossInput}
                onChange={(e) => setBossInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendBossMessage(bossInput);
                }}
                disabled={isBossLoading}
                placeholder={
                  isBossLoading
                    ? "Agents processing..."
                    : "Message the agent swarm..."
                }
                className="flex-1 vol-wash rounded-lg px-3 py-2 text-[11px] vol-t1 outline-none placeholder:vol-t2 disabled:opacity-50"
              />
              <button
                onClick={() => sendBossMessage(bossInput)}
                disabled={isBossLoading}
                className="px-3 rounded-lg vol-acc-bg text-black disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAgentChat(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl vol-panel border vol-ring-strong vol-accent text-xs font-bold hover:vol-well cursor-pointer"
          >
            <Bot className="w-4 h-4" />
            AGENT CHAT
          </button>
        )}
      </div>
    </div>
  );
};
