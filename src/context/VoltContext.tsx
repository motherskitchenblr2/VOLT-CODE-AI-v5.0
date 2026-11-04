/**
 * VoltAppContext — centralized shared state for v6.0 refactor.
 *
 * Stage 1: extract the state that multiple views need so views can be
 * decoupled from App.tsx without prop drilling. View-specific state stays
 * local in App.tsx until Stage 2 extracts each view.
 */
import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  type ReactNode,
} from "react";

export interface ModelConfig {
  id: string;
  name: string;
  tag: string;
  ctx: string;
  color: string;
  provider: string;
}

interface VoltContextType {
  // Editor & Code State
  code: string;
  setCode: (code: string) => void;
  language: string;
  setLanguage: (lang: string) => void;
  detectedLanguage: string;
  setDetectedLanguage: (lang: string) => void;
  isAutonomous: boolean;
  setIsAutonomous: (v: boolean) => void;
  selectedPlugin: string;
  setSelectedPlugin: (p: string) => void;
  selectedSkill: string;
  setSelectedSkill: (s: string) => void;

  // Provider & Safety Lock
  selectedModel: ModelConfig;
  setSelectedModel: (m: ModelConfig) => void;
  openrouterKey: string;
  setOpenrouterKey: (k: string) => void;
  groqKey: string;
  setGroqKey: (k: string) => void;
  nvidiaKey: string;
  setNvidiaKey: (k: string) => void;
  huggingfaceKey: string;
  setHuggingfaceKey: (k: string) => void;

  // Navigation
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Agent mode
  agentMode: string;
  setAgentMode: (m: string) => void;

  // Sentinel & Security
  sentinelFindings: Array<{
    rule: string;
    severity: string;
    message: string;
  }>;
  setSentinelFindings: (
    f: Array<{ rule: string; severity: string; message: string }>,
  ) => void;
  riskScore: number;
  setRiskScore: (s: number) => void;
}

const VoltContext = createContext<VoltContextType | undefined>(undefined);

const DEFAULT_MODEL: ModelConfig = {
  id: "llama-3.3-70b-versatile",
  name: "Llama 3.3 70B",
  tag: "BALANCED",
  ctx: "128K",
  color: "#F97316",
  provider: "Groq",
};

export function VoltProvider({ children }: { children: ReactNode }) {
  const [code, setCode] = useState(
    'function calculateSum(arr) {\n  let sum = 0;\n  for (let i = 0; i < arr.length; i++) {\n    sum += arr[i];\n  }\n  console.log("Sum is: " + sum);\n  return sum;\n}',
  );
  const [language, setLanguage] = useState("javascript");
  const [detectedLanguage, setDetectedLanguage] = useState("javascript");
  const [isAutonomous, setIsAutonomous] = useState(false);
  const [selectedPlugin, setSelectedPlugin] = useState("Test Runner");
  const [selectedSkill, setSelectedSkill] = useState("Syntax Repair");

  const [selectedModel, setSelectedModel] = useState<ModelConfig>(DEFAULT_MODEL);

  const [openrouterKey, setOpenrouterKey] = useState(
    localStorage.getItem("volt_openrouter_key") || "",
  );
  const [groqKey, setGroqKey] = useState(
    localStorage.getItem("volt_groq_key") || "",
  );
  const [nvidiaKey, setNvidiaKey] = useState(
    localStorage.getItem("volt_nvidia_key") || "",
  );
  const [huggingfaceKey, setHuggingfaceKey] = useState(
    localStorage.getItem("volt_huggingface_key") || "",
  );

  const [activeTab, setActiveTab] = useState("editor");

  const [agentMode, setAgentMode] = useState("assist");

  const [sentinelFindings, setSentinelFindings] = useState<
    Array<{ rule: string; severity: string; message: string }>
  >([]);
  const [riskScore, setRiskScore] = useState(0);

  const value = useMemo<VoltContextType>(
    () => ({
      code,
      setCode,
      language,
      setLanguage,
      detectedLanguage,
      setDetectedLanguage,
      isAutonomous,
      setIsAutonomous,
      selectedPlugin,
      setSelectedPlugin,
      selectedSkill,
      setSelectedSkill,
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
      activeTab,
      setActiveTab,
      agentMode,
      setAgentMode,
      sentinelFindings,
      setSentinelFindings,
      riskScore,
      setRiskScore,
    }),
    [
      code,
      language,
      detectedLanguage,
      isAutonomous,
      selectedPlugin,
      selectedSkill,
      selectedModel,
      openrouterKey,
      groqKey,
      nvidiaKey,
      huggingfaceKey,
      activeTab,
      agentMode,
      sentinelFindings,
      riskScore,
    ],
  );

  return <VoltContext.Provider value={value}>{children}</VoltContext.Provider>;
}

export function useVolt(): VoltContextType {
  const ctx = useContext(VoltContext);
  if (!ctx) {
    throw new Error("useVolt must be used within a VoltProvider");
  }
  return ctx;
}
