// Validates the `draft` job's drafts.json against the card ids it was actually given
// and the board's own template rules (reusing isFullyTemplated, so a draft is held to
// exactly the same bar /card and build.yml already enforce). This is the code boundary
// for the triage agent's write scope: an entry naming any other card id, or one that
// doesn't parse, is rejected here rather than trusted — the agent itself never touches
// Trello.

import { isFullyTemplated } from './card-template.mjs'

const LABELS = ['Feature', 'Bug', 'Tooling']

function validateDraftEntry(entry) {
  if (typeof entry.name !== 'string' || !entry.name.trim()) return 'draft name is missing'
  if (typeof entry.desc !== 'string' || !entry.desc.trim()) return 'draft desc is missing'
  if (!LABELS.includes(entry.suggestedLabel))
    return 'suggestedLabel is not one of Feature, Bug, Tooling'
  const templated = isFullyTemplated({
    name: entry.name,
    desc: entry.desc,
    labels: [{ name: entry.suggestedLabel }],
  })
  if (!templated.ok) return `draft is not fully templated: ${templated.reason}`
  return null
}

function validateQuestionsEntry(entry) {
  if (!Array.isArray(entry.questions) || entry.questions.length === 0) return 'questions is empty'
  if (entry.questions.some((question) => typeof question !== 'string' || !question.trim()))
    return 'a question is empty'
  return null
}

// Returns { valid, errors }: valid is the subset of drafts safe to apply, in the shape
// apply.mjs expects; errors names every rejected entry and why.
export function validateDrafts(drafts, eligibleCardIds) {
  const valid = []
  const errors = []
  if (!Array.isArray(drafts)) return { valid, errors: ['drafts.json is not an array'] }

  const seen = new Set()
  for (const entry of drafts) {
    const cardId = entry?.cardId
    if (typeof cardId !== 'string' || !eligibleCardIds.has(cardId)) {
      errors.push(`entry references an unknown or out-of-scope cardId: ${JSON.stringify(cardId)}`)
      continue
    }
    if (seen.has(cardId)) {
      errors.push(`duplicate entry for cardId ${cardId}`)
      continue
    }
    seen.add(cardId)

    const reason =
      entry.outcome === 'draft'
        ? validateDraftEntry(entry)
        : entry.outcome === 'questions'
          ? validateQuestionsEntry(entry)
          : `outcome is not "draft" or "questions": ${JSON.stringify(entry.outcome)}`
    if (reason) {
      errors.push(`cardId ${cardId}: ${reason}`)
      continue
    }
    valid.push(entry)
  }
  return { valid, errors }
}
