// Whether a Requests card is due for (re-)triage this run. Comments come from Trello's
// /actions endpoint, newest first. The triage agent's own comments always start with
// TRIAGE_PREFIX (matched the same way no-pr-comment.mjs's build comment is), since the
// Trello token authenticates as a personal account, not a distinct bot member — there's
// no author field to key off instead.
//
// Eligible means: no triage comment yet, or a human commented after the triage agent's
// own most recent comment. Not eligible means the agent's own comment is still the last
// word on the card — it's waiting on a reply.

export const TRIAGE_PREFIX = 'Triage: '

export function isEligibleForTriage(comments) {
  const [latest] = comments
  return !latest?.data?.text?.startsWith(TRIAGE_PREFIX)
}
