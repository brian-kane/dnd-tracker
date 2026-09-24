// Turns `git log` into changelog entries. Pure (no Node imports) so the app's
// type declarations can reference ChangelogEntry; callers run git themselves
// with CHANGELOG_GIT_ARGS and pass its output to parseChangelog.

export const CHANGELOG_TYPES = ['feat', 'fix', 'chore', 'ci', 'build'] as const

export interface ChangelogEntry {
  readonly sha: string
  readonly type: (typeof CHANGELOG_TYPES)[number]
  readonly scope: string
  readonly outcome: string
  /** Commit date as YYYY-MM-DD; for a squash merge on main, the merge date. */
  readonly date: string
}

const FIELD = '\x1f'

// --first-parent walks main's own history (one squash commit per PR) and, on
// CI's temporary PR merge commit, skips the branch's working commits.
export const CHANGELOG_GIT_ARGS = [
  'log',
  '--first-parent',
  `--format=%H${FIELD}%cs${FIELD}%s`,
] as const

// Same format the pr-title workflow enforces on every squash commit.
const SUBJECT = new RegExp(`^(${CHANGELOG_TYPES.join('|')})\\(([a-z0-9-]+)\\): (.+)$`)
const SHA = /^[0-9a-f]{40}$/
const DATE = /^\d{4}-\d{2}-\d{2}$/

function isChangelogType(type: string): type is ChangelogEntry['type'] {
  return CHANGELOG_TYPES.some((known) => known === type)
}

/**
 * Newest first, as git prints them. Commits whose subject isn't in the
 * `type(scope): outcome` format (e.g. CI's "Merge x into y") are skipped.
 */
export function parseChangelog(gitLogOutput: string): ChangelogEntry[] {
  const entries: ChangelogEntry[] = []
  for (const line of gitLogOutput.split('\n')) {
    if (line === '') continue
    const [sha, date, subject, ...rest] = line.split(FIELD)
    if (
      sha === undefined ||
      date === undefined ||
      subject === undefined ||
      rest.length > 0 ||
      !SHA.test(sha) ||
      !DATE.test(date)
    ) {
      throw new Error(`Unexpected git log line: ${JSON.stringify(line)}`)
    }
    const match = SUBJECT.exec(subject)
    const [, type, scope, outcome] = match ?? []
    if (type === undefined || scope === undefined || outcome === undefined) continue
    if (!isChangelogType(type)) throw new Error(`Unknown commit type "${type}"`)
    entries.push({ sha, type, scope, outcome, date })
  }
  return entries
}
