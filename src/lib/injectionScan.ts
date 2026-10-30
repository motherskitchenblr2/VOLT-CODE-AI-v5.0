/**
 * Static security scanner — GitHub Actions workflow injection + secret leaks.
 * Pure functions: used by the Repo Ops cockpit, the CLI sweep
 * (scripts/security-sweep.mjs) and the unit tests. No network, no DOM.
 */

export type Severity = "critical" | "high" | "medium" | "low";

export interface ScanFinding {
  file: string;
  line?: number;
  rule: string;
  severity: Severity;
  message: string;
}

const SHA_PIN = /^[0-9a-f]{40}$/i;

const lineOf = (text: string, index: number) =>
  text.slice(0, index).split("\n").length;

const indentOf = (line: string) => line.length - line.trimStart().length;

/**
 * Collect `run:` scripts (block and inline form) with their indentation, so we
 * can tell shell code apart from `env:`/`with:` values. A naive grep flags
 * harmless expressions; this does not.
 */
function runBlocks(yaml: string): Array<{ start: number; text: string }> {
  const lines = yaml.split("\n");
  const blocks: Array<{ start: number; text: string }> = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(\s*)(?:-\s+)?run:\s*(.*)$/);
    if (!m) continue;
    const keyIndent = m[1].length;
    const inline = m[2].trim();
    if (inline && inline !== "|" && inline !== ">" && !inline.startsWith("|")) {
      blocks.push({ start: i + 1, text: inline });
      continue;
    }
    const body: string[] = [];
    let j = i + 1;
    for (; j < lines.length; j++) {
      const line = lines[j];
      if (line.trim() === "") {
        body.push(line);
        continue;
      }
      if (indentOf(line) <= keyIndent) break;
      body.push(line);
    }
    // start = 1-based line of the first body line (i is 0-based, +1 for the
    // `run:` line itself, +1 to move past it).
    blocks.push({ start: i + 2, text: body.join("\n") });
    i = j - 1;
  }
  return blocks;
}

const UNTRUSTED_IN_RUN: Array<{
  re: RegExp;
  rule: string;
  severity: Severity;
  message: string;
}> = [
  {
    re: /\$\{\{\s*github\.event\.(?:pull_request|issue|comment|discussion|review)[\w.]*\.(?:title|body|head\.ref|head\.label)\s*\}\}/,
    rule: "wf-untrusted-in-run",
    severity: "high",
    message:
      'Untrusted GitHub event text is interpolated into a shell script. An attacker controls the PR/issue title or body, so this is command injection. Pass it through an env: variable and quote "$VAR".',
  },
  {
    re: /\$\{\{\s*github\.head_ref\s*\}\}/,
    rule: "wf-untrusted-in-run",
    severity: "high",
    message:
      "github.head_ref is attacker-controlled (branch name) and is interpolated into shell. Use an env: variable instead.",
  },
  {
    re: /\$\{\{\s*inputs\.[\w-]+\s*\}\}/,
    rule: "wf-dispatch-input-in-run",
    severity: "medium",
    message:
      "workflow_dispatch input is interpolated into shell. Inputs are user text; route them through env: and quote them.",
  },
];

