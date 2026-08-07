import {
  OAUTH_PROVIDERS,
  OAuthProvider,
  buildCallbackUrl,
  exchangeCodeForTokens,
  fetchUserInfo,
  getOAuthClient,
  parseCookies,
  saveOAuthTokens,
} from '../utils/oauth.js';

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

function getQueryString(req: ApiRequest, key: string): string {
  const value = req.query[key];
  return typeof value === 'string' ? value : '';
}

/**
 * GET /api/auth/callback?provider=google&code=...&state=...
 * Exchanges the authorization code, stores tokens encrypted in the vault,
 * then redirects back to the app with a success/failure marker.
 */
export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const provider = getQueryString(req, 'provider').toLowerCase() as OAuthProvider;
  const code = getQueryString(req, 'code');
  const state = getQueryString(req, 'state');
  const error = getQueryString(req, 'error');

  const appOrigin =
    String(req.headers?.origin || req.headers?.referer || '') ||
    'https://volt-code-ai-v5-0-next-gen-ops-projects.vercel.app';

  const failRedirect = (reason: string) => {
    const url = new URL(appOrigin);
    url.searchParams.set('oauth', 'error');
    url.searchParams.set('provider', provider);
    url.searchParams.set('reason', encodeURIComponent(reason));
    return res.redirect(url.toString());
  };

  if (!OAUTH_PROVIDERS.includes(provider)) {
    return failRedirect('Unsupported provider');
  }

  if (error) {
    return failRedirect(`Provider denied consent (${error})`);
  }

  const cookies = parseCookies(req.headers?.cookie as string | undefined);
  let pending: { provider: string; username: string; verifier: string; state: string } | null;
  try {
    pending = JSON.parse(Buffer.from(cookies.volt_oauth || '', 'base64url').toString('utf8'));
  } catch {
    pending = null;
  }

  if (!pending || pending.provider !== provider || pending.state !== state || !pending.verifier) {
    return failRedirect('OAuth state mismatch — start again');
  }

  if (!code) {
    return failRedirect('Missing authorization code');
  }

  const client = getOAuthClient(provider);
  if (!client) {
    return failRedirect('OAuth not configured on server');
  }

  const redirectUri = buildCallbackUrl(String(req.headers?.host || ''));

  const tokens = await exchangeCodeForTokens(provider, {
    code,
    verifier: pending.verifier,
    redirectUri,
    clientId: client.clientId,
    clientSecret: client.clientSecret,
  });

  if (tokens.error || !tokens.access_token) {
    return failRedirect(`Token exchange failed: ${tokens.error_description || tokens.error || 'unknown'}`);
  }

  const identity = await fetchUserInfo(provider, tokens.access_token);

  try {
    await saveOAuthTokens(pending.username, provider, {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || '',
      expiresAt:
        typeof tokens.expires_in === 'number' && tokens.expires_in > 0
          ? new Date(Date.now() + tokens.expires_in * 1000)
          : null,
      email: identity?.email || '',
      name: identity?.name || '',
      picture: identity?.picture || '',
    });
  } catch {
    return failRedirect('Failed to persist tokens — is MONGODB_URI configured?');
  }

  res.setHeader('Set-Cookie', 'volt_oauth=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');

  const successUrl = new URL(appOrigin);
  successUrl.searchParams.set('oauth', 'success');
  successUrl.searchParams.set('provider', provider);
  successUrl.searchParams.set('email', encodeURIComponent(identity?.email || pending.username));
  return res.redirect(successUrl.toString());
}
