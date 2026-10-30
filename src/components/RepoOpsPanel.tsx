import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  GitBranch,
  GitPullRequest,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Merge,
  Download,
  KeyRound,
} from "lucide-react";
import { GitHubManager } from "../services/GitHubManager";
import {
  PermissionSystem,
  type UserRole,
  type AuditLog,
} from "../services/PermissionSystem";

interface RepoOpsPanelProps {
  addLog?: (msg: string, level?: "info" | "success" | "error" | "warn") => void;
}

const ROLES: UserRole[] = ["owner", "boss", "agent", "guest"];

/**
 * Repo Ops — repo maintenance cockpit (mobile-first).
 * GitHubManager drives real repo operations (branches, PRs, merges);
 * PermissionSystem gates destructive actions and records the audit trail.
 */
export const RepoOpsPanel: React.FC<RepoOpsPanelProps> = ({ addLog }) => {
  const [owner, setOwner] = useState(() => {
    const saved = localStorage.getItem("volt_github_repo") || "";
    return saved.includes("/") ? saved.split("/")[0] : "";
  });
  const [repo, setRepo] = useState(() => {
    const saved = localStorage.getItem("volt_github_repo") || "";
    return saved.includes("/") ? saved.split("/")[1] : saved;
  });
  const [branch, setBranch] = useState(
    () => localStorage.getItem("volt_github_branch") || "main",
  );
  const [token, setToken] = useState(
    () => localStorage.getItem("volt_github_token") || "",
  );
  const [showConfig, setShowConfig] = useState(false);

  const [role, setRole] = useState<UserRole>("owner");
  const [log, setLog] = useState<
    Array<{ t: string; msg: string; status: string }>
  >([]);
  const [prs, setPrs] = useState<Record<string, unknown>[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const permissions = useMemo(() => new PermissionSystem(), []);
  const manager = useMemo(
    () =>
      owner && repo ? new GitHubManager({ owner, repo, token, branch }) : null,
    [owner, repo, token, branch],
  );

  // Register a local operator and set the active role
  useEffect(() => {
    permissions.registerUser("operator", "Operator", "owner");
    permissions.setCurrentUser("operator");
  }, [permissions]);

  const note = useCallback(
    (
      msg: string,
      status: "success" | "failed" | "unauthorized" = "success",
    ) => {
      setLog((prev) => [
        { t: new Date().toLocaleTimeString(), msg, status },
        ...prev.slice(0, 24),
      ]);
      addLog?.(`[REPO OPS] ${msg}`, status === "success" ? "success" : "error");
    },
    [addLog],
  );

  const changeRole = (next: UserRole) => {
    permissions.updateUserRole("operator", next);
    setRole(next);
    note(`Role switched to ${next.toUpperCase()}`);
  };

  const refreshPrs = useCallback(async () => {
    if (!manager) return note("Set owner/repo in config first.", "failed");
    setBusy("prs");
    try {
      const list = await manager.getOpenPullRequests();
      setPrs(list);
      note(`Loaded ${list.length} open PR(s)`);
    } catch (e) {
      note(
        `Failed to load PRs: ${e instanceof Error ? e.message : String(e)}`,
        "failed",
      );
    } finally {
      setBusy(null);
    }
  }, [manager, note]);

  const mergePr = async (prNumber: number) => {
    if (!manager) return;
    if (!permissions.canMergePR()) {
      return note(
        `Merge blocked for role ${role.toUpperCase()} (no merge_pr)`,
        "unauthorized",
      );
    }
    setBusy(`merge-${prNumber}`);
    try {
      await manager.mergePullRequest(prNumber);
      note(`Merged PR #${prNumber}`);
      await refreshPrs();
    } catch (e) {
      note(
        `Merge failed: ${e instanceof Error ? e.message : String(e)}`,
        "failed",
      );
    } finally {
      setBusy(null);
    }
  };

  const closePr = async (prNumber: number) => {
    if (!manager) return;
    setBusy(`close-${prNumber}`);
    try {
      await manager.closePullRequest(prNumber);
      note(`Closed PR #${prNumber}`);
      await refreshPrs();
    } catch (e) {
      note(
        `Close failed: ${e instanceof Error ? e.message : String(e)}`,
        "failed",
      );
    } finally {
      setBusy(null);
    }
  };

  const newBranch = async () => {
    if (!manager) return note("Set owner/repo first.", "failed");
    const name = `volt/fix-${Date.now().toString(36)}`;
    setBusy("branch");
    try {
      await manager.createBranch(name);
      note(`Branch created: ${name}`);
    } catch (e) {
      note(
        `Branch failed: ${e instanceof Error ? e.message : String(e)}`,
        "failed",
      );
    } finally {
      setBusy(null);
    }
  };

  const exportAudit = (format: "json" | "csv") => {
    const data = permissions.exportAuditLogs(format);
    const blob = new Blob([data], {
      type: format === "csv" ? "text/csv" : "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `volt-repo-audit.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    note(`Audit exported (${format.toUpperCase()})`);
  };

  const auditLogs: AuditLog[] = permissions.getAuditLogs();
  const canMerge = permissions.canMergePR();

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-black tracking-widest vol-t1">
            REPO OPS
          </h1>
          <p className="text-[11px] vol-accent-soft font-semibold">
            Maintain repos · review PRs · fix conflicts · audit every action
          </p>
        </div>
        <button
          onClick={() => setShowConfig((v) => !v)}
          className="px-3 py-2 rounded-xl border vol-ring vol-accent text-xs font-bold cursor-pointer hover:vol-wash"
        >
          {showConfig ? "HIDE CONFIG" : "REPO CONFIG"}
        </button>
      </div>

      {showConfig && (
        <div className="p-3 rounded-2xl vol-panel border vol-ring space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="owner"
              className="vol-well border vol-ring px-3 py-2 rounded-xl text-xs vol-t1 outline-none"
            />
            <input
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              placeholder="repo"
              className="vol-well border vol-ring px-3 py-2 rounded-xl text-xs vol-t1 outline-none"
            />
            <input
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="main"
              className="vol-well border vol-ring px-3 py-2 rounded-xl text-xs vol-t1 outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 vol-accent shrink-0" />
            <input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="github_pat_..."
              className="flex-1 vol-well border vol-ring px-3 py-2 rounded-xl text-xs font-mono vol-t1 outline-none"
            />
          </div>
          <button
            onClick={() => {
              localStorage.setItem("volt_github_repo", `${owner}/${repo}`);
              localStorage.setItem("volt_github_branch", branch);
              localStorage.setItem("volt_github_token", token);
              note("Repo config saved");
            }}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl vol-acc-bg text-black text-xs font-black cursor-pointer"
          >
            SAVE CONFIG
          </button>
        </div>
      )}

      {/* Permission strip */}
      <div className="p-3 rounded-2xl vol-panel border vol-ring flex flex-wrap items-center gap-2">
        <ShieldCheck className="w-4 h-4 vol-accent" />
        <span className="text-[10px] font-black tracking-wider vol-t2 uppercase">
          Acting as
        </span>
        {ROLES.map((r) => (
          <button
            key={r}
            onClick={() => changeRole(r)}
            className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase cursor-pointer ${
              role === r
                ? "vol-acc-bg text-black"
                : "vol-well vol-t2 hover:vol-accent"
            }`}
          >
            {r}
          </button>
        ))}
        <span
          className={`px-2 py-1 rounded text-[10px] font-black uppercase ${
            canMerge ? "bg-green-600 text-black" : "vol-acc-wash vol-accent"
          }`}
        >
          {canMerge ? "merge allowed" : "merge blocked"}
        </span>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={refreshPrs}
          disabled={busy === "prs"}
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl vol-well border vol-ring vol-accent text-xs font-bold cursor-pointer disabled:opacity-60"
        >
          <RefreshCw
            className={`w-4 h-4 ${busy === "prs" ? "animate-spin" : ""}`}
          />
          REFRESH PRs
        </button>
        <button
          onClick={newBranch}
          disabled={busy === "branch"}
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl vol-well border vol-ring vol-accent text-xs font-bold cursor-pointer disabled:opacity-60"
        >
          <GitBranch className="w-4 h-4" />
          NEW FIX BRANCH
        </button>
        <button
          onClick={() => exportAudit("csv")}
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl vol-well border vol-ring vol-accent text-xs font-bold cursor-pointer"
        >
          <Download className="w-4 h-4" />
          AUDIT CSV
        </button>
        <button
          onClick={() => exportAudit("json")}
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl vol-well border vol-ring vol-accent text-xs font-bold cursor-pointer"
        >
          <Download className="w-4 h-4" />
          AUDIT JSON
        </button>
      </div>

      {/* PR list */}
      <div className="space-y-2">
        {prs.length === 0 ? (
          <p className="text-xs vol-t2">
            No PRs loaded. Press REFRESH PRs with a configured repo + token.
          </p>
        ) : (
          prs.map((pr) => {
            const n = Number(pr.number);
            const title = String(pr.title || "(untitled)");
            const head = (pr.head as { ref?: string })?.ref || "?";
            const base = (pr.base as { ref?: string })?.ref || "main";
            return (
              <div
                key={n}
                className="p-3 rounded-2xl vol-panel border vol-ring flex flex-wrap items-center gap-2"
              >
                <GitPullRequest className="w-4 h-4 vol-accent shrink-0" />
                <span className="text-xs font-bold vol-t1 flex-1 min-w-[140px]">
                  #{n} {title}
                </span>
                <span className="text-[10px] font-mono vol-t2">
                  {head} → {base}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => mergePr(n)}
                    disabled={busy === `merge-${n}`}
                    className="flex items-center gap-1 px-2.5 py-2 rounded-lg vol-acc-bg text-black text-[10px] font-black cursor-pointer disabled:opacity-60"
                  >
                    <Merge className="w-3.5 h-3.5" /> MERGE
                  </button>
                  <button
                    onClick={() => closePr(n)}
                    disabled={busy === `close-${n}`}
                    className="flex items-center gap-1 px-2.5 py-2 rounded-lg vol-well border vol-ring vol-t2 text-[10px] font-black cursor-pointer disabled:opacity-60"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> CLOSE
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Activity + audit */}
      <div className="p-3 rounded-2xl vol-panel border vol-ring">
        <div className="text-[10px] font-black tracking-wider vol-t2 uppercase mb-2">
          Action log ({log.length}) · audit trail{" "}
          {auditLogs.length ? `(${auditLogs.length})` : ""}
        </div>
        <div className="space-y-1 max-h-56 overflow-y-auto">
          {log.length === 0 && (
            <p className="text-xs vol-t2">No actions yet.</p>
          )}
          {log.map((l, i) => (
            <div key={i} className="text-[11px] font-mono flex gap-2">
              <span className="vol-t2">{l.t}</span>
              <span
                className={
                  l.status === "success"
                    ? "text-green-600"
                    : l.status === "unauthorized"
                      ? "vol-accent"
                      : "text-red-500"
                }
              >
                [{l.status}]
              </span>
              <span className="vol-t1">{l.msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
