// Fails the job when the Claude step didn't leave this run's card with a PR — a run
// can report success internally (see claude-run-report.mjs) without ever pushing a
// branch or opening one, and nothing else here would notice. Runs with `if: always()`,
// so it also confirms an already-failed run really did produce nothing.

import { appendFile, readFile } from 'node:fs/promises'
import { findCardPr } from './lib/verify-pr-opened.mjs'

const {
  GITHUB_TOKEN,
  GITHUB_REPOSITORY,
  GITHUB_OUTPUT,
  GITHUB_STEP_SUMMARY,
  CARD_FILE,
  RUN_STARTED_AT,
} = process.env
if (!GITHUB_TOKEN || !GITHUB_REPOSITORY)
  throw new Error('GITHUB_TOKEN or GITHUB_REPOSITORY is not set')

const card = JSON.parse(await readFile(CARD_FILE ?? 'card.json', 'utf-8'))
if (!card.shortLink) throw new Error(`card.json has no shortLink`)

const headers = { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' }
let pr = null
for (let page = 1; !pr; page++) {
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_REPOSITORY}/pulls?state=all&per_page=100&page=${page}&sort=created&direction=desc`,
    { headers },
  )
  if (!res.ok) throw new Error(`GET pulls page ${page}: ${res.status} ${await res.text()}`)
  const pulls = await res.json()
  if (pulls.length === 0) break
  pr = findCardPr(pulls, card.shortLink, RUN_STARTED_AT)
  if (pulls.length < 100) break
}

const summary = pr
  ? `PR #${pr.number} was opened for card "${card.name}".`
  : `No PR was opened for card "${card.name}" (${card.shortUrl}); this run produced nothing usable.`
console.log(summary)

if (GITHUB_OUTPUT) await appendFile(GITHUB_OUTPUT, `pr_opened=${Boolean(pr)}\n`)
if (GITHUB_STEP_SUMMARY) await appendFile(GITHUB_STEP_SUMMARY, `\n## PR check\n\n${summary}\n`)
if (!pr) process.exitCode = 1
