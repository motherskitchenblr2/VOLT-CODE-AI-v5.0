# VOLT CODE AI v6.0 — Design Document & Implementation Plan

## Phase 0: Current State Audit

**Current State:** Single-file `App.tsx` (4,665 lines) with 12 view functions inline. ResponsiveContainer shell with bottom dock. Separate components for SwarmPanel, MeetingPanel, etc. Dual-theme (day/dark neumorphic). Tests: 79 passing. Build: pass.

**What Works:**
- Editor with language detection, split view, line numbers
- Agent Swarm SVG graph with node pulsing
- Meeting/Chat panel with agent messages
- RepoOps cockpit with PR review, conflict fixing, security sweep
- Settings, Admin, About pages
- Sentinel security scanning with CSS rule-based detection

**What Needs Rebuild:**
- Single-file App.tsx (4.6K lines) — needs extraction into view components
- Mobile UI is functional but not "premium" — needs mobile-first redesign
- No persistent agent swarm gallery with selectable agents
- No WhatsApp-style group chat for agents
- No Git-Room dedicated tab with full GitHub repo management
- No animated agent avatars with blinking states
- Settings/Admin are basic forms, not premium dashboards
- No 3D/animated depth — flat CSS only

---

## Phase 1: Design System (Token Layer)

### Color Palette (Dual Theme)

| Token | Day (Light) | Dark (OLED) | Usage |
|-------|-------------|-------------|-------|
| `--bg` | `#f8fafc` | `#0a0a0b` | App canvas |
| `--panel` | `#ffffff` | `#161616` | Card surfaces |
| `--elev` | `#f1f5f9` | `#1e1e1e` | Elevated panels |
| `--line` | `#e2e8f0` | `#2d333b` | Borders |
| `--accent` | `#ff5f00` | `#ff5f00` | Primary accent (neon orange) |
| `--acc-wash` | `rgba(255,95,0,0.12)` | `rgba(255,95,0,0.12)` | Accent background wash |
| `--text-main` | `#0f172a` | `#e2e8f0` | Primary text |
| `--text-muted` | `#64748b` | `#94a3b8` | Secondary text |
| `--ring` | `rgba(255,95,0,0.3)` | `rgba(255,95,0,0.4)` | Focus ring |
| `--success` | `#22c55e` | `#22c55e` | Success states |
| `--warning` | `#f59e0b` | `#f59e0b` | Warning states |
| `--error` | `#ef4444` | `#ef4444` | Error states |

### Typography
- **Display:** Inter, system-ui, sans-serif (headings 48px–96px)
- **Body:** Inter, system-ui, sans-serif (16px base, 1.5 line-height)
- **Mono:** ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace (code)

### Spacing Scale
- `--space-1: 4px`, `--space-2: 8px`, `--space-3: 12px`, `--space-4: 16px`, `--space-6: 24px`, `--space-8: 32px`

