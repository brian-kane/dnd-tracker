// Applies the `draft` job's drafts.json to Trello: rewrites a card's title/desc for a
// draft, or posts clarifying questions as a comment — nothing else. This is the code
// boundary for the triage agent's write scope (see triage-validate.mjs): it only ever
// touches a card id that trello-fetch-requests.mjs actually handed to the `draft` job,
// and only ever calls the two endpoints below. It never moves, archives, or labels a
// card — approval (attaching the label, moving the card to Up Next) stays Brian's.

import { appendFile, readFile } from 'node:fs/promises'
import { commentOnce, createTrelloClient } from './lib/trello-client.mjs'
import { validateDrafts } from './lib/triage-validate.mjs'

const { TRELLO_API_KEY, TRELLO_TOKEN, GITHUB_STEP_SUMMARY } = process.env
if (!TRELLO_API_KEY || !TRELLO_TOKEN) throw new Error('TRELLO_API_KEY or TRELLO_TOKEN is not set')

const trello = createTrelloClient(TRELLO_API_KEY, TRELLO_TOKEN)

const requests = JSON.parse(await readFile('requests.json', 'utf-8'))
const drafts = JSON.parse(await readFile('drafts.json', 'utf-8'))
const eligibleCardIds = new Set(requests.cards.map((card) => card.cardId))

const { valid, errors } = validateDrafts(drafts, eligibleCardIds)
const applied = []

for (const entry of valid) {
  const card = requests.cards.find((c) => c.cardId === entry.cardId)
  if (entry.outcome === 'draft') {
    await trello(
      `/cards/${entry.cardId}?${new URLSearchParams({ name: entry.name, desc: entry.desc })}`,
      {
        method: 'PUT',
      },
    )
    const text = `Triage: drafted as ${entry.suggestedLabel} from the wish above. Approve by attaching the ${entry.suggestedLabel} label and moving the card to Up Next.`
    await commentOnce(trello, entry.cardId, text)
    applied.push(`Drafted "${card.title}" -> "${entry.name}" (${entry.suggestedLabel}).`)
  } else {
    const text = `Triage: needs a bit more before drafting —\n${entry.questions.map((question) => `- ${question}`).join('\n')}`
    await commentOnce(trello, entry.cardId, text)
    applied.push(`Asked ${entry.questions.length} question(s) on "${card.title}".`)
  }
}

for (const line of applied) console.log(line)
for (const error of errors) console.log(`Rejected: ${error}`)

if (GITHUB_STEP_SUMMARY) {
  const lines = [
    '## Triage apply',
    '',
    ...(applied.length ? applied.map((line) => `- ${line}`) : ['- Nothing applied.']),
    ...(errors.length ? ['', '### Rejected', '', ...errors.map((error) => `- ${error}`)] : []),
  ]
  await appendFile(GITHUB_STEP_SUMMARY, `\n${lines.join('\n')}\n`)
}

if (errors.length > 0) process.exitCode = 1
