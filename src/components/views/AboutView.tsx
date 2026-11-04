/**
 * About view — whitepaper / changelog / comparison document.
 *
 * Shared state comes from VoltContext. App-owned state (aboutDocPage) is
 * passed as a prop.
 */
import React from "react";

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
    <div className="p-8 max-w-4xl mx-auto overflow-y-auto h-full pb-20 select-text">
      <div className="bg-white text-black p-12 shadow-2xl rounded-2xl border-4 border-double vol-line font-serif relative">
        <button
          onClick={onBack}
          className="absolute top-6 right-6 px-4 py-2 rounded-full border vol-line hover:vol-well hover:vol-t1 transition-all font-sans text-xs font-bold"
        >
          DISAPPEAR DOCUMENT [ESC]
        </button>

        {/* DOCUMENT SWITCHER TAB */}
        <div className="flex flex-wrap gap-3 mb-8 justify-center select-none font-sans">
          <button
            onClick={() => setAboutDocPage("whitepaper")}
            className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
              aboutDocPage === "whitepaper"
                ? "vol-well vol-t1 vol-line shadow-md"
                : "bg-white text-black vol-line hover:vol-wash"
            }`}
          >
            TECHNICAL SPECIFICATION (SPEC-001)
          </button>
          <button
            onClick={() => setAboutDocPage("changelog")}
            className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
              aboutDocPage === "changelog"
                ? "vol-well vol-t1 vol-line shadow-md"
                : "bg-white text-black vol-line hover:vol-wash"
            }`}
          >
            UPGRADE LOG (SPEC-002)
          </button>
          <button
            onClick={() => setAboutDocPage("comparison")}
            className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
              aboutDocPage === "comparison"
                ? "vol-well vol-t1 vol-line shadow-md"
                : "bg-white text-black vol-line hover:vol-wash"
            }`}
          >
            COMPARISON MATRIX (SPEC-003)
          </button>
        </div>

        {aboutDocPage === "whitepaper" && (
          <>
            <div className="text-center mb-10 border-b-2 vol-line pb-8">
              <div className="text-xs tracking-[4px] uppercase font-sans font-bold text-gray-500 mb-2">
                Technical Specification Sheet
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight uppercase leading-tight mb-4">
                VOLT CODE AI v5.0:
                <br />
                Agentic Code Fixing Hub
              </h1>
              <div className="text-sm font-sans font-semibold text-gray-700">
                Co-Developers:{" "}
                <span className="underline">
                  AntiGravity (Agentic AI Co-Developer)
                </span>{" "}
                & <span className="underline">Gemini AI 3.5 Flash</span>
              </div>
              <div className="text-xs text-gray-500 mt-2 font-sans">
                Released: June 2026 • Status: Production Deployed
              </div>
            </div>

            <div className="mb-10 px-6 py-4 bg-gray-50 border-l-4 vol-line">
              <h2 className="font-sans font-bold text-sm uppercase tracking-wider mb-2">
                Abstract
              </h2>
              <p className="text-sm leading-relaxed text-gray-800 italic">
                Volt Code AI v5.0 introduces an integrated architecture for
                automated diagnostics and self-repair. Under this
                specification, we detail the implementation of a client-side
                unified diff engine, background passive watchdog telemetry
                (Sentinel), and the real-time interaction capabilities of the
                conversational Agent Orchestrator.
              </p>
            </div>

            <div className="mb-10 text-sm font-sans">
              <h3 className="font-bold uppercase mb-2">
                1. Table of Contents
              </h3>
              <ul className="space-y-1 list-decimal list-inside text-gray-700">
                <li>Core Architecture Strategy</li>
                <li>Sentinel Background Telemetry</li>
                <li>Chat-First Agent Workspace</li>
                <li>Dedicated Virtual Terminal Stream</li>
                <li>Keyboard Shortcut Schema</li>
              </ul>
            </div>

            <div className="space-y-8 text-sm leading-relaxed text-gray-900 font-serif">
              <section>
                <h2 className="font-sans font-bold text-lg border-b vol-line pb-1 mb-3 uppercase">
                  2. Core Architecture Strategy
                </h2>
                <p className="mb-3">
                  Volt Code AI executes repairs through a dual-channel design.
                  User requests are evaluated by an orchestration middleware
                  which extracts lines, scans for security targets, and
                  queries optimized model pipelines. To prevent user interface
                  clutter, v5.0 consolidates Model, Skill, Plugin, and Mode
                  selections inside a single runtime panel in the editor
                  workspace, enforcing a strict single-source-of-truth
                  strategy.
                </p>
              </section>

              <section>
                <h2 className="font-sans font-bold text-lg border-b vol-line pb-1 mb-3 uppercase">
                  3. Sentinel Telemetry
                </h2>
                <p className="mb-3">
                  The Sentinel engine maintains watch on the active editor
                  contents. Using a debounced timeout delay, Sentinel executes
                  background calls without locking the editing thread. The
                  returns populate a live severity heatmap and an issue feed,
                  recommending targeted patches that can be applied with a
                  single click.
                </p>
              </section>

              <section>
                <h2 className="font-sans font-bold text-lg border-b vol-line pb-1 mb-3 uppercase">
                  4. Chat-First Agent Workspace
                </h2>
                <p className="mb-3">
                  The floating Agent Modal has been upgraded from a duplicate
                  settings form into a chat console. The Agent possesses full
                  context memory of the workspace, enabling it to explain bug
                  reports, perform security audits, detect O(N²) loops, and
                  draft changes conversationally.
                </p>
              </section>

              <section>
                <h2 className="font-sans font-bold text-lg border-b vol-line pb-1 mb-3 uppercase">
                  5. Dedicated Virtual Terminal Stream
                </h2>
                <p className="mb-3">
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
            <div className="text-center mb-10 border-b-2 vol-line pb-8">
              <div className="text-xs tracking-[4px] uppercase font-sans font-bold text-gray-500 mb-2">
                Technical specs restoration log
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight uppercase leading-tight mb-4">
                SPEC-002: SYSTEM UPGRADE
                <br />& DEAD-TO-ALIVE CHANGELOG
              </h1>
              <div className="text-sm font-sans font-semibold text-gray-700">
                Document Author:{" "}
                <span className="underline">AntiGravity AI Co-Developer</span>{" "}
                & <span className="underline">Gemini AI 3.5 Flash</span>
              </div>
              <div className="text-xs text-gray-500 mt-2 font-sans">
                Published: June 2026 • Target: v5.0 Upgrade Hub
              </div>
            </div>

            <div className="mb-10 px-6 py-4 bg-gray-50 border-l-4 vol-line">
              <h2 className="font-sans font-bold text-sm uppercase tracking-wider mb-2">
                Abstract
              </h2>
              <p className="text-sm leading-relaxed text-gray-800 italic">
                This document specifies the system upgrades conducted to bring
                legacy placeholder structures and non-functional routing
                dropdowns to life. We outline the integration of the Sentinel
                debounced watcher daemon, conversational Agent chat console,
                client-side LCS diff parser, and terminal stream logging.
              </p>
            </div>

            <div className="space-y-8 text-sm leading-relaxed text-gray-900 font-serif">
              <section>
                <h2 className="font-sans font-bold text-lg border-b vol-line pb-1 mb-3 uppercase">
                  1. Sentinel Background Telemetry Engine
                </h2>
                <p className="mb-3 font-bold text-gray-800">
                  Status: Dead Placeholder ➔ Fully Operational Watchdog
                </p>
                <p className="mb-2">
                  In previous releases, the Sentinel interface was a static
                  layout representing "Internal Operations Queue," "Skills
                  Room," and "Plugins Room" as simple, disconnected labels. No
                  background monitoring or actual linter processes were wired
                  in.
                </p>
                <p>
                  **Restoration Details**: A debounced React hook has been
                  integrated. When enabled, it monitors code adjustments in
                  real-time, executing background scans via OpenRouter's fast
                  Mistral-7B API. Sentinel aggregates counts to populate an
                  animated **Severity Heatmap** and logs all warnings to a
                  **Live Watchdog Feed** with instant patch-application
                  buttons.
                </p>
              </section>

              <section>
                <h2 className="font-sans font-bold text-lg border-b vol-line pb-1 mb-3 uppercase">
                  2. Conversational Agent Command Console
                </h2>
                <p className="mb-3 font-bold text-gray-800">
                  Status: Redundant Settings Modal ➔ Active Chat Orchestrator
                </p>
                <p className="mb-2">
                  The legacy Agent Modal merely replicated Model, Plugin,
                  Skill, and Mode dropdown selections already available in the
                  main editor workspace, rendering it visually duplicate and
                  non-functional.
                </p>
                <p>
                  **Restoration Details**: Redundant dropdown selectors have
                  been completely removed. The modal has been reconstructed
                  into a chat-centric developer console. It maintains
                  workspace state and routes custom instructions directly to
                  the API. It also exposes **Command Preset Cards** to perform
                  security scans, complexity audits, performance profile
                  reviews, and patch drafts.
                </p>
              </section>

              <section>
                <h2 className="font-sans font-bold text-lg border-b vol-line pb-1 mb-3 uppercase">
                  3. LCS Diff Visualizer & Code Refactoring Bug
                </h2>
                <p className="mb-3 font-bold text-gray-800">
                  Status: Plain Pre Blocks & Discarded Fix Code ➔ Unified Line
                  Diff & Reducer
                </p>
                <p className="mb-2">
                  The original `applyAllFixes` method computed a combined code
                  repair reducer but discarded its own output, instead calling
                  `setCode(fixedCode)`. This resulted in corrupted formatting.
                  Concurrently, the Diff modal rendered code in two raw
                  side-by-side `&lt;pre&gt;` containers with no line
                  highlighting.
                </p>
                <p>
                  **Restoration Details**: Modified `applyAllFixes` to store
                  and write the `allFixed` reducer result correctly. Built a
                  custom client-side LCS diff parser showing line additions
                  (`+` in green) and deletions (`-` in red) with dual line
                  numbering and an instant copy button in the footer.
                </p>
              </section>

              <section>
                <h2 className="font-sans font-bold text-lg border-b vol-line pb-1 mb-3 uppercase">
                  4. Virtual Dedicated Terminal
                </h2>
                <p className="mb-3 font-bold text-gray-800">
                  Status: Non-Existent ➔ Live Diagnostic Stream
                </p>
                <p className="mb-2">
                  The system lacked any real-time tracking interface, causing
                  network delays or API timeouts to fail silently without user
                  visibility.
                </p>
                <p>
                  **Restoration Details**: Implemented a toggleable virtual
                  console at the bottom of the editor. The stream logs API
                  calls, model tags, roundtrip response times, parser
                  successes, and warning alerts in color-coded output lines.
                </p>
              </section>
            </div>
          </>
        )}

        {aboutDocPage === "changelog" && (
          <>
            <div className="text-center mb-10 border-b-2 vol-line pb-8">
              <div className="text-xs tracking-[4px] uppercase font-sans font-bold text-gray-500 mb-2">
                Technical specs restoration log
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight uppercase leading-tight mb-4">
                SPEC-002: SYSTEM UPGRADE
                <br />& DEAD-TO-ALIVE CHANGELOG
              </h1>
              <div className="text-sm font-sans font-semibold text-gray-700">
                Document Author:{" "}
                <span className="underline">AntiGravity AI Co-Developer</span>{" "}
                & <span className="underline">Gemini AI 3.5 Flash</span>
              </div>
              <div className="text-xs text-gray-500 mt-2 font-sans">
                Published: June 2026 • Target: v5.0 Upgrade Hub
              </div>
            </div>

            <div className="mb-10 px-6 py-4 bg-gray-50 border-l-4 vol-line">
              <h2 className="font-sans font-bold text-sm uppercase tracking-wider mb-2">
                Abstract
              </h2>
              <p className="text-sm leading-relaxed text-gray-800 italic">
                This document specifies the system upgrades conducted to bring
                legacy placeholder structures and non-functional routing
                dropdowns to life. We outline the integration of the Sentinel
                debounced watcher daemon, conversational Agent chat console,
                client-side LCS diff parser, and terminal stream logging.
              </p>
            </div>

            <div className="space-y-8 text-sm leading-relaxed text-gray-900 font-serif">
              <section>
                <h2 className="font-sans font-bold text-lg border-b vol-line pb-1 mb-3 uppercase">
                  1. Sentinel Background Telemetry Engine
                </h2>
                <p className="mb-3 font-bold text-gray-800">
                  Status: Dead Placeholder ➔ Fully Operational Watchdog
                </p>
                <p className="mb-2">
                  In previous releases, the Sentinel interface was a static
                  layout representing "Internal Operations Queue," "Skills
                  Room," and "Plugins Room" as simple, disconnected labels. No
                  background monitoring or actual linter processes were wired
                  in.
                </p>
                <p>
                  **Restoration Details**: A debounced React hook has been
                  integrated. When enabled, it monitors code adjustments in
                  real-time, executing background scans via OpenRouter's fast
                  Mistral-7B API. Sentinel aggregates counts to populate an
                  animated **Severity Heatmap** and logs all warnings to a
                  **Live Watchdog Feed** with instant patch-application
                  buttons.
                </p>
              </section>

              <section>
                <h2 className="font-sans font-bold text-lg border-b vol-line pb-1 mb-3 uppercase">
                  2. Conversational Agent Command Console
                </h2>
                <p className="mb-3 font-bold text-gray-800">
                  Status: Redundant Settings Modal ➔ Active Chat Orchestrator
                </p>
                <p className="mb-2">
                  The legacy Agent Modal merely replicated Model, Plugin,
                  Skill, and Mode dropdown selections already available in the
                  main editor workspace, rendering it visually duplicate and
                  non-functional.
                </p>
                <p>
                  **Restoration Details**: Redundant dropdown selectors have
                  been completely removed. The modal has been reconstructed
                  into a chat-centric developer console. It maintains
                  workspace state and routes custom instructions directly to
                  the API. It also exposes **Command Preset Cards** to perform
                  security scans, complexity audits, performance profile
                  reviews, and patch drafts.
                </p>
              </section>

              <section>
                <h2 className="font-sans font-bold text-lg border-b vol-line pb-1 mb-3 uppercase">
                  3. LCS Diff Visualizer & Code Refactoring Bug
                </h2>
                <p className="mb-3 font-bold text-gray-800">
                  Status: Plain Pre Blocks & Discarded Fix Code ➔ Unified Line
                  Diff & Reducer
                </p>
                <p className="mb-2">
                  The original `applyAllFixes` method computed a combined code
                  repair reducer but discarded its own output, instead calling
                  `setCode(fixedCode)`. This resulted in corrupted formatting.
                  Concurrently, the Diff modal rendered code in two raw
                  side-by-side `&lt;pre&gt;` containers with no line
                  highlighting.
                </p>
                <p>
                  **Restoration Details**: Modified `applyAllFixes` to store
                  and write the `allFixed` reducer result correctly. Built a
                  custom client-side LCS diff parser showing line additions
                  (`+` in green) and deletions (`-` in red) with dual line
                  numbering and an instant copy button in the footer.
                </p>
              </section>

              <section>
                <h2 className="font-sans font-bold text-lg border-b vol-line pb-1 mb-3 uppercase">
                  4. Virtual Dedicated Terminal
                </h2>
                <p className="mb-3 font-bold text-gray-800">
                  Status: Non-Existent ➔ Live Diagnostic Stream
                </p>
                <p className="mb-2">
                  The system lacked any real-time tracking interface, causing
                  network delays or API timeouts to fail silently without user
                  visibility.
                </p>
                <p>
                  **Restoration Details**: Implemented a toggleable virtual
                  console at the bottom of the editor. The stream logs API
                  calls, model tags, roundtrip response times, parser
                  successes, and warning alerts in color-coded output lines.
                </p>
              </section>
            </div>
          </>
        )}

        {aboutDocPage === "comparison" && (
          <>
            <div className="text-center mb-10 border-b-2 vol-line pb-8">
              <div className="text-xs tracking-[4px] uppercase font-sans font-bold text-gray-500 mb-2">
                Upgrade telemetry comparison matrix
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight uppercase leading-tight mb-4">
                SPEC-003: UPGRADE SUMMARY
                <br />& COMPARISON MATRIX
              </h1>
              <div className="text-sm font-sans font-semibold text-gray-700">
                Prepared by:{" "}
                <span className="underline">AntiGravity AI Co-Developer</span>{" "}
                & <span className="underline">Gemini AI 3.5 Flash</span>
              </div>
              <div className="text-xs text-gray-500 mt-2 font-sans">
                Scope: v4.9 (Legacy Placeholder) vs v5.0 (Agentic Hub)
              </div>
            </div>

            <div className="mb-8 px-6 py-4 bg-gray-50 border-l-4 vol-line font-serif">
              <h2 className="font-sans font-bold text-sm uppercase tracking-wider mb-2">
                Notice
              </h2>
              <p className="text-sm leading-relaxed text-gray-800 italic">
                This specification matrix details the comparative analysis of
                features that were dead or placeholder in the legacy codebase
                and have been brought to full functional life in Volt Code AI
                v5.0. This comparative process is set as a standard
                requirement for all future major releases.
              </p>
            </div>

            {/* COMPARISON TABLE */}
            <div className="overflow-x-auto font-sans text-xs mb-8">
              <table className="min-w-full border vol-line text-left border-collapse leading-relaxed">
                <thead>
                  <tr className="vol-well vol-t1 uppercase tracking-wider text-[10px]">
                    <th className="border vol-line px-4 py-3 font-bold">
                      Feature Name
                    </th>
                    <th className="border vol-line px-4 py-3 font-bold">
                      v4.9 State (Before / Dead)
                    </th>
                    <th className="border vol-line px-4 py-3 font-bold">
                      v5.0 State (After / Alive)
                    </th>
                    <th className="border vol-line px-4 py-3 font-bold">
                      Validation
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-gray-50 hover:bg-gray-100/50">
                    <td className="border vol-line px-4 py-3 font-bold">
                      Sentinel Watchdog
                    </td>
                    <td className="border vol-line px-4 py-3 text-red-700 italic">
                      Static labels; dead placeholders.
                    </td>
                    <td className="border vol-line px-4 py-3 text-green-800 font-medium">
                      Debounced active watcher scan, severity heatbars,
                      warning log feeds & instant patch buttons.
                    </td>
                    <td className="border vol-line px-4 py-3 text-green-700 font-bold">
                      ✔ Verified
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-100/50">
                    <td className="border vol-line px-4 py-3 font-bold">
                      Agent Orchestrator
                    </td>
                    <td className="border vol-line px-4 py-3 text-red-700 italic">
                      Duplicate settings selectors modal; no actual agent
                      features.
                    </td>
                    <td className="border vol-line px-4 py-3 text-green-800 font-medium">
                      Chat console with conversation history, active workspace
                      memory & quick audit button triggers.
                    </td>
                    <td className="border vol-line px-4 py-3 text-green-700 font-bold">
                      ✔ Verified
                    </td>
                  </tr>
                  <tr className="bg-gray-50 hover:bg-gray-100/50">
                    <td className="border vol-line px-4 py-3 font-bold">
                      Refactoring Patch Engine
                    </td>
                    <td className="border vol-line px-4 py-3 text-red-700 italic">
                      Discarded reducer results; auto-apply formatting bugs.
                    </td>
                    <td className="border vol-line px-4 py-3 text-green-800 font-medium">
                      Modified patch logic to save and write the combined
                      `allFixed` reducer code successfully.
                    </td>
                    <td className="border vol-line px-4 py-3 text-green-700 font-bold">
                      ✔ Verified
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-100/50">
                    <td className="border vol-line px-4 py-3 font-bold">
                      Unified Diff Visualizer
                    </td>
                    <td className="border vol-line px-4 py-3 text-red-700 italic">
                      Side-by-side unhighlighted pre containers.
                    </td>
                    <td className="border vol-line px-4 py-3 text-green-800 font-medium">
                      Custom client-side LCS diff parser rendering red
                      deletions and green additions with numbers.
                    </td>
                    <td className="border vol-line px-4 py-3 text-green-700 font-bold">
                      ✔ Verified
                    </td>
                  </tr>
                  <tr className="bg-gray-50 hover:bg-gray-100/50">
                    <td className="border vol-line px-4 py-3 font-bold">
                      Virtual Diagnostic Terminal
                    </td>
                    <td className="border vol-line px-4 py-3 text-red-700 italic">
                      Non-existent; server timeouts failed silently.
                    </td>
                    <td className="border vol-line px-4 py-3 text-green-800 font-medium">
                      Toggleable console panel logging server calls, response
                      timers, parsed tokens and errors.
                    </td>
                    <td className="border vol-line px-4 py-3 text-green-700 font-bold">
                      ✔ Verified
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-100/50">
                    <td className="border vol-line px-4 py-3 font-bold">
                      Model Identity Badge
                    </td>
                    <td className="border vol-line px-4 py-3 text-red-700 italic">
                      Hidden until analysis finished; minimal watermark tags.
                    </td>
                    <td className="border vol-line px-4 py-3 text-green-800 font-medium">
                      Always visible header badge tracking engine tags,
                      context size, and real-time scanning status.
                    </td>
                    <td className="border vol-line px-4 py-3 text-green-700 font-bold">
                      ✔ Verified
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-100/50">
                    <td className="border vol-line px-4 py-3 font-bold">
                      Keyboard Hotkeys
                    </td>
                    <td className="border vol-line px-4 py-3 text-red-700 italic">
                      Non-existent.
                    </td>
                    <td className="border vol-line px-4 py-3 text-green-800 font-medium">
                      Global shortcut hooks (Ctrl+Enter, Ctrl+Shift+F, Ctrl+/,
                      Ctrl+K, Escape, ?) and guide.
                    </td>
                    <td className="border vol-line px-4 py-3 text-green-700 font-bold">
                      ✔ Verified
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-100/50">
                    <td className="border vol-line px-4 py-3 font-bold">
                      Session History Filter
                    </td>
                    <td className="border vol-line px-4 py-3 text-red-700 italic">
                      List display with zero search capabilities.
                    </td>
                    <td className="border vol-line px-4 py-3 text-green-800 font-medium">
                      Interactive keyword input matching summaries, languages,
                      and models.
                    </td>
                    <td className="border vol-line px-4 py-3 text-green-700 font-bold">
                      ✔ Verified
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="mt-12 pt-8 border-t vol-line text-center text-xs font-sans text-gray-500">
          © 2026 Volt Code AI. Built under Vercel Serverless Architecture.
        </div>
      </div>
    </div>
  );
};