import * as crypto from 'crypto';
import { connectToDatabase } from './db.js';
import { UserSettingsModel } from '../../src/models/Schemas.js';
import { encrypt, decrypt } from './crypto.js';

export type OAuthProvider = 'google' | 'microsoft';

export interface OAuthTokenSet {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date | null;
  email: string;
  name: string;
  picture: string;
}

interface OAuthProviderMeta {
  label: string;
  authorizeUrl: string;
  tokenUrl: string;
  userinfoUrl: string;
  scopes: string[];
  envClientId: string;
  envClientSecret: string;
}

const PROVIDER_META: Record<OAuthProvider, OAuthProviderMeta> = {
  google: {
    label: 'Google',
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userinfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
    scopes: [
      'openid',
      'email',
      'profile',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/drive.readonly',
    ],
    envClientId: 'GOOGLE_CLIENT_ID',
    envClientSecret: 'GOOGLE_CLIENT_SECRET',
  },
  microsoft: {
    label: 'Microsoft',
    authorizeUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    userinfoUrl: 'https://graph.microsoft.com/v1.0/me',
    scopes: [
      'openid',
      'email',
      'profile',
      'offline_access',
      'User.Read',
      'Files.Read.All',
      'Mail.Read',
    ],
    envClientId: 'MICROSOFT_CLIENT_ID',
    envClientSecret: 'MICROSOFT_CLIENT_SECRET',
  },
};

export const OAUTH_PROVIDERS: OAuthProvider[] = ['google', 'microsoft'];

/**
 * OAuth app credentials for a provider, pulled from environment variables.
 * Returns null when not configured so flows can degrade gracefully.
 */
export function getOAuthClient(provider: OAuthProvider): {
  clientId: string;
  clientSecret: string;
  label: string;
} | null {
  const meta = PROVIDER_META[provider];
  const clientId = process.env[meta.envClientId] || '';
  const clientSecret = process.env[meta.envClientSecret] || '';
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret, label: meta.label };
}

/**
 * The public callback URL that must be registered as an authorized redirect
 * URI in Google Cloud Console / Azure Portal.
 */
export function buildCallbackUrl(host: string): string {
  const override = process.env.OAUTH_REDIRECT_BASE;
  if (override) return `${override.replace(/\/$/, '')}/api/auth/callback`;
  const proto = host.includes('localhost') ? 'http' : 'https';
  return `${proto}://${host}/api/auth/callback`;
}

