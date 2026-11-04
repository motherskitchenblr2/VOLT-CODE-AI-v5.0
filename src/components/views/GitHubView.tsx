/**
 * GitHub view — Git-Room deployment integration with repository sync,
 * PR issues, and commit/push workflow.
 *
 * All state and handlers are passed as props from the shell.
 */
import React from "react";
import { GitBranch, RefreshCw, AlertCircle } from "lucide-react";
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
  loadedFileSha,
  commitMessage,
  setCommitMessage,
  handleCommitAndPush,
  isFetchingGithub,
  githubIssues,
  handleLoadIssue,
  fetchGithubData,
  githubFiles,
}) => {
  return (
    <div className="p-8 h-full overflow-y-auto space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4 border-b vol-ring pb-5">
        <div>
          <h1 className="text-3xl font-black vol-t1">
            GITHUB DEPLOYMENT INTEGRATION
          </h1>
          <p className="text-xs vol-accent mt-1 font-bold">
            Synchronize edits, branch patches, and quality gates directly to
            git remote
          </p>
        </div>
        <button
          onClick={fetchGithubData}
          disabled={isFetchingGithub}
          className="flex items-center gap-2 px-5 py-2.5 vol-well border vol-ring-strong vol-accent hover:vol-acc-bg hover:text-black font-extrabold text-xs uppercase rounded-xl transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isFetchingGithub ? "animate-spin" : ""}`}
          />
          {isFetchingGithub ? "REFRESHING" : "REFRESH TREE"}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Explorer sidebar */}
        <div className="xl:col-span-1 h-[450px]">
          <GitHubWorkspace
            repoPath={repoPath}
            branch={repoBranch}
            files={githubFiles}
            onFileSelect={(path) => {
              const f = githubFiles.find((x) => x.path === path);
              if (f) {
                // File select handled by parent via handleLoadIssue or similar
              }
            }}
            selectedFilePath={loadedFilePath}
          />
        </div>

        {/* Git config form & log */}
        <div className="xl:col-span-2 space-y-6">
          <div className="border vol-ring vol-panel rounded-2xl p-6 space-y-4">
            <h3 className="font-extrabold text-sm vol-accent uppercase tracking-wider">
              Repository Synchronization Settings
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] vol-t2 uppercase font-black mb-1">
                  Target Repository
                </label>
                <input
                  type="text"
                  value={repoPath}
                  onChange={(e) => {
                    setRepoPath(e.target.value);
                    localStorage.setItem("volt_github_repo", e.target.value);
                  }}
                  className="w-full vol-well border vol-line px-4 py-2.5 rounded-xl text-xs vol-t1 focus:outline-none focus:vol-ring-hi"
                />
              </div>
              <div>
                <label className="block text-[10px] vol-t2 uppercase font-black mb-1">
                  Deployment Branch
                </label>
                <input
                  type="text"
                  value={repoBranch}
                  onChange={(e) => {
                    setRepoBranch(e.target.value);
                    localStorage.setItem(
                      "volt_github_branch",
                      e.target.value,
                    );
                  }}
                  className="w-full vol-well border vol-line px-4 py-2.5 rounded-xl text-xs vol-t1 focus:outline-none focus:vol-ring-hi"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] vol-t2 uppercase font-black mb-1">
                  Personal Access Token (PAT)
                </label>
                <input
                  type="password"
                  value={githubToken}
                  onChange={(e) => {
                    setGithubToken(e.target.value);
                    localStorage.setItem(
                      "volt_github_token",
                      e.target.value,
                    );
                  }}
                  placeholder="ghp_..."
                  className="w-full vol-well border vol-line px-4 py-2.5 rounded-xl text-xs vol-t1 focus:outline-none focus:vol-ring-hi"
                />
              </div>
            </div>
          </div>

          {loadedFilePath && (
            <div className="border vol-line vol-elev p-6 rounded-2xl space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold vol-t1">
                  Staged File:{" "}
                  <span className="vol-accent">{loadedFilePath}</span>
                </span>
                <span className="vol-t2 text-[10px]">
                  SHA: {loadedFileSha.slice(0, 7)}
                </span>
              </div>
              <div>
                <label className="block text-[9px] vol-t2 uppercase font-black mb-1">
                  Commit Message
                </label>
                <input
                  type="text"
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  className="w-full vol-well border vol-line px-3 py-2.5 rounded-xl text-xs focus:outline-none focus:vol-ring-hi"
                />
              </div>
              <button
                onClick={handleCommitAndPush}
                disabled={isFetchingGithub || !loadedFilePath}
                className="px-5 py-3 vol-acc-bg text-black font-extrabold text-xs uppercase rounded-xl hover:vol-accbg-hi transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <GitBranch className="w-4 h-4" />
                PUSH COMMIT TO BRANCH
              </button>
            </div>
          )}

          {/* Issues list */}
          <div className="border vol-ring vol-panel rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-sm vol-accent uppercase tracking-wider flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Active Repo Issues ({githubIssues.length})
            </h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {githubIssues.map((issue) => (
                <div
                  key={issue.id}
                  onClick={() => handleLoadIssue(issue)}
                  className="p-4 vol-panel border vol-line hover:vol-ring-hi hover:vol-acc-wash rounded-xl cursor-pointer transition-all text-xs space-y-2"
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-bold vol-t1 hover:vol-accent truncate">
                      #{issue.number} {issue.title}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 font-mono text-[9px] uppercase font-bold shrink-0">
                      Open
                    </span>
                  </div>
                  {issue.body && (
                    <p className="vol-t2 line-clamp-2 leading-relaxed">
                      {issue.body}
                    </p>
                  )}
                  <div className="text-[10px] vol-accent-soft flex items-center gap-1.5">
                    <span>By {issue.user?.login}</span>
                    <span>•</span>
                    <span>
                      {new Date(issue.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
              {githubIssues.length === 0 && (
                <div className="text-center py-12 vol-t2 text-xs">
                  No active issues found.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