### Touch Targets
- Minimum 44×44px on all touch targets (ponytail rule #2)

---

## Phase 2: Target Architecture

### Component Tree (New Structure)

```
src/
├── App.tsx                    # Shell only: theme, auth, global state, ViewRouter
├── src/components/views/
│   ├── EditorView.tsx         # Code editor + AI assistant panel
│   ├── IDECanvasView.tsx      # True IDE with file tree + editor
│   ├── SwarmView.tsx          # Agent swarm gallery + animated nodes
│   ├── AgentChatView.tsx      # WhatsApp-style multi-agent chat
│   ├── GitRoomView.tsx        # GitHub repo management + PR review
│   ├── SentinelView.tsx       # Security monitoring dashboard
│   ├── SettingsView.tsx       # App settings
│   ├── AdminView.tsx          # Master admin dashboard
│   └── AboutView.tsx          & About & Privacy Policy
├── src/components/common/
│   ├── AppShell.tsx           # Shell: nav rail + bottom tab bar
│   ├── BottomNav.tsx          # Mobile bottom tab bar (all tabs visible)
│   ├── NavRail.tsx            # Desktop left sidebar rail
│   ├── TopBar.tsx             # Mobile/tablet header
│   ├── AgentAvatar.tsx        # Animated avatar with blink state
│   ├── AgentCard.tsx          # Gallery card for agent selection
│   ├── MessageBubble.tsx      # WhatsApp-style chat bubble
│   ├── CodeEditor.tsx         # Monaco-like textarea with line numbers
│   ├── DiffViewer.tsx         # Side-by-side diff viewer
│   ├── MetricCard.tsx         # Stat card (count, label, trend)
│   └── ThemeToggle.tsx        # Day/dark toggle
├── src/lib/
│   ├── detectLanguage.ts      (existing)
    *   ├── smartRouter.ts      (existing)
    *   ├── injectionScan.ts    (existing)
    *   ├── repoAgent.ts        (existing)
    *   ├── conflictResolver.ts (existing)
    *   ├── sentinel/           (existing analyzers)
    *   └── githubClient.ts     (NEW: GitHub API wrapper)
├── src/services/
│   ├── GitHubManager.ts      (existing - kept)
    *   ├── PermissionSystem.ts (existing)
    *   ├── RepoOpsPanel.tsx    → moved to view
    *   └── ...
├── src/hooks/
│   ├── useApiGateway.ts      (existing)
    *   ├── useLiveProviderModels.ts (existing)
    *   ├── useAuth.ts          (NEW: auth state)
    *   └── useTheme.ts         (NEW: theme state)
```

### Key Design Decisions

1. **Single-page app**: All views render conditionally in `App.tsx` main container
2. **Mobile-first**: Bottom tab bar on mobile (<1024px), left rail on tablet/desktop
3. **No nested scrollers**: Single scroll container per view
4. **Theme-first**: Dual theme (day/dark) with CSS variables
5. **Component library**: Reuse `ResponsiveContainer`, `SplitEditorLayout`, `SwarmPanel`, `MeetingPanel`, `RepoOpsPanel` where possible — extract into new view components

---

## Phase 3: Tab-by-Tab Specifications

### 1. Editor Tab (Default)
**Design:** Google AI Studio mobile-inspired
- Full-width code editor with sticky line numbers
- Top toolbar: Language selector, Mode selector (manual/assist/auto), Plugin, Skill
- Bottom sticky action bar: [RUN AI] [AGENT CHAT] [APPLY FIXES]
- Diff viewer side panel (toggleable)
- Line numbers sticky, scroll-synced
- Mobile: Bottom sticky action bar, horizontal scroll rail for controls

### 2. IDE Canvas Tab
**Design:** True IDE layout
- Left: File tree explorer (virtualized tree)
- Center: Code editor (Monaco-style textarea)
- Right: Split preview/diff panel
- Bottom: Terminal/output panel
- File tabs at top for multiple open files

### 3. Agent Swarm Tab
**Design:** Gallery + Canvas
- Top: Gallery of agent cards (selectable cards with avatars)
- Center: Hub-and-spoke SVG graph with animated nodes
- Right: Selected agent details panel
- Bottom: Swarm stats (consensus score, active count)
- Animation: Nodes pulse when active, glow when selected

### 4. Agents Tab (Chat Room)
**Design:** WhatsApp-style group chat
- Left: Agent list (avatars with online status)
- Center: Chat thread with message bubbles (agent-colored)
- Right: Selected agent details & controls
- Bottom: Message input + send
- Animation: Agents "typing" indicator, avatar pulse when speaking

### 5. Git-Room Tab
**Design:** GitHub repo management dashboard
- Left: Repo list + file tree
- Center: File editor + PR review panel
- Right: PR list, conflict markers, merge buttons
- Bottom: Security scan results, dependency alerts
- Features: Checkout branches, create PR, review diffs, approve/merge, conflict fix

### 6. Sentinel Tab
**Design:** Security dashboard
- Top: Risk score gauge, critical/high/medium/low counts
- Center: Findings list with severity color coding
- Right: Selected finding details + fix suggestion
- Bottom: Scan history, auto-scan toggle
- Features: Real-time scanning, CVE detection, dependency audit

### 7. Settings Tab
**Design:** Settings dashboard
- Sections: General, Appearance, API Keys, Editor, Security, Notifications
- Toggle switches, text inputs, dropdowns
- Export/Import settings
- Dark mode toggle prominent

### 8. Admin Tab
**Design:** Master control panel
- Left: System status, user list
- Center: Permission matrix, role assignments
- Right: System logs, audit trail
- Bottom: Emergency controls (halt system, emergency stop)
- Features: Per-repo policies, member management, role permissions

### 9. About Tab
**Design:** Marketing page
- Hero section with VOLT branding
- Feature list with icons
- Version info, license, team credits
- Privacy policy link, terms of service
- Changelog

---

## Phase 4: Tech Stack Decisions (Ponytail Compliant)

| Decision | Choice | Reason |
|----------|--------|--------|
| Framework | React 19 + Vite | Already in repo, no new deps |
| Styling | Tailwind CSS + CSS variables | Already in repo, dual-theme ready |
| Icons | Lucide React | Already installed |
| Animations | Framer Motion | Already installed |
| State | React useState/useReducer | Already available, no new deps |
| Icons | Lucide React | Already installed |
| Forms | Controlled inputs | No form library needed |
| Charts | None needed | YAGNI |
| Icons | Lucide icons only | No emoji, per design rules |

**No new dependencies.** Everything uses existing deps.

---

## Phase 5: Implementation Plan (Phased)

### Phase A: Design System & Shell (Week 1)
1. Create `src/lib/theme.ts` — theme tokens, dark/light mode
2. Create `src/components/ui/` — base components (Button, Card, Badge, Avatar, Button)
3. Create `src/components/views/EditorView.tsx` — extract from App.tsx
4. Create `src/components/views/IDECanvasView.tsx` — new IDE view
5. Update `App.tsx` — shell only, route to views

### Phase B: Core Views (Week 2)
1. `SwarmView.tsx` — rewrite with gallery + animated nodes
2. `MeetingView.tsx` — WhatsApp-style chat
3. `GitRoomView.tsx` — GitHub dashboard
4. `SentinelView.tsx` — Security dashboard

### Phase C: Admin & Polish (Week 3)
1. `AdminView.tsx` — Master control panel
2. `SettingsView.tsx` — Settings dashboard
3. `AboutView.tsx` — About & Privacy
4. Mobile responsiveness fixes
5. Animation polish (framer-motion)

### Phase D: Testing & Polish (Week 4)
1. Cross-viewport testing (375px, 768px, 1024px, 1440px)
2. Accessibility audit (focus rings, contrast, keyboard nav)
3. Performance audit (bundle size, render time)
4. Bug fixes

---

## Phase 5: Key Design Decisions (Ponytail Applied)

| Decision | Choice | Reason |
|----------|--------|--------|
| State management | React useState/useReducer | Already in repo, no new deps |
| CSS | Tailwind + CSS variables | Already in repo |
| Animations | Framer Motion | Already installed |
| Icons | Lucide React | Already installed |
| Code splitting | None (single bundle) | YAGNI for this scale |
| State library | None (React Context/useState) | YAGNI |
| Form library | None (controlled inputs) | YAGNI |
| Charts | None needed | YAGNI |
| Animations | Framer Motion only | Already installed |
| Icons | Lucide icons only | No emoji, per design rules |

---

## Phase 6: Definition of Done

- [ ] All 9 tabs render correctly on mobile (375px), tablet (768px), desktop (1440px)
- [ ] All 44px+ touch targets on mobile
- [ ] Dark mode toggle works across all views
- [ ] Agent swarm has animated pulsing nodes
- [ ] Agent chat has real-time message bubbles
- [ ] Git-Room has repo file tree + PR list
- [ ] Sentinel has risk score + issue list
- [ ] Settings has all toggle/inputs working
- [ ] Admin has per-repo policy controls
- [ ] About has version, credits, privacy link
- [ ] Build passes, tests pass, lint 0 errors
- [ ] No console errors in browser

---

## Next Steps

1. **Create `src/lib/theme.ts`** — theme tokens (CSS variables + JS object)
2. **Create `src/components/ui/`** — base UI components
3. **Create `src/components/views/EditorView.tsx`** — extract from App.tsx
4. **Update `App.tsx`** — shell only, route to views
5. **Create remaining views** one at a time
6. **Test on 3 viewports** after each view

**Current status:** Ready to start implementation. main branch is clean, build passes, tests pass (79/79), lint 0 errors.
