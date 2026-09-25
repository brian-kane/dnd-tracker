// A minimal Trello REST client shared by the CI scripts that read or write cards. A
// header keeps credentials out of URLs, which can end up in logs.

export function createTrelloClient(apiKey, token) {
  const headers = { Authorization: `OAuth oauth_consumer_key="${apiKey}", oauth_token="${token}"` }
  return async function trello(path, init) {
    const res = await fetch(`https://api.trello.com/1${path}`, { ...init, headers })
    if (!res.ok)
      throw new Error(`${init?.method ?? 'GET'} ${path}: ${res.status} ${await res.text()}`)
    return res.json()
  }
}

// Posts TEXT as a comment on cardId, unless an identical comment is already there —
// several of these scripts can re-check the same condition on a later run, and a card
// shouldn't collect a duplicate comment each time. Returns whether it posted.
export async function commentOnce(trello, cardId, text) {
  const comments = await trello(`/cards/${cardId}/actions?filter=commentCard`)
  if (comments.some((action) => action.data.text === text)) return false
  await trello(`/cards/${cardId}/actions/comments?${new URLSearchParams({ text })}`, {
    method: 'POST',
  })
  return true
}
