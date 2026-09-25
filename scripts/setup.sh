#!/usr/bin/env bash
# Takes a machine from a fresh clone to one that can run `npm run check` and
# `npm run test:e2e`. The one environment definition for a new machine, CI, and
# Claude Code cloud sessions. Safe to re-run: each step skips what's in place.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

as_root() {
  if ((EUID == 0)); then "$@"; else sudo "$@"; fi
}

# Node: CI and local use the version pinned in .node-version. Claude Code cloud
# VMs have no supported way to change their default Node (22), so accept any
# version in package.json's engines range, checked with npm's own semver.
if ! command -v node >/dev/null; then
  echo "setup: Node not found; install the version in .node-version." >&2
  exit 1
fi
node -e '
  const semver = require(process.argv[1])
  const range = require("./package.json").engines.node
  if (!semver.satisfies(process.version, range)) {
    console.error(`setup: Node ${process.version} is outside engines "${range}"; install the version in .node-version.`)
    process.exit(1)
  }
' "$(npm root -g)/npm/node_modules/semver"

# jq: the Claude Code hooks and CI read JSON with it.
if ! command -v jq >/dev/null; then
  as_root apt-get update
  as_root apt-get install -y jq
fi

# gh: /card opens and manages PRs with it. Ubuntu's own package (no extra apt
# repo, so no new domain to allow).
if ! command -v gh >/dev/null; then
  as_root apt-get update
  as_root apt-get install -y gh
fi

# bubblewrap/socat: Claude Code's built-in Bash sandbox (sandbox.enabled in
# .claude/settings.json) needs both on Linux/WSL2.
if ! command -v bwrap >/dev/null || ! command -v socat >/dev/null; then
  as_root apt-get update
  as_root apt-get install -y bubblewrap socat
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

echo "setup: done (Node $(node --version), Playwright $(npx playwright --version), gh $(gh --version | head -1))."
