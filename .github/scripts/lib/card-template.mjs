// Checks whether a Trello card is "fully templated": the title is "Subject: outcome",
// it carries exactly one of the three labels, and every heading that label's template
// requires has non-empty text under it. Mirrors /card step 1.4's refusal rules, so a
// title-only stub is treated the same way by a manual dispatch and an automatic one.

const TEMPLATES = {
  Feature: ['Goal', 'Done means', 'Out of scope', 'Notes'],
  Tooling: ['Goal', 'Done means', 'Out of scope', 'Notes'],
  Bug: ['Observed', 'Expected', 'Steps to reproduce', 'Notes'],
}

export function cardLabel(card) {
  const names = (card.labels ?? []).map((label) => label.name)
  if (names.length !== 1) return null
  return TEMPLATES[names[0]] ? names[0] : null
}

function sections(desc) {
  const found = new Map()
  const re = /\*\*(.+?)\*\*[ \t]*\n([\s\S]*?)(?=\n\*\*.+?\*\*|$)/g
  for (const match of desc.matchAll(re)) found.set(match[1].trim(), match[2].trim())
  return found
}

export function isFullyTemplated(card) {
  if (!/^.+:\s+\S/.test(card.name ?? '')) {
    return { ok: false, reason: 'title is not "Subject: outcome"' }
  }
  const label = cardLabel(card)
  if (!label) return { ok: false, reason: 'label is not exactly one of Feature, Bug, Tooling' }

  const found = sections(card.desc ?? '')
  for (const heading of TEMPLATES[label]) {
    if (!found.get(heading))
      return { ok: false, reason: `"${heading}" section is missing or empty` }
  }
  return { ok: true, label }
}
