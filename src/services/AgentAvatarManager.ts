// Agent Avatar Manager - Handles avatar generation, styling, and display logic
import { EnterpriseAgent, ENTERPRISE_AGENTS, BOSS_PROFILE } from './EnterpriseAgentRegistry';

export interface AvatarDisplayConfig {
  size: 'sm' | 'md' | 'lg' | 'xl';
  variant: 'circle' | 'square' | 'badge';
  showLabel: boolean;
  showRole: boolean;
}

export class AgentAvatarManager {
  /**
   * Get avatar CSS class for a specific agent
   */
  static getAvatarClass(agentId: string, size: 'sm' | 'md' | 'lg' = 'md'): string {
    const agent = ENTERPRISE_AGENTS.find(a => a.id === agentId);
    if (!agent) return '';

    const sizeClass = {
      sm: 'w-8 h-8 text-xs',
      md: 'w-12 h-12 text-sm',
      lg: 'w-16 h-16 text-base',
    }[size];

    return `${sizeClass} rounded-full flex items-center justify-center font-bold`;
  }

  /**
   * Get avatar style object with background color
   */
  static getAvatarStyle(agentId: string) {
    const agent = ENTERPRISE_AGENTS.find(a => a.id === agentId);
    if (!agent) return {};

    return {
      backgroundColor: agent.avatar.backgroundColor,
      color: agent.avatar.textColor,
      border: `2px solid ${agent.avatar.backgroundColor}`,
    };
  }

  /**
   * Get agent display name with initials
   */
  static getInitials(agentId: string): string {
    const agent = ENTERPRISE_AGENTS.find(a => a.id === agentId);
    return agent?.avatar.initials || '??';
  }

  /**
   * Get full agent information for display
   */
  static getAgentDisplayInfo(agentId: string) {
    const agent = ENTERPRISE_AGENTS.find(a => a.id === agentId);
    if (!agent) return null;

    return {
      name: agent.name,
      title: agent.title,
      designation: agent.designation,
      initials: agent.avatar.initials,
      backgroundColor: agent.avatar.backgroundColor,
      textColor: agent.avatar.textColor,
      color: agent.color,
      icon: agent.icon,
      department: agent.department,
      expertise: agent.expertise,
    };
  }

  /**
   * Get team hierarchy information for Boss view
   */
  static getBossTeamInfo() {
    return {
      boss: {
        name: BOSS_PROFILE.name,
        title: BOSS_PROFILE.title,
        initials: BOSS_PROFILE.avatar.initials,
        backgroundColor: BOSS_PROFILE.avatar.backgroundColor,
        textColor: BOSS_PROFILE.avatar.textColor,
        overseesAgents: BOSS_PROFILE.agentOversight.length,
        metrics: BOSS_PROFILE.performanceMetrics,
      },
      agents: ENTERPRISE_AGENTS.map(agent => ({
        id: agent.id,
        name: agent.name,
        title: agent.title,
        department: agent.department,
        color: agent.color,
      })),
    };
  }

  /**
   * Get agent color for message/chat display
   */
  static getAgentChatColor(agentId: string): string {
    const agent = ENTERPRISE_AGENTS.find(a => a.id === agentId);
    return agent?.color || '#808080';
  }

  /**
   * Get agent expertise badge
   */
  static getExpertiseBadges(agentId: string, limit: number = 3): string[] {
    const agent = ENTERPRISE_AGENTS.find(a => a.id === agentId);
    if (!agent) return [];

    return agent.expertise
      .slice(0, limit)
      .map(exp => `${exp.domain} (${exp.level})`);
  }

  /**
   * Format agent for team member card display
   */
  static formatAgentCard(agentId: string) {
    const agent = ENTERPRISE_AGENTS.find(a => a.id === agentId);
    if (!agent) return null;

    return {
      id: agent.id,
      name: agent.name,
      title: agent.title,
      designation: agent.designation,
      department: agent.department,
      description: agent.description,
      personality: agent.personality,
      expertise: agent.expertise.map(e => e.domain),
      color: agent.color,
      icon: agent.icon,
      avatarInitials: agent.avatar.initials,
      avatarBg: agent.avatar.backgroundColor,
      performanceScore: agent.performanceMetrics.qualityScore,
      tasksCompleted: agent.performanceMetrics.tasksCompleted,
    };
  }

  /**
   * Get all agents for team roster
   */
  static getTeamRoster() {
    return ENTERPRISE_AGENTS.map(agent => ({
      id: agent.id,
      name: agent.name,
      title: agent.title,
      department: agent.department,
      color: agent.color,
      backgroundColor: agent.avatar.backgroundColor,
      initials: agent.avatar.initials,
    }));
  }

  /**
   * Get agent by department for organizational view
   */
  static getAgentsByDepartmentWithColors() {
    const departments: { [key: string]: typeof ENTERPRISE_AGENTS } = {};

    ENTERPRISE_AGENTS.forEach(agent => {
      if (!departments[agent.department]) {
        departments[agent.department] = [];
      }
      departments[agent.department].push(agent);
    });

    return Object.entries(departments).map(([dept, agents]) => ({
      department: dept,
      count: agents.length,
      agents: agents.map(a => ({
        id: a.id,
        name: a.name,
        color: a.color,
        initials: a.avatar.initials,
      })),
    }));
  }

  /**
   * Generate random team assignments for tasks
   */
  static assignTeamForTask(taskType: string, count: number = 3): string[] {
    // Smart agent assignment based on task type
    const taskToExpertise: { [key: string]: string[] } = {
      'design': ['agent-dezy', 'agent-xavier', 'agent-meera'],
      'development': ['agent-reynolds', 'agent-jack', 'agent-aurora'],
      'testing': ['agent-qwil', 'agent-henry', 'agent-reynolds'],
      'deployment': ['agent-jack', 'agent-reynolds', 'agent-henry'],
      'planning': ['agent-meera', 'agent-xavier', 'agent-henry'],
      'analysis': ['agent-xavier', 'agent-aurora', 'agent-meera'],
      'security': ['agent-henry', 'agent-jack', 'agent-reynolds'],
      'architecture': ['agent-reynolds', 'agent-jack', 'agent-aurora'],
    };

    const relevantAgents = taskToExpertise[taskType] || ENTERPRISE_AGENTS.map(a => a.id);
    return relevantAgents.slice(0, count);
  }

  /**
   * Get performance badge based on score
   */
  static getPerformanceBadge(score: number): { label: string; color: string } {
    if (score >= 9.5) return { label: 'Elite', color: '#FFD700' };
    if (score >= 9.0) return { label: 'Expert', color: '#4CAF50' };
    if (score >= 8.5) return { label: 'Advanced', color: '#2196F3' };
    if (score >= 8.0) return { label: 'Proficient', color: '#FF9800' };
    return { label: 'Developing', color: '#9E9E9E' };
  }
}
