/**
 * Editor view — Mobile-first, v0.app-inspired code editor.
 * Clean, unobstructed canvas with progressive disclosure.
 *
 * Design principles:
 * - Full-screen editor on mobile, zero chrome overlap
 * - Floating action button (FAB) for primary AI actions
 * - Bottom sheet for config (engine, skill, mode, language)
 * - Slide-over panel for agent chat
 * - Collapsible header with only essential info
 * - Safe-area aware, 100dvh canvas
 */
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Zap,
  Bot,
  Bug,
  X,
  Send,
  GitPullRequest,
  Menu,
  Maximize2,
  Minimize2,
  AlertTriangle,
} from "lucide-react";
import { useVolt } from "../../context/VoltContext";
import { Card } from "../ui/Card";
import { AnimatePresence, motion } from "framer-motion";

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

type ModelConfig = {
  id: string;
  name: string;
  tag: string;
  ctx: string;
  color: string;
  provider: string;
  tier?: string;
};

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
  issues: Array<{ id: number; severity: string }>;
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

  const modelOptionsAll: ModelConfig[] = [
    { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B", tag: "BALANCED", ctx: "128K", color: "#F97316", provider: "Groq", tier: "FREE" },
    { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B", tag: "FAST", ctx: "128K", color: "#60A5FA", provider: "Groq", tier: "FREE" },
    { id: "deepseek-r1-distill-llama-70b", name: "DeepSeek R1 Distill Llama 70B", tag: "REASONING", ctx: "128K", color: "#3B82F6", provider: "Groq", tier: "FREE" },
    { id: "gemma2-9b-it", name: "Gemma 2 9B", tag: "FAST", ctx: "8K", color: "#EF4444", provider: "Groq", tier: "FREE" },
  ];

  const modelGroups: [string, ModelConfig[]][] = Array.from(
    new Set(modelOptionsAll.map((m) => m.provider)),
  ).map((prov) => [prov, modelOptionsAll.filter((m) => m.provider === prov)]);

  // Mobile-first state
  const [showConfigSheet, setShowConfigSheet] = useState(false);
  const [showAgentPanel, setShowAgentPanel] = useState(false);
  const [showTokenPanel, setShowTokenPanel] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        analyzeCode();
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "F") {
        e.preventDefault();
        applyAllFixes();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        setShowConfigSheet(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowAgentPanel(true);
      }
      if (e.key === "Escape") {
        setShowConfigSheet(false);
        setShowAgentPanel(false);
        setShowTokenPanel(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [analyzeCode, applyAllFixes]);

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [code, adjustTextareaHeight]);

  const sentinelBg = sentinelLevel === "green" ? "bg-[var(--color-success)]/15" :
    sentinelLevel === "yellow" ? "bg-[var(--color-warning)]/15" : "bg-[var(--color-destructive)]/15";
  const sentinelDot = sentinelLevel === "green" ? "bg-[var(--color-success)]" :
    sentinelLevel === "yellow" ? "bg-[var(--color-warning)]" : "bg-[var(--color-destructive)]";

  return (
    <div className="relative flex flex-col h-[100dvh] w-full bg-[var(--color-background)] overflow-hidden touch-none select-none">
      {/* ── Minimal Top Bar ── */}
      <header className="fixed top-0 left-0 right-0 z-[var(--z-sticky)] h-12 shrink-0 bg-[var(--color-background)]/80 backdrop-blur-md border-b border-[var(--color-border)] flex items-center justify-between px-3">
        {/* Left: Menu + Title */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => setShowConfigSheet(true)}
            className="icon-btn p-1.5"
            aria-label="Open configuration"
          >
            <Menu className="w-5 h-5 text-[var(--color-foreground)]" />
          </button>
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <span className="text-xs font-bold tracking-widest text-[var(--color-foreground)] truncate">
              VOLT EDITOR
            </span>
            <span className="text-[10px] text-[var(--color-muted-foreground)] font-medium uppercase tracking-wider">
              {detectedLanguage.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Center: Engine badge (mobile) */}
        <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-full border border-[var(--color-border)] bg-[var(--color-card)]">
          <span className="text-[10px] font-mono text-[var(--color-muted-foreground)]">ENGINE</span>
          <span className="text-xs font-bold text-[var(--color-accent)]">{selectedModel.name}</span>
          {selectedModel.tier === "FREE" && (
            <span className="text-[9px] font-bold text-[var(--color-success)]">★ FREE</span>
          )}
        </div>

        {/* Right: Sentinel + Token + Agent + Fullscreen */}
        <div className="flex items-center gap-1">
          {/* Sentinel Status */}
          <button
            onClick={() => setShowConfigSheet(true)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-full border shrink-0 ${sentinelBg} border-current/30`}
            title={sentinelSummary}
            aria-label={`Sentinel: ${sentinelLabel}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${sentinelDot}`}></span>
            <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">{sentinelLabel}</span>
          </button>

          {/* Token Usage */}
          {showTokenUsage && tokensUsed > 0 && (
            <button
              onClick={() => setShowTokenPanel(true)}
              className="icon-btn relative"
              aria-label={`Tokens used: ${tokensUsed}`}
            >
              <GitPullRequest className="w-4 h-4 text-[var(--color-muted-foreground)]" />
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--color-accent)] text-[var(--color-on-accent)] text-[9px] font-bold flex items-center justify-center">
                {tokensUsed > 999 ? "999+" : tokensUsed}
              </span>
            </button>
          )}

          {/* Agent Chat */}
          <button
            onClick={() => setShowAgentPanel(true)}
            className={`icon-btn ${showAgentChat ? "bg-[var(--color-accent-soft)]" : ""}`}
            aria-label={showAgentChat ? "Close agent chat" : "Open agent chat"}
          >
            <Bot className={`w-4 h-4 ${showAgentChat ? "text-[var(--color-accent)]" : "text-[var(--color-muted-foreground)]"}`} />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="icon-btn"
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* ── Main Editor Canvas ── */}
      <main className="relative overflow-hidden pt-12 pb-safe" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        {/* Analyzing indicator */}
        {isAnalyzing && (
          <div className="fixed top-12 left-0 right-0 z-[var(--z-sticky)] bg-[var(--color-accent)] text-[var(--color-on-accent)] px-3 py-1.5 flex items-center justify-center gap-2 text-xs font-bold">
            <span className="w-3 h-3 rounded-full bg-current/30 animate-pulse"></span>
            AI ANALYSIS IN PROGRESS...
          </div>
        )}

        {/* Editor textarea - full viewport */}
        <div className="h-full w-full flex flex-col touch-none">
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            spellCheck={false}
            className="flex-1 w-full border-none bg-[var(--color-card)] text-[var(--color-foreground)] font-mono text-sm resize-none outline-none focus-visible:ring-0 p-4 md:p-6 leading-relaxed placeholder-[var(--color-muted-foreground)] touch-none"
            style={{
              lineHeight: "1.6",
              letterSpacing: "0.3px",
              tabSize: 2,
              backgroundAttachment: "local",
            }}
            placeholder="// Start coding... Press ⌘+Enter to analyze, ⌘+/ for config"
          />
        </div>

        {/* Sentinel inline findings (bottom overlay when issues exist) */}
        {issues.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 z-[var(--z-popover)] px-3 pb-3 pointer-events-none">
            <div className="max-w-4xl mx-auto pointer-events-auto animate-slide-up">
              <Card className="border-[var(--color-border)] bg-[var(--color-card)]/95 backdrop-blur-sm">
                <div className="p-3 border-b border-[var(--color-border)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-[var(--color-warning)]" />
                    <span className="text-xs font-bold text-[var(--color-foreground)]">{issues.length} issue{issues.length > 1 ? "s" : ""} found</span>
                    <span className="text-[10px] text-[var(--color-muted-foreground)]">Tap to review</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${sentinelLevel === "green" ? "bg-[var(--color-success)]/20 text-[var(--color-success)]" : sentinelLevel === "yellow" ? "bg-[var(--color-warning)]/20 text-[var(--color-warning)]" : "bg-[var(--color-destructive)]/20 text-[var(--color-destructive)]"}`}>
                    Consensus: {sentinelLabel}
                  </span>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Floating Action Buttons (FABs) - Bottom right stack */}
        <div className="absolute bottom-[calc(20px+env(safe-area-inset-bottom))] right-3 left-3 md:bottom-6 md:right-6 md:left-auto md:w-auto z-[var(--z-sticky)] flex flex-col-reverse md:flex-row-reverse gap-3 pointer-events-none pb-safe">
          {/* Fix All FAB */}
          {fixedCode && issues.length > 0 && (
            <motion.button
              onClick={applyAllFixes}
              className="pointer-events-auto w-full md:w-auto btn-primary btn-lg flex items-center justify-center gap-2 shadow-[var(--shadow-glow-intense)]"
              whileTap={{ scale: 0.96 }}
            >
              <Zap className="w-5 h-5" />
              <span className="hidden sm:inline">FIX ALL ({issues.length})</span>
              <span className="sm:hidden">FIX ALL</span>
            </motion.button>
          )}

          {/* Analyze FAB */}
          <motion.button
            onClick={analyzeCode}
            disabled={isAnalyzing}
            className="pointer-events-auto w-full md:w-auto btn-primary btn-lg flex items-center justify-center gap-2 shadow-[var(--shadow-glow)]"
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
          >
            <Bug className="w-5 h-5" />
            <span className="hidden sm:inline">{isAnalyzing ? "ANALYZING..." : "RUN AI"}</span>
            <span className="sm:hidden">{isAnalyzing ? "..." : "AI"}</span>
          </motion.button>
        </div>
      </main>

      {/* ── Config Bottom Sheet ── */}
      <ConfigSheet
        isOpen={showConfigSheet}
        onClose={() => setShowConfigSheet(false)}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        modelOptionsAll={modelOptionsAll}
        modelGroups={modelGroups}
        selectedPlugin={selectedPlugin}
        setSelectedPlugin={setSelectedPlugin}
        selectedSkill={selectedSkill}
        setSelectedSkill={setSelectedSkill}
        agentMode={agentMode}
        setAgentMode={setAgentMode}
        language={language}
        setLanguage={setLanguage}
        detectedLanguage={detectedLanguage}
        languages={languages}
        addLog={addLog}
        splitView={splitView}
        setSplitView={setSplitView}
        _isAnalyzing={isAnalyzing}
        showTokenUsage={showTokenUsage}
        tokensUsed={tokensUsed}
        promptTokens={promptTokens}
        completionTokens={completionTokens}
        _setShowAgentChat={setShowAgentChat}
      />

      {/* ── Agent Chat Slide-over Panel ── */}
      <AgentPanel
        isOpen={showAgentPanel}
        onClose={() => setShowAgentPanel(false)}
        bossMessages={bossMessages}
        bossInput={bossInput}
        setBossInput={setBossInput}
        isBossLoading={isBossLoading}
        sendBossMessage={sendBossMessage}
        _addLog={addLog}
      />

      {/* ── Token Usage Panel ── */}
      <TokenPanel
        isOpen={showTokenPanel}
        onClose={() => setShowTokenPanel(false)}
        tokensUsed={tokensUsed}
        promptTokens={promptTokens}
        completionTokens={completionTokens}
        showTokenUsage={showTokenUsage}
      />
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────
   CONFIG BOTTOM SHEET
   ────────────────────────────────────────────────────────────── */

interface ConfigSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModel: ModelConfig;
  setSelectedModel: (m: ModelConfig) => void;
  modelOptionsAll: ModelConfig[];
  modelGroups: [string, ModelConfig[]][];
  selectedPlugin: string;
  setSelectedPlugin: (v: string) => void;
  selectedSkill: string;
  setSelectedSkill: (v: string) => void;
  agentMode: string;
  setAgentMode: (v: string) => void;
  language: string;
  setLanguage: (v: string) => void;
  detectedLanguage: string;
  languages: { value: string; label: string }[];
  addLog: (msg: string, level?: "info" | "success" | "error" | "warn") => void;
  splitView: boolean;
  setSplitView: (v: boolean) => void;
  _isAnalyzing: boolean;
  showTokenUsage: boolean;
  tokensUsed: number;
  promptTokens: number;
  completionTokens: number;
  _setShowAgentChat: (v: boolean) => void;
}

const ConfigSheet: React.FC<ConfigSheetProps> = ({
  isOpen,
  onClose,
  selectedModel,
  setSelectedModel,
  modelOptionsAll,
  modelGroups,
  selectedPlugin,
  setSelectedPlugin,
  selectedSkill,
  setSelectedSkill,
  agentMode,
  setAgentMode,
  language,
  setLanguage,
  detectedLanguage,
  languages,
  addLog,
  splitView,
  setSplitView,
  _isAnalyzing,
  showTokenUsage,
  tokensUsed,
  promptTokens,
  completionTokens,
  _setShowAgentChat,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[var(--z-modal)] bg-[var(--color-background)]/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[var(--z-modal)] max-h-[85vh] bg-[var(--color-card)] border-t border-[var(--color-border)] rounded-t-[var(--radius-xl)] flex flex-col overflow-hidden"
          >
            {/* Handle */}
            <div className="flex items-center justify-center p-3 border-b border-[var(--color-border)]">
              <div className="w-10 h-1 rounded-full bg-[var(--color-muted-foreground)]/30" />
            </div>

            {/* Header */}
            <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
              <h2 className="text-lg font-bold text-[var(--color-foreground)]">CONFIGURATION</h2>
              <button onClick={onClose} className="icon-btn" aria-label="Close config">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Engine & Model */}
              <section>
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted-foreground)] mb-3">ENGINE & MODEL</h3>
                <div className="flex flex-wrap items-center gap-2 border border-[var(--color-border)] rounded-[var(--radius-lg)] px-3 py-2 bg-[var(--color-background)]">
                  <span className="shrink-0 text-[var(--color-accent)]/45 text-[10px] tracking-wider">ENGINE</span>
                  <select
                    value={selectedModel.id}
                    onChange={(e) => {
                      const model = modelOptionsAll.find((m: ModelConfig) => m.id === e.target.value);
                      if (model) {
                        setSelectedModel(model);
                        addLog(`Selected: ${model.name} (${model.provider}${model.tier === "FREE" ? " · FREE" : ""})`, "info");
                      }
                    }}
                    className="h-10 w-full max-w-[180px] text-sm font-mono bg-transparent border border-[var(--color-border)] rounded-full px-3 py-1 text-[var(--color-foreground)] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
                  >
                    {modelGroups.map(([provider, models]) => (
                      <optgroup key={provider} label={`${provider}${models.some((m: ModelConfig) => m.tier === "FREE") ? " · FREE" : ""}`}>
                        {models.map((model: ModelConfig) => (
                          <option key={model.id} value={model.id} className="bg-[var(--color-background)] text-[var(--color-foreground)]">
                            {model.tier === "FREE" ? "★ " : ""}{model.name} ({model.tag} · {model.ctx})
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              </section>

              {/* Config: Plugin, Skill, Mode */}
              <section>
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted-foreground)] mb-3">CONFIG</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <ConfigSelect
                    label="PLUGIN"
                    value={selectedPlugin}
                    options={pluginOptions}
                    onChange={(v) => { setSelectedPlugin(v); addLog(`Plugin → ${v}`, "info"); }}
                  />
                  <ConfigSelect
                    label="SKILL"
                    value={selectedSkill}
                    options={skillOptions}
                    onChange={(v) => { setSelectedSkill(v); addLog(`Skill → ${v}`, "info"); }}
                  />
                  <ConfigSelect
                    label="MODE"
                    value={agentMode}
                    options={modeOptions}
                    onChange={(v) => { setAgentMode(v); addLog(`Mode → ${v}`, "info"); }}
                  />
                </div>
              </section>

              {/* Language */}
              <section>
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted-foreground)] mb-3">LANGUAGE</h3>
                <div className="grid grid-cols-2 gap-3">
                  <ConfigSelect
                    label="MANUAL"
                    value={language}
                    options={languages.map(l => l.value)}
                    optionLabels={languages}
                    onChange={setLanguage}
                  />
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted-foreground)]">DETECTED</span>
                    <div className="h-10 px-3 py-1 bg-[var(--color-muted)] border border-[var(--color-border)] rounded-full text-sm font-semibold text-[var(--color-accent)] flex items-center">
                      {detectedLanguage.toUpperCase()}
                    </div>
                  </div>
                </div>
              </section>

              {/* Operation Mode Toggle */}
              <section>
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted-foreground)] mb-3">OPERATION MODE</h3>
                <div className="flex items-center gap-2 border border-[var(--color-border)] rounded-[var(--radius-lg)] px-2 py-1 bg-[var(--color-background)]">
                  <span className="text-[10px] text-[var(--color-accent)] tracking-widest uppercase font-bold">Mode</span>
                  <div className="flex items-center gap-1 bg-[var(--color-muted)]/20 rounded-lg p-1">
                    <button
                      onClick={() => { setAgentMode("manual"); addLog("Mode → manual", "info"); }}
                      className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${
                        agentMode === "manual"
                          ? "bg-[var(--color-destructive)]/20 text-[var(--color-destructive)] border border-[var(--color-destructive)]/30"
                          : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                      }`}
                    >
                      Manual
                    </button>
                    <button
                      onClick={() => { setAgentMode("assist"); addLog("Mode → assist", "info"); }}
                      className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${
                        agentMode !== "manual"
                          ? "bg-[var(--color-success)]/20 text-[var(--color-success)] border border-[var(--color-border)]"
                          : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                      }`}
                    >
                      Autonomous
                    </button>
                  </div>
                </div>
              </section>

              {/* Split View Toggle */}
              <section>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm font-semibold text-[var(--color-foreground)]">Split View</span>
                  <button
                    onClick={() => setSplitView(!splitView)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      splitView ? "bg-[var(--color-success)]" : "bg-[var(--color-muted)]"
                    }`}
                    role="switch"
                    aria-checked={splitView}
                  >
                    <motion.span
                      animate={{ x: splitView ? 24 : 2 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md"
                    />
                  </button>
                </label>
              </section>

              {/* Token Usage */}
              {showTokenUsage && tokensUsed > 0 && (
                <section>
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted-foreground)] mb-3">TOKEN USAGE</h3>
                  <div className="p-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] flex items-center gap-4 flex-wrap">
                    <div>
                      <div className="text-[var(--color-success)] text-[10px] tracking-wider font-bold">TOTAL CONSUMPTION</div>
                      <div className="text-[var(--color-foreground)] font-extrabold text-xl">{tokensUsed} <span className="text-xs text-[var(--color-muted-foreground)] font-normal">tokens</span></div>
                    </div>
                    <div className="h-8 w-px bg-[var(--color-border)]/20"></div>
                    <div className="text-xs text-[var(--color-muted-foreground)] space-y-0.5 select-none">
                      <div>Prompt: {promptTokens}</div>
                      <div>Completion: {completionTokens}</div>
                    </div>
                  </div>
                </section>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const ConfigSelect: React.FC<{
  label: string;
  value: string;
  options: string[];
  optionLabels?: { value: string; label: string }[];
  onChange: (v: string) => void;
}> = ({ label, value, options, optionLabels, onChange }) => (
  <div className="flex flex-col gap-1">
    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted-foreground)]">{label}</span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 px-3 bg-transparent border border-[var(--color-border)] rounded-full text-sm text-[var(--color-foreground)] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
    >
      {optionLabels
        ? optionLabels.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)
        : options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

/* ──────────────────────────────────────────────────────────────
   AGENT CHAT SLIDE-OVER PANEL
   ────────────────────────────────────────────────────────────── */
interface AgentPanelProps {
  isOpen: boolean;
  onClose: () => void;
  bossMessages: Array<{ role: string; content: string }>;
  bossInput: string;
  setBossInput: (v: string) => void;
  isBossLoading: boolean;
  sendBossMessage: (content: string) => void;
  _addLog: (msg: string, level?: "info" | "success" | "error" | "warn") => void;
}

const AgentPanel: React.FC<AgentPanelProps> = ({
  isOpen,
  onClose,
  bossMessages,
  bossInput,
  setBossInput,
  isBossLoading,
  sendBossMessage,
  _addLog,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[var(--z-modal)] bg-[var(--color-background)]/60 backdrop-blur-sm md:hidden"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-[var(--z-modal)] w-full md:w-96 bg-[var(--color-card)] border-l border-[var(--color-border)] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)] shrink-0">
              <span className="text-[10px] font-bold tracking-widest text-[var(--color-accent)] flex items-center gap-2">
                <Bot className="w-3.5 h-3.5" />
                VOLT AGENTS · {isBossLoading ? "THINKING..." : "ONLINE"}
              </span>
              <button onClick={onClose} className="icon-btn" aria-label="Close agent chat">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {bossMessages.length === 0 ? (
                <div className="text-center py-12 text-[var(--color-muted-foreground)] text-sm">
                  <Bot className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>No messages yet. Start a conversation with the agent swarm.</p>
                </div>
              ) : (
                bossMessages.slice(-20).map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        m.role === "user"
                          ? "bg-[var(--color-accent)] text-[var(--color-on-accent)] rounded-br-md"
                          : "bg-[var(--color-muted)] text-[var(--color-foreground)] rounded-bl-md"
                      }`}
                    >
                      <div className="text-[9px] font-bold tracking-wider opacity-70 mb-1 flex items-center gap-1">
                        {m.role === "user" ? (
                          <>
                            <span>YOU</span>
                          </>
                        ) : (
                          <>
                            <Bot className="w-3 h-3" />
                            <span>VOLT CORE</span>
                          </>
                        )}
                      </div>
                      <div className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</div>
                    </div>
                  </motion.div>
                )))
              }
            </div>

            {/* Input */}
            <div className="p-4 border-t border-[var(--color-border)] shrink-0">
              <form onSubmit={(e) => { e.preventDefault(); sendBossMessage(bossInput); }}>
                <div className="flex gap-2">
                  <input
                    value={bossInput}
                    onChange={(e) => setBossInput(e.target.value)}
                    disabled={isBossLoading}
                    placeholder={isBossLoading ? "Agents processing..." : "Message the agent swarm..."}
                    className="flex-1 bg-[var(--color-muted)] rounded-lg px-4 py-3 text-sm text-[var(--color-foreground)] outline-none placeholder-[var(--color-muted-foreground)]/50 disabled:opacity-50"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={isBossLoading || !bossInput.trim()}
                    className="px-4 rounded-lg bg-[var(--color-accent)] text-[var(--color-on-accent)] disabled:opacity-50 flex items-center justify-center"
                    aria-label="Send message"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

