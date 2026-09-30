// Summarizes a Claude Code Action execution file's permission denials and the agent's
// final message, so a failed or no-PR run shows what got denied and why the agent
// stopped without printing the full transcript (tool inputs/outputs), which would land
// in this public repo's logs.

const MAX_CALL_LENGTH = 300
const MAX_FINAL_MESSAGE_LENGTH = 1000

function truncate(text, max = MAX_CALL_LENGTH) {
  return text.length > max ? `${text.slice(0, max)}…` : text
}

// The agent's text can be shaped by untrusted wish or PR text, and the runner treats a
// log line starting with `::` (or `##[`) as a workflow command. Quoting every line keeps
// that text inert without altering it; secret masking is left to GitHub.
function quote(text) {
  return text
    .split('\n')
    .map((line) => `> ${line}`)
    .join('\n')
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
    // Failure subtypes (error_max_turns, ...) carry no `result` text.
    finalMessage: typeof result.result === 'string' ? result.result.trim() : '',
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
  if (summary.finalMessage) {
    lines.push('Final message (agent text, untrusted):')
    lines.push(quote(truncate(summary.finalMessage, MAX_FINAL_MESSAGE_LENGTH)))
  } else {
    lines.push('No final message in the result.')
  }
  return lines.join('\n')
}
