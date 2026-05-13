#!/usr/bin/env bash
# Save all tracked/untracked changes (respecting .gitignore), commit, and push to origin.
# Usage:
#   ./scripts/git-save-push.sh              # default message: chore: sync <UTC ISO time>
#   ./scripts/git-save-push.sh "feat: …"   # custom message
#   npm run git:push -- "feat: …"

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  echo "error: not a git repository: $ROOT" >&2
  exit 1
fi

if ! git remote get-url origin >/dev/null 2>&1; then
  echo "error: no remote named 'origin' configured" >&2
  exit 1
fi

current_branch="$(git branch --show-current)"
if [[ -z "$current_branch" ]]; then
  echo "error: detached HEAD; checkout a branch first" >&2
  exit 1
fi

has_changes() {
  ! git diff --quiet || ! git diff --cached --quiet || [[ -n "$(git ls-files --others --exclude-standard)" ]]
}

if [[ $# -eq 0 ]]; then
  MSG="chore: sync $(date -u +%Y-%m-%dT%H:%MZ)"
else
  MSG="$1"
fi

if has_changes; then
  git add -A
  git commit -m "$MSG"
else
  echo "No local changes to commit."
fi

git push -u origin "$current_branch"
