# Workflow Security Sweep

Generated: 2026-10-30T15:49:18.444Z
Repos: 1 · Workflows: 6
Findings: 24 (0 critical, 0 high, 22 medium, 2 low)

**Verdict: no critical finding.**

## Per repo

| Repo                                 | Ref  | Workflows | Findings | Verdict |
| ------------------------------------ | ---- | --------- | -------- | ------- |
| motherskitchenblr2/VOLT-CODE-AI-v5.0 | main | 6         | 24       | review  |

## Findings

| Severity | Rule                   | Location                                                                                             | What to do                                                                                                                                                                                       |
| -------- | ---------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| medium   | wf-unpinned-action     | `motherskitchenblr2/VOLT-CODE-AI-v5.0/.github/workflows/codeql.yml:60`                               | Action "actions/checkout@v7" is pinned to a mutable ref. A compromised maintainer can repoint it; pin the full commit SHA.                                                                       |
| medium   | wf-unpinned-action     | `motherskitchenblr2/VOLT-CODE-AI-v5.0/.github/workflows/codeql.yml:70`                               | Action "github/codeql-action/init@v4.37.6" is pinned to a mutable ref. A compromised maintainer can repoint it; pin the full commit SHA.                                                         |
| medium   | wf-unpinned-action     | `motherskitchenblr2/VOLT-CODE-AI-v5.0/.github/workflows/codeql.yml:99`                               | Action "github/codeql-action/analyze@v4.37.6" is pinned to a mutable ref. A compromised maintainer can repoint it; pin the full commit SHA.                                                      |
| low      | wf-pr-target           | `motherskitchenblr2/VOLT-CODE-AI-v5.0/.github/workflows/dependabot-auto-merge.yml:4`                 | pull_request_target grants write permissions and secrets to a workflow triggered by forks. Confirm no untrusted code runs.                                                                       |
| medium   | wf-unpinned-action     | `motherskitchenblr2/VOLT-CODE-AI-v5.0/.github/workflows/dependabot-auto-merge.yml:16`                | Action "actions/checkout@v7" is pinned to a mutable ref. A compromised maintainer can repoint it; pin the full commit SHA.                                                                       |
| medium   | wf-unpinned-action     | `motherskitchenblr2/VOLT-CODE-AI-v5.0/.github/workflows/generator-generic-ossf-slsa3-publish.yml:19` | Action "actions/checkout@v7" is pinned to a mutable ref. A compromised maintainer can repoint it; pin the full commit SHA.                                                                       |
| medium   | wf-unpinned-action     | `motherskitchenblr2/VOLT-CODE-AI-v5.0/.github/workflows/generator-generic-ossf-slsa3-publish.yml:40` | Action "slsa-framework/slsa-github-generator/.github/workflows/generator_generic_slsa3.yml@v2.1.0" is pinned to a mutable ref. A compromised maintainer can repoint it; pin the full commit SHA. |
| medium   | wf-unpinned-action     | `motherskitchenblr2/VOLT-CODE-AI-v5.0/.github/workflows/generator-generic-ossf-slsa3-publish.yml:50` | Action "peter-evans/repository-dispatch@v4" is pinned to a mutable ref. A compromised maintainer can repoint it; pin the full commit SHA.                                                        |
| medium   | wf-unpinned-action     | `motherskitchenblr2/VOLT-CODE-AI-v5.0/.github/workflows/main.yaml:23`                                | Action "actions/checkout@v7" is pinned to a mutable ref. A compromised maintainer can repoint it; pin the full commit SHA.                                                                       |
| medium   | wf-unpinned-action     | `motherskitchenblr2/VOLT-CODE-AI-v5.0/.github/workflows/main.yaml:29`                                | Action "actions/setup-node@v7" is pinned to a mutable ref. A compromised maintainer can repoint it; pin the full commit SHA.                                                                     |
| medium   | wf-unpinned-action     | `motherskitchenblr2/VOLT-CODE-AI-v5.0/.github/workflows/main.yaml:68`                                | Action "actions/github-script@v9" is pinned to a mutable ref. A compromised maintainer can repoint it; pin the full commit SHA.                                                                  |
| medium   | wf-unpinned-action     | `motherskitchenblr2/VOLT-CODE-AI-v5.0/.github/workflows/main.yaml:93`                                | Action "actions/checkout@v7" is pinned to a mutable ref. A compromised maintainer can repoint it; pin the full commit SHA.                                                                       |
| medium   | wf-unpinned-action     | `motherskitchenblr2/VOLT-CODE-AI-v5.0/.github/workflows/main.yaml:96`                                | Action "snyk/actions/node@master" is pinned to a mutable ref. A compromised maintainer can repoint it; pin the full commit SHA.                                                                  |
| medium   | wf-unpinned-action     | `motherskitchenblr2/VOLT-CODE-AI-v5.0/.github/workflows/main.yaml:111`                               | Action "actions/checkout@v7" is pinned to a mutable ref. A compromised maintainer can repoint it; pin the full commit SHA.                                                                       |
| medium   | wf-unpinned-action     | `motherskitchenblr2/VOLT-CODE-AI-v5.0/.github/workflows/main.yaml:114`                               | Action "actions/setup-python@v7" is pinned to a mutable ref. A compromised maintainer can repoint it; pin the full commit SHA.                                                                   |
| medium   | wf-unpinned-action     | `motherskitchenblr2/VOLT-CODE-AI-v5.0/.github/workflows/main.yaml:126`                               | Action "actions/github-script@v9" is pinned to a mutable ref. A compromised maintainer can repoint it; pin the full commit SHA.                                                                  |
| medium   | wf-unpinned-action     | `motherskitchenblr2/VOLT-CODE-AI-v5.0/.github/workflows/pr-security.yml:19`                          | Action "actions/checkout@v7" is pinned to a mutable ref. A compromised maintainer can repoint it; pin the full commit SHA.                                                                       |
| medium   | wf-unpinned-action     | `motherskitchenblr2/VOLT-CODE-AI-v5.0/.github/workflows/pr-security.yml:22`                          | Action "actions/setup-node@v7" is pinned to a mutable ref. A compromised maintainer can repoint it; pin the full commit SHA.                                                                     |
| medium   | wf-unpinned-action     | `motherskitchenblr2/VOLT-CODE-AI-v5.0/.github/workflows/pr-security.yml:44`                          | Action "github/codeql-action/upload-sarif@v4.37.6" is pinned to a mutable ref. A compromised maintainer can repoint it; pin the full commit SHA.                                                 |
| medium   | wf-unpinned-action     | `motherskitchenblr2/VOLT-CODE-AI-v5.0/.github/workflows/pr-security.yml:50`                          | Action "aquasecurity/trivy-action@master" is pinned to a mutable ref. A compromised maintainer can repoint it; pin the full commit SHA.                                                          |
| medium   | wf-unpinned-action     | `motherskitchenblr2/VOLT-CODE-AI-v5.0/.github/workflows/pr-security.yml:61`                          | Action "github/codeql-action/upload-sarif@v4.37.6" is pinned to a mutable ref. A compromised maintainer can repoint it; pin the full commit SHA.                                                 |
| medium   | wf-unpinned-action     | `motherskitchenblr2/VOLT-CODE-AI-v5.0/.github/workflows/webpack.yml:16`                              | Action "actions/checkout@v7" is pinned to a mutable ref. A compromised maintainer can repoint it; pin the full commit SHA.                                                                       |
| medium   | wf-unpinned-action     | `motherskitchenblr2/VOLT-CODE-AI-v5.0/.github/workflows/webpack.yml:19`                              | Action "actions/setup-node@v7" is pinned to a mutable ref. A compromised maintainer can repoint it; pin the full commit SHA.                                                                     |
| low      | wf-missing-permissions | `motherskitchenblr2/VOLT-CODE-AI-v5.0/.github/workflows/webpack.yml:1`                               | No permissions block: the job inherits the repository default, which is often read/write. Declare it explicitly.                                                                                 |

## Limits (read this)

- Static rules only: pwn-request checkout, untrusted `${{ }}` in `run:`, unpinned actions, `write-all`,
  `curl | sh`, secret echo. It is not a full SAST and cannot prove safety.
- Repositories are read through the GitHub API; nothing is written to the repos.
- `docs/security-sweep/findings.json` is the machine-readable output.
