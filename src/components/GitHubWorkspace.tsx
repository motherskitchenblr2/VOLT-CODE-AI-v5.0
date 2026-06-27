import React, { useState } from 'react';
import { GitBranch, Folder, GitPullRequest, Code, CheckCircle, RefreshCw } from 'lucide-react';

interface GitHubWorkspaceProps {
  repoPath: string;
  branch: string;
  files: Array<{ path: string; sha: string }>;
  onFileSelect: (path: string) => void;
  selectedFilePath: string;
  healthScore: number;
}

export const GitHubWorkspace: React.FC<GitHubWorkspaceProps> = ({
  repoPath,
  branch,
  files,
  onFileSelect,
  selectedFilePath,
  healthScore
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'explorer' | 'branches' | 'pulls' | 'commits'>('explorer');

  return (
    <div className="h-full flex flex-col bg-[#0A0A0A] border border-white/5 rounded-2xl overflow-hidden">
      
      {/* Workspace Menu Selector */}
      <div className="bg-[#121212] border-b border-[#FF5F00]/25 px-4 py-2 flex justify-between items-center flex-wrap gap-2 select-none">
        <div className="flex gap-2">
          {([
            { id: 'explorer', label: 'Explorer', icon: Folder },
            { id: 'branches', label: 'Branches', icon: GitBranch },
            { id: 'pulls', label: 'Pull Requests', icon: GitPullRequest }
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeSubTab === tab.id 
                  ? 'bg-[#FF5F00] text-black' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Repository health score telemetry */}
        <div className="flex items-center gap-2 bg-black/40 border border-[#FF5F00]/20 px-3 py-1 rounded-xl">
          <span className="text-[10px] text-white/50 uppercase font-black">REPO HEALTH:</span>
          <span className={`text-xs font-black ${
            healthScore > 80 ? 'text-green-400' : healthScore > 50 ? 'text-yellow-500' : 'text-red-500'
          }`}>{healthScore}/100</span>
        </div>
      </div>

      {/* Explorer Panels */}
      <div className="flex-1 p-4 overflow-y-auto">
        {activeSubTab === 'explorer' && (
          <div className="space-y-1">
            {files.map(f => (
              <div
                key={f.path}
                onClick={() => onFileSelect(f.path)}
                className={`flex items-center justify-between px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                  selectedFilePath === f.path 
                    ? 'bg-[#FF5F00]/10 border-[#FF5F00] text-white font-extrabold'
                    : 'bg-transparent border-transparent text-white/70 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Code className="w-4 h-4 text-[#FF5F00] shrink-0" />
                  <span className="text-xs truncate">{f.path}</span>
                </div>
                {selectedFilePath === f.path && (
                  <CheckCircle className="w-4 h-4 text-[#FF5F00] shrink-0" />
                )}
              </div>
            ))}
            {files.length === 0 && (
              <div className="text-center text-white/20 py-24 text-xs font-mono">
                No active files indexed. Verify branch and fetch connection settings.
              </div>
            )}
          </div>
        )}

        {activeSubTab === 'branches' && (
          <div className="space-y-3 p-2 text-xs font-mono text-white/60">
            <div className="p-3 bg-black/40 border border-white/5 rounded-xl flex justify-between items-center">
              <div>
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  {branch}
                </div>
                <div className="text-[10px] text-white/40 mt-0.5">Tracking origin/{branch}</div>
              </div>
              <span className="px-2 py-0.5 rounded bg-[#FF5F00]/25 text-[#FF5F00] text-[9px] uppercase font-bold">Active</span>
            </div>
            
            <div className="p-3 bg-[#121212]/30 rounded-xl hover:bg-white/5 cursor-pointer flex justify-between items-center transition-colors">
              <div>
                <div className="font-semibold text-white/80">feature/v6-enterprise-upgrade</div>
                <div className="text-[10px] text-white/40 mt-0.5">Updated 4 hours ago</div>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'pulls' && (
          <div className="text-center text-white/20 py-24 text-xs font-mono">
            No open pull requests recorded for {repoPath}.
          </div>
        )}
      </div>

    </div>
  );
};
