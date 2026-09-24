// Posts COMMENT on the Trello card linked from the PR body ("Card: <link>").
// Runs only in CI; the key and token come from GitHub secrets.

const match = /^Card: https:\/\/trello\.com\/c\/([A-Za-z0-9]+)/m.exec(process.env.PR_BODY ?? '')
if (!match) {
  console.log('No "Card: https://trello.com/c/..." line in the PR body; nothing to comment on.')
  process.exit(0)
}

const { COMMENT, TRELLO_API_KEY, TRELLO_TOKEN } = process.env
if (!COMMENT) throw new Error('COMMENT is empty')
if (!TRELLO_API_KEY || !TRELLO_TOKEN) throw new Error('TRELLO_API_KEY or TRELLO_TOKEN is not set')

// A header keeps the credentials out of URLs, which can end up in logs.
const headers = {
  Authorization: `OAuth oauth_consumer_key="${TRELLO_API_KEY}", oauth_token="${TRELLO_TOKEN}"`,
}
const card = `https://api.trello.com/1/cards/${match[1]}`

async function trello(url, init) {
  const res = await fetch(url, { ...init, headers })
  if (!res.ok) throw new Error(`${init?.method ?? 'GET'} ${url}: ${res.status} ${await res.text()}`)
  return res.json()
}

// Previews redeploy on every push with the same URL, so post each comment once.
const comments = await trello(`${card}/actions?filter=commentCard`)
if (comments.some((action) => action.data.text === COMMENT)) {
  console.log(`Card ${match[1]} already has this comment; skipping.`)
  process.exit(0)
}

await trello(`${card}/actions/comments?${new URLSearchParams({ text: COMMENT })}`, {
  method: 'POST',
})
console.log(`Commented on card ${match[1]}.`)
