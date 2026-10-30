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
  ShieldAlert,
  Split,
  Users,
  Send,
  Search,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { GitHubManager } from "../services/GitHubManager";
import {
  PermissionSystem,
  type UserRole,
  type AuditLog,
  type Permission,
  type RepoPolicy,
} from "../services/PermissionSystem";
import {
  reviewPullRequest,
  reviewMarkdown,
  lessonMarkdown,
  type PRFile,
  type ReviewReport,
} from "../lib/repoAgent";
import { scanWorkflow, summarize, type ScanFinding } from "../lib/injectionScan";
import {
  findConflictCandidates,
  merge3,
  type MergeOutcome,
} from "../lib/conflictResolver";

interface RepoOpsPanelProps {
  addLog?: (msg: string, level?: "info" | "success" | "error" | "warn") => void;
}

const ROLES: UserRole[] = ["owner", "boss", "agent", "guest"];

const TABS = [
  { id: "prs", label: "PR REVIEW", icon: GitPullRequest },
  { id: "conflicts", label: "CONFLICTS", icon: Split },
  { id: "security", label: "SECURITY", icon: ShieldAlert },
  { id: "team", label: "TEAM", icon: Users },
] as const;
type TabId = (typeof TABS)[number]["id"];

const ALL_PERMISSIONS: Permission[] = [
  "view_code",
  "edit_code",
  "create_pr",
  "approve_pr",
  "merge_pr",
  "view_meetings",
  "create_meetings",
  "view_audit_log",
  "manage_permissions",
];

// 40px+ touch targets on every control (mobile requirement).
const BTN =
  "min-h-[44px] px-3 py-2 rounded-xl border vol-ring text-xs font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2";
const BTN_GHOST = `${BTN} vol-well vol-accent hover:vol-wash`;
const BTN_PRIMARY = `${BTN} vol-acc-bg text-black border-transparent`;
const INPUT =
  "min-h-[44px] vol-well border vol-ring px-3 py-2 rounded-xl text-xs vol-t1 outline-none";

interface Ops {
  manager: GitHubManager | null;
  repoKey: string;
  role: UserRole;
  can: (permission: Permission) => boolean;
  note: (msg: string, status?: "success" | "failed" | "unauthorized") => void;
}

const Panel: React.FC<{ title: string; hint?: string; children: React.ReactNode }> = ({
  title,
  hint,
  children,
}) => (
  <div className="p-3 rounded-2xl vol-panel border vol-ring space-y-2">
    <div>
      <div className="text-[10px] font-black tracking-wider vol-t2 uppercase">{title}</div>
      {hint && <p className="text-[11px] vol-t2">{hint}</p>}
    </div>
    {children}
  </div>
);

const severityColor = (severity: string) =>
  severity === "critical" || severity === "block"
    ? "text-red-500"
    : severity === "high" || severity === "warn"
      ? "vol-accent"
      : "vol-t2";

/* ------------------------------------------------------------------ */
/* PR review                                                           */
/* ------------------------------------------------------------------ */

