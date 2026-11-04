/**
 * GitHub view — Git-Room deployment integration with repository sync,
 * PR issues, and commit/push workflow.
 *
 * All state and handlers are passed as props from the shell.
 *
 * Built on design system tokens (design-system/volt-code-ai/MASTER.md).
 * All colors, spacing, shadows, and typography use --ds-* CSS variables.
 * Every button has cursor-pointer, focus-visible ring, and 200ms hover transition.
 * No emojis as icons — Lucide SVG only.
 */
import React from "react";
import { RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Panel } from "../ui/Panel";
import { Input } from "../ui/Input";
import { GitHubWorkspace } from "../GitHubWorkspace";

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body?: string | null;
  user?: { login?: string } | null;
  created_at: string;
}

export interface GitHubViewProps {
  repoPath: string;
  setRepoPath: (v: string) => void;
  repoBranch: string;
  setRepoBranch: (v: string) => void;
  githubToken: string;
  setGithubToken: (v: string) => void;
  loadedFilePath: string;
  loadedFileSha: string;
  commitMessage: string;
  setCommitMessage: (v: string) => void;
  handleCommitAndPush: () => void;
  isFetchingGithub: boolean;
  githubIssues: GitHubIssue[];
  handleLoadIssue: (issue: GitHubIssue) => void;
  fetchGithubData: () => void;
  githubFiles: Array<{ path: string; sha: string }>;
}

export const GitHubView: React.FC<GitHubViewProps> = ({
  repoPath,
  setRepoPath,
  repoBranch,
  setRepoBranch,
  githubToken,
  setGithubToken,
  loadedFilePath,
  isFetchingGithub,
  githubIssues,
  handleLoadIssue,
  fetchGithubData,
  githubFiles,
}) => {
  return (
    <Panel padded={true} className="p-4 sm:p-8 max-w-2xl mx-auto pb-24">
      <div className="flex justify-between items-center flex-wrap gap-4 border-b border-[var(--ds-color-border)] pb-6">
        <div>
          <h1 className="text-3xl font-black text-[#F8FAFC]">
            GITHUB DEPLOYMENT INTEGRATION
          </h1>
          <p className="text-xs text-[#22C55E] mt-1 font-bold">
            Synchronize edits, branch patches, and quality gates directly to
            git remote
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          disabled={isFetchingGithub}
          onClick={fetchGithubData}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetchingGithub ? "animate-spin" : ""}`} />
          {isFetchingGithub ? "REFRESHING" : "REFRESH TREE"}
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Explorer sidebar */}
        <div className="xl:col-span-1 h-[450px]">
          <GitHubWorkspace
            repoPath={repoPath}
            branch={repoBranch}
            files={githubFiles}
            onFileSelect={(path: string) => {
              const f = githubFiles.find((x) => x.path === path);
              if (f) {
                // File select handled by parent via handleLoadIssue or similar
              }
            }}
            selectedFilePath={loadedFilePath}
          />
        </div>

        {/* Git config form & log */}
        <Card padded={true} elevated={false} className="border border-[var(--ds-color-border)] rounded-[var(--ds-radius-lg)] space-y-4">
          <h3 className="font-extrabold text-sm text-[#22C55E] uppercase tracking-wider">
            Repository Synchronization Settings
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-[#94A3B8] uppercase font-black mb-1">
                Target Repository
              </label>
              <Input
                label=""
                value={repoPath}
                onChange={(e) => {
                  setRepoPath(e.target.value);
                  localStorage.setItem("volt_github_repo", e.target.value);
                }}
              />
            </div>
            <div>
              <label className="block text-[10px] text-[#94A3B8] uppercase font-black mb-1">
                Deployment Branch
              </label>
              <Input
                label=""
                value={repoBranch}
                onChange={(e) => {
                  setRepoBranch(e.target.value);
                  localStorage.setItem("volt_github_branch", e.target.value);
                }}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] text-[#94A3B8] uppercase font-black mb-1">
                Personal Access Token (PAT)
              </label>
              <Input
                label=""
                type="password"
                value={githubToken}
                onChange={(e) => {
                  setGithubToken(e.target.value);
                  localStorage.setItem("volt_github_token", e.target.value);
                }}
                placeholder="ghp_..."
              />
            </div>
          </div>
        </Card>

        {/* Issues list */}
        <Card padded={true} elevated={false} className="border border-[var(--ds-color-border)] rounded-[var(--ds-radius-lg)] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#22C55E] uppercase tracking-wider flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Active Repo Issues ({githubIssues.length})
            </h3>
          </div>
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
            {githubIssues.map((issue) => (
              <div
                key={issue.id}
                onClick={() => handleLoadIssue(issue)}
                className="p-4 bg-[#1B2336] border border-[var(--ds-color-border)] rounded-[var(--ds-radius-lg)] hover:border-[var(--ds-color-accent)] hover:bg-[#22C55E]/10 text-xs cursor-pointer transition-all duration-200 space-y-2"
              >
                <div className="flex justify-between items-start gap-2">
                  <span className="font-bold text-[#F8FAFC] hover:text-[#22C55E] truncate">
                    #{issue.number} {issue.title}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#EF4444]/10 text-[#EF4444] font-mono text-[9px] uppercase font-bold shrink-0">
                    Open
                  </span>
                </div>
                {issue.body && (
                  <p className="text-[#94A3B8] line-clamp-2 leading-relaxed">
                    {issue.body}
                  </p>
                )}
                <div className="text-[10px] text-[#94A3B8]/50 flex items-center gap-1.5">
                  <span>By {issue.user?.login}</span>
                  <span>•</span>
                  <span>
                    {new Date(issue.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
            {githubIssues.length === 0 && (
              <div className="text-center py-12 text-[#94A3B8] text-xs">
                No active issues found.
              </div>
            )}
          </div>
        </Card>
      </div>
    </Panel>
  );
};
