// Fetches a Trello card for the `build` workflow and writes it to card.json, so the
// `build` job (which holds no Trello secrets) can read it without connector access.
// Refuses anything not sitting in Up Next: that's what "approved" means here, and it's
// the only thing standing between a manual dispatch and an unreviewed card building
// itself into a PR.

import { writeFile } from 'node:fs/promises'

const BOARD_ID = '6ab3e35b7e9b2eaeb388baf0' // DnD Tracker
const UP_NEXT_LIST_ID = '6ab3e50d9f8a71acd51b0b5a' // Up Next, on that board

const { CARD_URL, TRELLO_API_KEY, TRELLO_TOKEN } = process.env
if (!CARD_URL) throw new Error('CARD_URL is empty')
if (!TRELLO_API_KEY || !TRELLO_TOKEN) throw new Error('TRELLO_API_KEY or TRELLO_TOKEN is not set')

const match = /trello\.com\/c\/([A-Za-z0-9]+)/.exec(CARD_URL)
if (!match) throw new Error(`Not a Trello card URL: ${CARD_URL}`)

// A header keeps the credentials out of URLs, which can end up in logs.
const headers = {
  Authorization: `OAuth oauth_consumer_key="${TRELLO_API_KEY}", oauth_token="${TRELLO_TOKEN}"`,
}
const fields = 'id,name,desc,idBoard,idList,shortUrl,labels'
const res = await fetch(`https://api.trello.com/1/cards/${match[1]}?fields=${fields}&labels=true`, {
  headers,
})
if (!res.ok) throw new Error(`GET card ${match[1]}: ${res.status} ${await res.text()}`)
const card = await res.json()

if (card.idBoard !== BOARD_ID || card.idList !== UP_NEXT_LIST_ID) {
  throw new Error(
    `Card "${card.name}" is not in Up Next on the DnD Tracker board; refusing to build it.`,
  )
}

await writeFile('card.json', JSON.stringify(card, null, 2))
console.log(`Fetched card "${card.name}" (${card.shortUrl}), confirmed in Up Next.`)
