import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isEligibleForTriage, TRIAGE_PREFIX } from './triage-eligibility.mjs'

test('no comments is eligible', () => {
  assert.equal(isEligibleForTriage([]), true)
})

test("most recent comment is not the triage agent's is eligible", () => {
  const comments = [
    { data: { text: 'yes, go ahead and draft it' } },
    { data: { text: `${TRIAGE_PREFIX}needs a bit more before drafting —\n- what platform?` } },
  ]
  assert.equal(isEligibleForTriage(comments), true)
})

test("most recent comment is the triage agent's own is not eligible", () => {
  const comments = [
    { data: { text: `${TRIAGE_PREFIX}drafted as Feature from the wish above.` } },
    { data: { text: 'a light/dark theme toggle that actually works' } },
  ]
  assert.equal(isEligibleForTriage(comments), false)
})
