#!/usr/bin/env python3
"""
Volt Code AI - Core Monitor
Monitors multiple GitHub accounts/orgs for PR conflicts and security gaps.
Can also check health of Vercel, Supabase, Netlify tokens.
Outputs status JSON and can send alerts via Hermes (simulated via print).
Designed to be run as a cron job.
"""
import os
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from collections import defaultdict

# ----- Configuration -----
# In production, these would come from environment variables or a secure vault.
# For demo, we read from env; you can set them in the cron job environment.
GITHUB_TOKENS = os.getenv("VOLT_GITHUB_TOKENS", "").split(",")  # comma-separated list
VERCEL_TOKEN = os.getenv("VOLT_VERCEL_TOKEN", "")
SUPABASE_TOKEN = os.getenv("VOLT_SUPABASE_TOKEN", "")
NETLIFY_TOKEN = os.getenv("VOLT_NETLIFY_TOKEN", "")

# Optional: list of specific organizations/users to scan per token? We'll scan all accessible repos for each token.
# Output file for status (could be served via GitHub Pages)
STATUS_FILE = Path("volt_status.json")
# Alert threshold: only alert if new issues found since last run? We'll just always output status.

def run_gh_api(token, endpoint, params=None):
    """Make a GitHub API call using gh CLI with token."""
    env = os.environ.copy()
    env["GH_TOKEN"] = token
    cmd = ["gh", "api", "-H", f"Authorization: Bearer {token}"]
    if endpoint.startswith("/"):
        cmd.append(endpoint)
    else:
        cmd.append(f"/{endpoint}")
    if params:
        # For simplicity, we assume params is a dict for query string; gh api doesn't directly support query?
        # We'll append as query string manually for GET; but gh api can take -f for fields.
        # We'll keep it simple: no complex params for now.
        pass
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, env=env, timeout=30)
        if result.returncode != 0:
            return {"error": result.stderr.strip()}
        if result.stdout.strip() == "":
            return {}
        return json.loads(result.stdout)
    except json.JSONDecodeError:
        return {"error": "Invalid JSON", "stdout": result.stdout[:200]}
    except Exception as e:
        return {"error": str(e)}

def scan_github_conflicts(token, account_label):
    """Scan all repos for a given GitHub token for PR conflicts."""
    # Step 1: Get all repos for the authenticated user/orgs
    repos_data = run_gh_api(token, "/user/repos?per_page=100&type=owner&sort=full_name")
    if "error" in repos_data:
        # Try orgs? We'll just return error.
        return {"account": account_label, "error": f"Failed to list repos: {repos_data['error']}"}
    repos = repos_data if isinstance(repos_data, list) else []
    # If we got a dict with message, maybe we hit rate limit or need orgs.
    if isinstance(repos, dict) and repos.get("message"):
        return {"account": account_label, "error": f"GitHub API: {repos.get('message')}"}

    all_prs = []
    conflicts = []
    unstable = []
    unknown = []
    clean = 0
    scanned_repos = 0

    for repo in repos:
        if not isinstance(repo, dict):
            continue
        full_name = repo.get("full_name")
        if not full_name:
            continue
        scanned_repos += 1
        # Get open PRs for this repo
        prs_data = run_gh_api(token, f"/repos/{full_name}/pulls?state=open&per_page=100")
        if "error" in prs_data:
            # Skip this repo on error
            continue
        prs = prs_data if isinstance(prs_data, list) else []
        for pr in prs:
            if not isinstance(pr, dict):
                continue
            pr_number = pr.get("number")
            state = pr.get("mergeable_state") or "unknown"
            mergeable = pr.get("mergeable")
            # Classify
            if mergeable is False or state in ("dirty", "blocked"):
                conflicts.append({
                    "repo": full_name,
                    "pr": pr_number,
                    "state": state,
                    "title": pr.get("title", ""),
                    "url": pr.get("html_url", ""),
                    "head": pr.get("head", {}).get("ref", ""),
                    "base": pr.get("base", {}).get("ref", ""),
                })
            elif state == "unstable":
                unstable.append({
                    "repo": full_name,
                    "pr": pr_number,
                    "state": state,
                    "title": pr.get("title", ""),
                    "url": pr.get("html_url", ""),
                })
            elif state == "unknown":
                unknown.append({
                    "repo": full_name,
                    "pr": pr_number,
                    "state": state,
                    "title": pr.get("title", ""),
                    "url": pr.get("html_url", ""),
                })
            else:
                clean += 1
            all_prs.append(pr_number)

    return {
        "account": account_label,
        "scanned_repos": scanned_repos,
        "total_open_prs": len(all_prs),
        "conflicts": conflicts,
        "unstable": unstable,
        "unknown": unknown,
        "clean_prs": clean,
    }

