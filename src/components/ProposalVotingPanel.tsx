import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ThumbsUp, ThumbsDown, Minus, MessageSquare, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { ENTERPRISE_AGENTS } from '../services/EnterpriseAgentRegistry';
import { Proposal, ApprovalVote } from '../services/WorkflowEngine';

interface ProposalVotingPanelProps {
  proposal: Proposal;
  onVote?: (agentId: string, vote: 'approve' | 'reject' | 'abstain', comments: string) => void;
  onBossDecision?: (decision: 'approved' | 'rejected' | 'revising', feedback: string) => void;
  isBoss?: boolean;
  isUser?: boolean;
  votes?: ApprovalVote[];
}

export const ProposalVotingPanel: React.FC<ProposalVotingPanelProps> = ({
  proposal,
  onVote,
  onBossDecision,
  isBoss = false,
  isUser = false,
  votes = [],
}) => {
  const [votingAgentId, setVotingAgentId] = useState<string | null>(null);
  const [agentComments, setAgentComments] = useState('');
  const [showBossReview, setShowBossReview] = useState(false);
  const [bossComments, setBossComments] = useState('');
  const [showUserReview, setShowUserReview] = useState(false);
  const [userComments, setUserComments] = useState('');

  const approvalPercentage = ENTERPRISE_AGENTS.length > 0
    ? (proposal.approvedBy.length / ENTERPRISE_AGENTS.length) * 100
    : 0;

  const handleAgentVote = (agentId: string, vote: 'approve' | 'reject' | 'abstain') => {
    if (onVote) {
      onVote(agentId, vote, agentComments);
      setAgentComments('');
      setVotingAgentId(null);
    }
  };

  const handleBossDecision = (decision: 'approved' | 'rejected' | 'revising') => {
    if (onBossDecision) {
      onBossDecision(decision, bossComments);
      setBossComments('');
      setShowBossReview(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-white/10 pb-4">
        <h2 className="text-2xl font-bold text-white mb-2">{proposal.title}</h2>
        <p className="text-white/70 text-sm">{proposal.description}</p>
      </div>

      {/* Pros and Cons */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-green-600/10 border border-green-600/30 rounded-lg p-4"
        >
          <h3 className="text-green-400 font-bold mb-3">Advantages</h3>
          <ul className="space-y-2">
            {proposal.prosAndCons.pros.map((pro, idx) => (
              <li key={idx} className="flex gap-2 text-sm text-white/80">
                <span className="text-green-400">+</span>
                <span>{pro}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-red-600/10 border border-red-600/30 rounded-lg p-4"
        >
          <h3 className="text-red-400 font-bold mb-3">Concerns</h3>
          <ul className="space-y-2">
            {proposal.prosAndCons.cons.map((con, idx) => (
              <li key={idx} className="flex gap-2 text-sm text-white/80">
                <span className="text-red-400">−</span>
                <span>{con}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* Boss Approval Status */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white/5 border border-white/10 rounded-lg p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-bold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-400" />
            Boss Review & Approval
          </h3>
          <div
            className={`px-3 py-1 rounded text-xs font-bold ${
              proposal.bossApprovalStatus === 'approved'
                ? 'bg-green-600/30 text-green-400 border border-green-600'
                : proposal.bossApprovalStatus === 'rejected'
                  ? 'bg-red-600/30 text-red-400 border border-red-600'
                  : proposal.bossApprovalStatus === 'revising'
                    ? 'bg-orange-600/30 text-orange-400 border border-orange-600'
                    : 'bg-gray-600/30 text-gray-400 border border-gray-600'
            }`}
          >
            {proposal.bossApprovalStatus.toUpperCase()}
          </div>
        </div>

        {isBoss && proposal.bossApprovalStatus === 'pending' && (
          <div className="space-y-3">
            <textarea
              value={bossComments}
              onChange={(e) => setBossComments(e.target.value)}
              placeholder="Boss review comments..."
              className="w-full bg-white/10 border border-white/10 rounded p-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-yellow-500"
              rows={3}
            />
            <div className="flex gap-2">
              <button
                onClick={() => handleBossDecision('approved')}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded font-bold text-sm text-white cursor-pointer transition-colors"
              >
                <CheckCircle2 className="w-4 h-4 inline mr-2" />
                Approve
              </button>
              <button
                onClick={() => handleBossDecision('revising')}
                className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded font-bold text-sm text-white cursor-pointer transition-colors"
              >
                <AlertCircle className="w-4 h-4 inline mr-2" />
                Request Revisions
              </button>
              <button
                onClick={() => handleBossDecision('rejected')}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded font-bold text-sm text-white cursor-pointer transition-colors"
              >
                <XCircle className="w-4 h-4 inline mr-2" />
                Reject
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Team Voting */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white/5 border border-white/10 rounded-lg p-4"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-400" />
            Team Approval Voting
          </h3>
          <span className="text-xs text-white/60">
            {proposal.approvedBy.length}/{ENTERPRISE_AGENTS.length} Approved
          </span>
        </div>

        {/* Approval Progress */}
        <div className="mb-4">
          <div className="bg-white/10 rounded-full h-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${approvalPercentage}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-blue-500 to-green-500"
            />
          </div>
          <p className="text-xs text-white/60 mt-2">{approvalPercentage.toFixed(0)}% Team Approval</p>
        </div>

        {/* Voting Grid */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {ENTERPRISE_AGENTS.map(agent => {
            const agentVote = votes.find(v => v.agentId === agent.id);
            const hasVoted = proposal.approvedBy.includes(agent.id) || proposal.rejectedBy.includes(agent.id);

            return (
              <motion.button
                key={agent.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setVotingAgentId(votingAgentId === agent.id ? null : agent.id)}
                className={`p-2 rounded-lg border transition-all ${
                  hasVoted
                    ? proposal.approvedBy.includes(agent.id)
                      ? 'bg-green-600/20 border-green-600'
                      : 'bg-red-600/20 border-red-600'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mx-auto mb-1"
                  style={{
                    backgroundColor: agent.avatar.backgroundColor,
                    color: agent.avatar.textColor,
                  }}
                >
                  {agent.avatar.initials}
                </div>
                <p className="text-xs text-white/60 truncate">{agent.name.split(' ')[1]}</p>
              </motion.button>
            );
          })}
        </div>

        {/* Agent Voting Interface */}
        {votingAgentId && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-t border-white/10 pt-4 mt-4"
          >
            <p className="text-sm text-white/80 mb-3">
              Cast vote as{' '}
              <span className="font-bold">{ENTERPRISE_AGENTS.find(a => a.id === votingAgentId)?.name}</span>
            </p>
            <textarea
              value={agentComments}
              onChange={(e) => setAgentComments(e.target.value)}
              placeholder="Your comments on this proposal..."
              className="w-full bg-white/10 border border-white/10 rounded p-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-blue-500 mb-3"
              rows={3}
            />
            <div className="flex gap-2">
              <button
                onClick={() => handleAgentVote(votingAgentId, 'approve')}
                className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 rounded font-bold text-sm text-white cursor-pointer transition-colors flex items-center justify-center gap-2"
              >
                <ThumbsUp className="w-4 h-4" />
                Approve
              </button>
              <button
                onClick={() => handleAgentVote(votingAgentId, 'abstain')}
                className="flex-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 rounded font-bold text-sm text-white cursor-pointer transition-colors flex items-center justify-center gap-2"
              >
                <Minus className="w-4 h-4" />
                Abstain
              </button>
              <button
                onClick={() => handleAgentVote(votingAgentId, 'reject')}
                className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 rounded font-bold text-sm text-white cursor-pointer transition-colors flex items-center justify-center gap-2"
              >
                <ThumbsDown className="w-4 h-4" />
                Reject
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* User Approval */}
      {isUser && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-purple-600/10 border border-purple-600/30 rounded-lg p-4"
        >
          <h3 className="text-purple-400 font-bold mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            User (Owner) Final Approval
          </h3>
          {proposal.userApprovalStatus === 'pending' && (
            <div className="space-y-3">
              <textarea
                value={userComments}
                onChange={(e) => setUserComments(e.target.value)}
                placeholder="Owner approval comments..."
                className="w-full bg-white/10 border border-white/10 rounded p-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500"
                rows={3}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {}}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded font-bold text-sm text-white cursor-pointer transition-colors"
                >
                  Approve & Proceed
                </button>
                <button
                  onClick={() => {}}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded font-bold text-sm text-white cursor-pointer transition-colors"
                >
                  Reject
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};
