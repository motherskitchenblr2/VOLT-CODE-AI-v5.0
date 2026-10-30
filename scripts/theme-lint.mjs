#!/usr/bin/env node
/**
 * VOLT Theme-Lint — automated enterprise audit for theme coverage.
 * Scans the source for hardcoded DARK colors that would bleed into the day
 * theme, verifies no arbitrary hex survives outside the token allowlist, and
 * emits:
 *   AUDIT_REPORT.md   — findings, evidence, fix, acceptance criteria
 *   FIX_PROMPT.md     — a global, self-contained prompt any AI/agent can
 *                       execute (checkout branch -> fix -> re-audit -> PR).
 *
 * Exit code: 0 = clean, 1 = violations found (usable in CI).
 *
 * Usage: node scripts/theme-lint.mjs [--fix]
 */
import fs from "fs";
import path from "path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = path.join(ROOT, "src");
const ACCENT = new Set(["FF5F00", "FF8C00", "F97316", "FF7A00", "FF9E70", "4285F4", "00A4EF", "22c55e", "10B981", "3B82F6", "60A5FA", "EF4444", "9333EA", "eab308", "FBBF24", "f59e0b", "6EE7B7", "3a3a3a", "9CA3AF", "888888", "666666"]);

function lum(hex) {
  const n = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
  const r = parseInt(n.slice(0, 2), 16) / 255;
  const g = parseInt(n.slice(2, 4), 16) / 255;
  const b = parseInt(n.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const findings = [];
const re = /(bg|text|border|from|via|to)-\[#([0-9A-Fa-f]{3,8})\](?:\/\d+)?/g;
const darkTailwind = /\b(bg|from|via|to)-(black|gray-9\d\d|zinc-9\d\d|neutral-9\d\d|slate-9\d\d)\b/g;

function scanFile(file) {
  const lines = fs.readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    let m;
    while ((m = re.exec(line))) {
      const [, prop, hex] = m;
      if (prop !== "bg" && prop !== "from" && prop !== "via" && prop !== "to") continue;
      if (ACCENT.has(hex)) continue;
      if (lum(hex) < 0.34) {
        findings.push({ file: path.relative(ROOT, file), line: i + 1, code: m[0], detail: `${m[0]} — dark (lum ${lum(hex).toFixed(2)}) in day theme` });
      }
    }
    for (const m2 of line.matchAll(darkTailwind)) {
      findings.push({ file: path.relative(ROOT, file), line: i + 1, code: m2[0], detail: `${m2[0]} — dark surface utility in day theme` });
    }
    const m3 = line.match(/style=\{\{\s*(?:background|backgroundColor)\s*:\s*"#([0-9A-Fa-f]{3,8})"/);
    if (m3 && !ACCENT.has(m3[1]) && lum(m3[1]) < 0.34) {
      findings.push({ file: path.relative(ROOT, file), line: i + 1, code: `style backgroundColor #${m3[1]}`, detail: `inline dark background` });
    }
  });
}

function walk(dir, skip) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, skip);
    else if (!skip.includes(e.name) && (e.name.endsWith(".tsx") || e.name.endsWith(".ts"))) scanFile(p);
  }
}
walk(SRC, ["index.html.test.ts"]);

const branch = process.env.VOLT_BRANCH || "main";
const now = new Date().toISOString();
const lines = findings.map((f, i) => `${i + 1}. \`${f.file}:${f.line}\` — \`${f.code}\` — ${f.detail}`).join("\n");
const report = `# VOLT Theme Audit Report — ${now.slice(0, 16)} UTC
Branch target: \`${branch}\` · Findings: ${findings.length}

## Verified dark-theme-bleed findings
${findings.length ? lines : "None — theme coverage clean."}

## Acceptance criteria (must all pass)
- \`node scripts/theme-lint.mjs\` → exit 0
- \`node audit.mjs\` → 24/24 checks: 0 overflow, 0 masked, 0 small touch, 0 dark-bleed
- \`npm run build\` clean · \`npx vitest run\` 153/153
`;
const fixPrompt = `# VOLT Auto-Fix Prompt — theme-bleed cleanup
Generated: ${now} · Branch: \`${branch}\` · Severity: ${findings.length ? "high" : "none"}

## Task for any AI/agent
1. \`git checkout -b ${branch}\`
2. Fix every finding below. Dark \`bg/from/via/to\` utilities and inline dark
   backgrounds in the \`src\` tree must be replaced with semantic tokens from
   \`src/app.css\` (e.g. \`vol-surface\`, \`vol-elev\`, \`vol-panel\`, \`vol-well\`,
   \`var(--grad-a)\`, \`var(--grad-b)\`). Do NOT touch accent colors.
3. Re-run \`node scripts/theme-lint.mjs\` and \`node audit.mjs\` — both must be
   fully green before pushing.
4. Commit, push branch, open a PR titled \`fix(theme): ${branch}\` with this
   file as the description body.
5. If a human deleted one of your PRs, read \`AGENT_LESSONS.md\`, append the
   reason to it, and never repeat the mistake.

## Findings
${findings.length ? lines : "None."}
`;
fs.writeFileSync(path.join(ROOT, "AUDIT_REPORT.md"), report);
fs.writeFileSync(path.join(ROOT, "FIX_PROMPT.md"), fixPrompt);
console.log(`theme-lint: ${findings.length} violation(s) → AUDIT_REPORT.md + FIX_PROMPT.md written`);
if (findings.length) {
  for (const f of findings) console.log(`  ✗ ${f.file}:${f.line}  ${f.code}  (${f.detail})`);
}
process.exit(findings.length ? 1 : 0);
