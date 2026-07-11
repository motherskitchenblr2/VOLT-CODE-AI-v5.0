import { connectToDatabase } from './utils/db';
import { SessionModel, CheckpointModel, UserSettingsModel, AuditLogModel, DeploymentModel, WorkflowTaskModel, WorkspaceModel } from '../src/models/Schemas';

type ApiRequest = {
  method?: string;
  query: Record<string, string | string[] | undefined>;
  body?: Record<string, unknown>;
};

type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (payload: unknown) => ApiResponse;
  setHeader: (name: string, value: string[]) => void;
};

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Unknown error';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    await connectToDatabase();
  } catch (error: unknown) {
    return res.status(500).json({ error: 'Database connection failed', details: getErrorMessage(error) });
  }

  const { method } = req;
  const { action, username } = req.query;

  if (typeof username !== 'string' || !username.trim()) {
    return res.status(400).json({ error: 'Username query parameter must be a non-empty string.' });
  }

  switch (method) {
    case 'GET':
      if (action === 'getSessions') {
        try {
          const sessions = await SessionModel.find({ username }).sort({ createdAt: -1 }).limit(50);
          return res.status(200).json(sessions);
        } catch (err: unknown) {
          return res.status(500).json({ error: 'Failed to fetch sessions', details: getErrorMessage(err) });
        }
      }
      if (action === 'getSettings') {
        try {
          let settings = await UserSettingsModel.findOne({ username });
          if (!settings) {
            settings = await UserSettingsModel.create({ username });
            // Log creation in audits
            await AuditLogModel.create({
              username,
              action: 'SETTINGS_CREATE',
              details: 'Initialized default settings and granular permissions in MongoDB.',
              status: 'SUCCESS'
            });
          }
          return res.status(200).json(settings);
        } catch (err: unknown) {
          return res.status(500).json({ error: 'Failed to fetch settings', details: getErrorMessage(err) });
        }
      }
      if (action === 'getCheckpoints') {
        try {
          const checkpoints = await CheckpointModel.find({ username }).sort({ createdAt: -1 });
          return res.status(200).json(checkpoints);
        } catch (err: unknown) {
          return res.status(500).json({ error: 'Failed to fetch checkpoints', details: getErrorMessage(err) });
        }
      }
      if (action === 'getAuditLogs') {
        try {
          const logs = await AuditLogModel.find({ username }).sort({ createdAt: -1 }).limit(100);
          return res.status(200).json(logs);
        } catch (err: unknown) {
          return res.status(500).json({ error: 'Failed to fetch audit logs', details: getErrorMessage(err) });
        }
      }
      if (action === 'getDeployments') {
        try {
          const deployments = await DeploymentModel.find({ username }).sort({ createdAt: -1 }).limit(50);
          return res.status(200).json(deployments);
        } catch (err: unknown) {
          return res.status(500).json({ error: 'Failed to fetch deployments', details: getErrorMessage(err) });
        }
      }
      if (action === 'getWorkflowTasks') {
        try {
          const tasks = await WorkflowTaskModel.find({ username }).sort({ createdAt: -1 }).limit(100);
          return res.status(200).json(tasks);
        } catch (err: unknown) {
          return res.status(500).json({ error: 'Failed to fetch workflow tasks', details: getErrorMessage(err) });
        }
      }
      if (action === 'getWorkspaceInfo') {
        try {
          let workspace = await WorkspaceModel.findOne({ username });
          if (!workspace) {
            workspace = await WorkspaceModel.create({
              username,
              repoPath: 'motherskitchenblr2/VOLT-CODE-AI-v5.0',
              activeBranch: 'main'
            });
          }
          return res.status(200).json(workspace);
        } catch (err: unknown) {
          return res.status(500).json({ error: 'Failed to fetch workspace info', details: getErrorMessage(err) });
        }
      }
      return res.status(400).json({ error: 'Invalid GET action' });

    case 'POST':
      if (action === 'saveSession') {
        try {
          const newSession = await SessionModel.create({ username, ...req.body });
          await AuditLogModel.create({
            username,
            action: 'SESSION_SAVE',
            details: `Saved session ${newSession.sessionId} with ${newSession.issues.length} fixes.`,
            status: 'SUCCESS'
          });
          return res.status(201).json(newSession);
        } catch (err: unknown) {
          return res.status(500).json({ error: 'Failed to save session', details: getErrorMessage(err) });
        }
      }
      if (action === 'saveSettings') {
        try {
          const updatedSettings = await UserSettingsModel.findOneAndUpdate(
            { username },
            { ...req.body, updatedAt: new Date() },
            { new: true, upsert: true }
          );
          await AuditLogModel.create({
            username,
            action: 'SETTINGS_UPDATE',
            details: `Updated settings configuration. Mode: ${updatedSettings.agentMode.toUpperCase()}.`,
            status: 'SUCCESS'
          });
          return res.status(200).json(updatedSettings);
        } catch (err: unknown) {
          return res.status(500).json({ error: 'Failed to save settings', details: getErrorMessage(err) });
        }
      }
      if (action === 'saveCheckpoint') {
        try {
          const newCheckpoint = await CheckpointModel.create({ username, ...req.body });
          await AuditLogModel.create({
            username,
            action: 'CHECKPOINT_CREATE',
            details: `Created snapshot checkpoint ${newCheckpoint.checkpointId} for ${newCheckpoint.filePath}.`,
            status: 'SUCCESS'
          });
          return res.status(201).json(newCheckpoint);
        } catch (err: unknown) {
          return res.status(500).json({ error: 'Failed to save checkpoint', details: getErrorMessage(err) });
        }
      }
      if (action === 'saveDeployment') {
        try {
          const newDeployment = await DeploymentModel.create({ username, ...req.body });
          return res.status(201).json(newDeployment);
        } catch (err: unknown) {
          return res.status(500).json({ error: 'Failed to save deployment', details: getErrorMessage(err) });
        }
      }
      if (action === 'saveWorkflowTask') {
        try {
          const newTask = await WorkflowTaskModel.create({ username, ...req.body });
          return res.status(201).json(newTask);
        } catch (err: unknown) {
          return res.status(500).json({ error: 'Failed to save workflow task', details: getErrorMessage(err) });
        }
      }
      if (action === 'saveWorkspaceInfo') {
        try {
          const updatedWorkspace = await WorkspaceModel.findOneAndUpdate(
            { username },
            { ...req.body },
            { new: true, upsert: true }
          );
          return res.status(200).json(updatedWorkspace);
        } catch (err: unknown) {
          return res.status(500).json({ error: 'Failed to save workspace info', details: getErrorMessage(err) });
        }
      }
      return res.status(400).json({ error: 'Invalid POST action' });

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `Method ${method} not allowed` });
  }
}
