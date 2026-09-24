#!/usr/bin/env bash
# Takes a machine from a fresh clone to one that can run `npm run check` and
# `npm run test:e2e`. The one environment definition for a new machine, CI, and
# Claude Code cloud sessions. Safe to re-run: each step skips what's in place.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

as_root() {
  if ((EUID == 0)); then "$@"; else sudo "$@"; fi
}

# Node: the version pinned in .node-version. Only root installs it (the cloud
# setup script runs as root); elsewhere use your own version manager.
node_version=$(<.node-version)
if [[ "$(node --version 2>/dev/null)" != "v$node_version" ]]; then
  if ((EUID != 0)); then
    echo "setup: need Node $node_version (see .node-version), found $(node --version 2>/dev/null || echo none)." >&2
    exit 1
  fi
  dir=/opt/node-v$node_version
  if [[ ! -x $dir/bin/node ]]; then
    tarball=node-v$node_version-linux-x64.tar.xz
    tmp=$(mktemp -d)
    curl -fsSL -o "$tmp/$tarball" "https://nodejs.org/dist/v$node_version/$tarball"
    curl -fsSL -o "$tmp/SHASUMS256.txt" "https://nodejs.org/dist/v$node_version/SHASUMS256.txt"
    (cd "$tmp" && grep " $tarball\$" SHASUMS256.txt | sha256sum -c --quiet -)
    mkdir -p "$dir"
    tar -xJf "$tmp/$tarball" -C "$dir" --strip-components=1
    rm -r "$tmp"
  fi
  ln -sf "$dir"/bin/{node,npm,npx} /usr/local/bin/
  hash -r
  # A SessionStart hook can also put it first on PATH for Claude's shell.
  if [[ -n "${CLAUDE_ENV_FILE:-}" ]]; then
    echo "export PATH=$dir/bin:\$PATH" >>"$CLAUDE_ENV_FILE"
  fi
  if [[ "$(node --version)" != "v$node_version" ]]; then
    echo "setup: installed Node $node_version in $dir, but PATH still finds $(command -v node) ($(node --version))." >&2
    exit 1
  fi
fi

# jq: the Claude Code hooks and CI read JSON with it.
if ! command -v jq >/dev/null; then
  as_root apt-get update
  as_root apt-get install -y jq
fi

# Dependencies: npm writes node_modules/.package-lock.json on install, so it is
# newer than package-lock.json unless the lockfile changed since.
if [[ ! node_modules/.package-lock.json -nt package-lock.json ]]; then
  npm ci
fi

# Chromium for Playwright. Downloading is a no-op when this Playwright version's
# browser is already there (e.g. restored from CI's cache). System libraries are
# installed only if Chromium can't launch without them.
npx playwright install chromium
launch="import('@playwright/test').then(async ({ chromium }) => (await chromium.launch()).close())"
if ! node -e "$launch" 2>/dev/null; then
  npx playwright install-deps chromium
  node -e "$launch"
fi

echo "setup: done (Node $(node --version), Playwright $(npx playwright --version))."
