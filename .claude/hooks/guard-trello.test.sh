#!/usr/bin/env bash
# Runs guard-trello.sh against each trelloWriteCard action and checks which ones ask.
set -uo pipefail

here=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
failures=0

expect() {
  local want=$1 input=$2 out got
  if ! out=$("$here/guard-trello.sh" <<<"$input" 2>/dev/null); then
    got=error
  elif [[ -z "$out" ]]; then
    got=defer
  else
    got=$(jq -r '.hookSpecificOutput.permissionDecision' <<<"$out")
  fi
  if [[ "$got" != "$want" ]]; then
    echo "FAIL: expected $want, got $got: $input"
    failures=$((failures + 1))
  fi
}

card() {
  jq -nc --arg action "$1" '{tool_name: "mcp__claude_ai_Trello__trelloWriteCard", tool_input: {action: $action}}'
}

expect defer "$(card move)"
for action in create update archive mark_done attach_label detach_label add_comment; do
  expect ask "$(card "$action")"
done
expect ask '{"tool_name": "mcp__claude_ai_Trello__trelloWriteCard", "tool_input": {}}'

if ((failures)); then
  echo "guard-trello: $failures case(s) failed"
  exit 1
fi
echo "guard-trello: all cases passed"