const PRTab: React.FC<{
  ops: Ops;
  prs: Record<string, unknown>[];
  busy: string | null;
  onRefresh: () => void;
  setBusy: (v: string | null) => void;
  lessons: string[];
  addLesson: (text: string) => void;
}> = ({ ops, prs, busy, onRefresh, setBusy, lessons, addLesson }) => {
  const [reports, setReports] = useState<Record<number, ReviewReport>>({});
  const [pendingClose, setPendingClose] = useState<{ n: number; title: string } | null>(null);
  const [reason, setReason] = useState("");
  const { manager, can, note } = ops;

  const loadFiles = async (n: number): Promise<PRFile[]> => {
    if (!manager) throw new Error("Set owner/repo in config first.");
    const raw = await manager.getPullRequestFiles(n);
    return raw.map((f) => ({
      filename: String(f.filename || ""),
      status: String(f.status || "modified"),
      additions: Number(f.additions || 0),
      deletions: Number(f.deletions || 0),
      patch: typeof f.patch === "string" ? f.patch : "",
    }));
  };

  const review = async (n: number) => {
    setBusy(`review-${n}`);
    try {
      const report = reviewPullRequest(await loadFiles(n));
      setReports((prev) => ({ ...prev, [n]: report }));
      note(
        `Reviewed PR #${n}: ${report.blocks} blocking, ${report.warns} warning → ${report.verdict.toUpperCase()}`,
        report.blocks ? "failed" : "success",
      );
    } catch (e) {
      note(`Review failed: ${e instanceof Error ? e.message : String(e)}`, "failed");
    } finally {
      setBusy(null);
    }
  };

  const postReview = async (n: number) => {
    if (!manager) return;
    const report = reports[n];
    if (!report) return note("Run REVIEW first.", "failed");
    if (!can("approve_pr")) return note(`Role ${ops.role.toUpperCase()} cannot post reviews (approve_pr)`, "unauthorized");
    setBusy(`post-${n}`);
    try {
      const event =
        report.verdict === "request_changes"
          ? "REQUEST_CHANGES"
          : report.verdict === "approve"
            ? "APPROVE"
            : "COMMENT";
      const posted = await manager.createReview(n, event, reviewMarkdown(report));
      note(`Posted ${event} review on PR #${n}${posted.html_url ? ` — ${posted.html_url}` : ""}`);
    } catch (e) {
      note(`Posting review failed: ${e instanceof Error ? e.message : String(e)}`, "failed");
    } finally {
      setBusy(null);
    }
  };

  const closeWithLesson = async () => {
    if (!manager || !pendingClose) return;
    const { n, title } = pendingClose;
    if (!can("create_pr")) {
      return note(`Role ${ops.role.toUpperCase()} cannot record lessons (create_pr)`, "unauthorized");
    }
    setBusy(`close-${n}`);
    try {
      const lesson = lessonMarkdown({ prNumber: n, title, reason });
      await manager.closePullRequest(n);
      addLesson(lesson);

      // Lesson travels through the normal flow: branch → commit → PR.
      const existing = await manager.getFileContent("AGENT_LESSONS.md", managerBranch(manager));
      const branch = `volt/lesson-pr-${n}-${Date.now().toString(36)}`;
      await manager.createBranch(branch);
      await manager.commitFiles(
        branch,
        [{ path: "AGENT_LESSONS.md", content: (existing?.content || "# Agent Lessons\n") + lesson }],
        { message: `learn: PR #${n} rejection` },
      );
      const pr = await manager.createPullRequest(
        branch,
        `learn: lesson from rejected PR #${n}`,
        `Records why PR #${n} ("${title}") was rejected.\n\n${lesson}`,
      );
      note(`PR #${n} closed, lesson PR #${pr.prNumber} opened`);
      setPendingClose(null);
      setReason("");
      onRefresh();
    } catch (e) {
      note(`Close failed: ${e instanceof Error ? e.message : String(e)}`, "failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <button onClick={onRefresh} disabled={busy === "prs"} className={BTN_GHOST}>
          <RefreshCw className={`w-4 h-4 ${busy === "prs" ? "animate-spin" : ""}`} />
          REFRESH PRs
        </button>
        <span className="text-[11px] vol-t2 self-center">
          Review runs locally: secrets, workflow injection, debug leftovers, tests, lockfile.
        </span>
      </div>

      <div className="space-y-2">
        {prs.length === 0 ? (
          <p className="text-xs vol-t2">No PRs loaded. Press REFRESH PRs with repo + token set.</p>
        ) : (
          prs.map((pr) => {
            const n = Number(pr.number);
            const title = String(pr.title || "(untitled)");
            const head = (pr.head as { ref?: string })?.ref || "?";
            const base = (pr.base as { ref?: string })?.ref || "main";
            const report = reports[n];
            return (
              <div key={n} className="p-3 rounded-2xl vol-panel border vol-ring space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <GitPullRequest className="w-4 h-4 vol-accent shrink-0" />
                  <span className="text-xs font-bold vol-t1 flex-1 min-w-[140px]">
                    #{n} {title}
                  </span>
                  <span className="text-[10px] font-mono vol-t2">
                    {head} → {base}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button onClick={() => review(n)} disabled={busy === `review-${n}`} className={BTN_GHOST}>
                    <Search className="w-4 h-4" /> REVIEW
                  </button>
                  <button
                    onClick={() => postReview(n)}
                    disabled={!report || busy === `post-${n}`}
                    className={BTN_PRIMARY}
                  >
                    <Send className="w-4 h-4" /> POST TO GITHUB
                  </button>
                  <button
                    onClick={() => setPendingClose({ n, title })}
                    disabled={busy === `close-${n}`}
                    className={`${BTN_GHOST} vol-t2`}
                  >
                    <Trash2 className="w-4 h-4" /> REJECT
                  </button>
                  <button
                    onClick={async () => {
                      if (!manager) return;
                      if (!can("merge_pr")) {
                        return note(`Merge blocked for role ${ops.role.toUpperCase()} (merge_pr)`, "unauthorized");
                      }
                      setBusy(`merge-${n}`);
                      try {
                        await manager.mergePullRequest(n, undefined, undefined, true);
                        note(`Merged PR #${n} (squash)`);
                        onRefresh();
                      } catch (e) {
                        note(`Merge failed: ${e instanceof Error ? e.message : String(e)}`, "failed");
                      } finally {
                        setBusy(null);
                      }
                    }}
                    disabled={busy === `merge-${n}`}
                    className={BTN_PRIMARY}
                  >
                    <Merge className="w-4 h-4" /> MERGE
                  </button>
                </div>

                {pendingClose?.n === n && (
                  <div className="p-2 rounded-xl vol-well border vol-ring space-y-2">
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Why is this PR rejected? (becomes a lesson)"
                      rows={3}
                      className="w-full vol-well border vol-ring p-2 rounded-xl text-xs vol-t1 outline-none"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button onClick={closeWithLesson} disabled={busy === `close-${n}`} className={BTN_PRIMARY}>
                        <CheckCircle2 className="w-4 h-4" /> CLOSE + RECORD LESSON
                      </button>
                      <button onClick={() => setPendingClose(null)} className={BTN_GHOST}>
                        CANCEL
                      </button>
                    </div>
                  </div>
                )}

                {report && (
                  <div className="p-2 rounded-xl vol-well border vol-ring space-y-1">
                    <div className="text-[10px] font-black uppercase vol-t2">
                      {report.verdict.replace("_", " ")} · {report.blocks} blocking · {report.warns} warning ·{" "}
                      {report.filesReviewed} file(s)
                    </div>
                    {report.findings.length === 0 && (
                      <p className="text-[11px] text-green-600 font-semibold">No issues found.</p>
                    )}
                    {report.findings.map((f, i) => (
                      <div key={i} className="text-[11px] leading-snug">
                        <span className={`font-black uppercase ${severityColor(f.severity)}`}>
                          [{f.severity}]
                        </span>{" "}
                        <span className="font-mono vol-t2">{f.file}</span>{" "}
                        <span className="vol-t1">{f.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <Panel title={`Lesson log (${lessons.length})`} hint="Rejected PRs. Each one is also committed through a lesson PR.">
        <div className="max-h-48 overflow-y-auto space-y-1">
          {lessons.length === 0 && <p className="text-[11px] vol-t2">No lessons recorded yet.</p>}
          {lessons.map((l, i) => (
            <pre key={i} className="text-[10px] font-mono vol-t2 whitespace-pre-wrap">
              {l.trim()}
            </pre>
          ))}
        </div>
      </Panel>
    </>
  );
};

const managerBranch = (manager: GitHubManager | null) => manager?.branchName || "main";

/* ------------------------------------------------------------------ */
/* Conflicts                                                           */
/* ------------------------------------------------------------------ */

const ConflictTab: React.FC<{ ops: Ops }> = ({ ops }) => {
  const [prNumber, setPrNumber] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [outcomes, setOutcomes] = useState<MergeOutcome[] | null>(null);
  const [headRef, setHeadRef] = useState("");
  const { manager, can, note } = ops;

  const run = useCallback(async () => {
    if (!manager) return note("Set owner/repo in config first.", "failed");
    const n = Number(prNumber);
    if (!Number.isInteger(n) || n <= 0) return note("Enter a PR number.", "failed");
    setBusyKey("scan");
    setOutcomes(null);
    try {
      const pr = await manager.getPullRequest(n);
      const head = pr.head as { ref?: string; repo?: { full_name?: string } } | undefined;
      const base = pr.base as { ref?: string } | undefined;
      const headName = head?.ref || "";
      setHeadRef(headName);

      if (pr.mergeable !== false) {
        note(`PR #${n} has no merge conflict (mergeable: ${String(pr.mergeable)}).`);
        return;
      }
      const repoFull = `${ops.repoKey}`;
      if (head?.repo?.full_name && head.repo.full_name !== repoFull) {
        return note(
          `PR #${n} comes from fork ${head.repo.full_name}. Committing to a fork branch is not supported.`,
          "failed",
        );
      }

      const prSide = await manager.getCompare(String(base?.ref || "main"), headName);
      const targetSide = await manager.getCompare(prSide.mergeBase || "", String(base?.ref || "main"));
      const candidates = findConflictCandidates(
        prSide.files.map((f) => f.filename),
        targetSide.files.map((f) => f.filename),
      );
      if (candidates.length === 0) {
        return note(`PR #${n} is not mergeable but no overlapping file was found. Resolve manually on GitHub.`, "failed");
      }

      // Cap the work: a conflict across 40 files is a human job.
      const slice = candidates.slice(0, 10);
      const resolved: MergeOutcome[] = [];
      for (const path of slice) {
        const [baseFile, ours, theirs] = await Promise.all([
          prSide.mergeBase ? manager.getFileContent(path, prSide.mergeBase) : Promise.resolve(null),
          manager.getFileContent(path, String(base?.ref || "main")),
          manager.getFileContent(path, headName),
        ]);
        resolved.push(
          merge3({
            path,
            base: baseFile?.content ?? null,
            ours: ours?.content ?? null,
            theirs: theirs?.content ?? null,
          }),
        );
      }
      setOutcomes(resolved);
      const auto = resolved.filter((o) => o.status === "auto" || o.status === "identical").length;
      note(
        `PR #${n}: ${candidates.length} candidate file(s), ${auto} auto-resolvable, ${resolved.length - auto} need a human.`,
        auto > 0 ? "success" : "failed",
      );
    } catch (e) {
      note(`Conflict scan failed: ${e instanceof Error ? e.message : String(e)}`, "failed");
    } finally {
      setBusyKey(null);
    }
  }, [manager, note, prNumber, ops.repoKey]);

  const apply = async () => {
    if (!manager || !outcomes) return;
    if (!can("edit_code")) return note(`Role ${ops.role.toUpperCase()} cannot write branches (edit_code)`, "unauthorized");
    const files = outcomes.filter((o) => o.status === "auto" || o.status === "identical");
    if (files.length === 0) return note("No auto-resolvable file to apply.", "failed");
    setBusyKey("apply");
    try {
      await manager.commitFiles(
        headRef,
        files.map((f) => ({ path: f.path, content: f.content ?? "" })),
        { message: `fix: auto-resolve merge conflicts (${files.length} file(s))` },
      );
      const pr = await manager.getPullRequest(Number(prNumber));
      note(
        `Pushed ${files.length} resolved file(s) to ${headRef}. PR now mergeable: ${String(pr.mergeable)}`,
        pr.mergeable ? "success" : "failed",
      );
    } catch (e) {
      note(`Applying fixes failed: ${e instanceof Error ? e.message : String(e)}`, "failed");
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <>
      <Panel
        title="Conflict fixer"
        hint="Detects conflicting files from GitHub, then auto-merges only the files where one side did not change. Anything else is listed for a human."
      >
        <div className="flex flex-wrap gap-2">
          <input
            value={prNumber}
            onChange={(e) => setPrNumber(e.target.value)}
            placeholder="PR number"
            inputMode="numeric"
            className={`${INPUT} flex-1 min-w-[120px]`}
          />
          <button onClick={run} disabled={busyKey === "scan"} className={BTN_GHOST}>
            <Search className="w-4 h-4" /> FIND CONFLICTS
          </button>
          <button onClick={apply} disabled={!outcomes || busyKey === "apply"} className={BTN_PRIMARY}>
            <CheckCircle2 className="w-4 h-4" /> APPLY AUTO FIXES
          </button>
        </div>
      </Panel>

      {outcomes && (
        <Panel title={`Result (${outcomes.length} candidate file(s))`}>
          {outcomes.map((o) => (
            <div key={o.path} className="text-[11px] leading-snug flex flex-wrap gap-2">
              <span
                className={`font-black uppercase ${
                  o.status === "auto" || o.status === "identical"
                    ? "text-green-600"
                    : o.status === "manual"
                      ? "vol-accent"
                      : "vol-t2"
                }`}
              >
                [{o.status}]
              </span>
              <span className="font-mono vol-t1">{o.path}</span>
              <span className="vol-t2">{o.reason}</span>
            </div>
          ))}
        </Panel>
      )}
    </>
  );
};

/* ------------------------------------------------------------------ */
/* Security sweep                                                      */
/* ------------------------------------------------------------------ */

interface RepoSweep {
  repo: string;
  verdict: string;
  findings: ScanFinding[];
}

const SecurityTab: React.FC<{ ops: Ops; token: string }> = ({ ops, token }) => {
  const [findings, setFindings] = useState<ScanFinding[] | null>(null);
  const [sweeps, setSweeps] = useState<RepoSweep[] | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const { manager, note, role, can } = ops;

  const scanOne = async () => {
    if (!manager) return note("Set owner/repo in config first.", "failed");
    setBusyKey("one");
    try {
      const workflows = await manager.getWorkflows(managerBranch(manager));
      const found = workflows.flatMap((w) => scanWorkflow(w.path, w.content));
      setFindings(found);
      const s = summarize(found);
      note(
        `Scanned ${workflows.length} workflow(s): ${s.critical} critical, ${s.high} high, ${s.medium} medium → ${s.verdict.toUpperCase()}`,
        s.critical ? "failed" : "success",
      );
    } catch (e) {
      note(`Sweep failed: ${e instanceof Error ? e.message : String(e)}`, "failed");
    } finally {
      setBusyKey(null);
    }
  };

  const scanAll = async () => {
    if (!token) return note("A GitHub token is needed to list repos.", "failed");
    setBusyKey("all");
    try {
      const [ownerName] = ops.repoKey.split("/");
      const repos = await GitHubManager.listRepos(token, ownerName);
      if (repos.length === 0) return note(`No repo visible for ${ownerName}.`, "failed");
      const target = repos.slice(0, 15);
      const results: RepoSweep[] = [];
      for (const repo of target) {
        const [owner, name] = repo.full_name.split("/");
        const m = new GitHubManager({ owner, repo: name, token, branch: repo.default_branch });
        const workflows = await m.getWorkflows(repo.default_branch);
        const found = workflows.flatMap((w) =>
          scanWorkflow(`${repo.full_name}/${w.path}`, w.content),
        );
        results.push({
          repo: repo.full_name,
          verdict: summarize(found).verdict,
          findings: found,
        });
      }
      setSweeps(results);
      const failing = results.filter((r) => r.verdict === "fail").length;
      note(
        `Swept ${results.length} repo(s)${repos.length > target.length ? ` (first 15 of ${repos.length})` : ""}: ${failing} with critical findings.`,
        failing ? "failed" : "success",
      );
    } catch (e) {
      note(`Multi-repo sweep failed: ${e instanceof Error ? e.message : String(e)}`, "failed");
    } finally {
      setBusyKey(null);
    }
  };

  const exportFindings = () => {
    const payload = sweeps
      ? sweeps.flatMap((s) => s.findings)
      : findings || [];
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "findings.json";
    a.click();
    URL.revokeObjectURL(url);
    note(`Exported ${payload.length} finding(s) to findings.json`);
  };

  const all = sweeps ? sweeps.flatMap((s) => s.findings) : findings || [];
  const totals = summarize(all);
  const canScan = can("view_code");

  return (
    <>
      <Panel
        title="Workflow injection sweep"
        hint="Checks CI workflows for pwn-request checkout, untrusted text in run:, unpinned actions, write-all tokens, curl | sh, secret echo."
      >
        <div className="flex flex-wrap gap-2">
          <button onClick={scanOne} disabled={!canScan || busyKey === "one"} className={BTN_GHOST}>
            <ShieldAlert className="w-4 h-4" /> SWEEP THIS REPO
          </button>
          <button onClick={scanAll} disabled={!canScan || busyKey === "all"} className={BTN_GHOST}>
            <Search className="w-4 h-4" /> SWEEP ALL MY REPOS
          </button>
          <button onClick={exportFindings} disabled={all.length === 0} className={BTN_PRIMARY}>
            <Download className="w-4 h-4" /> findings.json
          </button>
          <span className="text-[11px] vol-t2 self-center">
            Role {role.toUpperCase()} · {canScan ? "scan allowed" : "scan blocked (view_code)"}
          </span>
        </div>
      </Panel>

      {sweeps && (
        <Panel title={`Repos swept (${sweeps.length})`}>
          {sweeps.map((s) => (
            <div key={s.repo} className="text-[11px] flex flex-wrap gap-2">
              <span
                className={`font-black uppercase ${
                  s.verdict === "fail" ? "text-red-500" : s.verdict === "review" ? "vol-accent" : "text-green-600"
                }`}
              >
                [{s.verdict}]
              </span>
              <span className="font-mono vol-t1">{s.repo}</span>
              <span className="vol-t2">{s.findings.length} finding(s)</span>
            </div>
          ))}
        </Panel>
      )}

      {all.length > 0 && (
        <Panel
          title={`Findings (${totals.total})`}
          hint={`${totals.critical} critical · ${totals.high} high · ${totals.medium} medium · ${totals.low} low`}
        >
          <div className="max-h-72 overflow-y-auto space-y-1">
            {all.map((f, i) => (
              <div key={i} className="text-[11px] leading-snug">
                <span className={`font-black uppercase ${severityColor(f.severity)}`}>[{f.severity}]</span>{" "}
                <span className="font-mono vol-t2">
                  {f.file}
                  {f.line ? `:${f.line}` : ""}
                </span>{" "}
                <span className="vol-t1">{f.message}</span>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </>
  );
};

/* ------------------------------------------------------------------ */
/* Team + per-repo permissions                                         */
/* ------------------------------------------------------------------ */

const TeamTab: React.FC<{ ops: Ops; permissions: PermissionSystem }> = ({ ops, permissions }) => {
  const [policy, setPolicy] = useState<RepoPolicy>(() => permissions.getRepoPolicy(ops.repoKey));
  const [editRole, setEditRole] = useState<UserRole>("agent");
  const [name, setName] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("agent");
  const { note, can, repoKey, role } = ops;

  const toggle = (permission: Permission) => {
    const current = policy.roles[editRole] || [];
    const next = current.includes(permission)
      ? current.filter((p) => p !== permission)
      : [...current, permission];
    setPolicy({ ...policy, roles: { ...policy.roles, [editRole]: next } });
  };

  const save = () => {
    if (!can("manage_permissions")) {
      return note(`Role ${role.toUpperCase()} cannot change permissions (manage_permissions)`, "unauthorized");
    }
    try {
      const saved = permissions.saveRepoPolicy(repoKey, policy);
      setPolicy(saved);
      note(`Saved team + permissions for ${repoKey}`);
    } catch (e) {
      note(`Save failed: ${e instanceof Error ? e.message : String(e)}`, "failed");
    }
  };

  return (
    <>
      <Panel title={`Team for ${repoKey}`} hint="Members assigned to this repo. Roles decide what the cockpit lets them do.">
        <div className="flex flex-wrap gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="agent name"
            className={`${INPUT} flex-1 min-w-[140px]`}
          />
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as UserRole)}
            className={INPUT}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              if (!name.trim()) return note("Enter a member name.", "failed");
              setPolicy({
                ...policy,
                members: [
                  ...policy.members,
                  { id: `${name.trim().toLowerCase().replace(/\s+/g, "-")}-${Date.now().toString(36)}`, name: name.trim(), role: newRole },
                ],
              });
              setName("");
            }}
            className={BTN_GHOST}
          >
            <Users className="w-4 h-4" /> ADD
          </button>
        </div>
        <div className="space-y-1">
          {policy.members.length === 0 && <p className="text-[11px] vol-t2">No member yet.</p>}
          {policy.members.map((m) => (
            <div key={m.id} className="flex flex-wrap items-center gap-2 text-[11px]">
              <span className="vol-t1 font-bold flex-1 min-w-[120px]">{m.name}</span>
              <span className="vol-accent font-black uppercase">{m.role}</span>
              <button
                onClick={() => setPolicy({ ...policy, members: policy.members.filter((x) => x.id !== m.id) })}
                className="min-h-[40px] px-2 rounded-lg vol-well border vol-ring vol-t2 cursor-pointer"
                aria-label={`Remove ${m.name}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Role permissions for this repo" hint="Click to toggle. Saving applies to the cockpit gating for this repo only.">
        <div className="flex flex-wrap gap-2 mb-2">
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => setEditRole(r)}
              className={`px-3 py-2 min-h-[44px] rounded-lg text-[10px] font-black uppercase cursor-pointer ${
                editRole === r ? "vol-acc-bg text-black" : "vol-well vol-t2 border vol-ring"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
          {ALL_PERMISSIONS.map((p) => {
            const on = (policy.roles[editRole] || []).includes(p);
            return (
              <button
                key={p}
                onClick={() => toggle(p)}
                className={`min-h-[40px] px-3 rounded-lg border vol-ring text-[11px] font-bold text-left cursor-pointer ${
                  on ? "vol-acc-bg text-black" : "vol-well vol-t2"
                }`}
                aria-pressed={on}
              >
                {on ? "✓ " : "— "}
                {p}
              </button>
            );
          })}
        </div>
        <button onClick={save} className={`${BTN_PRIMARY} mt-2`}>
          <CheckCircle2 className="w-4 h-4" /> SAVE FOR {repoKey}
        </button>
      </Panel>
    </>
  );
};

/* ------------------------------------------------------------------ */
/* Shell                                                               */
/* ------------------------------------------------------------------ */

/**
 * Repo Ops — repo maintenance cockpit (mobile-first).
 * GitHubManager drives real repo operations; PermissionSystem gates them and
 * keeps the audit trail. Tabs: PR review, conflicts, security sweep, team.
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
  const [branch, setBranch] = useState(() => localStorage.getItem("volt_github_branch") || "main");
  const [token, setToken] = useState(() => localStorage.getItem("volt_github_token") || "");
  const [showConfig, setShowConfig] = useState(false);

  const [role, setRole] = useState<UserRole>("owner");
  const [tab, setTab] = useState<TabId>("prs");
  const [log, setLog] = useState<Array<{ t: string; msg: string; status: string }>>([]);
  const [prs, setPrs] = useState<Record<string, unknown>[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [lessons, setLessons] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("volt_agent_lessons") || "[]") as string[];
    } catch {
      return [];
    }
  });

  const permissions = useMemo(() => new PermissionSystem(), []);
  const manager = useMemo(
    () => (owner && repo ? new GitHubManager({ owner, repo, token, branch }) : null),
    [owner, repo, token, branch],
  );
  const repoKey = owner && repo ? `${owner}/${repo}` : "";

  // "Acting as" = pick an identity. Registering one user per role avoids the
  // owner-only updateUserRole() path (which would throw while acting as a guest).
  useEffect(() => {
    (["owner", "boss", "agent", "guest"] as UserRole[]).forEach((r) => {
      permissions.registerUser(`act-${r}`, `Operator (${r})`, r);
    });
    permissions.setCurrentUser("act-owner");
  }, [permissions]);

  const note = useCallback(
    (msg: string, status: "success" | "failed" | "unauthorized" = "success") => {
      setLog((prev) => [{ t: new Date().toLocaleTimeString(), msg, status }, ...prev.slice(0, 24)]);
      addLog?.(`[REPO OPS] ${msg}`, status === "success" ? "success" : "error");
    },
    [addLog],
  );

  // Gate on the role + repo policy, not PermissionSystem.currentUser: the
  // current user is set in an effect and would leave the strip stuck at the
  // first render's answer ("merge blocked" while acting as owner).
  const can = useCallback(
    (permission: Permission) =>
      permissions.effectivePermissions(repoKey, role).includes(permission),
    [permissions, repoKey, role],
  );

  const ops: Ops = { manager, repoKey, role, can, note };

  const addLesson = (text: string) => {
    setLessons((prev) => {
      const next = [text, ...prev].slice(0, 20);
      localStorage.setItem("volt_agent_lessons", JSON.stringify(next));
      return next;
    });
  };

  const changeRole = (next: UserRole) => {
    permissions.setCurrentUser(`act-${next}`);
    setRole(next);
    note(`Acting as ${next.toUpperCase()}`);
  };

  const refreshPrs = useCallback(async () => {
    if (!manager) return note("Set owner/repo in config first.", "failed");
    setBusy("prs");
    try {
      const list = await manager.getOpenPullRequests();
      setPrs(list);
      note(`Loaded ${list.length} open PR(s)`);
    } catch (e) {
      note(`Failed to load PRs: ${e instanceof Error ? e.message : String(e)}`, "failed");
    } finally {
      setBusy(null);
    }
  }, [manager, note]);

  const newBranch = async () => {
    if (!manager) return note("Set owner/repo first.", "failed");
    if (!can("create_pr")) return note(`Role ${role.toUpperCase()} cannot create branches (create_pr)`, "unauthorized");
    const name = `volt/fix-${Date.now().toString(36)}`;
    setBusy("branch");
    try {
      await manager.createBranch(name);
      note(`Branch created: ${name}`);
    } catch (e) {
      note(`Branch failed: ${e instanceof Error ? e.message : String(e)}`, "failed");
    } finally {
      setBusy(null);
    }
  };

  const exportAudit = (format: "json" | "csv") => {
    if (!can("view_audit_log")) {
      return note(`Role ${role.toUpperCase()} cannot read the audit log`, "unauthorized");
    }
    const data = permissions.exportAuditLogs(format);
    const blob = new Blob([data], { type: format === "csv" ? "text/csv" : "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `volt-repo-audit.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    note(`Audit exported (${format.toUpperCase()})`);
  };

  const auditLogs: AuditLog[] = can("view_audit_log") ? permissions.getAuditLogs() : [];
  const canMerge = can("merge_pr");

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-black tracking-widest vol-t1">REPO OPS</h1>
          <p className="text-[11px] vol-accent-soft font-semibold">
            Review PRs · fix conflicts · sweep workflows · set the team
          </p>
        </div>
        <button onClick={() => setShowConfig((v) => !v)} className={BTN_GHOST}>
          {showConfig ? "HIDE CONFIG" : "REPO CONFIG"}
        </button>
      </div>

      {showConfig && (
        <div className="p-3 rounded-2xl vol-panel border vol-ring space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="owner" className={INPUT} />
            <input value={repo} onChange={(e) => setRepo(e.target.value)} placeholder="repo" className={INPUT} />
            <input value={branch} onChange={(e) => setBranch(e.target.value)} placeholder="main" className={INPUT} />
          </div>
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 vol-accent shrink-0" />
            <input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="github_pat_..."
              className={`${INPUT} flex-1 font-mono`}
              type="password"
            />
          </div>
          <button
            onClick={() => {
              localStorage.setItem("volt_github_repo", `${owner}/${repo}`);
              localStorage.setItem("volt_github_branch", branch);
              localStorage.setItem("volt_github_token", token);
              note("Repo config saved");
            }}
            className={BTN_PRIMARY}
          >
            SAVE CONFIG
          </button>
        </div>
      )}

      {/* Permission strip */}
      <div className="p-3 rounded-2xl vol-panel border vol-ring flex flex-wrap items-center gap-2">
        <ShieldCheck className="w-4 h-4 vol-accent" />
        <span className="text-[10px] font-black tracking-wider vol-t2 uppercase">Acting as</span>
        {ROLES.map((r) => (
          <button
            key={r}
            onClick={() => changeRole(r)}
            className={`min-h-[40px] px-3 rounded-lg text-[10px] font-black uppercase cursor-pointer ${
              role === r ? "vol-acc-bg text-black" : "vol-well vol-t2"
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

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`min-h-[44px] px-3 rounded-xl text-[10px] font-black uppercase cursor-pointer flex items-center gap-2 border vol-ring ${
                tab === t.id ? "vol-acc-bg text-black border-transparent" : "vol-well vol-t2"
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "prs" && (
        <>
          <div className="flex flex-wrap gap-2">
            <button onClick={newBranch} disabled={busy === "branch"} className={BTN_GHOST}>
              <GitBranch className="w-4 h-4" /> NEW FIX BRANCH
            </button>
            <button onClick={() => exportAudit("csv")} className={BTN_GHOST}>
              <Download className="w-4 h-4" /> AUDIT CSV
            </button>
            <button onClick={() => exportAudit("json")} className={BTN_GHOST}>
              <Download className="w-4 h-4" /> AUDIT JSON
            </button>
          </div>
          <PRTab
            ops={ops}
            prs={prs}
            busy={busy}
            onRefresh={refreshPrs}
            setBusy={setBusy}
            lessons={lessons}
            addLesson={addLesson}
          />
        </>
      )}

      {tab === "conflicts" && <ConflictTab ops={ops} />}
      {tab === "security" && <SecurityTab ops={ops} token={token} />}
      {tab === "team" && <TeamTab key={repoKey} ops={ops} permissions={permissions} />}

      {/* Activity + audit */}
      <div className="p-3 rounded-2xl vol-panel border vol-ring">
        <div className="text-[10px] font-black tracking-wider vol-t2 uppercase mb-2">
          Action log ({log.length}) · audit trail {auditLogs.length ? `(${auditLogs.length})` : ""}
        </div>
        <div className="space-y-1 max-h-56 overflow-y-auto">
          {log.length === 0 && <p className="text-xs vol-t2">No actions yet.</p>}
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

      {tab === "security" && (
        <p className="text-[10px] vol-t2 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 vol-accent shrink-0" /> Findings are static analysis, not a
          guarantee. Confirm before rotating keys.
        </p>
      )}
    </div>
  );
};
