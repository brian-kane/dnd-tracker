// Rewrites the DnD Tracker board's description. The Trello connector's write tool only
// supports creating boards, not updating one, so this — dispatched manually via
// trello-board.yml — is how a board-level text change actually lands, without doing it
// by hand in the Trello UI.

import { BOARD_ID } from './lib/board.mjs'
import { createTrelloClient } from './lib/trello-client.mjs'

const { TRELLO_API_KEY, TRELLO_TOKEN, BOARD_DESC } = process.env
if (!TRELLO_API_KEY || !TRELLO_TOKEN) throw new Error('TRELLO_API_KEY or TRELLO_TOKEN is not set')
if (!BOARD_DESC) throw new Error('BOARD_DESC is not set')

const trello = createTrelloClient(TRELLO_API_KEY, TRELLO_TOKEN)
await trello(`/boards/${BOARD_ID}?${new URLSearchParams({ desc: BOARD_DESC })}`, {
  method: 'PUT',
})
console.log('Updated the DnD Tracker board description.')
