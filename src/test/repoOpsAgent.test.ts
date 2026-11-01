import { describe, it, expect, beforeEach } from "vitest";
import {
  scanWorkflow,
  scanSecrets,
  scanPatch,
  summarize,
} from "../lib/injectionScan";
import {
  merge3,
  findConflictCandidates,
  mergePrompt,
} from "../lib/conflictResolver";
import {
  reviewPullRequest,
  reviewMarkdown,
  lessonMarkdown,
  type PRFile,
} from "../lib/repoAgent";
import { PermissionSystem } from "../services/PermissionSystem";

const rules = (yaml: string) =>
  scanWorkflow(".github/workflows/ci.yml", yaml).map((f) => f.rule);

describe("injectionScan — workflows", () => {
  it("flags pull_request_target that checks out the PR head", () => {
    const yaml = [
      "on: pull_request_target",
      "jobs:",
      "  test:",
      "    steps:",
      "      - uses: actions/checkout@v4",
      "        with:",
      "          ref: ${{ github.event.pull_request.head.sha }}",
    ].join("\n");
    const found = scanWorkflow("ci.yml", yaml);
    expect(
      found.some(
        (f) =>
          f.rule === "wf-pr-target-head-checkout" && f.severity === "critical",
      ),
    ).toBe(true);
  });

  it("flags untrusted event text inside a run block, with a real line number", () => {
    const yaml = [
      "on: pull_request",
      "permissions:",
      "  contents: read",
      "jobs:",
      "  t:",
      "    steps:",
      "      - run: |",
      '          echo "${{ github.event.pull_request.title }}"',
    ].join("\n");
    const found = scanWorkflow("ci.yml", yaml).find(
      (f) => f.rule === "wf-untrusted-in-run",
    );
    expect(found?.severity).toBe("high");
    expect(found?.line).toBe(8);
  });

  it("does not flag an expression passed through env:", () => {
    const yaml = [
      "on: pull_request",
      "permissions:",
      "  contents: read",
      "jobs:",
      "  t:",
      "    steps:",
      "      - env:",
      "          TITLE: ${{ github.event.pull_request.title }}",
      "        run: |",
      '          echo "$TITLE"',
    ].join("\n");
    expect(rules(yaml)).not.toContain("wf-untrusted-in-run");
  });

  it("flags unpinned actions, write-all, curl|sh and secret echo", () => {
    const yaml = [
      "on: push",
      "permissions: write-all",
      "jobs:",
      "  t:",
      "    steps:",
      "      - uses: some/action@main",
      "      - run: |",
      "          curl -fsSL https://example.com/i.sh | sh",
      "          echo ${{ secrets.TOKEN }}",
    ].join("\n");
    const found = rules(yaml);
    expect(found).toContain("wf-unpinned-action");
    expect(found).toContain("wf-write-all");
    expect(found).toContain("wf-curl-pipe-shell");
    expect(found).toContain("wf-secret-echo");
  });

  it("does not flag a SHA-pinned action", () => {
    const yaml = [
      "on: push",
      "permissions:",
      "  contents: read",
      "jobs:",
      "  t:",
      "    steps:",
      "      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683",
    ].join("\n");
    expect(rules(yaml)).not.toContain("wf-unpinned-action");
  });
});

describe("injectionScan — secrets", () => {
  it("finds a GitHub PAT and a private key", () => {
    const text =
      "const t = 'github_pat_11BTAZRSA09FPm9atZjOgO_oD4dPw5OuEz2YfOISWU8Ix';\n-----BEGIN RSA PRIVATE KEY-----";
    const found = scanSecrets("src/a.ts", text).map((f) => f.rule);
    expect(found).toContain("secret-github-pat");
    expect(found).toContain("secret-private-key");
  });

  it("only scans added lines in a patch", () => {
    const patch = ["-const old = ''';", "+const safe = 1;"].join("\n");
    expect(scanPatch("src/a.ts", patch)).toHaveLength(0);
    const leaking = ['+const k = "sk-abcdefghijklmnopqrstuvwx";'].join("\n");
    expect(scanPatch("src/a.ts", leaking)[0].rule).toBe("pr-secret-openai-key");
  });

  it("summarises to fail on critical", () => {
    const s = summarize([
      { file: "a", rule: "x", severity: "critical", message: "m" },
      { file: "b", rule: "y", severity: "low", message: "m" },
    ]);
    expect(s.verdict).toBe("fail");
    expect(s.total).toBe(2);
  });
});

