// The marker comment that tells the auto-picker (trello-fetch-card.mjs) a card's Done
// means can only be satisfied by something Claude can't do, so it should be skipped
// rather than attempted and flagged as failed.

const MARKER = 'human-only'

export function isHumanOnly(comments) {
  return comments.some((action) => action.data.text.trim() === MARKER)
}
