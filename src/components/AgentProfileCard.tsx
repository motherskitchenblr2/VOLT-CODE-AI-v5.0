import React from 'react';
import { motion } from 'framer-motion';
import { Award, Briefcase, Code2, Target } from 'lucide-react';
import { ENTERPRISE_AGENTS } from '../services/EnterpriseAgentRegistry';
import { AgentAvatarManager } from '../services/AgentAvatarManager';

interface AgentProfileCardProps {
  agentId: string;
  expanded?: boolean;
}

export const AgentProfileCard: React.FC<AgentProfileCardProps> = ({
  agentId,
  expanded = false,
}) => {
  const agent = ENTERPRISE_AGENTS.find(a => a.id === agentId);
  if (!agent) return null;

  const performanceBadge = AgentAvatarManager.getPerformanceBadge(
    agent.performanceMetrics.qualityScore
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-xl border border-white/10 overflow-hidden bg-gradient-to-br from-white/5 to-white/[0.02]"
    >
      {/* Header with Avatar */}
      <div
        className="p-4 text-white"
        style={{
          background: `linear-gradient(135deg, ${agent.avatar.backgroundColor}20 0%, ${agent.avatar.backgroundColor}40 100%)`,
        }}
      >
        <div className="flex items-start gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-lg"
            style={{
              backgroundColor: agent.avatar.backgroundColor,
              color: agent.avatar.textColor,
            }}
          >
            {agent.avatar.initials}
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-bold text-white">{agent.name}</h3>
            <p className="text-sm font-semibold" style={{ color: agent.color }}>
              {agent.title}
            </p>
            <p className="text-xs text-white/70 mt-1">{agent.designation}</p>
          </div>

          <div className="text-right">
            <div
              className="px-2 py-1 rounded text-xs font-bold text-white"
              style={{ backgroundColor: performanceBadge.color }}
            >
              {performanceBadge.label}
            </div>
            <p className="text-xs text-white/60 mt-1">
              {agent.performanceMetrics.qualityScore.toFixed(1)}/10
            </p>
          </div>
        </div>

        <p className="text-xs text-white/80 mt-3">{agent.description}</p>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/5 rounded-lg p-2 text-center">
            <p className="text-xs text-white/60">Tasks</p>
            <p className="text-base font-bold text-white">
              {agent.performanceMetrics.tasksCompleted}
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-2 text-center">
            <p className="text-xs text-white/60">Success</p>
            <p className="text-base font-bold" style={{ color: agent.color }}>
              {(agent.performanceMetrics.successRate * 100).toFixed(0)}%
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-2 text-center">
            <p className="text-xs text-white/60">Response</p>
            <p className="text-base font-bold text-white">
              {agent.performanceMetrics.averageResponseTime.toFixed(1)}h
            </p>
          </div>
        </div>

        {/* Department */}
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4" style={{ color: agent.color }} />
          <span className="text-sm text-white/80">{agent.department}</span>
        </div>

        {/* Personality Traits */}
        <div>
          <p className="text-xs font-semibold text-white/60 mb-2 flex items-center gap-1">
            <Target className="w-3 h-3" /> Personality
          </p>
          <div className="flex flex-wrap gap-1">
            {agent.personality.traits.map((trait, idx) => (
              <span key={idx} className="text-xs bg-white/10 px-2 py-1 rounded text-white/80">
                {trait}
              </span>
            ))}
          </div>
        </div>

        {/* Expertise */}
        {expanded && (
          <div>
            <p className="text-xs font-semibold text-white/60 mb-2 flex items-center gap-1">
              <Code2 className="w-3 h-3" /> Expertise
            </p>
            <div className="space-y-2">
              {agent.expertise.map((exp, idx) => (
                <div key={idx} className="bg-white/5 rounded p-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-white">{exp.domain}</span>
                    <span
                      className="text-xs px-2 py-1 rounded font-bold text-white"
                      style={{
                        backgroundColor:
                          exp.level === 'expert'
                            ? '#4CAF50'
                            : exp.level === 'advanced'
                              ? '#2196F3'
                              : '#FF9800',
                      }}
                    >
                      {exp.level}
                    </span>
                  </div>
                  <p className="text-xs text-white/60 mt-1">
                    {exp.yearsOfExperience} years • {exp.specializations.join(', ')}
                  </p>
                  {exp.certifications.length > 0 && (
                    <div className="flex items-center gap-1 mt-2">
                      <Award className="w-3 h-3 text-yellow-400" />
                      <span className="text-xs text-white/70">
                        {exp.certifications.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Configuration */}
        {expanded && (
          <div className="border-t border-white/10 pt-3 mt-3">
            <p className="text-xs font-semibold text-white/60 mb-2">AI Configuration</p>
            <div className="bg-white/5 rounded p-2 text-xs text-white/70 space-y-1">
              <p>Model: {agent.aiConfiguration.modelId}</p>
              <p>Temperature: {agent.aiConfiguration.temperature}</p>
              <p>Max Tokens: {agent.aiConfiguration.maxTokens}</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export const AgentTeamGrid: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {ENTERPRISE_AGENTS.map(agent => (
        <AgentProfileCard key={agent.id} agentId={agent.id} expanded={false} />
      ))}
    </div>
  );
};
