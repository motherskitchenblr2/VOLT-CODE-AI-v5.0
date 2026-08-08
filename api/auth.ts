import * as crypto from 'crypto';
import {
  OAUTH_PROVIDERS,
  OAuthProvider,
  buildAuthorizeUrl,
  buildCallbackUrl,
  exchangeCodeForTokens,
  fetchUserInfo,
  generatePkce,
  getOAuthClient,
  loadOAuthTokens,
  parseCookies,
  saveOAuthTokens,
  clearOAuthTokens,
} from '../shared/oauth.js';
import {
  applySecurityHeaders,
  audit,
  clearSessionCookieHeader,
  clientIp,
  createSession,
  destroySession,
  getPasswordHash,
  getSessionUsername,
  hashPassword,
  isPreflight,
  rateLimit,
  requireAuth,
  sanitizeText,
  sanitizeUsername,
  sessionCookieHeader,
  setPassword,
  userExists,
  verifyPassword,
} from '../shared/security.js';

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
  redirect: (url: string) => ApiResponse;
  setHeader: (name: string, value: string) => ApiResponse;
};

const getQueryString = (req: ApiRequest, key: string): string => {
  const value = req.query[key];
  return typeof value === 'string' ? value : '';
};

const getBodyString = (req: ApiRequest, key: string): string => {
  const value = req.body?.[key];
  return typeof value === 'string' ? value : '';
};

const APP_ORIGIN =
  process.env.APP_ORIGIN ||
  'https://volt-code-ai-v5-0-next-gen-ops-projects.vercel.app';

/**
 * Central auth + OAuth gateway. Routes by ?action= :
 *   POST action=register  -> create account, start session
 *   POST action=login     -> verify password, start session
 *   POST action=logout    -> destroy session
 *   GET  action=me        -> current session identity (for app boot)
 *   GET  action=start     -> redirect to provider consent (PKCE + HttpOnly cookie)
 *   GET  action=callback  -> exchange code, store tokens, redirect to app
 *   GET  action=status    -> connection state (no tokens exposed)
 *   POST action=logoutoauth -> disconnect a provider
 *
 * Consolidated into one Serverless Function to stay within the Vercel Hobby
 * plan limit of 12 functions per deployment.
 */
export default async function handler(req: ApiRequest, res: ApiResponse) {
  applySecurityHeaders(res, String(req.headers?.origin || ''));
  if (isPreflight(req)) {
    return res.status(204).json({});
  }

  const action = getQueryString(req, 'action');

  if (action === 'register') return handleRegister(req, res);
  if (action === 'login') return handleLogin(req, res);
  if (action === 'logout') return handleLogout(req, res);
  if (action === 'me') return handleMe(req, res);
  if (action === 'start') return handleStart(req, res);
  if (action === 'callback') return handleCallback(req, res);
  if (action === 'status') return handleStatus(req, res);
  if (action === 'logoutoauth') return handleLogoutOAuth(req, res);

  return res.status(400).json({
    error: 'Invalid or missing action',
    details: 'Use ?action=register|login|logout|me|start|callback|status|logoutoauth',
  });
}

async function handleRegister(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = clientIp(req);
  const limited = rateLimit(`auth:register:${ip}`, { limit: 5, windowMs: 60_000 });
  if (!limited.allowed) {
    res.setHeader('Retry-After', String(Math.ceil(limited.retryAfterMs / 1000)));
    return res.status(429).json({ error: 'Too many registration attempts. Try again shortly.' });
  }

  const username = sanitizeUsername(getBodyString(req, 'username'));
  const password = getBodyString(req, 'password');
  const email = sanitizeText(getBodyString(req, 'email'), 254);

  if (!username) {
    return res.status(400).json({
      error: 'Invalid username',
      details: 'Use 3-32 letters, digits, dot, underscore or hyphen.',
    });
  }
  if (password.length < 8 || password.length > 128) {
    return res.status(400).json({ error: 'Password must be 8-128 characters.' });
  }

  if (await userExists(username)) {
    await audit(username, 'AUTH_REGISTER', 'Registration rejected: username already exists', 'WARNING');
    return res.status(409).json({ error: 'Username already exists. Choose another or sign in.' });
  }

  try {
    await setPassword(username, hashPassword(password), email);
    const token = await createSession(username, { userAgent: String(req.headers?.['user-agent'] || ''), ip });
    res.setHeader('Set-Cookie', sessionCookieHeader(token));
    await audit(username, 'AUTH_REGISTER', 'New account created and session started.', 'SUCCESS');
    return res.status(201).json({ ok: true, username });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    await audit(username, 'AUTH_REGISTER', `Registration failed: ${message}`, 'FAILED');
    return res.status(500).json({ error: 'Registration failed', details: message });
  }
}

