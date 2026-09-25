// Comments on the Trello card when its build.yml run produced no PR (verify-pr-opened.mjs
// set pr_opened=false), so a run that spent real cost and produced nothing is visible on
// the card itself, not just in a GitHub Actions run someone has to think to check.

import { readFile } from 'node:fs/promises'
import { commentOnce, createTrelloClient } from './lib/trello-client.mjs'

const { TRELLO_API_KEY, TRELLO_TOKEN, RUN_URL, CARD_FILE } = process.env
if (!TRELLO_API_KEY || !TRELLO_TOKEN) throw new Error('TRELLO_API_KEY or TRELLO_TOKEN is not set')
if (!RUN_URL) throw new Error('RUN_URL is empty')

const card = JSON.parse(await readFile(CARD_FILE ?? 'card.json', 'utf-8'))
const trello = createTrelloClient(TRELLO_API_KEY, TRELLO_TOKEN)
const text = `Automated build produced no PR: ${RUN_URL}`

if (await commentOnce(trello, card.id, text)) {
  console.log(`Flagged card "${card.name}": ${text}`)
} else {
  console.log(`Card "${card.name}" already flagged for this run; skipping.`)
}
