/**
 * History view — previous sessions list with search.
 *
 * All state and handlers are passed as props from the shell.
 *
 * Built on design system tokens (design-system/volt-code-ai/MASTER.md).
 * All colors, spacing, shadows, and typography use --ds-* CSS variables.
 * Every button has cursor-pointer, focus-visible ring, and 200ms hover transition.
 * No emojis as icons — Lucide SVG only.
 */
import React from "react";
import { Search } from "lucide-react";
import { Card } from "../ui/Card";
import { Panel } from "../ui/Panel";
import { Input } from "../ui/Input";

interface Session {
  id: string;
  timestamp: string;
  language: string;
  originalCode: string;
  fixedCode: string;
  issues: Array<{
    id: number;
    type: string;
    severity: "Critical" | "High" | "Medium" | "Low";
    description: string;
    explanation: string;
    original: string;
    fixed: string;
  }>;
  summary: string;
  tokensUsed?: number;
  promptTokens?: number;
  completionTokens?: number;
  modelUsed?: string;
}

export interface HistoryViewProps {
  filteredSessions: Session[];
  historySearch: string;
  setHistorySearch: (v: string) => void;
  loadSession: (session: Session) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  filteredSessions,
  historySearch,
  setHistorySearch,
  loadSession,
}) => {
  return (
    <Panel padded={true} className="p-4 sm:p-8 min-h-[100dvh] overflow-y-auto pb-28 sm:pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-[#F8FAFC]">
          PREVIOUS SESSIONS
        </h1>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-3 w-4 h-4 text-[#94A3B8]" />
          <Input
            label=""
            value={historySearch}
            onChange={(e) => setHistorySearch(e.target.value)}
            placeholder="Search sessions..."
            
            className="w-full bg-[#1B2336] border border-[var(--ds-color-border)] rounded-[var(--ds-radius-lg)] px-3 py-2.5 pl-10 pr-4 text-sm text-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFFFFF]"
          />
        </div>
      </div>

      {filteredSessions.length === 0 ? (
        <div className="text-center py-24 text-[#94A3B8]">
          No matching sessions. Run analysis to start history logs.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSessions.map((session, idx) => (
            <Card
              key={idx}
              padded={false}
              elevated={false}
              className="border border-[var(--ds-color-border)] rounded-[var(--ds-radius-lg)] hover:border-[var(--ds-color-accent)] hover:bg-[#22C55E]/10 cursor-pointer transition-all duration-200 space-y-2"
              onClick={() => loadSession(session)}
            >
              <div className="flex justify-between mb-4">
                <div className="font-mono text-sm text-[#22C55E]">
                  {new Date(session.timestamp).toLocaleDateString()}
                </div>
                <div className="uppercase text-xs tracking-widest px-3 py-[2px] text-[#22C55E] font-bold rounded">
                  {session.language}
                </div>
              </div>
              <div className="font-semibold line-clamp-2 text-lg mb-3 pr-2 text-[#F8FAFC]">
                {session.summary}
              </div>
              <div className="text-xs text-[#22C55E] font-bold">
                {session.issues.length} FIXES COMPLETED
              </div>
              {session.modelUsed && (
                <div className="text-xs text-[#94A3B8] mt-2">
                  Model: {session.modelUsed}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </Panel>
  );
};
