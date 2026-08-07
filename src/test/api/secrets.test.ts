import { describe, it, expect, vi, beforeEach } from 'vitest';

const vaultState = vi.hoisted(() => ({
  store: {} as Record<string, { keys: Record<string, string> }>,
  reset() {
    this.store = {};
  },
}));

vi.mock('../../../api/utils/db', () => ({
  connectToDatabase: vi.fn().mockResolvedValue({}),
}));

vi.mock('../../../src/models/Schemas', () => ({
  UserSettingsModel: {
    findOne: vi.fn(({ username }: { username: string }) => ({
      lean: async () => {
        const doc = vaultState.store[username];
        return doc ? { ...doc } : null;
      },
    })),
    findOneAndUpdate: vi.fn(
      async (
        { username }: { username: string },
        update: { $set: Record<string, string> },
        _opts: unknown,
      ) => {
        const nested: Record<string, string> = {};
        for (const [path, value] of Object.entries(update.$set)) {
          if (path.startsWith('keys.')) {
            nested[path.slice(5)] = value;
          }
        }
        vaultState.store[username] = { keys: nested };
        return vaultState.store[username];
      },
    ),
  },
}));

import { encrypt, decrypt } from '../../../api/utils/crypto';
import {
  saveUserSecrets,
  loadUserSecrets,
  hasStoredSecrets,
} from '../../../api/utils/secrets';

describe('api/utils/secrets (MongoDB secret vault)', () => {
  beforeEach(() => {
    vaultState.reset();
    vi.stubEnv('ENCRYPTION_KEY', 'e'.repeat(32));
  });

  it('encrypt/decrypt round-trips with AES-256-GCM', () => {
    const secret = 'sk-or-v1-super-secret-token';
    const enc = encrypt(secret);
    expect(enc).not.toContain(secret);
    expect(enc.split(':')).toHaveLength(3);
    expect(decrypt(enc)).toBe(secret);
  });

  it('does not store plaintext secrets in the database', async () => {
    await saveUserSecrets('alice', {
      groq: 'gsk_plaintext',
      openrouter: 'sk-or-v1-abc',
    });

    const raw = Object.values(vaultState.store.alice.keys).join(' ');
    expect(raw).not.toContain('gsk_plaintext');
    expect(raw).not.toContain('sk-or-v1-abc');

    const result = await loadUserSecrets('alice');
    expect(result.groq).toBe('gsk_plaintext');
    expect(result.openrouter).toBe('sk-or-v1-abc');
    expect(await hasStoredSecrets('alice')).toBe(true);
  });

  it('returns empty secrets when nothing is stored for the user', async () => {
    expect(await loadUserSecrets('bob')).toEqual({});
    expect(await hasStoredSecrets('bob')).toBe(false);
  });

  it('degrades gracefully when the database is unreachable', async () => {
    const db = await import('../../../api/utils/db');
    vi.mocked(db.connectToDatabase).mockRejectedValueOnce(new Error('no db'));
    expect(await loadUserSecrets('carol')).toEqual({});
    expect(await hasStoredSecrets('carol')).toBe(false);
  });
});