async function handleLogin(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = clientIp(req);
  const limited = rateLimit(`auth:login:${ip}`, { limit: 10, windowMs: 60_000 });
  if (!limited.allowed) {
    res.setHeader('Retry-After', String(Math.ceil(limited.retryAfterMs / 1000)));
    return res.status(429).json({ error: 'Too many login attempts. Try again shortly.' });
  }

  const username = sanitizeUsername(getBodyString(req, 'username'));
  const password = getBodyString(req, 'password');

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const storedHash = await getPasswordHash(username);
  if (!storedHash || !verifyPassword(password, storedHash)) {
    await audit(username, 'AUTH_LOGIN', 'Login failed: invalid credentials', 'WARNING');
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  try {
    const token = await createSession(username, { userAgent: String(req.headers?.['user-agent'] || ''), ip });
    res.setHeader('Set-Cookie', sessionCookieHeader(token));
    await audit(username, 'AUTH_LOGIN', 'User signed in successfully.', 'SUCCESS');
    return res.status(200).json({ ok: true, username });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    await audit(username, 'AUTH_LOGIN', `Login failed: ${message}`, 'FAILED');
    return res.status(500).json({ error: 'Login failed', details: message });
  }
}

async function handleLogout(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const username = await getSessionUsername(req);
  await destroySession(req);
  res.setHeader('Set-Cookie', clearSessionCookieHeader());
  if (username) {
    await audit(username, 'AUTH_LOGOUT', 'User signed out.', 'SUCCESS');
  }
  return res.status(200).json({ ok: true, loggedOut: true });
}

async function handleMe(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const username = await getSessionUsername(req);
  if (!username) {
    return res.status(200).json({ authenticated: false });
  }
  return res.status(200).json({ authenticated: true, username });
}

async function handleStart(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!(await requireAuth(req, res))) return res;

  const rawProvider = getQueryString(req, 'provider').toLowerCase();
  const provider = rawProvider as OAuthProvider;

  if (!OAUTH_PROVIDERS.includes(provider)) {
    return res.status(400).json({
      error: `Unsupported provider. Allowed: ${OAUTH_PROVIDERS.join(', ')}`,
    });
  }

  const username = req.locals!.username;

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

async function handleCallback(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const provider = getQueryString(req, 'provider').toLowerCase() as OAuthProvider;
  const code = getQueryString(req, 'code');
  const state = getQueryString(req, 'state');
  const error = getQueryString(req, 'error');

  const failRedirect = (reason: string) => {
    const url = new URL(APP_ORIGIN);
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
  await audit(pending.username, `OAUTH_CONNECT_${provider.toUpperCase()}`, `Connected ${provider} account ${identity?.email || ''}`, 'SUCCESS');

  const successUrl = new URL(APP_ORIGIN);
  successUrl.searchParams.set('oauth', 'success');
  successUrl.searchParams.set('provider', provider);
  successUrl.searchParams.set('email', encodeURIComponent(identity?.email || pending.username));
  return res.redirect(successUrl.toString());
}

async function handleStatus(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!(await requireAuth(req, res))) return res;
  const username = req.locals!.username;

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
      services: provider === 'google' ? ['gmail', 'drive'] : ['onedrive', 'mail'],
    };
  }

  return res.status(200).json({ username, providers: statuses });
}

async function handleLogoutOAuth(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!(await requireAuth(req, res))) return res;
  const username = req.locals!.username;

  const rawProvider = getQueryString(req, 'provider').toLowerCase();
  const provider = rawProvider as OAuthProvider;

  if (!OAUTH_PROVIDERS.includes(provider)) {
    return res.status(400).json({
      error: `Unsupported provider. Allowed: ${OAUTH_PROVIDERS.join(', ')}`,
    });
  }

  try {
    await clearOAuthTokens(username, provider);
    await audit(username, `OAUTH_DISCONNECT_${provider.toUpperCase()}`, `Disconnected ${provider} account`, 'SUCCESS');
    return res.status(200).json({ ok: true, provider, disconnected: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: 'Failed to disconnect', details: message });
  }
}
