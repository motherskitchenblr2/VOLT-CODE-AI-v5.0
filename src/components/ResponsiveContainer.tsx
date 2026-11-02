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
  sentinelLevel,
  sentinelLabel,
}) => {
  const [sheet, setSheet] = useState<
    "none" | "terminal" | "diagnostics" | "more"
  >("none");
  const [navOpen, setNavOpen] = useState(false);
  const title = NAV.find(([v]) => v === currentView)?.[1] ?? "Editor";

  const railItem = ([view, label, icon]: NavItem) => (
    <button
      key={view}
      data-view={view}
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
        <div className="w-40 border-r vol-ring vol-surface overflow-y-auto">
          {sidebar}
        </div>
      </div>

      {/* ── MAIN STAGE — all screens ── */}
      <div className="flex-1 flex flex-col overflow-hidden relative min-w-0">
        {/* Mobile/tablet header: title + sheet triggers (hidden ≥1280 where panes exist) */}
        <header className="xl:hidden h-12 shrink-0 border-b vol-ring vol-surface flex items-center justify-between px-3">
          {/* Title gets flex-1 min-w-0 truncate — no max-width cap, so "EDITOR" never clips to "EDI..." */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Menu
              className="w-5 h-5 shrink-0 vol-accent cursor-pointer"
              onClick={() => setNavOpen(true)}
            />
            <span className="shrink-0 text-sm font-semibold tracking-wider vol-t1 truncate">
              {title.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-1.5 vol-t2 shrink-0">
            <ThemeToggle compact />
            <button
              onClick={() =>
                setSheet(sheet === "diagnostics" ? "none" : "diagnostics")
              }
              aria-label="Open diagnostics"
              className="cursor-pointer w-10 h-10 flex items-center justify-center rounded-xl hover:vol-wash"
            >
              <Activity className="w-5 h-5" />
            </button>
            <button
              onClick={() =>
                setSheet(sheet === "terminal" ? "none" : "terminal")
              }
              aria-label="Open terminal"
              className="cursor-pointer w-10 h-10 flex items-center justify-center rounded-xl hover:vol-wash"
            >
              <Terminal className="w-5 h-5" />
            </button>
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

        {/* Content + diagnostics (diagnostics ≥1280 inline) */}
        <div className="flex-1 flex overflow-hidden relative">
          <section className="flex-1 overflow-y-auto min-w-0">
            {content}
          </section>
          <aside className="hidden xl:block w-80 shrink-0 overflow-y-auto border-l vol-line vol-elev p-4">
            {diagnostics}
          </aside>
        </div>

        {/* Terminal drawer — laptop only; tablet/mobile use sheets */}
        <footer className="hidden xl:flex h-48 shrink-0 border-t vol-ring vol-surface">
          {terminal}
        </footer>

        {/* ── MOBILE BOTTOM DOCK (5 primary + MORE slide-up sheet) ── */}
        <nav
          className="xl:hidden md:hidden h-14 shrink-0 border-t vol-ring vol-surface backdrop-blur-md z-50"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="flex h-full items-stretch">
            {NAV.filter(([v]) =>
              ["editor", "ide", "swarm", "meeting"].includes(v),
            ).map(([view, label, icon]) => (
              <button
                key={view}
                data-view={view}
                onClick={() => setCurrentView(view)}
                aria-current={currentView === view ? "page" : undefined}
                className={`flex-1 min-w-[44px] min-h-[44px] flex flex-col items-center justify-center gap-0.5 rounded-xl cursor-pointer ${
                  currentView === view ? "vol-accent vol-acc-wash" : "vol-t2"
                }`}
              >
                {icon}
                <span className="text-[9px] font-bold tracking-wider">
                  {label}
                </span>
              </button>
            ))}
            <button
              onClick={() => setSheet("more")}
              aria-haspopup="dialog"
              className="flex-1 min-w-[44px] min-h-[44px] flex flex-col items-center justify-center gap-0.5 rounded-xl cursor-pointer vol-t2 transition-all hover:vol-wash"
            >
              <Menu className="w-5 h-5" />
              <span className="text-[9px] font-bold tracking-wider">MORE</span>
            </button>
          </div>
        </nav>

        {/* mobile/tablet SHARED slide-up sheet: terminal | telemetry | more tools */}
        {sheet !== "none" && (
          <div className="lg:hidden fixed inset-0 z-[90] flex flex-col justify-end">
            <div
              className="absolute inset-0 vol-veil"
              onClick={() => setSheet("none")}
            />
            <div
              role="dialog"
              aria-label="Mobile tools"
              className={`relative vol-surface border-t vol-ring flex flex-col rounded-t-2xl overflow-hidden ${
                sheet === "more" ? "max-h-[80dvh]" : "h-[55vh]"
              }`}
            >
              <div className="flex items-center justify-between px-4 py-2.5 border-b vol-line shrink-0">
                <span className="text-[10px] font-black tracking-widest vol-accent">
                  {sheet === "terminal"
                    ? "TERMINAL"
                    : sheet === "diagnostics"
                      ? "TELEMETRY"
                      : "MORE TOOLS"}
                </span>
                <button
                  onClick={() => setSheet("none")}
                  className="cursor-pointer vol-t2 w-11 h-11 flex items-center justify-center rounded-lg"
                  aria-label="Close sheet"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 min-h-0 overflow-auto">
                {sheet === "terminal" ? (
                  terminal
                ) : sheet === "diagnostics" ? (
                  diagnostics
                ) : (
                  <div className="p-3 grid grid-cols-2 gap-2 pb-[calc(env(safe-area-inset-bottom)+12px)]">
                    {NAV.filter(
                      ([v]) =>
                        !["editor", "ide", "swarm", "meeting"].includes(v),
                    ).map(([view, label, icon]) => (
                      <button
                        key={view}
                        data-view={view}
                        onClick={() => {
                          setCurrentView(view);
                          setSheet("none");
                        }}
                        className={`flex items-center gap-3 px-3 min-h-[44px] rounded-xl text-left cursor-pointer ${
                          currentView === view
                            ? "vol-acc-bg text-black font-bold"
                            : "vol-accent-soft hover:vol-wash"
                        }`}
                      >
                        {icon}
                        <span className="text-[11px] font-bold tracking-wider">
                          {label}
                        </span>
                      </button>
                    ))}
                    <button
                      onClick={() => setSheet("diagnostics")}
                      className="flex items-center gap-3 px-3 min-h-[44px] rounded-xl text-left cursor-pointer vol-accent-soft hover:vol-wash"
                    >
                      <Activity className="w-5 h-5" />
                      <span className="text-[11px] font-bold tracking-wider">
                        Telemetry
                      </span>
                    </button>
                    <button
                      onClick={() => setSheet("terminal")}
                      className="flex items-center gap-3 px-3 min-h-[44px] rounded-xl text-left cursor-pointer vol-accent-soft hover:vol-wash"
                    >
                      <Terminal className="w-5 h-5" />
                      <span className="text-[11px] font-bold tracking-wider">
                        Terminal
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* NAV DRAWER — phones (<768): full nav; tablets: covered by the rail */}
        {navOpen && (
          <div className="md:hidden fixed inset-0 z-[95] flex">
            <div
              className="absolute inset-0 vol-veil"
              onClick={() => setNavOpen(false)}
            />
            <div className="relative w-72 max-w-[80vw] h-full vol-surface border-r vol-ring p-3 flex flex-col gap-1 overflow-y-auto">
              <div className="flex items-center justify-between px-2 mb-2">
                <span className="font-black tracking-widest vol-accent">
                  VOLT v5
                </span>
                <div className="flex items-center gap-2">
                  <ThemeToggle compact />
                  <button
                    onClick={() => setNavOpen(false)}
                    className="cursor-pointer vol-t2 w-10 h-10 flex items-center justify-center rounded-lg"
                    aria-label="Close navigation"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              {NAV.map(([view, label, icon]) => (
                <button
                  key={view}
                  data-view={view}
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
                  <span className="text-[12px] font-bold tracking-wider">
                    {label}
                  </span>
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
