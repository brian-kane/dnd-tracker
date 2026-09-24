import { execFileSync } from 'node:child_process'
import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

import { CHANGELOG_GIT_ARGS, parseChangelog, type ChangelogEntry } from './scripts/changelog.ts'

const REPO_URL = 'https://github.com/brian-kane/dnd-tracker'

// CI sets BUILD_SHA because its checkout of a pull request is GitHub's
// temporary merge commit, not the branch's latest commit.
function buildSha(): string {
  const sha =
    process.env.BUILD_SHA || execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
  if (!/^[0-9a-f]{40}$/.test(sha)) {
    throw new Error(`Expected a full 40-character commit hash for the build, got "${sha}"`)
  }
  return sha
}

function git(args: readonly string[]): string {
  return execFileSync('git', args, { encoding: 'utf8' })
}

// A shallow clone would silently cut the changelog short, so refuse to build
// from one (CI checks out with fetch-depth: 0).
function changelog(): ChangelogEntry[] {
  if (git(['rev-parse', '--is-shallow-repository']).trim() !== 'false') {
    throw new Error('The changelog needs full git history; run `git fetch --unshallow`')
  }
  return parseChangelog(git(CHANGELOG_GIT_ARGS))
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  define: {
    __BUILD_SHA__: JSON.stringify(buildSha()),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __REPO_URL__: JSON.stringify(REPO_URL),
    __CHANGELOG__: JSON.stringify(changelog()),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
