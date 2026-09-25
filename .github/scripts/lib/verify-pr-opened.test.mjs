import assert from 'node:assert/strict'
import { test } from 'node:test'
import { findCardPr } from './verify-pr-opened.mjs'

const cardBody = 'Card: https://trello.com/c/DtCFLsHi/46-title'

test('finds the PR citing the card', () => {
  const pulls = [
    { number: 2, created_at: '2026-09-25T14:00:00Z', body: 'Card: https://trello.com/c/Other' },
    { number: 1, created_at: '2026-09-25T13:00:00Z', body: cardBody },
  ]
  const pr = findCardPr(pulls, 'DtCFLsHi', '2026-09-25T12:00:00Z')
  assert.equal(pr.number, 1)
})

test('returns null when no PR cites the card', () => {
  const pulls = [
    { number: 1, created_at: '2026-09-25T13:00:00Z', body: 'Card: https://trello.com/c/Other' },
  ]
  assert.equal(findCardPr(pulls, 'DtCFLsHi', '2026-09-25T12:00:00Z'), null)
})

test('ignores a PR from a prior attempt, older than this run', () => {
  const pulls = [{ number: 1, created_at: '2026-09-25T10:00:00Z', body: cardBody }]
  assert.equal(findCardPr(pulls, 'DtCFLsHi', '2026-09-25T12:00:00Z'), null)
})

test('with no runStartedAt, any citing PR counts', () => {
  const pulls = [{ number: 1, created_at: '2026-09-25T10:00:00Z', body: cardBody }]
  assert.equal(findCardPr(pulls, 'DtCFLsHi', undefined).number, 1)
})
