#!/usr/bin/env bash
# Stop: run `npm run check` only if the working tree changed since the last passing check.
# On failure, exit 2 so Claude keeps working with the error output; give up after MAX_ATTEMPTS.
set -uo pipefail

MAX_ATTEMPTS=3
cd "$CLAUDE_PROJECT_DIR"
state_dir=.claude/state
mkdir -p "$state_dir"
pass_file="$state_dir/last-pass-hash"
attempts_file="$state_dir/failed-attempts"

# Hash the working tree (tracked + untracked, respecting .gitignore) via a throwaway index,
# so committing doesn't change the hash. Docs and agent config don't need a check.
tmp_index=$(mktemp)
rm -f "$tmp_index"
GIT_INDEX_FILE="$tmp_index" git add -A -- . ':!*.md' ':!.claude' 2>/dev/null
tree_hash=$(GIT_INDEX_FILE="$tmp_index" git write-tree)
rm -f "$tmp_index"

if [[ -f "$pass_file" && "$(cat "$pass_file")" == "$tree_hash" ]]; then
  exit 0
fi

if output=$(npm run check 2>&1); then
  echo "$tree_hash" > "$pass_file"
  rm -f "$attempts_file"
  exit 0
fi

attempts=$(( $(cat "$attempts_file" 2>/dev/null || echo 0) + 1 ))
if (( attempts > MAX_ATTEMPTS )); then
  # Loop guard: let Claude stop, but it must report the failure. Reset for the next turn.
  rm -f "$attempts_file"
  exit 0
fi
echo "$attempts" > "$attempts_file"

{
  echo "npm run check failed (attempt $attempts of $MAX_ATTEMPTS). Fix the cause before finishing."
  echo "If you can't fix it, explain the failure in your summary. Last lines of output:"
  echo "$output" | tail -n 40
} >&2
exit 2
