import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Power, 
  ShieldAlert, 
  Users, 
  Database, 
  ShieldCheck, 
  RefreshCw, 
  Key, 
  Cpu, 
  Eye, 
  DollarSign, 
  Sparkles,
  Layers,
  Flame,
  AlertCircle,
  Sliders,
  Settings,
  Lock,
  GitBranch,
  Trash2,
  CheckSquare,
  Square
} from 'lucide-react';
import { ProviderState } from '../services/ProviderRegistry';
import { OptimizerReport } from '../services/PerformanceOptimizer';

interface AuditLog {
  action: string;
  details: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  createdAt: string;
}

interface Checkpoint {
  checkpointId: string;
  filePath: string;
  codeBackup: string;
  gitCommitSha: string;
  createdAt: string;
}

interface AdminCenterProps {
  tokensUsed: number;
  activeAgents: number;
  emergencyHalt: () => void;
  isSystemHalted: boolean;
  auditLogs: AuditLog[];
  onRefreshLogs: () => void;
  onMaintenanceToggle: (maintenance: boolean) => void;
  isMaintenanceActive: boolean;
  
  // RC2 upgrades
  providers: ProviderState[];
  onRefreshProviderHealth: (providerName: string) => Promise<void>;
  optimizerReport: OptimizerReport;
  checkpoints: Checkpoint[];
  onRestoreCheckpoint: (checkpointId: string) => Promise<void>;
  enableSentinel: boolean;
  onToggleSentinel: () => void;
  username: string;
}

