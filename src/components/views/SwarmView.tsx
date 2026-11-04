/**
 * Swarm view — Agent Swarm visualization.
 *
 * Shared state (agentBreakdown, consensusScore, etc.) comes from
 * VoltContext. App-owned state/handlers are passed as props.
 *
 * Built on design system tokens (design-system/volt-code-ai/MASTER.md).
 * All colors, spacing, shadows, and typography use --ds-* CSS variables.
 * No emojis as icons — Lucide SVG only.
 */
import React from "react";
import { Panel } from "../ui/Panel";
import { SwarmPanel } from "../SwarmPanel";

export interface SwarmViewProps {
  agentBreakdown: Record<string, number>;
  consensusScore: number | null;
  consensusPassed: boolean | null;
  isAnalyzing: boolean;
}

export const SwarmView: React.FC<SwarmViewProps> = ({
  agentBreakdown,
  consensusScore,
  consensusPassed,
  isAnalyzing,
}) => {
  return (
    <Panel padded={true} className="p-4 sm:p-6 min-h-[100dvh] overflow-y-auto pb-28 sm:pb-16">
      <h1 className="text-lg sm:text-xl font-bold mb-6 text-[#F8FAFC]">Agent Swarm</h1>
      <SwarmPanel
        agentBreakdown={agentBreakdown}
        consensusScore={consensusScore}
        consensusPassed={consensusPassed}
        isAnalyzing={isAnalyzing}
      />
    </Panel>
  );
};
