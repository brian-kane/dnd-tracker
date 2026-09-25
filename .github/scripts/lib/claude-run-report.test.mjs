import assert from 'node:assert/strict'
import { test } from 'node:test'
import { formatReport, groupDenials, summarize } from './claude-run-report.mjs'

test('summarize with no result message', () => {
  assert.deepEqual(summarize([{ type: 'system', subtype: 'init' }]), { found: false })
})

test('summarize with no denials', () => {
  const messages = [
    { type: 'result', subtype: 'success', is_error: false, num_turns: 5, total_cost_usd: 0.12 },
  ]
  const summary = summarize(messages)
  assert.equal(summary.found, true)
  assert.deepEqual(summary.deniedGroups, [])
})

test('groupDenials counts identical calls together', () => {
  const denials = [
    { tool_name: 'Bash', tool_input: { command: 'gh pr view' } },
    { tool_name: 'Bash', tool_input: { command: 'gh pr view' } },
    { tool_name: 'Bash', tool_input: { command: 'gh pr diff' } },
  ]
  const groups = groupDenials(denials)
  assert.deepEqual(groups, [
    { call: 'Bash {"command":"gh pr view"}', count: 2 },
    { call: 'Bash {"command":"gh pr diff"}', count: 1 },
  ])
})

test('groupDenials truncates long input', () => {
  const denials = [{ tool_name: 'Write', tool_input: { content: 'x'.repeat(500) } }]
  const [group] = groupDenials(denials)
  assert.ok(group.call.endsWith('…'))
  assert.ok(group.call.length < 350)
})

test('formatReport with denials', () => {
  const summary = {
    found: true,
    subtype: 'success',
    isError: false,
    numTurns: 64,
    totalCostUsd: 1.6156,
    deniedGroups: [{ call: 'Bash {"command":"gh pr comment"}', count: 10 }],
  }
  const report = formatReport(summary)
  assert.match(report, /64 turns, \$1\.62/)
  assert.match(report, /10x Bash/)
})

test('formatReport with no result', () => {
  assert.equal(formatReport({ found: false }), 'No result message found in the execution file.')
})
