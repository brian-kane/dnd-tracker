import assert from 'node:assert/strict'
import { test } from 'node:test'
import { validateDrafts } from './triage-validate.mjs'

const DRAFT_DESC =
  '**Goal**\nA toggle that actually flips the theme.\n\n' +
  '**Done means**\n- Switching the toggle changes the theme immediately.\n\n' +
  '**Out of scope**\n- Remembering the choice across reloads.\n\n' +
  '**Notes**\nAssumed a simple two-way toggle, not a system-preference option.'

test('accepts a well-formed draft entry for an eligible card', () => {
  const drafts = [
    {
      cardId: 'card1',
      outcome: 'draft',
      name: 'Theme toggle: light/dark that actually works',
      desc: DRAFT_DESC,
      suggestedLabel: 'Feature',
    },
  ]
  const { valid, errors } = validateDrafts(drafts, new Set(['card1']))
  assert.equal(errors.length, 0)
  assert.equal(valid.length, 1)
})

test('accepts a well-formed questions entry', () => {
  const drafts = [{ cardId: 'card1', outcome: 'questions', questions: ['What platform?'] }]
  const { valid, errors } = validateDrafts(drafts, new Set(['card1']))
  assert.equal(errors.length, 0)
  assert.equal(valid.length, 1)
})

test('rejects an entry for a card id outside the eligible set', () => {
  const drafts = [{ cardId: 'not-eligible', outcome: 'questions', questions: ['huh?'] }]
  const { valid, errors } = validateDrafts(drafts, new Set(['card1']))
  assert.equal(valid.length, 0)
  assert.equal(errors.length, 1)
  assert.match(errors[0], /unknown or out-of-scope/)
})

test('rejects a duplicate entry for the same card id', () => {
  const drafts = [
    { cardId: 'card1', outcome: 'questions', questions: ['first?'] },
    { cardId: 'card1', outcome: 'questions', questions: ['second?'] },
  ]
  const { valid, errors } = validateDrafts(drafts, new Set(['card1']))
  assert.equal(valid.length, 1)
  assert.equal(errors.length, 1)
  assert.match(errors[0], /duplicate entry/)
})

test('rejects a draft missing a required template section', () => {
  const drafts = [
    {
      cardId: 'card1',
      outcome: 'draft',
      name: 'Theme toggle: light/dark that actually works',
      desc: '**Goal**\nA toggle.\n\n**Done means**\n- Works.',
      suggestedLabel: 'Feature',
    },
  ]
  const { valid, errors } = validateDrafts(drafts, new Set(['card1']))
  assert.equal(valid.length, 0)
  assert.match(errors[0], /not fully templated/)
})

test('rejects a draft with an invalid suggestedLabel', () => {
  const drafts = [
    {
      cardId: 'card1',
      outcome: 'draft',
      name: 'Theme toggle: light/dark that actually works',
      desc: DRAFT_DESC,
      suggestedLabel: 'Epic',
    },
  ]
  const { valid, errors } = validateDrafts(drafts, new Set(['card1']))
  assert.equal(valid.length, 0)
  assert.match(errors[0], /suggestedLabel/)
})

test('rejects a questions entry with no questions', () => {
  const drafts = [{ cardId: 'card1', outcome: 'questions', questions: [] }]
  const { valid, errors } = validateDrafts(drafts, new Set(['card1']))
  assert.equal(valid.length, 0)
  assert.match(errors[0], /questions is empty/)
})

test('rejects an entry with an unrecognized outcome', () => {
  const drafts = [{ cardId: 'card1', outcome: 'archive' }]
  const { valid, errors } = validateDrafts(drafts, new Set(['card1']))
  assert.equal(valid.length, 0)
  assert.match(errors[0], /outcome is not/)
})

test('rejects a non-array payload', () => {
  const { valid, errors } = validateDrafts({ not: 'an array' }, new Set(['card1']))
  assert.equal(valid.length, 0)
  assert.match(errors[0], /not an array/)
})
