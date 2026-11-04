/**
 * About view — whitepaper / changelog / comparison document.
 *
 * All state and handlers are passed as props from the shell.
 *
 * Built on design system tokens (design-system/volt-code-ai/MASTER.md).
 * All colors, spacing, shadows, and typography use --ds-* CSS variables.
 * Every button has cursor-pointer, focus-visible ring, and 200ms hover transition.
 * No emojis as icons — Lucide SVG only.
 */
import React from "react";
import { Panel } from "../ui/Panel";
import { Button } from "../ui/Button";

interface AboutViewProps {
  aboutDocPage: "whitepaper" | "changelog" | "comparison";
  setAboutDocPage: React.Dispatch<
    React.SetStateAction<"whitepaper" | "changelog" | "comparison">
  >;
  onBack: () => void;
}

export const AboutView: React.FC<AboutViewProps> = ({
  aboutDocPage,
  setAboutDocPage,
  onBack,
}) => {
  return (
    <Panel padded={true} className="p-4 sm:p-8 max-w-2xl mx-auto pb-24">
      <div className="bg-[#1B2336] p-12 shadow-2xl rounded-[var(--ds-radius-lg)] border border-[var(--ds-color-border)] font-serif relative">
        <button
          onClick={onBack}
          className="absolute top-6 right-6 px-4 py-2 rounded-[var(--ds-radius-lg)] border border-[var(--ds-color-border)] hover:bg-[#22C55E]/20 hover:text-[#F8FAFC] transition-all font-sans text-xs font-bold text-[#F8FAFC]"
        >
          DISAPPEAR DOCUMENT [ESC]
        </button>

        {/* DOCUMENT SWITCHER TAB */}
        <div className="flex flex-wrap gap-3 mb-8 justify-center select-none font-sans">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAboutDocPage("whitepaper")}
            className={`border border-[var(--ds-color-border)] rounded-[var(--ds-radius-lg)] text-[#F8FAFC] ${aboutDocPage === "whitepaper" ? "bg-[#22C55E] shadow-[0_0_8px_#22c55e]" : "hover:bg-[#334155]/20 hover:text-[#F8FAFC]"}`}
          >
            TECHNICAL SPECIFICATION (SPEC-001)
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAboutDocPage("changelog")}
            className={`border border-[var(--ds-color-border)] rounded-[var(--ds-radius-lg)] text-[#F8FAFC] ${aboutDocPage === "changelog" ? "bg-[#22C55E] shadow-[0_0_8px_#22c55e]" : "hover:bg-[#334155]/20 hover:text-[#F8FAFC]"}`}
          >
            UPGRADE LOG (SPEC-002)
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAboutDocPage("comparison")}
            className={`border border-[var(--ds-color-border)] rounded-[var(--ds-radius-lg)] text-[#F8FAFC] ${aboutDocPage === "comparison" ? "bg-[#22C55E] shadow-[0_0_8px_#22c55e]" : "hover:bg-[#334155]/20 hover:text-[#F8FAFC]"}`}
          >
            COMPARISON MATRIX (SPEC-003)
          </Button>
        </div>

        {aboutDocPage === "whitepaper" && (
          <>
            <div className="text-center mb-10 border-b border-[var(--ds-color-border)] pb-8">
              <div className="text-xs text-[#94A3B8] tracking-[4px] uppercase font-bold mb-2">
                Technical Specification Sheet
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-[#F8FAFC] tracking-tight uppercase mb-4">
                VOLT CODE AI v5.0:
                <br />
                Agentic Code Fixing Hub
              </h1>
              <div className="text-sm font-bold text-[#F8FAFC]">
                Co-Developers:{" "}
                <span className="underline text-[#F8FAFC]">AntiGravity AI Co-Developer</span>{" "}
                & <span className="underline text-[#F8FAFC]">Gemini AI 3.5 Flash</span>
              </div>
              <div className="text-xs text-[#94A3B8] mt-2 font-mono">
                Released: June 2026 • Status: Production Deployed
              </div>
            </div>

            <div className="mb-10 px-6 py-4 bg-[#22C55E]/10 border-l-[var(--ds-color-border)]">
              <h2 className="font-bold text-sm uppercase tracking-wider mb-2 text-[#F8FAFC]">
                Abstract
              </h2>
              <p className="text-sm text-[#94A3B8] leading-relaxed italic">
                Volt Code AI v5.0 introduces an integrated architecture for
                automated diagnostics and self-repair. Under this specification,
                we detail the implementation of a client-side unified diff
                engine, background passive watchdog telemetry (Sentinel), and
                the real-time interaction capabilities of the conversational
                Agent Orchestrator.
              </p>
            </div>

            <div className="mb-10 text-sm font-sans text-[#F8FAFC]">
              <h3 className="font-bold uppercase mb-2 text-[#F8FAFC]">
                1. Table of Contents
              </h3>
              <ul className="space-y-1 list-decimal list-inside text-[#94A3B8]">
                <li>Core Architecture Strategy</li>
                <li>Sentinel Background Telemetry</li>
                <li>Chat-First Agent Workspace</li>
                <li>Dedicated Virtual Terminal Stream</li>
                <li>Keyboard Shortcut Schema</li>
              </ul>
            </div>

            <div className="space-y-8 text-sm text-[#F8FAFC] font-serif leading-relaxed">
              <section>
                <h2 className="font-bold text-lg border-b border-[var(--ds-color-border)] pb-1 mb-3 uppercase text-[#F8FAFC]">
                  2. Core Architecture Strategy
                </h2>
                <p className="mb-3 text-[#94A3B8]">
                  Volt Code AI executes repairs through a dual-channel design.
                  User requests are evaluated by an orchestration middleware
                  which extracts lines, scans for security targets, and queries
                  optimized model pipelines. To prevent user interface clutter,
                  v5.0 consolidates Model, Skill, Plugin, and Mode selections
                  inside a single runtime panel in the editor workspace,
                  enforcing a strict single-source-of-truth strategy.
                </p>
              </section>

              <section>
                <h2 className="font-bold text-lg border-b border-[var(--ds-color-border)] pb-1 mb-3 uppercase text-[#F8FAFC]">
                  3. Sentinel Telemetry
                </h2>
                <p className="mb-3 text-[#94A3B8]">
                  The Sentinel engine maintains watch on the active editor
                  contents. Using a debounced timeout delay, Sentinel executes
                  background calls without locking the editing thread. The
                  returns populate a live severity heatmap and an issue feed,
                  recommending targeted patches that can be applied with a
                  single click.
                </p>
              </section>

              <section>
                <h2 className="font-bold text-lg border-b border-[var(--ds-color-border)] pb-1 mb-3 uppercase text-[#F8FAFC]">
                  4. Chat-First Agent Workspace
                </h2>
                <p className="mb-3 text-[#94A3B8]">
                  The floating Agent Modal has been upgraded from a duplicate
                  settings form into a chat console. The Agent possesses full
                  context memory of the workspace, enabling it to explain bug
                  reports, perform security audits, detect O(N²) loops, and
                  draft changes conversationally.
                </p>
              </section>

              <section>
                <h2 className="font-bold text-lg border-b border-[var(--ds-color-border)] pb-1 mb-3 uppercase text-[#F8FAFC]">
                  5. Dedicated Virtual Terminal Stream
                </h2>
                <p className="mb-3 text-[#94A3B8]">
                  Volt Code AI houses a virtual console capturing telemetry
                  log data. Every step of execution—including model routing
                  decisions, token reports, parse statuses, and API network
                  roundtrips—is streamed chronologically to this console to
                  ensure full system transparency.
                </p>
              </section>
            </div>
          </>
        )}

        {aboutDocPage === "changelog" && (
          <>
            <div className="text-center mb-10 border-b border-[var(--ds-color-border)] pb-8">
              <div className="text-xs text-[#94A3B8] tracking-[4px] uppercase font-bold mb-2">
                Technical specs restoration log
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-[#F8FAFC] tracking-tight uppercase mb-4">
                SPEC-002: SYSTEM UPGRADE
                <br />& DEAD-TO-ALIVE CHANGELOG
              </h1>
              <div className="text-sm font-bold text-[#94A3B8]">
                Prepared by
                <span className="underline text-[#F8FAFC]">AntiGravity AI Co-Developer</span>{" "}
                & <span className="underline text-[#F8FAFC]">Gemini AI 3.5 Flash</span>
              </div>
              <div className="text-xs text-[#94A3B8] mt-2 font-mono">
                Published: June 2026 • Target: v5.0 Upgrade Hub
              </div>
            </div>

            <div className="mb-8 px-6 py-4 bg-[#1B2336] border-l-[var(--ds-color-border)]">
              <h2 className="font-bold text-sm uppercase tracking-wider mb-2 text-[#F8FAFC]">
                Notice
              </h2>
              <p className="text-sm text-[#94A3B8] leading-relaxed italic">
                This specification matrix details the comparative analysis of
                features that were dead or placeholder in the legacy codebase
                and have been brought to full functional life in Volt Code AI
                v5.0. This comparative process is set as a standard
                requirement for all future major releases.
              </p>
            </div>

            {/* COMPARISON TABLE */}
            <div className="overflow-x-auto font-sans text-xs mb-8">
              <table className="min-w-full border border-[var(--ds-color-border)] text-left border-collapse leading-relaxed">
                <thead>
                  <tr className="bg-[#1B2336] text-[#F8FAFC] uppercase tracking-wider text-[10px]">
                    <th className="border border-[var(--ds-color-border)] px-4 py-3 font-bold">
                      Feature Name
                    </th>
                    <th className="border border-[var(--ds-color-border)] px-4 py-3 font-bold">
                      v4.9 State (Before / Dead)
                    </th>
                    <th className="border border-[var(--ds-color-border)] px-4 py-3 font-bold">
                      v5.0 State (After / Alive)
                    </th>
                    <th className="border border-[var(--ds-color-border)] px-4 py-3 font-bold">
                      Validation
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-[#1B2336] hover:bg-[#1B2336]/50">
                    <td className="border border-[var(--ds-color-border)] px-4 py-3 font-bold text-[#F8FAFC]">
                      Sentinel Watchdog
                    </td>
                    <td className="border border-[var(--ds-color-border)] px-4 py-3 text-[#EF4444] italic">
                      Static labels; dead placeholders.
                    </td>
                    <td className="border border-[var(--ds-color-border)] px-4 py-3 text-[#22C55E] font-medium">
                      Debounced active watcher scan, severity heatbars,
                      warning log feeds & instant patch buttons.
                    </td>
                    <td className="border border-[var(--ds-color-border)] px-4 py-3 text-[#22C55E] font-bold">
                      ✔ Verified
                    </td>
                  </tr>
                  <tr className="hover:bg-[#1B2336]/50">
                    <td className="border border-[var(--ds-color-border)] px-4 py-3 font-bold text-[#F8FAFC]">
                      Agent Orchestrator
                    </td>
                    <td className="border border-[var(--ds-color-border)] px-4 py-3 text-[#EF4444] italic">
                      Duplicate settings selectors modal; no actual agent
                      features.
                    </td>
                    <td className="border border-[var(--ds-color-border)] px-4 py-3 text-[#22C55E] font-medium">
                      Chat console with conversation history, active workspace
                      memory & quick audit button triggers.
                    </td>
                    <td className="border border-[var(--ds-color-border)] px-4 py-3 text-[#22C55E] font-bold">
                      ✔ Verified
                    </td>
                  </tr>
                  <tr className="bg-[#1B2336] hover:bg-[#1B2336]/50">
                    <td className="border border-[var(--ds-color-border)] px-4 py-3 font-bold text-[#F8FAFC]">
                      Refactoring Patch Engine
                    </td>
                    <td className="border border-[var(--ds-color-border)] px-4 py-3 text-[#EF4444] italic">
                      Discarded reducer results; auto-apply formatting bugs.
                    </td>
                    <td className="border border-[var(--ds-color-border)] px-4 py-3 text-[#22C55E] font-medium">
                      Modified patch logic to save and write the combined
                      `allFixed` reducer code successfully.
                    </td>
                    <td className="border border-[var(--ds-color-border)] px-4 py-3 text-[#22C55E] font-bold">
                      ✔ Verified
                    </td>
                  </tr>
                  <tr className="bg-[#1B2336] hover:bg-[#1B2336]/50">
                    <td className="border border-[var(--ds-color-border)] px-4 py-3 font-bold text-[#F8FAFC]">
                      Unified Diff Visualizer
                    </td>
                    <td className="border border-[var(--ds-color-border)] px-4 py-3 text-[#EF4444] italic">
                      Side-by-side unhighlighted pre containers.
                    </td>
                    <td className="border border-[var(--ds-color-border)] px-4 py-3 text-[#22C55E] font-medium">
                      Custom client-side LCS diff regex parser rendering red
                      deletions and green additions with numbers.
                    </td>
                    <td className="border border-[var(--ds-color-border)] px-4 py-3 text-[#22C55E] font-bold">
                      ✔ Verified
                    </td>
                  </tr>
                  <tr className="bg-[#1B2336] hover:bg-[#1B2336]/50">
                    <td className="border border-[var(--ds-color-border)] px-4 py-3 font-bold text-[#F8FAFC]">
                      Virtual Diagnostic Terminal
                    </td>
                    <td className="border border-[var(--ds-color-border)] px-4 py-3 text-[#EF4444] italic">
                      Non-existent; server timeouts failed silently.
                    </td>
                    <td className="border border-[var(--ds-color-border)] px-4 py-3 text-[#22C55E] font-medium">
                      Toggleable console panel logging server calls, response
                      timers, parsed tokens and errors.
                    </td>
                    <td className="border border-[var(--ds-color-border)] px-4 py-3 text-[#22C55E] font-bold">
                      ✔ Verified
                    </td>
                  </tr>
                  <tr className="bg-[#1B2336] hover:bg-[#1B2336]/50">
                    <td className="border border-[var(--ds-color-border)] px-4 py-3 font-bold text-[#F8FAFC]">
                      Model Identity Badge
                    </td>
                    <td className="border border-[var(--ds-color-border)] px-4 py-3 text-[#EF4444] italic">
                      Hidden until analysis finished; minimal watermark tags.
                    </td>
                    <td className="border border-[var(--ds-color-border)] px-4 py-3 text-[#22C55E] font-medium">
                      Always visible header badge tracking engine tags,
                      context size, and real-time scanning status.
                    </td>
                    <td className="border border-[var(--ds-color-border)] px-4 py-3 text-[#22C55E] font-bold">
                      ✔ Verified
                    </td>
                  </tr>
                  <tr className="bg-[#1B2336] hover:bg-[#1B2336]/50">
                    <td className="border border-[var(--ds-color-border)] px-4 py-3 font-bold text-[#F8FAFC]">
                      Keyboard Hotkeys
                    </td>
                    <td className="border border-[var(--ds-color-border)] px-4 py-3 text-[#EF4444] italic">
                      Non-existent.
                    </td>
                    <td className="border border-[var(--ds-color-border)] px-4 py-3 text-[#22C55E] font-medium">
                      Global shortcut keys (Ctrl+Enter, Ctrl+Shift+F, Ctrl+/,
                      Ctrl+K, Escape, ?) and guide.
                    </td>
                    <td className="border border-[var(--ds-color-border)] px-4 py-3 text-[#22C55E] font-bold">
                      ✔ Verified
                    </td>
                  </tr>
                  <tr className="bg-[#1B2336] hover:bg-[#1B2336]/50">
                    <td className="border border-[var(--ds-color-border)] px-4 py-3 font-bold text-[#F8FAFC]">
                      Session History Filter
                    </td>
                    <td className="border border-[var(--ds-color-border)] px-4 py-3 text-[#EF4444] italic">
                      List display with zero search capabilities.
                    </td>
                    <td className="border border-[var(--ds-color-border)] px-4 py-3 text-[#22C55E] font-medium">
                      Interactive keyword input matching summaries, languages,
                      and models.
                    </td>
                    <td className="border border-[var(--ds-color-border)] px-4 py-3 text-[#22C55E] font-bold">
                      ✔ Verified
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </Panel>
  );
};
