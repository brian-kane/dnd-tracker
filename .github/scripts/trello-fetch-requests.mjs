// Fetches Requests-list wishes due for triage, plus the board description (the live
// source for card templates and label conventions, so they can evolve without the
// `draft` job's prompt going stale), and writes requests.json — the only thing the
// `draft` job (which holds no Trello credentials) sees.
//
// "Due for triage" means eligible per triage-eligibility.mjs: no triage comment yet, or
// a human replied after the triage agent's own last comment on that card. Anything else
// is skipped, silently — it's either already drafted and awaiting approval, or already
// asked and awaiting an answer.

import { appendFile, writeFile } from 'node:fs/promises'
import { BOARD_ID } from './lib/board.mjs'
import { isEligibleForTriage } from './lib/triage-eligibility.mjs'
import { createTrelloClient } from './lib/trello-client.mjs'

const REQUESTS_LIST_ID = '6ab581d561c7f19b91d18bd7' // Requests, on the DnD Tracker board
const CARD_FIELDS = 'id,name,desc'

const { TRELLO_API_KEY, TRELLO_TOKEN, GITHUB_OUTPUT } = process.env
if (!TRELLO_API_KEY || !TRELLO_TOKEN) throw new Error('TRELLO_API_KEY or TRELLO_TOKEN is not set')

const trello = createTrelloClient(TRELLO_API_KEY, TRELLO_TOKEN)

const board = await trello(`/boards/${BOARD_ID}?fields=desc`)
const cards = await trello(`/lists/${REQUESTS_LIST_ID}/cards?fields=${CARD_FIELDS}`)

const eligible = []
for (const card of cards) {
  const comments = await trello(`/cards/${card.id}/actions?filter=commentCard&memberCreator=true`)
  if (!isEligibleForTriage(comments)) {
    console.log(`Skipping "${card.name}": waiting on a reply to the triage agent's last comment.`)
    continue
  }
  eligible.push({
    cardId: card.id,
    title: card.name,
    wish: card.desc,
    // Oldest first, so the draft job reads it as a conversation.
    comments: [...comments].reverse().map((action) => ({
      author: action.memberCreator?.fullName ?? 'unknown',
      text: action.data.text,
    })),
  })
}

if (GITHUB_OUTPUT) await appendFile(GITHUB_OUTPUT, `selected=${eligible.length > 0}\n`)

if (eligible.length === 0) {
  console.log('No eligible Requests cards to triage.')
  process.exit(0)
}

await writeFile(
  'requests.json',
  JSON.stringify({ boardDescription: board.desc, cards: eligible }, null, 2),
)
console.log(`Selected ${eligible.length} card(s) to triage.`)
