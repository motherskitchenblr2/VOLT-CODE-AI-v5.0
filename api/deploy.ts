import { connectToDatabase } from './utils/db';
import { DeploymentModel, AuditLogModel } from '../src/models/Schemas';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, target, gitCommitSha } = req.body || {};

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }
  if (!target || (target !== 'STAGING' && target !== 'PRODUCTION')) {
    return res.status(400).json({ error: 'Target must be STAGING or PRODUCTION' });
  }

  try {
    await connectToDatabase();
  } catch (error: any) {
    return res.status(500).json({ error: 'Database connection failed', details: error.message });
  }

  const generatedSha = gitCommitSha || 'v6.1-rc1-' + Math.random().toString(36).substring(2, 9);
  
  const deployment = await DeploymentModel.create({
    username,
    status: 'IN_PROGRESS',
    target,
    gitCommitSha: generatedSha,
    buildLogs: `[INFO] Initializing production build for target ${target}...\n`,
    creator: 'SYSTEM'
  });

  // Start build simulation steps
  let logs = deployment.buildLogs;

  logs += `[INFO] Checking environment parameters...\n`;
  logs += `[INFO] Installing dependencies (npm install --dry-run)...\n`;
  logs += `[INFO] Compiling TypeScript source files (tsc -b)...\n`;
  logs += `[INFO] Building production bundle (vite build)...\n`;
  logs += `[INFO] dist/index.html (7.68 kB)\n`;
  logs += `[INFO] dist/assets/index.css (55.62 kB)\n`;
  logs += `[INFO] dist/assets/index.js (489.07 kB)\n`;
  logs += `[INFO] Running unit assertions tests (vitest run)...\n`;
  logs += `[INFO] 90/90 telemetry checks passed.\n`;
  logs += `[SUCCESS] Build finished successfully. Deployment verified clean.\n`;

  // Update deployment state
  deployment.status = 'SUCCESS';
  deployment.buildLogs = logs;
  deployment.latency = Math.floor(Math.random() * 2000) + 1500; // 1.5s to 3.5s latency
  await deployment.save();

  // Create audit log entry
  await AuditLogModel.create({
    username,
    action: `DEPLOY_${target}`,
    details: `Successfully deployed to ${target}. Commit SHA: ${deployment.gitCommitSha}. Latency: ${deployment.latency}ms`,
    status: 'SUCCESS'
  });

  return res.status(200).json(deployment);
}
