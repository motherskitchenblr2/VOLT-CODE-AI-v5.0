# 🔐 Security Policy — VOLT-CODE-AI v5.0

## Purpose

Safeguard VOLT-CODE-AI’s repositories, deployments, and integrations against unauthorized access, data leaks, and malicious activity while enabling secure collaboration.

## Scope

Applies to:

- GitHub repositories (`VOLT-CODE-AI-v5.0`, `ui-ux-pro-max-skill`)
- Vercel deployments and agent landing pages
- Slack API applications
- Connected AI models (DeepSeek, Nemotron, etc.)

## Access Control

- **GitHub**
  - Enforce branch protection rules (main branch locked).
  - Require signed commits.
  - Enable 2FA for all contributors.
- **Vercel / Slack**
  - Use role-based access (least privilege).
  - Rotate API keys every 90 days.
  - Store secrets only in environment variables, never in code.

## Secret Vault (API Keys & Tokens)

- Provider API keys (Groq, OpenRouter, NVIDIA, HuggingFace) and GitHub tokens are
  stored in a **MongoDB secret vault**, encrypted at rest with `ENCRYPTION_KEY`
  using AES-256-GCM (see `shared/secrets.ts`).
- Plaintext secrets are never written to MongoDB and never returned to the client.
- Server-side handlers resolve keys in order: **MongoDB vault → request-provided
  key → environment variable** (see `api/openrouter.ts` and `api/models.ts`).
- `ENCRYPTION_KEY` must be at least 32 bytes and is supplied via environment
  variable only.
- `getSecretStatus` exposes only booleans (which providers have stored keys),
  never key material.
- If `MONGODB_URI` is unset, the vault degrades gracefully to environment-variable
  keys so the app keeps functioning without exposing secrets.

## OAuth Authentication (Google & Microsoft)

Google (Gmail + Google Drive) and Microsoft (OneDrive + Outlook Mail) sign-in
use the OAuth 2.0 Authorization Code flow with PKCE (S256).

- **Endpoints** (consolidated into one Serverless Function to stay within the
  Vercel Hobby limit of 12 functions/deployment): `GET /api/auth?action=start`
  redirects to the provider consent screen; `GET /api/auth?action=callback`
  exchanges the code server-side and persists tokens; `GET /api/auth?action=status`
  reports connection state; `POST /api/auth?action=logout` disconnects.
- **Required environment variables** (Vercel):
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — Google Cloud OAuth 2.0 client.
  - `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET` — Azure App registration.
  - `OAUTH_REDIRECT_BASE` (optional) — overrides the redirect base; defaults to
    the request origin.
- **Redirect URI to register** in Google/Azure:
  `https://volt-code-ai-v5-0-next-gen-ops-projects.vercel.app/api/auth?action=callback`
- **Token storage**: access + refresh tokens are encrypted at rest with
  `ENCRYPTION_KEY` (AES-256-GCM) under `oauth.google` / `oauth.microsoft` in
  the MongoDB vault (see `shared/oauth.ts`). Plaintext tokens are never
  stored and never returned to the client.
- The PKCE verifier + state travel in an HttpOnly `volt_oauth` cookie; the
  state is validated on callback to prevent CSRF.
- `api/cloud.ts` uses the stored tokens (auto-refreshing when expired) to list
  Gmail messages, Drive files, OneDrive files, and Outlook mail with
  read-only scopes.
- If OAuth client credentials or `MONGODB_URI` are missing, the endpoints
  degrade gracefully with clear 4xx/5xx errors and the UI shows "Not configured".

## User Authentication & Data Security

Password login with server-side sessions protects every user data endpoint.
All user-scoped data (sessions, secret vault, audit log, OAuth tokens) is
tied to an authenticated identity — never to a client-supplied username.

### Passwords & Sessions

- **Password hashing**: scrypt with a per-user random 16-byte salt and 64-byte
  derived key (`scrypt$salt$hash` format); comparison uses
  `crypto.timingSafeEqual` (see `shared/security.ts`).
- **Password policy**: 8–128 characters; never stored in plaintext, never
  logged, never returned to the client.
- **Session tokens**: 256-bit random tokens issued on login/register, delivered
  in an `HttpOnly; SameSite=Lax; Secure` `volt_session` cookie (7-day expiry).
  Only the SHA-256 hash of the token is stored in MongoDB — the raw token is
  never persisted.
- **Registration** rate-limited (5/min/IP); **login** rate-limited (10/min/IP)
  with `Retry-After` on 429.
- **Logout** destroys the server session and clears the cookie.

### Authorization

- Every data handler (`/api/database`, `/api/cloud`, `/api/openrouter`,
  `/api/deploy`, `/api/provider-validate`) requires a valid session via
  `requireAuth` and derives the acting username from the session, never from a
  request parameter or body.
- Unauthenticated access returns `401`; a session cookie is validated against
  MongoDB on every request (expired/revoked sessions are rejected).
- `/api/models` remains a public catalog; a valid session upgrades key
  resolution to the user's vault, anonymous callers still get env/client keys.

### Input Sanitization

- `sanitizeUsername`: 3–32 chars, `^[A-Za-z0-9._-]+$`, control characters rejected.
- `sanitizeText`: strips control chars/null bytes, caps length; applied to
  email and free-text inputs.

### Security Headers & CORS

- Applied on every API handler: `X-Content-Type-Options: nosniff`,
  `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, strict
  `Permissions-Policy`, `Cross-Origin-Opener-Policy: same-origin`, and a
  locked-down `Content-Security-Policy`.
- CORS is an explicit allowlist (APP_ORIGIN + localhost); credentials
  (`Access-Control-Allow-Credentials: true`) are only emitted for allowlisted
  origins, preventing credential-bearing cross-origin requests.

### Audit Trail

- Every authentication event (register, login, logout) and sensitive action
  writes to the MongoDB `AuditLog` collection with username, action, details,
  and status (`SUCCESS`/`WARNING`/`FAILED`).
- Audit failures are non-fatal: they never break the primary operation.

### Storage

- Requires `MONGODB_URI` (Vercel env). Users, sessions, the secret vault, and
  audit logs persist in MongoDB. If `MONGODB_URI` is unset, auth-related
  endpoints fail closed with a clear 500 (no data is silently exposed).

## Code Security

- Mandatory code reviews before merging.
- Automated dependency scanning (Dependabot).
- Static analysis tools for vulnerabilities.
- No hardcoded credentials in commits.

## Deployment Security

- Vercel projects must enable HTTPS by default.
- Slack bots scoped to minimal permissions.
- Regular audit of deployed agents and endpoints.

## Data Protection

- Encrypt sensitive data at rest and in transit (AES‑256, TLS 1.2+).
- Logs sanitized before external sharing.

## Incident Response

- Report vulnerabilities via GitHub Security Advisories.
- Critical incidents escalated within 1 hour to project admins.
- Maintain an audit trail of all fixes and patches.

## Compliance

- Follow OWASP Top 10 guidelines.
- Align with GDPR/CCPA for user data handling.
- Quarterly penetration testing.

## Contact

For security concerns, open a GitHub Security Advisory or contact the project admin via Slack.
