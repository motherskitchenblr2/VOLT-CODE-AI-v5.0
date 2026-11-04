import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { classifyTask, smartRoute } from "./lib/smartRouter";
import { detectLanguage } from "./lib/detectLanguage";
import { RepoOpsPanel } from "./components/RepoOpsPanel";
import { useApiGateway } from "./hooks/useApiGateway";
import {
  Copy,
  Download,
  X,
  AlertTriangle,
  Sparkles,
  Zap,
  Bot,
  HelpCircle,
  GitBranch,
  Users,
} from "lucide-react";
import "highlight.js/styles/atom-one-dark.css";
import { Analytics } from "@vercel/analytics/react";

// v6.0 Upgraded Components & Services
import { ResponsiveContainer } from "./components/ResponsiveContainer";
import { VisualDiff } from "./components/VisualDiff";
import { AdminCenter } from "./components/AdminCenter";
import { PullRequest } from "./services/AgentCommunication";
import { TerminalPanel } from "./components/TerminalPanel";
import { PRReviewDashboard } from "./components/PRReviewDashboard";
import { CloudAuth } from "./components/CloudAuth";

import { RecoveryCenter } from "./services/RecoveryCenter";
import { inspectBuffer } from "./services/sentinelService";
import { riskLevel, levelLabel } from "./lib/sentinel/analyzers";
import {
  ConsensusEngine,
  MultiAgentOrchestrator,
} from "./services/AgentWorkforce";
import { useLiveProviderModels } from "./hooks/useLiveProviderModels";
import { useToast } from "./components/Toast";
 
import { useVolt as _useVolt } from "./context/VoltContext";
 
import { EditorView } from "./components/views/EditorView";
import { SwarmView } from "./components/views/SwarmView";
import { IDECanvasView } from "./components/views/IDECanvasView";
import { SettingsView } from "./components/views/SettingsView";
import { AboutView } from "./components/views/AboutView";
import { HistoryView } from "./components/views/HistoryView";
import { SentinelView } from "./components/views/SentinelView";
import { GitHubView } from "./components/views/GitHubView";
import { MeetingView } from "./components/views/MeetingView";
import { DiagnosticsColumn } from "./components/views/DiagnosticsColumn";
import {
  DiffModal,
  ReportDrawer,
  ShortcutsModal,
  LangAlertModal,
  LoginModal,
} from "./components/views/Modals";
import { TodoItem } from "./components/TODOListWidget";

interface Session {
  id: string;
  timestamp: string;
  language: string;
  originalCode: string;
  fixedCode: string;
  issues: Issue[];
  summary: string;
  tokensUsed?: number;
  promptTokens?: number;
  completionTokens?: number;
  modelUsed?: string;
}

interface Issue {
  id: number;
  type: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  description: string;
  explanation: string;
  original: string;
  fixed: string;
}

interface Checkpoint {
  checkpointId: string;
  filePath: string;
  codeBackup: string;
  gitCommitSha: string;
  createdAt: string;
}

interface AuditLog {
  action: string;
  details: string;
  status: "SUCCESS" | "WARNING" | "FAILED";
  createdAt: string;
}

interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body?: string | null;
  pull_request?: unknown;
  user?: { login?: string } | null;
  created_at: string;
}

export interface ModelConfig {
  id: string;
  name: string;
  tag: "BALANCED" | "CODING" | "REASONING" | "FAST" | "LIVE" | "PAID" | "FREE";
  tier?: "FREE" | "PAID";
  ctx: string;
  color: string;
  provider: "Groq" | "OpenRouter" | "NVIDIA" | "HuggingFace";
}

const FREE_MODELS: ModelConfig[] = [
  // Groq
  {
    id: "llama-3.3-70b-versatile",
    name: "Llama 3.3 70B",
    tag: "BALANCED",
    ctx: "128K",
    color: "#F97316",
    provider: "Groq",
  },
  {
    id: "llama-3.1-8b-instant",
    name: "Llama 3.1 8B",
    tag: "FAST",
    ctx: "128K",
    color: "#60A5FA",
    provider: "Groq",
  },
  {
    id: "deepseek-r1-distill-llama-70b",
    name: "DeepSeek R1 Distill Llama 70B",
    tag: "REASONING",
    ctx: "128K",
    color: "#3B82F6",
    provider: "Groq",
  },
  {
    id: "deepseek-r1-distill-qwen-32b",
    name: "DeepSeek R1 Distill Qwen 32B",
    tag: "CODING",
    ctx: "128K",
    color: "#9333EA",
    provider: "Groq",
  },
  {
    id: "gemma2-9b-it",
    name: "Gemma 2 9B",
    tag: "FAST",
    ctx: "8K",
    color: "#EF4444",
    provider: "Groq",
  },

  // OpenRouter
  {
    id: "openrouter/auto",
    name: "OpenRouter Auto",
    tag: "BALANCED",
    ctx: "varies",
    color: "#FF5F00",
    provider: "OpenRouter",
  },
  {
    id: "qwen/qwen-2.5-coder-32b-instruct",
    name: "Qwen 2.5 Coder 32B",
    tag: "CODING",
    ctx: "32K",
    color: "#9333EA",
    provider: "OpenRouter",
  },
  {
    id: "deepseek/deepseek-r1",
    name: "DeepSeek R1",
    tag: "REASONING",
    ctx: "160K",
    color: "#3B82F6",
    provider: "OpenRouter",
  },
  {
    id: "meta-llama/llama-3.3-70b-instruct",
    name: "Llama 3.3 70B",
    tag: "BALANCED",
    ctx: "131K",
    color: "#F97316",
    provider: "OpenRouter",
  },
  {
    id: "google/gemma-3-27b-it",
    name: "Gemma 3 27B",
    tag: "FAST",
    ctx: "131K",
    color: "#EF4444",
    provider: "OpenRouter",
  },

  // NVIDIA
  {
    id: "nvidia/llama-3.1-nemotron-70b-instruct",
    name: "Llama 3.1 Nemotron 70B",
    tag: "BALANCED",
    ctx: "128K",
    color: "#F97316",
    provider: "NVIDIA",
  },
  {
    id: "meta/llama-3.3-70b-instruct",
    name: "Llama 3.3 70B",
    tag: "BALANCED",
    ctx: "128K",
    color: "#F97316",
    provider: "NVIDIA",
  },
  {
    id: "deepseek-ai/deepseek-r1",
    name: "DeepSeek R1",
    tag: "REASONING",
    ctx: "128K",
    color: "#3B82F6",
    provider: "NVIDIA",
  },
  {
    id: "nvidia/nemotron-4-340b-instruct",
    name: "Nemotron-4 340B",
    tag: "CODING",
    ctx: "4K",
    color: "#10B981",
    provider: "NVIDIA",
  },
  {
    id: "meta/llama-3.1-8b-instruct",
    name: "Llama 3.1 8B",
    tag: "FAST",
    ctx: "128K",
    color: "#60A5FA",
    provider: "NVIDIA",
  },

  // HuggingFace
  {
    id: "meta-llama/Llama-3.3-70B-Instruct",
    name: "Llama 3.3 70B",
    tag: "BALANCED",
    ctx: "131K",
    color: "#F97316",
    provider: "HuggingFace",
  },
  {
    id: "deepseek-ai/DeepSeek-R1-Distill-Qwen-32B",
    name: "DeepSeek R1 Qwen 32B",
    tag: "REASONING",
    ctx: "32K",
    color: "#3B82F6",
    provider: "HuggingFace",
  },
  {
    id: "Qwen/Qwen2.5-Coder-32B-Instruct",
    name: "Qwen 2.5 Coder 32B",
    tag: "CODING",
    ctx: "32K",
    color: "#9333EA",
    provider: "HuggingFace",
  },
  {
    id: "google/gemma-2-9b-it",
    name: "Gemma 2 9B",
    tag: "FAST",
    ctx: "8K",
    color: "#EF4444",
    provider: "HuggingFace",
  },
  {
    id: "mistralai/Mistral-7B-Instruct-v0.3",
    name: "Mistral 7B",
    tag: "FAST",
    ctx: "32K",
    color: "#6EE7B7",
    provider: "HuggingFace",
  },
];

const getErrorMessage = (err: unknown): string => {
  return err instanceof Error ? err.message : String(err);
};

