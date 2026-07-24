# Enterprise Team Meeting System - Quick Start Guide

## 🚀 Getting Started

### 1. Import the Main Component
```tsx
import { EnterpriseTeamMeeting } from '@/components/EnterpriseTeamMeeting';

export default function App() {
  return (
    <EnterpriseTeamMeeting 
      projectName="My Project" 
      onClose={() => {}}
    />
  );
}
```

### 2. Access Team Components Individually
```tsx
// View all agents
import { AgentPortfolioDashboard } from '@/components/AgentPortfolioDashboard';
<AgentPortfolioDashboard viewMode="team" />

// View individual agent
import { AgentProfileCard } from '@/components/AgentProfileCard';
<AgentProfileCard agentId="agent-meera" expanded={true} />

// Use chat panel
import { EnhancedChatPanel } from '@/components/EnhancedChatPanel';
<EnhancedChatPanel isMinimized={false} />

// Use proposal voting
import { ProposalVotingPanel } from '@/components/ProposalVotingPanel';
<ProposalVotingPanel proposal={proposal} isBoss={true} />
```

## 📊 Key Classes & Services

### WorkflowEngine
```tsx
import { WorkflowEngine } from '@/services/WorkflowEngine';

const engine = new WorkflowEngine('Project Alpha');

// Add research
engine.addResearchFinding(
  'agent-reynolds',
  'Title',
  'Content',
  ['finding1', 'finding2'],
  ['recommendation1']
);

// Create discussion
const discussion = engine.startDiscussion('topic', 'agent-id', ['participant-ids']);
engine.addDiscussionPoint(discussion.id, 'agent-id', 'pro', 'content');

// Create proposal
const proposal = engine.createProposal(
  'title',
  'description',
  'agent-id',
  { pros: [], cons: [] },
  roadmapPhases
);

// Approvals
engine.bossReviewProposal(proposal.id, 'approved', 'feedback');
engine.userReviewProposal(proposal.id, 'approved');
engine.voteOnProposal(proposal.id, 'agent-id', 'approve', 'comments');

// Get summary
const summary = engine.getWorkflowSummary();
```

### AgentAvatarManager
```tsx
import { AgentAvatarManager } from '@/services/AgentAvatarManager';

// Get avatar styling
AgentAvatarManager.getAvatarClass('agent-meera', 'md');
AgentAvatarManager.getAvatarStyle('agent-meera');

// Get agent info
const info = AgentAvatarManager.getAgentDisplayInfo('agent-meera');

// Get team roster
const roster = AgentAvatarManager.getTeamRoster();

// Smart agent assignment
const team = AgentAvatarManager.assignTeamForTask('development', 3);

// Performance badge
const badge = AgentAvatarManager.getPerformanceBadge(9.2);
```

### EnterpriseAgentRegistry
```tsx
import { 
  ENTERPRISE_AGENTS, 
  BOSS_PROFILE,
  getAgentById,
  getAgentsByDepartment,
  getAgentsByExpertise 
} from '@/services/EnterpriseAgentRegistry';

// Access all agents
console.log(ENTERPRISE_AGENTS.length); // 7

// Access boss
console.log(BOSS_PROFILE.name); // "The Boss"

// Query agents
const agent = getAgentById('agent-meera');
const engineers = getAgentsByDepartment('Engineering');
const experts = getAgentsByExpertise('Full Stack Development', 'expert');
```

## 🎨 Agent Reference

### Quick Lookup Table

| Name | ID | Title | Department | Color |
|------|----|----|--------|----|
| Ms. Meera | agent-meera | Project Lead | Project Management | #FF6B6B |
| Mr. Henry | agent-henry | Auditor & Monitor | Quality Assurance | #4ECDC4 |
| Mr. Reynolds | agent-reynolds | Full Stack Developer | Engineering | #95E1D3 |
| Mr. Qwil | agent-qwil | QA Specialist | Quality Assurance | #F38181 |
| Ms. Dezy | agent-dezy | UI/UX Designer | Design & UX | #AA96DA |
| Mr. Jack | agent-jack | DevOps Engineer | Infrastructure | #FCBAD3 |
| Ms. Aurora | agent-aurora | AI/ML Specialist | R&D | #A8DADC |
| Mr. Xavier | agent-xavier | Business Analyst | Business & Product | #FFB4A2 |

## 🔄 Workflow Stages

1. **Research** - Agents gather findings
   - `workflow.addResearchFinding()`
   
2. **Discussion** - Team discusses topics
   - `workflow.startDiscussion()`
   - `workflow.addDiscussionPoint()`
   
3. **Planning** - Create roadmap
   - Define phases and deliverables
   
4. **Pitching** - Present to Boss & User
   - `workflow.createProposal()`
   
5. **Voting** - Team votes
   - `workflow.voteOnProposal()`
   
