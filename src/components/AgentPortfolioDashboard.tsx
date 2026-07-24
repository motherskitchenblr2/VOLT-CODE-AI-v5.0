import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp, Target, Award, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { ENTERPRISE_AGENTS, BOSS_PROFILE } from '../services/EnterpriseAgentRegistry';
import { AgentAvatarManager } from '../services/AgentAvatarManager';
import { AgentProfileCard } from './AgentProfileCard';

interface AgentPortfolioDashboardProps {
  selectedAgent?: string;
  viewMode?: 'overview' | 'team' | 'boss' | 'details';
}

export const AgentPortfolioDashboard: React.FC<AgentPortfolioDashboardProps> = ({
  selectedAgent,
  viewMode: initialViewMode = 'overview',
}) => {
  const [viewMode, setViewMode] = useState(initialViewMode);
  const [expandedAgent, setExpandedAgent] = useState(selectedAgent);

  // Calculate team statistics
  const teamStats = {
    totalMembers: ENTERPRISE_AGENTS.length,
    avgQualityScore: (ENTERPRISE_AGENTS.reduce((sum, a) => sum + a.performanceMetrics.qualityScore, 0) / ENTERPRISE_AGENTS.length).toFixed(1),
    totalTasksCompleted: ENTERPRISE_AGENTS.reduce((sum, a) => sum + a.performanceMetrics.tasksCompleted, 0),
    avgSuccessRate: ((ENTERPRISE_AGENTS.reduce((sum, a) => sum + a.performanceMetrics.successRate, 0) / ENTERPRISE_AGENTS.length) * 100).toFixed(0),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-white mb-2">Enterprise Agent Portfolio</h1>
        <p className="text-white/60">Complete team management and workflow coordination system</p>
      </motion.div>

      {/* View Mode Tabs */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {['overview', 'team', 'boss', 'details'].map(mode => (
          <button
            key={mode}
            onClick={() => setViewMode(mode as any)}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all cursor-pointer ${
              viewMode === mode
                ? 'bg-blue-600 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            {mode.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Overview Mode */}
      {viewMode === 'overview' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-8"
        >
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white/5 border border-white/10 rounded-lg p-6 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-white/60 text-sm">Team Members</p>
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-3xl font-bold text-white">{teamStats.totalMembers}</p>
              <p className="text-xs text-white/40 mt-2">Specialized agents</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white/5 border border-white/10 rounded-lg p-6 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-white/60 text-sm">Avg Quality Score</p>
                <Award className="w-5 h-5 text-yellow-400" />
              </div>
              <p className="text-3xl font-bold text-white">{teamStats.avgQualityScore}/10</p>
              <p className="text-xs text-white/40 mt-2">Performance metric</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white/5 border border-white/10 rounded-lg p-6 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-white/60 text-sm">Tasks Completed</p>
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              </div>
              <p className="text-3xl font-bold text-white">{teamStats.totalTasksCompleted}</p>
              <p className="text-xs text-white/40 mt-2">Across all agents</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white/5 border border-white/10 rounded-lg p-6 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-white/60 text-sm">Success Rate</p>
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <p className="text-3xl font-bold text-white">{teamStats.avgSuccessRate}%</p>
              <p className="text-xs text-white/40 mt-2">Average completion</p>
            </motion.div>
          </div>

          {/* Department Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/10 rounded-lg p-6"
          >
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-400" />
              Departmental Organization
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {AgentAvatarManager.getAgentsByDepartmentWithColors().map(dept => (
                <div key={dept.department} className="bg-white/5 border border-white/10 rounded p-4">
                  <p className="font-bold text-white mb-2">{dept.department}</p>
                  <p className="text-sm text-white/60 mb-3">{dept.count} members</p>
                  <div className="flex flex-wrap gap-2">
                    {dept.agents.map(agent => (
                      <div
                        key={agent.id}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer hover:ring-2 ring-white/50 transition-all"
                        style={{
                          backgroundColor: agent.color,
                          color: 'white',
                        }}
                        title={agent.name}
                      >
                        {agent.initials}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Team Mode - Show all agents */}
      {viewMode === 'team' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          {ENTERPRISE_AGENTS.map((agent, idx) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => setExpandedAgent(agent.id)}
              className="cursor-pointer"
            >
              <AgentProfileCard agentId={agent.id} expanded={expandedAgent === agent.id} />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Boss Mode - Show boss profile and oversight */}
      {viewMode === 'boss' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Boss Profile Card */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-slate-700 to-slate-800 border-2 border-slate-600 rounded-xl p-8"
          >
            <div className="flex items-start gap-6">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center font-bold text-2xl"
                style={{
                  backgroundColor: BOSS_PROFILE.avatar.backgroundColor,
                  color: BOSS_PROFILE.avatar.textColor,
                }}
              >
                {BOSS_PROFILE.avatar.initials}
              </div>

              <div className="flex-1">
                <h2 className="text-3xl font-bold text-white mb-1">{BOSS_PROFILE.name}</h2>
                <p className="text-lg text-white/70 mb-4">{BOSS_PROFILE.title}</p>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-white/60 text-sm">Approvals</p>
                    <p className="text-2xl font-bold text-green-400">{BOSS_PROFILE.performanceMetrics.decisionsApproved}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Rejections</p>
                    <p className="text-2xl font-bold text-red-400">{BOSS_PROFILE.performanceMetrics.decisionsRejected}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Leadership Score</p>
                    <p className="text-2xl font-bold text-yellow-400">
                      {BOSS_PROFILE.performanceMetrics.overallLeadershipScore.toFixed(1)}/10
                    </p>
                  </div>
                </div>

                <p className="text-white/70 text-sm">
                  Oversees {BOSS_PROFILE.agentOversight.length} specialized team members across all departments
                </p>
              </div>
            </div>
          </motion.div>

          {/* Team Under Boss Oversight */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4">Team Under Oversight</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {BOSS_PROFILE.agentOversight.map((agentId, idx) => {
                const agent = ENTERPRISE_AGENTS.find(a => a.id === agentId);
                if (!agent) return null;

                return (
                  <motion.div
                    key={agentId}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 cursor-pointer transition-colors"
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold mb-2"
                      style={{
                        backgroundColor: agent.avatar.backgroundColor,
                        color: agent.avatar.textColor,
                      }}
                    >
                      {agent.avatar.initials}
                    </div>
                    <p className="font-bold text-white text-sm">{agent.name}</p>
                    <p className="text-xs text-white/60">{agent.title}</p>
                    <p className="text-xs text-white/40 mt-2">Score: {agent.performanceMetrics.qualityScore.toFixed(1)}/10</p>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Boss Responsibilities */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/5 border border-white/10 rounded-lg p-6"
          >
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-400" />
              Chief Responsibilities
            </h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {BOSS_PROFILE.responsibilities.map((resp, idx) => (
                <li key={idx} className="flex gap-2 text-white/70 text-sm">
                  <span className="text-yellow-400 flex-shrink-0">→</span>
                  <span>{resp}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      )}

      {/* Details Mode - Comprehensive information */}
      {viewMode === 'details' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white/5 border border-white/10 rounded-lg p-8"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Enterprise System Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* System Architecture */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">System Architecture</h3>
              <ul className="space-y-2 text-white/70 text-sm">
                <li className="flex gap-2">
                  <span className="text-blue-400">→</span>
                  <span>7 Specialized Agents + Boss Orchestrator</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-400">→</span>
                  <span>Hierarchical decision-making with team voting</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-400">→</span>
                  <span>Multi-stage workflow: Research → Discussion → Planning → Pitching → Voting → Development</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-400">→</span>
                  <span>Real-time collaboration with audit logging</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-400">→</span>
                  <span>Enterprise-grade security and compliance</span>
                </li>
              </ul>
            </div>

            {/* Core Features */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">Core Features</h3>
              <ul className="space-y-2 text-white/70 text-sm">
                <li className="flex gap-2">
                  <span className="text-green-400">✓</span>
                  <span>Autonomous agent coordination</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-400">✓</span>
                  <span>Boss-guided decision making</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-400">✓</span>
                  <span>User (Owner) PR approval authority</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-400">✓</span>
                  <span>Complete documentation generation</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-400">✓</span>
                  <span>Performance metrics and analytics</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Agent Assignments Reference */}
          <div className="mt-8 pt-8 border-t border-white/10">
            <h3 className="text-lg font-bold text-white mb-4">Agent Roster Reference</h3>
            <div className="space-y-2">
              {ENTERPRISE_AGENTS.map(agent => (
                <div key={agent.id} className="flex items-center gap-3 p-3 bg-white/5 rounded">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs"
                    style={{
                      backgroundColor: agent.avatar.backgroundColor,
                      color: agent.avatar.textColor,
                    }}
                  >
                    {agent.avatar.initials}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white">{agent.name}</p>
                    <p className="text-xs text-white/60">{agent.designation}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold" style={{ color: agent.color }}>
                      {agent.performanceMetrics.qualityScore.toFixed(1)}/10
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
