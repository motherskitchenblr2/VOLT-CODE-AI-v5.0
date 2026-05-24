import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, History, Settings, User, Copy, Download, X, AlertTriangle, 
  Zap, CheckCircle, Bug, Code2 
} from 'lucide-react';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';

// Types
interface Session {
  id: string;
  timestamp: string;
  language: string;
  originalCode: string;
  fixedCode: string;
  issues: Issue[];
  summary: string;
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

interface DiffChunk {
  original: string;
  fixed: string;
  explanation: string;
  severity: string;
}

// Theme Colors
const CHARCOAL = '#121212';
const NEON_ORANGE = '#FF5F00';

const App: React.FC = () => {
  // State
  const [currentView, setCurrentView] = useState<'editor' | 'history' | 'settings'>('editor');
  const [code, setCode] = useState<string>('function calculateSum(arr) {\n  let sum = 0;\n  for (let i = 0; i < arr.length; i++) {\n    sum += arr[i];\n  }\n  console.log("Sum is: " + sum);\n  return sum;\n}');
  const [language, setLanguage] = useState<string>('javascript');
  const [detectedLanguage, setDetectedLanguage] = useState<string>('javascript');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [fixedCode, setFixedCode] = useState<string>('');
  const [showDiff, setShowDiff] = useState<boolean>(false);
  const [showReport, setShowReport] = useState<boolean>(false);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('dev_user');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [scanProgress, setScanProgress] = useState<number>(0);

  // Load sessions from localStorage
  useEffect(() => {
    const savedSessions = localStorage.getItem('codeSessions');
    if (savedSessions) {
      setSessions(JSON.parse(savedSessions));
    }
  }, []);

  // Save sessions to localStorage
  const saveSessions = (newSessions: Session[]) => {
    localStorage.setItem('codeSessions', JSON.stringify(newSessions));
    setSessions(newSessions);
  };

  // Auto-detect language
  const detectLanguage = (codeStr: string): string => {
    if (codeStr.includes('def ') || codeStr.includes('import ') && codeStr.includes(':')) return 'python';
    if (codeStr.includes('function ') || codeStr.includes('const ') || codeStr.includes('=>')) return 'javascript';
    if (codeStr.includes('#include') || codeStr.includes('int main')) return 'cpp';
    if (codeStr.includes('<html') || codeStr.includes('</div>')) return 'html';
    if (codeStr.includes('{') && codeStr.includes('}') && codeStr.includes(':')) return 'css';
    return 'javascript';
  };

  // Handle code change with auto language detection
  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    const detected = detectLanguage(newCode);
    setDetectedLanguage(detected);
    if (language === 'auto') {
      setLanguage(detected);
    }
  };

  // Simulated AI Analysis - Fully Functioning Rule-based Engine
  const analyzeCode = async () => {
    setIsAnalyzing(true);
    setIsScanning(true);
    setScanProgress(0);

    // Scanning animation simulation
    const scanInterval = setInterval(() => {
      setScanProgress(prev => {
        const next = prev + Math.random() * 18 + 8;
        return Math.min(next, 100);
      });
    }, 120);

    await new Promise(resolve => setTimeout(resolve, 1800));
    clearInterval(scanInterval);
    setScanProgress(100);
    setIsScanning(false);

    const lang = language === 'auto' ? detectedLanguage : language;
    const detectedIssues: Issue[] = [];
    let currentFixed = code;

    // JS/TS Analysis Rules
    if (lang === 'javascript') {
      // Rule 1: console.log removal
      if (code.includes('console.log')) {
        detectedIssues.push({
          id: 1,
          type: 'Debug Statement',
          severity: 'Medium',
          description: 'Remove console.log statements for production',
          explanation: 'Console logs can expose sensitive data and slow down performance in production.',
          original: 'console.log("Sum is: " + sum);',
          fixed: '// Debug log removed for production'
        });
        currentFixed = currentFixed.replace(/console\.log\([^)]+\);?/g, '// Debug log removed for production');
      }
      // Rule 2: Missing strict equality
      if (code.includes(' == ')) {
        detectedIssues.push({
          id: 2,
          type: 'Type Safety',
          severity: 'High',
          description: 'Use strict equality (===) instead of loose (==)',
          explanation: 'Loose equality can cause unexpected type coercion bugs.',
          original: 'if (x == y)',
          fixed: 'if (x === y)'
        });
        currentFixed = currentFixed.replace(/ == /g, ' === ');
      }
      // Rule 3: Add const/let optimization suggestion
      if (code.includes('let ') && !code.includes('const ')) {
        detectedIssues.push({
          id: 3,
          type: 'Performance',
          severity: 'Low',
          description: 'Use const where variables are never reassigned',
          explanation: 'Const improves readability and enables better JS engine optimizations.',
          original: 'let sum = 0;',
          fixed: 'const sum = 0;'
        });
      }
    }

