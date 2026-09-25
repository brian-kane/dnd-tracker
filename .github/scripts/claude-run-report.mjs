// Reads a Claude Code Action step's execution file (EXECUTION_FILE) and prints a
// redacted denial summary to the job log and step summary, so an error_max_turns
// failure shows what got denied and retried without dumping the full transcript.
// Runs with `if: always()`, so a missing file (step never ran, or wrote nothing) is
// expected, not an error.

import { appendFile, readFile } from 'node:fs/promises'
import { formatReport, summarize } from './lib/claude-run-report.mjs'

const { EXECUTION_FILE, GITHUB_STEP_SUMMARY } = process.env
if (!EXECUTION_FILE) {
  console.log('No execution_file output from the Claude step; nothing to report.')
  process.exit(0)
}

const messages = JSON.parse(await readFile(EXECUTION_FILE, 'utf-8'))
const report = formatReport(summarize(messages))
console.log(report)
if (GITHUB_STEP_SUMMARY)
  await appendFile(GITHUB_STEP_SUMMARY, `\n## Claude run report\n\n${report}\n`)
