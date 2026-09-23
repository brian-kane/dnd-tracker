#!/usr/bin/env bash
# Runs guard-bash.sh against a table of commands and checks each is allowed or blocked.
# The hook only inspects text, so nothing in this table is ever executed.
#
# Known limitations (text-pattern guard, not a shell parser):
# - Quoted strings are blanked for the force-push check, so a quoted flag or refspec
#   (git push origin "+main") is not caught.
# - The rm/.git checks keep quotes, so a quoted && or ; can mis-split a command. That errs
#   towards blocking: echo "a; rm -rf /" is blocked.
set -uo pipefail

here=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
project=$(cd "$here/../.." && pwd)
failures=0

expect() {
  local want=$1 cmd=$2 got
  jq -n --arg cmd "$cmd" --arg cwd "$project" '{tool_input: {command: $cmd}, cwd: $cwd}' \
    | CLAUDE_PROJECT_DIR="$project" "$here/guard-bash.sh" 2>/dev/null
  case $? in
    0) got=allow ;;
    2) got=block ;;
    *) got=error ;;
  esac
  if [[ "$got" != "$want" ]]; then
    echo "FAIL: expected $want, got $got: $cmd"
    failures=$((failures + 1))
  fi
}

# Force-push
expect block 'git push -f'
expect block 'git push --force origin main'
expect block 'git push --force-with-lease'
expect block 'git push --force-with-lease=main:abc123'
expect block 'git push -uf origin main'
expect block 'git push origin main -f'
expect block 'git push origin +main'
expect block 'git -C . push --force'
expect block 'git push -f && echo done'
expect block 'git add . && git push -f'
expect allow 'git push'
expect allow 'git push -u origin HEAD'
expect allow 'git push origin main'

# Flags on other commands in the same line belong to those commands
expect allow 'git push -u origin HEAD && gh api -X PATCH repos/o/r/pulls/1 -f body=x'
expect allow 'gh api -f title=x repos/o/r && git push'
expect allow 'git push && rm -f build.log'

# Quoted text is not a command
expect allow 'git commit -m "fix: don'\''t git push -f"'
expect allow 'git commit -m "notes; git push -f later"'
expect allow "git commit -m 'git push --force is blocked' && git push"

# rm -rf must stay inside the project
expect allow 'rm -rf dist'
expect allow 'rm -rf ./node_modules/.cache'
expect allow 'rm -f /tmp/file.txt'
expect block 'rm -rf /'
expect block 'rm -rf /tmp/elsewhere'
expect block 'rm -rf ~'
expect block 'rm -rf $HOME/x'
expect block 'rm -r --force ..'
expect block 'sudo rm -rf /var/log'
expect block 'echo "a; rm -rf /"'

# Deleting .git
expect block 'rm -rf .git'
expect block 'rm .git/index'
expect block 'find . -name .git -delete'
expect allow 'git commit -m "rm the old .git hooks"'

if ((failures)); then
  echo "guard-bash: $failures case(s) failed"
  exit 1
fi
echo "guard-bash: all cases passed"