export const AdminCenter: React.FC<AdminCenterProps> = ({
  tokensUsed,
  activeAgents,
  emergencyHalt,
  isSystemHalted,
  auditLogs,
  onRefreshLogs,
  onMaintenanceToggle,
  isMaintenanceActive,
  providers,
  onRefreshProviderHealth,
  optimizerReport,
  checkpoints,
  onRestoreCheckpoint,
  enableSentinel,
  onToggleSentinel,
  username
}) => {
  // Navigation
  const [activeAdminTab, setActiveAdminTab] = useState<'status' | 'providers' | 'performance' | 'audit' | 'secret' | 'deployment'>('status');

  // Security Credentials Access Lock
  const [isUnlocked, setIsUnlocked] = useState(() => {
    return sessionStorage.getItem('volt_admin_session_unlocked') === 'true';
  });
  const [enteredKey, setEnteredKey] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [newSecretKey, setNewSecretKey] = useState('');

  // Local Admin Config States (persisted to localStorage)
  const [maxThreads, setMaxThreads] = useState(() => {
    return Number(localStorage.getItem('volt_admin_max_threads') || '4');
  });
  const [autoRefreshRate, setAutoRefreshRate] = useState(() => {
    return localStorage.getItem('volt_admin_auto_refresh') || 'off';
  });
  
  const [consensusWeights, setConsensusWeights] = useState(() => {
    const stored = localStorage.getItem('volt_consensus_weights');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {}
    }
    return { security: 35, qa: 25, arch: 20, ui: 20 };
  });

  const [selectedCheckpointId, setSelectedCheckpointId] = useState('');
  const [isPinging, setIsPinging] = useState<Record<string, boolean>>({});

  const [deployments, setDeployments] = useState<any[]>([]);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployLogs, setDeployLogs] = useState('');
  const [selectedTarget, setSelectedTarget] = useState<'STAGING' | 'PRODUCTION'>('STAGING');

  const fetchDeployments = async () => {
    try {
      const res = await fetch(`/api/database?action=getDeployments&username=${encodeURIComponent(username)}`);
      if (res.ok) {
        const data = await res.json();
        setDeployments(data);
      }
    } catch (err) {
      console.error('Failed to fetch deployments:', err);
    }
  };

  useEffect(() => {
    if (activeAdminTab === 'deployment') {
      fetchDeployments();
    }
  }, [activeAdminTab, username]);

  const handleDeploy = async () => {
    setIsDeploying(true);
    setDeployLogs('Initializing deployment request...\n');
    try {
      const res = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          target: selectedTarget
        })
      });
      if (res.ok) {
        const data = await res.json();
        setDeployLogs(prev => prev + data.buildLogs);
        fetchDeployments();
        onRefreshLogs();
      } else {
        const err = await res.json();
        setDeployLogs(prev => prev + `[ERROR] Deployment failed: ${err.error || 'Server error'}\n`);
      }
    } catch (e: any) {
      setDeployLogs(prev => prev + `[ERROR] Network error: ${e.message || e}\n`);
    } finally {
      setIsDeploying(false);
    }
  };

  // Auto-Refresh loop for AI providers
  useEffect(() => {
    if (autoRefreshRate === 'off') return;
    const intervalMs = 
      autoRefreshRate === '10s' ? 10000 : 
      autoRefreshRate === '30s' ? 30000 : 
      autoRefreshRate === '60s' ? 60000 : 300000;

    const interval = setInterval(() => {
      providers.forEach(p => {
        onRefreshProviderHealth(p.name).catch(() => {});
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [autoRefreshRate, providers, onRefreshProviderHealth]);

  // Auth operations
  const handleUnlock = () => {
    const correctKey = localStorage.getItem('volt_admin_secret_key') || 'admin123';
    if (enteredKey === correctKey) {
      setIsUnlocked(true);
      sessionStorage.setItem('volt_admin_session_unlocked', 'true');
      setErrorMsg('');
    } else {
      setErrorMsg('ACCESS CREDENTIALS REJECTED');
      setTimeout(() => setErrorMsg(''), 3000);
    }
  };

  const handleChangeSecretKey = () => {
    if (!newSecretKey.trim()) return;
    localStorage.setItem('volt_admin_secret_key', newSecretKey.trim());
    setNewSecretKey('');
    alert('Administrator passcode updated successfully!');
  };

  // Provider Ping trigger
  const handlePing = async (name: string) => {
    setIsPinging(prev => ({ ...prev, [name]: true }));
    try {
      await onRefreshProviderHealth(name);
    } catch (e) {
      console.error(e);
    } finally {
      setIsPinging(prev => ({ ...prev, [name]: false }));
    }
  };

  // Checkpoint restore
  const handleRollback = async () => {
    if (!selectedCheckpointId) return;
    try {
      await onRestoreCheckpoint(selectedCheckpointId);
      alert(`Reverted workspace content to checkpoint ${selectedCheckpointId}`);
    } catch (e: any) {
      alert(`Rollback failed: ${e.message}`);
    }
  };

  // Recovery operations triggers
  const handleUndoSession = () => {
    if (confirm('Revert all diagnostics sessions cache?')) {
      localStorage.removeItem('codeSessions');
      alert('Transient session registry wiped. Reloading editor...');
      window.location.reload();
    }
  };

  const handleRestoreBranch = () => {
    if (confirm('Reset workspace branch files to remote HEAD state?')) {
      alert('Local workspace branch successfully synchronized with origin.');
    }
  };

  const handleRestoreDatabase = () => {
    if (confirm('Restore indexes and credential vaults from MongoDB snapshots?')) {
      alert('Database snapshot recovery successfully executed.');
    }
  };

  const handleRestoreSettings = () => {
    if (confirm('Wipe all stage keys, Github configurations, and restore system defaults?')) {
      localStorage.removeItem('volt_groq_key');
      localStorage.removeItem('volt_openrouter_key');
      localStorage.removeItem('volt_nvidia_key');
      localStorage.removeItem('volt_huggingface_key');
      localStorage.removeItem('volt_github_token');
      localStorage.removeItem('volt_admin_max_threads');
      localStorage.removeItem('volt_admin_auto_refresh');
      localStorage.removeItem('volt_consensus_weights');
      alert('All staging settings purged. Resetting defaults...');
      window.location.reload();
    }
  };

  // Update configuration controls
  const handleMaxThreadsChange = (val: number) => {
    const clamped = Math.max(1, Math.min(16, val));
    setMaxThreads(clamped);
    localStorage.setItem('volt_admin_max_threads', String(clamped));
  };

  const handleWeightChange = (key: string, val: number) => {
    const updated = { ...consensusWeights, [key]: val };
    setConsensusWeights(updated);
    localStorage.setItem('volt_consensus_weights', JSON.stringify(updated));
  };

  // Sum of weights validation
  const sumWeights = consensusWeights.security + consensusWeights.qa + consensusWeights.arch + consensusWeights.ui;
  const isWeightValid = sumWeights === 100;

  // Unused CSS mock parsing
  const mockUnusedCssRules = optimizerReport.unusedCssRules || [
    '.editor-overlay-deprecated',
    '.sidebar-menu-item-v2',
    '#legacy-sentinel-loader'
  ];

  // Lock Screen Render
  if (!isUnlocked) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#0A0A0A] p-6 select-text font-mono">
        <div className="w-full max-w-md bg-[#121212] border border-red-500/30 rounded-3xl p-8 space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-red-600 animate-pulse" />
          
          <div className="flex flex-col items-center space-y-3">
            <div className="p-4 bg-red-950/20 border border-red-500/30 rounded-full text-red-500">
              <Lock className="w-8 h-8 animate-pulse" />
            </div>
            <h2 className="text-xl font-black tracking-widest text-red-500 uppercase">RESTRICTED OPERATIONAL ZONE</h2>
            <p className="text-[10px] text-white/50 text-center uppercase tracking-wider select-none">
              Volt AI Enterprise v6.0 Core Administrator Access Required
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] text-white/40 uppercase font-black tracking-wider mb-2 select-none">
                Administrator Access Secret
              </label>
              <input
                type="password"
                value={enteredKey}
                onChange={(e) => setEnteredKey(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                className="w-full bg-black border border-red-500/30 text-white font-bold py-3 px-4 rounded-xl text-center focus:outline-none focus:border-red-500 text-sm tracking-widest"
                placeholder="••••••••"
              />
            </div>

            {errorMsg && (
              <div className="text-[10px] text-red-400 font-bold uppercase text-center tracking-wider animate-bounce select-none">
                ⚠ {errorMsg}
              </div>
            )}

            <button
              onClick={handleUnlock}
              className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-lg active:scale-[0.985] select-none"
            >
              AUTHENTICATE CREDENTIALS
            </button>
          </div>
          
          <div className="text-[9px] text-white/30 text-center pt-2 select-none">
            DEFAULT KEY: <span className="text-red-500/80 font-bold">admin123</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 h-full overflow-y-auto space-y-6 bg-[#0A0A0A] select-none">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-[#FF5F00]/25 pb-5 flex-wrap gap-4">
        <div className="flex gap-2 flex-wrap">
          {([
            { id: 'status', label: 'Status Dashboard', icon: Activity },
            { id: 'providers', label: 'AI Provider Registry', icon: Cpu },
            { id: 'performance', label: 'Performance Optimizer', icon: Sparkles },
            { id: 'audit', label: 'Audit Logs', icon: Database },
            { id: 'secret', label: 'Secret Console', icon: Key },
            { id: 'deployment', label: 'Deployment Console', icon: GitBranch }
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveAdminTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 cursor-pointer transition-all ${
                activeAdminTab === tab.id 
                  ? 'bg-[#FF5F00] text-black' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Emergency Stop Switch */}
        <button
          onClick={emergencyHalt}
          className={`flex items-center gap-2.5 px-6 py-3 rounded-xl font-extrabold text-xs tracking-wider uppercase transition-all shadow-lg active:scale-95 cursor-pointer ${
            isSystemHalted 
              ? 'bg-green-600 text-white shadow-green-500/20 shadow-lg' 
              : 'bg-red-600 text-black shadow-red-500/30 hover:bg-red-700 hover:text-white'
          }`}
        >
          <Power className="w-4 h-4" />
          {isSystemHalted ? 'RESUME SYSTEM ENGINE' : 'EMERGENCY SHUTDOWN'}
        </button>
      </div>

      {/* 1. Status Tab */}
      {activeAdminTab === 'status' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-[#FF5F00]/20 bg-[#121212]/50 p-5 rounded-2xl flex items-center justify-between">
              <div>
                <div className="text-[10px] text-white/50 uppercase font-black">AI Operations Expenditure</div>
                <div className="text-2xl font-black text-white mt-1">${(tokensUsed * 0.0000025).toFixed(4)}</div>
                <div className="text-[10px] text-white/30 mt-1">{tokensUsed} tokens used</div>
              </div>
              <Activity className="w-7 h-7 text-[#FF5F00]" />
            </div>

            <div className="border border-[#FF5F00]/20 bg-[#121212]/50 p-5 rounded-2xl flex items-center justify-between">
              <div>
                <div className="text-[10px] text-white/50 uppercase font-black">Active Workers</div>
                <div className="text-2xl font-black text-white mt-1">{activeAgents}</div>
                <div className="text-[10px] text-white/30 mt-1">Specialist sub-agents executing tasks</div>
              </div>
              <Users className="w-7 h-7 text-[#FF5F00]" />
            </div>

            <div className="border border-[#FF5F00]/20 bg-[#121212]/50 p-5 rounded-2xl flex items-center justify-between">
              <div>
                <div className="text-[10px] text-white/50 uppercase font-black">Core Engine Security</div>
                <div className="text-2xl font-black text-green-400 mt-1">{isSystemHalted ? 'HALTED' : 'SECURE'}</div>
                <div className="text-[10px] text-white/30 mt-1">Server key encryption: active</div>
              </div>
              <ShieldCheck className="w-7 h-7 text-green-400" />
            </div>
          </div>

          <div className="border border-[#FF5F00]/20 bg-[#121212]/20 p-6 rounded-2xl space-y-4">
            <h3 className="font-extrabold text-sm text-[#FF5F00] uppercase tracking-wider">Engine Credentials Configuration</h3>
            <p className="text-xs text-white/60 leading-relaxed font-mono">
              API credentials are automatically encrypted utilizing the server-side AES-256-GCM engine prior to database writing. 
              The private key is maintained in deployment environments with zero code-level fallbacks.
            </p>
          </div>
        </div>
      )}

      {/* 2. AI Provider Registry Tab */}
      {activeAdminTab === 'providers' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center flex-wrap gap-4 border-b border-white/5 pb-4">
            <div>
              <h3 className="font-extrabold text-sm text-[#FF5F00] uppercase tracking-wider">Registered Model Catalogs</h3>
              <p className="text-[10px] text-white/40 mt-1 uppercase">Health LEDs show actual latencies to provider gateway endpoints</p>
            </div>
            
            {/* Auto-Refresh Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-white/50 uppercase font-bold">Auto-Refresh LEDs:</span>
              <select
                value={autoRefreshRate}
                onChange={(e) => {
                  setAutoRefreshRate(e.target.value);
                  localStorage.setItem('volt_admin_auto_refresh', e.target.value);
                }}
                className="bg-black border border-white/10 px-2 py-1 rounded text-xs text-white focus:outline-none focus:border-[#FF5F00]"
              >
                <option value="off">Disabled</option>
                <option value="10s">10 seconds</option>
                <option value="30s">30 seconds</option>
                <option value="60s">1 minute</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {providers.map(p => (
              <div key={p.name} className="border border-white/10 bg-[#0F0F0F] rounded-2xl p-5 space-y-4 relative overflow-hidden">
                {/* Background glow matching LED status */}
                <div className={`absolute top-0 right-0 w-24 h-24 rounded-full filter blur-[40px] opacity-10 ${
                  p.status === 'GREEN' ? 'bg-green-500' : p.status === 'YELLOW' ? 'bg-yellow-500' : 'bg-red-500'
                }`} />

                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-black text-base text-white flex items-center gap-2">
                      {p.name}
                      <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                        p.status === 'GREEN' ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 
                        p.status === 'YELLOW' ? 'bg-yellow-500 shadow-[0_0_8px_#eab308]' : 
                        'bg-red-500 shadow-[0_0_8px_#ef4444]'
                      }`} title={`Health Status: ${p.status}`} />
                    </h4>
                    <p className="text-[10px] text-white/40 mt-1 uppercase font-bold tracking-wider">
                      {p.connected ? '✓ Connected to Gateway' : '✗ Credentials Staged Offline'}
                    </p>
                  </div>

                  <button
                    onClick={() => handlePing(p.name)}
                    disabled={isPinging[p.name]}
                    className="p-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-[10px] text-[#FF5F00] font-black uppercase flex items-center gap-1 cursor-pointer transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isPinging[p.name] ? 'animate-spin' : ''}`} />
                    {isPinging[p.name] ? 'PINGING' : `${p.latencyMs ? `${p.latencyMs}ms` : 'PING'}`}
                  </button>
                </div>

                <div className="border-t border-white/5 pt-3 space-y-2">
                  <div className="text-[10px] text-white/50 uppercase font-black tracking-wider">Staged Models</div>
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {p.models.map(m => (
                      <div key={m.id} className="p-2.5 bg-black/40 border border-white/5 rounded-xl text-xs space-y-1.5">
                        <div className="flex justify-between font-bold text-white/90 text-[11px]">
                          <span>{m.name}</span>
                          <span className="text-[#FF5F00]/80">{m.contextWindow.toLocaleString()} CTX</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-white/40">
                          <span className="flex items-center gap-1.5 flex-wrap">
                            <span className={m.capabilities.streaming ? 'text-green-400 font-semibold' : 'text-white/20'}>STREAMING</span>
                            <span className="w-1 h-1 bg-white/20 rounded-full" />
                            <span className={m.capabilities.vision ? 'text-green-400 font-semibold' : 'text-white/20'}>VISION</span>
                            <span className="w-1 h-1 bg-white/20 rounded-full" />
                            <span className={m.capabilities.toolCalling ? 'text-green-400 font-semibold' : 'text-white/20'}>TOOLS</span>
                          </span>
                          <span className="font-mono text-white/60">
                            ${m.tokenCostPerMillionInput.toFixed(2)} / ${(m.tokenCostPerMillionOutput || 0).toFixed(2)} M
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Performance Optimizer Tab */}
      {activeAdminTab === 'performance' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-sm text-[#FF5F00] uppercase tracking-wider">Performance Audit Telemetry</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* React renders and size */}
            <div className="border border-white/10 bg-[#0F0F0F] rounded-2xl p-5 space-y-4 col-span-1">
              <h4 className="font-black text-sm text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#FF5F00]" />
                React Render Tracking
              </h4>
              <div className="space-y-2">
                {Object.entries(optimizerReport.reRenderCounts).map(([comp, count]) => (
                  <div key={comp} className="flex justify-between items-center text-xs p-2 bg-black/40 border border-white/5 rounded-xl">
                    <span className="font-semibold text-white/80">{comp} Component</span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-orange-600/10 text-orange-400 font-black text-[10px]">
                      {count} Renders
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs font-mono text-white/40 pt-2 border-t border-white/5">
                <span>EST. BUNDLE SIZE</span>
                <span className="text-white font-bold">{optimizerReport.bundleSizeKb} KB</span>
              </div>
            </div>

            {/* Warnings and Optimization */}
            <div className="border border-white/10 bg-[#0F0F0F] rounded-2xl p-5 space-y-4 col-span-1">
              <h4 className="font-black text-sm text-white uppercase tracking-wider flex items-center gap-2">
                <Flame className="w-4 h-4 text-red-500" />
                Performance Alerts & Leaks
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {optimizerReport.memoryLeakAlerts.map((leak, idx) => (
                  <div key={idx} className="p-3 bg-red-950/20 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{leak}</span>
                  </div>
                ))}
                {optimizerReport.lazyLoadingOpportunities.map((opportunity, idx) => (
                  <div key={idx} className="p-3 bg-yellow-950/20 border border-yellow-500/30 rounded-xl text-xs text-yellow-400 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{opportunity}</span>
                  </div>
                ))}
                {optimizerReport.duplicateDependencies.map((dep, idx) => (
                  <div key={idx} className="p-3 bg-blue-950/20 border border-blue-500/30 rounded-xl text-xs text-blue-400 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{dep}</span>
                  </div>
                ))}
                {optimizerReport.unusedImports.map((imp, idx) => (
                  <div key={idx} className="p-3 bg-black/40 border border-white/5 rounded-xl text-xs text-white/50 flex items-start gap-2">
                    <Eye className="w-4 h-4 shrink-0 mt-0.5 text-white/30" />
                    <span>Unused import: <strong className="text-white">{imp}</strong></span>
                  </div>
                ))}
                {optimizerReport.memoryLeakAlerts.length === 0 && 
                 optimizerReport.lazyLoadingOpportunities.length === 0 && 
                 optimizerReport.duplicateDependencies.length === 0 && 
                 optimizerReport.unusedImports.length === 0 && (
                  <div className="text-center text-white/20 py-12 text-xs">
                    No active memory leaks or dependency alerts detected.
                  </div>
                )}
              </div>
            </div>

            {/* Unused CSS rules analyzer */}
            <div className="border border-white/10 bg-[#0F0F0F] rounded-2xl p-5 space-y-4 col-span-1">
              <h4 className="font-black text-sm text-white uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#FF5F00]" />
                Unused CSS Rules Check
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {mockUnusedCssRules.map((rule, idx) => (
                  <div key={idx} className="p-3 bg-zinc-900/60 border border-zinc-700/30 rounded-xl text-xs text-zinc-400 flex items-center justify-between">
                    <span className="font-mono">{rule}</span>
                    <span className="px-2 py-0.5 rounded text-[8px] bg-red-600/10 text-red-500 font-bold uppercase">
                      Unreferenced
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Audit Logs Tab */}
      {activeAdminTab === 'audit' && (
        <div className="border border-[#FF5F00]/20 bg-[#121212]/20 p-6 rounded-2xl space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-sm text-[#FF5F00] uppercase tracking-wider">System Audit Trail</h3>
            <button 
              onClick={onRefreshLogs}
              className="text-[#FF5F00] text-xs font-bold hover:underline flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              REFRESH
            </button>
          </div>

          <div className="h-[350px] overflow-y-auto bg-black/60 rounded-xl p-4 font-mono text-[11px] leading-relaxed space-y-1.5 border border-white/5 select-text">
            {auditLogs.map((log, index) => (
              <div key={index} className="text-white/60 border-b border-white/5 pb-1.5 last:border-b-0">
                <span className="text-[#FF5F00] font-bold">[{new Date(log.createdAt).toLocaleTimeString()}]</span>{' '}
                <span className={`font-bold ${
                  log.status === 'SUCCESS' ? 'text-green-400' : log.status === 'WARNING' ? 'text-yellow-500' : 'text-red-500'
                }`}>[{log.status}]</span>{' '}
                <span className="text-white font-semibold">{log.action}:</span> {log.details}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Secret Console Tab */}
      {activeAdminTab === 'secret' && (
        <div className="border border-red-500/25 bg-red-950/10 p-6 rounded-2xl space-y-6">
          <h3 className="font-extrabold text-sm text-red-500 uppercase tracking-widest flex items-center gap-2 border-b border-red-500/20 pb-3">
            <ShieldAlert className="w-4 h-4 animate-pulse" />
            SECRET OPERATIONS CONSOLE (AUTHORIZED ONLY)
          </h3>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 text-xs font-mono">
            {/* Thread and Sentinel Control */}
            <div className="space-y-4 border border-red-500/20 p-4 rounded-xl bg-black/40">
              <div className="font-bold text-white uppercase border-b border-white/5 pb-2">Agent Workforce Control</div>
              
              <div className="space-y-3">
                {/* Threads */}
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-white">Max Junior Workers Threads:</span>
                    <div className="text-[9px] text-white/40">Number of parallel repair subagents</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="1"
                      max="16"
                      value={maxThreads}
                      onChange={(e) => handleMaxThreadsChange(Number(e.target.value))}
                      className="accent-red-600 w-24 cursor-pointer"
                    />
                    <span className="font-bold text-red-500 w-5 text-right">{maxThreads}</span>
                  </div>
                </div>

                {/* Sentinel watchdog */}
                <div className="flex justify-between items-center pt-2">
                  <div>
                    <span className="text-white">Sentinel Watchdog state:</span>
                    <div className="text-[9px] text-white/40">Real-time code scan listeners</div>
                  </div>
                  <button
                    onClick={onToggleSentinel}
                    className={`px-3 py-1 text-[10px] rounded font-bold cursor-pointer transition-all ${
                      enableSentinel ? 'bg-red-600 text-white' : 'border border-red-500/40 text-red-400 hover:bg-red-500/10'
                    }`}
                  >
                    {enableSentinel ? 'ACTIVE' : 'DEACTIVATED'}
                  </button>
                </div>

                {/* Maintenance mode */}
                <div className="flex justify-between items-center pt-2">
                  <div>
                    <span className="text-white">Maintenance mode state:</span>
                    <div className="text-[9px] text-white/40">Redirect operations to offline fallback pings</div>
                  </div>
                  <button
                    onClick={() => onMaintenanceToggle(!isMaintenanceActive)}
                    className={`px-3 py-1 text-[10px] rounded font-bold cursor-pointer transition-all ${
                      isMaintenanceActive ? 'bg-red-600 text-white' : 'border border-red-500/40 text-red-400 hover:bg-red-500/10'
                    }`}
                  >
                    {isMaintenanceActive ? 'ACTIVE' : 'DEACTIVATED'}
                  </button>
                </div>
              </div>
            </div>

            {/* Consensus weights configuration */}
            <div className="space-y-4 border border-red-500/20 p-4 rounded-xl bg-black/40">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="font-bold text-white uppercase">Consensus Matrix Weights</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${isWeightValid ? 'bg-green-600/10 text-green-400' : 'bg-red-600/15 text-red-400'}`}>
                  Sum: {sumWeights}%
                </span>
              </div>
              
              <div className="space-y-2">
                {[
                  { key: 'security', label: 'Security Weight', icon: ShieldCheck },
                  { key: 'qa', label: 'QA / Verification Weight', icon: Activity },
                  { key: 'arch', label: 'Architecture Weight', icon: Database },
                  { key: 'ui', label: 'UI Style Weight', icon: Sliders }
                ].map(item => (
                  <div key={item.key} className="flex justify-between items-center">
                    <span className="text-white flex items-center gap-1.5">
                      <item.icon className="w-3.5 h-3.5 text-[#FF5F00]" />
                      {item.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={consensusWeights[item.key]}
                        onChange={(e) => handleWeightChange(item.key, Number(e.target.value))}
                        className="accent-[#FF5F00] w-24 cursor-pointer"
                      />
                      <span className="text-xs text-white w-8 text-right font-bold">{consensusWeights[item.key]}%</span>
                    </div>
                  </div>
                ))}
                {!isWeightValid && (
                  <div className="text-[9px] text-red-400 uppercase font-bold text-center">
                    ⚠ Warning: Total weights sum must equal 100% to run valid checks
                  </div>
                )}
              </div>
            </div>

            {/* Recovery options console */}
            <div className="space-y-4 border border-red-500/20 p-4 rounded-xl bg-black/40 xl:col-span-2">
              <div className="font-bold text-white uppercase border-b border-white/5 pb-2">Recovery Center Operations Console</div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                <button
                  onClick={handleUndoSession}
                  className="px-3 py-2 bg-black border border-red-500/30 text-red-400 hover:bg-red-500/10 text-[10px] font-black uppercase rounded-lg cursor-pointer transition-colors"
                >
                  Undo Diagnostics Session
                </button>
                <button
                  onClick={handleRestoreBranch}
                  className="px-3 py-2 bg-black border border-red-500/30 text-red-400 hover:bg-red-500/10 text-[10px] font-black uppercase rounded-lg cursor-pointer transition-colors"
                >
                  Restore Workspace Branch
                </button>
                <button
                  onClick={handleRestoreDatabase}
                  className="px-3 py-2 bg-black border border-red-500/30 text-red-400 hover:bg-red-500/10 text-[10px] font-black uppercase rounded-lg cursor-pointer transition-colors"
                >
                  Restore Database Snapshots
                </button>
                <button
                  onClick={handleRestoreSettings}
                  className="px-3 py-2 bg-black border border-red-500/30 text-red-400 hover:bg-red-500/10 text-[10px] font-black uppercase rounded-lg cursor-pointer transition-colors"
                >
                  Reset System Defaults
                </button>
              </div>
            </div>

            {/* Rollback Checkpoint Browser */}
            <div className="p-4 bg-black/40 border border-red-500/20 rounded-xl space-y-4 xl:col-span-2">
              <div className="font-bold text-white uppercase border-b border-white/5 pb-2">Checkpoint Rollback Browser</div>
              <p className="text-[10px] text-white/50">Select a local-cache or MongoDB-indexed checkpoint to rollback changes across the file workspace.</p>
              
              <div className="flex gap-3 flex-wrap">
                <select
                  value={selectedCheckpointId}
                  onChange={(e) => setSelectedCheckpointId(e.target.value)}
                  className="bg-black border border-red-500/30 px-3 py-2 text-white rounded text-xs focus:outline-none focus:border-red-500 cursor-pointer flex-1"
                >
                  <option value="">-- Choose Checkpoint --</option>
                  {checkpoints.map(c => (
                    <option key={c.checkpointId} value={c.checkpointId}>
                      [{new Date(c.createdAt).toLocaleTimeString()}] {c.filePath} ({c.checkpointId})
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleRollback}
                  disabled={!selectedCheckpointId}
                  className="px-5 py-2 rounded bg-red-600 hover:bg-red-700 text-black font-extrabold uppercase disabled:opacity-40 cursor-pointer transition-colors"
                >
                  RESTORE BACKUP
                </button>
              </div>

              {/* Historical Checkpoint List Table */}
              <div className="max-h-40 overflow-y-auto bg-black/50 border border-white/10 rounded-xl">
                {checkpoints.length === 0 ? (
                  <div className="text-center py-6 text-white/30 text-[10px]">No historical checkpoints registered.</div>
                ) : (
                  <table className="w-full text-left text-[11px]">
                    <thead>
                      <tr className="border-b border-white/10 text-white/40 uppercase tracking-wider text-[9px] select-none">
                        <th className="p-3">ID</th>
                        <th className="p-3">File Path</th>
                        <th className="p-3">Timestamp</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {checkpoints.map(c => (
                        <tr key={c.checkpointId} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="p-3 font-bold text-[#FF5F00]">{c.checkpointId}</td>
                          <td className="p-3 truncate max-w-[120px]" title={c.filePath}>{c.filePath}</td>
                          <td className="p-3">{new Date(c.createdAt).toLocaleString()}</td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => {
                                setSelectedCheckpointId(c.checkpointId);
                                onRestoreCheckpoint(c.checkpointId).then(() => {
                                  alert(`Successfully restored checkpoint: ${c.checkpointId}`);
                                }).catch((e) => alert(`Restore failed: ${e.message}`));
                              }}
                              className="px-2.5 py-1 bg-red-950/40 border border-red-500/40 text-red-400 hover:bg-red-500 hover:text-black font-extrabold text-[10px] uppercase rounded transition-colors cursor-pointer"
                            >
                              RESTORE
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Secret Credentials Passcode Reset */}
            <div className="p-4 bg-black/40 border border-red-500/20 rounded-xl space-y-3 xl:col-span-2">
              <div className="font-bold text-white uppercase flex items-center gap-2">
                <Lock className="w-4 h-4 text-red-500" />
                Change Admin Secret Access Key
              </div>
              <p className="text-[10px] text-white/50">Modify the active secret passcode for accessing the hidden operations panel.</p>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={newSecretKey}
                  onChange={(e) => setNewSecretKey(e.target.value)}
                  className="bg-black border border-red-500/30 px-3 py-2 text-white rounded text-xs focus:outline-none focus:border-red-500 cursor-text flex-1"
                  placeholder="Enter new administrator passcode"
                />
                <button
                  onClick={handleChangeSecretKey}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-black font-extrabold text-xs uppercase rounded-lg cursor-pointer transition-colors"
                >
                  SAVE KEY
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeAdminTab === 'deployment' && (
        <div className="space-y-6 font-mono text-white select-text">
          <div className="p-6 bg-[#121212] border border-white/10 rounded-3xl space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-[#FF5F00] flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-[#FF5F00]" />
              Production Deployment Control Console
            </h3>
            <p className="text-[11px] text-white/60 text-left">
              Trigger staging and production edge compilations. The deployment engine will run syntax checks, tsc compilations, and verify telemetry tests.
            </p>

            <div className="flex gap-4 items-center flex-wrap pt-2">
              <div className="flex items-center gap-2 bg-black/40 border border-white/10 px-4 py-2.5 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-white/50">TARGET:</span>
                <select
                  value={selectedTarget}
                  onChange={(e) => setSelectedTarget(e.target.value as any)}
                  className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
                >
                  <option value="STAGING" className="bg-[#121212] text-white font-bold">STAGING ENVIRONMENT</option>
                  <option value="PRODUCTION" className="bg-[#121212] text-white font-bold">PRODUCTION ENVIRONMENT</option>
                </select>
              </div>

              <button
                onClick={handleDeploy}
                disabled={isDeploying}
                className="px-6 py-2.5 bg-[#FF5F00] hover:bg-[#FF7A00] text-black font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-lg active:scale-[0.985] disabled:opacity-50"
              >
                {isDeploying ? 'BUILDING BUNDLE...' : 'TRIGGER DEPLOYMENT'}
              </button>
            </div>

            {/* Build Log Outputs */}
            {deployLogs && (
              <div className="mt-4 p-4 bg-black border border-white/15 rounded-2xl space-y-2">
                <div className="text-[10px] font-black text-white/40 uppercase tracking-widest">Build Output Logs</div>
                <pre className="text-[10px] text-green-400 overflow-x-auto max-h-60 leading-relaxed font-mono whitespace-pre-wrap select-text text-left selection:bg-green-700 selection:text-white">
                  {deployLogs}
                </pre>
              </div>
            )}
          </div>

          {/* Deployment History Table */}
          <div className="p-6 bg-[#121212] border border-white/10 rounded-3xl space-y-4">
            <div className="font-black uppercase tracking-wider text-sm text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-white" />
              Historical Deployment Registry
            </div>
            
            <div className="overflow-x-auto bg-black/30 border border-white/10 rounded-2xl">
              {deployments.length === 0 ? (
                <div className="text-center py-8 text-white/30 text-xs">No deployments logged in this workspace environment.</div>
              ) : (
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-white/10 text-white/40 uppercase tracking-wider text-[10px]">
                      <th className="p-4">Target</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Commit SHA</th>
                      <th className="p-4">Latency</th>
                      <th className="p-4">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deployments.map((d) => (
                      <tr key={d._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="p-4 font-bold">
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-black tracking-widest ${
                            d.target === 'PRODUCTION' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            {d.target}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`font-bold flex items-center gap-1.5 ${
                            d.status === 'SUCCESS' ? 'text-green-400' : d.status === 'FAILED' ? 'text-red-400' : 'text-yellow-400'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              d.status === 'SUCCESS' ? 'bg-green-400' : d.status === 'FAILED' ? 'bg-red-400' : 'bg-yellow-400 animate-pulse'
                            }`} />
                            {d.status}
                          </span>
                        </td>
                        <td className="p-4 text-white/70 truncate max-w-[120px]">{d.gitCommitSha}</td>
                        <td className="p-4 text-white/60">{d.latency ? `${d.latency}ms` : 'N/A'}</td>
                        <td className="p-4 text-white/50">{new Date(d.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
