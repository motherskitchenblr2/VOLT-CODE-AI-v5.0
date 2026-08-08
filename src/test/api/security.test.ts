import { describe, it, expect, vi, beforeEach } from 'vitest';

const sessionState = vi.hoisted(() => ({
  store: {} as Record<string, { tokenHash: string; username: string; expiresAt: string; lastSeenAt: string }>,
  deleteMany: [] as string[],
  reset() {
    this.store = {};
    this.deleteMany = [];
  },
}));

const userState = vi.hoisted(() => ({
  store: {} as Record<string, { passwordHash?: string; email?: string }>,
  reset() {
    this.store = {};
  },
}));

const auditState = vi.hoisted(() => ({
  entries: [] as { username: string; action: string; details: string; status: string }[],
  reset() {
    this.entries = [];
  },
}));

vi.mock('../../../shared/db', () => ({
  connectToDatabase: vi.fn().mockResolvedValue({}),
}));

vi.mock('../../../src/models/Schemas', () => ({
  UserSettingsModel: {
    findOne: vi.fn(({ username }: { username: string }) => ({
      select: () => ({
        lean: async () => {
          const doc = userState.store[username];
          return doc ? { passwordHash: doc.passwordHash || '', email: doc.email || '' } : null;
        },
      }),
      lean: async () => userState.store[username] || null,
    })),
    findOneAndUpdate: vi.fn(
      async (
        { username }: { username: string },
        update: { $set: Record<string, string> },
        _opts: unknown,
      ) => {
        userState.store[username] = { ...userState.store[username], ...update.$set };
        return userState.store[username];
      },
    ),
  },
  AuthSessionModel: {
    create: vi.fn(async (doc: { tokenHash: string; username: string; expiresAt: Date }) => {
      sessionState.store[doc.tokenHash] = {
        tokenHash: doc.tokenHash,
        username: doc.username,
        expiresAt: doc.expiresAt.toISOString(),
        lastSeenAt: new Date().toISOString(),
      };
      return sessionState.store[doc.tokenHash];
    }),
    findOne: vi.fn(({ tokenHash }: { tokenHash: string }) => ({
      lean: async () => sessionState.store[tokenHash] || null,
    })),
    deleteOne: vi.fn(async ({ tokenHash }: { tokenHash: string }) => {
      delete sessionState.store[tokenHash];
      sessionState.deleteMany.push(tokenHash);
      return { deletedCount: 1 };
    }),
  },
  AuditLogModel: {
    create: vi.fn(async (doc: { username: string; action: string; details: string; status: string }) => {
      auditState.entries.push(doc);
      return doc;
    }),
  },
}));

import {
  hashPassword,
  verifyPassword,
  hashToken,
  createSession,
  getSessionUsername,
  destroySession,
  sessionCookieHeader,
  clearSessionCookieHeader,
  requireAuth,
  rateLimit,
  clientIp,
  applySecurityHeaders,
  isPreflight,
  sanitizeUsername,
  sanitizeText,
  audit,
  parseCookies,
  userExists,
  setPassword,
  getPasswordHash,
} from '../../../shared/security';

const makeRes = () => {
  const headers: Record<string, string> = {};
  return {
    _status: 0,
    _json: null as unknown,
    headers,
    status(code: number) {
      this._status = code;
      return this;
    },
    json(data: unknown) {
      this._json = data;
      return this;
    },
    setHeader(name: string, value: string) {
      headers[name] = value;
      return this;
    },
  };
};