describe("conflictResolver", () => {
  it("takes the changed side when the other side did not change", () => {
    expect(
      merge3({ path: "a.ts", base: "x", ours: "x", theirs: "y" }),
    ).toMatchObject({
      status: "auto",
      content: "y",
    });
    expect(
      merge3({ path: "a.ts", base: "x", ours: "y", theirs: "x" }),
    ).toMatchObject({
      status: "auto",
      content: "y",
    });
  });

  it("marks both-sides-changed as manual instead of guessing", () => {
    const out = merge3({ path: "a.ts", base: "x", ours: "y", theirs: "z" });
    expect(out.status).toBe("manual");
    expect(out.content).toBeUndefined();
    expect(
      mergePrompt({ path: "a.ts", base: "x", ours: "y", theirs: "z" }),
    ).toContain("=== PR BRANCH ===");
  });

  it("handles identical and deleted files", () => {
    expect(
      merge3({ path: "a", base: "x", ours: "y", theirs: "y" }).status,
    ).toBe("identical");
    expect(
      merge3({ path: "a", base: "x", ours: null, theirs: null }).status,
    ).toBe("deleted");
    expect(
      merge3({ path: "a", base: "x", ours: null, theirs: "x" }),
    ).toMatchObject({ status: "auto", content: null });
  });

  it("finds files changed on both sides since the merge base", () => {
    expect(findConflictCandidates(["a", "b", "c"], ["b", "c", "d"])).toEqual([
      "b",
      "c",
    ]);
  });
});

describe("repoAgent — pull request review", () => {
  const file = (filename: string, patch: string, additions = 1): PRFile => ({
    filename,
    patch,
    additions,
  });

  it("blocks a leaked key and asks for changes", () => {
    const report = reviewPullRequest([
      file(
        "src/a.ts",
        '+const k = "ghp_abcdefghijklmnopqrstuvwxyz0123456789";',
      ),
    ]);
    expect(report.verdict).toBe("request_changes");
    expect(report.blocks).toBeGreaterThan(0);
    expect(reviewMarkdown(report)).toContain("request changes");
  });

  it("warns when source changes without a test", () => {
    const report = reviewPullRequest([
      file("src/lib/x.ts", "+export const x = 1;"),
    ]);
    expect(report.findings.map((f) => f.rule)).toContain("no-tests");
    expect(report.verdict).toBe("comment");
  });

  it("approves a clean test-only diff", () => {
    const report = reviewPullRequest([
      file("src/test/x.test.ts", "+it('works', () => expect(1).toBe(1));"),
    ]);
    expect(report.verdict).toBe("approve");
    expect(report.blocks).toBe(0);
  });

  it("blocks conflict markers and a committed .env", () => {
    const report = reviewPullRequest([
      file("src/a.ts", "+<<<<<<< HEAD\n+x"),
      file(".env", "+SECRET=1"),
    ]);
    expect(report.blocks).toBeGreaterThanOrEqual(2);
  });

  it("records the rejection reason as a lesson", () => {
    const text = lessonMarkdown({
      prNumber: 123,
      title: "feat: thing",
      reason: "deleted modules instead of fixing them",
      date: new Date("2026-10-30T10:00:00Z"),
    });
    expect(text).toContain("PR #123 rejected");
    expect(text).toContain("deleted modules instead of fixing them");
  });
});

describe("PermissionSystem — per-repo team policies", () => {
  let permissions: PermissionSystem;

  beforeEach(() => {
    localStorage.clear();
    permissions = new PermissionSystem();
    permissions.registerUser("op", "Operator", "owner");
    permissions.setCurrentUser("op");
  });

  it("returns built-in defaults for an unknown repo", () => {
    const policy = permissions.getRepoPolicy("me/repo");
    expect(policy.roles.owner).toContain("merge_pr");
    expect(policy.members).toEqual([]);
  });

  it("persists a policy and gates on it", () => {
    const saved = permissions.saveRepoPolicy("me/repo", {
      roles: {
        owner: ["view_code", "merge_pr"],
        boss: ["view_code"],
        agent: ["view_code", "edit_code"],
        guest: [],
      },
      members: [{ id: "a1", name: "Fixer", role: "agent" }],
    });
    expect(saved.members).toHaveLength(1);
    expect(new PermissionSystem().canDo("me/repo", "agent", "edit_code")).toBe(
      true,
    );
    expect(new PermissionSystem().canDo("me/repo", "agent", "merge_pr")).toBe(
      false,
    );
    expect(permissions.getRepoPolicy("me/repo").members[0].name).toBe("Fixer");
  });

  it("drops unknown permissions and invalid members", () => {
    const saved = permissions.saveRepoPolicy("me/repo", {
      roles: {
        owner: ["merge_pr", "not_a_permission" as never],
        boss: [],
        agent: [],
        guest: [],
      },
      members: [{ id: "", name: "x", role: "agent" }],
    });
    expect(saved.roles.owner).toEqual(["merge_pr"]);
    expect(saved.members).toHaveLength(0);
  });
});
