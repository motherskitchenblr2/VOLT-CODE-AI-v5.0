/**
 * Meeting view — Meeting Panel + Boss Guidance + Meeting Minutes.
 *
 * Shared state (agentBreakdown, consensusScore, etc.) comes from
 * VoltContext. App-owned state/handlers are passed as props.
 */
import React from "react";
import { MeetingPanel } from "../MeetingPanel";
import { BossGuidancePanel } from "../BossGuidancePanel";
import { MeetingMinutesDisplay } from "../MeetingMinutesDisplay";

interface MeetingViewProps {
  agentBreakdown: Record<string, number>;
  consensusScore: number | null;
  consensusPassed: boolean | null;
  consensusFeedback: string[] | string | null;
  guidanceDismissed: boolean;
  setGuidanceDismissed: (v: boolean) => void;
  onClose: () => void;
}

export const MeetingView: React.FC<MeetingViewProps> = ({
  agentBreakdown,
  consensusScore,
  consensusPassed,
  consensusFeedback,
  guidanceDismissed,
  setGuidanceDismissed,
  onClose,
}) => {
  const agentNames = Object.keys(agentBreakdown);
  const participants = agentNames.length
    ? agentNames
    : ["Security", "QA", "UI", "Architect"];
  const score = consensusScore ?? 0;
  const minutes = {
    id: `mtg-${score}`,
    title: "Agent Swarm Sync",
    date: new Date(),
    participants,
    agenda: ["Review latest analysis", "Approve fixes"],
    decisions: participants.map((name, i) => ({
      id: `d-${i}`,
      title: `${name} verdict`,
      description:
        agentBreakdown[name] !== undefined
          ? `Score ${agentBreakdown[name]}/100`
          : "Awaiting run",
      votes: [
        {
          agent: "Triage",
          vote: (agentBreakdown[name] ?? 0) >= 70 ? "yes" : "no",
        } as const,
      ],
      bossApproval: Boolean(consensusPassed),
      timestamp: new Date(),
    })),
    actionItems: participants.map((name, i) => ({
      id: `a-${i}`,
      description: `Apply fixes approved by ${name}`,
      assignedTo: name,
      dueDate: new Date(),
      status: "pending" as "pending" | "in-progress" | "completed",
      priority: "medium" as const,
    })),
    notes:
      (Array.isArray(consensusFeedback)
        ? consensusFeedback.join(" ")
        : consensusFeedback) ||
      "No consensus feedback yet — run an analysis.",
  };
  const guidance =
    !consensusPassed && score > 0
      ? {
          id: "g-1",
          prNumber: 0,
          reason: "Consensus score below the merge threshold",
          concern: "rejected-critical-fix" as const,
          recommendation:
            (Array.isArray(consensusFeedback)
              ? consensusFeedback.join(" ")
              : consensusFeedback) ||
            "Retry with a stricter skill or repair the flagged issues.",
          agentFeedback: participants.map(
            (n) => `${n}: ${agentBreakdown[n] ?? "?"}/100`,
          ),
          riskLevel: (score < 40
            ? "critical"
            : score < 60
              ? "high"
              : "medium") as "low" | "medium" | "high" | "critical",
          timestamp: new Date(),
        }
      : null;

  return (
    <div className="w-full h-full overflow-y-auto">
      <MeetingPanel onClose={onClose} />
      <div className="p-4 md:p-6 space-y-4">
        {guidance && !guidanceDismissed && (
          <BossGuidancePanel
            guidance={guidance}
            onDismiss={() => setGuidanceDismissed(true)}
            onAccept={() => setGuidanceDismissed(true)}
            onConfirm={() => setGuidanceDismissed(true)}
          />
        )}
        <MeetingMinutesDisplay meeting={minutes} />
      </div>
    </div>
  );
};