6. **Revision** - Make changes if needed
   - `workflow.requestRevisions()`
   
7. **Development** - Execute roadmap
   - `workflow.updatePhaseProgress()`
   
8. **Deployment** - Release to production
9. **Completed** - Project done

## 📈 Performance Metrics

Each agent tracked on:
- **Quality Score** (0-10): Overall quality of work
- **Tasks Completed**: Total tasks finished
- **Success Rate** (%): Percentage of successful completions
- **Avg Response Time** (hours): Average turnaround time

Boss tracked on:
- **Decisions Approved**: Count of approvals
- **Decisions Rejected**: Count of rejections
- **Revisions Requested**: Count of revisions asked
- **Leadership Score** (0-10): Overall effectiveness

## 🎯 Common Tasks

### Show Team Dashboard
```tsx
<AgentPortfolioDashboard viewMode="overview" />
```

### Get Boss Information
```tsx
import { AgentAvatarManager } from '@/services/AgentAvatarManager';
const bossTeam = AgentAvatarManager.getBossTeamInfo();
```

### Assign Team to Task Type
```tsx
// Smart assignment based on task type
const team = AgentAvatarManager.assignTeamForTask('testing', 3);
// Returns agent IDs best suited for testing
```

### Generate Documentation
```tsx
const docs = engine.generateDocumentation();
// Returns markdown-formatted complete documentation
```

### Track Audit Log
```tsx
const auditLog = engine.getWorkflow().auditLog;
auditLog.forEach(entry => {
  console.log(`${entry.actor} did ${entry.action} at ${entry.timestamp}`);
});
```

## 🏗️ Component Structure

```
EnterpriseTeamMeeting (Main Component)
├── Tab: Team Chat
│   └── EnhancedChatPanel
├── Tab: Team Portfolio
│   └── AgentPortfolioDashboard
│       └── AgentProfileCard (x8)
├── Tab: Proposal
│   └── ProposalVotingPanel
└── Tab: Documentation
    └── Auto-generated docs from WorkflowEngine
```

## 🔐 Enterprise Features Checklist

- ✓ 7 Specialized Agents with complete profiles
- ✓ Boss orchestrator with oversight authority
- ✓ Multi-stage workflow system
- ✓ Real-time chat and task updates
- ✓ Proposal voting system
- ✓ Boss review & approval
- ✓ User (Owner) final approval
- ✓ Pros/Cons analysis framework
- ✓ Roadmap & phase tracking
- ✓ Audit logging for all actions
- ✓ Performance metrics per agent
- ✓ Automatic documentation generation
- ✓ Complete character profiles with avatars
- ✓ AI configuration per agent
- ✓ Expertise matrices
- ✓ Department organization
- ✓ Smart team assignment

## 🚨 Best Practices

1. **Always Initialize Workflow First**
   ```tsx
   const workflow = new WorkflowEngine('Project Name');
   ```

2. **Use Correct Agent IDs**
   - Reference from agent-meera, agent-henry, etc.
   - Available in EnterpriseAgentRegistry

3. **Follow Workflow Stages**
   - Don't skip stages
   - Ensure Boss review before User approval

4. **Add Meaningful Comments**
   - When voting on proposals
   - When requesting revisions
   - For audit trail clarity

5. **Monitor Progress**
   - Use `getWorkflowSummary()` for status
   - Track phase progress regularly
   - Review audit logs

## 📚 File Locations

```
src/
├── services/
│   ├── EnterpriseAgentRegistry.ts     (Agent definitions)
│   ├── AgentAvatarManager.ts          (Avatar utilities)
│   └── WorkflowEngine.ts              (Workflow management)
├── components/
│   ├── AgentProfileCard.tsx           (Agent profile UI)
│   ├── AgentPortfolioDashboard.tsx    (Team dashboard)
│   ├── EnhancedChatPanel.tsx          (Chat widget)
│   ├── ProposalVotingPanel.tsx        (Voting UI)
│   └── EnterpriseTeamMeeting.tsx      (Main component)
└── Documentation/
    ├── ENTERPRISE_SYSTEM_GUIDE.md     (Complete guide)
    └── QUICK_START.md                 (This file)
```

## 🆘 Troubleshooting

**Agent not found?**
- Verify agent ID format: `agent-{lastname}`
- Check against ENTERPRISE_AGENTS array

**Workflow not advancing?**
- Ensure Boss approved before voting
- Ensure User approved before development starts

**Chat not showing?**
- EnhancedChatPanel must be included in render
- Check isMinimized prop

**Avatar not displaying?**
- Verify agentId is valid
- Check Tailwind CSS is configured
- Ensure colors are in globals.css

---

**Ready to build?** Start with:
```tsx
import { EnterpriseTeamMeeting } from '@/components/EnterpriseTeamMeeting';
export default () => <EnterpriseTeamMeeting projectName="My Project" />;
```
