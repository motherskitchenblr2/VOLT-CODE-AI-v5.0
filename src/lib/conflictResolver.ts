/**
 * Three-way conflict resolution for GitHub PRs, without git.
 *
 * GitHub's API tells us a PR is `mergeable: false` but not which files clash.
 * We derive the candidates (files changed on both sides since the merge base)
 * and merge each file with the versions GitHub gives us: merge-base, base
 * branch head, PR head.
 */

export interface ThreeWayInput {
  path: string;
  base: string | null; // merge-base version
  ours: string | null; // base branch (target) version
  theirs: string | null; // PR head version
}

export type MergeStatus = "auto" | "identical" | "manual" | "deleted";

export interface MergeOutcome {
  path: string;
  status: MergeStatus;
  content?: string | null;
  reason: string;
}

/**
 * Resolve a file. Only the provably-safe case is automatic: one side did not
 * change, so the other side wins. Anything else is handed to a human or the AI.
 *
 * ponytail: no line-level diff3. A true 3-way line merge would resolve more
 * files, but every bug there silently corrupts code. Upgrade path: swap in a
 * diff3 implementation and keep `manual` for overlapping hunks.
 */
export function merge3(input: ThreeWayInput): MergeOutcome {
  const { path, base, ours, theirs } = input;

  if (ours === null && theirs === null) {
    return { path, status: "deleted", content: null, reason: "Deleted on both sides." };
  }
  if (ours === theirs) {
    return { path, status: "identical", content: ours, reason: "Both sides are identical." };
  }
  if (base === ours) {
    return {
      path,
      status: "auto",
      content: theirs,
      reason: theirs === null ? "Deleted on the PR side only." : "Target branch unchanged; PR version wins.",
    };
  }
  if (base === theirs) {
    return {
      path,
      status: "auto",
      content: ours,
      reason: ours === null ? "Deleted on the target branch only." : "PR unchanged; target version wins.",
    };
  }
  return {
    path,
    status: "manual",
    reason:
      base === null
        ? "Added on both sides with different content."
        : "Both sides changed in different ways; needs a real merge (AI draft or human).",
  };
}

/** Files changed on both sides since the merge base are the conflict candidates. */
export function findConflictCandidates(
  prChanged: string[],
  targetChangedSinceBase: string[],
): string[] {
  const target = new Set(targetChangedSinceBase);
  return [...new Set(prChanged)].filter((f) => target.has(f)).sort();
}

/** Prompt used when we ask a model to draft a merge for a manual file. */
export function mergePrompt(input: ThreeWayInput): string {
  return [
    "You are merging two versions of one file. Return ONLY the merged file content.",
    "No markdown fences, no explanation. Keep both sides' intended changes; do not drop features.",
    "",
    `File: ${input.path}`,
    "",
    "=== MERGE BASE ===",
    input.base ?? "(file did not exist)",
    "",
    "=== TARGET BRANCH ===",
    input.ours ?? "(deleted)",
    "",
    "=== PR BRANCH ===",
    input.theirs ?? "(deleted)",
  ].join("\n");
}
