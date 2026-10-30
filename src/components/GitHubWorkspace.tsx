import React, { useState } from "react";
import {
  GitBranch,
  Folder,
  GitPullRequest,
  Code,
  CheckCircle,
} from "lucide-react";

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
  healthScore,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    "explorer" | "branches" | "pulls" | "commits"
  >("explorer");

  return (
    <div className="h-full flex flex-col vol-surface border vol-line rounded-2xl overflow-hidden">
      {/* Workspace Menu Selector */}
      <div className="vol-elev border-b vol-ring px-4 py-2 flex justify-between items-center flex-wrap gap-2 select-none">
        <div className="flex gap-2">
          {(
            [
              { id: "explorer", label: "Explorer", icon: Folder },
              { id: "branches", label: "Branches", icon: GitBranch },
              { id: "pulls", label: "Pull Requests", icon: GitPullRequest },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeSubTab === tab.id
                  ? "vol-acc-bg text-black"
                  : "vol-t2 hover:vol-t1 hover:vol-wash"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Repository health score telemetry */}
        <div className="flex items-center gap-2 vol-panel border vol-ring px-3 py-1 rounded-xl">
          <span className="text-[10px] vol-t2 uppercase font-black">
            REPO HEALTH:
          </span>
          <span
            className={`text-xs font-black ${
              healthScore > 80
                ? "text-green-400"
                : healthScore > 50
                  ? "text-yellow-500"
                  : "text-red-500"
            }`}
          >
            {healthScore}/100
          </span>
        </div>
      </div>

      {/* Explorer Panels */}
      <div className="flex-1 p-4 overflow-y-auto">
        {activeSubTab === "explorer" && (
          <div className="space-y-1">
            {files.map((f) => (
              <div
                key={f.path}
                onClick={() => onFileSelect(f.path)}
                className={`flex items-center justify-between px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                  selectedFilePath === f.path
                    ? "vol-acc-wash vol-ring-strong vol-t1 font-extrabold"
                    : "bg-transparent border-transparent vol-t1 hover:vol-wash"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Code className="w-4 h-4 vol-accent shrink-0" />
                  <span className="text-xs truncate">{f.path}</span>
                </div>
                {selectedFilePath === f.path && (
                  <CheckCircle className="w-4 h-4 vol-accent shrink-0" />
                )}
              </div>
            ))}
            {files.length === 0 && (
              <div className="text-center vol-t2 py-24 text-xs font-mono">
                No active files indexed. Verify branch and fetch connection
                settings.
              </div>
            )}
          </div>
        )}

        {activeSubTab === "branches" && (
          <div className="space-y-3 p-2 text-xs font-mono vol-t2">
            <div className="p-3 vol-panel border vol-line rounded-xl flex justify-between items-center">
              <div>
                <div className="font-bold vol-t1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  {branch}
                </div>
                <div className="text-[10px] vol-t2 mt-0.5">
                  Tracking origin/{branch}
                </div>
              </div>
              <span className="px-2 py-0.5 rounded vol-acc-wash vol-accent text-[9px] uppercase font-bold">
                Active
              </span>
            </div>

            <div className="p-3 vol-elev rounded-xl hover:vol-wash cursor-pointer flex justify-between items-center transition-colors">
              <div>
                <div className="font-semibold vol-t1">
                  feature/v6-enterprise-upgrade
                </div>
                <div className="text-[10px] vol-t2 mt-0.5">
                  Updated 4 hours ago
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === "pulls" && (
          <div className="text-center vol-t2 py-24 text-xs font-mono">
            No open pull requests recorded for {repoPath}.
          </div>
        )}
      </div>
    </div>
  );
};
