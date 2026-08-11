import { connectToDatabase } from './db.js';
import { UserSettingsModel } from '../src/models/Schemas.js';
import { encrypt, decrypt } from './crypto.js';

export type StoredSecrets = {
  groq?: string;
  openrouter?: string;
  nvidia?: string;
  huggingface?: string;
  githubToken?: string;
};

const FIELD_TO_PROP: Record<string, keyof StoredSecrets> = {
  groqKeyEncrypted: 'groq',
  openrouterKeyEncrypted: 'openrouter',
  nvidiaKeyEncrypted: 'nvidia',
  huggingfaceKeyEncrypted: 'huggingface',
  githubTokenEncrypted: 'githubToken',
};

/**
 * Persist plaintext provider keys for a user, encrypted at rest with
 * ENCRYPTION_KEY (AES-256-GCM). Never stores plaintext secrets in MongoDB.
 * Only the fields explicitly supplied in `plaintext` are updated — keys that
 * are absent from the payload are left untouched (no accidental wipe).
 */
export async function saveUserSecrets(
  username: string,
  plaintext: Partial<StoredSecrets>,
): Promise<void> {
  if (!username || !username.trim()) return;

  const $set: Record<string, string | Date> = {};
  for (const [field, prop] of Object.entries(FIELD_TO_PROP)) {
    const value = plaintext[prop];
    if (typeof value === 'string' && value.trim().length > 0) {
      $set[`keys.${field}`] = encrypt(value.trim());
    }
  }

  if (Object.keys($set).length === 0) return;

  $set.updatedAt = new Date();

  await connectToDatabase();
  await UserSettingsModel.findOneAndUpdate(
    { username },
    { $set },
    { new: true, upsert: true },
  );
}

/**
 * Load and decrypt a user's stored secrets from MongoDB.
 * Returns empty object when the vault is unreachable or has nothing stored,
 * so callers can fall back to client-provided keys or environment variables.
 */
export async function loadUserSecrets(username: string): Promise<StoredSecrets> {
  const secrets: StoredSecrets = {};
  if (!username || !username.trim()) return secrets;

  try {
    await connectToDatabase();
    const settings = await UserSettingsModel.findOne({ username }).lean();

    if (!settings || !settings.keys) return secrets;

    const keys = settings.keys as Record<string, string>;
    for (const [field, prop] of Object.entries(FIELD_TO_PROP)) {
      const encryptedValue = keys[field];
      if (typeof encryptedValue === 'string' && encryptedValue.length > 0) {
        try {
          const plain = decrypt(encryptedValue);
          if (plain) secrets[prop] = plain;
        } catch {
          // Skip malformed entries; fall back to env vars.
        }
      }
    }
    return secrets;
  } catch {
    return secrets;
  }
}

/**
 * True when any provider secret is stored for the user (used to show a
 * "stored" indicator in the UI without ever exposing the secret value).
 */
export async function hasStoredSecrets(username: string): Promise<boolean> {
  const secrets = await loadUserSecrets(username);
  return Object.values(secrets).some((v) => typeof v === 'string' && v.length > 0);
}