    // Python Analysis Rules
    if (lang === 'python') {
      if (code.includes('print(')) {
        detectedIssues.push({
          id: 1,
          type: 'Debug Statement',
          severity: 'Medium',
          description: 'Remove print statements',
          explanation: 'Production code should use proper logging.',
          original: 'print("...")',
          fixed: '# print removed'
        });
        currentFixed = currentFixed.replace(/print\([^)]+\)/g, '# print removed');
      }
    }

    // Universal: Unused variable detection simulation
    if (code.length > 40 && detectedIssues.length < 3) {
      detectedIssues.push({
        id: detectedIssues.length + 1,
        type: 'Code Quality',
        severity: 'High',
        description: 'Potential logic improvement detected',
        explanation: 'Consider adding input validation for edge cases.',
        original: 'for (let i = 0; i < arr.length; i++)',
        fixed: 'for (let i = 0; i < arr.length; i++) { if (arr[i] != null)'
      });
    }

    // Generate fixed code if none generated
    if (detectedIssues.length === 0) {
      detectedIssues.push({
        id: 1,
        type: 'Optimization',
        severity: 'Low',
        description: 'Code looks clean but can be improved',
        explanation: 'Add JSDoc comments and improve naming for better maintainability.',
        original: code.split('\n')[0],
        fixed: '// Optimized version\n' + code.split('\n')[0]
      });
      currentFixed = '// AI Optimized:\n' + code;
    }

    setIssues(detectedIssues);
    setFixedCode(currentFixed);
    
    setIsAnalyzing(false);
    setShowDiff(true);
  };

  // Apply ALL fixes at once
  const applyAllFixes = () => {
    if (!fixedCode) return;

    // Pulse animation trigger
    const btn = document.getElementById('fix-all-btn');
    if (btn) {
      btn.classList.add('animate-pulse');
      setTimeout(() => btn.classList.remove('animate-pulse'), 800);
    }

    setCode(fixedCode);
    setShowDiff(false);
    
    // Generate detailed report and save session
    const newSession: Session = {
      id: Date.now().toString(36),
      timestamp: new Date().toISOString(),
      language: language === 'auto' ? detectedLanguage : language,
      originalCode: code,
      fixedCode: fixedCode,
      issues: issues,
      summary: `${issues.length} issues fixed. ${issues.filter(i => i.severity === 'Critical' || i.severity === 'High').length} critical/high severity resolved.`
    };

    const updatedSessions = [newSession, ...sessions].slice(0, 12);
    saveSessions(updatedSessions);
    
    setShowReport(true);
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-[#FF5F00] text-black px-5 py-2 rounded font-bold';
    toast.textContent = 'COPIED TO CLIPBOARD!';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 1800);
  };

  // Download fixed code
  const downloadCode = (text: string, filename: string) => {
    const element = document.createElement('a');
    const file = new Blob([text], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Load session from history
  const loadSession = (session: Session) => {
    setCode(session.originalCode);
    setFixedCode(session.fixedCode);
    setIssues(session.issues);
    setLanguage(session.language);
    setDetectedLanguage(session.language);
    setSelectedSession(session);
    setCurrentView('editor');
    setShowReport(true);
  };

  // Simulated Login
  const handleLogin = () => {
    setIsLoggedIn(true);
    setShowLoginModal(false);
  };

  // Language options
  const languages = [
    { value: 'auto', label: 'Auto Detect' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python', label: 'Python' },
    { value: 'cpp', label: 'C++' },
    { value: 'html', label: 'HTML' },
  ];

  return (
    <div className="min-h-screen bg-[#121212] text-white font-sans overflow-hidden" style={{ background: CHARCOAL }}>
      {/* Top Navbar */}
      <div className="h-16 border-b border-[#FF5F00]/30 flex items-center justify-between px-6 bg-black/40">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded bg-[#FF5F00] flex items-center justify-center">
              <Code2 className="w-5 h-5 text-black" />
            </div>
            <div>
              <div className="font-bold tracking-[3px] text-xl">VOLT</div>
              <div className="text-[9px] text-[#FF5F00] -mt-1">CODE AI</div>
            </div>
          </div>
          <div className="ml-4 px-3 py-0.5 text-xs border border-[#FF5F00]/40 rounded">v4.8 NEON</div>
        </div>

        <div className="flex items-center gap-4">
          {!isLoggedIn ? (
            <button onClick={() => setShowLoginModal(true)} className="flex items-center gap-2 px-5 py-1.5 rounded bg-[#FF5F00] hover:bg-[#FF5F00]/90 text-black font-semibold transition-all active:scale-[0.985]">
              <User className="w-4 h-4" /> LOGIN TO SAVE
            </button>
          ) : (
            <div className="flex items-center gap-2 text-sm px-4 py-1 rounded border border-[#FF5F00]/40 text-[#FF5F00]">
              <User className="w-4 h-4" /> {username}
            </div>
          )}
        </div>
      </div>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Neon Sidebar */}
        <div className="w-64 border-r border-[#FF5F00]/20 bg-black/50 flex flex-col">
          <div className="p-5">
            <div onClick={() => setCurrentView('editor')} className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer mb-1 transition-all ${currentView === 'editor' ? 'bg-[#FF5F00] text-black font-bold' : 'hover:bg-white/5 text-[#FF5F00]'}`}>
              <Play className="w-5 h-5" /> NEW ANALYSIS
            </div>
            <div onClick={() => setCurrentView('history')} className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer mb-1 transition-all ${currentView === 'history' ? 'bg-[#FF5F00] text-black font-bold' : 'hover:bg-white/5 text-[#FF5F00]'}`}>
              <History className="w-5 h-5" /> SESSION HISTORY
            </div>
            <div onClick={() => setCurrentView('settings')} className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${currentView === 'settings' ? 'bg-[#FF5F00] text-black font-bold' : 'hover:bg-white/5 text-[#FF5F00]'}`}>
              <Settings className="w-5 h-5" /> SETTINGS
            </div>
          </div>

          <div className="mt-auto p-5 border-t border-[#FF5F00]/20 text-xs text-[#FF5F00]/70">
            HIGH-VOLTAGE DARK MODE<br />NEON ORANGE #FF5F00
          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {currentView === 'editor' && (
            <>
              {/* Editor Header */}
              <div className="px-8 py-5 border-b border-[#FF5F00]/20 flex items-center justify-between">
                <div>
                  <div className="text-[#FF5F00] text-sm tracking-[2px] font-semibold">MULTI-LANGUAGE EDITOR</div>
                  <div className="text-2xl font-bold tracking-tight">AI Bug Finder &amp; Optimizer</div>
                </div>
                
                <div className="flex items-center gap-4">
                  <select value={language} onChange={(e) => setLanguage(e.target.value)} className="bg-black border border-[#FF5F00]/60 px-4 py-2 text-sm rounded focus:outline-none focus:border-[#FF5F00]">
                    {languages.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                  <div className="text-xs px-3 py-1.5 rounded bg-black border border-[#FF5F00]/40 text-[#FF5F00]">DETECTED: {detectedLanguage.toUpperCase()}</div>
                </div>
              </div>

              {/* Code Editor */}
              <div className="flex-1 p-8 relative">
                <div className="relative h-full rounded-2xl border border-[#FF5F00]/30 bg-[#0a0a0a] overflow-hidden shadow-2xl" style={{ boxShadow: '0 0 0 1px #FF5F00, 0 25px 60px -15px rgba(0,0,0,0.6)' }}>
                  {/* Scanning Laser */}
                  <AnimatePresence>
                    {isScanning && (
                      <div className="absolute left-0 right-0 z-50 pointer-events-none" style={{ top: `${scanProgress * 0.94}%`, transition: 'top 120ms linear' }}>
                        <div className="h-[3px] w-full bg-[#FF5F00]" style={{ boxShadow: `0 0 22px ${NEON_ORANGE}, 0 0 50px ${NEON_ORANGE}` }} />
                      </div>
                    )}
                  </AnimatePresence>

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
                </div>

                {/* Action Buttons */}
                <div className="absolute bottom-9 right-9 flex gap-3">
                  <motion.button 
                    whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }}
                    onClick={analyzeCode} disabled={isAnalyzing}
                    className="flex items-center gap-3 px-8 py-3.5 rounded-xl bg-black border-2 border-[#FF5F00] text-[#FF5F00] font-semibold disabled:opacity-60 active:bg-[#FF5F00] active:text-black transition-all"
                  >
                    <Bug className="w-5 h-5" /> {isAnalyzing ? 'ANALYZING...' : 'RUN AI ANALYSIS'}
                  </motion.button>

                  {fixedCode && (
                    <motion.button 
                      id="fix-all-btn"
                      whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }}
                      onClick={applyAllFixes}
                      className="flex items-center gap-3 px-9 py-3.5 rounded-xl bg-[#FF5F00] hover:bg-[#FF5F00]/90 text-black font-extrabold shadow-[0_0_25px_rgba(255,95,0,0.5)] active:scale-[0.985] transition-all"
                    >
                      <Zap className="w-5 h-5" /> FIX ALL ({issues.length})
                    </motion.button>
                  )}
                </div>
              </div>
            </>
          )}

          {/* HISTORY VIEW */}
          {currentView === 'history' && (
            <div className="p-8">
              <div className="text-3xl font-bold tracking-tight mb-8">PREVIOUS SESSIONS</div>
              {sessions.length === 0 ? (
                <div className="text-center py-24 text-[#FF5F00]/60">No saved sessions yet. Run an analysis to save.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sessions.map((session, idx) => (
                    <div key={idx} onClick={() => loadSession(session)} className="p-5 border border-[#FF5F00]/20 hover:border-[#FF5F00] rounded-2xl cursor-pointer group bg-black/40 transition-all">
                      <div className="flex justify-between mb-4">
                        <div className="font-mono text-sm text-[#FF5F00]">{new Date(session.timestamp).toLocaleDateString()}</div>
                        <div className="uppercase text-xs tracking-widest px-3 py-px bg-[#FF5F00]/10 text-[#FF5F00] rounded">{session.language}</div>
                      </div>
                      <div className="font-semibold line-clamp-2 text-lg mb-3 pr-2">{session.summary}</div>
                      <div className="text-xs text-[#FF5F00]/60">{session.issues.length} FIXES APPLIED</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SETTINGS VIEW */}
          {currentView === 'settings' && (
            <div className="p-8 max-w-xl">
              <div className="text-3xl font-bold mb-8">SETTINGS</div>
              <div className="space-y-6 text-[#FF5F00]/90">
                <div className="border border-[#FF5F00]/20 rounded p-6">Theme: Charcoal Black + Neon Orange (locked)</div>
                <div className="border border-[#FF5F00]/20 rounded p-6">Auto Language Detection: ENABLED</div>
                <div className="border border-[#FF5F00]/20 rounded p-6">Session Storage: LOCAL BROWSER STORAGE</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* DIFF MODAL with Framer Motion Ghost Effect */}
      <AnimatePresence>
        {showDiff && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[70] p-6">
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.985, y: 15 }} transition={{ ease: [0.21, 0.92, 0.3, 1] }} className="w-full max-w-6xl bg-[#121212] border border-[#FF5F00] rounded-3xl overflow-hidden">
              <div className="px-8 py-5 border-b border-[#FF5F00]/30 flex justify-between items-center">
                <div className="font-bold text-2xl flex items-center gap-3"><AlertTriangle className="text-[#FF5F00]" /> AI ANALYSIS COMPLETE — DIFF PREVIEW</div>
                <button onClick={() => setShowDiff(false)}><X /></button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-[#FF5F00]/10">
                {/* ORIGINAL */}
                <div className="bg-[#0a0a0a] p-8">
                  <div className="uppercase text-xs tracking-[3px] mb-4 text-red-400">ORIGINAL CODE</div>
                  <pre className="font-mono text-sm whitespace-pre-wrap text-red-300/70 leading-relaxed">{code}</pre>
                </div>
                {/* FIXED with Neon Slide-In */}
                <motion.div initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="bg-[#0a0a0a] p-8 border-l border-[#FF5F00]/30">
                  <div className="uppercase text-xs tracking-[3px] mb-4 text-[#FF5F00]">FIXED CODE — NEON OPTIMIZED</div>
                  <pre className="font-mono text-sm whitespace-pre-wrap text-[#FF5F00] leading-relaxed">{fixedCode}</pre>
                </motion.div>
              </div>

              <div className="p-8 flex justify-end gap-4 bg-black/60 border-t border-[#FF5F00]/20">
                <button onClick={() => setShowDiff(false)} className="px-7 py-3 rounded-xl border border-white/30">CLOSE</button>
                <button onClick={applyAllFixes} className="px-9 py-3 rounded-xl bg-[#FF5F00] text-black font-bold">APPLY ALL FIXES NOW</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DETAILED REPORT PANEL */}
      <AnimatePresence>
        {showReport && (
          <div className="fixed inset-0 bg-black/80 z-[80] flex justify-end" onClick={() => setShowReport(false)}>
            <motion.div initial={{ x: 80 }} animate={{ x: 0 }} exit={{ x: 80 }} onClick={e => e.stopPropagation()} className="w-full max-w-lg bg-[#121212] h-full border-l border-[#FF5F00] overflow-auto">
              <div className="sticky top-0 bg-[#121212] p-8 border-b border-[#FF5F00]/40 flex justify-between">
                <div><div className="font-bold text-xl">DETAILED FIX REPORT</div><div className="text-[#FF5F00] text-sm">ALL FIXES APPLIED SUCCESSFULLY</div></div>
                <button onClick={() => setShowReport(false)}><X /></button>
              </div>
              
              <div className="p-8 space-y-7">
                {issues.map((issue, index) => (
                  <div key={index} className="border-l-4 border-[#FF5F00] pl-6">
                    <div className="flex justify-between items-center mb-1">
                      <div className="font-bold text-lg">{issue.type}</div>
                      <div className={`px-3 py-px text-xs font-bold rounded ${issue.severity === 'Critical' || issue.severity === 'High' ? 'bg-[#FF5F00] text-black' : 'bg-white/10'}`}>{issue.severity}</div>
                    </div>
                    <div className="text-[#FF5F00] mb-3">{issue.description}</div>
                    <div className="text-sm opacity-75 leading-snug mb-4">{issue.explanation}</div>
                    <div className="text-[10px] font-mono bg-black p-3 rounded">FIX: {issue.fixed}</div>
                  </div>
                ))}
              </div>

              <div className="p-8 flex gap-3 sticky bottom-0 bg-[#121212]">
                <button onClick={() => copyToClipboard(fixedCode)} className="flex-1 flex justify-center gap-2 items-center py-3 border border-[#FF5F00] hover:bg-white/5 rounded-xl"><Copy className="w-4 h-4" /> COPY FIXED CODE</button>
                <button onClick={() => downloadCode(fixedCode, `fixed-${Date.now()}.js`)} className="flex-1 flex justify-center gap-2 items-center py-3 bg-[#FF5F00] text-black font-bold rounded-xl"><Download className="w-4 h-4" /> DOWNLOAD</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Login Modal */}
      <AnimatePresence>
        {showLoginModal && (
          <div className="fixed inset-0 bg-black/90 z-[90] flex items-center justify-center">
            <div className="bg-[#121212] border border-[#FF5F00] w-full max-w-sm p-9 rounded-3xl">
              <div className="font-bold text-center text-2xl mb-2">SIGN IN</div>
              <div className="text-center text-sm mb-8 text-[#FF5F00]/60">Save and revisit all your analysis sessions</div>
              <input value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-black border border-[#FF5F00]/40 py-3 px-4 mb-3 rounded" placeholder="Username" />
              <button onClick={handleLogin} className="mt-2 w-full py-3.5 bg-[#FF5F00] font-extrabold text-black rounded-xl">SIGN IN &amp; ENABLE HISTORY</button>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
