// Summarizes a Claude Code Action execution file's permission denials, so a
// max-turns failure shows what got denied and retried without printing the full
// transcript (tool inputs/outputs), which would land in this public repo's logs.

const MAX_CALL_LENGTH = 300

function truncate(text) {
  return text.length > MAX_CALL_LENGTH ? `${text.slice(0, MAX_CALL_LENGTH)}…` : text
}

export function findResultMessage(messages) {
  return messages.find((message) => message?.type === 'result')
}

// Denials are a flat, ordered list; grouping identical (tool, input) pairs turns
// "denied 10 times" into "the same call denied 10 times", which is what matters for
// telling a retry loop apart from ten distinct denied calls.
export function groupDenials(denials) {
  const counts = new Map()
  for (const denial of denials) {
    const call = truncate(`${denial.tool_name} ${JSON.stringify(denial.tool_input ?? {})}`)
    counts.set(call, (counts.get(call) ?? 0) + 1)
  }
  return [...counts.entries()].map(([call, count]) => ({ call, count }))
}

export function summarize(messages) {
  const result = findResultMessage(messages)
  if (!result) return { found: false }
  return {
    found: true,
    subtype: result.subtype,
    isError: result.is_error,
    numTurns: result.num_turns,
    totalCostUsd: result.total_cost_usd,
    deniedGroups: groupDenials(result.permission_denials ?? []),
  }
}

export function formatReport(summary) {
  if (!summary.found) return 'No result message found in the execution file.'
  const cost = summary.totalCostUsd?.toFixed(2) ?? '?'
  const lines = [
    `Result: ${summary.subtype}${summary.isError ? ' (error)' : ''}, ${summary.numTurns} turns, $${cost}`,
  ]
  if (summary.deniedGroups.length === 0) {
    lines.push('No permission denials.')
  } else {
    lines.push('Denied tool calls (deduplicated, with retry counts):')
    for (const { call, count } of summary.deniedGroups) lines.push(`- ${count}x ${call}`)
  }
  return lines.join('\n')
}
