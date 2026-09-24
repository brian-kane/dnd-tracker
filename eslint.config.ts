import { globalIgnores } from 'eslint/config'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import pluginVitest from '@vitest/eslint-plugin'
import pluginOxlint from 'eslint-plugin-oxlint'
import skipFormatting from 'eslint-config-prettier/flat'

// To allow more languages other than `ts` in `.vue` files, uncomment the following lines:
// import { configureVueProject } from '@vue/eslint-config-typescript'
// configureVueProject({ scriptLangs: ['ts', 'tsx'] })
// More info at https://github.com/vuejs/eslint-config-typescript/#advanced-setup

// Dependency direction (CLAUDE.md "Architecture rules"): components ->
// composables -> rules/storage -> model. This is the source of truth for
// enforcing it: a forbidden import fails `npm run check` naming the broken
// rule, rather than relying on catching it in review.
type NoRestrictedImportsRule = [
  'error',
  { paths: { name: string; message: string }[]; patterns: { regex: string; message: string }[] },
]

function layerBoundary(layer: string, forbidVue: boolean, forbiddenLayers: string[]) {
  const message = `Layering: src/${layer} may not import ${forbiddenLayers.join(', ')}${forbidVue ? ', or vue' : ''} (see CLAUDE.md architecture rules).`
  const rule: NoRestrictedImportsRule = [
    'error',
    {
      paths: forbidVue ? [{ name: 'vue', message }] : [],
      patterns: forbiddenLayers.map((forbidden) => ({
        regex: `(^|/)${forbidden}(/|$)`,
        message,
      })),
    },
  ]
  return {
    name: `app/boundaries-${layer}`,
    files: [`src/${layer}/**/*.{ts,tsx}`],
    rules: { 'no-restricted-imports': rule },
  }
}

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{vue,ts,mts,tsx}'],
  },

  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**']),

  ...pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,

  {
    ...pluginVitest.configs.recommended,
    files: ['src/**/__tests__/*'],
  },

  ...pluginOxlint.buildFromOxlintConfigFile('.oxlintrc.json'),

  layerBoundary('model', true, ['rules', 'storage', 'composables', 'components']),
  layerBoundary('rules', true, ['storage', 'composables', 'components']),
  layerBoundary('storage', true, ['rules', 'composables', 'components']),
  layerBoundary('composables', false, ['components']),

  skipFormatting,
)
