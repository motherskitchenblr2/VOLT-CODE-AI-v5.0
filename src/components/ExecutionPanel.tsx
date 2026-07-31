import React from 'react';
import { MeetingTask, Agent } from '../services/AgentCommunication';
import { CheckCircle2, Clock, AlertCircle, Zap, GitBranch, FileCode, CheckSquare } from 'lucide-react';

interface ExecutionPanelProps {
  tasks: MeetingTask[];
  agents: Map<string, Agent>;
  bossPresent: boolean;
  language: 'en' | 'hi';
}

const statusConfig = {
  'planned': {
    label_en: 'Planned',
    label_hi: 'योजित',
    color: 'bg-gray-600/30 border-gray-500/50',
    icon: Clock,
    textColor: 'text-gray-300'
  },
  'in-progress': {
    label_en: 'In Progress',
    label_hi: 'प्रगति में',
    color: 'bg-blue-600/30 border-blue-500/50',
    icon: Zap,
    textColor: 'text-blue-300'
  },
  'pushing': {
    label_en: 'Pushing Code',
    label_hi: 'कोड धक रहे हैं',
    color: 'bg-purple-600/30 border-purple-500/50',
    icon: GitBranch,
    textColor: 'text-purple-300'
  },
  'pr-created': {
    label_en: 'PR Created',
    label_hi: 'PR बनाया गया',
    color: 'bg-yellow-600/30 border-yellow-500/50',
    icon: FileCode,
    textColor: 'text-yellow-300'
  },
  'completed': {
    label_en: 'Completed',
    label_hi: 'पूरा',
    color: 'bg-green-600/30 border-green-500/50',
    icon: CheckCircle2,
    textColor: 'text-green-300'
  },
  'failed': {
    label_en: 'Failed',
    label_hi: 'विफल',
    color: 'bg-red-600/30 border-red-500/50',
    icon: AlertCircle,
    textColor: 'text-red-300'
  }
};

