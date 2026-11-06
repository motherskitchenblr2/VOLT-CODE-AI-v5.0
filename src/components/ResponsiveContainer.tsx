import React, { useState, useEffect } from "react";
import {
  Play,
  Sparkles,
  Bot,
  Users,
  GitPullRequest,
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
  ["swarm", "Swarm", <Bot className="w-5 h-5" />],
  ["meeting", "Agents", <Users className="w-5 h-5" />],
  ["hub", "Hub", <GitPullRequest className="w-5 h-5" />],
];

/**
 * Clean mobile-first shell.
 *   Mobile (<1024): bottom tab bar with 5 tabs, 44px+ touch targets.
 *   Tablet (1024-1279): left icon rail.
 *   Desktop (≥1280): left labeled sidebar + content + diagnostics + terminal drawer.
 *   Single content scroller — no nested overflow containers.
 *   Hub tab consolidates Git-Room, Sentinel, Settings, Admin.
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
  const [windowWidth, setWindowWidth] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => setWindowWidth(window.innerWidth);
    handleResize(); // initial
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const title = NAV.find(([v]) => v === currentView)?.[1] ?? "Editor";
  const isMobile = windowWidth > 0 && windowWidth < 1024;
  const isTablet = windowWidth > 0 && windowWidth >= 1024 && windowWidth < 1280;
  const isDesktop = windowWidth >= 1280;

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
        className={`flex flex-col items-center justify-center gap-1 min-w-[72px] px-3 py-4 rounded-xl border transition-all cursor-pointer ${
          active
            ? "bg-[var(--color-accent)] text-black border-transparent shadow-[var(--shadow-glow)]"
            : "text-[var(--color-muted-foreground)] border-transparent hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)]"
        }`}
        style={{ minHeight: "44px" }}
      >
        {icon}
        <span className="text-[10px] font-bold tracking-widest uppercase">
          {label}
        </span>
      </button>
    );
  };

  const tabletNavItem = ([view, label, icon]: NavItem) => {
    const active = currentView === view;
    return (
      <button
        key={view}
        data-view={view}
        onClick={() => setCurrentView(view)}
        aria-current={active ? "page" : undefined}
        className={`flex flex-col items-center justify-center gap-1 w-full px-2 py-3 rounded-xl transition-all cursor-pointer ${
          active
            ? "bg-[var(--color-accent)] text-black border-transparent"
            : "text-[var(--color-muted-foreground)] border-transparent hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)]"
        }`}
        style={{ minHeight: "44px" }}
      >
        {icon}
        <span className="text-[9px] font-bold tracking-widest uppercase">
          {label}
        </span>
      </button>
    );
  };

  const desktopNavItem = ([view, label, icon]: NavItem) => {
    const active = currentView === view;
    return (
      <button
        key={view}
        data-view={view}
        onClick={() => setCurrentView(view)}
        aria-current={active ? "page" : undefined}
        className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-left transition-all cursor-pointer border-l-4 ${
          active
            ? "bg-[var(--color-accent)] text-black border-transparent pl-3"
            : "text-[var(--color-muted-foreground)] border-transparent hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)] pl-4"
        }`}
        style={{ minHeight: "44px" }}
      >
        {icon}
        <span className="text-[11px] font-bold tracking-widest">
          {label}
        </span>
      </button>
    );
  };

  return (
    <div className="flex h-[100dvh] w-full flex-col md:flex-row overflow-hidden bg-[var(--color-background)] text-[var(--color-foreground)]">
      {/* ── TABLET RAIL (icon-only, 1024–1279) ── */}
      {isTablet && (
        <aside className="md:flex xl:hidden w-20 flex-col shrink-0 border-r border-[var(--color-border)] bg-[var(--color-background)] py-4 px-1 gap-1 overflow-y-auto">
          {NAV.map(tabletNavItem)}
        </aside>
      )}

      {/* ── LAPTOP SIDEBAR (≥1280): full labels ── */}
      {isDesktop && (
        <div className="xl:flex shrink-0 h-full overflow-y-auto">
          <div className="w-56 border-r border-[var(--color-border)] bg-[var(--color-background)] overflow-y-auto flex flex-col">
            <div className="p-4 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-2 mb-4">
                <Play className="w-5 h-5 text-[var(--color-accent)]" />
                <span className="font-black tracking-widest text-[var(--color-accent)] text-[11px]">
                  VOLT
                </span>
              </div>
            </div>
            <nav className="flex-1 overflow-y-auto">
              {NAV.map(desktopNavItem)}
            </nav>
            <div className="p-4 border-t border-[var(--color-border)]">
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN STAGE ── */}
      <div className="flex-1 flex flex-col overflow-hidden relative min-w-0">
        {/* Mobile header: hamburger + title + theme (hidden on desktop where sidebar exists) */}
        <header className="xl:hidden h-14 shrink-0 border-b border-[var(--color-border)] bg-[var(--color-background)] flex items-center justify-between px-3">
          <button
            onClick={() => setNavOpen(true)}
            className="icon-btn bg-[var(--color-accent)] text-black hover:bg-[var(--color-accent-hover)]"
            aria-label="Open navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <span className="block text-sm font-bold tracking-widest text-[var(--color-foreground)] truncate uppercase">
              {title.toUpperCase()}
            </span>
            <span className="block text-[10px] text-[var(--color-muted-foreground)] font-semibold tracking-wider">
              {currentView.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[var(--color-muted-foreground)] shrink-0">
            <ThemeToggle compact />
            {sentinelLevel && sentinelLabel && (
              <div
                className={`flex items-center gap-1.5 px-2 py-1 rounded-xl border shrink-0 text-[10px] font-bold ${
                  sentinelLevel === "green"
                    ? "bg-[var(--color-success-soft)] text-[var(--color-success)] border-[var(--color-success)]"
                    : sentinelLevel === "yellow"
                      ? "bg-[var(--color-warning-soft)] text-[var(--color-warning)] border-[var(--color-warning)]"
                      : "bg-[rgba(239,68,68,0.15)] text-red-400 border-[rgba(239,68,68,0.3)]"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    sentinelLevel === "green"
                      ? "bg-[var(--color-success)]"
                      : sentinelLevel === "yellow"
                        ? "bg-[var(--color-warning)]"
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
          {isDesktop ? (
            <aside className="xl:block w-80 shrink-0 overflow-y-auto border-l border-[var(--color-border)] bg-[var(--color-card)] p-4">
              {diagnostics}
            </aside>
          ) : null}
        </div>

        {/* Terminal drawer — desktop only */}
        {isDesktop && (
          <footer className="xl:flex h-56 shrink-0 border-t border-[var(--color-border)] bg-[var(--color-background)]">
            {terminal}
          </footer>
        )}

        {/* ── MOBILE BOTTOM TAB BAR — 5 TABS ── */}
        {isMobile && (
          <nav
            className="xl:hidden shrink-0 border-t border-[var(--color-border)] bg-[var(--color-background)] backdrop-blur-md z-50 pb-safe"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <div className="flex items-stretch gap-0 px-1" style={{ minHeight: "56px" }}>
              {NAV.map(tabItem)}
            </div>
          </nav>
        )}

        {/* ── TABLET BOTTOM TAB BAR (1024–1279) — 5 TABS ── */}
        {isTablet && (
          <nav
            className="xl:hidden md:flex hidden shrink-0 border-t border-[var(--color-border)] bg-[var(--color-background)] backdrop-blur-md z-50"
            style={{ minHeight: "56px" }}
          >
            <div className="flex items-stretch gap-0 px-1 w-full" style={{ minHeight: "56px" }}>
              {NAV.map(tabItem)}
            </div>
          </nav>
        )}
      </div>

      {/* NAV DRAWER — mobile full-screen overlay */}
      {navOpen && (
        <div className="md:hidden fixed inset-0 z-[95] flex flex-col">
          <div
            className="absolute inset-0 bg-[var(--color-background)]/60 backdrop-blur-md"
            onClick={() => setNavOpen(false)}
          />
          <div className="relative w-full max-w-[90vw] h-full bg-[var(--color-background)] border-r border-[var(--color-border)] flex flex-col">
            <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--color-border)] shrink-0">
              <div className="flex items-center gap-2">
                <Play className="w-5 h-5 text-[var(--color-accent)]" />
                <span className="font-black tracking-widest text-[var(--color-accent)] text-[11px]">
                  VOLT v5
                </span>
              </div>
              <button
                onClick={() => setNavOpen(false)}
                className="icon-btn hover:bg-[var(--color-accent-soft)]"
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
                        ? "bg-[var(--color-accent)] text-black border-transparent font-bold"
                        : "text-[var(--color-muted-foreground)] border-transparent hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)]"
                    }`}
                    style={{ minHeight: "44px" }}
                  >
                    {icon}
                    <span className="text-[12px] font-bold tracking-wider">
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="p-4 border-t border-[var(--color-border)]">
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};