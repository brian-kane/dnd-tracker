import { execFileSync } from 'node:child_process'
import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

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
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
