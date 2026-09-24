#!/usr/bin/env bash
# Runs check-workflow-models.sh against sample workflows and checks which ones pass.
set -uo pipefail

here=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
failures=0

expect() {
  local want=$1 name=$2 workflow=$3 got
  rm -f "$tmp"/*.yml
  printf '%s\n' "$workflow" >"$tmp/w.yml"
  if "$here/check-workflow-models.sh" "$tmp" >/dev/null; then got=pass; else got=fail; fi
  if [[ "$got" != "$want" ]]; then
    echo "FAIL: expected $want, got $got: $name"
    failures=$((failures + 1))
  fi
}

expect pass "no claude step" '
jobs:
  check:
    steps:
      - uses: actions/checkout@v7
      - run: npm run check'

expect pass "pinned in claude_args block" '
jobs:
  review:
    steps:
      - uses: actions/checkout@v7
      - name: Review
        uses: anthropics/claude-code-action@v1
        with:
          prompt: /review
          claude_args: |
            --max-turns 5
            --model claude-sonnet-5'

expect pass "pinned inline with =" '
jobs:
  review:
    steps:
      - uses: "anthropics/claude-code-action@v1"
        with:
          claude_args: "--model=claude-sonnet-5"'

expect fail "not pinned" '
jobs:
  review:
    steps:
      - uses: anthropics/claude-code-action@v1
        with:
          claude_args: --max-turns 5'

expect fail "pin only in a comment" '
jobs:
  review:
    steps:
      - uses: anthropics/claude-code-action@v1
        # claude_args: --model claude-sonnet-5
        with:
          prompt: /review'

expect fail "pin belongs to the next step" '
jobs:
  review:
    steps:
      - uses: anthropics/claude-code-action@v1
      - run: echo --model claude-sonnet-5'

expect fail "pin belongs to another job" '
jobs:
  review:
    steps:
      - uses: anthropics/claude-code-action@v1
  other:
    env:
      ARGS: --model claude-sonnet-5'

expect pass "nested list inside a pinned step" '
jobs:
  review:
    steps:
      - uses: anthropics/claude-code-action@v1
        with:
          prompt: |
            - review the diff
          claude_args: --model claude-sonnet-5'

if ((failures)); then
  echo "check-workflow-models: $failures case(s) failed"
  exit 1
fi
echo "check-workflow-models: all cases passed"
