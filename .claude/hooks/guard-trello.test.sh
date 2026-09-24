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

# The hook only runs if settings.json's matcher names the tool, and the connector's
# tool names differ between local (claude_ai_Trello) and cloud (Trello) sessions.
settings="$here/../settings.json"
matcher=$(jq -r '.hooks.PreToolUse[] | select(.hooks[].command | endswith("guard-trello.sh")) | .matcher' "$settings")
for tool in mcp__claude_ai_Trello__trelloWriteCard mcp__Trello__trelloWriteCard; do
  if ! [[ "$tool" =~ ^($matcher)$ ]]; then
    echo "FAIL: guard-trello.sh matcher '$matcher' misses $tool"
    failures=$((failures + 1))
  fi
done
# Every Trello permission rule needs its twin under the other prefix.
while read -r rule; do
  twin=${rule/mcp__claude_ai_Trello__/mcp__Trello__}
  [[ "$twin" == "$rule" ]] && twin=${rule/mcp__Trello__/mcp__claude_ai_Trello__}
  if ! jq -e --arg t "$twin" '[.permissions[][]] | index($t)' "$settings" >/dev/null; then
    echo "FAIL: settings.json has $rule but not $twin"
    failures=$((failures + 1))
  fi
done < <(jq -r '.permissions[][] | select(test("^mcp__(claude_ai_)?Trello__"))' "$settings")

if ((failures)); then
  echo "guard-trello: $failures case(s) failed"
  exit 1
fi
echo "guard-trello: all cases passed"
