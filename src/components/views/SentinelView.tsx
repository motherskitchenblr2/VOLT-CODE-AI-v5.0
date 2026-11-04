/**
 * Sentinel view — security risk board with watchdog telemetry,
 * severity heatmap, passive scan feed, and sentinel patch application.
 *
 * Shared state (enableSentinel, code, detectedLanguage) comes from
 * VoltContext. App-owned state/handlers are passed as props.
 */
import React from "react";
import { Shield, Sparkles } from "lucide-react";

interface SentinelIssue {
  id: number;
  type: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  description: string;
  explanation: string;
  original: string;
  fixed: string;
}

interface SentinelStats {
  totalRuns: number;
  tokensConsumed: number;
  timeSavedMinutes: number;
}

export interface SentinelViewProps {
  enableSentinel: boolean;
  lastSentinelScan: string;
  sentinelStats: SentinelStats;
  sentinelIssues: SentinelIssue[];
  setSentinelIssues: React.Dispatch<React.SetStateAction<SentinelIssue[]>>;
  setIssues: React.Dispatch<React.SetStateAction<SentinelIssue[]>>;
  code: string;
  setCode: (code: string) => void;
  detectedLanguage: string;
  setLanguage: (lang: string) => void;
  analyzeCode: () => void;
  showToast: (msg: string, level?: "info" | "success" | "error" | "warn") => void;
}

export const SentinelView: React.FC<SentinelViewProps> = ({
  enableSentinel,
  lastSentinelScan,
  sentinelStats,
  sentinelIssues,
  setSentinelIssues,
  setIssues,
  code,
  setCode,
  detectedLanguage,
  setLanguage,
  analyzeCode,
  showToast,
}) => {
  const handleApplySentinelPatch = () => {
    if (sentinelIssues.length > 0) {
      setIssues(sentinelIssues);
      const allFixed = sentinelIssues.reduce((acc, issue) => {
        const escaped = issue.original.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return acc.replace(new RegExp(escaped, "g"), issue.fixed);
      }, code);
      setCode(allFixed);
      setSentinelIssues([]);
      showToast("Applied sentinel patches.", "success");
    } else {
      showToast("No active sentinel issues to patch.", "info");
    }
  };

  const handleRunForceTelemetry = () => {
    setLanguage(detectedLanguage);
    analyzeCode();
  };

  const maxVal = Math.max(...[1, sentinelIssues.length]);

  return (
    <div className="p-8 h-full overflow-auto space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap border-b vol-ring pb-6">
        <div>
          <div className="vol-accent text-xs tracking-[3px] font-bold uppercase mb-1">
            Live Telemetry & Telemetric Scan
          </div>
          <h1 className="text-3xl font-extrabold">SENTINEL OPERATIONS</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl border vol-ring vol-panel text-sm">
            <span
              className={`w-2 h-2 rounded-full ${enableSentinel ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
            ></span>
            <span className="font-semibold vol-t1">
              MONITOR: {enableSentinel ? "ACTIVE" : "STANDBY"}
            </span>
          </div>
          <div className="px-4 py-2 rounded-xl border vol-ring vol-panel text-sm vol-accent">
            Last Watch-Scan: {lastSentinelScan}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="border vol-ring vol-wash p-5 rounded-2xl">
          <div className="text-xs vol-t2 uppercase font-semibold">
            Checks Executed
          </div>
          <div className="text-2xl font-black vol-accent mt-1">
            {sentinelStats.totalRuns}
          </div>
        </div>
        <div className="border vol-ring vol-wash p-5 rounded-2xl">
          <div className="text-xs vol-t2 uppercase font-semibold">
            Telemetry Spent
          </div>
          <div className="text-2xl font-black vol-t1 mt-1">
            {sentinelStats.tokensConsumed} <span className="text-xs font-normal vol-t2">tokens</span>
          </div>
        </div>
        <div className="border vol-ring vol-wash p-5 rounded-2xl">
          <div className="text-xs vol-t2 uppercase font-semibold">
            Active Warnings
          </div>
          <div className="text-2xl font-black text-red-500 mt-1">
            {sentinelIssues.length}
          </div>
        </div>
        <div className="border vol-ring vol-wash p-5 rounded-2xl">
          <div className="text-xs vol-t2 uppercase font-semibold">
            Time Saved (Est.)
          </div>
          <div className="text-2xl font-black text-green-400 mt-1">
            {sentinelStats.timeSavedMinutes} <span className="text-xs font-normal vol-t2">mins</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 border vol-ring vol-panel p-6 rounded-3xl space-y-5">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Shield className="w-5 h-5 vol-accent" />
            Watchdog Diagnostic Heatmap
          </h2>

          <div className="space-y-3">
            {[
              {
                label: "Critical / Vulnerability",
                count: sentinelIssues.filter((i) => i.severity === "Critical").length,
                color: "bg-red-500",
              },
              {
                label: "High / Functional Logic",
                count: sentinelIssues.filter((i) => i.severity === "High").length,
                color: "bg-orange-500",
              },
              {
                label: "Medium / Performance",
                count: sentinelIssues.filter((i) => i.severity === "Medium").length,
                color: "bg-yellow-500",
              },
              {
                label: "Low / Code Smells",
                count: sentinelIssues.filter((i) => i.severity === "Low").length,
                color: "bg-blue-500",
              },
            ].map((bar, idx) => {
              const percent = (bar.count / maxVal) * 100;
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="vol-t2">{bar.label}</span>
                    <span className="vol-t1">{bar.count} issues</span>
                  </div>
                  <div className="h-2 w-full vol-wash rounded-full overflow-hidden">
                    <div
                      className={`h-full ${bar.color} transition-all duration-500`}
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t vol-line flex flex-wrap gap-3">
            <button
              onClick={handleApplySentinelPatch}
              className="px-5 py-2.5 rounded-xl vol-acc-bg text-black font-extrabold text-xs cursor-pointer"
            >
              APPLY SENTINEL PATCH
            </button>
            <button
              onClick={handleRunForceTelemetry}
              className="px-5 py-2.5 rounded-xl border vol-line hover:vol-wash vol-t1 text-xs font-bold cursor-pointer"
            >
              RUN FORCE TELEMETRY ANALYSIS
            </button>
          </div>
        </div>

        <div className="border vol-ring vol-panel p-6 rounded-3xl space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 vol-accent" />
            Passive Scan Feed
          </h2>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {sentinelIssues.length === 0 ? (
              <div className="text-center py-12 vol-t2 text-xs">
                Watcher scanning current editor inputs. Keep writing code...
              </div>
            ) : (
              sentinelIssues.map((issue, idx) => (
                <div
                  key={idx}
                  className="p-3 vol-surface rounded-xl border-l-4 vol-ring-strong text-xs"
                >
                  <div className="flex justify-between font-bold mb-1">
                    <span>{issue.type}</span>
                    <span className="vol-accent">{issue.severity}</span>
                  </div>
                  <p className="vol-t2 mb-2">{issue.description}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
