import { connectToDatabase } from '../shared/db.js';
import { SessionModel, CheckpointModel, UserSettingsModel, AuditLogModel, DeploymentModel, WorkflowTaskModel, WorkspaceModel } from '../src/models/Schemas.js';
import { applySecurityHeaders, isPreflight, requireAuth } from '../shared/security.js';

type ApiRequest = {
  method?: string;
  query: Record<string, string | string[] | undefined>;
  body?: Record<string, unknown>;
  headers?: Record<string, string | string[] | undefined>;
  locals?: { username: string };
};

type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (payload: unknown) => ApiResponse;
  setHeader: (name: string, value: string) => void;
};

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Unknown error';

/**
 * Reject bodies containing MongoDB operator keys ($-prefixed) or dotted paths,
 * which mongoose would otherwise interpret as update operators. Blocks
 * $set-based account takeover and nested-key injection.
 */
function hasForbiddenKeys(body: Record<string, unknown> | undefined): boolean {
  if (!body) return false;
  return Object.keys(body).some((key) => key.startsWith('$') || key.includes('.'));
}

/**
 * Build a payload containing ONLY the whitelisted fields from a client body.
 * The authenticated username is always set separately and can never be
 * overridden by client input.
 */
function pickFields<T extends Record<string, unknown>>(
  body: Record<string, unknown> | undefined,
  allowed: string[],
): T {
  const out: Record<string, unknown> = {};
  if (!body) return out as T;
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(body, key) && body[key] !== undefined) {
      out[key] = body[key];
    }
  }
  return out as T;
}

const SESSION_FIELDS = [
  'sessionId', 'repoPath', 'branch', 'originalCode', 'fixedCode', 'issues',
  'summary', 'tokensUsed', 'promptTokens', 'completionTokens', 'modelUsed', 'provider',
];
const CHECKPOINT_FIELDS = ['checkpointId', 'filePath', 'codeBackup', 'gitCommitSha'];
const DEPLOYMENT_FIELDS = ['status', 'target', 'gitCommitSha', 'buildLogs', 'latency', 'creator'];
const WORKFLOW_FIELDS = ['taskId', 'agentSpecialty', 'status', 'logs', 'targetFile'];
const SETTINGS_FIELDS = [
  'agentMode', 'debounceDelay', 'autoApplyFixes', 'enableSentinel', 'permissions',
];
const WORKSPACE_FIELDS = [
  'repoPath', 'activeBranch', 'lintErrors', 'averageTime', 'totalTokensUsed',
];

