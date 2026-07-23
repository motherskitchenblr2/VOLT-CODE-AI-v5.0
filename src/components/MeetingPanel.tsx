import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AgentCommunicationService,
  defaultAgents,
  bossAgent,
  Meeting,
  Message,
  MeetingTask,
  Agent,
  translate
} from '../services/AgentCommunication';
import { getAudioEngine } from '../services/AudioEngine';
import { AgentGroupChat } from './AgentGroupChat';
import { AudioInterface } from './AudioInterface';
import { ExecutionPanel } from './ExecutionPanel';
import { Users, LogOut, Plus, Settings } from 'lucide-react';

interface MeetingPanelProps {
  onClose?: () => void;
}

export const MeetingPanel: React.FC<MeetingPanelProps> = ({ onClose }) => {
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [communicationService] = useState(() => new AgentCommunicationService());
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [agentsMap, setAgentsMap] = useState<Map<string, Agent>>(new Map());
  const [messages, setMessages] = useState<Message[]>([]);
  const [tasks, setTasks] = useState<MeetingTask[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isBossPresent, setIsBossPresent] = useState(true);

  // Initialize meeting
  useEffect(() => {
    const agents = [bossAgent, ...defaultAgents];
    const agentsMapTemp = new Map(agents.map(a => [a.id, a]));
    setAgentsMap(agentsMapTemp);

    const newMeeting = communicationService.createMeeting(agents, true);
    setMeeting(newMeeting);
    setMessages(newMeeting.messages);
    setTasks(newMeeting.tasks);
    setSelectedAgent(bossAgent.id);

    // Add welcome messages
    const welcomeMessage = communicationService.addMessage(
      newMeeting.id,
      'system',
      'System',
      translate('meeting_started', language),
      language,
      'system'
    );

    const bossMessage = communicationService.addMessage(
      newMeeting.id,
      bossAgent.id,
      bossAgent.name,
      language === 'en'
        ? "Good day, team. Let's collaborate on today's challenges."
        : 'नमस्ते, टीम। आइए आज की चुनौतियों पर सहयोग करें।',
      language,
      'text'
    );

    setMessages([welcomeMessage, bossMessage]);

    // Subscribe to updates
    const unsubscribeMsg = communicationService.onMessageAdded((msg) => {
      setMessages(prev => [...prev, msg]);
    });

    const unsubscribeTask = communicationService.onTaskUpdated(() => {
      if (meeting) {
        setTasks([...meeting.tasks]);
      }
    });

    return () => {
      unsubscribeMsg();
      unsubscribeTask();
    };
  }, []);

  const handleSendMessage = async (content: string) => {
    if (!meeting || !selectedAgent) return;

    const message = communicationService.addMessage(
      meeting.id,
      selectedAgent,
      agentsMap.get(selectedAgent)?.name || 'Unknown',
      content,
      language,
      'text'
    );
  };

  const handleAudioRecorded = async (audioBlob: Blob, transcript?: string) => {
    if (!meeting || !selectedAgent) return;

    // Create audio URL
    const audioUrl = URL.createObjectURL(audioBlob);

    // Add message with audio
    const message = communicationService.addMessage(
      meeting.id,
      selectedAgent,
      agentsMap.get(selectedAgent)?.name || 'Unknown',
      transcript || (language === 'en' ? '[Audio Message]' : '[ऑडियो संदेश]'),
      language,
      'audio',
      audioUrl,
      transcript
    );
  };

  const handleCreateTask = () => {
    if (!meeting) return;

    const taskTitle = language === 'en' ? 'New Task' : 'नया कार्य';
    const taskDesc = language === 'en'
      ? 'A new task has been created for the team'
      : 'टीम के लिए एक नया कार्य बनाया गया है';

    const task = communicationService.addTask(
      meeting.id,
      taskTitle,
      'fix',
      'high',
      taskDesc,
      [selectedAgent || defaultAgents[0].id]
    );

    setTasks([...meeting.tasks]);
  };

  const handleBossApproveTask = (taskId: string) => {
    if (!meeting) return;

    const updatedTask = communicationService.approveTask(meeting.id, taskId);
    setTasks([...meeting.tasks]);

    // Add system message
    communicationService.addMessage(
      meeting.id,
      'system',
      'System',
      `${translate('task_approved', language)}: ${updatedTask.title}`,
      language,
      'system'
    );
  };

  const handleExecuteTask = (taskId: string) => {
    if (!meeting) return;

    const task = meeting.tasks.find(t => t.id === taskId);
    if (!task || !task.bossApproved) {
      alert(language === 'en'
        ? 'Task must be approved by Boss first'
        : 'कार्य को पहले बॉस द्वारा मंजूरी दी जानी चाहिए');
      return;
    }

    const updatedTask = communicationService.updateTaskStatus(
      meeting.id,
      taskId,
      'in-progress'
    );

    setTasks([...meeting.tasks]);

    communicationService.addMessage(
      meeting.id,
      'system',
      'System',
      `${translate('task_executing', language)}: ${updatedTask.title}`,
      language,
      'system'
    );
  };

  const toggleBossPresence = () => {
    if (meeting) {
      const updated = communicationService.bossPresentToggle(meeting.id, !isBossPresent);
      setIsBossPresent(updated.bossPresent);

      communicationService.addMessage(
        meeting.id,
        'system',
        'System',
        isBossPresent
          ? translate('boss_joined', language)
          : (language === 'en' ? 'Boss has left the meeting' : 'बॉस बैठक छोड़ गए हैं'),
        language,
        'system'
      );
    }
  };

  const handleEndMeeting = () => {
    if (meeting) {
      communicationService.endMeeting(meeting.id);
      onClose?.();
    }
  };

  if (!meeting) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <div className="w-12 h-12 border-4 border-white/20 border-t-blue-500 rounded-full" />
          </div>
          <p className="text-white">{language === 'en' ? 'Initializing meeting...' : 'बैठक प्रारंभ कर रहे हैं...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-950 via-black to-slate-950 p-6 overflow-hidden">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {language === 'en' ? 'Meeting Panel' : 'बैठक पैनल'}
            </h1>
            <p className="text-sm text-white/60">
              {language === 'en'
                ? `${messages.length} messages • ${tasks.length} tasks`
                : `${messages.length} संदेश • ${tasks.length} कार्य`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Language Toggle */}
          <div className="flex gap-2 bg-white/10 rounded-lg p-1">
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1.5 rounded font-semibold text-sm transition-all ${
                language === 'en'
                  ? 'bg-blue-600 text-white'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('hi')}
              className={`px-3 py-1.5 rounded font-semibold text-sm transition-all ${
                language === 'hi'
                  ? 'bg-blue-600 text-white'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              HI
            </button>
          </div>

          {/* Settings Button */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            title={language === 'en' ? 'Settings' : 'सेटिंग्स'}
          >
            <Settings className="w-5 h-5 text-white/60 hover:text-white" />
          </button>

          {/* Boss Presence Toggle */}
          <button
            onClick={toggleBossPresence}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
              isBossPresent
                ? 'bg-yellow-600 text-white'
                : 'bg-white/10 text-white/60 hover:text-white'
            }`}
          >
            {isBossPresent ? '👑' : '🚪'} {language === 'en' ? 'Boss' : 'बॉस'}
          </button>

          {/* Close Button */}
          <button
            onClick={handleEndMeeting}
            className="p-2 rounded-lg hover:bg-red-600/20 transition-colors"
            title={language === 'en' ? 'End Meeting' : 'बैठक समाप्त करें'}
          >
            <LogOut className="w-5 h-5 text-red-400" />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-4 rounded-xl bg-white/10 border border-white/20"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-white/70 block mb-2">
                  {language === 'en' ? 'Select Agent:' : 'एजेंट चुनें:'}
                </label>
                <select
                  value={selectedAgent || ''}
                  onChange={(e) => setSelectedAgent(e.target.value)}
                  className="w-full bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  {Array.from(agentsMap.values()).map(agent => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name} ({agent.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-white/70 block mb-2">
                  {language === 'en' ? 'Tasks:' : 'कार्य:'}
                </label>
                <button
                  onClick={handleCreateTask}
                  className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold text-sm hover:from-green-700 hover:to-emerald-700 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {language === 'en' ? 'New Task' : 'नया कार्य'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main 3-Column Layout */}
      <div className="grid grid-cols-3 gap-4 h-[calc(100%-120px)]">
        {/* Left: Chat (60%) */}
        <div className="col-span-2">
          <AgentGroupChat
            messages={messages}
            agents={agentsMap}
            language={language}
            onMessageSend={handleSendMessage}
          />
        </div>

        {/* Right: Audio + Execution (40%) */}
        <div className="flex flex-col gap-4">
          {/* Audio Interface */}
          <div className="h-1/2">
            <AudioInterface
              language={language}
              onRecordingComplete={handleAudioRecorded}
            />
          </div>

          {/* Execution Panel */}
          <div className="h-1/2 overflow-hidden">
            <ExecutionPanel
              tasks={tasks}
              agents={agentsMap}
              bossPresent={isBossPresent}
              language={language}
            />
          </div>
        </div>
      </div>

      {/* Task Control Bar (Bottom) */}
      {tasks.length > 0 && (
        <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/70 font-semibold">
              {language === 'en' ? 'Quick Actions:' : 'त्वरित क्रिया:'}
            </span>
            <div className="flex gap-2">
              {tasks
                .filter(t => t.status === 'planned' && !t.bossApproved)
                .slice(0, 3)
                .map(task => (
                  <button
                    key={task.id}
                    onClick={() => handleBossApproveTask(task.id)}
                    className="px-3 py-1 rounded bg-yellow-600/70 text-yellow-100 hover:bg-yellow-600 transition-colors font-semibold"
                    disabled={!isBossPresent}
                    title={isBossPresent ? '' : 'Boss must be present'}
                  >
                    {language === 'en' ? 'Approve' : 'मंजूर करें'}
                  </button>
                ))}

              {tasks
                .filter(t => t.status === 'planned' && t.bossApproved)
                .slice(0, 3)
                .map(task => (
                  <button
                    key={task.id}
                    onClick={() => handleExecuteTask(task.id)}
                    className="px-3 py-1 rounded bg-green-600/70 text-green-100 hover:bg-green-600 transition-colors font-semibold"
                  >
                    {language === 'en' ? 'Execute' : 'निष्पादित करें'}
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
