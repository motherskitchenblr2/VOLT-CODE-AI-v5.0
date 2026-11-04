/**
 * Diagnostics column — right-rail sentinel findings, consensus gate,
 * severity breakdown, and active workforce sub-agents.
 *
 * Shared state (agentBreakdown) comes from VoltContext.
 * App-owned state/handlers are passed as props.
 */
import React from "react";

interface SentinelIssue {
  id: number;
  type: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  description: string;
  explanation: string;
  original: string;
  fixed: string;
}

export interface DiagnosticsColumnProps {
  sentinelIssues: SentinelIssue[];
  consensusScore: number | null;
  consensusPassed: boolean | null;
  consensusFeedback: string[];
  agentBreakdown: Record<string, number>;
}

export const DiagnosticsColumn: React.FC<DiagnosticsColumnProps> = ({
  sentinelIssues,
  consensusScore,
  consensusPassed,
  consensusFeedback,
  agentBreakdown,
}) => {
  return (
    <div className="space-y-6 select-none">
      {/* ACTIVE SENTINEL FINDINGS */}
      <div className="border vol-line vol-elev rounded-2xl p-4 space-y-3">
        <div className="text-[10px] vol-t2 uppercase font-black tracking-wider">
          Sentinel Findings
        </div>
        <div className="text-3xl font-black vol-t1">
          {sentinelIssues.length}
          <span className="text-xs vol-t2 font-normal">/100</span>
        </div>
        <div className="w-full vol-wash h-1.5 rounded-full overflow-hidden">
          <div
            className="vol-acc-bg h-full"
            style={{ width: `${Math.min(sentinelIssues.length, 5) * 20}%` }}
          />
        </div>
        <div className="text-[10px] vol-t2">
          {sentinelIssues.length === 0
            ? "No active findings."
            : `${sentinelIssues.length} issue(s) flagged by SkillSpector.`}
        </div>
      </div>

      {/* QUALITY CONSENSUS GATE */}
      {consensusScore !== null && (
        <div
          className={`border rounded-2xl p-4 space-y-3 ${
            consensusPassed
              ? "border-green-500/30 bg-green-950/10"
              : "border-red-500/30 bg-red-950/10"
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="text-[10px] vol-t2 uppercase font-black tracking-wider">
              Consensus Gate Check
            </span>
            <span
              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                consensusPassed
                  ? "bg-green-500/20 text-green-400"
                  : "bg-red-500/20 text-red-400"
              }`}
            >
              {consensusPassed ? "PASSED" : "REJECTED"}
            </span>
          </div>
          <div className="text-2xl font-black vol-t1">
            {consensusScore}
            <span className="text-xs vol-t2 font-normal">/100</span>
          </div>

          <div className="space-y-1 pt-1.5 border-t vol-line">
            {Object.entries(agentBreakdown).map(([agent, score]) => (
              <div
                key={agent}
                className="flex justify-between text-[10px] vol-t2"
              >
                <span className="truncate">{agent}</span>
                <span className="font-mono font-bold">{score}/100</span>
              </div>
            ))}
          </div>

          {consensusFeedback.length > 0 && (
            <div className="space-y-1 mt-2 text-[9px] vol-t2 max-h-24 overflow-y-auto pr-1">
              {consensusFeedback.map((f, i) => (
                <div key={i} className="flex gap-1.5 items-start">
                  <span className="vol-accent font-bold">•</span>
                  <span>{f}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SENTINEL FINDINGS BY SEVERITY */}
      <div className="border vol-line vol-elev rounded-2xl p-4 space-y-4">
        <div className="text-[10px] vol-t2 uppercase font-black tracking-wider font-semibold">
          Findings by Severity
        </div>
        <div className="space-y-3">
          {[
            {
              label: "Critical",
              items: sentinelIssues.filter((i) => i.severity === "Critical"),
              color: "text-red-400",
            },
            {
              label: "High",
              items: sentinelIssues.filter((i) => i.severity === "High"),
              color: "text-orange-400",
            },
            {
              label: "Medium",
              items: sentinelIssues.filter((i) => i.severity === "Medium"),
              color: "text-yellow-400",
            },
            {
              label: "Low",
              items: sentinelIssues.filter((i) => i.severity === "Low"),
              color: "text-blue-400",
            },
          ].map((group) => {
            if (group.items.length === 0) return null;
            return (
              <div key={group.label} className="space-y-1.5">
                <div
                  className={`text-[9px] font-black uppercase ${group.color}`}
                >
                  {group.label} ({group.items.length})
                </div>
                <div className="space-y-1">
                  {group.items.map((iss, idx) => (
                    <div
                      key={idx}
                      className="p-2 vol-panel border vol-line rounded-lg text-[10px] vol-t1"
                    >
                      {iss.description}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {sentinelIssues.length === 0 && (
            <div className="text-center vol-t2 py-8 text-[10px] font-mono">
              No sentinel findings. Repository is clean.
            </div>
          )}
        </div>
      </div>

      {/* ACTIVE WORKFORCE SUB-AGENTS */}
      <div className="border vol-line vol-elev rounded-2xl p-4 space-y-3">
        <div className="text-[10px] vol-t2 uppercase font-black tracking-wider">
          AI Junior Workers
        </div>
        <div className="space-y-2">
          {[
            { name: "Worker CodeGen", role: "Patch Generator" },
            { name: "Worker Tester", role: "Test Verification" },
            { name: "Worker Linter", role: "Syntax Cleaner" },
          ].map((agent) => (
            <div
              key={agent.name}
              className="flex justify-between items-center text-[10px] p-2 vol-panel border vol-line rounded-xl"
            >
              <div>
                <div className="font-bold vol-t1">{agent.name}</div>
                <div className="text-[9px] vol-t2 mt-0.5">{agent.role}</div>
              </div>
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
