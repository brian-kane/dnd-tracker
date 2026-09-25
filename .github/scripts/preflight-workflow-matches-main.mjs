// Fails fast, before any Trello or agent work, when the workflow file actually running
// differs from the default branch's copy of it. The Claude GitHub App's OIDC token
// exchange silently refuses to authenticate unless they're byte-identical, so continuing
// would only waste agent turns chasing a run that can never open a PR (see README's
// "Build from a card").

import { mismatchMessage } from './lib/workflow-preflight.mjs'

const { GITHUB_TOKEN, GITHUB_REPOSITORY, WORKFLOW_FILE, WORKFLOW_SHA } = process.env
if (!GITHUB_TOKEN || !GITHUB_REPOSITORY)
  throw new Error('GITHUB_TOKEN or GITHUB_REPOSITORY is not set')
if (!WORKFLOW_FILE) throw new Error('WORKFLOW_FILE is not set')
if (!WORKFLOW_SHA) throw new Error('WORKFLOW_SHA is not set')

async function fetchWorkflowFile(ref) {
  const url = new URL(`https://api.github.com/repos/${GITHUB_REPOSITORY}/contents/${WORKFLOW_FILE}`)
  if (ref) url.searchParams.set('ref', ref)
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.raw+json',
    },
  })
  if (!res.ok)
    throw new Error(
      `GET contents/${WORKFLOW_FILE}${ref ? `@${ref}` : ''}: ${res.status} ${await res.text()}`,
    )
  return res.text()
}

const [running, onDefaultBranch] = await Promise.all([
  fetchWorkflowFile(WORKFLOW_SHA),
  fetchWorkflowFile(undefined),
])

if (running !== onDefaultBranch) {
  console.log(`::error::${mismatchMessage(WORKFLOW_FILE)}`)
  process.exitCode = 1
} else {
  console.log(`${WORKFLOW_FILE} matches the default branch; continuing.`)
}
