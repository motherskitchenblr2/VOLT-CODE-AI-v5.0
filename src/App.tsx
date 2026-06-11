import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  History,
  Settings,
  User,
  Copy,
  Download,
  X,
  AlertTriangle,
  Zap,
  Bug,
  Code2,
  Shield,
  Brain,
  Wrench,
  Sparkles,
  ChevronDown,
  Bot,
  PanelRightOpen
} from 'lucide-react';
import 'highlight.js/styles/atom-one-dark.css';
import { Analytics } from '@vercel/analytics/react';

interface Session {
  id: string;
  timestamp: string;
  language: string;
  originalCode: string;
  fixedCode: string;
  issues: Issue[];
  summary: string;
  tokensUsed?: number;
  modelUsed?: string;
}

interface Issue {
  id: number;
  type: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  description: string;
  explanation: string;
  original: string;
  fixed: string;
}

type View = 'editor' | 'history' | 'settings' | 'sentinel';
type AgentMode = 'manual' | 'assist' | 'auto-syntax' | 'auto-debug' | 'team-review';

const CHARCOAL = '#121212';
const NEON_ORANGE = '#FF5F00';

// REAL FREE MODELS from OpenRouter
const FREE_MODELS = [
  { id: 'openrouter/auto', name: 'OpenRouter Auto', tag: 'BALANCED', ctx: 'varies', color: '#FF5F00' },
  { id: 'qwen/qwen3-coder:free', name: 'Qwen3 Coder', tag: 'CODING', ctx: '1M', color: '#9333EA' },
  { id: 'deepseek/deepseek-v3-0324:free', name: 'DeepSeek V4 Flash', tag: 'REASONING', ctx: '1M', color: '#3B82F6' },
  { id: 'nvidia/nemotron-3-super-120b-a12b:free', name: 'Nemotron 120B', tag: 'CODING', ctx: '128K', color: '#10B981' },
  { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B', tag: 'BALANCED', ctx: '131K', color: '#F97316' },
  { id: 'google/gemma-3-27b-it:free', name: 'Gemma 3 27B', tag: 'FAST', ctx: '131K', color: '#EF4444' },
  { id: 'mistralai/mistral-7b-instruct:free', name: 'Mistral 7B', tag: 'FAST', ctx: '32K', color: '#6EE7B7' },
  { id: 'microsoft/phi-3-mini-128k-instruct:free', name: 'Phi-3 Mini', tag: 'FAST', ctx: '128K', color: '#60A5FA' },
  { id: 'qwen/qwen-2.5-72b-instruct:free', name: 'Qwen 2.5 72B', tag: 'CODING', ctx: '131K', color: '#9333EA' },
  { id: 'deepseek/deepseek-r1:free', name: 'DeepSeek R1', tag: 'REASONING', ctx: '163K', color: '#3B82F6' },
];

const pluginOptions = [
  'Test Runner',
  'Console Trace',
  'Diff Reviewer',
  'Repo Scanner',
  'API Schema Reader',
  'Dependency Audit'
];

const skillOptions = [
  'Syntax Repair',
  'Bug Isolation',
  'Patch Generator',
  'Fix Verification',
  'Root Cause Drilldown',
  'Regression Guard'
];

const modeOptions: AgentMode[] = [
  'manual',
  'assist',
  'auto-syntax',
  'auto-debug',
  'team-review'
];

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('editor');
  const [code, setCode] = useState(
    'function calculateSum(arr) {\n  let sum = 0;\n  for (let i = 0; i < arr.length; i++) {\n    sum += arr[i];\n  }\n  console.log("Sum is: " + sum);\n  return sum;\n}'
  );
  const [language, setLanguage] = useState('javascript');
  const [detectedLanguage, setDetectedLanguage] = useState('javascript');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [fixedCode, setFixedCode] = useState('');
  const [showDiff, setShowDiff] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('dev_user');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [scanProgress, setScanProgress] = useState(0);
  const [selectedModel, setSelectedModel] = useState(FREE_MODELS[0]);
  const [selectedPlugin, setSelectedPlugin] = useState('Test Runner');
  const [selectedSkill, setSelectedSkill] = useState('Syntax Repair');
  const [agentStatus, setAgentStatus] = useState('idle');
  const [agentMessage, setAgentMessage] = useState('Agent ready');
  const [agentMode, setAgentMode] = useState<AgentMode>('assist');
  const [tokensUsed, setTokensUsed] = useState(0);
  const [currentModelName, setCurrentModelName] = useState('');
  const [autoApplyFixes, setAutoApplyFixes] = useState(false);
  const [enableSentinel, setEnableSentinel] = useState(false);

  useEffect(() => {
    const savedSessions = localStorage.getItem('codeSessions');
    if (savedSessions) {
      setSessions(JSON.parse(savedSessions));
    }
  }, []);

  const saveSessions = (newSessions: Session[]) => {
    localStorage.setItem('codeSessions', JSON.stringify(newSessions));
    setSessions(newSessions);
  };

  const detectLanguage = (codeStr: string): string => {
    if ((codeStr.includes('def ') || codeStr.includes('import ')) && codeStr.includes(':')) return 'python';
    if (codeStr.includes('function ') || codeStr.includes('const ') || codeStr.includes('=>')) return 'javascript';
    if (codeStr.includes('#include') || codeStr.includes('int main')) return 'cpp';
    if (codeStr.includes('<html') || codeStr.includes('<div')) return 'html';
    if (codeStr.includes('{') && codeStr.includes('}') && codeStr.includes(':')) return 'css';
    return 'javascript';
  };

  const handleCodeChange = (newCode: string) => {
    // FIX 1: Clean escaped HTML entities
    const cleanedCode = newCode.replace(/&lt;br&gt;/g, '\n');
    setCode(cleanedCode);
    const detected = detectLanguage(cleanedCode);
    setDetectedLanguage(detected);
    if (language === 'auto') {
      setLanguage(detected);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-5 py-3 rounded-xl font-semibold z-[120] ${
      type === 'error' ? 'bg-red-500 text-white' : 
      type === 'success' ? 'bg-[#FF5F00] text-black' :
      'bg-white/10 text-white border border-[#FF5F00]/40'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
  };

  const analyzeCode = async () => {
    setIsAnalyzing(true);
    setIsScanning(true);
    setScanProgress(0);
    setAgentStatus('analyzing');
    setCurrentModelName(selectedModel.name);

    const scanInterval = setInterval(() => {
      setScanProgress((prev) => {
        const next = prev + Math.random() * 18 + 8;
        return Math.min(next, 100);
      });
    }, 120);

    await new Promise((resolve) => setTimeout(resolve, 1800));
    clearInterval(scanInterval);
    setScanProgress(100);
    setIsScanning(false);

    try {
      const res = await fetch('/api/openrouter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language: language === 'auto' ? detectedLanguage : language,
          model: selectedModel.id,
          agentMode,
          skill: selectedSkill
        })
      });

      if (!res.ok) {
        // FIX 8: Error handling
        if (res.status === 429) {
          showToast('Rate limit reached. Free tier allows 20 req/min. Retry in 30s.', 'error');
        } else if (res.status === 500) {
          showToast('Model temporarily unavailable. Try a different model.', 'error');
        } else {
          showToast('Network error. Check your connection.', 'error');
        }
        setIsAnalyzing(false);
        setAgentStatus('error');
        return;
      }

      const data = await res.json();
      
      if (!data || !data.issues) {
        showToast('Model returned empty response. Try again.', 'error');
        setIsAnalyzing(false);
        setAgentStatus('error');
        return;
      }

      if (data.issues) setIssues(data.issues);
      if (data.fixedCode) setFixedCode(data.fixedCode);
      
      // FIX 7: Token usage display
      if (data.tokensUsed) {
        setTokensUsed(data.tokensUsed);
      }

      setAgentStatus('complete');
      showToast(`Analysis complete! Found ${data.issues.length} issues.`, 'success');
    } catch (err) {
      console.error('OpenRouter API error:', err);
      showToast('Connection failed. Check your internet.', 'error');
      setAgentStatus('error');
    }

    setIsAnalyzing(false);
    setShowDiff(true);
  };

  const applyAllFixes = () => {
    if (!fixedCode) return;

    const btn = document.getElementById('fix-all-btn');
    if (btn) {
      btn.classList.add('animate-pulse');
      setTimeout(() => btn.classList.remove('animate-pulse'), 800);
    }

    // FIX 2: Apply all fixes using reduce
    const allFixed = issues.reduce((acc, issue) => {
      return acc.replace(issue.original, issue.fixed);
    }, code);
    
    setCode(fixedCode);
    setShowDiff(false);

    const newSession: Session = {
      id: Date.now().toString(36),
      timestamp: new Date().toISOString(),
      language: language === 'auto' ? detectedLanguage : language,
      originalCode: code,
      fixedCode,
      issues,
      summary: `${issues.length} issues fixed. ${issues.filter((i) => i.severity === 'Critical' || i.severity === 'High').length} critical/high severity resolved.`,
      tokensUsed,
      modelUsed: selectedModel.name
    };

    const updatedSessions = [newSession, ...sessions].slice(0, 50);
    saveSessions(updatedSessions);
    setShowReport(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('COPIED TO CLIPBOARD!', 'success');
  };

  const downloadCode = (text: string, filename: string) => {
    const element = document.createElement('a');
    const file = new Blob([text], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const loadSession = (session: Session) => {
    setCode(session.originalCode);
    setFixedCode(session.fixedCode);
    setIssues(session.issues);
    setLanguage(session.language);
    setDetectedLanguage(session.language);
    if (session.tokensUsed) setTokensUsed(session.tokensUsed);
    if (session.modelUsed) setCurrentModelName(session.modelUsed);
    setCurrentView('editor');
    setShowReport(true);
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
    setShowLoginModal(false);
  };

  const languages = [
    { value: 'auto', label: 'Auto Detect' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python', label: 'Python' },
    { value: 'cpp', label: 'C++' },
    { value: 'html', label: 'HTML' }
  ];

  const renderModelSelect = () => (
    <div className="flex items-center gap-3 border border-[#FF5F00]/40 rounded-xl px-4 py-2 bg-black/40">
      <div className="text-[#FF5F00]/70 text-xs tracking-wider">MODEL</div>
      <ChevronDown className="w-4 h-4 text-[#FF5F00]/60" />
      <select
        value={selectedModel.id}
        onChange={(e) => {
          const model = FREE_MODELS.find(m => m.id === e.target.value)!;
          setSelectedModel(model);
        }}
        className="bg-transparent text-white outline-none min-w-[180px] font-semibold"
      >
        {FREE_MODELS.map((model) => (
          <option key={model.id} value={model.id} className="bg-black text-white">
            {model.name} • {model.tag} • {model.ctx}
          </option>
        ))}
      </select>
    </div>
  );

  const renderSelect = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    options: string[]
  ) => (
    <div className="flex items-center gap-3 border border-[#FF5F00]/40 rounded-xl px-4 py-2 bg-black/40">
      <div className="text-[#FF5F00]/70 text-xs tracking-wider">{label}</div>
      <ChevronDown className="w-4 h-4 text-[#FF5F00]/60" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-white outline-none min-w-[130px]"
      >
        {options.map((option) => (
          <option key={option} value={option} className="bg-black text-white">
            {option}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#121212] text-white flex" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div className="w-64 border-r border-[#FF5F00]/20 p-6 flex flex-col">
        <div className="mb-12">
          <div className="text-[#FF5F00] text-3xl font-black tracking-tighter">VOLT</div>
          <div className="text-white text-2xl font-extrabold tracking-tight">CODE AI</div>
          <div className="text-[#FF5F00] text-xs mt-1 tracking-[4px]">v4.9 AGENTIC</div>
        </div>

        {!isLoggedIn ? (
          <button
            onClick={() => setShowLoginModal(true)}
            className="flex items-center gap-2 px-5 py-1.5 rounded bg-[#FF5F00] hover:bg-[#FF5F00]/90 text-black font-semibold transition-all active:scale-[0.985]"
          >
            <User className="w-4 h-4" />
            LOGIN TO SAVE
          </button>
        ) : (
          <div className="text-[#FF5F00] font-semibold">{username}</div>
        )}

        <div className="mt-12 space-y-1">
          <div
            onClick={() => setCurrentView('editor')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer mb-1 transition-all ${
              currentView === 'editor'
                ? 'bg-[#FF5F00] text-black font-bold'
                : 'hover:bg-white/5 text-[#FF5F00]'
            }`}
          >
            <Play className="w-5 h-5" />
            NEW ANALYSIS
          </div>

          <div
            onClick={() => setCurrentView('history')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer mb-1 transition-all ${
              currentView === 'history'
                ? 'bg-[#FF5F00] text-black font-bold'
                : 'hover:bg-white/5 text-[#FF5F00]'
            }`}
          >
            <History className="w-5 h-5" />
            SESSION HISTORY
          </div>

          <div
            onClick={() => setCurrentView('sentinel')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer mb-1 transition-all ${
              currentView === 'sentinel'
                ? 'bg-[#FF5F00] text-black font-bold'
                : 'hover:bg-white/5 text-[#FF5F00]'
            }`}
          >
            <Shield className="w-5 h-5" />
            SENTINEL TAB
          </div>

          <div
            onClick={() => setCurrentView('settings')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${
              currentView === 'settings'
                ? 'bg-[#FF5F00] text-black font-bold'
                : 'hover:bg-white/5 text-[#FF5F00]'
            }`}
          >
            <Settings className="w-5 h-5" />
            SETTINGS
          </div>
        </div>

        <div className="mt-auto pt-8 text-xs opacity-40 space-y-1">
          <div>HIGH-VOLTAGE DARK MODE</div>
          <div>NEON ORANGE #FF5F00</div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {currentView === 'editor' && (
          <>
            <div className="border-b border-[#FF5F00]/20 p-6">
              <div className="mb-1">
                <div className="text-2xl font-bold">MULTI-LANGUAGE EDITOR</div>
                <div className="text-sm text-[#FF5F00]/70">AI Bug Finder, Agent Runner & Optimizer</div>
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-4">
                {renderModelSelect()}
                {renderSelect('Plugin', selectedPlugin, setSelectedPlugin, pluginOptions)}
                {renderSelect('Skill', selectedSkill, setSelectedSkill, skillOptions)}
                {renderSelect('Mode', agentMode, (v) => setAgentMode(v as AgentMode), modeOptions)}
                
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-black border border-[#FF5F00]/60 px-4 py-2 text-sm rounded focus:outline-none focus:border-[#FF5F00]"
                >
                  {languages.map((l) => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>

                <div className="px-4 py-2 rounded bg-[#FF5F00]/10 text-[#FF5F00] text-sm font-semibold">
                  DETECTED: {detectedLanguage.toUpperCase()}
                </div>
              </div>

              {/* FIX 6: AI Identity Badge */}
              {currentModelName && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 px-4 py-2 rounded-xl border-2 border-[#FF5F00] bg-black/60 inline-flex items-center gap-3"
                >
                  <Zap className="w-4 h-4 text-[#FF5F00]" />
                  <div>
                    <div className="text-[#FF5F00] text-xs tracking-wider">POWERED BY</div>
                    <div className="font-bold text-white">{currentModelName}</div>
                  </div>
                  {agentStatus === 'analyzing' && (
                    <div className="text-[#FF5F00] text-xs animate-pulse">ANALYZING...</div>
                  )}
                </motion.div>
              )}

              {/* FIX 7: Token Usage Display */}
              {tokensUsed > 0 && (
                <div className="mt-4 p-4 rounded-xl border border-[#FF5F00]/20 bg-black/40 inline-block">
                  <div className="text-[#FF5F00] text-xs mb-1 tracking-wider">TOKEN USAGE</div>
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-white font-bold text-lg">{tokensUsed}</span>
                      <span className="text-white/50 text-sm ml-1">tokens</span>
                    </div>
                    <div className="text-white/50 text-xs">~$0.00 (free tier)</div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 relative">
              {isScanning && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${scanProgress}%` }}
                  className="absolute top-0 left-0 h-1 bg-[#FF5F00] z-10"
                />
              )}

              <textarea
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                spellCheck={false}
                className="w-full h-full resize-none bg-transparent p-8 font-mono text-[15px] leading-[1.65] outline-none text-[#EDEDED] caret-[#FF5F00]"
                style={{
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                  boxShadow: 'inset 0 0 0 1px rgba(255,95,0,0.1)'
                }}
              />

              <div className="absolute bottom-9 right-9 flex gap-3 flex-wrap justify-end">
                <motion.button
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  onClick={analyzeCode}
                  disabled={isAnalyzing}
                  className="flex items-center gap-3 px-8 py-3.5 rounded-xl bg-black border-2 border-[#FF5F00] text-[#FF5F00] font-semibold disabled:opacity-60 active:bg-[#FF5F00] active:text-black transition-all"
                >
                  <Bug className="w-5 h-5" />
                  {isAnalyzing ? 'ANALYZING...' : 'RUN AI ANALYSIS'}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  onClick={() => setShowAgentModal(true)}
                  className="flex items-center gap-3 px-8 py-3.5 rounded-xl bg-[#1a1a1a] border border-[#FF5F00]/60 text-[#FF5F00] font-semibold hover:bg-black transition-all"
                >
                  <Brain className="w-5 h-5" />
                  OPEN AGENT
                </motion.button>

                {fixedCode && (
                  <motion.button
                    id="fix-all-btn"
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.985 }}
                    onClick={applyAllFixes}
                    className="flex items-center gap-3 px-9 py-3.5 rounded-xl bg-[#FF5F00] hover:bg-[#FF5F00]/90 text-black font-extrabold shadow-[0_0_25px_rgba(255,95,0,0.5)] active:scale-[0.985] transition-all"
                  >
                    <Zap className="w-5 h-5" />
                    FIX ALL ({issues.length})
                  </motion.button>
                )}
              </div>
            </div>
          </>
        )}

        {currentView === 'history' && (
          <div className="p-8">
            <div className="text-3xl font-bold tracking-tight mb-8">PREVIOUS SESSIONS</div>
            {sessions.length === 0 ? (
              <div className="text-center py-24 text-[#FF5F00]/60">No saved sessions yet. Run an analysis to save.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sessions.map((session, idx) => (
                  <div
                    key={idx}
                    onClick={() => loadSession(session)}
                    className="p-5 border border-[#FF5F00]/20 hover:border-[#FF5F00] rounded-2xl cursor-pointer group bg-black/40 transition-all"
                  >
                    <div className="flex justify-between mb-4">
                      <div className="font-mono text-sm text-[#FF5F00]">{new Date(session.timestamp).toLocaleDateString()}</div>
                      <div className="uppercase text-xs tracking-widest px-3 py-px bg-[#FF5F00]/10 text-[#FF5F00] rounded">
                        {session.language}
                      </div>
                    </div>
                    <div className="font-semibold line-clamp-2 text-lg mb-3 pr-2">{session.summary}</div>
                    <div className="text-xs text-[#FF5F00]/60">{session.issues.length} FIXES APPLIED</div>
                    {session.modelUsed && (
                      <div className="text-xs text-white/40 mt-2">Model: {session.modelUsed}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {currentView === 'sentinel' && (
          <div className="p-8 h-full overflow-auto">
            <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
              <div>
                <div className="text-[#FF5F00] text-sm tracking-[2px] font-semibold">SELF-ERROR HANDLING WORKSPACE</div>
                <div className="text-3xl font-bold">SENTINEL TAB</div>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="px-4 py-2 rounded-xl border border-[#FF5F00]/30 bg-black/40 text-[#FF5F00] text-sm">
                  Active Model: {selectedModel.name}
                </div>
                <div className="px-4 py-2 rounded-xl border border-[#FF5F00]/30 bg-black/40 text-[#FF5F00] text-sm">
                  Skill: {selectedSkill}
                </div>
                <div className="px-4 py-2 rounded-xl border border-[#FF5F00]/30 bg-black/40 text-[#FF5F00] text-sm">
                  Plugin: {selectedPlugin}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 rounded-3xl border border-[#FF5F00]/20 bg-black/40 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-5 h-5 text-[#FF5F00]" />
                  <div className="text-xl font-bold">Internal Operations Queue</div>
                </div>
                <div className="space-y-4">
                  {[
                    'Skill Creator staging room initialized',
                    'Skill Modifier validator waiting for input',
                    'Plugin Creator scaffold engine standby',
                    'Plugin Modifier compatibility checks ready',
                    'Sentinel recovery monitor active'
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-[#FF5F00]/15 bg-[#101010] p-4 flex items-center justify-between gap-3"
                    >
                      <span className="text-sm text-white/90">{item}</span>
                      <span className="text-[10px] px-3 py-1 rounded-full bg-[#FF5F00]/10 text-[#FF5F00] tracking-[2px]">
                        READY
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-[#FF5F00]/20 bg-black/40 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="w-5 h-5 text-[#FF5F00]" />
                  <div className="text-xl font-bold">Skills Room</div>
                </div>
                <div className="space-y-3">
                  {skillOptions.map((skill) => (
                    <div
                      key={skill}
                      className="rounded-xl border border-[#FF5F00]/15 bg-[#0f0f0f] px-4 py-3 text-sm text-[#FF5F00]"
                    >
                      {skill}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-[#FF5F00]/20 bg-black/40 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Wrench className="w-5 h-5 text-[#FF5F00]" />
                  <div className="text-xl font-bold">Plugins Room</div>
                </div>
                <div className="space-y-3">
                  {pluginOptions.map((plugin) => (
                    <div
                      key={plugin}
                      className="rounded-xl border border-[#FF5F00]/15 bg-[#0f0f0f] px-4 py-3 text-sm text-[#FF5F00]"
                    >
                      {plugin}
                    </div>
                  ))}
                </div>
              </div>

              <div className="xl:col-span-2 rounded-3xl border border-[#FF5F00]/20 bg-black/40 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <PanelRightOpen className="w-5 h-5 text-[#FF5F00]" />
                  <div className="text-xl font-bold">Scan & Fix Preview</div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-[#0a0a0a] border border-red-500/20 p-4">
                    <div className="text-xs tracking-[2px] text-red-400 mb-3">CURRENT / SCANNED</div>
                    <pre className="font-mono text-xs whitespace-pre-wrap text-red-200/80 leading-relaxed max-h-[320px] overflow-auto">
                      {code}
                    </pre>
                  </div>
                  <div className="rounded-2xl bg-[#0a0a0a] border border-[#FF5F00]/20 p-4">
                    <div className="text-xs tracking-[2px] text-[#FF5F00] mb-3">PROPOSED / FIXED</div>
                    <pre className="font-mono text-xs whitespace-pre-wrap text-[#FFB380] leading-relaxed max-h-[320px] overflow-auto">
                      {fixedCode || '// Agent proposed patch preview will appear here'}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FIX 5: Interactive Settings Tab */}
        {currentView === 'settings' && (
          <div className="p-8 max-w-2xl">
            <div className="text-3xl font-bold mb-8">SETTINGS</div>
            <div className="space-y-6">
              <div className="border border-[#FF5F00]/20 rounded-xl p-6 bg-black/40">
                <div className="text-lg font-bold mb-4">Default Model</div>
                <select
                  value={selectedModel.id}
                  onChange={(e) => {
                    const model = FREE_MODELS.find(m => m.id === e.target.value)!;
                    setSelectedModel(model);
                  }}
                  className="w-full bg-black border border-[#FF5F00]/40 px-4 py-3 rounded text-white"
                >
                  {FREE_MODELS.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name} • {model.tag} • {model.ctx}
                    </option>
                  ))}
                </select>
              </div>

              <div className="border border-[#FF5F00]/20 rounded-xl p-6 bg-black/40">
                <div className="text-lg font-bold mb-4">Agent Mode Default</div>
                <select
                  value={agentMode}
                  onChange={(e) => setAgentMode(e.target.value as AgentMode)}
                  className="w-full bg-black border border-[#FF5F00]/40 px-4 py-3 rounded text-white"
                >
                  {modeOptions.map((mode) => (
                    <option key={mode} value={mode}>{mode}</option>
                  ))}
                </select>
              </div>

              <div className="border border-[#FF5F00]/20 rounded-xl p-6 bg-black/40">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-bold">Auto-Apply Fixes</div>
                    <div className="text-sm text-[#FF5F00]/60 mt-1">Automatically apply all fixes without confirmation</div>
                  </div>
                  <button
                    onClick={() => setAutoApplyFixes(!autoApplyFixes)}
                    className={`w-16 h-8 rounded-full transition-all ${
                      autoApplyFixes ? 'bg-[#FF5F00]' : 'bg-white/10'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 bg-white rounded-full transition-all ${
                        autoApplyFixes ? 'ml-9' : 'ml-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="border border-[#FF5F00]/20 rounded-xl p-6 bg-black/40">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-bold">Sentinel Live Monitoring</div>
                    <div className="text-sm text-[#FF5F00]/60 mt-1">Enable real-time code monitoring</div>
                  </div>
                  <button
                    onClick={() => setEnableSentinel(!enableSentinel)}
                    className={`w-16 h-8 rounded-full transition-all ${
                      enableSentinel ? 'bg-[#FF5F00]' : 'bg-white/10'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 bg-white rounded-full transition-all ${
                        enableSentinel ? 'ml-9' : 'ml-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="border border-[#FF5F00]/20 rounded-xl p-6 bg-black/40">
                <div className="text-lg font-bold mb-2">Theme</div>
                <div className="text-[#FF5F00]/70">Charcoal Black + Neon Orange (locked)</div>
              </div>

              <div className="border border-[#FF5F00]/20 rounded-xl p-6 bg-black/40">
                <div className="text-lg font-bold mb-2">Session Storage</div>
                <div className="text-[#FF5F00]/70">LOCAL BROWSER STORAGE (Max 50 sessions)</div>
              </div>

              <button
                onClick={() => {
                  localStorage.removeItem('codeSessions');
                  setSessions([]);
                  showToast('All sessions cleared!', 'success');
                }}
                className="w-full px-6 py-4 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 font-bold transition-all"
              >
                CLEAR ALL SESSIONS
              </button>
            </div>
          </div>
        )}
      </div>

      <motion.button
        onClick={() => setShowAgentModal(true)}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.98 }}
        className="fixed bottom-7 left-[18rem] z-[65] flex items-center gap-3 px-5 py-3 rounded-full bg-[#FF5F00] text-black font-extrabold shadow-[0_0_30px_rgba(255,95,0,0.45)]"
      >
        <Bot className="w-5 h-5" />
        AGENT
      </motion.button>

      <AnimatePresence>
        {showAgentModal && (
          <div className="fixed inset-0 bg-black/85 z-[85] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.985, y: 15 }}
              transition={{ ease: [0.21, 0.92, 0.3, 1] }}
              className="w-full max-w-5xl bg-[#121212] border border-[#FF5F00] rounded-3xl overflow-hidden"
            >
              <div className="px-8 py-5 border-b border-[#FF5F00]/30 flex justify-between items-center">
                <div>
                  <div className="font-bold text-2xl flex items-center gap-3">
                    <Brain className="text-[#FF5F00]" />
                    AGENT TEAM CONTROL
                  </div>
                  <div className="text-sm text-[#FF5F00]/70 mt-1">
                    Floating command center for model, plugin, skill, sentinel and execution flow
                  </div>
                </div>
                <button onClick={() => setShowAgentModal(false)}>
                  <X />
                </button>
              </div>

              <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-[#FF5F00]/20 bg-black/40 p-6 space-y-4">
                  <div className="text-lg font-bold">Runtime Controls</div>
                  {renderModelSelect()}
                  {renderSelect('Plugin', selectedPlugin, setSelectedPlugin, pluginOptions)}
                  {renderSelect('Skill', selectedSkill, setSelectedSkill, skillOptions)}
                  {renderSelect('Mode', agentMode, (v) => setAgentMode(v as AgentMode), modeOptions)}
                </div>

                <div className="rounded-2xl border border-[#FF5F00]/20 bg-black/40 p-6">
                  <div className="text-lg font-bold mb-4">Agent Mission</div>
                  <div className="space-y-3 text-sm text-white/80 leading-relaxed">
                    <div className="rounded-xl border border-[#FF5F00]/10 bg-[#0f0f0f] p-4">
                      Read active page context and route work to the correct agent behavior.
                    </div>
                    <div className="rounded-xl border border-[#FF5F00]/10 bg-[#0f0f0f] p-4">
                      Use Sentinel for internal skill/plugin staging, validation and self-repair workflows.
                    </div>
                    <div className="rounded-xl border border-[#FF5F00]/10 bg-[#0f0f0f] p-4">
                      Support future OpenRouter orchestration, uploaded ecosystem specs and compatibility conversion.
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-8 pb-8 flex justify-end gap-4">
                <button
                  onClick={() => {
                    setCurrentView('sentinel');
                    setShowAgentModal(false);
                  }}
                  className="px-7 py-3 rounded-xl border border-[#FF5F00]/40 text-[#FF5F00]"
                >
                  OPEN SENTINEL
                </button>
                <button
                  onClick={() => setShowAgentModal(false)}
                  className="px-8 py-3 rounded-xl bg-[#FF5F00] text-black font-bold"
                >
                  SAVE AGENT STATE
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDiff && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[70] p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.985, y: 15 }}
              transition={{ ease: [0.21, 0.92, 0.3, 1] }}
              className="w-full max-w-6xl bg-[#121212] border border-[#FF5F00] rounded-3xl overflow-hidden"
            >
              <div className="px-8 py-5 border-b border-[#FF5F00]/30 flex justify-between items-center">
                <div className="font-bold text-2xl flex items-center gap-3">
                  <AlertTriangle className="text-[#FF5F00]" />
                  AI ANALYSIS COMPLETE — DIFF PREVIEW
                </div>
                <button onClick={() => setShowDiff(false)}>
                  <X />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-[#FF5F00]/10">
                <div className="bg-[#0a0a0a] p-8">
                  <div className="uppercase text-xs tracking-[3px] mb-4 text-red-400">ORIGINAL CODE</div>
                  <pre className="font-mono text-sm whitespace-pre-wrap text-red-300/70 leading-relaxed">{code}</pre>
                </div>
                <motion.div
                  initial={{ x: 60, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="bg-[#0a0a0a] p-8 border-l border-[#FF5F00]/30"
                >
                  <div className="uppercase text-xs tracking-[3px] mb-4 text-[#FF5F00]">FIXED CODE — NEON OPTIMIZED</div>
                  <pre className="font-mono text-sm whitespace-pre-wrap text-[#FF5F00] leading-relaxed">{fixedCode}</pre>
                </motion.div>
              </div>

              <div className="p-8 flex justify-end gap-4 bg-black/60 border-t border-[#FF5F00]/20">
                <button
                  onClick={() => setShowDiff(false)}
                  className="px-7 py-3 rounded-xl border border-white/30"
                >
                  CLOSE
                </button>
                <button
                  onClick={applyAllFixes}
                  className="px-9 py-3 rounded-xl bg-[#FF5F00] text-black font-bold"
                >
                  APPLY ALL FIXES NOW
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showReport && (
          <div
            className="fixed inset-0 bg-black/80 z-[80] flex justify-end"
            onClick={() => setShowReport(false)}
          >
            <motion.div
              initial={{ x: 80 }}
              animate={{ x: 0 }}
              exit={{ x: 80 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-[#121212] h-full border-l border-[#FF5F00] overflow-auto"
            >
              <div className="sticky top-0 bg-[#121212] p-8 border-b border-[#FF5F00]/40 flex justify-between">
                <div>
                  <div className="font-bold text-xl">DETAILED FIX REPORT</div>
                  <div className="text-[#FF5F00] text-sm">ALL FIXES APPLIED SUCCESSFULLY</div>
                </div>
                <button onClick={() => setShowReport(false)}>
                  <X />
                </button>
              </div>

              <div className="p-8 space-y-7">
                {issues.map((issue, index) => (
                  <div key={index} className="border-l-4 border-[#FF5F00] pl-6">
                    <div className="flex justify-between items-center mb-1">
                      <div className="font-bold text-lg">{issue.type}</div>
                      <div
                        className={`px-3 py-px text-xs font-bold rounded ${
                          issue.severity === 'Critical' || issue.severity === 'High'
                            ? 'bg-[#FF5F00] text-black'
                            : 'bg-white/10'
                        }`}
                      >
                        {issue.severity}
                      </div>
                    </div>
                    <div className="text-[#FF5F00] mb-3">{issue.description}</div>
                    <div className="text-sm opacity-75 leading-snug mb-4">{issue.explanation}</div>
                    <div className="text-[10px] font-mono bg-black p-3 rounded">FIX: {issue.fixed}</div>
                  </div>
                ))}
              </div>

              <div className="p-8 flex gap-3 sticky bottom-0 bg-[#121212]">
                <button
                  onClick={() => copyToClipboard(fixedCode)}
                  className="flex-1 flex justify-center gap-2 items-center py-3 border border-[#FF5F00] hover:bg-white/5 rounded-xl"
                >
                  <Copy className="w-4 h-4" />
                  COPY FIXED CODE
                </button>
                <button
                  onClick={() => downloadCode(fixedCode, `fixed-${Date.now()}.js`)}
                  className="flex-1 flex justify-center gap-2 items-center py-3 bg-[#FF5F00] text-black font-bold rounded-xl"
                >
                  <Download className="w-4 h-4" />
                  DOWNLOAD
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLoginModal && (
          <div className="fixed inset-0 bg-black/90 z-[90] flex items-center justify-center">
            <div className="bg-[#121212] border border-[#FF5F00] w-full max-w-sm p-9 rounded-3xl">
              <div className="font-bold text-center text-2xl mb-2">SIGN IN</div>
              <div className="text-center text-sm mb-8 text-[#FF5F00]/60">
                Save and revisit all your analysis sessions
              </div>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-black border border-[#FF5F00]/40 py-3 px-4 mb-3 rounded"
                placeholder="Username"
              />
              <button
                onClick={handleLogin}
                className="mt-2 w-full py-3.5 bg-[#FF5F00] font-extrabold text-black rounded-xl"
              >
                SIGN IN & ENABLE HISTORY
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

      <Analytics />
    </div>
  );
};

export default App;
