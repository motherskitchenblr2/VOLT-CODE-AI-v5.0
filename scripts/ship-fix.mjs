#!/usr/bin/env node
/**
 * VOLT Ship-Fix — the agent loop for GitHub:
 *   node scripts/ship-fix.mjs "fix/theme-bleed" "fix(theme): title" [body-file.md]
 *     → creates branch, commits working tree, pushes, opens a PR.
 *   node scripts/ship-fix.mjs --learn "why a PR was deleted"
 *     → appends the reason to AGENT_LESSONS.md, commits, pushes to main.
 *
 * Requires GITHUB_TOKEN env (PAT with repo scope) and git remote origin.
 */
import { execSync } from "child_process";
import fs from "fs";

const [, , arg1, arg2, arg3] = process.argv;
const token = process.env.GITHUB_TOKEN;
const repo = "motherskitchenblr2/VOLT-CODE-AI-v5.0";
const api = "https://api.github.com";

function sh(c) {
  return execSync(c, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}
const branch = sh("git rev-parse --abbrev-ref HEAD");
const origin = sh("git config --get remote.origin.url").replace(
  /https?:\/\/[^@]*@/,
  "https://",
);

if (arg1 === "--learn") {
  const reason = arg2 || "no reason given";
  const log = `\n## ${new Date().toISOString().slice(0, 16)} UTC — PR rejected\n${reason}\n`;
  fs.appendFileSync("AGENT_LESSONS.md", log);
  sh(
    `git add AGENT_LESSONS.md && git commit -m "learn: record rejected-PR lesson"`,
  );
  sh(`git push "${origin}" HEAD:main`);
  console.log("Lesson recorded & pushed to main.");
  process.exit(0);
}

if (!arg1 || !arg2) {
  console.error(
    "usage: ship-fix.mjs <branch> <title> [body-file] | --learn <reason>",
  );
  process.exit(1);
}
if (!token) {
  console.error("GITHUB_TOKEN env missing.");
  process.exit(1);
}

const title = arg2;
const body =
  arg3 && fs.existsSync(arg3)
    ? fs.readFileSync(arg3, "utf8")
    : "Auto-generated fix PR — see AUDIT_REPORT.md / FIX_PROMPT.md.";
if (branch === arg1) {
  console.log("already on branch", arg1);
} else {
  sh(`git checkout -b ${arg1}`);
}
sh(`git add -A`);
try {
  sh(`git commit -m "${title}"`);
} catch {
  console.log("nothing to commit");
}
sh(`git push -u "${origin}" ${arg1}`);
const pr = await fetch(`${api}/repos/${repo}/pulls`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/vnd.github+json",
    "User-Agent": "volt-ship-fix",
  },
  body: JSON.stringify({ title, head: arg1, base: "main", body }),
}).then((r) => r.json());
console.log(`PR → ${pr.html_url || JSON.stringify(pr)}`);
