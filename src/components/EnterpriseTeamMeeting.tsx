import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Workflow, BarChart3, FileText } from 'lucide-react';
import { EnhancedChatPanel } from './EnhancedChatPanel';
import { AgentPortfolioDashboard } from './AgentPortfolioDashboard';
import { ProposalVotingPanel } from './ProposalVotingPanel';
import { AgentTeamGrid } from './AgentProfileCard';
import { ENTERPRISE_AGENTS, BOSS_PROFILE } from '../services/EnterpriseAgentRegistry';
import { WorkflowEngine, Proposal } from '../services/WorkflowEngine';

interface EnterpriseTeamMeetingProps {
  projectName?: string;
  onClose?: () => void;
}

/**
 * Enterprise Team Meeting System
 * 
 * Complete autonomous agent coordination platform with:
 * - 7 specialized agents + Boss orchestrator
 * - Multi-stage workflow: Research → Discussion → Planning → Pitching → Voting → Development
 * - Boss-guided decision making with user approval authority
 * - Real-time collaboration with live task updates
 * - Enterprise-grade audit logging and documentation
 */
export const EnterpriseTeamMeeting: React.FC<EnterpriseTeamMeetingProps> = ({
  projectName = 'Project Alpha',
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState('chat');
  const [workflowEngine] = useState(() => new WorkflowEngine(projectName));
  const [currentProposal, setCurrentProposal] = useState<Proposal | null>(null);

  // Simulate proposal creation for demo
  const createSampleProposal = () => {
    const proposal: Proposal = {
      id: `proposal-${Date.now()}`,
      title: 'Enterprise Dashboard Implementation',
      description: 'Build a comprehensive dashboard system for real-time monitoring and analytics with multi-agent coordination.',
      proposedBy: ENTERPRISE_AGENTS[0].id,
      approvedBy: [],
      rejectedBy: [],
      bossApprovalStatus: 'pending',
      userApprovalStatus: 'pending',
      prosAndCons: {
        pros: [
          'Centralized monitoring and control',
          'Real-time team collaboration',
          'Autonomous decision-making framework',
          'Improved project efficiency',
          'Enterprise-grade security',
        ],
        cons: [
          'Complex initial setup required',
          'Training needed for all team members',
          'Integration with existing systems',
          'Requires dedicated DevOps support',
        ],
      },
      revisionsNeeded: [],
      roadmap: [
        {
          id: 'phase-1',
          phase: 1,
          title: 'Architecture & Planning',
          description: 'Design system architecture and create detailed technical specifications.',
          assignedAgents: ['agent-meera', 'agent-reynolds', 'agent-jack'],
          estimatedDuration: '2 weeks',
          deliverables: ['Architecture document', 'Technical specifications', 'Risk assessment'],
          dependencies: [],
          status: 'planned',
          progress: 0,
        },
        {
          id: 'phase-2',
          phase: 2,
          title: 'Design & UX',
          description: 'Create user interface designs and conduct UX research.',
          assignedAgents: ['agent-dezy', 'agent-xavier', 'agent-qwil'],
          estimatedDuration: '2 weeks',
          deliverables: ['UI mockups', 'Design system', 'Usability report'],
          dependencies: [1],
          status: 'planned',
          progress: 0,
        },
        {
          id: 'phase-3',
          phase: 3,
          title: 'Core Development',
          description: 'Develop backend and frontend components.',
          assignedAgents: ['agent-reynolds', 'agent-jack', 'agent-aurora'],
          estimatedDuration: '4 weeks',
          deliverables: ['API endpoints', 'Frontend components', 'Database schema'],
          dependencies: [1, 2],
          status: 'planned',
          progress: 0,
        },
        {
          id: 'phase-4',
          phase: 4,
          title: 'Testing & QA',
          description: 'Comprehensive testing and quality assurance.',
          assignedAgents: ['agent-qwil', 'agent-henry', 'agent-reynolds'],
          estimatedDuration: '2 weeks',
          deliverables: ['Test reports', 'Bug fixes', 'Performance metrics'],
          dependencies: [3],
          status: 'planned',
          progress: 0,
        },
        {
          id: 'phase-5',
          phase: 5,
          title: 'Deployment & Monitoring',
          description: 'Deploy to production and set up monitoring.',
          assignedAgents: ['agent-jack', 'agent-henry', 'agent-reynolds'],
          estimatedDuration: '1 week',
          deliverables: ['Deployment guide', 'Monitoring dashboards', 'Runbooks'],
          dependencies: [4],
          status: 'planned',
          progress: 0,
        },
      ],
      timestamp: new Date(),
    };

    setCurrentProposal(proposal);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white"
    >
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Enterprise Team Meeting System</h1>
              <p className="text-white/60 text-sm mt-1">Project: {projectName}</p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white/10 p-1 rounded-lg mb-6">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Team Chat
            </TabsTrigger>
            <TabsTrigger value="team" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Team Portfolio
            </TabsTrigger>
            <TabsTrigger value="proposal" className="flex items-center gap-2">
              <Workflow className="w-4 h-4" />
              Proposal
            </TabsTrigger>
            <TabsTrigger value="docs" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Documentation
            </TabsTrigger>
          </TabsList>

          {/* Chat Tab */}
          <TabsContent value="chat" className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 border border-white/10 rounded-lg p-6 mb-4"
            >
              <h2 className="text-xl font-bold mb-2">Team Collaboration</h2>
              <p className="text-white/60 text-sm">
                Live communication channel for all team members. Agents discuss, propose solutions, and coordinate work.
              </p>
            </motion.div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-6 min-h-[500px]">
              <p className="text-white/60 mb-4">Enhanced Chat Panel (Floating Widget - See bottom right)</p>
              <div className="flex items-center justify-center h-96 bg-white/5 border border-white/10 rounded">
                <p className="text-white/40">Chat messages appear in floating widget below</p>
              </div>
            </div>
          </TabsContent>

          {/* Team Portfolio Tab */}
          <TabsContent value="team">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 border border-white/10 rounded-lg p-6 mb-4"
            >
              <h2 className="text-xl font-bold mb-2">Enterprise Agent Portfolio</h2>
              <p className="text-white/60 text-sm">
                Complete team management with 7 specialized agents and Boss orchestrator. View agent profiles, performance metrics, and departmental organization.
              </p>
            </motion.div>
            <AgentPortfolioDashboard viewMode="team" />
          </TabsContent>

          {/* Proposal Tab */}
          <TabsContent value="proposal" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 border border-white/10 rounded-lg p-6"
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold">Project Proposal & Voting</h2>
                {!currentProposal && (
                  <button
                    onClick={createSampleProposal}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold text-sm cursor-pointer transition-colors"
                  >
                    Create Sample Proposal
                  </button>
                )}
              </div>
              <p className="text-white/60 text-sm">
                Multi-stage approval workflow: Boss Review → Team Voting → User (Owner) Final Approval
              </p>
            </motion.div>

            {currentProposal ? (
              <ProposalVotingPanel
                proposal={currentProposal}
                isBoss={false}
                isUser={false}
              />
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white/5 border border-white/10 rounded-lg p-12 text-center"
              >
                <p className="text-white/60 mb-4">No active proposal yet</p>
                <button
                  onClick={createSampleProposal}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold cursor-pointer transition-colors"
                >
                  Create First Proposal
                </button>
              </motion.div>
            )}
          </TabsContent>

          {/* Documentation Tab */}
          <TabsContent value="docs" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 border border-white/10 rounded-lg p-6"
            >
              <h2 className="text-xl font-bold mb-4">Project Documentation</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white/5 border border-white/10 rounded p-4">
                  <p className="font-semibold mb-2">Research Findings</p>
                  <p className="text-white/60 text-sm">0 items</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded p-4">
                  <p className="font-semibold mb-2">Discussions</p>
                  <p className="text-white/60 text-sm">0 topics</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded p-4">
                  <p className="font-semibold mb-2">Audit Log Entries</p>
                  <p className="text-white/60 text-sm">{workflowEngine.getWorkflow().auditLog.length} entries</p>
                </div>
              </div>

              <div className="bg-black/20 border border-white/10 rounded p-4">
                <pre className="text-sm text-white/70 overflow-auto max-h-96">
                  {workflowEngine.generateDocumentation()}
                </pre>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Enhanced Chat Panel (Floating) */}
      <EnhancedChatPanel isMinimized={false} onClose={undefined} />

      {/* System Information Footer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-0 left-0 right-0 bg-black/40 backdrop-blur border-t border-white/10 p-4 text-xs text-white/60 flex items-center justify-between"
      >
        <div>
          <p>Enterprise System Active | {ENTERPRISE_AGENTS.length} Agents | Boss: {BOSS_PROFILE.name}</p>
        </div>
        <div className="flex gap-4">
          <span>Workflow Stage: Research</span>
          <span>Status: Ready</span>
        </div>
      </motion.div>
    </motion.div>
  );
};