/* ──────────────────────────────────────────────────────────────
   TOKEN USAGE PANEL
   ────────────────────────────────────────────────────────────── */
interface TokenPanelProps {
  isOpen: boolean;
  onClose: () => void;
  tokensUsed: number;
  promptTokens: number;
  completionTokens: number;
  showTokenUsage: boolean;
}

const TokenPanel: React.FC<TokenPanelProps> = ({
  isOpen,
  onClose,
  tokensUsed,
  promptTokens,
  completionTokens,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[var(--z-modal)] bg-[var(--color-background)]/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ ease: [0.21, 0.92, 0.3, 1], duration: 0.2 }}
        className="fixed top-20 right-4 z-[var(--z-modal)] w-72 bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-xl)] shadow-[var(--shadow-xl)] overflow-hidden"
      >
        <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
          <h3 className="font-bold text-lg text-[var(--color-foreground)]">TOKEN USAGE</h3>
          <button onClick={onClose} className="icon-btn" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div className="text-center">
            <div className="text-[var(--color-success)] text-[10px] tracking-wider font-bold">TOTAL CONSUMPTION</div>
            <div className="text-[var(--color-foreground)] font-extrabold text-3xl mt-1">{tokensUsed}</div>
            <div className="text-xs text-[var(--color-muted-foreground)] mt-1">tokens</div>
          </div>
          <div className="h-px bg-[var(--color-border)]"></div>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-3 bg-[var(--color-muted)] rounded-lg">
              <div className="text-[var(--color-muted-foreground)] text-[10px] uppercase tracking-wider font-bold">PROMPT</div>
              <div className="text-[var(--color-foreground)] font-bold text-xl mt-1">{promptTokens}</div>
            </div>
            <div className="p-3 bg-[var(--color-muted)] rounded-lg">
              <div className="text-[var(--color-muted-foreground)] text-[10px] uppercase tracking-wider font-bold">COMPLETION</div>
              <div className="text-[var(--color-foreground)] font-bold text-xl mt-1">{completionTokens}</div>
            </div>
          </div>
          <div className="pt-2">
            <button onClick={onClose} className="w-full btn-primary btn-md">
              CLOSE
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EditorView;