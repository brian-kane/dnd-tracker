#!/usr/bin/env bash
# PostToolUse (Edit/Write): format only the file that was just changed.
set -euo pipefail

file=$(jq -r '.tool_input.file_path // empty')
[[ -z "$file" || ! -f "$file" ]] && exit 0

# Only format files inside the project; --ignore-unknown skips types Prettier can't parse.
case "$file" in
  "$CLAUDE_PROJECT_DIR"/*) ;;
  *) exit 0 ;;
esac

cd "$CLAUDE_PROJECT_DIR"
./node_modules/.bin/prettier --write --ignore-unknown --log-level warn "$file" >&2 || true
