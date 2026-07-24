// Workflow Engine - Manages the complete project workflow from research to development
import { getAllAgentIds, ENTERPRISE_AGENTS } from './EnterpriseAgentRegistry';

export type WorkflowStage = 'research' | 'discussion' | 'planning' | 'pitching' | 'voting' | 'revision' | 'development' | 'deployment' | 'completed';

export interface ResearchFinding {
  id: string;
  agentId: string;
  title: string;
  content: string;
  findings: string[];
  recommendations: string[];
  timestamp: Date;
  citations: string[];
}

export interface Discussion {
  id: string;
  topic: string;
  initiator: string;
  participants: string[];
  points: DiscussionPoint[];
  consensusReached: boolean;
  consensusDecision?: string;
  timestamp: Date;
}

export interface DiscussionPoint {
  id: string;
  agentId: string;
  position: 'pro' | 'con' | 'neutral';
  content: string;
  supportedBy?: string[];
  prosAndCons?: {
    pros: string[];
    cons: string[];
  };
  timestamp: Date;
}

export interface Proposal {
  id: string;
  title: string;
  description: string;
  proposedBy: string;
  approvedBy: string[]; // Agent IDs that approved
  rejectedBy: string[]; // Agent IDs that rejected
  bossApprovalStatus: 'pending' | 'approved' | 'rejected' | 'revising';
  userApprovalStatus: 'pending' | 'approved' | 'rejected';
  prosAndCons: {
    pros: string[];
    cons: string[];
  };
  revisionsNeeded: string[];
  roadmap: RoadmapPhase[];
  timestamp: Date;
}

export interface RoadmapPhase {
  id: string;
  phase: number;
  title: string;
  description: string;
  assignedAgents: string[];
  estimatedDuration: string;
  deliverables: string[];
  dependencies: number[]; // Phase IDs it depends on
  status: 'planned' | 'in-progress' | 'completed' | 'blocked';
  progress: number; // 0-100
}

export interface ProjectWorkflow {
  id: string;
  projectName: string;
  currentStage: WorkflowStage;
  research: ResearchFinding[];
  discussions: Discussion[];
  proposal: Proposal | null;
  approvalVotes: ApprovalVote[];
  developmentRoadmap: RoadmapPhase[];
  agentAssignments: { [agentId: string]: string[] }; // agentId -> taskIds
  auditLog: AuditEntry[];
  documentationGenerated: boolean;
  createdAt: Date;
  lastUpdated: Date;
}

export interface ApprovalVote {
  id: string;
  proposalId: string;
  agentId: string;
  vote: 'approve' | 'reject' | 'abstain';
  comments: string;
  timestamp: Date;
}

export interface AuditEntry {
  id: string;
  timestamp: Date;
  actor: string; // agentId or 'boss' or 'user'
  action: string;
  details: string;
  stage: WorkflowStage;
}

export class WorkflowEngine {
  private workflow: ProjectWorkflow;

  constructor(projectName: string) {
    this.workflow = {
      id: `project-${Date.now()}`,
      projectName,
      currentStage: 'research',
      research: [],
      discussions: [],
      proposal: null,
      approvalVotes: [],
      developmentRoadmap: [],
      agentAssignments: {},
      auditLog: [],
      documentationGenerated: false,
      createdAt: new Date(),
      lastUpdated: new Date(),
    };

    this.logAction('system', 'Project created', 'Project workflow initialized');
  }

  /**
   * Add a research finding from an agent
   */
  addResearchFinding(
    agentId: string,
    title: string,
    content: string,
    findings: string[],
    recommendations: string[],
    citations: string[] = []
  ): ResearchFinding {
    const finding: ResearchFinding = {
      id: `research-${Date.now()}`,
      agentId,
      title,
      content,
      findings,
      recommendations,
      timestamp: new Date(),
      citations,
    };

    this.workflow.research.push(finding);
    this.logAction(agentId, 'Research completed', `${findings.length} findings documented`);
    return finding;
  }

  /**
   * Start a discussion on a topic
   */
  startDiscussion(topic: string, initiator: string, participants: string[]): Discussion {
    const discussion: Discussion = {
      id: `discussion-${Date.now()}`,
      topic,
      initiator,
      participants,
      points: [],
      consensusReached: false,
      timestamp: new Date(),
    };

    this.workflow.discussions.push(discussion);
    this.logAction(initiator, 'Discussion initiated', topic);
    return discussion;
  }

