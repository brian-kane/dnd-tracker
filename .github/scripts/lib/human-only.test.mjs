import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isHumanOnly } from './human-only.mjs'

test('isHumanOnly is true when a comment is exactly the marker', () => {
  assert.equal(isHumanOnly([{ data: { text: 'human-only' } }]), true)
})

test('isHumanOnly tolerates surrounding whitespace', () => {
  assert.equal(isHumanOnly([{ data: { text: '  human-only  ' } }]), true)
})

test('isHumanOnly is false for a comment that only mentions the marker', () => {
  assert.equal(isHumanOnly([{ data: { text: "this isn't human-only" } }]), false)
})

test('isHumanOnly is false with no matching comments', () => {
  assert.equal(isHumanOnly([{ data: { text: 'unrelated' } }]), false)
})

test('isHumanOnly is false with no comments', () => {
  assert.equal(isHumanOnly([]), false)
})
