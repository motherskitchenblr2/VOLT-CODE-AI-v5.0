import React, { useState } from "react";
import {
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  Download,
  Search,
} from "lucide-react";
import { motion } from "framer-motion";

interface Decision {
  id: string;
  title: string;
  description: string;
  votes: { agent: string; vote: "yes" | "no" | "abstain" }[];
  bossApproval: boolean;
  ownerApproval?: boolean;
  timestamp: Date;
}

interface ActionItem {
  id: string;
  description: string;
  assignedTo: string;
  dueDate: Date;
  status: "pending" | "in-progress" | "completed";
  priority: "low" | "medium" | "high" | "critical";
}

interface MeetingMinutes {
  id: string;
  title: string;
  date: Date;
  participants: string[];
  agenda: string[];
  decisions: Decision[];
  actionItems: ActionItem[];
  notes: string;
}

interface MeetingMinutesDisplayProps {
  meeting: MeetingMinutes;
  onUpdate?: (meeting: MeetingMinutes) => void;
}

export function MeetingMinutesDisplay({ meeting }: MeetingMinutesDisplayProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedDecision, setExpandedDecision] = useState<string | null>(null);

  const filteredDecisions = meeting.decisions.filter(
    (d) =>
      d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.description.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getVotePercentage = (
    decision: Decision,
    vote: "yes" | "no" | "abstain",
  ) => {
    const count = decision.votes.filter((v) => v.vote === vote).length;
    return meeting.participants.length > 0
      ? Math.round((count / meeting.participants.length) * 100)
      : 0;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="border-b border-[#FF5F00]/20 pb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">
              {meeting.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-white/60">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#FF5F00]" />
                {meeting.date.toLocaleDateString()}{" "}
                {meeting.date.toLocaleTimeString()}
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                {meeting.participants.length} participants
              </div>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#FF5F00]/20 hover:bg-[#FF5F00]/30 text-[#FF5F00] rounded-lg transition-all">
            <Download className="w-4 h-4" />
            Export PDF
          </button>
        </div>

        {/* Participants */}
        <div className="flex flex-wrap gap-2">
          {meeting.participants.map((participant, idx) => (
            <span
              key={idx}
              className="px-3 py-1 bg-blue-500/10 text-blue-300 rounded-full text-xs font-semibold"
            >
              {participant}
            </span>
          ))}
        </div>
      </div>

      {/* Agenda */}
      {meeting.agenda.length > 0 && (
        <div className="border border-white/10 rounded-xl p-6 bg-black/40">
          <h2 className="text-lg font-bold text-[#FF5F00] mb-4 uppercase tracking-wider">
            Agenda
          </h2>
          <ol className="space-y-2">
            {meeting.agenda.map((item, idx) => (
              <li key={idx} className="flex gap-3 text-sm text-white/80">
                <span className="font-bold text-[#FF5F00] min-w-fit">
                  {idx + 1}.
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <input
          type="text"
          placeholder="Search decisions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-black/60 border border-white/10 rounded-lg text-white text-sm focus:border-[#FF5F00]/40 outline-none"
        />
      </div>

      {/* Decisions & Voting */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-[#FF5F00] uppercase tracking-wider">
          Decisions & Approvals
        </h2>

        {filteredDecisions.map((decision, idx) => (
          <motion.div
            key={decision.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="border border-[#FF5F00]/20 rounded-xl overflow-hidden bg-black/40 hover:bg-black/60 transition-colors"
          >
            <button
              onClick={() =>
                setExpandedDecision(
                  expandedDecision === decision.id ? null : decision.id,
                )
              }
              className="w-full p-4 text-left flex items-start justify-between hover:bg-white/5 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-bold text-white">{decision.title}</h3>
                  {decision.bossApproval && (
                    <span className="px-2 py-1 bg-green-500/10 text-green-400 text-[10px] font-bold rounded">
                      BOSS APPROVED
                    </span>
                  )}
                  {decision.ownerApproval && (
                    <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-bold rounded">
                      OWNER APPROVED
                    </span>
                  )}
                </div>
                <p className="text-sm text-white/60">{decision.description}</p>
              </div>
              <motion.div
                animate={{ rotate: expandedDecision === decision.id ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <AlertCircle className="w-5 h-5 text-[#FF5F00]" />
              </motion.div>
            </button>

            {expandedDecision === decision.id && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: "auto" }}
                exit={{ height: 0 }}
                className="border-t border-[#FF5F00]/20 p-4 bg-black/20 space-y-4"
              >
                {/* Voting Results */}
                <div>
                  <div className="text-xs font-bold text-white/60 uppercase mb-3">
                    Team Voting Results
                  </div>
                  <div className="space-y-3">
                    {(["yes", "no", "abstain"] as const).map((vote) => (
                      <div key={vote} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-white/70 capitalize font-semibold">
                            {vote}
                          </span>
                          <span className="text-[#FF5F00] font-bold">
                            {getVotePercentage(decision, vote)}%
                          </span>
                        </div>
                        <div className="h-2 bg-black/60 rounded-full overflow-hidden border border-white/10">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${getVotePercentage(decision, vote)}%`,
                            }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                            className={`h-full ${
                              vote === "yes"
                                ? "bg-green-500"
                                : vote === "no"
                                  ? "bg-red-500"
                                  : "bg-yellow-500"
                            }`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                  <div>
                    <div className="text-[10px] text-white/40 uppercase font-bold mb-1">
                      Boss Status
                    </div>
                    <div
                      className={`text-sm font-bold ${decision.bossApproval ? "text-green-400" : "text-red-400"}`}
                    >
                      {decision.bossApproval ? "Approved" : "Pending"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-white/40 uppercase font-bold mb-1">
                      Decision Time
                    </div>
                    <div className="text-sm text-white/60">
                      {decision.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Action Items */}
      {meeting.actionItems.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-[#FF5F00] uppercase tracking-wider">
            Action Items
          </h2>

          {meeting.actionItems.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`p-4 rounded-lg border ${
                item.status === "completed"
                  ? "bg-green-500/5 border-green-500/20"
                  : "bg-black/40 border-[#FF5F00]/20"
              }`}
            >
              <div className="flex items-start gap-3">
                <CheckCircle
                  className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                    item.status === "completed"
                      ? "text-green-400"
                      : "text-white/40"
                  }`}
                />
                <div className="flex-1">
                  <div className="font-semibold text-white">
                    {item.description}
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-white/60">
                    <span>Assigned: {item.assignedTo}</span>
                    <span>Due: {item.dueDate.toLocaleDateString()}</span>
                    <span
                      className={`px-2 py-1 rounded ${
                        item.priority === "critical"
                          ? "bg-red-500/20 text-red-400"
                          : item.priority === "high"
                            ? "bg-orange-500/20 text-orange-400"
                            : item.priority === "medium"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-blue-500/20 text-blue-400"
                      }`}
                    >
                      {item.priority.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Notes */}
      {meeting.notes && (
        <div className="border border-white/10 rounded-xl p-6 bg-black/40">
          <h2 className="text-lg font-bold text-[#FF5F00] mb-4 uppercase tracking-wider">
            Additional Notes
          </h2>
          <p className="text-white/70 whitespace-pre-wrap">{meeting.notes}</p>
        </div>
      )}
    </div>
  );
}
