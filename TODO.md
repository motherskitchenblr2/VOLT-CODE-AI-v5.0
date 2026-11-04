# TODO — VOLT CODE AI v6.0 Complete Refactor Roadmap

## Phase 1 — Complete View Extraction (App.tsx → slim shell)
*Goal: Extract all remaining inline views from App.tsx into src/components/views/. Each view extracted one at a time, verified before moving to the next.*

- [x] Extract Settings view → `src/components/views/SettingsView.tsx` (API keys, model default, agent mode, debounce, auto-apply, sentinel live monitoring)
- [x] Extract About view → `src/components/views/AboutView.tsx` (whitepaper/changelog/comparison doc)
- [x] Extract Sentinel view → `src/components/views/SentinelView.tsx` (security risk board, findings table)
- [x] Extract History view → `src/components/views/HistoryView.tsx` (previous sessions list)
- [x] Extract GitHub view → `src/components/views/GitHubView.tsx` (Git-Room deployment integration)
- [x] Extract Meeting view → `src/components/views/MeetingView.tsx` (Meeting Panel + Boss Guidance + Minutes)
- [x] Extract Diagnostics column → `src/components/views/DiagnosticsColumn.tsx` (right-rail sentinel findings)
- [ ] Extract Login/Onboarding modals → `src/components/views/LoginView.tsx` + `src/components/views/OnboardingView.tsx`
- [ ] Replace `renderContent()` with simple view router switch
- [ ] Extract `renderTerminalPanel()` → `src/components/views/TerminalView.tsx`
- [ ] Extract remaining modals (Diff, Report, Shortcuts, LangAlert, Login)
- [ ] Verify: build + lint 0 errors + tests 79/79 after EACH view extraction
- [ ] Test viewports: 375/768/1024/1440px after Phase 1 complete

## Phase 2 — Slim Shell Replacement + Deploy
*Goal: Replace App.tsx with <200 line router, mobile-first dock clearance, Vercel deployment.*

- [ ] Replace App.tsx with lightweight `<VoltAppShell>` router (< 200 lines)
- [ ] Bottom dock: 5 tabs with min 44x44px touch targets + pb-28 clearance
- [ ] Top bar: brand + active engine pill + sentinel pill + theme toggle
- [ ] Sticky action bar: RUN AI / CHAT
- [ ] Run full verification: build + lint 0 errors + tests 79/79
- [ ] Push to `main` branch directly (confident — all green)
- [ ] Vercel: check deployment on `volt-code-ai-v5-0.vercel.app`
- [ ] Confirm zero deployment errors
- [ ] Record rejected-PR lessons in `AGENT_LESSONS.md`
- [ ] Short bullet summary + ready for next task

---

## Current State (already complete)
- [x] `src/context/VoltContext.tsx` — shared state + `useVolt()` hook
- [x] `main.tsx` — wrapped in `<VoltProvider>`
- [x] `src/components/views/EditorView.tsx` — extracted editor view
- [x] `src/components/views/IDECanvasView.tsx` — extracted IDE canvas
- [x] `src/components/views/SwarmView.tsx` — extracted swarm view
- [x] `src/components/views/AgentMeetingView.tsx` — extracted agents view
- [x] `src/components/views/HubView.tsx` — extracted hub view
- [x] `src/components/ResponsiveContainer.tsx` — 5-tab bottom dock + clearance
- [x] `App.tsx` reduced: 4,665 → 3,893 lines
- [x] Verified: build ✅, lint 0 errors ✅, tests 79/79 ✅, pushed to `main` ✅

---

## Verification Gates (every task)
1. `npm run build` — must pass with 0 TS errors
2. `npm run lint` — must be 0 errors (warnings OK)
3. `npx vitest run` — must be 79/79 pass
4. Push to `main` only when all 3 green
5. Vercel deployment check — zero errors
