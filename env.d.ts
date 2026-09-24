/// <reference types="vite/client" />

// Injected at build time by `define` in vite.config.ts.
declare const __BUILD_SHA__: string
declare const __BUILD_TIME__: string
declare const __REPO_URL__: string
declare const __CHANGELOG__: readonly import('./scripts/changelog.ts').ChangelogEntry[]

interface ImportMetaEnv {
  readonly VITE_WISH_EMAIL: string
}
