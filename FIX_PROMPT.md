# VOLT Auto-Fix Prompt — browser audit 2026-10-30T03:07 UTC
Target branch: `fix/auto`

## Task for any AI/agent
1. Checkout/create the target branch.
2. Fix every failing check listed in the report (file evidence inside
   `AUDIT_REPORT.md`; run `node audit.mjs` locally against `npm run build`
   output via `npx vite preview` to reproduce).
3. Re-audit until 0 failures; run `node scripts/theme-lint.mjs` too.
4. Commit, push, open a PR with `AUDIT_REPORT.md` as the body.
5. Reject-loop: if a human deleted one of your PRs, read `AGENT_LESSONS.md`,
   append the reason, never repeat it.

## Current failures
None — clean.
