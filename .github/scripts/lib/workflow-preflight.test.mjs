import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mismatchMessage } from './workflow-preflight.mjs'

test('mismatchMessage names the workflow file and explains the OIDC constraint', () => {
  const message = mismatchMessage('.github/workflows/build.yml')
  assert.match(message, /\.github\/workflows\/build\.yml/)
  assert.match(message, /OIDC/)
})
