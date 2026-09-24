# Security

A personal project with no user accounts and no server-side data: the app itself is a
static site holding one person's D&D session state in the browser. The things worth
protecting are the source, the build pipeline, and the accounts/tokens that can change
either.

## Threat model

**Assets:** the source on `main` (what gets deployed), the CI pipeline (what deploys
it), and the tokens that can push code, deploy, or reach Trello.

| Entry point                                                 | Control                                                                                                                                                                                                                                                                                                                                                                                               |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| npm packages (supply chain)                                 | `package-lock.json` committed, `npm ci` everywhere (no arbitrary installs); `npm audit --audit-level=high` in CI; GitHub Dependabot alerts and CodeQL (JS/TS + Actions) enabled.                                                                                                                                                                                                                      |
| PR and Trello card text (untrusted input read by CI/agents) | Never interpolated into a shell string — passed through `env:` (`trello-comment.mjs`, `pr-title.yml`). `review.yml`'s prompt treats `gh pr diff` output as code to review, not instructions, and is advisory-only (no write/approve access). `.claude/hooks/guard-trello.sh` forces a confirmation on every Trello write except a card move, so a card's own text can't get itself edited unattended. |
| CI (`.github/workflows/`)                                   | Third-party actions pinned to commit SHAs; `permissions:` set to the minimum each job needs (most are `contents: read` or less); secrets are unavailable to PRs from forks (the `preview` job's `if`); `main` is protected by a ruleset requiring the `check` and `pr-title` status checks.                                                                                                           |
| Cloud sessions (Claude Code on the web)                     | Hold no Trello or Firebase secrets (only CI does); GitHub access goes through the Claude GitHub App's proxy, scoped to this repo; `scripts/setup.sh` is the only thing the `SessionStart` hook runs automatically.                                                                                                                                                                                    |
| Local agent shell/tool use                                  | `.claude/settings.json` denies reading `.env*` files and requires confirmation for anything outside its allowlist; `.claude/hooks/guard-bash.sh` blocks force-push and `rm -rf`/`.git` deletion regardless of permission mode.                                                                                                                                                                        |
| Hosting (Firebase)                                          | CSP, `X-Content-Type-Options`, and `Referrer-Policy` set in `firebase.json`; HSTS is sent unconditionally by Firebase Hosting itself. `e2e/security-headers.spec.ts` checks all four are present on the preview and that the app still renders under the CSP.                                                                                                                                         |
| Tokens (see inventory below)                                | Scoped as narrowly as each provider allows; stored only as GitHub Actions secrets, never in the repo.                                                                                                                                                                                                                                                                                                 |

## GitHub security features

Secret scanning (with push protection), Dependabot alerts, and CodeQL default setup
(JavaScript/TypeScript + GitHub Actions) are all on for this repo — free for a public
repo. Check `Settings → Code security` to confirm they're still enabled.

## Credentials inventory

| Token                                        | Lives in                             | Can do                                                                                                                 | To revoke                                                                                                         |
| -------------------------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `FIREBASE_SERVICE_ACCOUNT_DND_TRACKER_2C66F` | GitHub Actions secret                | Deploy to this Firebase Hosting project only                                                                           | Delete the service account (or its key) in Google Cloud Console → IAM, then re-run `firebase init hosting:github` |
| `TRELLO_API_KEY` / `TRELLO_TOKEN`            | GitHub Actions secrets               | Read/write access to **all** boards on the Trello account (Trello tokens aren't board-scoped) — a known, accepted risk | Trello → Settings → Applications, or revoke at trello.com/app-key; then set new secrets                           |
| `CLAUDE_CODE_OAUTH_TOKEN`                    | GitHub Actions secret                | Run Claude Code in Actions (`review.yml`), billed to this account's plan                                               | Anthropic Console → revoke the token, then `gh secret set` a new one                                              |
| Trello connector OAuth (used by `/card`)     | Claude.ai account, not a repo secret | Same all-boards read/write reach as the CI token, from any Claude Code session                                         | Trello → Settings → Applications → revoke "Claude"                                                                |
| `GITHUB_TOKEN`                               | Auto-issued per workflow run         | Whatever that job's `permissions:` block grants; expires when the run ends                                             | Nothing to revoke — scope is fixed in the workflow file                                                           |

## Out of scope

- Firestore and Firebase Auth security rules — they arrive with sync, not before.
- Penetration testing.