  /**
   * Add a discussion point from an agent
   */
  addDiscussionPoint(
    discussionId: string,
    agentId: string,
    position: 'pro' | 'con' | 'neutral',
    content: string,
    prosAndCons?: { pros: string[]; cons: string[] }
  ): DiscussionPoint | null {
    const discussion = this.workflow.discussions.find(d => d.id === discussionId);
    if (!discussion) return null;

    const point: DiscussionPoint = {
      id: `point-${Date.now()}`,
      agentId,
      position,
      content,
      prosAndCons,
      timestamp: new Date(),
    };

    discussion.points.push(point);
    return point;
  }

  /**
   * Create a proposal after discussion phase
   */
  createProposal(
    title: string,
    description: string,
    proposedBy: string,
    prosAndCons: { pros: string[]; cons: string[] },
    roadmapPhases: RoadmapPhase[]
  ): Proposal {
    const proposal: Proposal = {
      id: `proposal-${Date.now()}`,
      title,
      description,
      proposedBy,
      approvedBy: [],
      rejectedBy: [],
      bossApprovalStatus: 'pending',
      userApprovalStatus: 'pending',
      prosAndCons,
      revisionsNeeded: [],
      roadmap: roadmapPhases,
      timestamp: new Date(),
    };

    this.workflow.proposal = proposal;
    this.workflow.currentStage = 'pitching';
    this.logAction(proposedBy, 'Proposal created', title);
    return proposal;
  }

  /**
   * Boss reviews and approves/rejects proposal
   */
  bossReviewProposal(
    proposalId: string,
    decision: 'approved' | 'rejected' | 'revising',
    feedback: string
  ): boolean {
    if (!this.workflow.proposal || this.workflow.proposal.id !== proposalId) return false;

    this.workflow.proposal.bossApprovalStatus = decision;
    if (decision !== 'approved') {
      this.workflow.proposal.revisionsNeeded.push(feedback);
    }

    this.logAction('boss', `Proposal ${decision} by Boss`, feedback);

    if (decision === 'approved') {
      this.workflow.currentStage = 'voting';
    } else if (decision === 'revising') {
      this.workflow.currentStage = 'revision';
    }

    return true;
  }

  /**
   * User (Owner) reviews and approves proposal
   */
  userReviewProposal(proposalId: string, decision: 'approved' | 'rejected', feedback?: string): boolean {
    if (!this.workflow.proposal || this.workflow.proposal.id !== proposalId) return false;

    this.workflow.proposal.userApprovalStatus = decision;
    this.logAction('user', `Proposal ${decision} by User (Owner)`, feedback || 'No feedback');

    if (decision === 'approved' && this.workflow.proposal.bossApprovalStatus === 'approved') {
      this.workflow.currentStage = 'development';
      this.initializeDevelopmentPhase();
    }

    return true;
  }

  /**
   * Agent votes on proposal during voting phase
   */
  voteOnProposal(
    proposalId: string,
    agentId: string,
    vote: 'approve' | 'reject' | 'abstain',
    comments: string
  ): ApprovalVote | null {
    if (!this.workflow.proposal || this.workflow.proposal.id !== proposalId) return null;

    const approvalVote: ApprovalVote = {
      id: `vote-${Date.now()}`,
      proposalId,
      agentId,
      vote,
      comments,
      timestamp: new Date(),
    };

    this.workflow.approvalVotes.push(approvalVote);

    if (vote === 'approve') {
      if (!this.workflow.proposal.approvedBy.includes(agentId)) {
        this.workflow.proposal.approvedBy.push(agentId);
      }
    } else if (vote === 'reject') {
      if (!this.workflow.proposal.rejectedBy.includes(agentId)) {
        this.workflow.proposal.rejectedBy.push(agentId);
      }
    }

    this.logAction(agentId, `Voted ${vote}`, comments);
    return approvalVote;
  }

  /**
   * Initialize development phase with roadmap
   */
  private initializeDevelopmentPhase(): void {
    if (!this.workflow.proposal) return;

    this.workflow.developmentRoadmap = this.workflow.proposal.roadmap;
    this.assignAgentsToPhases();
    this.logAction('system', 'Development phase initialized', 'Agents assigned to phases');
  }

  /**
   * Assign agents to development phases based on expertise
   */
  private assignAgentsToPhases(): void {
    this.workflow.developmentRoadmap.forEach(phase => {
      phase.assignedAgents.forEach(agentId => {
        if (!this.workflow.agentAssignments[agentId]) {
          this.workflow.agentAssignments[agentId] = [];
        }
        this.workflow.agentAssignments[agentId].push(phase.id);
      });
    });
  }

