// Agent Communication Service for Meeting Panel
// Manages multi-agent collaboration, messaging, and decision tracking

export interface Agent {
  id: string;
  name: string;
  role: 'Security' | 'QA' | 'UI/UX' | 'Performance' | 'Architecture' | 'DevOps';
  avatar?: string;
  color: string;
  expertise: string[];
  status: 'idle' | 'speaking' | 'listening' | 'executing';
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  language: 'en' | 'hi';
  timestamp: Date;
  type: 'text' | 'audio' | 'system' | 'decision';
  audioUrl?: string;
  audioTranscript?: string;
}

export interface MeetingTask {
  id: string;
  title: string;
  type: 'update' | 'upgrade' | 'fix' | 'review';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  status: 'planned' | 'in-progress' | 'completed' | 'failed' | 'pushing' | 'pr-created';
  assignedAgents: string[];
  bossApproved: boolean;
  bossApprovalTime?: Date;
  suggestedSolutions: {
    agentId: string;
    agentName: string;
    solution: string;
    complexity: 'simple' | 'medium' | 'complex';
  }[];
  executionChanges?: string;
  gitBranch?: string;
  prId?: string;
}

export interface Meeting {
  id: string;
  startedAt: Date;
  endedAt?: Date;
  bossPresent: boolean;
  bossJoinedAt?: Date;
  agents: Agent[];
  tasks: MeetingTask[];
  messages: Message[];
  agentVotes?: Map<string, string>; // agentId -> vote (approve/reject/abstain)
}

export interface PullRequest {
  id: string;
  prNumber: number;
  gitHubUrl: string;
  title: string;
  description: string;
  branch: string;
  createdBy: string;
  createdAt: Date;
  status: 'open' | 'merged' | 'squashed' | 'ignored';
  userDecision?: 'merge' | 'squash' | 'ignore';
  userDecisionTime?: Date;
  meetingId: string;
  taskId: string;
  agentDiscussions: string;
}

export interface BossGuidance {
  id: string;
  prId: string;
  reason: string;
  concern: 'rejected-critical-fix' | 'approved-risky-change' | 'other';
  recommendation: string;
  agentFeedback: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  userResponse?: 'accepted' | 'confirmed' | 'pending';
  timestamp: Date;
}

export class AgentCommunicationService {
  private meetings: Map<string, Meeting> = new Map();
  private messageListeners: ((msg: Message) => void)[] = [];
  private taskListeners: ((task: MeetingTask) => void)[] = [];

  constructor() {
    // Initialize default agents
  }

  // Create a new meeting
  createMeeting(agents: Agent[], bossPresent: boolean = true): Meeting {
    const meeting: Meeting = {
      id: `meeting-${Date.now()}`,
      startedAt: new Date(),
      bossPresent,
      bossJoinedAt: bossPresent ? new Date() : undefined,
      agents,
      tasks: [],
      messages: [],
      agentVotes: new Map()
    };

    this.meetings.set(meeting.id, meeting);
    return meeting;
  }

  // Add message to meeting
  addMessage(
    meetingId: string,
    senderId: string,
    senderName: string,
    content: string,
    language: 'en' | 'hi' = 'en',
    type: 'text' | 'audio' | 'system' | 'decision' = 'text',
    audioUrl?: string,
    audioTranscript?: string
  ): Message {
    const meeting = this.meetings.get(meetingId);
    if (!meeting) throw new Error(`Meeting ${meetingId} not found`);

    const message: Message = {
      id: `msg-${Date.now()}`,
      senderId,
      senderName,
      content,
      language,
      timestamp: new Date(),
      type,
      audioUrl,
      audioTranscript
    };

    meeting.messages.push(message);
    this.messageListeners.forEach(listener => listener(message));

    return message;
  }

  // Add task to meeting
  addTask(
    meetingId: string,
    title: string,
    type: MeetingTask['type'],
    severity: MeetingTask['severity'],
    description: string,
    assignedAgents: string[]
  ): MeetingTask {
    const meeting = this.meetings.get(meetingId);
    if (!meeting) throw new Error(`Meeting ${meetingId} not found`);

    const task: MeetingTask = {
      id: `task-${Date.now()}`,
      title,
      type,
      severity,
      description,
      status: 'planned',
      assignedAgents,
      bossApproved: false,
      suggestedSolutions: [],
      tasks: []
    };

    meeting.tasks.push(task);
    this.taskListeners.forEach(listener => listener(task));

    return task;
  }

  // Boss approves task
  approveTask(meetingId: string, taskId: string): MeetingTask {
    const meeting = this.meetings.get(meetingId);
    if (!meeting) throw new Error(`Meeting ${meetingId} not found`);

    const task = meeting.tasks.find(t => t.id === taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);

    task.bossApproved = true;
    task.bossApprovalTime = new Date();

    this.taskListeners.forEach(listener => listener(task));

    return task;
  }

  // Update task status
  updateTaskStatus(
    meetingId: string,
    taskId: string,
    status: MeetingTask['status'],
    executionChanges?: string,
    gitBranch?: string,
    prId?: string
  ): MeetingTask {
    const meeting = this.meetings.get(meetingId);
    if (!meeting) throw new Error(`Meeting ${meetingId} not found`);

    const task = meeting.tasks.find(t => t.id === taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);

    task.status = status;
    if (executionChanges) task.executionChanges = executionChanges;
    if (gitBranch) task.gitBranch = gitBranch;
    if (prId) task.prId = prId;

    this.taskListeners.forEach(listener => listener(task));

    return task;
  }

