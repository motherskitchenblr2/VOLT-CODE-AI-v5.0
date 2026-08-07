import { OAUTH_PROVIDERS, OAuthProvider, clearOAuthTokens } from '../utils/oauth.js';

type ApiRequest = {
  method?: string;
  query: Record<string, string | string[] | undefined>;
};

type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (payload: unknown) => ApiResponse;
};

/**
 * POST /api/auth/logout?username=...&provider=google|microsoft
 * Clears the stored OAuth tokens for a provider (disconnects the account).
 */
export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const username = typeof req.query.username === 'string' ? req.query.username.trim() : '';
  if (!username) {
    return res.status(400).json({ error: 'Username query parameter must be a non-empty string.' });
  }

  const rawProvider = typeof req.query.provider === 'string' ? req.query.provider.toLowerCase() : '';
  const provider = rawProvider as OAuthProvider;

  if (!OAUTH_PROVIDERS.includes(provider)) {
    return res.status(400).json({
      error: `Unsupported provider. Allowed: ${OAUTH_PROVIDERS.join(', ')}`,
    });
  }

  try {
    await clearOAuthTokens(username, provider);
    return res.status(200).json({ ok: true, provider, disconnected: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: 'Failed to disconnect', details: message });
  }
}
