// The error message printed when a workflow file on its own ref doesn't match the
// default branch's copy. Shared so the wording stays identical to what README
// documents as the enforced check.

export function mismatchMessage(workflowFile) {
  return (
    `${workflowFile} on this ref differs from the default branch. The Claude GitHub ` +
    `App's OIDC token exchange refuses to authenticate unless the running workflow ` +
    `file is byte-identical to the default branch's, so this run cannot open a PR no ` +
    `matter what happens next. Merge this change first, then re-run it from the default branch.`
  )
}