  // Add solution suggestion
  addSolution(
    meetingId: string,
    taskId: string,
    agentId: string,
    agentName: string,
    solution: string,
    complexity: 'simple' | 'medium' | 'complex'
  ): MeetingTask {
    const meeting = this.meetings.get(meetingId);
    if (!meeting) throw new Error(`Meeting ${meetingId} not found`);

    const task = meeting.tasks.find(t => t.id === taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);

    task.suggestedSolutions.push({
      agentId,
      agentName,
      solution,
      complexity
    });

    this.taskListeners.forEach(listener => listener(task));

    return task;
  }

  // Get meeting
  getMeeting(meetingId: string): Meeting | undefined {
    return this.meetings.get(meetingId);
  }

  // Boss joins meeting
  bossPresentToggle(meetingId: string, present: boolean): Meeting {
    const meeting = this.meetings.get(meetingId);
    if (!meeting) throw new Error(`Meeting ${meetingId} not found`);

    meeting.bossPresent = present;
    if (present) {
      meeting.bossJoinedAt = new Date();
    }

    return meeting;
  }

  // Subscribe to message updates
  onMessageAdded(listener: (msg: Message) => void): () => void {
    this.messageListeners.push(listener);
    return () => {
      this.messageListeners = this.messageListeners.filter(l => l !== listener);
    };
  }

  // Subscribe to task updates
  onTaskUpdated(listener: (task: MeetingTask) => void): () => void {
    this.taskListeners.push(listener);
    return () => {
      this.taskListeners = this.taskListeners.filter(l => l !== listener);
    };
  }

  // End meeting
  endMeeting(meetingId: string): Meeting {
    const meeting = this.meetings.get(meetingId);
    if (!meeting) throw new Error(`Meeting ${meetingId} not found`);

    meeting.endedAt = new Date();
    return meeting;
  }

  // Get all meetings
  getAllMeetings(): Meeting[] {
    return Array.from(this.meetings.values());
  }
}

// Translation utilities for EN/HI
export const translations = {
  en: {
    'meeting_started': 'Meeting started',
    'boss_joined': 'Boss has joined the meeting',
    'agent_joined': 'Agent joined the meeting',
    'task_created': 'New task created',
    'task_approved': 'Task approved by Boss',
    'task_executing': 'Executing task',
    'task_completed': 'Task completed successfully',
    'pr_created': 'Pull request created',
    'pushing_code': 'Pushing code to repository',
    'solution_proposed': 'New solution proposed',
    'guidance_needed': 'Boss guidance needed'
  },
  hi: {
    'meeting_started': 'बैठक शुरू हुई',
    'boss_joined': 'बॉस बैठक में शामिल हो गए',
    'agent_joined': 'एजेंट बैठक में शामिल हो गया',
    'task_created': 'नया कार्य बनाया गया',
    'task_approved': 'बॉस द्वारा कार्य को मंजूरी दी गई',
    'task_executing': 'कार्य निष्पादित जा रहा है',
    'task_completed': 'कार्य सफलतापूर्वक पूरा हुआ',
    'pr_created': 'पुल अनुरोध बनाया गया',
    'pushing_code': 'रिपॉजिटरी में कोड धकेल रहे हैं',
    'solution_proposed': 'नया समाधान प्रस्तावित किया गया',
    'guidance_needed': 'बॉस से मार्गदर्शन की आवश्यकता है'
  }
};

export function translate(key: string, language: 'en' | 'hi' = 'en'): string {
  return translations[language][key as keyof typeof translations[typeof language]] || key;
}

export const defaultAgents: Agent[] = [
  {
    id: 'agent-security',
    name: 'Security Specialist',
    role: 'Security',
    color: '#EF4444',
    expertise: ['Vulnerabilities', 'API Keys', 'Auth Security'],
    status: 'idle'
  },
  {
    id: 'agent-qa',
    name: 'QA Tester',
    role: 'QA',
    color: '#3B82F6',
    expertise: ['Type Safety', 'Testing', 'Assertions'],
    status: 'idle'
  },
  {
    id: 'agent-ui',
    name: 'UI/UX Specialist',
    role: 'UI/UX',
    color: '#8B5CF6',
    expertise: ['Styling', 'Responsiveness', 'Accessibility'],
    status: 'idle'
  },
  {
    id: 'agent-perf',
    name: 'Performance Expert',
    role: 'Performance',
    color: '#F59E0B',
    expertise: ['Optimization', 'Caching', 'Bundle Size'],
    status: 'idle'
  },
  {
    id: 'agent-arch',
    name: 'Architecture Advisor',
    role: 'Architecture',
    color: '#10B981',
    expertise: ['Design Patterns', 'Scalability', 'Integration'],
    status: 'idle'
  },
  {
    id: 'agent-devops',
    name: 'DevOps Engineer',
    role: 'DevOps',
    color: '#06B6D4',
    expertise: ['Deployment', 'CI/CD', 'Infrastructure'],
    status: 'idle'
  }
];

export const bossAgent: Agent = {
  id: 'boss',
  name: 'Boss',
  role: 'Architecture',
  color: '#FBBF24',
  expertise: ['Orchestration', 'Decision Making', 'Governance'],
  status: 'idle'
};
