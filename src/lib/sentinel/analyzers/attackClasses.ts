/**
 * Cloudflare security-audit attack-class rules for the Sentinel agent.
 *
 * Derived from the Cloudflare `security-audit` skill's attack-class taxonomy
 * (MIT License, Copyright (c) 2025-2026 Cloudflare, Inc.):
 *   https://github.com/cloudflare/security-audit-skill
 *
 * The upstream skill hunts these classes with reasoning agents; this module
 * ports the high-signal, statically-checkable subset into the Sentinel's regex
 * pipeline so the same classes surface while you edit. Each rule_id is prefixed
 * by the upstream attack class:
 *   cf-supply-  supply chain and release
 *   cf-auth-    HTTP protocol and authentication
 *   cf-client-  client-side and browser
 *   cf-cloud-   cloud and deployment
 *   cf-deser-   unsafe deserialization (AI/LLM + general)
 *   cf-resource- resource and file handling
 *   cf-obvious- obvious exposures
 *
 * ponytail: these are heuristics, not a verifier — they raise leads for a human
 * to trace. No auto-fix (fixed === original); a real fix needs the full path.
 */
import { runRules, type RuleDef, type ScanFinding } from "./index";

const ATTACK_CLASS_RULES: RuleDef[] = [
  // ── Supply chain and release ────────────────────────────────────────────
  {
    rule: "cf-supply-curl-pipe-shell",
    severity: "HIGH",
    confidence: 0.9,
    re: /\b(?:curl|wget)\b[^\n|]*\|\s*(?:sudo\s+)?(?:ba|z)?sh\b/g,
    message:
      "Remote script piped straight into a shell (curl|bash). Fetch, verify a checksum/signature, then execute.",
    fixed: "",
  },
  {
    rule: "cf-supply-unpinned-action",
    severity: "MEDIUM",
    confidence: 0.7,
    re: /^\s*(?:-\s*)?uses:\s*[\w.-]+\/[\w.-]+@(?!\b[0-9a-f]{40}\b)[\w.-]+/gm,
    message:
      "CI action pinned to a mutable tag/branch. A compromised maintainer can repoint it; pin the full commit SHA.",
    fixed: "",
  },

  // ── HTTP protocol and authentication ────────────────────────────────────
  {
    rule: "cf-auth-jwt-alg-none",
    severity: "CRITICAL",
    confidence: 0.9,
    re: /algorithms?\s*[:=]\s*\[[^\]]*["']none["']/g,
    message:
      "JWT accepting the 'none' algorithm — signature verification can be bypassed. Pin a single expected algorithm.",
    fixed: "",
  },
  {
    rule: "cf-auth-tls-verify-disabled",
    severity: "HIGH",
    confidence: 0.9,
    re: /(?:rejectUnauthorized\s*:\s*false|NODE_TLS_REJECT_UNAUTHORIZED\s*=\s*["']?0["']?)/g,
    message:
      "TLS certificate verification disabled — a network attacker can read or alter traffic. Remove the override.",
    fixed: "",
  },
  {
    rule: "cf-auth-cors-wildcard-credentials",
    severity: "HIGH",
    confidence: 0.8,
    re: /(?:origin\s*:\s*["']\*["'][\s\S]{0,120}?credentials\s*:\s*true|credentials\s*:\s*true[\s\S]{0,120}?origin\s*:\s*["']\*["'])/g,
    message:
      "CORS wildcard origin combined with credentials — browsers reject it, but a reflected origin here leaks authenticated data. Allowlist exact origins.",
    fixed: "",
  },
  {
    rule: "cf-auth-open-redirect",
    severity: "HIGH",
    confidence: 0.8,
    re: /(?:res|response)\.redirect\(\s*(?:req|request)\.(?:query|params|body)/g,
    message:
      "Redirect target taken directly from request input (open redirect). Allowlist destinations or use an index.",
    fixed: "",
  },
  {
    rule: "cf-auth-cookie-secure-false",
    severity: "MEDIUM",
    confidence: 0.6,
    re: /\bcookie\s*\([^)\n]{0,120}?secure\s*:\s*false/g,
    message:
      "Cookie explicitly set with secure: false — it can cross plaintext transport. Enable Secure (and HttpOnly/SameSite).",
    fixed: "",
  },

  // ── Client-side and browser ─────────────────────────────────────────────
  {
    rule: "cf-client-dangerous-html",
    severity: "HIGH",
    confidence: 0.8,
    re: /dangerouslySetInnerHTML/g,
    message:
      "dangerouslySetInnerHTML renders untrusted HTML as-is (DOM XSS). Sanitize with DOMPurify or render text.",
    fixed: "",
  },
  {
    rule: "cf-client-innerhtml-assign",
    severity: "HIGH",
    confidence: 0.8,
    re: /\.innerHTML\s*=/g,
    message:
      "Assignment to innerHTML with dynamic data is DOM XSS. Use textContent or a sanitizer.",
    fixed: "",
  },
  {
    rule: "cf-client-document-write",
    severity: "MEDIUM",
    confidence: 0.7,
    re: /document\.write\s*\(/g,
    message:
      "document.write() injects markup into the live document. Prefer DOM APIs or a templating layer.",
    fixed: "",
  },
  {
    rule: "cf-client-postmessage-wildcard",
    severity: "MEDIUM",
    confidence: 0.7,
    re: /\.postMessage\([^,\n]*,\s*["']\*["']\s*\)/g,
    message:
      "postMessage with targetOrigin '*' delivers the payload to any window. Pass the exact receiving origin.",
    fixed: "",
  },
  {
    rule: "cf-client-prototype-pollution",
    severity: "HIGH",
    confidence: 0.75,
    re: /(?:\[["']__proto__["']\]\s*=|\b__proto__\s*[:=]|\bconstructor\.prototype\b)/g,
    message:
      "Prototype manipulation (__proto__ / constructor.prototype) enables prototype pollution. Build objects with Object.create(null) and validate keys.",
    fixed: "",
  },

  // ── Cloud and deployment ────────────────────────────────────────────────
  {
    rule: "cf-cloud-iam-wildcard-action",
    severity: "HIGH",
    confidence: 0.8,
    re: /["']Action["']\s*:\s*(?:\[\s*)?["']\*["']/g,
    message:
      "IAM policy grants Action '*' (all operations). Scope to the exact actions the principal needs.",
    fixed: "",
  },
  {
    rule: "cf-cloud-iam-wildcard-principal",
    severity: "HIGH",
    confidence: 0.85,
    re: /["']Principal["']\s*:\s*(?:\[\s*)?["']\*["']/g,
    message:
      "Resource policy allows Principal '*' (anyone). Restrict to specific accounts/roles.",
    fixed: "",
  },
  {
    rule: "cf-cloud-public-acl",
    severity: "HIGH",
    confidence: 0.8,
    re: /\bacl\s*[:=]\s*["']public-read(?:-write)?["']/g,
    message:
      "Object storage ACL set to public — anyone can read/write. Keep buckets private and serve via signed URLs.",
    fixed: "",
  },
  {
    rule: "cf-cloud-open-ingress",
    severity: "MEDIUM",
    confidence: 0.55,
    re: /0\.0\.0\.0\/0/g,
    message:
      "Ingress open to 0.0.0.0/0 (the whole internet). Narrow the CIDR or place it behind an authenticated proxy.",
    fixed: "",
  },
  {
    rule: "cf-cloud-privileged-container",
    severity: "HIGH",
    confidence: 0.8,
    re: /privileged\s*[:=]\s*true/g,
    message:
      "Container runs privileged (host-level access). Drop privileged and grant only the specific capabilities needed.",
    fixed: "",
  },

  // ── Unsafe deserialization ──────────────────────────────────────────────
  {
    rule: "cf-deser-yaml-load",
    severity: "MEDIUM",
    confidence: 0.6,
    re: /\byaml\.load\s*\(/g,
    message:
      "yaml.load can construct arbitrary objects from untrusted YAML. Use safeLoad / a SafeLoader-only schema.",
    fixed: "",
  },
  {
    rule: "cf-deser-pickle-load",
    severity: "HIGH",
    confidence: 0.85,
    re: /\bpickle\.loads?\s*\(/g,
    message:
      "pickle deserializes arbitrary Python objects — untrusted input means remote code execution. Use a safe format (JSON).",
    fixed: "",
  },
  {
    rule: "cf-deser-php-unserialize",
    severity: "HIGH",
    confidence: 0.8,
    re: /\bunserialize\s*\(/g,
    message:
      "PHP unserialize on untrusted input enables object injection. Use json_decode with allowed classes.",
    fixed: "",
  },

  // ── Resource and file handling ──────────────────────────────────────────
  {
    rule: "cf-resource-path-traversal",
    severity: "HIGH",
    confidence: 0.75,
    re: /\b(?:readFile|readFileSync|writeFile|writeFileSync|unlink|unlinkSync|createReadStream|sendFile)\s*\([^)\n]{0,80}\b(?:req|request)\.(?:query|params|body)/g,
    message:
      "File path built from request input (path traversal). Resolve against a fixed root and reject '..'.",
    fixed: "",
  },

  // ── Obvious exposures ───────────────────────────────────────────────────
  {
    rule: "cf-obvious-debug-endpoint",
    severity: "MEDIUM",
    confidence: 0.6,
    re: /\b(?:app|router|server)\.(?:get|post|put|delete|all)\s*\(\s*["']\/(?:debug|env|config|internal|test)["']/g,
    message:
      "Route exposing /debug, /env, /config, /internal or /test — often left unauthenticated. Remove it in production or gate it.",
    fixed: "",
  },
  {
    rule: "cf-obvious-security-todo",
    severity: "LOW",
    confidence: 0.5,
    re: /\b(?:TODO|FIXME|HACK|XXX)\b[^\n]{0,80}\b(?:auth|validat|xss|csrf|permission|secret|inject|sanitiz)/gi,
    message:
      "A TODO/FIXME/HACK names a security control (auth, validation, CSRF, sanitization). Resolve it before shipping.",
    fixed: "",
  },
  {
    rule: "cf-obvious-child-process",
    severity: "HIGH",
    confidence: 0.7,
    re: /(?:require\s*\(|from\s+)["'](?:node:)?child_process["']/g,
    message:
      "child_process import in app code is a command-injection surface. If it must exist, keep it in a script with strict input validation.",
    fixed: "",
  },
  {
    rule: "cf-obvious-weak-random-secret",
    severity: "MEDIUM",
    confidence: 0.6,
    re: /(?:Math\.random\s*\(\s*\)[^\n]{0,60}\b(?:token|secret|nonce|password|api_?key|sessionId)|\b(?:token|secret|nonce|password|api_?key|sessionId)[^\n]{0,60}Math\.random\s*\(\s*\))/gi,
    message:
      "Math.random() near a token/secret/nonce value — it is not cryptographically random. Use crypto.randomUUID / crypto.getRandomValues.",
    fixed: "",
  },
];

export function attackClasses(code: string): ScanFinding[] {
  return runRules(code, ATTACK_CLASS_RULES);
}

export default attackClasses;
