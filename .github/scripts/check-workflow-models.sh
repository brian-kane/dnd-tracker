#!/usr/bin/env bash
# Fails when a workflow step runs anthropics/claude-code-action without --model in its
# inputs. Unpinned, the action uses Claude Code's default model, which changes under us.
# Usage: check-workflow-models.sh [workflows-dir]   (default: .github/workflows)
set -euo pipefail

dir=${1:-.github/workflows}
shopt -s nullglob
files=("$dir"/*.yml "$dir"/*.yaml)
((${#files[@]})) || exit 0

# A step is a "- " list item plus every following line indented deeper than its dash.
# The check is textual, so it only needs --model somewhere inside that step.
awk '
  function flush() {
    if (in_step && is_claude && !has_model) {
      printf "%s:%d: claude-code-action step has no --model in claude_args\n", step_file, step_line
      bad++
    }
    in_step = 0
  }
  FNR == 1 { flush() }
  /^[[:space:]]*(#|$)/ { next }
  {
    indent = match($0, /[^ ]/) - 1
    if (in_step && indent <= dash_indent) flush()
    if (!in_step && $0 ~ /^[[:space:]]*- /) {
      in_step = 1; dash_indent = indent; step_file = FILENAME; step_line = FNR
      is_claude = 0; has_model = 0
    }
    if (!in_step) next
    if ($0 ~ /uses:[[:space:]]*["\047]?anthropics\/claude-code-action/) is_claude = 1
    if ($0 ~ /--model([[:space:]=]|$)/) has_model = 1
  }
  END { flush(); exit bad > 0 }
' "${files[@]}"
