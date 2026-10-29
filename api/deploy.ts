import { connectToDatabase } from '../shared/db.js';
import { DeploymentModel, AuditLogModel } from '../src/models/Schemas.js';
import { applySecurityHeaders, isPreflight, requireAuth, verifyAdminPasscode } from '../shared/security.js';

type ApiRequest = {
  method?: string;
  body?: {
    target?: string;
    gitCommitSha?: string;
    adminPasscode?: string;
  };
  headers?: Record<string, string | string[] | undefined>;
  locals?: { username: string };
};

type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (payload: unknown) => ApiResponse;
  setHeader: (name: string, value: string | string[]) => ApiResponse;
};

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Unknown error';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  applySecurityHeaders(res, String(req.headers?.origin || ''));
  if (isPreflight(req)) {
    return res.status(204).json({});
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!(await requireAuth(req, res))) return res;
  const username = req.locals!.username;

  // Admin-only action: a real (non-simulated) deploy requires the
  // ADMIN_PASSCODE env var. The gate is fail-closed on the server, never
  // enforced by the browser.
  if (!verifyAdminPasscode(req.body?.adminPasscode || '')) {
    await AuditLogModel.create({
      username,
      action: 'DEPLOY_DENIED',
      details: 'Deployment request rejected: invalid or missing admin passcode.',
      status: 'WARNING',
    }).catch(() => {});
    return res.status(403).json({ error: 'Admin passcode is required for deployments.' });
  }

  const { target, gitCommitSha } = req.body || {};

  if (!target || (target !== 'STAGING' && target !== 'PRODUCTION')) {
    return res.status(400).json({ error: 'Target must be STAGING or PRODUCTION' });
  }

  // This environment does not trigger a real Vercel build. The deployment
  // record is created as an honest SIMULATION so the UI never presents a fake
  // production deploy as real. To wire up a real build, call the Vercel
  // Deployments API here and persist its real status.
  const simulatedSha = gitCommitSha || 'SIMULATED';

  try {
    await connectToDatabase();
    const deployment = await DeploymentModel.create({
      username,
      status: 'SUCCESS',
      target,
      gitCommitSha: simulatedSha,
      buildLogs: [
        `[SIMULATION] No real build was triggered for ${target}.`,
        '[SIMULATION] To enable real deploys, wire the Vercel Deployments API into this endpoint.',
        `[SIMULATION] Requested commit SHA: ${simulatedSha}.`,
      ].join('\n'),
      latency: 0,
      creator: 'SYSTEM',
      simulated: true,
    });

    await AuditLogModel.create({
      username,
      action: `DEPLOY_${target}`,
      details: `Simulated deployment record created for ${target}. No real build ran.`,
      status: 'WARNING',
    }).catch(() => {});

    return res.status(200).json(deployment);
  } catch (error: unknown) {
    return res.status(500).json({ error: 'Deployment failed', details: getErrorMessage(error) });
  }
}
