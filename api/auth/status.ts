import { OAUTH_PROVIDERS, getOAuthClient, loadOAuthTokens } from '../utils/oauth.js';

type ApiRequest = {
  method?: string;
  query: Record<string, string | string[] | undefined>;
};

type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (payload: unknown) => ApiResponse;
};

/**
 * GET /api/auth/status?username=...
 * Reports which providers are configured on the server and which accounts are
 * connected for the user. Never exposes tokens — only identity + expiry.
 */
export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const username = typeof req.query.username === 'string' ? req.query.username.trim() : '';
  if (!username) {
    return res.status(400).json({ error: 'Username query parameter must be a non-empty string.' });
  }

  const statuses: Record<string, unknown> = {};

  for (const provider of OAUTH_PROVIDERS) {
    const client = getOAuthClient(provider);
    const tokens = await loadOAuthTokens(username, provider);
    const connected = Boolean(tokens.accessToken || tokens.refreshToken);
    statuses[provider] = {
      configured: Boolean(client),
      connected,
      email: connected ? tokens.email : '',
      name: connected ? tokens.name : '',
      picture: connected ? tokens.picture : '',
      expiresAt: connected ? (tokens.expiresAt ? tokens.expiresAt.toISOString() : null) : null,
      services:
        provider === 'google'
          ? ['gmail', 'drive']
          : ['onedrive', 'mail'],
    };
  }

  return res.status(200).json({ username, providers: statuses });
}
