#!/usr/bin/env node
/**
 * VOLT Security Sweep — workflow-injection audit across repos.
 *
 *   GITHUB_TOKEN=... node scripts/security-sweep.mjs --owner motherskitchenblr2
 *   GITHUB_TOKEN=... node scripts/security-sweep.mjs --repo motherskitchenblr2/VOLT-CODE-AI-v5.0
 *
 * Reads only (contents API), scans every .github/workflows/*.yml with the same
 * rules the Repo Ops cockpit uses (src/lib/injectionScan.ts), then writes:
 *   docs/security-sweep/findings.json
 *   docs/security-sweep/REPORT.md
 * Exit code 1 when any critical finding exists (CI-usable).
 */
import fs from "node:fs";
import path from "node:path";
import { scanWorkflow, summarize } from "../src/lib/injectionScan.ts";

const args = process.argv.slice(2);
const argOf = (name, fallback = "") => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const token = process.env.GITHUB_TOKEN || "";
const owner = argOf("owner", "");
const repoArg = argOf("repo", "");
const limit = Number(argOf("limit", "25"));
const outDir = path.resolve(import.meta.dirname, "..", "docs", "security-sweep");

if (!token) {
  console.error(
    "Missing GITHUB_TOKEN. Create a fine-grained PAT with read access to Actions/Contents (repo read is enough).",
  );
  process.exit(2);
}
if (!owner && !repoArg.includes("/")) {
  console.error("Usage: --owner <login> | --repo <owner/name> [--limit 25]");
  process.exit(2);
}

const API = "https://api.github.com";
const headers = {
  Authorization: `Bearer ${token}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
};

async function gh(pathname) {
  const res = await fetch(`${API}${pathname}`, { headers });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`GitHub ${res.status} on ${pathname}: ${(await res.text()).slice(0, 200)}`);
  }
  return res.json();
}

async function listRepos(login) {
  const org = await gh(`/orgs/${login}/repos?per_page=${limit}&sort=updated`);
  if (org) return org;
  return (await gh(`/users/${login}/repos?per_page=${limit}&sort=updated`)) || [];
}

async function workflowsOf(fullName, ref) {
  const listing = await gh(`/repos/${fullName}/contents/.github/workflows?ref=${ref}`);
  if (!Array.isArray(listing)) return [];
  const files = listing.filter((e) => e.type === "file" && /\.ya?ml$/.test(e.name));
  const out = [];
  for (const file of files) {
    const data = await gh(`/repos/${fullName}/contents/${file.path}?ref=${ref}`);
    if (data?.content) {
      out.push({ path: file.path, content: Buffer.from(data.content, "base64").toString("utf8") });
    }
  }
  return out;
}

const targets = repoArg.includes("/")
  ? [{ full_name: repoArg, default_branch: null }]
  : await listRepos(owner);

const results = [];
for (const repo of targets) {
  const [login, name] = repo.full_name.split("/");
  const ref = repo.default_branch || (await gh(`/repos/${login}/${name}`))?.default_branch || "main";
  let workflows = [];
  try {
    workflows = await workflowsOf(repo.full_name, ref);
  } catch (error) {
    results.push({
      repo: repo.full_name,
      ref,
      workflows: 0,
      findings: [],
      error: error.message,
    });
    continue;
  }
  const findings = workflows.flatMap((w) => scanWorkflow(`${repo.full_name}/${w.path}`, w.content));
  results.push({ repo: repo.full_name, ref, workflows: workflows.length, findings });
  const s = summarize(findings);
  console.log(
    `${repo.full_name} (${ref}): ${workflows.length} workflow(s) → ${s.critical} critical, ${s.high} high, ${s.medium} medium [${s.verdict}]`,
  );
}

const findings = results.flatMap((r) => r.findings);
const totals = summarize(findings);

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "findings.json"), JSON.stringify(findings, null, 2));

const lines = [
  "# Workflow Security Sweep",
  "",
  `Generated: ${new Date().toISOString()}`,
  `Repos: ${results.length} · Workflows: ${results.reduce((n, r) => n + r.workflows, 0)}`,
  `Findings: ${totals.total} (${totals.critical} critical, ${totals.high} high, ${totals.medium} medium, ${totals.low} low)`,
  "",
  totals.critical > 0 ? "**Verdict: FAIL — critical findings need a fix.**" : "**Verdict: no critical finding.**",
  "",
  "## Per repo",
  "",
  "| Repo | Ref | Workflows | Findings | Verdict |",
  "| --- | --- | --- | --- | --- |",
  ...results.map(
    (r) => `| ${r.repo} | ${r.ref} | ${r.workflows} | ${r.findings.length} | ${summarize(r.findings).verdict} |`,
  ),
  "",
  "## Findings",
  "",
  findings.length === 0
    ? "No workflow injection pattern found."
    : "| Severity | Rule | Location | What to do |",
  ...(findings.length === 0 ? [] : ["| --- | --- | --- | --- |"]),
  ...findings.map(
    (f) => `| ${f.severity} | ${f.rule} | \`${f.file}${f.line ? `:${f.line}` : ""}\` | ${f.message} |`,
  ),
  "",
  "## Limits (read this)",
  "",
  "- Static rules only: pwn-request checkout, untrusted `${{ }}` in `run:`, unpinned actions, `write-all`,",
  "  `curl | sh`, secret echo. It is not a full SAST and cannot prove safety.",
  "- Repositories are read through the GitHub API; nothing is written to the repos.",
  "- `docs/security-sweep/findings.json` is the machine-readable output.",
  "",
];
fs.writeFileSync(path.join(outDir, "REPORT.md"), lines.join("\n"));

console.log(`\nWrote ${path.relative(process.cwd(), outDir)}/findings.json + REPORT.md`);
process.exit(totals.critical > 0 ? 1 : 0);
