import { OAUTH_PROVIDERS, OAuthProvider, buildAuthorizeUrl, buildCallbackUrl, generatePkce, getOAuthClient } from '../utils/oauth.js';
import * as crypto from 'crypto';

type ApiRequest = {
  method?: string;
  query: Record<string, string | string[] | undefined>;
  headers?: Record<string, string | string[] | undefined>;
};

type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (payload: unknown) => ApiResponse;
  redirect: (url: string) => ApiResponse;
  setHeader: (name: string, value: string) => ApiResponse;
};

/**
 * GET /api/auth/start?provider=google|microsoft&username=...
 * Redirects the browser to the provider's OAuth consent screen.
 * The PKCE verifier + state ride in an HttpOnly cookie so the callback can
 * complete the exchange without exposing anything to the client.
 */
export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rawProvider = typeof req.query.provider === 'string' ? req.query.provider.toLowerCase() : '';
  const provider = rawProvider as OAuthProvider;

  if (!OAUTH_PROVIDERS.includes(provider)) {
    return res.status(400).json({
      error: `Unsupported provider. Allowed: ${OAUTH_PROVIDERS.join(', ')}`,
    });
  }

  const username = typeof req.query.username === 'string' ? req.query.username.trim() : '';
  if (!username) {
    return res.status(400).json({ error: 'Username query parameter must be a non-empty string.' });
  }

  const client = getOAuthClient(provider);
  if (!client) {
    return res.status(503).json({
      error: 'OAuth not configured',
      details: `Missing ${provider === 'google' ? 'GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET' : 'MICROSOFT_CLIENT_ID/MICROSOFT_CLIENT_SECRET'}. Add them as Vercel environment variables to enable sign-in.`,
    });
  }

  const state = crypto.randomBytes(24).toString('hex');
  const { verifier, challenge } = generatePkce();
  const redirectUri = buildCallbackUrl(String(req.headers?.host || ''));

  const cookiePayload = Buffer.from(
    JSON.stringify({ provider, username, verifier, state }),
  ).toString('base64url');

  res.setHeader(
    'Set-Cookie',
    `volt_oauth=${cookiePayload}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`,
  );

  const authorizeUrl = buildAuthorizeUrl(provider, {
    clientId: client.clientId,
    redirectUri,
    state,
    codeChallenge: challenge,
  });

  return res.redirect(authorizeUrl);
}
