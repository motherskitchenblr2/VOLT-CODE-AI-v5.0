import React from "react";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";

interface SwarmPanelProps {
  /** { "Agent Name": score 0-100 } — live when known, else fallback roster */
  agentBreakdown: Record<string, number>;
  consensusScore: number | null;
  consensusPassed: boolean | null;
  isAnalyzing: boolean;
}

/** Static fallback roster — the pipeline's actual agent classes. */
const ROSTER: Array<{ key: string; label: string; role: string }> = [
  { key: "Triage Agent", label: "Triage", role: "router" },
  { key: "Code Generator", label: "Generator", role: "worker" },
  { key: "Security Agent", label: "Security", role: "senior" },
  { key: "Monad Agent", label: "Q&A", role: "senior" },
  { key: "Consensus", label: "Consensus", role: "matrix" },
];

/**
 * Agent Swarm visualization: hub-and-spoke SVG graph.
 * Nodes pulse when an orchestration is running; node opacity = health score.
 * ponytail: 2D SVG graph, not canvas/d3 — upgrade to force-graph if >8 agents.
 */
export const SwarmPanel: React.FC<SwarmPanelProps> = ({
  agentBreakdown = {},
  consensusScore,
  consensusPassed,
  isAnalyzing,
}) => {
  const nodes = ROSTER.map((r) => ({
    ...r,
    score: agentBreakdown[r.key] ?? agentBreakdown[`${r.label} Agent`] ?? null,
  }));

  // Hub center + ring positions
  const CX = 250;
  const CY = 160;
  const pos = (i: number, n: number) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return { x: CX + 150 * Math.cos(angle), y: CY + 100 * Math.sin(angle) };
  };

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto select-none">
      <div className="flex items-center gap-3 mb-4">
        <Zap className="w-5 h-5 vol-accent" />
        <h1 className="text-xl font-black tracking-widest vol-t1">
          AGENT SWARM
        </h1>
        <span
          className={`flex items-center gap-1.5 text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full border ${
            isAnalyzing
              ? "vol-ring-strong vol-accent animate-pulse"
              : "border-green-500/40 text-green-400"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isAnalyzing ? "vol-acc-bg" : "bg-green-500"
            }`}
          />
          {isAnalyzing ? "ORCHESTRATION RUNNING" : "IDLE — READY"}
        </span>
      </div>

      <div className="rounded-2xl border vol-ring vol-surface p-2">
        <svg
          viewBox="0 0 500 320"
          className="w-full h-auto"
          role="img"
          aria-label="Agent swarm topology diagram"
        >
          {/* edges */}
          {nodes.map((n, i) => {
            const p = pos(i, nodes.length);
            return (
              <line
                key={`e${i}`}
                x1={CX}
                y1={CY}
                x2={p.x}
                y2={p.y}
                stroke="#FF5F00"
                strokeOpacity={isAnalyzing ? 0.8 : 0.25}
                strokeWidth={2}
                strokeDasharray="6 4"
              >
                {isAnalyzing && (
                  <animate
                    attributeName="stroke-dashoffset"
                    from="20"
                    to="0"
                    dur="1s"
                    repeatCount="indefinite"
                  />
                )}
              </line>
            );
          })}

          {/* hub */}
          <circle
            cx={CX}
            cy={CY}
            r="34"
            fill="#0a0a0a"
            stroke="#FF5F00"
            strokeWidth="2"
          />
          <text
            x={CX}
            y={CY - 2}
            textAnchor="middle"
            fill="#FF5F00"
            fontSize="10"
            fontWeight="bold"
          >
            ORCHESTRATOR
          </text>
          <text
            x={CX}
            y={CY + 12}
            textAnchor="middle"
            fill="#fff"
            fontSize="12"
            fontWeight="bold"
          >
            {isAnalyzing ? "RUNNING" : "IDLE"}
          </text>

          {/* agent nodes */}
          {nodes.map((n, i) => {
            const p = pos(i, nodes.length);
            const active = n.score !== null;
            return (
              <g key={n.key}>
                <motion.circle
                  cx={p.x}
                  cy={p.y}
                  r="26"
                  fill={active ? `rgba(255,95,0,${0.1 + (n.score / 100) * 0.35})` : "#0a0a0a"}
                  stroke={
                    active && n.score >= 70 ? "#22c55e" : active ? "#f59e0b" : "#3a3a3a"
                  }
                  strokeWidth="2"
                  animate={isAnalyzing ? { opacity: [0.5, 1, 0.5] } : { opacity: 1 }}
                  transition={{ duration: 1.6, repeat: isAnalyzing ? Infinity : 0, delay: i * 0.2 }}
                />
                <text
                  x={p.x}
                  y={p.y + 4}
                  textAnchor="middle"
                  fill="#fff"
                  fontSize="10"
                  fontWeight="bold"
                >
                  {n.label}
                </text>
                <text
                  x={p.x}
                  y={p.y + 42}
                  textAnchor="middle"
                  fill={investigateFill(n.score)}
                  fontSize="10"
                >
                  {n.score !== null ? `${n.score}%` : "standby"}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* consensus footer */}
      <div className="mt-4 flex items-center gap-4 text-xs">
        {consensusScore !== null ? (
          <span
            className={`px-3 py-1 rounded-lg font-bold ${
              consensusPassed
                ? "bg-green-500/15 text-green-400"
                : "bg-red-500/15 text-red-400"
            }`}
          >
            CONSENSUS: {consensusScore}/100 {consensusPassed ? "PASSED" : "REJECTED"}
          </span>
        ) : (
          <span className="vol-t2">
            Run an AI analysis to activate the swarm and populate live scores.
          </span>
        )}
      </div>
    </div>
  );
};

function investigateFill(score: number | null): string {
  if (score === null) return "rgba(255,255,255,0.3)";
  if (score >= 70) return "#22c55e";
  if (score >= 40) return "#f59e0b";
  return "#ef4444";
}
