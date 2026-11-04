/**
 * Swarm view — wraps SwarmPanel.
 * View-specific state (agentBreakdown, consensusScore, etc.) is passed as
 * props from the shell; shared state can be consumed via useVolt().
 */
import React from "react";
import { SwarmPanel } from "../SwarmPanel";

interface SwarmViewProps {
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
    <div className="p-4 sm:p-6 min-h-[100dvh] overflow-y-auto pb-28 sm:pb-16">
      <h1 className="text-lg sm:text-xl font-bold mb-6 vol-t1">Agent Swarm</h1>
      <SwarmPanel
        agentBreakdown={agentBreakdown}
        consensusScore={consensusScore}
        consensusPassed={consensusPassed}
        isAnalyzing={isAnalyzing}
      />
    </div>
  );
};
