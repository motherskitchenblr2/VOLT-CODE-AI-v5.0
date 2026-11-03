import React, { useState } from "react";
import {
  Play,
  Sparkles,
  Bot,
  Users,
  Shield,
  GitPullRequest,
  GitBranch,
  History,
  Settings,
  HelpCircle,
  Activity,
  Menu,
  X,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

interface ResponsiveContainerProps {
  content: React.ReactNode;
  terminal: React.ReactNode;
  diagnostics: React.ReactNode;
  currentView: string;
  setCurrentView: (view: string) => void;
  sentinelLevel?: "green" | "yellow" | "red";
  sentinelLabel?: string;
}

type NavItem = [view: string, label: string, icon: React.ReactNode];

const NAV: NavItem[] = [
  ["editor", "Editor", <Play className="w-5 h-5" />],
  ["ide", "IDE Canvas", <Sparkles className="w-5 h-5" />],
  ["swarm", "Agent Swarm", <Bot className="w-5 h-5" />],
  ["meeting", "Agents", <Users className="w-5 h-5" />],
  ["sentinel", "Sentinel", <Shield className="w-5 h-5" />],
  ["pr-review", "PR Review", <GitPullRequest className="w-5 h-5" />],
  ["github", "GitHub", <GitBranch className="w-5 h-5" />],
  ["repo-ops", "Repo Ops", <GitPullRequest className="w-5 h-5" />],
  ["history", "History", <History className="w-5 h-5" />],
  ["admin", "Admin", <Settings className="w-5 h-5" />],
  ["settings", "Settings", <HelpCircle className="w-5 h-5" />],
  ["about", "About", <Activity className="w-5 h-5" />],
];

/**
 * Clean mobile-first shell.
 *   Mobile (<1024): bottom scrollable tab bar with ALL 12 tabs, 44px+ touch targets.
 *   Tablet (1024-1279): left icon rail.
 *   Desktop (≥1280): left labeled sidebar + content + diagnostics + terminal drawer.
 *   Single content scroller — no nested overflow containers.
 *   No slide-up sheets, no nav drawer, no MORE menu hiding tabs.
 */
export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  content,
  terminal,
  diagnostics,
  currentView,
  setCurrentView,
  sentinelLevel,
  sentinelLabel,
}) => {
  const [navOpen, setNavOpen] = useState(false);
  const title = NAV.find(([v]) => v === currentView)?.[1] ?? "Editor";

  const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;

  const tabItem = ([view, label, icon]: NavItem) => {
    const active = currentView === view;
    return (
      <button
        key={view}
        data-view={view}
        onClick={() => {
          setCurrentView(view);
          if (isMobile) setNavOpen(false);
        }}
        aria-current={active ? "page" : undefined}
        className={`flex flex-col items-center justify-center gap-1 min-w-[72px] px-3 py-3 rounded-xl border transition-all cursor-pointer ${
          active
            ? "vol-acc-bg text-black border-transparent shadow-[0_0_15px_rgba(255,95,0,0.3)]"
            : "vol-t2 border-transparent hover:vol-wash hover:bg-neutral-800/50"
        }`}
      >
        {icon}
        <span className="text-[10px] font-bold tracking-widest uppercase">
          {label}
        </span>
      </button>
    );
  };

  return (
    <div className="flex h-[100dvh] w-full flex-col md:flex-row overflow-hidden vol-surface vol-t1">
      {/* ── TABLET RAIL (icon-only, 1024–1279) ── */}
      <aside className="hidden md:flex xl:hidden md:w-20 flex-col shrink-0 border-r vol-ring vol-surface py-4 px-1 gap-1 overflow-y-auto">
        {NAV.map(([view, label, icon]) => {
          const active = currentView === view;
          return (
            <button
              key={view}
              data-view={view}
              onClick={() => setCurrentView(view)}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center justify-center gap-1 w-full px-2 py-2.5 rounded-xl transition-all cursor-pointer ${
                active
                  ? "vol-acc-bg text-black border-transparent"
                  : "vol-t2 border-transparent hover:vol-wash hover:bg-neutral-800/50"
              }`}
            >
              {icon}
              <span className="text-[9px] font-bold tracking-widest uppercase">
                {label}
              </span>
            </button>
          );
        })}
      </aside>

      {/* ── LAPTOP SIDEBAR (≥1280): full labels ── */}
      <div className="hidden xl:flex shrink-0 h-full overflow-y-auto">
        <div className="w-56 border-r vol-ring vol-surface overflow-y-auto flex flex-col">
          <div className="p-4 border-b vol-ring">
            <div className="flex items-center gap-2 mb-4">
              <Play className="w-5 h-5 vol-accent" />
              <span className="font-black tracking-widest vol-accent text-[11px]">
                VOLT
              </span>
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto">
            {NAV.map(([view, label, icon]) => {
              const active = currentView === view;
              return (
                <button
                  key={view}
                  data-view={view}
                  onClick={() => setCurrentView(view)}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-left transition-all cursor-pointer border-l-4 ${
                    active
                      ? "vol-acc-bg text-black border-transparent pl-3"
                      : "vol-t2 border-transparent hover:vol-wash hover:bg-neutral-800/50 pl-4"
                  }`}
                >
                  {icon}
                  <span className="text-[11px] font-bold tracking-widest">
                    {label}
                  </span>
                </button>
              );
            })}
          </nav>
          <div className="p-4 border-t vol-ring">
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* ── MAIN STAGE ── */}
      <div className="flex-1 flex flex-col overflow-hidden relative min-w-0">
        {/* Mobile header: hamburger + title + theme (hidden on desktop where sidebar exists) */}
        <header className="xl:hidden h-14 shrink-0 border-b vol-ring vol-surface flex items-center justify-between px-3">
          <button
            onClick={() => setNavOpen(true)}
            className="cursor-pointer w-10 h-10 flex items-center justify-center rounded-xl vol-accent hover:vol-acc-wash"
            aria-label="Open navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <span className="block text-sm font-bold tracking-widest vol-t1 truncate uppercase">
              {title.toUpperCase()}
            </span>
            <span className="block text-[10px] vol-t2 font-semibold tracking-wider">
              {currentView.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-1 vol-t2 shrink-0">
            <ThemeToggle compact />
            {sentinelLevel && sentinelLabel && (
              <div
                className={`flex items-center gap-1.5 px-2 py-1 rounded-xl border shrink-0 text-[10px] font-bold ${
                  sentinelLevel === "green"
                    ? "vol-well vol-t1"
                    : sentinelLevel === "yellow"
                      ? "vol-acc-wash vol-accent"
                      : "bg-red-500/20 border-red-500/40 text-red-400"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    sentinelLevel === "green"
                      ? "bg-green-500"
                      : sentinelLevel === "yellow"
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  }`}
                ></span>
                {sentinelLabel}
              </div>
            )}
          </div>
        </header>

        {/* Content — single scroller, no nesting */}
        <div className="flex-1 flex overflow-hidden relative">
          <section className="flex-1 overflow-y-auto min-w-0">
            {content}
          </section>
          {typeof window === "undefined" || window.innerWidth >= 1280 ? (
            <aside className="hidden xl:block w-80 shrink-0 overflow-y-auto border-l vol-line vol-elev p-4">
              {diagnostics}
            </aside>
          ) : null}
        </div>

        {/* Terminal drawer — desktop only */}
        <footer className="hidden xl:flex h-56 shrink-0 border-t vol-ring vol-surface">
          {terminal}
        </footer>

        {/* ── MOBILE BOTTOM TAB BAR — ALL 12 TABS, scrollable ── */}
        <nav
          className="xl:hidden h-20 shrink-0 border-t vol-ring vol-surface backdrop-blur-md z-50"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="flex items-stretch gap-0.5 overflow-x-auto no-scrollbar px-1">
            {NAV.map(tabItem)}
          </div>
        </nav>
      </div>

      {/* NAV DRAWER — mobile full-screen overlay */}
      {navOpen && (
        <div className="md:hidden fixed inset-0 z-[95] flex flex-col">
          <div
            className="absolute inset-0 vol-veil"
            onClick={() => setNavOpen(false)}
          />
          <div className="relative w-full max-w-[90vw] h-full vol-surface border-r vol-ring flex flex-col">
            <div className="flex items-center justify-between px-4 py-4 border-b vol-ring shrink-0">
              <div className="flex items-center gap-2">
                <Play className="w-5 h-5 vol-accent" />
                <span className="font-black tracking-widest vol-accent text-[11px]">
                  VOLT v5
                </span>
              </div>
              <button
                onClick={() => setNavOpen(false)}
                className="cursor-pointer vol-t2 w-10 h-10 flex items-center justify-center rounded-lg"
                aria-label="Close navigation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 gap-1">
              {NAV.map(([view, label, icon]) => {
                const active = currentView === view;
                return (
                  <button
                    key={view}
                    data-view={view}
                    onClick={() => {
                      setCurrentView(view);
                      setNavOpen(false);
                    }}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left cursor-pointer border transition-all ${
                      active
                        ? "vol-acc-bg text-black border-transparent font-bold"
                        : "vol-t2 border-transparent hover:vol-wash"
                    }`}
                  >
                    {icon}
                    <span className="text-[12px] font-bold tracking-wider">
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="p-4 border-t vol-ring">
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
