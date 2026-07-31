# PR Security Gate

This repository uses an automated GitHub Actions workflow to review pull requests for security and policy issues before merge.

## Workflow

- File: `.github/workflows/pr-security.yml`
- Trigger:
  - `pull_request` (`opened`, `synchronize`, `reopened`, `ready_for_review`)
  - `workflow_dispatch`

## What It Checks

1. **Dependency Audit**
   - Runs `npm audit --audit-level=high`
   - Fails on high/critical dependency vulnerabilities.

2. **Lint Policy Enforcement**
   - Runs `npm run lint`
   - Enforces repository ESLint and TypeScript rules (including security-related coding hygiene).

3. **Semgrep SAST**
   - Runs Semgrep with:
     - `p/security-audit`
     - `p/secrets`
     - `p/owasp-top-ten`
   - Uploads SARIF findings to GitHub code scanning.

4. **Trivy Security Scan**
   - Scans repository filesystem for:
     - vulnerabilities
     - secrets
     - misconfigurations
   - Severity threshold: `HIGH,CRITICAL`
   - Fails the job when findings meet threshold.
   - Uploads SARIF findings to GitHub code scanning.

## Merge Policy

Recommended branch protection settings for `main`:

- Require pull request reviews before merging.
- Require status checks to pass before merging.
- Add required check:
  - `Security Review (Audit + Lint + SAST + Secrets)`

This ensures PRs cannot be merged when high-risk issues are detected.

## Developer Guidance

If this check fails on a PR:

1. Open the failed workflow logs in GitHub Actions.
2. Review errors from `npm audit`, `eslint`, Semgrep, and Trivy.
3. Fix findings in your branch.
4. Push updates; checks will rerun automatically.

## Notes

- This gate is strict by design to reduce security and compliance risk.
- SARIF uploads make findings visible in GitHub Security / Code Scanning UI.
