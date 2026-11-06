# TODO — VOLT CODE AI v6.0 Complete Refactor Roadmap

## Phase A — Critical Foundation — COMPLETE ✅
- [x] A1: Design system CSS variables in app.css
- [x] A2: Base UI components (Button, Card, Panel, Input, Modal)
- [x] A3: Focus states & accessibility
- [x] A4: Unified modal z-index system
- [x] A5: Typography (JetBrains Mono + IBM Plex Sans)

## Phase B — View Extraction — COMPLETE ✅
- [x] B-1: EditorView.tsx refactored with design system tokens
- [x] B-2: SentinelView.tsx refactored with design system tokens
- [x] B-3: SettingsView.tsx refactored with design system tokens
- [x] B-4: GitHubView.tsx refactored with design system tokens
- [x] B-5: MeetingView.tsx refactored with design system tokens
- [x] B-6: IDECanvasView.tsx refactored with design system tokens
- [x] B-7: HubView.tsx refactored with design system tokens
- [x] B-8: HistoryView.tsx refactored with design system tokens
- [x] B-9: SwarmView.tsx refactored with design system tokens
- [x] B-10: AboutView.tsx refactored with design system tokens
- [x] B-11: ResponsiveContainer.tsx shell (mobile dock, desktop rail, sticky header)
- [x] B-12: Views use design system tokens + UI components

## Phase C — Slim Shell + Mobile Fix + Deploy — IN PROGRESS 🔄
- [ ] C-1: Replace App.tsx monolith with slim shell router (< 400 lines, down from 2382)
- [ ] C-2: Bottom dock: 5 tabs with min 44×44px touch targets + pb-28 clearance (in ResponsiveContainer)
- [ ] C-3: Top bar: brand + active engine pill + sentinel pill + theme toggle (in ResponsiveContainer)
- [ ] C-4: Sticky action bar: RUN AI / CHAT
- [ ] C-5: Fix mobile scrolling (whole page scroll → contained scroll)
- [ ] C-6: Run full verification: build + lint 0 errors + tests 79/79
- [ ] C-7: Push to main branch directly
- [ ] C-8: Vercel deployment check on volt-code-ai-v5-0.vercel.app
- [ ] C-9: Confirm zero deployment errors
- [ ] C-10: Record rejected-PR lessons in AGENT_LESSONS.md
- [ ] C-11: Short bullet summary + ready for next task

---

## Current State
- `src/context/VoltContext.tsx` — shared state + useVolt() hook
- `main.tsx` — wrapped in `<VoltProvider>`
- `src/components/ui/Button.tsx` — design system button component
- `src/components/ui/Card.tsx` — design system card component
- `src/components/ui/Panel.tsx` — design system panel component
- `src/components/ui/Input.tsx` — design system input component
- `src/components/ui/Modal.tsx` — design system modal component
- `src/components/ui/index.ts` — barrel export
- `src/components/views/*.tsx` — 10 views refactored with design system tokens
- `src/components/ResponsiveContainer.tsx` — shell with bottom dock, top bar, desktop rail
- `design-system/volt-code-ai/MASTER.md` — design system specification

## Verification Gates (every task)
1. `npm run build` — must pass with 0 TS errors
2. `npm run lint` — must be 0 errors (warnings OK)
3. `npx vitest run` — must be 79/79 pass
4. Push to main only when all 3 green
5. Vercel deployment check — zero errors

## Verification Status
- Build: ⏳ Pending
- Lint: ⏳ Pending
- Tests: ⏳ Pending
- Pushed to main: ⏳ Pending