def check_github_security(token, account_label):
    """Check if security features are enabled for each repo; return list of repos missing key features."""
    repos_data = run_gh_api(token, "/user/repos?per_page=100&type=owner&sort=full_name")
    if "error" in repos_data:
        return {"account": account_label, "error": f"Failed to list repos: {repos_data['error']}"}
    repos = repos_data if isinstance(repos_data, list) else []
    if isinstance(repos, dict) and repos.get("message"):
        return {"account": account_label, "error": f"GitHub API: {repos.get('message')}"}
    
    missing = []
    for repo in repos:
        if not isinstance(repo, dict):
            continue
        full_name = repo.get("full_name")
        repo_data = run_gh_api(token, f"/repos/{full_name}")
        if "error" in repo_data:
            continue
        security = repo_data.get("security_and_analysis", {})
        # We care about: dependabot_security_updates, secret_scanning, secret_scanning_push_protection
        required = ["dependabot_security_updates", "secret_scanning", "secret_scanning_push_protection"]
        missing_features = []
        for feat in required:
            feat_status = security.get(feat, {})
            if isinstance(feat_status, dict):
                status = feat_status.get("status")
            else:
                status = feat_status  # sometimes it's a string directly
            if status != "enabled":
                missing_features.append(feat)
        if missing_features:
            missing.append({
                "repo": full_name,
                "missing": missing_features,
                "url": repo_data.get("html_url", "")
            })
    return {"account": account_label, "missing_security": missing}

def check_vercel_token(token):
    """Check Vercel token by listing teams or user."""
    if not token:
        return {"error": "No token provided"}
    # Vercel API: https://api.vercel.com/v2/user
    import urllib.request
    try:
        req = urllib.request.Request(
            "https://api.vercel.com/v2/user",
            headers={"Authorization": f"Bearer {token}"}
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
            return {"status": "ok", "user": data.get("user", {}).get("username", "unknown")}
    except Exception as e:
        return {"error": str(e)}

def check_supabase_token(token):
    """Check Supabase token by listing projects."""
    if not token:
        return {"error": "No token provided"}
    import urllib.request
    try:
        req = urllib.request.Request(
            "https://api.supabase.com/v1/projects",
            headers={"Authorization": f"Bearer {token}", "apikey": token}
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
            return {"status": "ok", "projects": len(data) if isinstance(data, list) else 0}
    except Exception as e:
        return {"error": str(e)}

def check_netlify_token(token):
    """Check Netlify token by listing sites."""
    if not token:
        return {"error": "No token provided"}
    import urllib.request
    try:
        req = urllib.request.Request(
            "https://api.netlify.com/api/v1/sites",
            headers={"Authorization": f"Bearer {token}"}
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
            return {"status": "ok", "sites": len(data) if isinstance(data, list) else 0}
    except Exception as e:
        return {"error": str(e)}

def main():
    print("Volt Code AI Monitor starting...")
    status = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "github_accounts": [],
        "vercel": {},
        "supabase": {},
        "netlify": {},
        "summary": {
            "total_conflicts": 0,
            "total_unstable": 0,
            "total_unknown": 0,
            "total_clean": 0,
            "total_missing_security": 0,
        }
    }

    # Process each GitHub token
    if not GITHUB_TOKENS or GITHUB_TOKENS == ['']:
        status["github_accounts"].append({"error": "No GitHub tokens provided in VOLT_GITHUB_TOKENS"})
    else:
        for idx, token in enumerate(GITHUB_TOKENS):
            token = token.strip()
            if not token:
                continue
            # Label: we could try to get the login name, but for simplicity use index
            account_label = f"github_account_{idx+1}"
            # Conflicts scan
            conflict_result = scan_github_conflicts(token, account_label)
            # Security check
            security_result = check_github_security(token, account_label)
            # Combine
            account_status = {
                "account": account_label,
                "conflicts_scan": conflict_result,
                "security_check": security_result
            }
            status["github_accounts"].append(account_status)
            # Update summary
            if "conflicts" in conflict_result:
                status["summary"]["total_conflicts"] += len(conflict_result["conflicts"])
            if "unstable" in conflict_result:
                status["summary"]["total_unstable"] += len(conflict_result["unstable"])
            if "unknown" in conflict_result:
                status["summary"]["total_unknown"] += len(conflict_result["unknown"])
            if "clean_prs" in conflict_result:
                status["summary"]["total_clean"] += conflict_result["clean_prs"]
            if "missing_security" in security_result:
                status["summary"]["total_missing_security"] += len(security_result["missing_security"])

    # Check other platforms
    status["vercel"] = check_vercel_token(VERCEL_TOKEN)
    status["supabase"] = check_supabase_token(SUPABASE_TOKEN)
    status["netlify"] = check_netlify_token(NETLIFY_TOKEN)

    # Write status file
    STATUS_FILE.write_text(json.dumps(status, indent=2))
    print(f"Status written to {STATUS_FILE}")
    # Optionally, print a summary to stdout (which cron can capture)
    print(f"Summary: {status['summary']['total_conflicts']} conflicts, {status['summary']['total_unstable']} unstable, {status['summary']['total_missing_security']} missing security features")
    # If we wanted to send a Telegram alert, we could trigger hermes send_message here if there are new issues.
    # For now, we just output.

if __name__ == "__main__":
    main()