export function scanWorkflow(file: string, yaml: string): ScanFinding[] {
  const findings: ScanFinding[] = [];
  const blocks = runBlocks(yaml);
  const push = (
    severity: Severity,
    rule: string,
    message: string,
    line?: number,
  ) => findings.push({ file, line, rule, severity, message });

  // 1. pull_request_target + checkout of the PR head is the classic pwn request.
  if (/\bpull_request_target\b/.test(yaml)) {
    const checksOutHead =
      /github\.event\.pull_request\.head\.(?:sha|ref)/.test(yaml) ||
      /ref:\s*\$\{\{\s*github\.event\.pull_request\.head/.test(yaml);
    if (checksOutHead) {
      push(
        "critical",
        "wf-pr-target-head-checkout",
        "pull_request_target runs with a write token and secrets, yet checks out the attacker's head commit. Any workflow code runs with repo write access. Use pull_request instead, or never check out head.",
        lineOf(yaml, yaml.indexOf("pull_request_target")),
      );
    } else {
      push(
        "low",
        "wf-pr-target",
        "pull_request_target grants write permissions and secrets to a workflow triggered by forks. Confirm no untrusted code runs.",
        lineOf(yaml, yaml.indexOf("pull_request_target")),
      );
    }
  }

  // 2. Shell scripts: interpolated attacker text, secret echo, curl | sh.
  for (const block of blocks) {
    const blockLine = (needle: string) =>
      block.start +
      block.text.slice(0, block.text.indexOf(needle)).split("\n").length -
      1;
    for (const rule of UNTRUSTED_IN_RUN) {
      const m = block.text.match(rule.re);
      if (m) push(rule.severity, rule.rule, rule.message, blockLine(m[0]));
    }
    if (/curl[^\n|]*\|\s*(?:sudo\s+)?(?:ba)?sh\b/.test(block.text)) {
      push(
        "high",
        "wf-curl-pipe-shell",
        "Network response is piped straight into a shell. Pin a checksum or download then verify before executing.",
        block.start,
      );
    }
    if (/echo[^\n]*secrets\.[\w-]+/.test(block.text)) {
      push(
        "high",
        "wf-secret-echo",
        "A secret is echoed; CI logs are visible to anyone with repo read access. Write it to a file with umask 077 instead.",
        block.start,
      );
    }
  }

  // 3. Action pinning: tags and branches are mutable, a SHA is not.
  const usesRe = /^\s*(?:-\s+)?uses:\s*([^\s#]+)/gm;
  for (const match of yaml.matchAll(usesRe)) {
    const ref = match[1];
    if (ref.startsWith("./") || ref.startsWith("docker://")) continue;
    const at = ref.lastIndexOf("@");
    const pin = at >= 0 ? ref.slice(at + 1) : "";
    if (!SHA_PIN.test(pin)) {
      push(
        "medium",
        "wf-unpinned-action",
        `Action "${ref}" is pinned to a mutable ref. A compromised maintainer can repoint it; pin the full commit SHA.`,
        lineOf(yaml, match.index ?? 0),
      );
    }
  }

  // 4. Token scope.
  if (/permissions:\s*write-all/.test(yaml)) {
    push(
      "high",
      "wf-write-all",
      "permissions: write-all gives the job a write token over the whole repo. Declare the minimum scopes (e.g. contents: read).",
      lineOf(yaml, yaml.indexOf("write-all")),
    );
  } else if (!/^\s*permissions:/m.test(yaml)) {
    push(
      "low",
      "wf-missing-permissions",
      "No permissions block: the job inherits the repository default, which is often read/write. Declare it explicitly.",
      1,
    );
  }

  return findings;
}

interface SecretPattern {
  rule: string;
  severity: Severity;
  re: RegExp;
  message: string;
}

const SECRET_PATTERNS: SecretPattern[] = [
  {
    rule: "secret-github-pat",
    severity: "critical",
    re: /github_pat_[A-Za-z0-9_]{20,}/,
    message:
      "GitHub fine-grained PAT committed in source. Rotate it and read it from env/secrets.",
  },
  {
    rule: "secret-github-token",
    severity: "critical",
    re: /\bgh[pousr]_[A-Za-z0-9]{30,}/,
    message:
      "GitHub token committed in source. Rotate it and read it from env/secrets.",
  },
  {
    rule: "secret-openai-key",
    severity: "critical",
    re: /\bsk-[A-Za-z0-9_-]{20,}/,
    message:
      "API key committed in source. Rotate it and load it from a server-side env var.",
  },
  {
    rule: "secret-aws-key",
    severity: "critical",
    re: /\bAKIA[0-9A-Z]{16}\b/,
    message:
      "AWS access key id committed in source. Rotate it and use an IAM role.",
  },
  {
    rule: "secret-slack-token",
    severity: "high",
    re: /\bxox[baprs]-[A-Za-z0-9-]{10,}/,
    message: "Slack token committed in source. Rotate it.",
  },
  {
    rule: "secret-private-key",
    severity: "critical",
    re: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
    message:
      "Private key committed in source. Rotate the key pair immediately.",
  },
];

export function scanSecrets(file: string, text: string): ScanFinding[] {
  const findings: ScanFinding[] = [];
  for (const pattern of SECRET_PATTERNS) {
    const m = text.match(pattern.re);
    if (!m) continue;
    findings.push({
      file,
      line: lineOf(text, m.index ?? 0),
      rule: pattern.rule,
      severity: pattern.severity,
      message: pattern.message,
    });
  }
  return findings;
}

/** Scan a PR patch — only added lines can introduce a new leak. */
export function scanPatch(file: string, patch: string): ScanFinding[] {
  const added = patch
    .split("\n")
    .filter((l) => l.startsWith("+") && !l.startsWith("+++"))
    .join("\n");
  return scanSecrets(file, added).map((f) => ({ ...f, rule: "pr-" + f.rule }));
}

export function summarize(findings: ScanFinding[]) {
  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const f of findings) counts[f.severity]++;
  const verdict: "fail" | "review" | "pass" =
    counts.critical > 0
      ? "fail"
      : counts.high + counts.medium > 0
        ? "review"
        : "pass";
  return { ...counts, total: findings.length, verdict };
}