export const ExecutionPanel: React.FC<ExecutionPanelProps> = ({
  tasks,
  agents,
  bossPresent,
  language
}) => {
  const getStatusConfig = (status: string) => {
    return (statusConfig as any)[status] || statusConfig['planned'];
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-900 text-red-200';
      case 'high':
        return 'bg-orange-900 text-orange-200';
      case 'medium':
        return 'bg-yellow-900 text-yellow-200';
      case 'low':
        return 'bg-blue-900 text-blue-200';
      default:
        return 'bg-gray-900 text-gray-200';
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-950 to-black rounded-3xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 bg-black/50 backdrop-blur-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
            <CheckSquare className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">
              {language === 'en' ? 'Execution Status' : 'निष्पादन स्थिति'}
            </h3>
            <p className="text-xs text-white/50">{tasks.length} {language === 'en' ? 'tasks' : 'कार्य'}</p>
          </div>
        </div>

        {/* Boss Presence Indicator */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${bossPresent ? 'bg-yellow-400 animate-pulse' : 'bg-gray-600'}`} />
          <span className="text-xs font-semibold" style={{ color: bossPresent ? '#FBBF24' : '#9CA3AF' }}>
            {bossPresent
              ? (language === 'en' ? 'Boss Online' : 'बॉस ऑनलाइन')
              : (language === 'en' ? 'Boss Offline' : 'बॉस ऑफ़लाइन')}
          </span>
        </div>
      </div>

      {/* Tasks List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-track-white/5 scrollbar-thumb-white/20">
        {tasks.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-3xl mb-2">📋</div>
              <p className="text-white/60 text-sm">
                {language === 'en' ? 'No tasks yet' : 'अभी कोई कार्य नहीं'}
              </p>
            </div>
          </div>
        ) : (
          tasks.map((task) => {
            const statusConfig = getStatusConfig(task.status);
            const StatusIcon = statusConfig.icon;

            return (
              <div key={task.id} className={`p-3 rounded-xl border ${statusConfig.color} space-y-2`}>
                {/* Task Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-white truncate">{task.title}</h4>
                    <p className="text-xs text-white/60 truncate">{task.description}</p>
                  </div>

                  <div className="flex gap-1.5 flex-shrink-0">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getSeverityBadgeColor(task.severity)}`}>
                      {task.severity[0].toUpperCase()}
                    </span>

                    <div className="flex items-center gap-1 px-2 py-1 rounded bg-white/5">
                      <StatusIcon className={`w-3 h-3 ${statusConfig.textColor}`} />
                      <span className={`text-xs font-semibold ${statusConfig.textColor}`}>
                        {language === 'en'
                          ? (statusConfig as any).label_en
                          : (statusConfig as any).label_hi}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Task Type & Assigned Agents */}
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="px-2 py-1 rounded-lg bg-white/10 text-white/70">
                    {task.type.toUpperCase()}
                  </span>

                  {task.assignedAgents.length > 0 && (
                    <div className="flex items-center gap-1">
                      {task.assignedAgents.slice(0, 3).map((agentId) => {
                        const agent = agents.get(agentId);
                        return agent ? (
                          <div
                            key={agentId}
                            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                            style={{ backgroundColor: agent.color }}
                            title={agent.name}
                          >
                            {agent.name.split(' ').map(n => n[0]).join('')}
                          </div>
                        ) : null;
                      })}
                      {task.assignedAgents.length > 3 && (
                        <span className="text-white/60 text-xs">+{task.assignedAgents.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Boss Approval Status */}
                {task.bossApproved && (
                  <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-green-900/30 border border-green-500/50">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-xs font-semibold text-green-300">
                      {language === 'en' ? 'Approved by Boss' : 'बॉस द्वारा अनुमोदित'}
                    </span>
                  </div>
                )}

                {/* Git Info */}
                {task.gitBranch && (
                  <div className="flex items-center gap-2 text-xs">
                    <GitBranch className="w-3 h-3 text-white/50" />
                    <code className="font-mono text-white/70 bg-black/50 px-2 py-0.5 rounded truncate">
                      {task.gitBranch}
                    </code>
                  </div>
                )}

                {/* PR Link */}
                {task.prId && (
                  <div className="flex items-center gap-2 text-xs">
                    <FileCode className="w-3 h-3 text-yellow-400" />
                    <a
                      href={`https://github.com/motherskitchenblr2/VOLT-CODE-AI-v5.0/pull/${task.prId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      {language === 'en' ? 'View PR' : 'PR देखें'}
                    </a>
                  </div>
                )}

                {/* Execution Changes Preview */}
                {task.executionChanges && (
                  <div className="mt-2 p-2 rounded-lg bg-black/50 border border-white/10">
                    <p className="text-xs font-semibold text-white/70 mb-1">
                      {language === 'en' ? 'Changes:' : 'परिवर्तन:'}
                    </p>
                    <pre className="text-xs text-white/60 overflow-x-auto whitespace-pre-wrap break-words max-h-24 bg-black/80 p-2 rounded">
                      {task.executionChanges.substring(0, 200)}...
                    </pre>
                  </div>
                )}

                {/* Suggested Solutions */}
                {task.suggestedSolutions.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs font-semibold text-white/70">
                      {language === 'en' ? 'Solutions:' : 'समाधान:'}
                    </p>
                    {task.suggestedSolutions.map((solution, idx) => {
                      const agent = agents.get(solution.agentId);
                      return (
                        <div key={idx} className="text-xs text-white/60 ml-2 flex gap-2">
                          <span className="font-mono text-white/40">•</span>
                          <span>
                            <span style={{ color: agent?.color }}>
                              {solution.agentName}
                            </span>
                            {': '}
                            {solution.solution}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Summary Footer */}
      {tasks.length > 0 && (
        <div className="px-4 py-3 border-t border-white/10 bg-black/50 backdrop-blur-lg grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center justify-center gap-1">
            <span className="text-white/60">{language === 'en' ? 'Completed:' : 'पूरा:'}</span>
            <span className="font-bold text-green-400">
              {tasks.filter(t => t.status === 'completed').length}/{tasks.length}
            </span>
          </div>
          <div className="flex items-center justify-center gap-1">
            <span className="text-white/60">{language === 'en' ? 'In Progress:' : 'प्रगति में:'}</span>
            <span className="font-bold text-blue-400">
              {tasks.filter(t => ['in-progress', 'pushing', 'pr-created'].includes(t.status)).length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
