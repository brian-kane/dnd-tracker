// Fetches a Trello card for the `build` workflow and writes it to card.json, so the
// `build` job (which holds no Trello secrets) can read it without connector access.
//
// Two modes, both refusing anything not fully templated: that's what "approved" means
// here, and it's the only thing standing between an unreviewed card and it building
// itself into a PR.
// - CARD_URL set (manual dispatch): fetch that one card, refusing it if it isn't
//   sitting in Up Next or isn't fully templated.
// - CARD_URL unset (scheduled run): walk Up Next in order and pick the first card
//   that's fully templated, has no open or merged PR yet, and hasn't already failed
//   RETRY_CAP times — a closed, unmerged PR and a "no PR opened" run (the flag-no-pr
//   comment left on the card) both count as a strike — flagging it with a Trello
//   comment the first time it hits that cap instead of retrying it forever.

import { appendFile, writeFile } from 'node:fs/promises'
import { isFullyTemplated } from './lib/card-template.mjs'
import { countNoPrAttempts } from './lib/no-pr-comment.mjs'
import { citedCardShortLink } from './lib/pr-card-link.mjs'
import { commentOnce, createTrelloClient } from './lib/trello-client.mjs'

const BOARD_ID = '6ab3e35b7e9b2eaeb388baf0' // DnD Tracker
const UP_NEXT_LIST_ID = '6ab3e50d9f8a71acd51b0b5a' // Up Next, on that board
const RETRY_CAP = 3
const CARD_FIELDS = 'id,name,desc,idBoard,idList,shortLink,shortUrl,labels'

const { CARD_URL, TRELLO_API_KEY, TRELLO_TOKEN, GITHUB_TOKEN, GITHUB_REPOSITORY, GITHUB_OUTPUT } =
  process.env
if (!TRELLO_API_KEY || !TRELLO_TOKEN) throw new Error('TRELLO_API_KEY or TRELLO_TOKEN is not set')

const trello = createTrelloClient(TRELLO_API_KEY, TRELLO_TOKEN)

// Maps a card's shortLink to whether it already has an open or merged PR, and how many
// closed-unmerged PRs cite it. Reads the live pull list, not GitHub's search index,
// which lags behind a PR just opened or merged.
async function fetchPrStatus() {
  if (!GITHUB_TOKEN || !GITHUB_REPOSITORY)
    throw new Error('GITHUB_TOKEN or GITHUB_REPOSITORY is not set')
  const githubHeaders = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
  }
  const status = new Map()
  for (let page = 1; ; page++) {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_REPOSITORY}/pulls?state=all&per_page=100&page=${page}`,
      { headers: githubHeaders },
    )
    if (!res.ok) throw new Error(`GET pulls page ${page}: ${res.status} ${await res.text()}`)
    const pulls = await res.json()
    if (pulls.length === 0) break
    for (const pr of pulls) {
      const shortLink = citedCardShortLink(pr.body)
      if (!shortLink) continue
      const entry = status.get(shortLink) ?? { active: false, closedUnmerged: 0 }
      if (pr.state === 'open' || pr.merged_at) entry.active = true
      else entry.closedUnmerged += 1
      status.set(shortLink, entry)
    }
    if (pulls.length < 100) break
  }
  return status
}

async function flagFailedCard(card, strikes) {
  const text = `Failed ${strikes} times (closed PRs and/or no-PR attempts); needs a human look.`
  if (await commentOnce(trello, card.id, text)) console.log(`Flagged card "${card.name}": ${text}`)
}

async function selectManualCard() {
  const match = /trello\.com\/c\/([A-Za-z0-9]+)/.exec(CARD_URL)
  if (!match) throw new Error(`Not a Trello card URL: ${CARD_URL}`)
  const card = await trello(`/cards/${match[1]}?fields=${CARD_FIELDS}&labels=true`)
  if (card.idBoard !== BOARD_ID || card.idList !== UP_NEXT_LIST_ID) {
    throw new Error(
      `Card "${card.name}" is not in Up Next on the DnD Tracker board; refusing to build it.`,
    )
  }
  const templated = isFullyTemplated(card)
  if (!templated.ok)
    throw new Error(`Card "${card.name}" is not fully templated: ${templated.reason}`)
  return card
}

async function selectAutoCard() {
  const cards = await trello(`/lists/${UP_NEXT_LIST_ID}/cards?fields=${CARD_FIELDS}&labels=true`)
  const prStatus = await fetchPrStatus()

  for (const card of cards) {
    const templated = isFullyTemplated(card)
    if (!templated.ok) {
      console.log(`Skipping "${card.name}": ${templated.reason}.`)
      continue
    }
    const status = prStatus.get(card.shortLink) ?? { active: false, closedUnmerged: 0 }
    if (status.active) {
      console.log(`Skipping "${card.name}": already has an open or merged PR.`)
      continue
    }
    const comments = await trello(`/cards/${card.id}/actions?filter=commentCard`)
    const strikes = status.closedUnmerged + countNoPrAttempts(comments)
    if (strikes >= RETRY_CAP) {
      console.log(`Skipping "${card.name}": ${strikes} strikes (closed PRs and/or no-PR attempts).`)
      await flagFailedCard(card, strikes)
      continue
    }
    return card
  }
  return null
}

const card = CARD_URL ? await selectManualCard() : await selectAutoCard()

if (GITHUB_OUTPUT) await appendFile(GITHUB_OUTPUT, `selected=${Boolean(card)}\n`)

if (!card) {
  console.log('No eligible card in Up Next; nothing to build.')
  process.exit(0)
}

await writeFile('card.json', JSON.stringify(card, null, 2))
console.log(`Selected card "${card.name}" (${card.shortUrl}).`)
