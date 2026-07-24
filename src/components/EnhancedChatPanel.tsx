import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageCircle, Minimize2, Maximize2, X, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { ENTERPRISE_AGENTS } from '../services/EnterpriseAgentRegistry';
import { AgentAvatarManager } from '../services/AgentAvatarManager';

interface ChatMessage {
  id: string;
  agentId: string;
  type: 'message' | 'task-update' | 'decision' | 'voting';
  content: string;
  bulletPoints?: string[];
  timestamp: Date;
  reactions?: { agentId: string; emoji: string }[];
}

interface TaskUpdate {
  taskId: string;
  agentId: string;
  status: 'planned' | 'in-progress' | 'completed' | 'blocked';
  progress: number; // 0-100
  details: string;
  bulletPoints: string[];
}

interface EnhancedChatPanelProps {
  isMinimized?: boolean;
  onClose?: () => void;
}

export const EnhancedChatPanel: React.FC<EnhancedChatPanelProps> = ({
  isMinimized: initialMinimized = false,
  onClose,
}) => {
  const [isMinimized, setIsMinimized] = useState(initialMinimized);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      agentId: 'agent-meera',
      type: 'message',
      content: 'Team Meeting Started - Project Planning Phase',
      bulletPoints: [
        'Review project requirements',
        'Define technical architecture',
        'Create implementation roadmap',
      ],
      timestamp: new Date(Date.now() - 5 * 60000),
      reactions: [],
    },
  ]);
  const [taskUpdates, setTaskUpdates] = useState<TaskUpdate[]>([
    {
      taskId: 'task-001',
      agentId: 'agent-reynolds',
      status: 'in-progress',
      progress: 45,
      details: 'Designing database schema',
      bulletPoints: [
        'Setting up PostgreSQL',
        'Designing table relationships',
        'Creating indexes for performance',
      ],
    },
    {
      taskId: 'task-002',
      agentId: 'agent-dezy',
      status: 'planned',
      progress: 0,
      details: 'UI/UX Design preparation',
      bulletPoints: [
        'Gathering design requirements',
        'Creating wireframes',
        'Setting up design system',
      ],
    },
  ]);

  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'chat' | 'tasks'>('chat');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      agentId: 'user',
      type: 'message',
      content: inputValue,
      timestamp: new Date(),
      reactions: [],
    };

    setMessages([...messages, newMessage]);
    setInputValue('');

    // Simulate agent responses
    setTimeout(() => {
      const responseAgent = ENTERPRISE_AGENTS[Math.floor(Math.random() * ENTERPRISE_AGENTS.length)];
      const responses = [
        { content: `Understood. I'll start working on this immediately.`, bulletPoints: ['Analyzing requirements', 'Planning approach'] },
        { content: `Great idea! Let me break this down into steps.`, bulletPoints: ['Step 1: Analysis', 'Step 2: Implementation', 'Step 3: Testing'] },
        { content: `I've reviewed the proposal. Here are my thoughts:`, bulletPoints: ['Point 1', 'Point 2', 'Point 3'] },
      ];

      const response = responses[Math.floor(Math.random() * responses.length)];
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}`,
        agentId: responseAgent.id,
        type: 'message',
        content: response.content,
        bulletPoints: response.bulletPoints,
        timestamp: new Date(),
        reactions: [],
      }]);
    }, 1500);
  };

  if (isMinimized) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-4 right-4 z-40"
      >
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
        >
          <MessageCircle className="w-5 h-5" />
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-4 right-4 w-96 bg-[#0A0E27] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-40 flex flex-col h-[500px]"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-white/10 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-blue-400" />
          <h3 className="font-bold text-white">Team Chat & Updates</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'chat' ? 'tasks' : 'chat')}
            className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white/80 cursor-pointer transition-colors"
          >
            {viewMode === 'chat' ? 'Tasks' : 'Chat'}
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 hover:bg-white/10 rounded cursor-pointer transition-colors"
          >
            <Minimize2 className="w-4 h-4 text-white/60" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/10 rounded cursor-pointer transition-colors"
            >
              <X className="w-4 h-4 text-white/60" />
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence>
          {viewMode === 'chat' ? (
            // Chat Messages
            <>
              {messages.map((msg, idx) => {
                const agent = ENTERPRISE_AGENTS.find(a => a.id === msg.agentId);
                const isUser = msg.agentId === 'user';

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, x: isUser ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isUser && agent && (
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs"
                        style={{
                          backgroundColor: agent.avatar.backgroundColor,
                          color: agent.avatar.textColor,
                        }}
                      >
                        {agent.avatar.initials}
                      </div>
                    )}

                    <div className={`max-w-[70%] ${isUser ? 'text-right' : ''}`}>
                      {!isUser && agent && (
                        <p className="text-xs font-semibold text-white/60 mb-1">{agent.name}</p>
                      )}
                      <div
                        className={`rounded-lg px-3 py-2 text-sm ${
                          isUser
                            ? 'bg-blue-600 text-white'
                            : 'bg-white/10 text-white/90 border border-white/10'
                        }`}
                      >
                        <p>{msg.content}</p>
                        {msg.bulletPoints && msg.bulletPoints.length > 0 && (
                          <ul className="mt-2 ml-3 space-y-1 text-xs">
                            {msg.bulletPoints.map((point, pidx) => (
                              <li key={pidx} className="flex gap-1">
                                <span>•</span>
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <p className="text-xs text-white/40 mt-1">
                        {msg.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          ) : (
            // Task Updates
            <div className="space-y-3">
              {taskUpdates.map(task => {
                const agent = ENTERPRISE_AGENTS.find(a => a.id === task.agentId);
                if (!agent) return null;

                const statusIcon = {
                  'planned': <Clock className="w-4 h-4" />,
                  'in-progress': <AlertCircle className="w-4 h-4 animate-pulse" />,
                  'completed': <CheckCircle2 className="w-4 h-4" />,
                  'blocked': <AlertCircle className="w-4 h-4" />,
                }[task.status];

                const statusColor = {
                  'planned': 'text-gray-400',
                  'in-progress': 'text-yellow-400',
                  'completed': 'text-green-400',
                  'blocked': 'text-red-400',
                }[task.status];

                return (
                  <motion.div
                    key={task.taskId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 border border-white/10 rounded-lg p-3"
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                        style={{
                          backgroundColor: agent.avatar.backgroundColor,
                          color: agent.avatar.textColor,
                        }}
                      >
                        {agent.avatar.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white">{task.details}</p>
                        <p className="text-xs text-white/60">{agent.name}</p>
                      </div>
                      <div className={`flex-shrink-0 ${statusColor}`}>
                        {statusIcon}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="bg-white/5 rounded-full h-1.5 mb-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${task.progress}%` }}
                        transition={{ duration: 0.5 }}
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                      />
                    </div>

                    <p className="text-xs text-white/50 mb-2">{task.progress}% complete</p>

                    {task.bulletPoints && task.bulletPoints.length > 0 && (
                      <ul className="text-xs text-white/70 space-y-1 ml-2">
                        {task.bulletPoints.map((point, idx) => (
                          <li key={idx} className="flex gap-1">
                            <span>•</span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      {viewMode === 'chat' && (
        <form onSubmit={handleSendMessage} className="border-t border-white/10 p-3 flex gap-2 bg-white/5">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask the team..."
            className="flex-1 bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg cursor-pointer transition-colors"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </form>
      )}
    </motion.div>
  );
};
