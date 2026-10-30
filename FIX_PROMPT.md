# VOLT Auto-Fix Prompt — dual-theme audit 2026-10-30T16:19 UTC
Branch: `fix/auto`

## Task for any AI/agent
1. Reproduce: `npm run build && npx vite preview` then `AUDIT_URL=http://localhost:4173 node audit.mjs`.
2. Fix every failing metric: DayDark (dark surfaces in day), DarkGlow (white box-shadows on dark), DarkLight (large light surfaces on dark), overflow/touch.
3. Re-audit until 0 failures. Push, open PR with this file. If rejected, append the reason to AGENT_LESSONS.md.
## Failures
None.