describe('api/utils/security', () => {
  beforeEach(() => {
    sessionState.reset();
    userState.reset();
    auditState.reset();
    vi.restoreAllMocks();
  });

  describe('password hashing (scrypt)', () => {
    it('hashes passwords and verifies the correct one', () => {
      const hash = hashPassword('correct horse battery staple');
      expect(hash).toMatch(/^scrypt\$/);
      expect(hash).not.toContain('correct');
      expect(verifyPassword('correct horse battery staple', hash)).toBe(true);
    });

    it('rejects the wrong password', () => {
      const hash = hashPassword('secret');
      expect(verifyPassword('wrong', hash)).toBe(false);
    });

    it('rejects malformed stored hashes', () => {
      expect(verifyPassword('secret', 'not-a-hash')).toBe(false);
      expect(verifyPassword('secret', '')).toBe(false);
    });

    it('produces unique salts per hash', () => {
      expect(hashPassword('same')).not.toBe(hashPassword('same'));
    });
  });

  describe('session tokens', () => {
    it('hashToken is deterministic sha256 hex', () => {
      expect(hashToken('abc')).toBe(hashToken('abc'));
      expect(hashToken('abc')).not.toBe(hashToken('abd'));
      expect(hashToken('abc')).toMatch(/^[0-9a-f]{64}$/);
    });

    it('createSession stores only the hashed token, never the raw token', async () => {
      const token = await createSession('alice', { userAgent: 'vitest', ip: '127.0.0.1' });
      expect(token).toBeTruthy();
      expect(sessionState.store[hashToken(token)]).toBeTruthy();
      expect(Object.keys(sessionState.store)).toHaveLength(1);
    });

    it('getSessionUsername returns the username for a valid cookie', async () => {
      const token = await createSession('alice');
      const req = { headers: { cookie: `volt_session=${token}` } };
      expect(await getSessionUsername(req)).toBe('alice');
    });

    it('getSessionUsername returns null without a cookie', async () => {
      expect(await getSessionUsername({ headers: {} })).toBeNull();
    });

    it('getSessionUsername returns null for a revoked/unknown token', async () => {
      const req = { headers: { cookie: 'volt_session=made-up-token' } };
      expect(await getSessionUsername(req)).toBeNull();
    });

    it('destroySession deletes the session and returns true', async () => {
      const token = await createSession('alice');
      const req = { headers: { cookie: `volt_session=${token}` } };
      expect(await destroySession(req)).toBe(true);
      expect(sessionState.store[hashToken(token)]).toBeUndefined();
    });

    it('destroySession returns false when no cookie present', async () => {
      expect(await destroySession({ headers: {} })).toBe(false);
    });
  });

  describe('cookie headers', () => {
    it('sessionCookieHeader sets HttpOnly, SameSite=Lax and Path=/', () => {
      const header = sessionCookieHeader('tok123');
      expect(header).toContain('volt_session=tok123');
      expect(header).toContain('HttpOnly');
      expect(header).toContain('SameSite=Lax');
      expect(header).toContain('Path=/');
    });

    it('clearSessionCookieHeader expires the cookie immediately', () => {
      expect(clearSessionCookieHeader()).toContain('Max-Age=0');
      expect(clearSessionCookieHeader()).toContain('volt_session=');
    });
  });

  describe('requireAuth', () => {
    it('sets req.locals.username and returns true for a valid session', async () => {
      const token = await createSession('bob');
      const req = { headers: { cookie: `volt_session=${token}` }, locals: {} as { username: string } }; // eslint-disable-line @typescript-eslint/no-unused-vars
      const res = makeRes();
      expect(await requireAuth(req, res)).toBe(true);
      expect(req.locals).toEqual({ username: 'bob' });
      expect(res._status).toBe(0);
    });

    it('sends 401 and returns false without a session', async () => {
      const req = { headers: {} };
      const res = makeRes();
      expect(await requireAuth(req, res)).toBe(false);
      expect(res._status).toBe(401);
    });
  });

  describe('rate limiting', () => {
    it('allows requests under the limit and blocks past it', () => {
      for (let i = 0; i < 3; i++) {
        expect(rateLimit('k', { limit: 3, windowMs: 60_000 }).allowed).toBe(true);
      }
      const blocked = rateLimit('k', { limit: 3, windowMs: 60_000 });
      expect(blocked.allowed).toBe(false);
      expect(blocked.retryAfterMs).toBeGreaterThan(0);
    });

    it('tracks distinct keys independently', () => {
      expect(rateLimit('a', { limit: 1, windowMs: 60_000 }).allowed).toBe(true);
      expect(rateLimit('a', { limit: 1, windowMs: 60_000 }).allowed).toBe(false);
      expect(rateLimit('b', { limit: 1, windowMs: 60_000 }).allowed).toBe(true);
    });
  });

  describe('clientIp', () => {
    it('parses the first entry from x-forwarded-for', () => {
      expect(clientIp({ headers: { 'x-forwarded-for': '203.0.113.5, 70.41.3.18' } })).toBe('203.0.113.5');
    });

    it('falls back to unknown', () => {
      expect(clientIp({ headers: {} })).toBe('unknown');
    });
  });

  describe('security headers + CORS', () => {
    it('sets security headers', () => {
      const res = makeRes();
      applySecurityHeaders(res, '');
      expect(res.headers['X-Content-Type-Options']).toBe('nosniff');
      expect(res.headers['X-Frame-Options']).toBe('DENY');
      expect(res.headers['Referrer-Policy']).toBe('no-referrer');
      expect(res.headers['Content-Security-Policy']).toBeTruthy();
    });

    it('adds CORS headers for allowlisted origins', () => {
      const res = makeRes();
      applySecurityHeaders(res, 'http://localhost:5173');
      expect(res.headers['Access-Control-Allow-Origin']).toBe('http://localhost:5173');
      expect(res.headers['Access-Control-Allow-Credentials']).toBe('true');
    });

    it('does not add CORS headers for unknown origins', () => {
      const res = makeRes();
      applySecurityHeaders(res, 'https://evil.example.com');
      expect(res.headers['Access-Control-Allow-Origin']).toBeUndefined();
    });

    it('isPreflight detects OPTIONS', () => {
      expect(isPreflight({ method: 'OPTIONS' })).toBe(true);
      expect(isPreflight({ method: 'GET' })).toBe(false);
    });
  });

  describe('sanitization', () => {
    it('accepts valid usernames', () => {
      expect(sanitizeUsername('alice_01')).toBe('alice_01');
      expect(sanitizeUsername('  bob.smith-77  ')).toBe('bob.smith-77');
    });

    it('rejects invalid usernames', () => {
      expect(sanitizeUsername('a')).toBe('');
      expect(sanitizeUsername('has space')).toBe('');
      expect(sanitizeUsername('has@symbol')).toBe('');
      expect(sanitizeUsername('line\nbreak')).toBe('');
      expect(sanitizeUsername(42)).toBe('');
      expect(sanitizeUsername('')).toBe('');
    });

    it('strips control chars and caps length in sanitizeText', () => {
      expect(sanitizeText('hi\x00there')).toBe('hithere');
      expect(sanitizeText('x'.repeat(100), 10)).toHaveLength(10);
      expect(sanitizeText(undefined)).toBe('');
    });
  });

  describe('audit trail', () => {
    it('writes an audit entry with the action and status', async () => {
      await audit('alice', 'LOGIN', 'user signed in', 'SUCCESS');
      expect(auditState.entries).toHaveLength(1);
      expect(auditState.entries[0]).toMatchObject({
        username: 'alice',
        action: 'LOGIN',
        details: 'user signed in',
        status: 'SUCCESS',
      });
    });

    it('skips writing when username is empty', async () => {
      await audit('', 'LOGIN', 'x');
      expect(auditState.entries).toHaveLength(0);
    });
  });

  describe('parseCookies', () => {
    it('parses cookie header into key/value pairs', () => {
      const parsed = parseCookies('a=1; b=hello%20world; volt_session=tok');
      expect(parsed).toEqual({ a: '1', b: 'hello world', volt_session: 'tok' });
    });

    it('handles empty/missing headers', () => {
      expect(parseCookies('')).toEqual({});
      expect(parseCookies(undefined)).toEqual({});
    });
  });

  describe('user management', () => {
    it('userExists is true when the user doc exists', async () => {
      userState.store.alice = { passwordHash: 'scrypt$x$y' };
      expect(await userExists('alice')).toBe(true);
    });

    it('setPassword stores the hash and email, getPasswordHash reads it back', async () => {
      const hash = hashPassword('pw');
      await setPassword('carol', hash, 'carol@example.com');
      expect(userState.store.carol.passwordHash).toBe(hash);
      expect(userState.store.carol.email).toBe('carol@example.com');
      expect(await getPasswordHash('carol')).toBe(hash);
    });

    it('getPasswordHash returns empty string for an unknown user', async () => {
      expect(await getPasswordHash('ghost')).toBe('');
    });
  });
});
