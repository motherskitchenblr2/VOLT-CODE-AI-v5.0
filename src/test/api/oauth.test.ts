import { describe, it, expect, vi, beforeEach } from 'vitest';

const vaultState = vi.hoisted(() => ({
  store: {} as Record<
    string,
    { oauth?: Record<string, Record<string, unknown>>; keys?: Record<string, string> }
  >,
  reset() {
    this.store = {};
  },
}));

vi.mock('../../../shared/db', () => ({
  connectToDatabase: vi.fn().mockResolvedValue({}),
}));

vi.mock('../../../src/models/Schemas', () => ({
  UserSettingsModel: {
    findOne: vi.fn(({ username }: { username: string }) => ({
      lean: async () => {
        const doc = vaultState.store[username];
        return doc ? JSON.parse(JSON.stringify(doc)) : null;
      },
    })),
    findOneAndUpdate: vi.fn(
      async (
        { username }: { username: string },
        update: { $set: Record<string, unknown> },
        _opts: unknown,
      ) => {
        const current = vaultState.store[username] || {};
        const oauth: Record<string, Record<string, unknown>> = current.oauth || {};
        for (const [path, value] of Object.entries(update.$set)) {
          if (path.startsWith('oauth.')) {
            const [, provider, field] = path.split('.');
            if (provider && field) {
              oauth[provider] = { ...(oauth[provider] || {}), [field]: value };
            }
          }
        }
        vaultState.store[username] = { ...current, oauth };
        return vaultState.store[username];
      },
    ),
  },
}));

import { createHash } from 'crypto';
import {
  generatePkce,
  buildAuthorizeUrl,
  base64UrlEncode,
  saveOAuthTokens,
  loadOAuthTokens,
  clearOAuthTokens,
  getOAuthClient,
  OAUTH_PROVIDERS,
  parseCookies,
} from '../../../shared/oauth';

describe('api/utils/oauth', () => {
  beforeEach(() => {
    vaultState.reset();
    vi.stubEnv('ENCRYPTION_KEY', 'e'.repeat(32));
  });

  it('generates a valid PKCE pair (verifier + S256 challenge)', () => {
    const { verifier, challenge } = generatePkce();
    expect(verifier.length).toBeGreaterThanOrEqual(43);
    expect(challenge).toMatch(/^[A-Za-z0-9_-]+$/);
    const expected = base64UrlEncode(createHash('sha256').update(verifier).digest());
    expect(challenge).toBe(expected);
  });

  it('builds a Google authorize URL with PKCE + offline access', () => {
    const url = buildAuthorizeUrl('google', {
      clientId: 'g-client',
      redirectUri: 'https://app.example/api/auth/callback',
      state: 'state-1',
      codeChallenge: 'challenge-abc',
    });
    expect(url).toContain('accounts.google.com/o/oauth2/v2/auth');
    expect(url).toContain('client_id=g-client');
    expect(url).toContain('code_challenge=challenge-abc');
    expect(url).toContain('code_challenge_method=S256');
    expect(url).toContain('access_type=offline');
    expect(url).toContain('gmail.readonly');
    expect(url).toContain('drive.readonly');
  });

  it('builds a Microsoft authorize URL with OneDrive + Mail scopes', () => {
    const url = buildAuthorizeUrl('microsoft', {
      clientId: 'ms-client',
      redirectUri: 'https://app.example/api/auth/callback',
      state: 'state-2',
      codeChallenge: 'challenge-def',
    });
    expect(url).toContain('login.microsoftonline.com');
    expect(url).toContain('offline_access');
    expect(url).toContain('Files.Read.All');
    expect(url).toContain('Mail.Read');
    expect(url).toContain('code_challenge_method=S256');
  });

  it('returns null client when env credentials are missing', () => {
    expect(getOAuthClient('google')).toBeNull();
    expect(getOAuthClient('microsoft')).toBeNull();
  });

  it('returns client when env credentials are present', () => {
    vi.stubEnv('GOOGLE_CLIENT_ID', 'gid');
    vi.stubEnv('GOOGLE_CLIENT_SECRET', 'gsec');
    const client = getOAuthClient('google');
    expect(client).toEqual({ clientId: 'gid', clientSecret: 'gsec', label: 'Google' });
  });

  it('stores OAuth tokens encrypted at rest and never in plaintext', async () => {
    await saveOAuthTokens('alice', 'google', {
      accessToken: 'ya29.secret-access',
      refreshToken: '1//secret-refresh',
      expiresAt: new Date('2030-01-01T00:00:00Z'),
      email: 'alice@gmail.com',
      name: 'Alice',
      picture: 'https://pics/alice.jpg',
    });

    const raw = JSON.stringify(vaultState.store.alice);
    expect(raw).not.toContain('ya29.secret-access');
    expect(raw).not.toContain('1//secret-refresh');

    const loaded = await loadOAuthTokens('alice', 'google');
    expect(loaded.accessToken).toBe('ya29.secret-access');
    expect(loaded.refreshToken).toBe('1//secret-refresh');
    expect(loaded.email).toBe('alice@gmail.com');
    expect(loaded.name).toBe('Alice');
    expect(loaded.expiresAt).toBeInstanceOf(Date);
  });

  it('isolates providers (google vs microsoft storage)', async () => {
    await saveOAuthTokens('bob', 'microsoft', {
      accessToken: 'ms-access',
      refreshToken: 'ms-refresh',
      expiresAt: null,
      email: 'bob@outlook.com',
      name: 'Bob',
      picture: '',
    });

    const google = await loadOAuthTokens('bob', 'google');
    expect(google.accessToken).toBe('');
    const microsoft = await loadOAuthTokens('bob', 'microsoft');
    expect(microsoft.accessToken).toBe('ms-access');
  });

  it('returns empty bundle when nothing is stored for the user', async () => {
    const loaded = await loadOAuthTokens('nobody', 'google');
    expect(loaded.accessToken).toBe('');
    expect(loaded.refreshToken).toBe('');
    expect(loaded.email).toBe('');
  });

  it('clears stored tokens for a provider on disconnect', async () => {
    await saveOAuthTokens('carol', 'google', {
      accessToken: 'tok',
      refreshToken: 'ref',
      expiresAt: null,
      email: 'carol@gmail.com',
      name: 'Carol',
      picture: '',
    });
    await clearOAuthTokens('carol', 'google');
    const loaded = await loadOAuthTokens('carol', 'google');
    expect(loaded.accessToken).toBe('');
    expect(loaded.email).toBe('');
  });

  it('degrades gracefully when the database is unreachable', async () => {
    const db = await import('../../../shared/db');
    vi.mocked(db.connectToDatabase).mockRejectedValueOnce(new Error('no db'));
    const loaded = await loadOAuthTokens('dave', 'google');
    expect(loaded.accessToken).toBe('');
  });

  it('parses cookie headers into key/value pairs', () => {
    const parsed = parseCookies('volt_oauth=abc%20def; theme=dark; other=x');
    expect(parsed.volt_oauth).toBe('abc def');
    expect(parsed.theme).toBe('dark');
    expect(parseCookies(undefined)).toEqual({});
  });

  it('exposes both providers', () => {
    expect(OAUTH_PROVIDERS).toEqual(['google', 'microsoft']);
  });
});
