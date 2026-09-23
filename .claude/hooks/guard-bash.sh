#!/usr/bin/env bash
# PreToolUse (Bash): block force-pushes, rm -rf outside the project, and deleting .git.
# A text-pattern guardrail, not a sandbox.
set -uo pipefail

input=$(cat)
cmd=$(jq -r '.tool_input.command // empty' <<<"$input")
cwd=$(jq -r '.cwd // empty' <<<"$input")
project="$CLAUDE_PROJECT_DIR"
cd "${cwd:-$project}" 2>/dev/null || cd "$project"

block() {
  echo "Blocked by .claude/hooks/guard-bash.sh: $1" >&2
  exit 2
}

# Split into one command per line on ;, &&, ||, | and newlines, so each check sees only
# the command it's about.
segments() {
  sed -E 's/(&&|\|\||;|\|)/\n/g' <<<"$1"
}

# Force-push: --force, --force-with-lease, -f (alone or combined), or a +refspec, on the
# git push itself. Quoted text is blanked first so a message that mentions "git push -f",
# or quotes an && or ;, can't trigger a block or mis-split the command.
unquoted=$(sed -E "s/\"[^\"]*\"/\"\"/g; s/'[^']*'/''/g" <<<"$cmd")
while IFS= read -r segment; do
  grep -Eq '(^|[^[:alnum:]])git([[:space:]].*)?[[:space:]]push([[:space:]]|$)' <<<"$segment" || continue
  push_args=$(sed -E 's/.*[[:space:]]push([[:space:]]|$)/ /' <<<"$segment")
  if grep -Eq '(^|[[:space:]])(--force|--force-with-lease|-[a-zA-Z]*f[a-zA-Z]*)([=[:space:]]|$)|[[:space:]]\+[^[:space:]]' <<<"$push_args"; then
    block "force-push is not allowed."
  fi
done < <(segments "$unquoted")

# Check each command separately, so free text such as a commit message mentioning "rm"
# or ".git" doesn't trigger a block. Quotes are kept here: rm's path arguments matter.
while IFS= read -r segment; do
  # Anything that deletes .git: rm/rmdir/unlink with a .git path, or find on .git with -delete.
  if [[ "$segment" =~ ^[[:space:]]*(sudo[[:space:]]+)?(rm|rmdir|unlink)[[:space:]] ]] \
    && grep -Eq '(^|[[:space:]/])\.git(/|[[:space:]]|$)' <<<"$segment"; then
    block "deleting .git is not allowed."
  fi
  if [[ "$segment" =~ ^[[:space:]]*find[[:space:]] && "$segment" == *.git* && "$segment" == *-delete* ]]; then
    block "deleting .git is not allowed."
  fi

  # rm with both -r and -f: every path argument must resolve inside the project.
  [[ "$segment" =~ ^[[:space:]]*(sudo[[:space:]]+)?rm[[:space:]] ]] || continue
  read -ra words <<<"${segment#*rm }"
  flags="" paths=()
  for w in "${words[@]}"; do
    case "$w" in
      --recursive) flags+="r" ;;
      --force) flags+="f" ;;
      --*) ;;
      -*) flags+="${w#-}" ;;
      *) paths+=("$w") ;;
    esac
  done
  [[ "$flags" == *[rR]* && "$flags" == *f* ]] || continue
  for p in "${paths[@]}"; do
    [[ "$p" == *'$'* || "$p" == *'`'* ]] && block "rm -rf with an unexpanded path ($p) is not allowed."
    [[ "$p" == '~'* ]] && p="$HOME${p#\~}"
    resolved=$(realpath -m -- "$p" 2>/dev/null || echo "/")
    case "$resolved" in
      "$project"/?*) ;;
      *) block "rm -rf outside the project folder ($p → $resolved)." ;;
    esac
  done
done < <(segments "$cmd")

exit 0
