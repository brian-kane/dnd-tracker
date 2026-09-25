import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isFullyTemplated } from './card-template.mjs'

const featureLabel = [{ name: 'Feature' }]

test('fully templated Feature card passes', () => {
  const card = {
    name: 'Lawrence: live HP that survives reload',
    labels: featureLabel,
    desc: '**Goal**\nSomething.\n\n**Done means**\n\n- A thing\n\n**Out of scope**\nNone\n\n**Notes**\nNone',
  }
  assert.deepEqual(isFullyTemplated(card), { ok: true, label: 'Feature' })
})

test('title-only stub fails on the title check', () => {
  const card = { name: 'Enitor', labels: [], desc: '' }
  const result = isFullyTemplated(card)
  assert.equal(result.ok, false)
  assert.match(result.reason, /title/)
})

test('no label fails', () => {
  const card = {
    name: 'Subject: outcome',
    labels: [],
    desc: '**Goal**\nx\n**Done means**\nx\n**Out of scope**\nx\n**Notes**\nx',
  }
  assert.equal(isFullyTemplated(card).ok, false)
})

test('two labels fails', () => {
  const card = {
    name: 'Subject: outcome',
    labels: [{ name: 'Feature' }, { name: 'Bug' }],
    desc: '',
  }
  assert.equal(isFullyTemplated(card).ok, false)
})

test('missing section fails', () => {
  const card = {
    name: 'Subject: outcome',
    labels: featureLabel,
    desc: '**Goal**\nx\n\n**Done means**\nx\n\n**Notes**\nx',
  }
  const result = isFullyTemplated(card)
  assert.equal(result.ok, false)
  assert.match(result.reason, /Out of scope/)
})

test('section present but empty fails', () => {
  const card = {
    name: 'Subject: outcome',
    labels: featureLabel,
    desc: '**Goal**\nx\n\n**Done means**\nx\n\n**Out of scope**\n\n**Notes**\nx',
  }
  const result = isFullyTemplated(card)
  assert.equal(result.ok, false)
  assert.match(result.reason, /Out of scope/)
})

test('"None" counts as text', () => {
  const card = {
    name: 'Subject: outcome',
    labels: featureLabel,
    desc: '**Goal**\nx\n\n**Done means**\nx\n\n**Out of scope**\nNone\n\n**Notes**\nNone',
  }
  assert.equal(isFullyTemplated(card).ok, true)
})

test('Bug template uses its own headings', () => {
  const card = {
    name: 'Subject: outcome',
    labels: [{ name: 'Bug' }],
    desc: '**Observed**\nx\n\n**Expected**\nx\n\n**Steps to reproduce**\nx\n\n**Notes**\nx',
  }
  assert.equal(isFullyTemplated(card).ok, true)
})
