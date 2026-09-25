// One-off, run locally: rewrites the DnD Tracker board's description. The Trello
// connector's write tool only supports creating boards, not updating one, so this is
// the only way to edit board-level text (see README's "How this board works" note)
// without doing it by hand in the Trello UI.
//
// Usage: TRELLO_API_KEY=... TRELLO_TOKEN=... node .github/scripts/trello-update-board.mjs <path to new description file>

import { readFile } from 'node:fs/promises'
import { BOARD_ID } from './lib/board.mjs'
import { createTrelloClient, updateBoardDescription } from './lib/trello-client.mjs'

const { TRELLO_API_KEY, TRELLO_TOKEN } = process.env
if (!TRELLO_API_KEY || !TRELLO_TOKEN) throw new Error('TRELLO_API_KEY or TRELLO_TOKEN is not set')

const [, , descFile] = process.argv
if (!descFile) throw new Error('Usage: node trello-update-board.mjs <path to new description file>')

const trello = createTrelloClient(TRELLO_API_KEY, TRELLO_TOKEN)
await updateBoardDescription(trello, BOARD_ID, await readFile(descFile, 'utf-8'))
console.log('Updated the DnD Tracker board description.')
