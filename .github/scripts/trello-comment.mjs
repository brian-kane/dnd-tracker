// Posts COMMENT on the Trello card linked from the PR body ("Card: <link>").
// Runs only in CI; the key and token come from GitHub secrets.

import { citedCardShortLink } from './lib/pr-card-link.mjs'
import { commentOnce, createTrelloClient } from './lib/trello-client.mjs'

const shortLink = citedCardShortLink(process.env.PR_BODY)
if (!shortLink) {
  console.log('No "Card: https://trello.com/c/..." line in the PR body; nothing to comment on.')
  process.exit(0)
}

const { COMMENT, TRELLO_API_KEY, TRELLO_TOKEN } = process.env
if (!COMMENT) throw new Error('COMMENT is empty')
if (!TRELLO_API_KEY || !TRELLO_TOKEN) throw new Error('TRELLO_API_KEY or TRELLO_TOKEN is not set')

const trello = createTrelloClient(TRELLO_API_KEY, TRELLO_TOKEN)

// Previews redeploy on every push with the same URL, so post each comment once.
if (await commentOnce(trello, shortLink, COMMENT)) {
  console.log(`Commented on card ${shortLink}.`)
} else {
  console.log(`Card ${shortLink} already has this comment; skipping.`)
}
