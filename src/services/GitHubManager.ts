// GitHub Manager Service
// Handles GitHub API interactions for self-managed repository workflow

import { PullRequest } from "./AgentCommunication";

export interface GitHubConfig {
  owner: string;
  repo: string;
  token: string;
  branch: string; // Base branch (usually 'main' or 'master')
}

export interface GitHubFile {
  path: string;
  content: string;
  mode?: "100644" | "100755" | "040000" | "160000" | "120000";
}

export interface CommitOptions {
  message: string;
  author?: {
    name: string;
    email: string;
  };
}

export class GitHubManager {
  private config: GitHubConfig;
  private baseURL = "https://api.github.com";

  constructor(config: GitHubConfig) {
    this.config = config;
  }

  /** Base branch this manager was configured with. */
  get branchName(): string {
    return this.config.branch;
  }

  // Get authorization header
  private getHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.config.token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };
  }

  // Create a new branch for agent work
  async createBranch(
    branchName: string,
  ): Promise<{ name: string; sha: string }> {
    try {
      // Get base branch SHA
      const baseResponse = await fetch(
        `${this.baseURL}/repos/${this.config.owner}/${this.config.repo}/git/ref/heads/${this.config.branch}`,
        {
          headers: this.getHeaders(),
        },
      );

      if (!baseResponse.ok) {
        throw new Error(
          `Failed to get base branch: ${baseResponse.statusText}`,
        );
      }

      const baseData = await baseResponse.json();
      const baseSha = baseData.object.sha;

      // Create new branch
      const createResponse = await fetch(
        `${this.baseURL}/repos/${this.config.owner}/${this.config.repo}/git/refs`,
        {
          method: "POST",
          headers: this.getHeaders(),
          body: JSON.stringify({
            ref: `refs/heads/${branchName}`,
            sha: baseSha,
          }),
        },
      );

      if (!createResponse.ok) {
        throw new Error(
          `Failed to create branch: ${createResponse.statusText}`,
        );
      }

      const data = await createResponse.json();
      return {
        name: branchName,
        sha: data.object.sha,
      };
    } catch (error) {
      console.error("[GitHubManager] Failed to create branch:", error);
      throw error;
    }
  }

  // Commit files to a branch
  async commitFiles(
    branchName: string,
    files: GitHubFile[],
    options: CommitOptions,
  ): Promise<{ sha: string; url: string }> {
    try {
      // Get current tree
      const branchResponse = await fetch(
        `${this.baseURL}/repos/${this.config.owner}/${this.config.repo}/git/ref/heads/${branchName}`,
        { headers: this.getHeaders() },
      );

      if (!branchResponse.ok) {
        throw new Error(`Failed to get branch: ${branchResponse.statusText}`);
      }

      const branchData = await branchResponse.json();
      const commitSha = branchData.object.sha;

      // Get commit tree
      const commitResponse = await fetch(
        `${this.baseURL}/repos/${this.config.owner}/${this.config.repo}/git/commits/${commitSha}`,
        { headers: this.getHeaders() },
      );

      if (!commitResponse.ok) {
        throw new Error(`Failed to get commit: ${commitResponse.statusText}`);
      }

      const commitData = await commitResponse.json();
      const treeSha = commitData.tree.sha;

      // Create new tree with file changes
      const treeResponse = await fetch(
        `${this.baseURL}/repos/${this.config.owner}/${this.config.repo}/git/trees`,
        {
          method: "POST",
          headers: this.getHeaders(),
          body: JSON.stringify({
            base_tree: treeSha,
            tree: files.map((file) => ({
              path: file.path,
              mode: file.mode || "100644",
              type: "blob",
              content: file.content,
            })),
          }),
        },
      );

      if (!treeResponse.ok) {
        throw new Error(`Failed to create tree: ${treeResponse.statusText}`);
      }

      const treeData = await treeResponse.json();

      // Create commit
      const newCommitResponse = await fetch(
        `${this.baseURL}/repos/${this.config.owner}/${this.config.repo}/git/commits`,
        {
          method: "POST",
          headers: this.getHeaders(),
          body: JSON.stringify({
            message: options.message,
            tree: treeData.sha,
            parents: [commitSha],
            author: options.author || {
              name: "VOLT Agent",
              email: "agent@volt.dev",
            },
          }),
        },
      );

      if (!newCommitResponse.ok) {
        throw new Error(
          `Failed to create commit: ${newCommitResponse.statusText}`,
        );
      }

      const newCommitData = await newCommitResponse.json();

      // Update branch reference
      const updateResponse = await fetch(
        `${this.baseURL}/repos/${this.config.owner}/${this.config.repo}/git/refs/heads/${branchName}`,
        {
          method: "PATCH",
          headers: this.getHeaders(),
          body: JSON.stringify({
            sha: newCommitData.sha,
          }),
        },
      );

      if (!updateResponse.ok) {
        throw new Error(
          `Failed to update branch: ${updateResponse.statusText}`,
        );
      }

      return {
        sha: newCommitData.sha,
        url: newCommitData.html_url,
      };
    } catch (error) {
      console.error("[GitHubManager] Failed to commit files:", error);
      throw error;
    }
  }

  // Create pull request
  async createPullRequest(
    branchName: string,
    prTitle: string,
    prBody: string,
    reviewers?: string[],
  ): Promise<PullRequest> {
    try {
      const prResponse = await fetch(
        `${this.baseURL}/repos/${this.config.owner}/${this.config.repo}/pulls`,
        {
          method: "POST",
          headers: this.getHeaders(),
          body: JSON.stringify({
            title: prTitle,
            body: prBody,
            head: branchName,
            base: this.config.branch,
          }),
        },
      );

      if (!prResponse.ok) {
        throw new Error(`Failed to create PR: ${prResponse.statusText}`);
      }

      const prData = await prResponse.json();

      // Add reviewers if provided
      if (reviewers && reviewers.length > 0) {
        await fetch(
          `${this.baseURL}/repos/${this.config.owner}/${this.config.repo}/pulls/${prData.number}/requested_reviewers`,
          {
            method: "POST",
            headers: this.getHeaders(),
            body: JSON.stringify({
              reviewers: reviewers,
            }),
          },
        );
      }

      return {
        id: prData.id.toString(),
        prNumber: prData.number,
        gitHubUrl: prData.html_url,
        title: prData.title,
        description: prData.body,
        branch: branchName,
        createdBy: "agent-system",
        createdAt: new Date(prData.created_at),
        status: "open",
        meetingId: "",
        taskId: "",
        agentDiscussions: "",
      };
    } catch (error) {
      console.error("[GitHubManager] Failed to create PR:", error);
      throw error;
    }
  }

  // Get pull request details
  async getPullRequest(prNumber: number): Promise<Record<string, unknown>> {
    try {
      const response = await fetch(
        `${this.baseURL}/repos/${this.config.owner}/${this.config.repo}/pulls/${prNumber}`,
        { headers: this.getHeaders() },
      );

      if (!response.ok) {
        throw new Error(`Failed to get PR: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("[GitHubManager] Failed to get PR:", error);
      throw error;
    }
  }

  // Merge pull request
  async mergePullRequest(
    prNumber: number,
    commitTitle?: string,
    commitMessage?: string,
    squash: boolean = false,
  ): Promise<{ sha: string; merged: boolean }> {
    try {
      const response = await fetch(
        `${this.baseURL}/repos/${this.config.owner}/${this.config.repo}/pulls/${prNumber}/merge`,
        {
          method: "PUT",
          headers: this.getHeaders(),
          body: JSON.stringify({
            commit_title: commitTitle,
            commit_message: commitMessage,
            merge_method: squash ? "squash" : "merge",
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to merge PR: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        sha: data.sha,
        merged: data.merged,
      };
    } catch (error) {
      console.error("[GitHubManager] Failed to merge PR:", error);
      throw error;
    }
  }

  // Close (ignore) pull request
  async closePullRequest(prNumber: number): Promise<{ closed: boolean }> {
    try {
      const response = await fetch(
        `${this.baseURL}/repos/${this.config.owner}/${this.config.repo}/pulls/${prNumber}`,
        {
          method: "PATCH",
          headers: this.getHeaders(),
          body: JSON.stringify({
            state: "closed",
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to close PR: ${response.statusText}`);
      }

      return { closed: true };
    } catch (error) {
      console.error("[GitHubManager] Failed to close PR:", error);
      throw error;
    }
  }

  // Get list of open PRs
  async getOpenPullRequests(): Promise<Record<string, unknown>[]> {
    try {
      const response = await fetch(
        `${this.baseURL}/repos/${this.config.owner}/${this.config.repo}/pulls?state=open`,
        { headers: this.getHeaders() },
      );

      if (!response.ok) {
        throw new Error(`Failed to get PRs: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("[GitHubManager] Failed to get PRs:", error);
      throw error;
    }
  }

  /**
   * One fetch wrapper for the read-side API (PRs, files, compare).
   * Errors keep GitHub's own message + status so the UI can tell "no token"
   * apart from "not found" and "rate limited".
   */
  private async gh<T>(
    path: string,
    init?: { method?: string; body?: unknown },
  ): Promise<T> {
    const response = await fetch(`${this.baseURL}${path}`, {
      method: init?.method || "GET",
      headers: this.getHeaders(),
      body: init?.body === undefined ? undefined : JSON.stringify(init.body),
    });
    if (!response.ok) {
      let detail = "";
      try {
        const body = (await response.json()) as { message?: string };
        detail = body?.message ? `: ${body.message}` : "";
      } catch {
        // non-JSON error body — status is all we have
      }
      const hint =
        response.status === 401 || response.status === 403
          ? " (check the token scope / rate limit)"
          : response.status === 404
            ? " (repo, PR or path not found — check owner/repo)"
            : "";
      throw new Error(`GitHub ${response.status}${detail}${hint}`);
    }
    return (await response.json()) as T;
  }

  /** Files in a PR, with patches. Used by the review agent. */
  async getPullRequestFiles(
    prNumber: number,
  ): Promise<Record<string, unknown>[]> {
    return this.gh<Record<string, unknown>[]>(
      `/repos/${this.config.owner}/${this.config.repo}/pulls/${prNumber}/files?per_page=100`,
    );
  }

  /** Post a real GitHub review (not a local log line). */
  async createReview(
    prNumber: number,
    event: "APPROVE" | "REQUEST_CHANGES" | "COMMENT",
    body: string,
  ): Promise<{ id: number; html_url: string }> {
    if (!body.trim())
      throw new Error("Review body is empty — nothing to post.");
    return this.gh<{ id: number; html_url: string }>(
      `/repos/${this.config.owner}/${this.config.repo}/pulls/${prNumber}/reviews`,
      { method: "POST", body: { event, body } },
    );
  }

  /** Compare two refs: used to find the merge base and conflict candidates. */
  async getCompare(
    base: string,
    head: string,
  ): Promise<{
    mergeBase: string;
    files: Array<{ filename: string; status: string }>;
  }> {
    const data = await this.gh<{
      merge_base_commit?: { sha?: string };
      files?: Array<{ filename: string; status: string }>;
    }>(
      `/repos/${this.config.owner}/${this.config.repo}/compare/${encodeURIComponent(base)}...${encodeURIComponent(head)}`,
    );
    return {
      mergeBase: data.merge_base_commit?.sha || "",
      files: data.files || [],
    };
  }

  /** File content at a ref, or null when the file does not exist there. */
  async getFileContent(
    path: string,
    ref: string,
  ): Promise<{ content: string; sha: string } | null> {
    try {
      const data = await this.gh<{
        content?: string;
        encoding?: string;
        sha: string;
      }>(
        `/repos/${this.config.owner}/${this.config.repo}/contents/${path}?ref=${encodeURIComponent(ref)}`,
      );
      const raw = data.content || "";
      // atob exists in browsers and in Node >= 16, so one path covers both.
      const content =
        data.encoding === "base64" ? atob(raw.replace(/\s/g, "")) : raw;
      return { content, sha: data.sha };
    } catch (error) {
      if (error instanceof Error && /GitHub 404/.test(error.message))
        return null;
      throw error;
    }
  }

  /** Directory listing (names only) at a ref; empty when it does not exist. */
  async getDirectory(
    path: string,
    ref: string,
  ): Promise<Array<{ name: string; path: string }>> {
    try {
      const data = await this.gh<
        Array<{ name: string; path: string; type: string }>
      >(
        `/repos/${this.config.owner}/${this.config.repo}/contents/${path}?ref=${encodeURIComponent(ref)}`,
      );
      return Array.isArray(data)
        ? data
            .filter((e) => e.type === "file")
            .map((e) => ({ name: e.name, path: e.path }))
        : [];
    } catch (error) {
      if (error instanceof Error && /GitHub 404/.test(error.message)) return [];
      throw error;
    }
  }

  /** Workflow files on a branch — the input for the injection sweep. */
  async getWorkflows(
    ref: string,
  ): Promise<Array<{ path: string; content: string }>> {
    const entries = await this.getDirectory(".github/workflows", ref);
    const out: Array<{ path: string; content: string }> = [];
    for (const entry of entries) {
      if (!/\.ya?ml$/.test(entry.name)) continue;
      const file = await this.getFileContent(entry.path, ref);
      if (file) out.push({ path: entry.path, content: file.content });
    }
    return out;
  }

  /** Repos the token can see for an owner (user or org), for the multi-repo sweep. */
  static async listRepos(
    token: string,
    owner: string,
  ): Promise<
    Array<{ full_name: string; private: boolean; default_branch: string }>
  > {
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };
    const tryFetch = async (url: string) => {
      const res = await fetch(url, { headers });
      if (!res.ok) return null;
      return (await res.json()) as Array<{
        full_name: string;
        private: boolean;
        default_branch: string;
        owner?: { login?: string };
      }>;
    };
    const fromOrg = await tryFetch(
      `https://api.github.com/orgs/${owner}/repos?per_page=100&sort=updated`,
    );
    const repos =
      fromOrg ??
      (await tryFetch(
        `https://api.github.com/users/${owner}/repos?per_page=100&sort=updated`,
      )) ??
      [];
    return repos
      .filter(
        (r) =>
          (r.owner?.login || "").toLowerCase() === owner.toLowerCase() ||
          !r.owner,
      )
      .map((r) => ({
        full_name: r.full_name,
        private: r.private,
        default_branch: r.default_branch || "main",
      }));
  }

  // Delete branch
  async deleteBranch(branchName: string): Promise<void> {
    try {
      const response = await fetch(
        `${this.baseURL}/repos/${this.config.owner}/${this.config.repo}/git/refs/heads/${branchName}`,
        {
          method: "DELETE",
          headers: this.getHeaders(),
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to delete branch: ${response.statusText}`);
      }
    } catch (error) {
      console.error("[GitHubManager] Failed to delete branch:", error);
      throw error;
    }
  }

  // Get commit
  async getCommit(sha: string): Promise<Record<string, unknown>> {
    try {
      const response = await fetch(
        `${this.baseURL}/repos/${this.config.owner}/${this.config.repo}/git/commits/${sha}`,
        { headers: this.getHeaders() },
      );

      if (!response.ok) {
        throw new Error(`Failed to get commit: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("[GitHubManager] Failed to get commit:", error);
      throw error;
    }
  }

  // Helper: Generate branch name for agent task
  static generateBranchName(
    agentRole: string,
    taskType: string,
    taskId: string,
  ): string {
    const timestamp = new Date().toISOString().split("T")[0];
    const cleanRole = agentRole.toLowerCase().replace(/\s+/g, "-");
    const cleanType = taskType.toLowerCase().replace(/\s+/g, "-");
    return `agent/${cleanRole}/${cleanType}/${taskId.substring(0, 8)}-${timestamp}`;
  }

  // Helper: Generate PR description from meeting context
  static generatePRDescription(
    meetingId: string,
    taskTitle: string,
    agentDiscussions: string,
  ): string {
    return `## Agent Meeting Summary

**Meeting ID**: ${meetingId}
**Task**: ${taskTitle}

### Agent Discussion
${agentDiscussions}

### Changes Made
This PR contains code changes approved and executed by the VOLT agent team during collaborative meeting #${meetingId}.

---
*Generated by VOLT Agent Communication System*`;
  }
}

// Global instance
let githubManagerInstance: GitHubManager | null = null;

export function getGitHubManager(config?: GitHubConfig): GitHubManager {
  if (config && !githubManagerInstance) {
    githubManagerInstance = new GitHubManager(config);
  }
  if (!githubManagerInstance) {
    throw new Error(
      "GitHubManager not initialized. Call getGitHubManager with config first.",
    );
  }
  return githubManagerInstance;
}

export function initializeGitHubManager(config: GitHubConfig): GitHubManager {
  githubManagerInstance = new GitHubManager(config);
  return githubManagerInstance;
}