export default async function handler(req: ApiRequest, res: ApiResponse) {
  applySecurityHeaders(res, String(req.headers?.origin || ''));
  if (isPreflight(req)) {
    return res.status(204).json({});
  }

  const { action } = req.query;

  const isStatusQuery = action === 'getSecretStatus';

  // All database actions require an authenticated session. The username is
  // taken from the session, never from the client.
  if (!(await requireAuth(req, res))) return res;
  const username = req.locals!.username;

  if (!isStatusQuery) {
    try {
      await connectToDatabase();
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Database connection failed', details: getErrorMessage(error) });
    }
  }

  switch (req.method) {
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
      if (action === 'getSecretStatus') {
        try {
          const { hasStoredSecrets, loadUserSecrets } = await import('../shared/secrets.js');
          const secrets = await loadUserSecrets(username);
          const hasAny = await hasStoredSecrets(username);
          return res.status(200).json({
            stored: hasAny,
            providers: {
              groq: Boolean(secrets.groq),
              openrouter: Boolean(secrets.openrouter),
              nvidia: Boolean(secrets.nvidia),
              huggingface: Boolean(secrets.huggingface),
              githubToken: Boolean(secrets.githubToken)
            }
          });
        } catch {
          return res.status(200).json({ stored: false, providers: {} });
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
          const body = req.body;
          if (hasForbiddenKeys(body)) {
            return res.status(400).json({ error: 'Invalid field names in payload' });
          }
          const data = pickFields(body, SESSION_FIELDS);
          if (!data.sessionId) {
            return res.status(400).json({ error: 'sessionId is required' });
          }
          const newSession = await SessionModel.create({ username, ...data });
          const issueCount = Array.isArray(newSession.issues) ? newSession.issues.length : 0;
          await AuditLogModel.create({
            username,
            action: 'SESSION_SAVE',
            details: `Saved session ${newSession.sessionId} with ${issueCount} fixes.`,
            status: 'SUCCESS'
          });
          return res.status(201).json(newSession);
        } catch (err: unknown) {
          return res.status(500).json({ error: 'Failed to save session', details: getErrorMessage(err) });
        }
      }
      if (action === 'saveSettings') {
        try {
          const body = req.body;
          if (hasForbiddenKeys(body)) {
            return res.status(400).json({ error: 'Invalid field names in payload' });
          }
          const data = pickFields(body, SETTINGS_FIELDS);
          const updatedSettings = await UserSettingsModel.findOneAndUpdate(
            { username },
            { ...data, updatedAt: new Date() },
            { new: true, upsert: true }
          );
          await AuditLogModel.create({
            username,
            action: 'SETTINGS_UPDATE',
            details: `Updated settings configuration. Mode: ${String(updatedSettings.agentMode || '').toUpperCase()}.`,
            status: 'SUCCESS'
          });
          return res.status(200).json(updatedSettings);
        } catch (err: unknown) {
          return res.status(500).json({ error: 'Failed to save settings', details: getErrorMessage(err) });
        }
      }
      if (action === 'saveSecrets') {
        try {
          const body = req.body as { keys?: Record<string, string> };
          if (!body || typeof body !== 'object') {
            return res.status(400).json({ error: 'Invalid payload' });
          }
          const keys = body.keys || {};
          if (typeof keys !== 'object' || Array.isArray(keys)) {
            return res.status(400).json({ error: 'Invalid keys payload' });
          }
          const { saveUserSecrets } = await import('../shared/secrets.js');
          await saveUserSecrets(username, keys);
          await AuditLogModel.create({
            username,
            action: 'SECRETS_UPDATE',
            details: 'Encrypted provider API secrets updated in the secure vault.',
            status: 'SUCCESS'
          });
          return res.status(200).json({ ok: true });
        } catch (err: unknown) {
          return res.status(500).json({ error: 'Failed to save secrets', details: getErrorMessage(err) });
        }
      }
      if (action === 'saveCheckpoint') {
        try {
          const body = req.body;
          if (hasForbiddenKeys(body)) {
            return res.status(400).json({ error: 'Invalid field names in payload' });
          }
          const data = pickFields(body, CHECKPOINT_FIELDS);
          if (!data.checkpointId) {
            return res.status(400).json({ error: 'checkpointId is required' });
          }
          const newCheckpoint = await CheckpointModel.create({ username, ...data });
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
          const body = req.body;
          if (hasForbiddenKeys(body)) {
            return res.status(400).json({ error: 'Invalid field names in payload' });
          }
          const data = pickFields(body, DEPLOYMENT_FIELDS);
          const newDeployment = await DeploymentModel.create({ username, ...data });
          return res.status(201).json(newDeployment);
        } catch (err: unknown) {
          return res.status(500).json({ error: 'Failed to save deployment', details: getErrorMessage(err) });
        }
      }
      if (action === 'saveWorkflowTask') {
        try {
          const body = req.body;
          if (hasForbiddenKeys(body)) {
            return res.status(400).json({ error: 'Invalid field names in payload' });
          }
          const data = pickFields(body, WORKFLOW_FIELDS);
          if (!data.taskId) {
            return res.status(400).json({ error: 'taskId is required' });
          }
          const newTask = await WorkflowTaskModel.create({ username, ...data });
          return res.status(201).json(newTask);
        } catch (err: unknown) {
          return res.status(500).json({ error: 'Failed to save workflow task', details: getErrorMessage(err) });
        }
      }
      if (action === 'saveWorkspaceInfo') {
        try {
          const body = req.body;
          if (hasForbiddenKeys(body)) {
            return res.status(400).json({ error: 'Invalid field names in payload' });
          }
          const data = pickFields(body, WORKSPACE_FIELDS);
          const updatedWorkspace = await WorkspaceModel.findOneAndUpdate(
            { username },
            { ...data },
            { new: true, upsert: true }
          );
          return res.status(200).json(updatedWorkspace);
        } catch (err: unknown) {
          return res.status(500).json({ error: 'Failed to save workspace info', details: getErrorMessage(err) });
        }
      }
      return res.status(400).json({ error: 'Invalid POST action' });

    default:
      res.setHeader('Allow', 'GET, POST');
      return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
}
