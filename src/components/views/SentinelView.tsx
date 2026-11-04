/**
 * Sentinel view — security risk board with watchdog telemetry,
 * severity heatmap, passive scan feed, and sentinel patch application.
 *
 * Shared state (enableSentinel, code, detectedLanguage) comes from
 * VoltContext. App-owned state/handlers are passed as props.
 *
 * Built on design system tokens (design-system/volt-code-ai/MASTER.md).
 */
import React from "react";
import { Shield, Sparkles } from "lucide-react";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

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

  // Pre-compute dynamic classNames using string concatenation
  const sentinelDotClass =
    "w-2 h-2 rounded-full " +
    (enableSentinel ? "bg-[#22C55E] animate-pulse" : "bg-[#EF4444]");
  const monitorTextClass = "font-semibold text-[#F8FAFC]";
  const _lastScanClass =
    "px-4 py-2 rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border)] text-sm text-[#22C55E]";

  const severityBars = [
    { label: "Critical / Vulnerability", count: sentinelIssues.filter((i) => i.severity === "Critical").length, color: "bg-[#EF4444]" },
    { label: "High / Functional Logic", count: sentinelIssues.filter((i) => i.severity === "High").length, color: "bg-[#F59E0B]" },
    { label: "Medium / Performance", count: sentinelIssues.filter((i) => i.severity === "Medium").length, color: "bg-[#EAB308]" },
    { label: "Low / Code Smells", count: sentinelIssues.filter((i) => i.severity === "Low").length, color: "bg-[#3B82F6]" },
  ].map((bar) => {
    const percent = (bar.count / maxVal) * 100;
    const barFillClass = "h-full " + bar.color + " transition-all duration-500";
    const barFillStyle = { width: percent + "%" };
    return (
      <div key={bar.label} className="space-y-1">
        <div className="flex justify-between text-xs font-semibold">
          <span className="text-[#94A3B8]">{bar.label}</span>
          <span className="text-[#F8FAFC]">{bar.count} issues</span>
        </div>
        <div className="h-2 w-full bg-[#334155]/20 rounded-full overflow-hidden">
          <div className={barFillClass} style={barFillStyle}></div>
        </div>
      </div>
    );
  });

  return (
    <div className="p-8 h-full overflow-auto space-y-6 bg-[#0F172A]">
      <div className="flex items-center justify-between gap-4 flex-wrap border-b border-[var(--ds-color-border)] pb-6">
        <div>
          <div className="text-[#22C55E] text-xs tracking-[3px] font-bold uppercase mb-1">
            Live Telemetry & Telemetric Scan
          </div>
          <h1 className="text-3xl font-extrabold text-[#F8FAFC]">SENTINEL OPERATIONS</h1>
        </div>
        <div className="flex items-center gap-3">
          <Card padded={false} elevated={false} className="flex items-center gap-2 px-4 py-2 rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border)] text-sm">
            <span className={sentinelDotClass}></span>
            <span className={monitorTextClass}>MONITOR: {enableSentinel ? "ACTIVE" : "STANDBY"}</span>
          </Card>
          <Card padded={false} elevated={false} className="px-4 py-2 rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border)] text-sm text-[#22C55E]">
            Last Watch-Scan: {lastSentinelScan}
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card padded={false} elevated={false}>
          <div className="text-xs text-[#94A3B8] uppercase font-semibold mb-1">Checks Executed</div>
          <div className="text-2xl font-black text-[#22C55E] mt-1">{sentinelStats.totalRuns}</div>
        </Card>
        <Card padded={false} elevated={false}>
          <div className="text-xs text-[#94A3B8] uppercase font-semibold mb-1">Telemetry Spent</div>
          <div className="text-2xl font-black text-[#F8FAFC] mt-1">{sentinelStats.tokensConsumed} <span className="text-xs font-normal text-[#94A3B8]">tokens</span></div>
        </Card>
        <Card padded={false} elevated={false}>
          <div className="text-xs text-[#94A3B8] uppercase font-semibold mb-1">Active Warnings</div>
          <div className="text-2xl font-black text-[#EF4444] mt-1">{sentinelIssues.length}</div>
        </Card>
        <Card padded={false} elevated={false}>
          <div className="text-xs text-[#94A3B8] uppercase font-semibold mb-1">Time Saved (Est.)</div>
          <div className="text-2xl font-black text-[#22C55E] mt-1">{sentinelStats.timeSavedMinutes} <span className="text-xs font-normal text-[#94A3B8]">mins</span></div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card padded={false} elevated={false} className="lg:col-span-2 p-6 space-y-5">
          <h2 className="text-lg font-bold flex items-center gap-2 text-[#F8FAFC]">
            <Shield className="w-5 h-5 text-[#22C55E]" />
            Watchdog Diagnostic Heatmap
          </h2>
          <div className="space-y-3">{severityBars}</div>
          <div className="pt-4 border-t border-[var(--ds-color-border)] flex flex-wrap gap-3">
            <Button variant="primary" size="sm" onClick={handleApplySentinelPatch}>
              APPLY SENTINEL PATCH
            </Button>
            <Button variant="ghost" size="sm" onClick={handleRunForceTelemetry}>
              RUN FORCE TELEMETRY ANALYSIS
            </Button>
          </div>
        </Card>
        <Card padded={false} elevated={false} className="p-6 space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2 text-[#F8FAFC]">
            <Sparkles className="w-5 h-5 text-[#22C55E]" />
            Passive Scan Feed
          </h2>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {sentinelIssues.length === 0 ? (
              <div className="text-center py-12 text-[#94A3B8] text-xs">
                Watcher scanning current editor inputs. Keep writing code...
              </div>
            ) : (
              sentinelIssues.map((issue, idx) => (
                <div key={idx} className="p-3 rounded-[var(--ds-radius-md)] border border-l-4 border-[#22C55E]/40 bg-[#1B2336] text-xs">
                  <div className="flex justify-between font-bold mb-1">
                    <span className="text-[#F8FAFC]">{issue.type}</span>
                    <span className="text-[#22C55E]">{issue.severity}</span>
                  </div>
                  <p className="text-[#94A3B8] mb-2">{issue.description}</p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
