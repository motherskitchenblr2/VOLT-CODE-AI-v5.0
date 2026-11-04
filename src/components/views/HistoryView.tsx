/**
 * History view — previous sessions list with search.
 *
 * All state and handlers are passed as props from the shell.
 */
import React from "react";
import { Search } from "lucide-react";

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
    <div className="p-8 select-text h-full overflow-y-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          PREVIOUS SESSIONS
        </h1>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-3 w-4 h-4 vol-t2" />
          <input
            type="text"
            placeholder="Search sessions..."
            value={historySearch}
            onChange={(e) => setHistorySearch(e.target.value)}
            className="w-full vol-well border vol-ring py-2.5 pl-10 pr-4 rounded-xl text-sm vol-t1 focus:outline-none focus:vol-ring-hi transition-all"
          />
        </div>
      </div>

      {filteredSessions.length === 0 ? (
        <div className="text-center py-24 vol-accent-soft">
          No matching sessions. Run analysis to start history logs.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSessions.map((session, idx) => (
            <div
              key={idx}
              onClick={() => loadSession(session)}
              className="p-5 border vol-ring hover:vol-ring-hi rounded-2xl cursor-pointer group vol-panel transition-all"
            >
              <div className="flex justify-between mb-4">
                <div className="font-mono text-sm vol-accent">
                  {new Date(session.timestamp).toLocaleDateString()}
                </div>
                <div className="uppercase text-xs tracking-widest px-3 py-px vol-acc-wash vol-accent rounded font-bold">
                  {session.language}
                </div>
              </div>
              <div className="font-semibold line-clamp-2 text-lg mb-3 pr-2 vol-t1/95">
                {session.summary}
              </div>
              <div className="text-xs vol-accent-soft font-bold">
                {session.issues.length} FIXES COMPLETED
              </div>
              {session.modelUsed && (
                <div className="text-xs vol-t2 mt-2">
                  Model: {session.modelUsed}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
