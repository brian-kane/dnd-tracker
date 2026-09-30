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

test('summarize carries the trimmed final message, and none when the result has no text', () => {
  const success = {
    type: 'result',
    subtype: 'success',
    result: '  Stopped: needs a storage format.\n',
  }
  assert.equal(summarize([success]).finalMessage, 'Stopped: needs a storage format.')
  const maxTurns = { type: 'result', subtype: 'error_max_turns', num_turns: 61 }
  assert.equal(summarize([maxTurns]).finalMessage, '')
})

test('formatReport prints the final message quoted line by line', () => {
  const report = formatReport({
    found: true,
    subtype: 'success',
    isError: false,
    numTurns: 14,
    totalCostUsd: 0.2467,
    deniedGroups: [],
    finalMessage: 'Stopped before coding.\nThe card needs a storage format.',
  })
  assert.match(
    report,
    /Final message \(agent text, untrusted\):\n> Stopped before coding\.\n> The card needs/,
  )
})

test('formatReport says so when there is no final message', () => {
  const summary = {
    found: true,
    subtype: 'error_max_turns',
    numTurns: 61,
    deniedGroups: [],
    finalMessage: '',
  }
  assert.match(formatReport(summary), /No final message in the result\./)
})

test('formatReport truncates a long final message to 1000 characters', () => {
  const report = formatReport({ found: true, deniedGroups: [], finalMessage: 'x'.repeat(5000) })
  const quoted = report.split('\n').find((line) => line.startsWith('> x'))
  assert.equal(quoted, `> ${'x'.repeat(1000)}…`)
})

// Deliberate: token-shaped text is only truncated, not redacted. GitHub's secret masking
// covers registered secrets in logs; the job holds no secret worth pattern-matching for.
test('formatReport leaves token-shaped and base64-shaped text as plain truncated text', () => {
  const token = `ghp_${'A1b2C3d4E5'.repeat(4)}`
  const blob = 'QUJD'.repeat(500)
  const report = formatReport({ found: true, deniedGroups: [], finalMessage: `${token}\n${blob}` })
  assert.ok(report.includes(`> ${token}`))
  assert.ok(report.includes(`> ${blob.slice(0, 1000 - token.length - 1)}`))
  assert.ok(!report.includes(blob))
})

test('formatReport keeps workflow-command lines in the final message inert', () => {
  const report = formatReport({
    found: true,
    deniedGroups: [],
    finalMessage: '::add-mask::abc\n##[error]boom\n::stop-commands::x',
  })
  for (const line of report.split('\n').slice(-3)) assert.match(line, /^> /)
  assert.ok(!report.split('\n').some((line) => line.startsWith('::') || line.startsWith('##[')))
})
