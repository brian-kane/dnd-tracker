import assert from 'node:assert/strict'
import { test } from 'node:test'
import { countNoPrAttempts, noPrCommentText } from './no-pr-comment.mjs'

test('noPrCommentText embeds the run URL', () => {
  const text = noPrCommentText('https://github.com/o/r/actions/runs/1')
  assert.equal(text, 'Automated build produced no PR: https://github.com/o/r/actions/runs/1')
})

test('countNoPrAttempts counts only matching comments', () => {
  const comments = [
    { data: { text: 'Automated build produced no PR: run1' } },
    { data: { text: 'Automated build produced no PR: run2' } },
    { data: { text: 'Failed 2 times (closed PRs, none merged); needs a human look.' } },
    { data: { text: 'unrelated comment' } },
  ]
  assert.equal(countNoPrAttempts(comments), 2)
})

test('countNoPrAttempts with no matches is zero', () => {
  assert.equal(countNoPrAttempts([{ data: { text: 'hello' } }]), 0)
})

test('countNoPrAttempts with no comments is zero', () => {
  assert.equal(countNoPrAttempts([]), 0)
})
