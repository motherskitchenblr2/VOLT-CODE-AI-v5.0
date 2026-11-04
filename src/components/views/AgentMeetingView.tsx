/**
 * Agents view — wraps MeetingPanel.
 */
import React from "react";
import { MeetingPanel } from "../MeetingPanel";

export const AgentMeetingView: React.FC = () => {
  return (
    <div className="p-4 sm:p-6 min-h-[100dvh] overflow-y-auto pb-28 sm:pb-16">
      <h1 className="text-lg sm:text-xl font-bold mb-6 vol-t1">Agent Room</h1>
      <MeetingPanel />
    </div>
  );
};
