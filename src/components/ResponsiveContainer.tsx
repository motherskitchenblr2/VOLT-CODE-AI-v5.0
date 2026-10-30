import React, { useState } from "react";
import {
  Play,
  Bot,
  Users,
  Sparkles,
  Shield,
  GitBranch,
  GitPullRequest,
  Wrench,
  Crown,
  History,
  Settings,
  HelpCircle,
  Terminal,
  Activity,
  Menu,
  X,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

interface ResponsiveContainerProps {
  sidebar: React.ReactNode;
  content: React.ReactNode;
  terminal: React.ReactNode;
  diagnostics: React.ReactNode;
  currentView: string;
  setCurrentView: (view: string) => void;
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
  ["history", "History", <History className="w-5 h-5" />],
  ["admin", "Admin", <Wrench className="w-5 h-5" />],
  ["settings", "Settings", <Settings className="w-5 h-5" />],
  ["about", "About", <HelpCircle className="w-5 h-5" />],
];

/**
 * Adaptive shell — three aspect contracts from ONE layout tree:
 *   9:16 phone  (<1024): single column + bottom tab bar + slide-up sheets
 *   4:4 tablet  (1024-1279): icon rail + full content + sheets
 *   16:9 laptop (≥1280): labeled rail + content + diagnostics + terminal drawer
 * All pane show/hide via CSS breakpoints; ponytail: no JS resize listeners.
 */
export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  sidebar,
  content,
  terminal,
  diagnostics,
  currentView,
  setCurrentView,
}) => {
  const [sheet, setSheet] = useState<"none" | "terminal" | "diagnostics">("none");
  const [navOpen, setNavOpen] = useState(false);
  const title = NAV.find(([v]) => v === currentView)?.[1] ?? "Editor";

  const railItem = ([view, label, icon]: NavItem) => (
    <button
      key={view}
      onClick={() => setCurrentView(view)}
      className={`group flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
        currentView === view
          ? "vol-acc-bg text-black"
          : "vol-accent-soft hover:vol-wash"
      }`}
    >
      {icon}
      <span className="hidden xl:inline text-[11px] font-bold tracking-wider">
        {label}
      </span>
    </button>
  );

  return (
    <div className="flex h-[100dvh] w-full flex-col md:flex-row overflow-hidden vol-surface vol-t1">
      {/* ── TABLET RAIL (icon-only, 1024–1279) ── */}
      <aside className="hidden md:flex xl:hidden md:w-20 flex-col shrink-0 border-r vol-ring vol-surface py-4 px-2 gap-1 overflow-y-auto">
        {NAV.map(railItem)}
      </aside>

      {/* ── LAPTOP RAIL (≥1280): the full sidebar (nav + auth cluster) ── */}
      <div className="hidden xl:flex shrink-0 h-full overflow-y-auto">
        <div className="w-40 border-r vol-ring vol-surface overflow-y-auto">{sidebar}</div>
      </div>

      {/* ── MAIN STAGE — all screens ── */}
      <div className="flex-1 flex flex-col overflow-hidden relative min-w-0">
        {/* Mobile/tablet header: title + sheet triggers (hidden ≥1280 where panes exist) */}
        <header className="xl:hidden h-14 shrink-0 border-b vol-ring vol-surface flex items-center justify-between px-4">
          <div className="flex items-center gap-3 min-w-0">
            <Menu
              className="w-5 h-5 vol-accent mr-0 cursor-pointer"
              onClick={() => setNavOpen(true)}
            />
            <span className="font-black tracking-widest vol-t1 text-sm min-w-0 max-w-[45%] sm:max-w-none truncate">
              {title.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-3 vol-t2">
            <ThemeToggle compact />
            <button
              onClick={() => setSheet(sheet === "diagnostics" ? "none" : "diagnostics")}
              aria-label="Open diagnostics"
              className="cursor-pointer w-10 h-10 flex items-center justify-center rounded-xl hover:vol-wash"
            >
              <Activity className="w-5 h-5" />
            </button>
            <button
              onClick={() => setSheet(sheet === "terminal" ? "none" : "terminal")}
              aria-label="Open terminal"
              className="cursor-pointer w-10 h-10 flex items-center justify-center rounded-xl hover:vol-wash"
            >
              <Terminal className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Content + diagnostics (diagnostics ≥1280 inline) */}
        <div className="flex-1 flex overflow-hidden relative">
          <section className="flex-1 overflow-y-auto min-w-0">{content}</section>
          <aside className="hidden xl:block w-80 shrink-0 overflow-y-auto border-l vol-line vol-elev p-4">
            {diagnostics}
          </aside>
        </div>

        {/* Terminal drawer — laptop only; tablet/mobile use sheets */}
        <footer className="hidden xl:flex h-48 shrink-0 border-t vol-ring vol-surface">
          {terminal}
        </footer>

        {/* ── MOBILE BOTTOM TAB BAR (5 primary + more sheet) ── */}
        <nav className="xl:hidden h-16 shrink-0 border-t vol-ring vol-surface md:hidden"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          <div className="flex h-full items-stretch overflow-x-auto no-scrollbar">
            {NAV.filter(([v]) => ["editor", "ide", "swarm", "meeting"].includes(v)).map(
              ([view, label, icon]) => (
                <button
                  key={view}
                  onClick={() => setCurrentView(view)}
                  className={`flex-1 min-w-[68px] flex flex-col items-center justify-center gap-0.5 rounded-xl min-h-[44px] cursor-pointer ${
                    currentView === view
                      ? "vol-accent vol-acc-wash"
                      : "vol-t2"
                  }`}
                >
                  {icon}
                  <span className="text-[9px] font-bold tracking-wider">{label}</span>
                </button>
              ),
            )}
            <button
              onClick={() => setNavOpen(true)}
              className="min-w-[68px] flex flex-col items-center justify-center gap-0.5 rounded-xl min-h-[44px] cursor-pointer vol-t2"
            >
              <Menu className="w-5 h-5" />
              <span className="text-[9px] font-bold tracking-wider">MORE</span>
            </button>
          </div>
        </nav>

        {/* mobile/tablet SHARED bottom-sheet (terminal or diagnostics) */}
        {sheet !== "none" && (
          <div className="lg:hidden fixed inset-0 z-[90] flex flex-col justify-end">
            <div className="absolute inset-0 vol-veil" onClick={() => setSheet("none")} />
            <div className="relative vol-surface border-t vol-ring h-[55vh] flex flex-col rounded-t-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b vol-line">
                <span className="text-[10px] font-black tracking-widest vol-accent">
                  {sheet === "terminal" ? "TERMINAL" : "DIAGNOSTICS"}
                </span>
                <button onClick={() => setSheet("none")} className="cursor-pointer vol-t2 w-9 h-9 flex items-center justify-center rounded-lg" aria-label="Close sheet">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-auto">
                {sheet === "terminal" ? terminal : diagnostics}
              </div>
            </div>
          </div>
        )}

        {/* NAV DRAWER — phones (<768): full nav; tablets: covered by the rail */}
        {navOpen && (
          <div className="md:hidden fixed inset-0 z-[95] flex">
            <div className="absolute inset-0 vol-veil" onClick={() => setNavOpen(false)} />
            <div className="relative w-72 max-w-[80vw] h-full vol-surface border-r vol-ring p-3 flex flex-col gap-1 overflow-y-auto">
              <div className="flex items-center justify-between px-2 mb-2">
                <span className="font-black tracking-widest vol-accent">VOLT v5</span>
                <div className="flex items-center gap-2">
                  <ThemeToggle compact />
                  <button onClick={() => setNavOpen(false)} className="cursor-pointer vol-t2 w-10 h-10 flex items-center justify-center rounded-lg" aria-label="Close navigation">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              {NAV.map(([view, label, icon]) => (
                <button
                  key={view}
                  onClick={() => {
                    setCurrentView(view);
                    setNavOpen(false);
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left cursor-pointer ${
                    currentView === view
                      ? "vol-acc-bg text-black font-bold"
                      : "vol-accent-soft hover:vol-wash"
                  }`}
                >
                  {icon}
                  <span className="text-[12px] font-bold tracking-wider">{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Desktop theme chip — laptop rail is the legacy sidebar node */}
        <div className="hidden xl:block fixed bottom-4 right-4 z-[80]">
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
};
