import assert from 'node:assert/strict'
import { test } from 'node:test'
import { citedCardShortLink } from './pr-card-link.mjs'

test('extracts the short link from a PR body', () => {
  const body = '- Add a thing\n- Change another\n\nCard: https://trello.com/c/CVgPAlJm/45-title'
  assert.equal(citedCardShortLink(body), 'CVgPAlJm')
})

test('returns null when there is no Card line', () => {
  assert.equal(citedCardShortLink('- Add a thing\n\nNo card here'), null)
})

test('returns null for an empty or missing body', () => {
  assert.equal(citedCardShortLink(''), null)
  assert.equal(citedCardShortLink(undefined), null)
})

test('only matches at the start of a line', () => {
  assert.equal(citedCardShortLink('See Card: https://trello.com/c/CVgPAlJm inline'), null)
})
