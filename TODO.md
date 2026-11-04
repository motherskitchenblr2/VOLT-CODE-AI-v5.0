# TODO — VOLT CODE AI v6.0 Complete Refactor Roadmap

## Phase A — Critical Foundation (UI/UX Pro Max Design System) — COMPLETE ✅

- [x] A1: Design system CSS variables in `app.css` (--ds-color-*, --ds-space-*, --ds-shadow-*, --ds-radius-*, --ds-z-*)
- [x] A2: Base UI components in `src/components/ui/` (Button, Card, Panel, Input, Modal)
- [x] A3: Focus states & accessibility (focus-visible ring using --ds-color-ring)
- [x] A4: Unified modal z-index system (--ds-z-dropdown through --ds-z-tooltip)
- [x] A5: Typography (Google Fonts: JetBrains Mono + IBM Plex Sans)

## Phase B — View Refactoring with Design System (one view at a time)

- [x] B-1: Refactor EditorView.tsx → design system tokens + UI components
- [x] B-2: Refactor SentinelView.tsx → design system tokens + UI components
- [x] B-3: Refactor SettingsView.tsx → design system tokens + UI components
- [x] B-4: Refactor GitHubView.tsx → design system tokens + UI components
- [ ] B-5: Refactor MeetingView.tsx → design system tokens + UI components
- [ ] B-6: Refactor IDECanvasView.tsx → design system tokens + UI components
- [ ] B-7: Refactor HubView.tsx → design system tokens + UI components
- [ ] B-8: Refactor HistoryView.tsx → design system tokens + UI components
- [ ] B-9: Refactor SwarmView.tsx → design system tokens + UI components
- [ ] B-10: Refactor AboutView.tsx → design system tokens + UI components
- [ ] B-11: Refactor ResponsiveContainer.tsx shell → design system tokens
- [ ] B-12: Remove unused inline render* functions from App.tsx

## Phase C — Slim Shell + Deploy

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

## Current State

- `src/context/VoltContext.tsx` — shared state + `useVolt()` hook
- `main.tsx` — wrapped in `<VoltProvider>`
- `src/components/ui/Button.tsx` — design system button component
- `src/components/ui/Card.tsx` — design system card component
- `src/components/ui/Panel.tsx` — design system panel component
- `src/components/ui/Input.tsx` — design system input component
- `src/components/ui/Modal.tsx` — design system modal component
- `src/components/views/EditorView.tsx` — refactored with design system tokens
- `src/components/views/*.tsx` — 12 other views awaiting refactor
- `design-system/volt-code-ai/MASTER.md` — design system specification

## Verification Gates (every task)

1. `npm run build` — must pass with 0 TS errors
2. `npm run lint` — must be 0 errors (warnings OK)
3. `npx vitest run` — must be 79/79 pass
4. Push to `main` only when all 3 green
5. Vercel deployment check — zero errors

---

## Verification Status

- Build: ✅ Pass
- Lint: ✅ 0 errors (8 pre-existing warnings)
- Tests: ✅ 79/79 pass
- Pushed to main: ✅