  /**
   * Update phase progress
   */
  updatePhaseProgress(phaseId: string, progress: number, status: string): boolean {
    const phase = this.workflow.developmentRoadmap.find(p => p.id === phaseId);
    if (!phase) return false;

    phase.progress = Math.min(100, Math.max(0, progress));
    if (phase.progress === 100) {
      phase.status = 'completed';
    } else if (phase.progress > 0) {
      phase.status = 'in-progress';
    }

    this.logAction('system', `Phase ${phase.phase} updated`, `Progress: ${phase.progress}%`);
    this.workflow.lastUpdated = new Date();
    return true;
  }

  /**
   * Request revisions to proposal
   */
  requestRevisions(feedback: string[], revisedRoadmap?: RoadmapPhase[]): void {
    if (!this.workflow.proposal) return;

    this.workflow.proposal.revisionsNeeded = feedback;
    if (revisedRoadmap) {
      this.workflow.proposal.roadmap = revisedRoadmap;
    }

    this.workflow.currentStage = 'revision';
    this.logAction('boss', 'Revisions requested', `${feedback.length} items to revise`);
  }

  /**
   * Generate project documentation from workflow
   */
  generateDocumentation(): string {
    const doc = `
# Project: ${this.workflow.projectName}
**Project ID**: ${this.workflow.id}
**Started**: ${this.workflow.createdAt.toLocaleDateString()}
**Current Stage**: ${this.workflow.currentStage.toUpperCase()}

## Research Findings
${this.workflow.research.map(r => `- **${r.title}** (${ENTERPRISE_AGENTS.find(a => a.id === r.agentId)?.name}): ${r.findings.join(', ')}`).join('\n')}

## Discussions
${this.workflow.discussions.map(d => `- **${d.topic}**: ${d.points.length} discussion points`).join('\n')}

## Proposal
${this.workflow.proposal ? `
**Title**: ${this.workflow.proposal.title}
**Description**: ${this.workflow.proposal.description}

### Pros and Cons
**Pros**: ${this.workflow.proposal.prosAndCons.pros.join(', ')}
**Cons**: ${this.workflow.proposal.prosAndCons.cons.join(', ')}

### Approval Status
- Boss: ${this.workflow.proposal.bossApprovalStatus}
- User: ${this.workflow.proposal.userApprovalStatus}
- Agent Approvals: ${this.workflow.proposal.approvedBy.length}/${getAllAgentIds().length}
` : 'No proposal yet'}

## Development Roadmap
${this.workflow.developmentRoadmap.map(p => `### Phase ${p.phase}: ${p.title}
- Duration: ${p.estimatedDuration}
- Progress: ${p.progress}%
- Status: ${p.status}
- Deliverables: ${p.deliverables.join(', ')}`).join('\n\n')}

## Audit Log
${this.workflow.auditLog.slice(-10).map(e => `- [${e.timestamp.toLocaleTimeString()}] ${e.actor}: ${e.action}`).join('\n')}
    `;

    this.workflow.documentationGenerated = true;
    return doc;
  }

  /**
   * Log an action for audit trail
   */
  private logAction(actor: string, action: string, details: string): void {
    this.workflow.auditLog.push({
      id: `audit-${Date.now()}`,
      timestamp: new Date(),
      actor,
      action,
      details,
      stage: this.workflow.currentStage,
    });
  }

  /**
   * Get complete workflow state
   */
  getWorkflow(): ProjectWorkflow {
    return this.workflow;
  }

  /**
   * Get agent assignments for a specific agent
   */
  getAgentAssignments(agentId: string): string[] {
    return this.workflow.agentAssignments[agentId] || [];
  }

  /**
   * Get workflow summary for Boss and User
   */
  getWorkflowSummary() {
    return {
      projectName: this.workflow.projectName,
      currentStage: this.workflow.currentStage,
      researchFindings: this.workflow.research.length,
      discussionTopics: this.workflow.discussions.length,
      proposalStatus: this.workflow.proposal?.bossApprovalStatus || 'none',
      teamVotes: this.workflow.approvalVotes.length,
      developmentPhases: this.workflow.developmentRoadmap.length,
      completedPhases: this.workflow.developmentRoadmap.filter(p => p.status === 'completed').length,
      overallProgress: Math.round(
        this.workflow.developmentRoadmap.reduce((sum, p) => sum + p.progress, 0) /
          Math.max(this.workflow.developmentRoadmap.length, 1)
      ),
      agentCount: Object.keys(this.workflow.agentAssignments).length,
      lastUpdated: this.workflow.lastUpdated,
    };
  }
}
