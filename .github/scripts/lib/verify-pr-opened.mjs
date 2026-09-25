// Finds the PR (if any) this run's card ended up with, among PRs sorted newest first.
// A run can report success internally without ever pushing a branch or opening a PR,
// so this is what actually confirms something was produced.

import { citedCardShortLink } from './pr-card-link.mjs'

export function findCardPr(pulls, shortLink, runStartedAt) {
  for (const pr of pulls) {
    // Sorted newest first: once a PR predates this run, every later one does too, and
    // an older PR citing the same card is a prior attempt, not this run's result.
    if (runStartedAt && pr.created_at < runStartedAt) break
    if (citedCardShortLink(pr.body) === shortLink) return pr
  }
  return null
}
