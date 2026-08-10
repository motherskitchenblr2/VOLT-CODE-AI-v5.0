import * as crypto from "crypto";
import { connectToDatabase } from "./db.js";
import {
  UserSettingsModel,
  AuthSessionModel,
  AuditLogModel,
} from "../src/models/Schemas.js";

const SESSION_COOKIE = "volt_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const APP_ORIGIN =
  process.env.APP_ORIGIN ||
  "https://volt-code-ai-v5-0-next-gen-ops-projects.vercel.app";

type Req = {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
};

type Res = {
  status: (code: number) => Res;
  json: (payload: unknown) => Res;
  redirect?: (url: string) => Res;
  setHeader?: (name: string, value: string) => Res | void;
};

// ---------------------------------------------------------------------------
// Password hashing (scrypt — Node built-in, no extra dependency)
// ---------------------------------------------------------------------------

const SCRYPT_OPTS = { N: 16384, r: 8, p: 1 };

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64, SCRYPT_OPTS) as Buffer;
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  if (!password || !stored || !stored.startsWith("scrypt$")) return false;
  const parts = stored.split("$");
  if (parts.length !== 3) return false;
  const [, salt, hashHex] = parts;
  try {
    const derived = crypto.scryptSync(
      password,
      salt,
      64,
      SCRYPT_OPTS,
    ) as Buffer;
    const expected = Buffer.from(hashHex, "hex");
    return (
      derived.length === expected.length &&
      crypto.timingSafeEqual(derived, expected)
    );
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Sessions (token in HttpOnly cookie, SHA-256 hash stored in Mongo)
// ---------------------------------------------------------------------------

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createSession(
  username: string,
  meta: { userAgent?: string; ip?: string } = {},
): Promise<string> {
  await connectToDatabase();
  const token = crypto.randomBytes(32).toString("base64url");
  await AuthSessionModel.create({
    tokenHash: hashToken(token),
    username,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    userAgent: meta.userAgent || "",
    ip: meta.ip || "",
    lastSeenAt: new Date(),
  });
  return token;
}

/**
 * Read the session cookie, verify the hashed token against Mongo, and return
 * the username when valid. Returns null on any failure (no session, expired,
 * revoked, or DB unreachable).
 */
export async function getSessionUsername(req: Req): Promise<string | null> {
  const cookieHeader =
    typeof req.headers?.cookie === "string" ? req.headers.cookie : "";
  const token = parseCookies(cookieHeader)[SESSION_COOKIE];
  if (!token) return null;

  try {
    await connectToDatabase();
    const session = await AuthSessionModel.findOne({
      tokenHash: hashToken(token),
    }).lean();
    if (!session) return null;
    if (session.expiresAt && new Date(session.expiresAt).getTime() < Date.now())
      return null;
    return String(session.username);
  } catch {
    return null;
  }
}

export async function destroySession(req: Req): Promise<boolean> {
  const cookieHeader =
    typeof req.headers?.cookie === "string" ? req.headers.cookie : "";
  const token = parseCookies(cookieHeader)[SESSION_COOKIE];
  if (!token) return false;
  try {
    await connectToDatabase();
    await AuthSessionModel.deleteOne({ tokenHash: hashToken(token) });
    return true;
  } catch {
    return false;
  }
}

export function sessionCookieHeader(
  token: string,
  opts: { maxAgeMs?: number } = {},
): string {
  const secure = !APP_ORIGIN.includes("localhost") ? "; Secure" : "";
  const maxAge = opts.maxAgeMs ?? SESSION_TTL_MS;
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax${secure}; Max-Age=${Math.floor(maxAge / 1000)}`;
}

export function clearSessionCookieHeader(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

/**
 * Require a valid session. On success sets `res.locals`-style identity on the
 * request via a `locals` field and returns true. On failure sends 401.
 */
export async function requireAuth(
  req: Req & { locals?: { username: string } },
  res: Res,
): Promise<boolean> {
  const username = await getSessionUsername(req);
  if (!username) {
    res
      .status(401)
      .json({
        error: "Unauthorized",
        details: "A valid session is required. Please sign in.",
      });
    return false;
  }
  req.locals = { username };
  return true;
}

// ---------------------------------------------------------------------------
// Rate limiting (best-effort in-memory sliding window; note: serverless
// instances are short-lived, so this throttles per warm instance)
// ---------------------------------------------------------------------------

interface Bucket {
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  opts: { limit: number; windowMs: number } = { limit: 60, windowMs: 60_000 },
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { timestamps: [] };
    buckets.set(key, bucket);
  }
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < opts.windowMs);
  if (bucket.timestamps.length >= opts.limit) {
    const oldest = bucket.timestamps[0];
    return {
      allowed: false,
      retryAfterMs: Math.max(0, oldest + opts.windowMs - now),
    };
  }
  bucket.timestamps.push(now);
  return { allowed: true, retryAfterMs: 0 };
}

export function clientIp(req: Req): string {
  const fwd = req.headers?.["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.length > 0)
    return fwd.split(",")[0].trim();
  return "unknown";
}

// ---------------------------------------------------------------------------
// Security headers + CORS
// ---------------------------------------------------------------------------

const CORS_ALLOWLIST = [
  APP_ORIGIN,
  "https://volt-code-ai-v5-0-next-gen-ops-projects.vercel.app",
  "http://localhost:5173",
  "http://localhost:4173",
];

export function applySecurityHeaders(res: Res, origin?: string): void {
  if (!res.setHeader) return;
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; connect-src 'self' https://openrouter.ai https://api.groq.com https://integrate.api.nvidia.com https://api-inference.huggingface.co https://api.github.com https://oauth2.googleapis.com https://accounts.google.com https://www.googleapis.com https://graph.microsoft.com https://login.microsoftonline.com; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; frame-ancestors 'none';",
  );
  if (!origin) return;
  if (CORS_ALLOWLIST.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, Cookie",
    );
  }
}

export function isPreflight(req: Req): boolean {
  return req.method === "OPTIONS";
}

// ---------------------------------------------------------------------------
// Input sanitization
// ---------------------------------------------------------------------------

/** Normalize + validate a username: letters, digits, dot, underscore, hyphen. */
export function sanitizeUsername(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const value = raw.trim();
  if (value.length < 3 || value.length > 32) return "";
  if (!/^[A-Za-z0-9._-]+$/.test(value)) return "";
  if (/[\u0000-\u001F\u007F]/.test(value)) return "";
  return value;
}

/** Strip control chars / null bytes and cap length. Empty string on failure. */
export function sanitizeText(raw: unknown, maxLen = 5000): string {
  if (typeof raw !== "string") return "";
  const cleaned = raw
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/[{}\\]/g, (ch) => ch)
    .trim()
    .slice(0, maxLen);
  return cleaned;
}

// ---------------------------------------------------------------------------
// Audit trail (tied to verified identity, non-fatal on failure)
// ---------------------------------------------------------------------------

export async function audit(
  username: string,
  action: string,
  details: string,
  status: "SUCCESS" | "WARNING" | "FAILED" = "SUCCESS",
): Promise<void> {
  if (!username) return;
  try {
    await connectToDatabase();
    await AuditLogModel.create({
      username,
      action,
      details: details.slice(0, 1000),
      status,
    });
  } catch {
    // Audit failures must never break the primary operation.
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function parseCookies(
  cookieHeader: string | undefined,
): Record<string, string> {
  const result: Record<string, string> = {};
  if (!cookieHeader) return result;
  for (const part of cookieHeader.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key) result[key] = decodeURIComponent(value);
  }
  return result;
}

export async function userExists(username: string): Promise<boolean> {
  try {
    await connectToDatabase();
    const found = await UserSettingsModel.findOne({ username }).lean();
    return Boolean(found);
  } catch {
    return false;
  }
}

export async function userHasPassword(username: string): Promise<boolean> {
  try {
    await connectToDatabase();
    const found = await UserSettingsModel.findOne({ username })
      .select("passwordHash")
      .lean();
    return Boolean(
      found &&
      typeof found.passwordHash === "string" &&
      found.passwordHash.length > 0,
    );
  } catch {
    return false;
  }
}

export async function setPassword(
  username: string,
  passwordHash: string,
  email = "",
): Promise<void> {
  await connectToDatabase();
  await UserSettingsModel.findOneAndUpdate(
    { username },
    { $set: { passwordHash, email, updatedAt: new Date() } },
    { new: true, upsert: true },
  );
}

export async function getPasswordHash(username: string): Promise<string> {
  try {
    await connectToDatabase();
    const found = await UserSettingsModel.findOne({ username })
      .select("passwordHash")
      .lean();
    return found && typeof found.passwordHash === "string"
      ? found.passwordHash
      : "";
  } catch {
    return "";
  }
}
