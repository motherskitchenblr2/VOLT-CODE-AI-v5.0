import React, { useState } from 'react';
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
  AlertCircle
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
  onToggleSentinel
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<'status' | 'providers' | 'performance' | 'audit' | 'secret'>('status');
  const [selectedCheckpointId, setSelectedCheckpointId] = useState('');
  const [isPinging, setIsPinging] = useState<Record<string, boolean>>({});

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

  const handleRollback = async () => {
    if (!selectedCheckpointId) return;
    try {
      await onRestoreCheckpoint(selectedCheckpointId);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-8 h-full overflow-y-auto space-y-6 bg-[#0A0A0A] select-none">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-[#FF5F00]/25 pb-5 flex-wrap gap-4">
        <div className="flex gap-2 flex-wrap">
          {([
            { id: 'status', label: 'Status', icon: Activity },
            { id: 'providers', label: 'AI Provider Registry', icon: Cpu },
            { id: 'performance', label: 'Performance Optimizer', icon: Sparkles },
            { id: 'audit', label: 'Audit Logs', icon: Database },
            { id: 'secret', label: 'Secret Console', icon: Key }
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
              ? 'bg-green-600 text-white shadow-green-500/20' 
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
            <p className="text-xs text-white/60 leading-relaxed">
              API credentials are automatically encrypted utilizing the server-side AES-256-GCM engine prior to database writing. 
              The private key is maintained in deployment environments with zero code-level fallbacks.
            </p>
          </div>
        </div>
      )}

      {/* 2. AI Provider Registry Tab */}
      {activeAdminTab === 'providers' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-sm text-[#FF5F00] uppercase tracking-wider">Registered Model Catalogs</h3>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* React renders and size */}
            <div className="border border-white/10 bg-[#0F0F0F] rounded-2xl p-5 space-y-4">
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
                <span>EST. COMPILED BUNDLE SIZE</span>
                <span className="text-white font-bold">{optimizerReport.bundleSizeKb} KB</span>
              </div>
            </div>

            {/* Warnings and Optimization */}
            <div className="border border-white/10 bg-[#0F0F0F] rounded-2xl p-5 space-y-4">
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
                    <span>Unused import cleanup path: <strong className="text-white">{imp}</strong></span>
                  </div>
                ))}
                {optimizerReport.memoryLeakAlerts.length === 0 && 
                 optimizerReport.lazyLoadingOpportunities.length === 0 && 
                 optimizerReport.duplicateDependencies.length === 0 && 
                 optimizerReport.unusedImports.length === 0 && (
                  <div className="text-center text-white/20 py-12 text-xs">
                    No active leaks, duplication, or warnings in current editor buffer.
                  </div>
                )}
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

          <div className="h-64 overflow-y-auto bg-black/60 rounded-xl p-4 font-mono text-[11px] leading-relaxed space-y-1.5 border border-white/5 select-text">
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
          <h3 className="font-extrabold text-sm text-red-500 uppercase tracking-widest flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 animate-pulse" />
            SECRET OPERATIONS CONSOLE (AUTHORIZED ONLY)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-mono">
            {/* Maintenance Mode */}
            <div className="p-4 bg-black/40 border border-red-500/20 rounded-xl space-y-3">
              <div className="font-bold text-white uppercase">Maintenance Mode Trigger</div>
              <p className="text-[10px] text-white/50">Restricts user operations, routing queries through mock pings only.</p>
              <button
                onClick={() => onMaintenanceToggle(!isMaintenanceActive)}
                className={`px-4 py-2 rounded-lg font-bold cursor-pointer transition-all ${
                  isMaintenanceActive ? 'bg-red-600 text-white' : 'border border-red-500/30 text-red-400 hover:bg-red-500/10'
                }`}
              >
                {isMaintenanceActive ? 'DISABLE MAINTENANCE' : 'ENABLE MAINTENANCE'}
              </button>
            </div>

            {/* Sentinel Watchdog */}
            <div className="p-4 bg-black/40 border border-red-500/20 rounded-xl space-y-3">
              <div className="font-bold text-white uppercase">Sentinel Telemetry Monitoring</div>
              <p className="text-[10px] text-white/50">Toggle active heap and hydration telemetry listeners.</p>
              <button
                onClick={onToggleSentinel}
                className={`px-4 py-2 rounded-lg font-bold cursor-pointer transition-all ${
                  enableSentinel ? 'bg-red-600 text-white' : 'border border-red-500/30 text-red-400 hover:bg-red-500/10'
                }`}
              >
                {enableSentinel ? 'DEACTIVATE WATCHDOG' : 'ACTIVATE WATCHDOG'}
              </button>
            </div>

            {/* Rollback Checkpoint Center */}
            <div className="p-4 bg-black/40 border border-red-500/20 rounded-xl space-y-3 col-span-1 md:col-span-2">
              <div className="font-bold text-white uppercase">Recovery Checkpoint Rollback</div>
              <p className="text-[10px] text-white/50">Select a database-indexed checkpoint to rollback changes across the file workspace.</p>
              
              <div className="flex gap-3 flex-wrap">
                <select
                  value={selectedCheckpointId}
                  onChange={(e) => setSelectedCheckpointId(e.target.value)}
                  className="bg-black border border-red-500/30 px-3 py-2 text-white rounded focus:outline-none focus:border-red-500 cursor-pointer flex-1"
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
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