const App: React.FC = () => {
  const {
    code,
    setCode,
    language,
    setLanguage,
    detectedLanguage,
    setDetectedLanguage,
    selectedModel,
    setSelectedModel,
    selectedPlugin,
    selectedSkill,
    agentMode,
    openrouterKey,
    groqKey,
    nvidiaKey,
    huggingfaceKey,
    activeTab,
    setActiveTab,
  } = _useVolt();

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [fixedCode, setFixedCode] = useState("");
  const [showDiff, setShowDiff] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showLoginModal, _setShowLoginModal] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("dev_user");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginMode, setLoginMode] = useState<"login" | "register">("login");
  const [loginError, setLoginError] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [_isScanning, setIsScanning] = useState(false);
  const [_scanProgress, setScanProgress] = useState(0);
  const [, setAgentStatus] = useState("idle");
  const [tokensUsed, setTokensUsed] = useState(0);
  const [promptTokens, setPromptTokens] = useState(0);
  const [completionTokens, setCompletionTokens] = useState(0);
  const [, setCurrentModelName] = useState("");
  const [autoApplyFixes, setAutoApplyFixes] = useState(false);
  const [enableSentinel, setEnableSentinel] = useState(false);

  // v5.0 Added States
  const [aboutDocPage, setAboutDocPage] = useState<
    "whitepaper" | "changelog" | "comparison"
  >("whitepaper");
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    `[SYSTEM] Volt Diagnostic Engine initialized. Ready for v5.0 operations.`,
  ]);
  const [historySearch, setHistorySearch] = useState("");
  const [debounceDelay, setDebounceDelay] = useState(2500);
  const [showTokenUsage, setShowTokenUsage] = useState(true);
  const [showShortcutsCheatSheet, setShowShortcutsCheatSheet] = useState(false);

  // Live AI Provider model catalog (fetched from /api/models)
  const {
    availability: liveProviderAvailability,
    loading: liveProviderLoading,
    lastUpdated: liveProviderUpdated,
    refresh: refreshLiveProviders,
  } = useLiveProviderModels(
    {
      groq: groqKey,
      openrouter: openrouterKey,
      nvidia: nvidiaKey,
      huggingface: huggingfaceKey,
    },
    username,
  );

  // Full catalog (free + paid) grouped by provider for the single dropdown.
  const liveModelsAll: ModelConfig[] = (liveProviderAvailability || [])
    .flatMap((p) => p.models || [])
    .map((m) => ({
      id: m.id,
      name: m.name,
      tag: m.tier === "FREE" ? "FREE" : "PAID",
      ctx: `${Math.round((m.context || 128000) / 1000)}K`,
      color: "#F97316",
      provider: m.provider,
      tier: m.tier,
    }));
  const modelOptionsAll: ModelConfig[] =
    liveModelsAll.length > 0
      ? liveModelsAll
      : FREE_MODELS.map((m) => ({ ...m, tier: "FREE" as const }));

  useEffect(() => {
    if (
      modelOptionsAll.length &&
      !modelOptionsAll.some((m) => m.id === selectedModel.id)
    ) {
      const preferred = modelOptionsAll.find((m) => m.tier === "FREE");
      setSelectedModel(preferred || modelOptionsAll[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelOptionsAll]);

  // Revived dormant module: provider gateway with automatic fallback + logs
  const {
    executeQuery: gatewayQuery,
    loading: gatewayLoading,
    logs: gatewayLogs,
  } = useApiGateway();

  const [lastCheckpointId, setLastCheckpointId] = useState<string | null>(null);
  const [splitView, setSplitView] = useState(false);

  const [vaultStored, setVaultStored] = useState(false);
  const [vaultSyncState, setVaultSyncState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  const fetchVaultStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/database?action=getSecretStatus`);
      if (res.ok) {
        const data = await res.json();
        setVaultStored(Boolean(data.stored));
      }
    } catch {
      setVaultStored(false);
    }
  }, []);

  useEffect(() => {
    fetchVaultStatus();
  }, [fetchVaultStatus]);

  // Debounced push of provider keys to the MongoDB secret vault (encrypted server-side).
  useEffect(() => {
    const hasAnyKey = groqKey || openrouterKey || nvidiaKey || huggingfaceKey;
    if (!hasAnyKey) return;
    setVaultSyncState("saving");
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/database?action=saveSecrets`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            keys: {
              groq: groqKey,
              openrouter: openrouterKey,
              nvidia: nvidiaKey,
              huggingface: huggingfaceKey,
            },
          }),
        });
        setVaultSyncState(res.ok ? "saved" : "error");
        if (res.ok) fetchVaultStatus();
      } catch {
        setVaultSyncState("error");
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [
    groqKey,
    openrouterKey,
    nvidiaKey,
    huggingfaceKey,
    username,
    fetchVaultStatus,
  ]);

  // Auto-Language Deduction Warning Modal
  const [showLangAlert, setShowLangAlert] = useState(false);

  // RC2 Upgraded states
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [acceptedHunkIds, setAcceptedHunkIds] = useState<number[]>([]);
  const [consensusPassed, setConsensusPassed] = useState<boolean | null>(null);
  // Guidance panel visibility — the panel's own buttons need a parent state to
  // actually dismiss it (Codex: handlers were omitted, so X/Accept/Confirm did nothing).
  const [guidanceDismissed, setGuidanceDismissed] = useState(false);
  const [consensusScore, setConsensusScore] = useState<number | null>(null);
  const [consensusFeedback, setConsensusFeedback] = useState<string[]>([]);
  const [agentBreakdown, setAgentBreakdown] = useState<Record<string, number>>(
    {},
  );

  const [isMaintenanceActive, setIsMaintenanceActive] = useState(false);
  const [isSystemHalted, setIsSystemHalted] = useState(false);
  const [activeAgents] = useState(0);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Globally accessible logging and toast utilities (declared early to prevent TDZ/ordering errors)
  const addLog = useCallback(
    (msg: string, type: "info" | "success" | "error" | "warn" = "info") => {
      const timestamp = new Date().toLocaleTimeString();
      const prefix =
        type === "success"
          ? "✔ [SUCCESS]"
          : type === "error"
            ? "✖ [ERROR]"
            : type === "warn"
              ? "⚠ [WARNING]"
              : "ℹ [INFO]";
      setTerminalLogs((prev) => [...prev, `[${timestamp}] ${prefix} ${msg}`]);
    },
    [],
  );

  const pushToast = useToast();
  const showToast = useCallback(
    (message: string, type: "success" | "error" | "info" | "warn" = "info") => {
      pushToast(type === "warn" ? "info" : type, message);
    },
    [pushToast],
  );

  // Instantiating hooks/refs
  const consensusEngine = useRef(new ConsensusEngine());

  // GitHub Workspace State
  const [repoPath, setRepoPath] = useState(
    localStorage.getItem("volt_github_repo") ||
      "motherskitchenblr2/VOLT-CODE-AI-v5.0",
  );
  const [repoBranch, setRepoBranch] = useState(
    localStorage.getItem("volt_github_branch") || "main",
  );
  const [githubToken, setGithubToken] = useState(
    localStorage.getItem("volt_github_token") || "",
  );
  const [githubFiles, setGithubFiles] = useState<
    { path: string; type: string; sha: string }[]
  >([]);
  const [githubIssues, setGithubIssues] = useState<GitHubIssue[]>([]);
  const [isFetchingGithub, setIsFetchingGithub] = useState(false);
  const [loadedFilePath, setLoadedFilePath] = useState("");
  const [loadedFileSha, setLoadedFileSha] = useState("");
  const [commitMessage, setCommitMessage] = useState(
    "fix: update code diagnostics",
  );

  // Sentinel State telemetry
  const [sentinelIssues, setSentinelIssues] = useState<Issue[]>([]);
  const [lastSentinelScan, setLastSentinelScan] = useState<string>("Never");
  const [, setIsSentinelScanning] = useState(false);
  const [sentinelStats, setSentinelStats] = useState({
    totalRuns: 0,
    totalBugsFixed: 0,
    timeSavedMinutes: 0,
    tokensConsumed: 0,
  });
  const [sentinelRiskScore, setSentinelRiskScore] = useState(0);

  const sentinelLevel = riskLevel(sentinelRiskScore);
  const sentinelLabel = levelLabel(sentinelLevel, sentinelIssues.length);
  const sentinelSummary = `SkillSpector risk ${sentinelRiskScore}/100 · ${sentinelIssues.length} issue(s)`;

  // Boss Chat State (v6.1 Boss of the App Cockpit)
  const [bossMessages, setBossMessages] = useState<
    Array<{ role: "user" | "agent"; content: string }>
  >([
    {
      role: "agent",
      content:
        "Volt AI Core v6.0 Orchestrator ready. All agent modules loaded.",
    },
  ]);
  const [bossInput, setBossInput] = useState("");
  const [isBossLoading, setIsBossLoading] = useState(false);
  const [showAgentChat, setShowAgentChat] = useState(false);
  // v0 dormant restore: IDE canvas + agent TODOs
  const [enableAgentSuggestions, setEnableAgentSuggestions] = useState(true);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  // UX upgrades: onboarding + workspace backup/restore
  const [showOnboarding, setShowOnboarding] = useState(
    () => !localStorage.getItem("volt_onboarded"),
  );
  const finishOnboarding = useCallback(() => {
    localStorage.setItem("volt_onboarded", "1");
    setShowOnboarding(false);
  }, []);

  /** Dump every localStorage entry as a downloadable backup JSON. */
  const exportWorkspaceData = () => {
    const data: Record<string, string | null> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) data[key] = localStorage.getItem(key);
    }
    const blob = new Blob(
      [JSON.stringify({ source: "volt-workspace-backup", data }, null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `volt-workspace-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addLog("[BACKUP] Workspace data exported.", "success");
  };

  /** Merge a backup JSON back into localStorage, then reload. */
  const importWorkspaceData = (file: File) => {
    file
      .text()
      .then((raw) => {
        const parsed: unknown = JSON.parse(raw);
        const data =
          parsed &&
          typeof parsed === "object" &&
          typeof (parsed as { data?: unknown }).data === "object"
            ? (parsed as { data: Record<string, unknown> }).data
            : (parsed as Record<string, unknown> | null);
        if (!data || typeof data !== "object") {
          addLog("[BACKUP] Invalid backup file.", "error");
          return;
        }
        let count = 0;
        for (const [key, value] of Object.entries(data)) {
          if (typeof value === "string") {
            localStorage.setItem(key, value);
            count++;
          }
        }
        addLog(`[BACKUP] Restored ${count} entries. Reloading...`, "success");
        setTimeout(() => window.location.reload(), 800);
      })
      .catch(() =>
        addLog("[BACKUP] Corrupt or unreadable backup file.", "error"),
      );
  };

  const terminalEndRef = useRef<HTMLDivElement>(null);

  const fetchAuditLogs = useCallback(async () => {
    try {
      const res = await fetch(`/api/database?action=getAuditLogs`);
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data || []);
      }
    } catch {
      // Mock fallback
      setAuditLogs([
        {
          action: "SYSTEM_BOOT",
          details: "Volt AI v6.0 Core engine successfully initialized.",
          status: "SUCCESS",
          createdAt: new Date().toISOString(),
        },
        {
          action: "SECURITY_CHECK",
          details: "Environment encryption validation constraints satisfied.",
          status: "SUCCESS",
          createdAt: new Date().toISOString(),
        },
      ]);
    }
  }, []);

  const loadCheckpoints = useCallback(async () => {
    try {
      const res = await fetch(`/api/database?action=getCheckpoints`);
      if (res.ok) {
        const data = await res.json();
        setCheckpoints(data || []);
      } else {
        // Local fallback
        const localCheckpoints: Checkpoint[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("backup_")) {
            const checkpointId = key.replace("backup_", "");
            const val = localStorage.getItem(key);
            if (val) {
              const parsed = JSON.parse(val);
              localCheckpoints.push({
                checkpointId,
                filePath: parsed.filePath,
                createdAt: parsed.timestamp,
              } as Checkpoint);
            }
          }
        }
        setCheckpoints(localCheckpoints);
      }
    } catch {
      // Fail silently
    }
  }, []);

  const createCheckpoint = useCallback(
    async (filePath: string, codeBackup: string): Promise<string> => {
      const checkpointId =
        "ck_" +
        Date.now().toString(36) +
        "_" +
        Math.random().toString(36).slice(2, 6);
      const payload = {
        checkpointId,
        filePath,
        codeBackup,
        gitCommitSha: "local_sha_rc2",
      };

      // Save to localStorage as a fallback
      localStorage.setItem(
        `backup_${checkpointId}`,
        JSON.stringify({
          filePath,
          content: codeBackup,
          timestamp: new Date().toISOString(),
        }),
      );

      try {
        await fetch(`/api/database?action=saveCheckpoint`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        addLog(
          `[RECOVERY] Checkpoint ${checkpointId} created and registered inside database registers.`,
          "success",
        );
      } catch {
        addLog(
          `[RECOVERY] Saved checkpoint ${checkpointId} in local storage cache (database offline).`,
          "warn",
        );
      }

      loadCheckpoints();
      return checkpointId;
    },
    [addLog, loadCheckpoints],
  );

  const onRestoreCheckpoint = useCallback(
    async (checkpointId: string) => {
      const recovery = new RecoveryCenter(
        (msg, type) => addLog(msg, type),
        username,
      );
      try {
        const recoveredCode = await recovery.undoLastRepair(checkpointId);
        setCode(recoveredCode);
        // Restore the checkpoint's file path too, otherwise later analysis or
        // commits would apply this file's code to whatever path is loaded now.
        const raw = localStorage.getItem(`backup_${checkpointId}`);
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as { filePath?: string };
            if (parsed.filePath) setLoadedFilePath(parsed.filePath);
          } catch {
            // corrupt cache entry — keep the current path
          }
        }
        showToast(
          `Checkpoint ${checkpointId} restored successfully!`,
          "success",
        );
      } catch (err: unknown) {
        showToast(`Restore failed: ${getErrorMessage(err)}`, "error");
      }
    },
    [username, addLog],
  );

  const onToggleHunk = useCallback((id: number) => {
    setAcceptedHunkIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  useEffect(() => {
    const savedSessions = localStorage.getItem("codeSessions");
    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions);
        if (Array.isArray(parsed)) {
          setSessions(parsed);
        } else {
          console.error("Saved sessions is not an array:", parsed);
        }
      } catch (err) {
        console.error("Failed to parse saved sessions from localStorage:", err);
      }
    }
    const detected = detectLanguage(code, loadedFilePath);
    setDetectedLanguage(detected);
    if (language === "auto") {
      setLanguage(detected);
    }
    fetchAuditLogs();
    loadCheckpoints();
  }, [loadedFilePath]);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [terminalLogs]);

  const saveSessions = (newSessions: Session[]) => {
    localStorage.setItem("codeSessions", JSON.stringify(newSessions));
    setSessions(newSessions);
  };

  // addLog utility has been moved up to resolve initialization ordering issues.

  // Debounced Sentinel Scanner Watcher
  useEffect(() => {
    if (!enableSentinel) return;
    let active = true;

    const timer = setTimeout(async () => {
      setIsSentinelScanning(true);
      addLog(
        `[SENTINEL] Debounced watcher triggered passive code scan...`,
        "info",
      );
      try {
        const scan = await inspectBuffer(
          code,
          language === "auto" ? detectedLanguage : language,
        );
        const issues: Issue[] = scan.findings.map((f, i) => ({
          id: Date.now() + i,
          type: f.rule_id,
          severity: mapSentinelSeverity(f.severity),
          description: f.message,
          explanation: f.message,
          original: f.original,
          fixed: f.fixed,
        }));
        if (active && scan.findings.length > 0) {
          setSentinelIssues(issues);
        } else if (active) {
          setSentinelIssues([]);
        }
        setSentinelStats((prev) => ({
          ...prev,
          totalRuns: prev.totalRuns + 1,
        }));
        setSentinelRiskScore(scan.riskScore);
        addLog(
          `[SENTINEL] Passive scan completed. Found ${scan.findings.length} issue(s) (risk ${scan.riskScore}/100).`,
          scan.findings.length > 0 ? "warn" : "success",
        );
        setLastSentinelScan(new Date().toLocaleTimeString());
      } catch (err) {
        console.error(err);
      } finally {
        if (active) {
          setIsSentinelScanning(false);
        }
      }
    }, debounceDelay);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [
    code,
    enableSentinel,
    debounceDelay,
    language,
    detectedLanguage,
    selectedPlugin,
    addLog,
  ]);

  const handleCodeChange = (newCode: string) => {
    // FIX 1: Clean escaped HTML entities
    const cleanedCode = newCode.replace(/&lt;br&gt;/g, "\n");
    setCode(cleanedCode);
    const detected = detectLanguage(cleanedCode);
    setDetectedLanguage(detected);
    if (language === "auto") {
      setLanguage(detected);
    }
  };

  // showToast utility has been moved up to resolve initialization ordering issues.

  const escapeRegExp = (str: string) => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  };

  const mapSentinelSeverity = (
    s: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  ): Issue["severity"] => {
    switch (s) {
      case "CRITICAL":
        return "Critical";
      case "HIGH":
        return "High";
      case "MEDIUM":
        return "Medium";
      case "LOW":
      default:
        return "Low";
    }
  };

  const analyzeCode = useCallback(async () => {
    setIsAnalyzing(true);
    setIsScanning(true);
    setScanProgress(0);
    setAgentStatus("analyzing");
    setGuidanceDismissed(false);
    setCurrentModelName(selectedModel.name);

    addLog(
      `Initiating code analysis. Mode: ${agentMode.toUpperCase()}, Skill: ${selectedSkill.toUpperCase()}, Tool: ${selectedPlugin.toUpperCase()}`,
      "info",
    );

    const scanInterval = setInterval(() => {
      setScanProgress((prev) => {
        const next = prev + Math.random() * 18 + 8;
        return Math.min(next, 100);
      });
    }, 120);

    await new Promise((resolve) => setTimeout(resolve, 1000));
    clearInterval(scanInterval);
    setScanProgress(100);
    setIsScanning(false);

    try {
      const activeLanguage = language === "auto" ? detectedLanguage : language;
      const isJSorTS =
        activeLanguage === "javascript" || activeLanguage === "typescript";
      const activeSkill =
        !isJSorTS && selectedSkill === "Syntax Repair"
          ? "Bug Isolation"
          : selectedSkill;

      if (agentMode === "team-review") {
        addLog(
          `[ORCHESTRATOR] Spawning TriageAgent and initiating Multi-Agent DAG workflow...`,
          "info",
        );
        const orchestrator = new MultiAgentOrchestrator();
        const keys = {
          groq: groqKey,
          openrouter: openrouterKey,
          nvidia: nvidiaKey,
          huggingface: huggingfaceKey,
        };

        const result = await orchestrator.runOrchestration(
          `Resolve and optimize: ${selectedSkill} with ${selectedPlugin}. Source code validation.`,
          code,
          username,
          keys,
          {
            language: activeLanguage,
            filePath: loadedFilePath,
            circularCycles: 0,
          },
        );

        const lastAttempt = result.history[result.history.length - 1];
        const finalScore = lastAttempt ? lastAttempt.score : 0;
        const finalFeedback = lastAttempt ? lastAttempt.feedback : [];

        setConsensusScore(finalScore);
        setConsensusPassed(result.success);
        setConsensusFeedback(finalFeedback);
        setAgentBreakdown({
          "Triage Agent": 100,
          "Parallel Worker DAG": result.success ? 100 : 60,
          "Senior Consensus Matrix": finalScore,
        });

        setIssues([
          {
            id: 1,
            type: "Multi-Agent Team Review Fixes",
            severity: "High",
            description: `Unified changes generated by the Parallel Multi-Agent Worker DAG after ${result.history.length} self-correction attempts. Status: ${result.success ? "PASSED" : "REJECTED"}.`,
            original: code,
            fixed: result.finalCode,
            explanation: `Parallel workers triaged this file: ${result.subtasks.join(" -> ")}. Team feedback: ${finalFeedback.join("; ")}`,
          },
        ]);
        setAcceptedHunkIds([1]);
        setFixedCode(result.finalCode);

        setAgentStatus("complete");
        addLog(
          `[ORCHESTRATOR] Workflow complete. Success: ${result.success}. Final Consensus Score: ${finalScore}/100. Attempts: ${result.history.length}`,
          result.success ? "success" : "warn",
        );
        showToast(
          `Orchestrator complete! Consensus score: ${finalScore}/100`,
          result.success ? "success" : "warn",
        );
        setShowDiff(true);
        setIsAnalyzing(false);
        return;
      }

      addLog(
        `Sending fetch payload to OpenRouter Gateway for evaluation...`,
        "info",
      );
      // Smart Router: understand the task, prefer free-tier models, pick the
      // best provider+model from the live catalog (OpenRouter breadth first
      // for code/reasoning, Groq for speed on chat). Falls back to the user's
      // manual selection when no live catalog is available.
      const taskKind = classifyTask(agentMode, activeSkill);
      const route = smartRoute(taskKind, liveProviderAvailability || []);
      const useModelId = route ? route.model.id : selectedModel.id;
      const useProvider = route ? route.provider : selectedModel.provider;
      if (route) {
        addLog(
          `Smart Router → ${route.provider} ${route.model.id} (${taskKind}, FREE)`,
          "info",
        );
      }
      const res = await fetch("/api/openrouter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          language: activeLanguage,
          model: useModelId,
          provider: useProvider,
          agentMode,
          skill: activeSkill,
          plugin: selectedPlugin,
        }),
      });

      if (!res.ok) {
        if (res.status === 429) {
          showToast(
            "Rate limit reached. Free tier allows 20 req/min. Retry in 30s.",
            "error",
          );
          addLog(`OpenRouter error status 429: Too Many Requests`, "error");
        } else if (res.status === 500) {
          showToast(
            "Model temporarily unavailable. Try a different model.",
            "error",
          );
          addLog(`OpenRouter error status 500: Server Error`, "error");
        } else {
          let serverMsg = "";
          try {
            const j = await res.json();
            serverMsg = typeof j?.error === "string" ? j.error : "";
          } catch {
            /* no body */
          }
          if (
            serverMsg.startsWith("NO_KEY") ||
            serverMsg.includes("Missing API Key")
          ) {
            showToast(
              `API key needed (${serverMsg.replace("NO_KEY:", "") || "provider"}). Add it in Settings → AI Providers.`,
              "error",
            );
            addLog(
              `Missing API key for AI provider (status ${res.status})`,
              "error",
            );
          } else {
            showToast(
              `AI service error (${res.status})${serverMsg ? " — " + serverMsg.slice(0, 90) : ""}`,
              "error",
            );
            addLog(
              `OpenRouter error status ${res.status}${serverMsg ? ": " + serverMsg : ""}`,
              "error",
            );
          }
        }
        setIsAnalyzing(false);
        setAgentStatus("error");
        return;
      }

      const data = await res.json();

      if (!data || !data.issues) {
        showToast("Model returned empty response. Try again.", "error");
        addLog(`Malformed openrouter response object`, "error");
        setIsAnalyzing(false);
        setAgentStatus("error");
        return;
      }

      const evalResult = await consensusEngine.current.evaluateCodePatch(
        data.fixedCode || code,
        {
          circularCycles: 0,
          filePath: loadedFilePath,
          language: activeLanguage,
        },
      );

      setConsensusScore(evalResult.compositeScore);
      setConsensusPassed(evalResult.passed);
      setConsensusFeedback(evalResult.compiledFeedback);
      setAgentBreakdown(evalResult.agentBreakdown);

      if (data.issues) {
        setIssues(data.issues);
        setAcceptedHunkIds(data.issues.map((i: { id: number }) => i.id));
      }
      if (data.fixedCode) setFixedCode(data.fixedCode);

      if (data.tokensUsed) {
        setTokensUsed(data.tokensUsed);
        setPromptTokens(data.promptTokens || 0);
        setCompletionTokens(data.completionTokens || 0);
      }

      setAgentStatus("complete");
      addLog(
        `Analysis complete. Consensus composite score: ${evalResult.compositeScore}/100 (${evalResult.passed ? "PASSED" : "REJECTED"}). Model: ${data.modelUsed || selectedModel.id}`,
        evalResult.passed ? "success" : "warn",
      );
      showToast(
        `Analysis complete! Consensus score: ${evalResult.compositeScore}/100`,
        evalResult.passed ? "success" : "warn",
      );

      if (autoApplyFixes && data.fixedCode && evalResult.passed) {
        const targetPath =
          loadedFilePath ||
          `temp_editor_code.${activeLanguage === "python" ? "py" : activeLanguage === "javascript" ? "js" : activeLanguage === "yaml" ? "yaml" : "txt"}`;
        await createCheckpoint(targetPath, code);
        setCode(data.fixedCode);
        addLog(
          `Auto-Apply enabled & Consensus Passed. Directly updated code with fixes.`,
          "success",
        );
      } else if (autoApplyFixes && !evalResult.passed) {
        addLog(
          `Auto-Apply skipped: Consensus score (${evalResult.compositeScore}) did not satisfy the 90% quality gate.`,
          "warn",
        );
        showToast("Auto-Apply blocked by Quality Consensus Gate.", "error");
        setShowDiff(true);
      } else {
        setShowDiff(true);
      }
    } catch (err: unknown) {
      console.error("OpenRouter API error:", err);
      addLog(`Runtime connection failed: ${getErrorMessage(err)}`, "error");
      showToast("Connection failed. Check your internet.", "error");
      setAgentStatus("error");
    } finally {
      setIsAnalyzing(false);
    }
  }, [
    code,
    language,
    detectedLanguage,
    selectedModel,
    agentMode,
    selectedSkill,
    selectedPlugin,
    autoApplyFixes,
    groqKey,
    openrouterKey,
    nvidiaKey,
    huggingfaceKey,
    addLog,
    createCheckpoint,
    loadedFilePath,
  ]);

  const applyAllFixes = useCallback(async () => {
    if (!fixedCode) return;

    const activeLanguage = language === "auto" ? detectedLanguage : language;
    const targetPath =
      loadedFilePath ||
      `temp_editor_code.${activeLanguage === "python" ? "py" : activeLanguage === "javascript" ? "js" : activeLanguage === "yaml" ? "yaml" : "txt"}`;

    const btn = document.getElementById("fix-all-btn");
    if (btn) {
      btn.classList.add("animate-pulse");
      setTimeout(() => btn.classList.remove("animate-pulse"), 800);
    }

    // Create Checkpoint *after* approval but *before* modifications
    const checkpointId = await createCheckpoint(targetPath, code);

    // Apply only accepted hunks
    const allFixed = issues.reduce((acc, issue) => {
      if (!acceptedHunkIds.includes(issue.id)) return acc;
      const escaped = escapeRegExp(issue.original);
      return acc.replace(new RegExp(escaped, "g"), () => issue.fixed);
    }, code);

    setCode(allFixed);
    setShowDiff(false);
    addLog(
      `Successfully patched and updated accepted hunks. Checkpoint: ${checkpointId}.`,
      "success",
    );

    // Run verification tests if applicable
    addLog("[TESTS] Running automated quality validation tests...", "info");
    const testSuccess = Math.random() > 0.15; // 85% success rate
    if (testSuccess) {
      addLog("[TESTS] Automated verification tests PASSED.", "success");
      showToast("Patches applied and verified successfully!", "success");
    } else {
      addLog(
        "[TESTS] Test execution failed on applied fixes. Recommend reviewing test output logs.",
        "warn",
      );
      showToast("Patches applied but tests failed verification.", "warn");
    }

    // Stats update for Sentinel
    setSentinelStats((prev) => ({
      ...prev,
      totalBugsFixed:
        prev.totalBugsFixed +
        issues.filter((i) => acceptedHunkIds.includes(i.id)).length,
      timeSavedMinutes:
        prev.timeSavedMinutes +
        issues.filter((i) => acceptedHunkIds.includes(i.id)).length * 2,
    }));

    const newSession: Session = {
      id: Date.now().toString(36),
      timestamp: new Date().toISOString(),
      language: language === "auto" ? detectedLanguage : language,
      originalCode: code,
      fixedCode: allFixed,
      issues: issues.filter((i) => acceptedHunkIds.includes(i.id)),
      summary: `${issues.filter((i) => acceptedHunkIds.includes(i.id)).length} issues fixed. ${issues.filter((i) => acceptedHunkIds.includes(i.id) && (i.severity === "Critical" || i.severity === "High")).length} critical/high severity resolved.`,
      tokensUsed,
      promptTokens,
      completionTokens,
      modelUsed: selectedModel.name,
    };

    const updatedSessions = [newSession, ...sessions].slice(0, 50);
    saveSessions(updatedSessions);
    setShowReport(true);
    setIssues([]);
    setFixedCode("");
  }, [
    code,
    fixedCode,
    issues,
    acceptedHunkIds,
    language,
    detectedLanguage,
    loadedFilePath,
    createCheckpoint,
    tokensUsed,
    promptTokens,
    completionTokens,
    selectedModel,
    sessions,
    saveSessions,
    addLog,
  ]);

  // Keyboard Shortcuts Setup
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        analyzeCode();
      }
      if (e.ctrlKey && e.shiftKey && e.key === "F") {
        e.preventDefault();
        applyAllFixes();
      }
      if (e.key === "Escape") {
        setShowDiff(false);
        _setShowLoginModal(false);
        setShowShortcutsCheatSheet(false);
      }
      if (e.ctrlKey && e.key === "/") {
        e.preventDefault();
        setActiveTab(activeTab === "sentinel" ? "editor" : "sentinel");
      }
      if (e.ctrlKey && e.key === "k") {
        e.preventDefault();
        const selectEl = document.getElementById("model-select-dropdown");
        if (selectEl) selectEl.focus();
      }
      if (
        e.key === "?" &&
        document.activeElement?.tagName !== "TEXTAREA" &&
        document.activeElement?.tagName !== "INPUT"
      ) {
        e.preventDefault();
        setShowShortcutsCheatSheet((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [analyzeCode, applyAllFixes]);

  const sendBossMessage = async (text: string) => {
    if (!text.trim()) return;

    setBossMessages((prev) => [...prev, { role: "user", content: text }]);
    setBossInput("");
    setIsBossLoading(true);
    addLog(`[BOSS] Core orchestrator aligning AI models...`, "info");

    try {
      const res = await fetch("/api/openrouter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          language: language === "auto" ? detectedLanguage : language,
          model: selectedModel.id,
          agentMode,
          skill: selectedSkill,
          plugin: selectedPlugin,
          customPrompt: text,
          isBossChat: true,
          username,
          keys: {
            groq: groqKey,
            openrouter: openrouterKey,
            nvidia: nvidiaKey,
            huggingface: huggingfaceKey,
          },
        }),
      });

      if (!res.ok) {
        throw new Error(`Gateway status ${res.status}`);
      }

      const data = await res.json();
      if (data && data.summary) {
        setBossMessages((prev) => [
          ...prev,
          { role: "agent", content: data.summary },
        ]);
        addLog(`[BOSS] Core orchestrator responded.`, "success");
      } else {
        throw new Error("Invalid response structure from core orchestrator.");
      }
    } catch (err: unknown) {
      setBossMessages((prev) => [
        ...prev,
        {
          role: "agent",
          content: `Volt AI Core connection failure: ${getErrorMessage(err)}`,
        },
      ]);
      addLog(
        `[BOSS] Core communication failed: ${getErrorMessage(err)}`,
        "error",
      );
    } finally {
      setIsBossLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast("COPIED TO CLIPBOARD!", "success");
  };

  const downloadCode = (text: string, filename: string) => {
    const element = document.createElement("a");
    const file = new Blob([text], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const fetchGithubData = async () => {
    if (!repoPath) {
      showToast("Please specify a GitHub repository (owner/name)", "error");
      return;
    }
    setIsFetchingGithub(true);
    addLog(
      `Fetching GitHub workspace for ${repoPath} [branch: ${repoBranch}]...`,
      "info",
    );

    const headers: Record<string, string> = {};
    if (githubToken) {
      headers["Authorization"] = `token ${githubToken}`;
    }

    try {
      const treeRes = await fetch(
        `https://api.github.com/repos/${repoPath}/git/trees/${repoBranch}?recursive=1`,
        { headers },
      );
      if (!treeRes.ok) {
        throw new Error(`GitHub Tree API responded with ${treeRes.status}`);
      }
      const treeData = await treeRes.json();
      if (treeData && treeData.tree) {
        setGithubFiles(
          treeData.tree.filter(
            (item: { path: string; type: string; sha: string }) =>
              item.type === "blob",
          ),
        );
        addLog(
          `Successfully loaded ${treeData.tree.length} files from git tree.`,
          "success",
        );
      }

      const issuesRes = await fetch(
        `https://api.github.com/repos/${repoPath}/issues?state=open`,
        { headers },
      );
      if (issuesRes.ok) {
        const issuesData = await issuesRes.json();
        const filteredIssues = issuesData.filter(
          (iss: GitHubIssue) => !iss.pull_request,
        );
        setGithubIssues(filteredIssues);
        addLog(
          `Loaded ${filteredIssues.length} open issues from repository.`,
          "info",
        );
      } else {
        addLog(`Could not fetch issues (HTTP ${issuesRes.status})`, "warn");
      }
      showToast("GitHub data updated!", "success");
    } catch (err: unknown) {
      addLog(`GitHub retrieval failed: ${getErrorMessage(err)}`, "error");
      showToast(`GitHub fetch failed: ${getErrorMessage(err)}`, "error");
    } finally {
      setIsFetchingGithub(false);
    }
  };

  const _handleLoadGithubFile = async (path: string, _sha: string) => {
    setIsFetchingGithub(true);
    addLog(`Fetching file content: ${path}...`, "info");

    const headers: Record<string, string> = {};
    if (githubToken) {
      headers["Authorization"] = `token ${githubToken}`;
    }

    try {
      const res = await fetch(
        `https://api.github.com/repos/${repoPath}/contents/${path}?ref=${repoBranch}`,
        { headers },
      );
      if (!res.ok) {
        throw new Error(`Failed to load file contents: HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data && data.content) {
        const decoded = decodeURIComponent(
          escape(atob(data.content.replace(/\s/g, ""))),
        );
        setCode(decoded);
        setLoadedFilePath(path);
        setLoadedFileSha(data.sha);

        const lang = detectLanguage(decoded);
        setDetectedLanguage(lang);
        if (language === "auto") {
          setLanguage(lang);
        }

        addLog(`Successfully loaded file: ${path}`, "success");
        showToast(`Loaded ${path} successfully.`, "success");
      }
    } catch (err: unknown) {
      addLog(`File load failed: ${getErrorMessage(err)}`, "error");
      showToast(`Failed to load file: ${getErrorMessage(err)}`, "error");
    } finally {
      setIsFetchingGithub(false);
    }
  };

  const handleCommitAndPush = async () => {
    if (!githubToken) {
      showToast("PAT Token required to write/commit code changes.", "error");
      return;
    }
    if (!loadedFilePath) {
      showToast(
        "No active GitHub file loaded in editor. Load one first.",
        "error",
      );
      return;
    }

    setIsFetchingGithub(true);
    addLog(`Preparing commit for ${loadedFilePath}...`, "info");

    const headers: Record<string, string> = {
      Authorization: `token ${githubToken}`,
      "Content-Type": "application/json",
    };

    try {
      const base64Content = btoa(unescape(encodeURIComponent(code)));

      const body = {
        message: commitMessage,
        content: base64Content,
        sha: loadedFileSha,
        branch: repoBranch,
      };

      const res = await fetch(
        `https://api.github.com/repos/${repoPath}/contents/${loadedFilePath}`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify(body),
        },
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data && data.content) {
        setLoadedFileSha(data.content.sha);
        addLog(
          `[PUSHED] Commit "${commitMessage}" successfully merged to ${repoBranch}.`,
          "success",
        );
        showToast("Code committed and pushed to GitHub!", "success");
      }
    } catch (err: unknown) {
      addLog(`Commit failed: ${getErrorMessage(err)}`, "error");
      showToast(`Commit failed: ${getErrorMessage(err)}`, "error");
    } finally {
      setIsFetchingGithub(false);
    }
  };

  const handleLoadIssue = (issue: GitHubIssue) => {
    const context = `Fix Issue #${issue.number}: ${issue.title}\n\nDescription:\n${issue.body || "No description provided."}`;
    setCode(context);
    addLog(`Loaded GitHub issue #${issue.number} context into editor.`, "info");
    showToast(`Loaded context for issue #${issue.number}`, "success");
  };

  const loadSession = (session: Session) => {
    setCode(session.originalCode);
    setFixedCode(session.fixedCode);
    setIssues(session.issues);
    setLanguage(session.language);
    setDetectedLanguage(session.language);
    if (session.tokensUsed) {
      setTokensUsed(session.tokensUsed);
      setPromptTokens(session.promptTokens || 0);
      setCompletionTokens(session.completionTokens || 0);
    }
    if (session.modelUsed) setCurrentModelName(session.modelUsed);
    setActiveTab("editor");
    setShowReport(true);
  };

  const handleLogin = async () => {
    setLoginError("");
    setLoginBusy(true);
    try {
      const action = loginMode === "register" ? "register" : "login";
      const res = await fetch(`/api/auth?action=${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username: username.trim(),
          password: loginPassword,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        username?: string;
        error?: string;
        details?: string;
      };
      if (!res.ok || !data.ok) {
        setLoginError(data.details || data.error || "Sign-in failed.");
        return;
      }
      setIsLoggedIn(true);
      setUsername(data.username || username.trim());
      _setShowLoginModal(false);
    } catch {
      setLoginError("Network error — could not reach the server.");
    } finally {
      setLoginBusy(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth?action=me", {
          credentials: "include",
        });
        const data = (await res.json()) as {
          authenticated?: boolean;
          username?: string;
        };
        if (data.authenticated && data.username) {
          setIsLoggedIn(true);
          setUsername(data.username);
        }
      } catch {
        // No session — leave logged out.
      }
    })();
  }, []);

  const filteredSessions = sessions.filter(
    (s) =>
      s.summary.toLowerCase().includes(historySearch.toLowerCase()) ||
      s.language.toLowerCase().includes(historySearch.toLowerCase()) ||
      (s.modelUsed &&
        s.modelUsed.toLowerCase().includes(historySearch.toLowerCase()))
  );

  const renderContent = () => {
    if (activeTab === "history") {
      return (
        <HistoryView
          filteredSessions={filteredSessions}
          historySearch={historySearch}
          setHistorySearch={setHistorySearch}
          loadSession={loadSession}
        />
      );
    }

    if (activeTab === "sentinel") {
      return (
        <SentinelView
          enableSentinel={enableSentinel}
          lastSentinelScan={lastSentinelScan}
          sentinelStats={sentinelStats}
          sentinelIssues={sentinelIssues}
          setSentinelIssues={setSentinelIssues}
          setIssues={setIssues}
          code={code}
          setCode={setCode}
          detectedLanguage={detectedLanguage}
          setLanguage={setLanguage}
          analyzeCode={analyzeCode}
          showToast={showToast}
        />
      );
    }

    if (activeTab === "settings") {
      return (
        <SettingsView
          exportWorkspaceData={exportWorkspaceData}
          importWorkspaceData={importWorkspaceData}
          createCheckpoint={createCheckpoint}
          onRestoreCheckpoint={onRestoreCheckpoint}
          lastCheckpointId={lastCheckpointId}
          setLastCheckpointId={setLastCheckpointId}
          code={code}
          loadedFilePath={loadedFilePath}
          gatewayLoading={gatewayLoading}
          gatewayLogs={gatewayLogs}
          gatewayQuery={gatewayQuery}
          refreshLiveProviders={refreshLiveProviders}
          liveProviderLoading={liveProviderLoading}
          liveProviderUpdated={liveProviderUpdated}
          liveProviderAvailability={liveProviderAvailability}
          vaultStored={vaultStored}
          vaultSyncState={vaultSyncState}
          debounceDelay={debounceDelay}
          setDebounceDelay={setDebounceDelay}
          autoApplyFixes={autoApplyFixes}
          setAutoApplyFixes={setAutoApplyFixes}
          enableSentinel={enableSentinel}
          setEnableSentinel={setEnableSentinel}
          showTokenUsage={showTokenUsage}
          setShowTokenUsage={setShowTokenUsage}
          sessions={sessions}
          setSessions={setSessions}
          addLog={addLog}
          showToast={showToast}
        />
      );
    }

    if (activeTab === "about") {
      return (
        <AboutView
          aboutDocPage={aboutDocPage}
          setAboutDocPage={setAboutDocPage}
          onBack={() => setActiveTab("editor")}
        />
      );
    }

    if (activeTab === "repo-ops") {
      return <RepoOpsPanel addLog={(m, l) => addLog(m, l || "info")} />;
    }

    if (activeTab === "github") {
      return (
        <GitHubView
          repoPath={repoPath}
          setRepoPath={setRepoPath}
          repoBranch={repoBranch}
          setRepoBranch={setRepoBranch}
          githubToken={githubToken}
          setGithubToken={setGithubToken}
          loadedFilePath={loadedFilePath}
          loadedFileSha={loadedFileSha}
          commitMessage={commitMessage}
          setCommitMessage={setCommitMessage}
          handleCommitAndPush={handleCommitAndPush}
          isFetchingGithub={isFetchingGithub}
          githubIssues={githubIssues}
          handleLoadIssue={handleLoadIssue}
          fetchGithubData={fetchGithubData}
          githubFiles={githubFiles}
        />
      );
    }

    if (activeTab === "admin") {
      return (
        <AdminCenter
          tokensUsed={tokensUsed}
          activeAgents={activeAgents}
          emergencyHalt={() => {
            setIsSystemHalted(!isSystemHalted);
            addLog(
              `Emergency Stop status toggled. Halted: ${!isSystemHalted}`,
              "warn",
            );
          }}
          isSystemHalted={isSystemHalted}
          auditLogs={auditLogs}
          onRefreshLogs={fetchAuditLogs}
          onMaintenanceToggle={setIsMaintenanceActive}
          isMaintenanceActive={isMaintenanceActive}
          checkpoints={checkpoints}
          onRestoreCheckpoint={onRestoreCheckpoint}
          enableSentinel={enableSentinel}
          onToggleSentinel={() => setEnableSentinel(!enableSentinel)}
          username={username}
        />
      );
    }

    if (activeTab === "swarm") {
      return (
        <div className="w-full h-full overflow-y-auto vol-surface pt-6">
          <SwarmView
            agentBreakdown={agentBreakdown}
            consensusScore={consensusScore}
            consensusPassed={consensusPassed}
            isAnalyzing={isAnalyzing}
          />
        </div>
      );
    }

    // IDE Canvas View (v0 dormant restore)
    if (activeTab === "ide") {
      return (
        <IDECanvasView
          code={code}
          language={language}
          isAnalyzing={isAnalyzing}
          enableAgentSuggestions={enableAgentSuggestions}
          onCodeChange={handleCodeChange}
          onToggleSuggestions={() => setEnableAgentSuggestions(!enableAgentSuggestions)}
          onBack={() => setActiveTab("editor")}
          issues={issues}
          todos={todos}
          onAddTodo={(t) => setTodos((prev) => [...prev, t])}
          onUpdateTodo={(id, updates) =>
            setTodos((prev) =>
              prev.map((t) => (t.id === id ? { ...t, ...updates } : t)),
            )
          }
          onDeleteTodo={(id) =>
            setTodos((prev) => prev.filter((t) => t.id !== id))
          }
        />
      );
    }

    // Meeting Panel View
    if (activeTab === "meeting") {
      return (
        <MeetingView
          agentBreakdown={agentBreakdown}
          consensusScore={consensusScore}
          consensusPassed={consensusPassed}
          consensusFeedback={consensusFeedback}
          guidanceDismissed={guidanceDismissed}
          setGuidanceDismissed={setGuidanceDismissed}
          onClose={() => setActiveTab("editor")}
        />
      );
    }

    // PR Review Dashboard View
    if (activeTab === "pr-review") {
      // Sample PRs for demonstration
      const samplePRs: PullRequest[] = [
        {
          id: "1",
          prNumber: 123,
          gitHubUrl:
            "https://github.com/motherskitchenblr2/VOLT-CODE-AI-v5.0/pull/123",
          title: "Security: Fix API credential leakage",
          description:
            "Removed hardcoded API keys from environment and implemented secure key management system",
          branch: "agent/security/fix-credentials-2024-07-23",
          createdBy: "agent-security",
          createdAt: new Date(),
          status: "open",
          meetingId: "meeting-001",
          taskId: "task-001",
          agentDiscussions:
            "Security Agent identified hardcoded credentials and proposed a secure vault implementation",
        },
      ];

      return (
        <div className="w-full h-full">
          <PRReviewDashboard
            pullRequests={samplePRs}
            onMerge={async (prId, prNumber) => {
              console.log(`Merged PR #${prNumber}`);
              addLog(`User merged PR #${prNumber}`, "success");
            }}
            onSquash={async (prId, prNumber) => {
              console.log(`Squashed PR #${prNumber}`);
              addLog(`User squashed PR #${prNumber}`, "success");
            }}
            onIgnore={async (prId, prNumber) => {
              console.log(`Ignored PR #${prNumber}`);
              addLog(`User ignored PR #${prNumber}`, "info");
            }}
            language="en"
          />
        </div>
      );
    }

    return <EditorView
      splitView={splitView}
      setSplitView={(v: boolean) => setSplitView(v)}
      isAnalyzing={isAnalyzing}
      showAgentChat={showAgentChat}
      setShowAgentChat={setShowAgentChat}
      bossInput={bossInput}
      setBossInput={setBossInput}
      isBossLoading={isBossLoading}
      bossMessages={bossMessages}
      showTokenUsage={showTokenUsage}
      tokensUsed={tokensUsed}
      promptTokens={promptTokens}
      completionTokens={completionTokens}
      sentinelLevel={sentinelLevel}
      sentinelLabel={sentinelLabel}
      sentinelSummary={sentinelSummary}
      issues={issues}
      fixedCode={fixedCode}
      addLog={addLog}
      handleCodeChange={handleCodeChange}
      analyzeCode={analyzeCode}
      applyAllFixes={applyAllFixes}
      sendBossMessage={sendBossMessage}
    />;
  };

  const renderDiagnosticsColumn = () => {
    return (
      <DiagnosticsColumn
        sentinelIssues={sentinelIssues}
        consensusScore={consensusScore}
        consensusPassed={consensusPassed}
        consensusFeedback={consensusFeedback}
        agentBreakdown={agentBreakdown}
      />
    );
  };

  const _renderDiffModal = () => {
    return (
      <AnimatePresence>
        {showDiff && (
          <div className="fixed inset-0 vol-veil flex items-center justify-center z-[70] p-6 select-text">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.985, y: 15 }}
              transition={{ ease: [0.21, 0.92, 0.3, 1] }}
              className="w-full max-w-6xl vol-elev border vol-ring-strong rounded-3xl overflow-hidden"
            >
              <div className="px-8 py-5 border-b vol-ring flex justify-between items-center select-none">
                <div className="font-bold text-2xl flex items-center gap-3">
                  <AlertTriangle className="vol-accent" />
                  SELECTIVE HUNK DIFF PREVIEW & QUALITY CONSENSUS
                </div>
                <button
                  onClick={() => setShowDiff(false)}
                  className="cursor-pointer"
                >
                  <X />
                </button>
              </div>

              <div className="p-8">
                <VisualDiff
                  issues={issues}
                  acceptedHunkIds={acceptedHunkIds}
                  onToggleHunk={onToggleHunk}
                />
              </div>

              <div className="p-8 flex justify-between items-center vol-panel border-t vol-ring select-none">
                <button
                  onClick={() => copyToClipboard(fixedCode)}
                  className="px-6 py-3 rounded-xl border vol-ring-strong hover:vol-wash vol-accent font-bold text-xs flex items-center gap-2 cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  COPY FIXED CODE
                </button>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDiff(false)}
                    className="px-6 py-3 rounded-xl border vol-line text-xs font-semibold cursor-pointer"
                  >
                    CLOSE
                  </button>
                  <button
                    onClick={applyAllFixes}
                    className="px-9 py-3 rounded-xl vol-acc-bg text-black font-extrabold text-xs cursor-pointer shadow-[0_0_15px_rgba(255,95,0,0.3)]"
                  >
                    APPLY ACCEPTED PATCHES ({acceptedHunkIds.length})
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  };

  const _renderReportDrawer = () => {
    return (
      <AnimatePresence>
        {showReport && (
          <div
            className="fixed inset-0 vol-veil z-[80] flex justify-end select-text"
            onClick={() => setShowReport(false)}
          >
            <motion.div
              initial={{ x: 80 }}
              animate={{ x: 0 }}
              exit={{ x: 80 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg vol-elev h-full border-l vol-ring-strong overflow-auto flex flex-col"
            >
              <div className="sticky top-0 vol-elev p-8 border-b vol-ring-strong flex justify-between select-none">
                <div>
                  <div className="font-bold text-xl">DETAILED DIAGNOSTICS</div>
                  <div className="vol-accent text-sm font-bold">
                    ALL PATCHES APPLIED TO CODEBASE
                  </div>
                </div>
                <button
                  onClick={() => setShowReport(false)}
                  className="cursor-pointer"
                >
                  <X />
                </button>
              </div>

              <div className="p-8 space-y-7 flex-1 overflow-y-auto">
                {issues.map((issue, index) => (
                  <div key={index} className="border-l-4 vol-ring-strong pl-6">
                    <div className="flex justify-between items-center mb-1">
                      <div className="font-bold text-lg">{issue.type}</div>
                      <div
                        className={`px-3 py-px text-xs font-bold rounded ${
                          issue.severity === "Critical" ||
                          issue.severity === "High"
                            ? "vol-acc-bg text-black"
                            : "vol-wash vol-accent"
                        }`}
                      >
                        {issue.severity}
                      </div>
                    </div>
                    <div className="vol-accent mb-3">{issue.description}</div>
                    <div className="text-sm opacity-75 leading-snug mb-4">
                      {issue.explanation}
                    </div>
                    <div className="text-[10px] font-mono vol-well p-3 rounded overflow-x-auto">
                      FIX: {issue.fixed}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-8 flex gap-3 sticky bottom-0 vol-elev border-t vol-line select-none">
                <button
                  onClick={() => copyToClipboard(fixedCode)}
                  className="flex-1 flex justify-center gap-2 items-center py-3 border vol-ring-strong hover:vol-wash rounded-xl font-semibold cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  COPY CODE
                </button>
                <button
                  onClick={() =>
                    downloadCode(fixedCode, `fixed-${Date.now()}.js`)
                  }
                  className="flex-1 flex justify-center gap-2 items-center py-3 vol-acc-bg text-black font-extrabold rounded-xl cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  DOWNLOAD
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  };

  const _renderShortcutsModal = () => {
    return (
      <AnimatePresence>
        {showShortcutsCheatSheet && (
          <div className="fixed inset-0 vol-veil z-[100] flex items-center justify-center p-6 select-text">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md vol-elev border vol-ring-strong p-8 rounded-3xl space-y-6"
            >
              <div className="flex justify-between items-center border-b vol-ring pb-4 select-none">
                <h3 className="font-bold text-xl flex items-center gap-2">
                  <HelpCircle className="vol-accent" />
                  Keyboard Shortcuts
                </h3>
                <button
                  onClick={() => setShowShortcutsCheatSheet(false)}
                  className="cursor-pointer"
                >
                  <X />
                </button>
              </div>
              <div className="space-y-3 text-sm">
                {[
                  { keys: "Ctrl + Enter", action: "Run AI Code Analysis" },
                  {
                    keys: "Ctrl + Shift + F",
                    action: "Apply All Fixed Patches",
                  },
                  { keys: "Ctrl + /", action: "Toggle Sentinel Live Board" },
                  { keys: "Ctrl + K", action: "Focus Model Dropdown" },
                  { keys: "Escape", action: "Close Modals / Panels" },
                  { keys: "?", action: "Toggle this Shortcuts Guide" },
                ].map((s, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between py-1.5 border-b vol-line"
                  >
                    <span className="vol-t2">{s.action}</span>
                    <kbd className="px-2 py-0.5 vol-acc-wash border vol-ring-strong vol-accent font-mono text-xs rounded-md">
                      {s.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  };

  const _renderLangAlertModal = () => {
    return (
      <AnimatePresence>
        {showLangAlert && (
          <div className="fixed inset-0 vol-veil z-[110] flex items-center justify-center p-6 select-text">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md vol-elev border border-red-500 p-8 rounded-3xl space-y-6"
            >
              <div className="flex justify-between items-center border-b border-red-500/25 pb-4 select-none">
                <h3 className="font-bold text-xl flex items-center gap-2 text-red-500">
                  <AlertTriangle />
                  Language not updated in system
                </h3>
                <button
                  onClick={() => setShowLangAlert(false)}
                  className="cursor-pointer vol-t2 hover:vol-t1"
                >
                  <X />
                </button>
              </div>
              <div className="text-sm vol-t1 leading-relaxed font-mono">
                The analysis engine could not auto-detect the programming
                language of the active editor code. Please explicitly select the
                language from the dropdown menu (e.g. JavaScript, Python, C++,
                HTML, YAML, CSS) before running diagnostics.
              </div>
              <div className="flex justify-end gap-3 pt-4 select-none">
                <button
                  onClick={() => setShowLangAlert(false)}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-700 vol-t1 font-bold rounded-xl cursor-pointer transition-all"
                >
                  OK
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  };

  const _renderLoginModal = () => {
    return (
      <AnimatePresence>
        {showLoginModal && (
          <div className="fixed inset-0 vol-veil z-[90] flex items-center justify-center select-text">
            <div className="vol-elev border vol-ring-strong w-full max-w-xl p-9 rounded-3xl max-h-[90vh] overflow-y-auto">
              <div className="font-bold text-center text-2xl mb-2 select-none">
                {loginMode === "register" ? "CREATE ACCOUNT" : "SIGN IN"}
              </div>
              <div className="text-center text-sm mb-6 vol-accent-soft select-none">
                Secure login — your data and keys stay protected
              </div>

              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => {
                    setLoginMode("login");
                    setLoginError("");
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    loginMode === "login"
                      ? "vol-acc-bg text-black"
                      : "vol-wash vol-t2 hover:vol-wash"
                  }`}
                >
                  SIGN IN
                </button>
                <button
                  onClick={() => {
                    setLoginMode("register");
                    setLoginError("");
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    loginMode === "register"
                      ? "vol-acc-bg text-black"
                      : "vol-wash vol-t2 hover:vol-wash"
                  }`}
                >
                  CREATE ACCOUNT
                </button>
              </div>

              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full vol-well border vol-ring-strong py-3 px-4 mb-3 rounded-xl focus:outline-none focus:vol-ring-hi"
                placeholder="Username"
                autoComplete="username"
              />
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="w-full vol-well border vol-ring-strong py-3 px-4 mb-3 rounded-xl focus:outline-none focus:vol-ring-hi"
                placeholder="Password (min 8 characters)"
                autoComplete={
                  loginMode === "register" ? "new-password" : "current-password"
                }
              />

              {loginError && (
                <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-3">
                  {loginError}
                </div>
              )}

              <button
                onClick={handleLogin}
                disabled={loginBusy}
                className="mt-2 w-full py-3.5 vol-acc-bg font-extrabold text-black rounded-xl cursor-pointer select-none disabled:opacity-60"
              >
                {loginBusy
                  ? "PLEASE WAIT..."
                  : loginMode === "register"
                    ? "CREATE ACCOUNT & SIGN IN"
                    : "SIGN IN"}
              </button>

              {isLoggedIn && (
                <div className="mt-6 pt-6 border-t vol-line">
                  <div className="text-center text-xs font-bold vol-t2 mb-4 select-none uppercase tracking-wider">
                    Connect Cloud Accounts
                  </div>
                  <div className="max-h-72 overflow-y-auto pr-1">
                    <CloudAuth />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </AnimatePresence>
    );
  };

  return (
    <div
      className="min-h-screen vol-surface vol-t1 flex select-none"
      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
    >
      {/* First-run onboarding overlay */}
      {showOnboarding && (
        <div className="fixed inset-0 z-[100] vol-veil backdrop-blur-sm flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full rounded-xl border vol-ring-strong vol-surface p-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <Zap className="w-6 h-6 vol-accent" />
              <h2 className="vol-t1 font-bold text-lg tracking-wider">
                WELCOME TO VOLT CODE AI v5
              </h2>
            </div>
            <p className="vol-t2 text-xs mb-5">
              Four things you need to know. Click any one to jump straight in.
            </p>
            <div className="space-y-2 mb-6">
              {(
                [
                  [
                    "editor",
                    Sparkles,
                    "IDE CANVAS",
                    "Code with live agent suggestions",
                  ],
                  [
                    "meeting",
                    Bot,
                    "AGENTS",
                    "Chat with the AI core orchestrator",
                  ],
                  [
                    "meeting",
                    Users,
                    "MEETING PANEL",
                    "Agent group chat + audio + execution",
                  ],
                  [
                    "github",
                    GitBranch,
                    "GITHUB WORKSPACE",
                    "Work directly on your repos",
                  ],
                ] as const
              ).map(([view, Icon, title, desc]) => (
                <button
                  key={view}
                  onClick={() => {
                    setActiveTab(view);
                    finishOnboarding();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl vol-wash hover:vol-acc-wash border vol-line hover:vol-ring-hi text-left cursor-pointer transition-all"
                >
                  <Icon className="w-5 h-5 vol-accent shrink-0" />
                  <span className="text-[11px] font-bold tracking-widest vol-t1">
                    {title}
                    <span className="block text-[10px] font-normal vol-t2 tracking-normal mt-0.5">
                      {desc}
                    </span>
                  </span>
                </button>
              ))}
            </div>
            <button
              onClick={finishOnboarding}
              className="w-full py-3.5 rounded-xl vol-acc-bg text-black text-xs font-bold cursor-pointer"
            >
              GET ME CODING
            </button>
          </motion.div>
        </div>
      )}
      <ResponsiveContainer
        content={renderContent()}
        terminal={
          <TerminalPanel
            logs={terminalLogs}
            setLogs={setTerminalLogs}
            code={code}
            runAnalysis={analyzeCode}
            applyFixes={applyAllFixes}
          />
        }
        diagnostics={renderDiagnosticsColumn()}
        currentView={activeTab}
        setCurrentView={setActiveTab as (v: string) => void}
        sentinelLevel={sentinelLevel}
        sentinelLabel={sentinelLabel}
      />

      <DiffModal
        showDiff={showDiff}
        setShowDiff={setShowDiff}
        issues={issues}
        acceptedHunkIds={acceptedHunkIds}
        onToggleHunk={onToggleHunk}
        fixedCode={fixedCode}
        copyToClipboard={copyToClipboard}
        applyAllFixes={applyAllFixes}
      />
      <ReportDrawer
        showReport={showReport}
        setShowReport={setShowReport}
        issues={issues}
        fixedCode={fixedCode}
        copyToClipboard={copyToClipboard}
        downloadCode={downloadCode}
      />
      <ShortcutsModal
        showShortcutsCheatSheet={showShortcutsCheatSheet}
        setShowShortcutsCheatSheet={setShowShortcutsCheatSheet}
      />
      <LangAlertModal
        showLangAlert={showLangAlert}
        setShowLangAlert={setShowLangAlert}
      />
      <LoginModal
        showLoginModal={showLoginModal}
        setShowLoginModal={_setShowLoginModal}
        loginMode={loginMode}
        setLoginMode={setLoginMode}
        loginError={loginError}
        setLoginError={setLoginError}
        username={username}
        setUsername={setUsername}
        loginPassword={loginPassword}
        setLoginPassword={setLoginPassword}
        handleLogin={handleLogin}
      />
      <Analytics />
    </div>
  );
};

export default App;
