/**
 * PR review agent — deterministic review rules over a PR diff, plus the prompt
 * used when a model should narrate the review. No provider key = rule-based
 * review only; we never fake an AI answer.
 */
import { scanPatch, scanWorkflow, type ScanFinding } from "./injectionScan";

export type ReviewSeverity = "block" | "warn" | "note";

export interface PRFile {
  filename: string;
  status?: string;
  additions?: number;
  deletions?: number;
  patch?: string;
}

export interface ReviewFinding {
  rule: string;
  severity: ReviewSeverity;
  file: string;
  message: string;
}

export interface ReviewReport {
  verdict: "request_changes" | "comment" | "approve";
  findings: ReviewFinding[];
  blocks: number;
  warns: number;
  filesReviewed: number;
  linesAdded: number;
}

const SECURITY_LEVELS = new Set(["critical", "high"]);

const toFinding = (
  severity: ReviewSeverity,
  f: ScanFinding,
): ReviewFinding => ({
  rule: f.rule,
  severity,
  file: f.file,
  message: `${f.message}${f.line ? ` (line ${f.line})` : ""}`,
});

/** Code smells that are cheap to spot in a patch and worth stopping. */
const PATCH_RULES: Array<{
  rule: string;
  severity: ReviewSeverity;
  re: RegExp;
  message: string;
}> = [
  {
    rule: "conflict-markers",
    severity: "block",
    re: /^\+(?:<<<<<<<|=======|>>>>>>>) /m,
    message: "Unresolved merge conflict markers in the diff.",
  },
  {
    rule: "eval-usage",
    severity: "block",
    re: /^\+\s*(?:eval\(|new Function\()/m,
    message:
      "Dynamic code execution (eval / new Function). Removes the safety of the bundle; use a map of handlers.",
  },
  {
    rule: "child-process",
    severity: "block",
    re: /^\+.*require\(["'](?:node:)?child_process["']\)|\+\s*import\s+.*["'](?:node:)?child_process["']/m,
    message:
      "child_process in app code. If it must exist, it belongs in a script with input validation.",
  },
  {
    rule: "raw-html",
    severity: "warn",
    re: /dangerouslySetInnerHTML/,
    message:
      "dangerouslySetInnerHTML renders untrusted HTML as-is; sanitize it or render text.",
  },
  {
    rule: "insecure-http",
    severity: "warn",
    re: /^\+\s*fetch\(\s*["']http:\/\//m,
    message:
      "Plain http:// request; use https:// so payloads are not readable in transit.",
  },
  {
    rule: "debug-leftover",
    severity: "warn",
    re: /^\+.*\b(?:console\.log|debugger)\b/m,
    message: "Debug leftover (console.log / debugger) in the diff.",
  },
  {
    rule: "base64-atob-json",
    severity: "note",
    re: /^\+.*\batob\(/m,
    message:
      "atob() is used; it throws on non-latin1 input. Wrap it and handle the failure.",
  },
];

export function reviewPullRequest(files: PRFile[]): ReviewReport {
  const findings: ReviewFinding[] = [];
  const paths = files.map((f) => f.filename);
  const linesAdded = files.reduce((n, f) => n + (f.additions ?? 0), 0);

  for (const file of files) {
    const patch = file.patch ?? "";
    for (const rule of PATCH_RULES) {
      if (rule.re.test(patch)) {
        findings.push({
          rule: rule.rule,
          severity: rule.severity,
          file: file.filename,
          message: rule.message,
        });
      }
    }
    // Only added lines can leak a new secret.
    for (const f of scanPatch(file.filename, patch)) {
      findings.push(
        toFinding(SECURITY_LEVELS.has(f.severity) ? "block" : "warn", f),
      );
    }
    if (/^\.github\/workflows\/.+\.ya?ml$/.test(file.filename)) {
      for (const f of scanWorkflow(file.filename, patch)) {
        findings.push(
          toFinding(
            f.severity === "critical" || f.severity === "high"
              ? "block"
              : "warn",
            f,
          ),
        );
      }
    }
  }

  const touchesTests = paths.some(
    (p) =>
      /(^|\/)(test|tests|__tests__)\//.test(p) || /\.test\.[jt]sx?$/.test(p),
  );
  const touchesCode = paths.some((p) => /^src\/(?!test\/).*\.[jt]sx?$/.test(p));
  if (touchesCode && !touchesTests) {
    findings.push({
      rule: "no-tests",
      severity: "warn",
      file: "src/",
      message:
        "Source changed but no test changed. Add one runnable check covering the new branch of logic.",
    });
  }

  if (paths.some((p) => p === ".env" || p.endsWith("/.env"))) {
    findings.push({
      rule: "env-committed",
      severity: "block",
      file: ".env",
      message:
        "A .env file is in the diff. Secrets belong in the hosting env vars, never in git.",
    });
  }

  const lockChanged = paths.some((p) => /(^|\/)package-lock\.json$/.test(p));
  const pkgChanged = paths.some((p) => /(^|\/)package\.json$/.test(p));
  if (lockChanged !== pkgChanged) {
    findings.push({
      rule: "lockfile-mismatch",
      severity: "warn",
      file: lockChanged ? "package-lock.json" : "package.json",
      message:
        "package.json and package-lock.json must change together, or installs drift from the lock.",
    });
  }

  if (linesAdded > 800) {
    findings.push({
      rule: "large-diff",
      severity: "warn",
      file: `${files.length} files`,
      message: `${linesAdded} lines added. Split into smaller PRs so a reviewer can actually read it.`,
    });
  }

  const blocks = findings.filter((f) => f.severity === "block").length;
  const warns = findings.filter((f) => f.severity === "warn").length;
  return {
    verdict: blocks > 0 ? "request_changes" : warns > 0 ? "comment" : "approve",
    findings,
    blocks,
    warns,
    filesReviewed: files.length,
    linesAdded,
  };
}

const icon = (s: ReviewSeverity) =>
  s === "block" ? "🛑" : s === "warn" ? "⚠️" : "ℹ️";

/** Markdown body for the real GitHub review. */
export function reviewMarkdown(report: ReviewReport): string {
  const head =
    report.verdict === "request_changes"
      ? "Changes requested by the VOLT review agent."
      : report.verdict === "comment"
        ? "Review notes from the VOLT review agent."
        : "No blocking issues found by the VOLT review agent.";
  const rows = report.findings
    .map(
      (f) => `- ${icon(f.severity)} **${f.rule}** \`${f.file}\` — ${f.message}`,
    )
    .join("\n");
  return [
    `## VOLT review — ${report.verdict.replace("_", " ")}`,
    "",
    head,
    "",
    `Reviewed ${report.filesReviewed} file(s), ${report.linesAdded} added line(s). ${report.blocks} blocking, ${report.warns} warning.`,
    "",
    rows ||
      "_Nothing to flag: no secrets, no workflow injection, no debug leftovers._",
    "",
    "_Rules run locally in the app; no code is sent anywhere for this report._",
  ].join("\n");
}

/** Prompt for optional model narration, on top of the rule results. */
export function reviewPrompt(report: ReviewReport, files: PRFile[]): string {
  const diff = files
    .slice(0, 12)
    .map((f) => `--- ${f.filename}\n${(f.patch ?? "").slice(0, 2500)}`)
    .join("\n");
  return [
    "You are reviewing a pull request on a React 19 + Vite + TypeScript app.",
    "Give a short review: 3-6 bullets, most important first. Point at concrete lines. Do not invent files.",
    "If the static rules below already caught something, say whether it matters and how to fix it.",
    "",
    "Static findings:",
    report.findings
      .map((f) => `- [${f.severity}] ${f.file}: ${f.message}`)
      .join("\n") || "- none",
    "",
    "Diff (truncated):",
    diff,
  ].join("\n");
}

/** AGENT_LESSONS.md entry for a rejected PR. */
export function lessonMarkdown(input: {
  prNumber: number;
  title: string;
  reason: string;
  date?: Date;
}): string {
  const date = (input.date ?? new Date())
    .toISOString()
    .slice(0, 16)
    .replace("T", " ");
  return [
    "",
    `## ${date} UTC — PR #${input.prNumber} rejected`,
    `**PR:** ${input.title}`,
    `**Why:** ${input.reason.trim() || "no reason given"}`,
    "**Lesson:** do not repeat this in the next PR. Check it before opening.",
    "",
  ].join("\n");
}
