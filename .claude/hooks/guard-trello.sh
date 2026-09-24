#!/usr/bin/env bash
# PreToolUse (trelloWriteCard): force a prompt for every card write except a move.
# Permission rules can't match an MCP tool's parameters, and /card's allowed-tools
# pre-approves the whole tool, so this is what keeps create/update/archive asking.
set -euo pipefail

action=$(jq -r '.tool_input.action // empty')
[[ "$action" == move ]] && exit 0

jq -n --arg action "${action:-unknown}" '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: "ask",
    permissionDecisionReason: "Trello card \($action) needs approval; only moves are pre-approved (guard-trello.sh)."
  }
}'