export function base64UrlEncode(buffer: Buffer): string {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * PKCE pair. The verifier travels in an HttpOnly cookie; the challenge goes
 * to the provider in the authorize URL.
 */
export function generatePkce(): { verifier: string; challenge: string } {
  const verifier = crypto.randomBytes(32).toString('base64url');
  const challenge = base64UrlEncode(crypto.createHash('sha256').update(verifier).digest());
  return { verifier, challenge };
}

export function buildAuthorizeUrl(
  provider: OAuthProvider,
  opts: { clientId: string; redirectUri: string; state: string; codeChallenge: string },
): string {
  const meta = PROVIDER_META[provider];
  const params = new URLSearchParams({
    client_id: opts.clientId,
    redirect_uri: opts.redirectUri,
    response_type: 'code',
    scope: meta.scopes.join(' '),
    state: opts.state,
    code_challenge: opts.codeChallenge,
    code_challenge_method: 'S256',
    access_type: 'offline',
    prompt: 'consent',
  });
  return `${meta.authorizeUrl}?${params.toString()}`;
}

interface TokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

/**
 * Exchange the authorization code for access/refresh tokens (PKCE verifier
 * included server-side with the client secret).
 */
export async function exchangeCodeForTokens(
  provider: OAuthProvider,
  opts: { code: string; verifier: string; redirectUri: string; clientId: string; clientSecret: string },
): Promise<TokenResponse> {
  const meta = PROVIDER_META[provider];
  const body = new URLSearchParams({
    code: opts.code,
    client_id: opts.clientId,
    client_secret: opts.clientSecret,
    redirect_uri: opts.redirectUri,
    code_verifier: opts.verifier,
    grant_type: 'authorization_code',
  });
  const response = await fetch(meta.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  return (await response.json()) as TokenResponse;
}

/**
 * Refresh an expired access token using the stored refresh token.
 */
export async function refreshAccessToken(
  provider: OAuthProvider,
  opts: { refreshToken: string; clientId: string; clientSecret: string },
): Promise<TokenResponse> {
  const meta = PROVIDER_META[provider];
  const body = new URLSearchParams({
    client_id: opts.clientId,
    client_secret: opts.clientSecret,
    refresh_token: opts.refreshToken,
    grant_type: 'refresh_token',
  });
  const response = await fetch(meta.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  return (await response.json()) as TokenResponse;
}

interface UserInfo {
  email: string;
  name: string;
  picture: string;
}

/**
 * Fetch the authenticated account identity (email/name/picture).
 */
export async function fetchUserInfo(
  provider: OAuthProvider,
  accessToken: string,
): Promise<UserInfo | null> {
  const meta = PROVIDER_META[provider];
  try {
    const response = await fetch(meta.userinfoUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) return null;
    const raw = (await response.json()) as Record<string, unknown>;
    if (provider === 'google') {
      return {
        email: String(raw.email || ''),
        name: String(raw.name || raw.email || ''),
        picture: String(raw.picture || ''),
      };
    }
    // Microsoft Graph /me
    return {
      email: String(raw.mail || raw.userPrincipalName || raw.email || ''),
      name: String(raw.displayName || raw.userPrincipalName || ''),
      picture: String(raw.picture || ''),
    };
  } catch {
    return null;
  }
}

function toTokenSet(
  tokens: TokenResponse,
  identity: UserInfo | null,
): OAuthTokenSet {
  const expiresAt =
    typeof tokens.expires_in === 'number' && tokens.expires_in > 0
      ? new Date(Date.now() + tokens.expires_in * 1000)
      : null;
  return {
    accessToken: tokens.access_token || '',
    refreshToken: tokens.refresh_token || '',
    expiresAt,
    email: identity?.email || '',
    name: identity?.name || '',
    picture: identity?.picture || '',
  };
}

/**
 * Persist an OAuth token bundle for a user, encrypted at rest.
 * Google + Microsoft tokens live under `oauth.<provider>` in UserSettings.
 */
export async function saveOAuthTokens(
  username: string,
  provider: OAuthProvider,
  tokens: OAuthTokenSet,
): Promise<void> {
  if (!username || !username.trim()) return;

  const field = `oauth.${provider}.`;
  await connectToDatabase();
  await UserSettingsModel.findOneAndUpdate(
    { username },
    {
      $set: {
        [`${field}accessTokenEncrypted`]: tokens.accessToken ? encrypt(tokens.accessToken) : '',
        [`${field}refreshTokenEncrypted`]: tokens.refreshToken ? encrypt(tokens.refreshToken) : '',
        [`${field}expiresAt`]: tokens.expiresAt || null,
        [`${field}email`]: tokens.email,
        [`${field}name`]: tokens.name,
        [`${field}picture`]: tokens.picture,
        updatedAt: new Date(),
      },
    },
    { new: true, upsert: true },
  );
}

/**
 * Load a stored OAuth token bundle for a user. Returns an empty bundle when
 * the vault is unreachable or nothing is stored.
 */
export async function loadOAuthTokens(
  username: string,
  provider: OAuthProvider,
): Promise<OAuthTokenSet> {
  const empty: OAuthTokenSet = {
    accessToken: '',
    refreshToken: '',
    expiresAt: null,
    email: '',
    name: '',
    picture: '',
  };
  if (!username || !username.trim()) return empty;

  try {
    await connectToDatabase();
    const settings = await UserSettingsModel.findOne({ username }).lean();
    if (!settings || !settings.oauth) return empty;

    const stored = (settings.oauth as Record<string, Record<string, unknown>>)[provider];
    if (!stored) return empty;

    const getStr = (key: string): string => {
      const value = stored[key];
      return typeof value === 'string' ? value : '';
    };

    let accessToken = '';
    let refreshToken = '';
    if (getStr('accessTokenEncrypted')) {
      try {
        accessToken = decrypt(getStr('accessTokenEncrypted'));
      } catch {
        accessToken = '';
      }
    }
    if (getStr('refreshTokenEncrypted')) {
      try {
        refreshToken = decrypt(getStr('refreshTokenEncrypted'));
      } catch {
        refreshToken = '';
      }
    }

    return {
      accessToken,
      refreshToken,
      expiresAt: stored.expiresAt instanceof Date ? stored.expiresAt : stored.expiresAt ? new Date(String(stored.expiresAt)) : null,
      email: getStr('email'),
      name: getStr('name'),
      picture: getStr('picture'),
    };
  } catch {
    return empty;
  }
}

/**
 * Return a usable (possibly freshly refreshed) access token for the user,
 * or null when nothing is stored / refresh fails.
 */
export async function getUsableAccessToken(
  username: string,
  provider: OAuthProvider,
): Promise<string | null> {
  const stored = await loadOAuthTokens(username, provider);
  if (!stored.accessToken && !stored.refreshToken) return null;

  const now = Date.now();
  const isFresh =
    stored.accessToken &&
    (!stored.expiresAt || stored.expiresAt.getTime() - now > 5 * 60 * 1000);
  if (isFresh) return stored.accessToken;

  if (!stored.refreshToken) return stored.accessToken || null;

  const client = getOAuthClient(provider);
  if (!client) return null;

  try {
    const refreshed = await refreshAccessToken(provider, {
      refreshToken: stored.refreshToken,
      clientId: client.clientId,
      clientSecret: client.clientSecret,
    });
    if (!refreshed.access_token) return null;
    const identity = await fetchUserInfo(provider, refreshed.access_token);
    const tokenSet = toTokenSet(
      { ...refreshed, refresh_token: refreshed.refresh_token || stored.refreshToken },
      identity,
    );
    await saveOAuthTokens(username, provider, tokenSet);
    return tokenSet.accessToken;
  } catch {
    return stored.accessToken || null;
  }
}

/**
 * Clear stored OAuth tokens for a provider (disconnect).
 */
export async function clearOAuthTokens(
  username: string,
  provider: OAuthProvider,
): Promise<void> {
  if (!username || !username.trim()) return;
  const field = `oauth.${provider}.`;
  await connectToDatabase();
  await UserSettingsModel.findOneAndUpdate(
    { username },
    {
      $set: {
        [`${field}accessTokenEncrypted`]: '',
        [`${field}refreshTokenEncrypted`]: '',
        [`${field}expiresAt`]: null,
        [`${field}email`]: '',
        [`${field}name`]: '',
        [`${field}picture`]: '',
        updatedAt: new Date(),
      },
    },
    { upsert: true },
  );
}

export function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const result: Record<string, string> = {};
  if (!cookieHeader) return result;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key) result[key] = decodeURIComponent(value);
  }
  return result;
}
