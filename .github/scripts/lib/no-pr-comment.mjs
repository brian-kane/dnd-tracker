// The comment flag-no-pr.mjs leaves on a card when a build run produced no PR. Shared
// so the text posted and the text counted toward the retry cap can never drift apart.

const PREFIX = 'Automated build produced no PR: '

export function noPrCommentText(runUrl) {
  return `${PREFIX}${runUrl}`
}

export function countNoPrAttempts(comments) {
  return comments.filter((action) => action.data.text.startsWith(PREFIX)).length
}
