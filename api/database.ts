import { connectToDatabase } from './utils/db';
import { SessionModel, CheckpointModel, UserSettingsModel, AuditLogModel } from '../src/models/Schemas';

export default async function handler(req: any, res: any) {
  try {
    await connectToDatabase();
  } catch (error: any) {
    return res.status(500).json({ error: 'Database connection failed', details: error.message });
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
        } catch (err: any) {
          return res.status(500).json({ error: 'Failed to fetch sessions', details: err.message });
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
        } catch (err: any) {
          return res.status(500).json({ error: 'Failed to fetch settings', details: err.message });
        }
      }
      if (action === 'getCheckpoints') {
        try {
          const checkpoints = await CheckpointModel.find({ username }).sort({ createdAt: -1 });
          return res.status(200).json(checkpoints);
        } catch (err: any) {
          return res.status(500).json({ error: 'Failed to fetch checkpoints', details: err.message });
        }
      }
      if (action === 'getAuditLogs') {
        try {
          const logs = await AuditLogModel.find({ username }).sort({ createdAt: -1 }).limit(100);
          return res.status(200).json(logs);
        } catch (err: any) {
          return res.status(500).json({ error: 'Failed to fetch audit logs', details: err.message });
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
        } catch (err: any) {
          return res.status(500).json({ error: 'Failed to save session', details: err.message });
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
        } catch (err: any) {
          return res.status(500).json({ error: 'Failed to save settings', details: err.message });
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
        } catch (err: any) {
          return res.status(500).json({ error: 'Failed to save checkpoint', details: err.message });
        }
      }
      return res.status(400).json({ error: 'Invalid POST action' });

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `Method ${method} not allowed` });
  }
}
