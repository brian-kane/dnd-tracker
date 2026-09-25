// The "Card: <trello link>" line every PR body carries (CLAUDE.md's commit/PR format),
// linking a GitHub PR back to the Trello card it implements.

const CARD_LINE = /^Card: https:\/\/trello\.com\/c\/([A-Za-z0-9]+)/m

export function citedCardShortLink(prBody) {
  return CARD_LINE.exec(prBody ?? '')?.[1] ?? null
}
