# D&D Tracker

[![CI](https://github.com/brian-kane/dnd-tracker/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/brian-kane/dnd-tracker/actions/workflows/ci.yml?query=branch%3Amain)

A personal D&D 5e (2014 rules) play companion for tracking a character's live state during sessions: HP, temp HP, spell slots, concentration, conditions, companions, transformation forms, item uses, and rests.

Built with Vue 3, TypeScript, and Vite.

## Time to first commit

On a new machine (Linux or WSL2, Ubuntu-based):

1. Prerequisites, each installed per its own docs:
   - [git](https://git-scm.com/downloads)
   - [GitHub CLI](https://cli.github.com/) — then `gh auth login`
   - a Node version manager (e.g. [fnm](https://github.com/Schniz/fnm)) — install the version pinned in `.node-version`
   - [Claude Code](https://docs.claude.com/en/docs/claude-code/setup) — `npm install -g @anthropic-ai/claude-code`, then run `claude` and sign in (`/login` if it doesn't prompt)
2. `gh repo clone brian-kane/dnd-tracker ~/code/dnd-tracker && cd ~/code/dnd-tracker` — this repo's convention is `~/code/<name>`, not `~/<name>`.
3. `scripts/setup.sh` — installs dependencies (`npm ci`), `jq`, and Playwright's Chromium. It uses sudo only when `jq` or Chromium's system libraries are missing, and is safe to re-run.
4. `npm run check && npm run test:e2e` — both should pass.
5. `npm run dev`, then open the URL Vite prints (usually http://localhost:5173).

`scripts/setup.sh` is the one environment definition: CI and Claude Code cloud sessions run it too.

## Separate WSL distro for personal projects

On Windows, this repo lives in its own WSL2 distro (`Ubuntu-24.04` here), separate from any work distro on the same PC. `npm install` scripts and agent shell commands run as your Linux user, with access to everything that user can read; a second distro gives a separate home folder, so a personal-project agent or npm package can't see work code or work credentials, and vice versa. This distro holds `dnd-tracker`, your personal git identity, `gh` login, Claude Code login, and (once added) Firebase login — nothing from work.

To set one up: `wsl --install -d <distro>` (or `wsl --import` from a tarball) from Windows, then follow "Time to first commit" above inside it. Each distro is its own Linux user environment, so tools and logins (git, `gh`, Claude Code) are installed and signed in per distro.

Known gotchas, not bugs to fix:

- **Shared Windows drive:** every distro can still read and write `/mnt/c`, so keep credentials and sensitive files off it — this is a limitation of the split, not something distro separation removes.
- **TLS-inspecting networks:** a `curl`-based install (e.g. fnm) can fail with "SSL certificate problem: self-signed certificate in certificate chain". Fix: copy the corporate CA cert from an already-working distro's `/usr/local/share/ca-certificates/` into the new one and run `sudo update-ca-certificates`.
- **WSL interop:** calling a Windows `.exe` from inside a fresh distro (including VS Code's `code .`) can fail with "Exec format error" — WSL interop not registered, a known issue on systemd-enabled Ubuntu images. Fix: `sudo tee /etc/binfmt.d/WSLInterop.conf <<< ':WSLInterop:M::MZ::/init:PF'` then `sudo systemctl restart systemd-binfmt`. Interop stays enabled (`[interop] enabled=true`, the default) because VS Code's WSL extension needs it; that also means a distro can still launch another distro's binaries, which the split otherwise avoids — an accepted limitation, not one this setup closes.
- **VS Code:** open the repo through the WSL extension while it's connected to the right distro. UI extensions (themes, icon packs) run in Windows and show up everywhere; workspace extensions (ESLint, language servers) run per-distro — `.vscode/extensions.json` prompts to install this repo's on first open, in any distro. Personal-taste UI settings carry over via VS Code Settings Sync.
- **Claude Code connectors:** Trello, Google Drive, and Claude Docs access comes from claude.ai account-level connectors, synced into Claude Code automatically from whichever account is logged in (`claude mcp list` shows them prefixed `claude.ai *`). Nothing to register per distro — run `claude /login` with the same account and start a fresh session; the sync only happens at session start.

## Cloud sessions (Claude Code on the web)

Work a card from a phone or browser with no local machine involved: a cloud session clones the repo onto an Anthropic-managed VM, runs `/card`, and pushes the branch; CI then builds the preview and comments on the Trello card. The session reads and moves cards through the Trello connector and holds no Trello or Firebase secrets; CI holds those.

How the VM gets set up:

- The environment's **setup script** runs `scripts/setup.sh` once, as root, and the result is cached for about 7 days.
- Cloud sessions use the VM's Node 22, since the VM has no supported way to change its default Node. The script accepts any Node in the `engines` range of `package.json`; CI and local machines use the version in `.node-version`.
- A `SessionStart` hook in `.claude/settings.json` runs the same script at the start of every cloud session (it does nothing locally), so a lockfile or Playwright change since the cache was built is picked up.
- `scripts/setup.sh` installs `gh` (Ubuntu's own package, no extra apt repo) if it's missing.
- GitHub access goes through the cloud's GitHub proxy, using the Claude GitHub App, with no token of your own. The proxy allows `git push` to any branch, not just the session's working branch, and REST calls (`gh api`), but blocks GraphQL, which `gh pr create`, `gh pr view`, `gh pr checks` and `gh pr merge` use — so `/card`'s PR steps go through `gh api` instead, the same way locally and in the cloud. The proxy also re-appends a "Generated with Claude Code" footer to every PR body write it makes; that can't be stripped from a cloud session, but the squash merge sets its commit message explicitly, so main stays clean regardless.
- The Trello connector's tools are named `mcp__Trello__*` in a cloud session and `mcp__claude_ai_Trello__*` locally. `.claude/settings.json` and `/card` list both, and `guard-trello.test.sh` fails `npm run check` if a Trello rule is missing its twin.
- `attribution.sessionUrl` is off in `.claude/settings.json`, so commits and PR bodies keep the format in `CLAUDE.md`.

One-time setup, in a browser:

1. Install the Claude GitHub App on this repo only: open https://github.com/apps/claude, click **Configure** (or **Install**), choose your account, select **Only select repositories**, pick `dnd-tracker`, and click **Save**.
2. Open https://claude.ai/code and finish onboarding if asked (connect GitHub; skip `/web-setup`, which uploads a local `gh` token).
3. Click the cloud icon with the environment name, in the row above the message box, then **Add cloud environment**:
   - **Name:** `dnd-tracker`
   - **Network access:** **Custom**. Leave **Also include default list of common package managers** unchecked, and set **Allowed domains** to:
     ```text
     registry.npmjs.org
     cdn.playwright.dev
     storage.googleapis.com
     playwright.download.prss.microsoft.com
     archive.ubuntu.com
     security.ubuntu.com
     ```
     `cdn.playwright.dev` redirects the Chromium download to `storage.googleapis.com`, so both are needed. GitHub doesn't need listing; it goes through its own proxy.
   - **Environment variables:** none.
   - **Setup script:**
     ```bash
     #!/bin/bash
     bash /home/user/dnd-tracker/scripts/setup.sh
     ```
     (The setup script runs from `/home/user`, with the repo cloned to `/home/user/dnd-tracker`.)
   - Click **Create environment**.

To work a card: at claude.ai/code (or the **Code** tab of the Claude app), pick the `brian-kane/dnd-tracker` repo, the `main` branch, and the `dnd-tracker` environment, make sure the Trello connector is on for the session, then send `/card` (or `/card <title>`) as the first message.

## Other commands

```sh
npm run build      # type-check and build for production
npm run check      # typecheck + tests + lint + hook and workflow checks (what CI runs)
npm run typecheck  # type-check only
npm test           # run unit tests once
npm run test:unit  # run unit tests in watch mode
npm run test:e2e   # build, then run Playwright acceptance tests (Chromium, headless)
npm run lint       # lint and auto-fix
npm run format     # format src/ with Prettier
```

## Hosting

The app is hosted on Firebase Hosting (project `dnd-tracker-2c66f`, free Spark plan) at https://dnd-tracker-2c66f.web.app.

- **PR previews:** after CI's `check` job passes, every PR from this repo is deployed to a preview channel, and the URL is posted as a comment on the PR. Previews expire after 7 days.
- **Live:** merging to main deploys to the live site.
- **Build info:** the footer shows the commit hash (linked to GitHub) and build time. Builds read the hash from `BUILD_SHA`, falling back to `git rev-parse HEAD`; CI sets it to the PR's head commit, because a PR checkout is GitHub's temporary merge commit.
- **Changelog:** a collapsible list above the footer shows every `type(scope): outcome` commit on the first-parent history, newest first, each linked to GitHub. It's generated from `git log` at build time, so builds need full history: a shallow clone fails the build (`git fetch --unshallow` fixes it) and CI checks out with `fetch-depth: 0`.
- **Security headers:** `firebase.json` sends a CSP, `X-Content-Type-Options`, and `Referrer-Policy`; Firebase Hosting adds HSTS on its own. The `preview` job checks all four are present, and that the app still renders under the CSP, with `e2e/security-headers.spec.ts`.
- **Cache headers:** `firebase.json` caches hashed files under `dist/assets/` (Vite's build output) as `immutable` for a year; everything else, including `index.html`, is `no-cache` so a deploy is always picked up on the next visit. `e2e/security-headers.spec.ts` checks both.

Both deploys use the build that `check` produced and are defined in `.github/workflows/ci.yml`. Their only credential is the `FIREBASE_SERVICE_ACCOUNT_DND_TRACKER_2C66F` GitHub secret. See [SECURITY.md](SECURITY.md) for the full threat model and credentials inventory.

## Wish intake

The board's **Requests** list has a Trello email-to-board address. The app's "Send a wish" link opens a `mailto:` to that address with the subject pre-filled, so anyone can send an idea from their phone with no account or app. The board description also explains how to send a wish by plain email.

The address itself isn't committed — it's read from the `VITE_WISH_EMAIL` env var, which Vite inlines into the build. The link doesn't render if it's unset, so a missing var degrades the feature instead of breaking the app.

- **Local:** add it to `.env.local` (gitignored):
  ```sh
  VITE_WISH_EMAIL=<the Requests list's email-to-board address>
  ```
- **CI:** set it once with `gh secret set VITE_WISH_EMAIL` (asks for the value at the prompt) so the `check` job's build has it too.

To find or regenerate the address: Trello board menu → Settings → Email-to-board.

### Triage a wish (no machine involved)

`.github/workflows/triage.yml` turns a raw Requests card into a well-shaped card, or a
clarifying question, the same unattended shape as `build.yml`: three jobs, the middle
one holding no Trello credentials. It runs three times a day on the same schedule as
`build.yml`, and can also be dispatched manually.

- **`fetch-requests` job:** the only job holding Trello credentials. It reads every
  Requests card plus the board's own live description (the source for this round's
  card-template headings and label conventions, so they can evolve without a prompt
  going stale) and hands eligible cards to `draft` as an artifact (`requests.json`),
  never as Trello access. "Eligible" means no triage comment yet, or a human replied
  after the triage agent's own last comment on that card — otherwise it's either
  already drafted and awaiting approval, or already asked and awaiting an answer, and
  is skipped silently.
- **`draft` job:** Haiku, capped at 20 turns, with only `Read` and `Write` on the
  working directory — no Trello tools, no repo checkout, no Bash. For each card it
  either drafts a full template (stating assumptions in Notes) or, when it can't
  without guessing specifics, asks clarifying questions instead — both written to
  `drafts.json`, never to Trello directly. Wish text and comments are untrusted input,
  read as data to draft from, never as instructions. Same denial-handling instruction
  as `build.yml`/`review.yml`: a denied tool call is terminal for that approach, not a
  reason to retry.
- **`apply` job:** holds Trello credentials again, but no model. `triage-validate.mjs`
  (reusing `card-template.mjs`'s `isFullyTemplated`) is the actual code boundary for
  the agent's write scope: an entry naming any card id outside the ones `fetch-requests`
  handed over, or one that doesn't parse, is rejected rather than trusted. A valid draft
  rewrites the card's title/desc and leaves a `Triage: drafted…` comment; valid
  questions leave a `Triage: …` comment instead. It never moves, archives, or labels a
  card — approval (attaching the label, moving the card to Up Next) stays manual.
- **Kill switch:** the repo variable `TRIAGE_PAUSED` (`gh variable set TRIAGE_PAUSED --body true`) skips every scheduled run, the same as `BUILD_PAUSED` does for builds.
- **Trust boundary, accepted:** the Trello token itself is still all-boards read/write
  (see `SECURITY.md`), so the write-scope enforcement above is what actually stands
  between untrusted wish text and the rest of the board — not a permission the API can
  restrict.
- Editing the board description itself (used to seed the card-template text above)
  isn't something the Trello connector's write tool can do (it only supports creating a
  board, not updating one) — Trello's own REST API has no such limit, so
  `.github/scripts/trello-update-board.mjs` is a one-off script, run locally with the
  same `TRELLO_API_KEY`/`TRELLO_TOKEN` the CI scripts use:
  `TRELLO_API_KEY=... TRELLO_TOKEN=... NODE_OPTIONS=--use-system-ca node .github/scripts/trello-update-board.mjs <path to new description file>`.
  `NODE_OPTIONS=--use-system-ca` matters on a machine where TLS is intercepted (a
  corporate proxy or antivirus, typically) — Node ships its own CA list and won't trust
  that interception cert by default, even though `curl` and the browser do because they
  read the OS trust store; this flag makes Node read it too.

## Performance

"It's fast" is measured and enforced, not a hope — every PR proves it didn't make things slower.

- **Lighthouse:** the `preview` job runs Lighthouse CI (`treosh/lighthouse-ci-action`) against the real deployed preview, 3 times, taking the median. Budgets are in `lighthouserc.json`:
  - **Performance score** ≥ 0.98 — Lighthouse's overall rollup of the metrics below. Currently a perfect 1.0.
  - **LCP** (Largest Contentful Paint) ≤ 600ms — how long the main content takes to appear; the metric users feel as "is it loaded yet". Currently 266–397ms.
  - **CLS** (Cumulative Layout Shift) ≤ 0.02 — how much visible content jumps around while loading; above this, users misclick. Currently 0.
  - **TBT** (Total Blocking Time) ≤ 50ms — how long the main thread is too busy to respond to input during load; a lab stand-in for INP, since a scripted run has no real user input to measure INP from. Currently 0–6ms.
  - A budget failure fails the PR. Fork PRs don't get this check — see `SECURITY.md`.
- **Bundle size:** `scripts/bundle-size.mjs` sums the gzipped size of `dist/assets/*.js` and `*.css` and fails `check` if either exceeds the budget in the script. It also compares against the size from main's own last run (a workflow artifact) and reports the change in the job's step summary; with no baseline yet, it reports the absolute size only.
- **CI job duration:** the `check` job times itself and warns (doesn't fail) in its step summary if it goes over the target in `.github/workflows/ci.yml`.

Budgets started a little under measured values, so a regression shows up immediately rather than needing to be discovered later.

## Working a card

`/card` works the top card in **Up Next**; `/card <title>` works a named card. It reads the card through the claude.ai Trello connector (the official Atlassian one, connected once at https://claude.ai/settings/connectors; local sessions signed in with that account get it too). It refuses a card with an empty template section, or when **Doing** already holds another card, and says why. Starting a card moves it to **Doing**; "ship it" merges the PR and moves the card to **Playtest**. Moving to **Done** stays manual.

Permissions in `.claude/settings.json` (under both connector tool names; see the cloud section): Trello reads are allowed; board, list, checklist, inbox, and planner writes always ask. `/card` pre-approves card writes for its first turn (its `allowed-tools`), and the `guard-trello.sh` hook makes every card write other than a move ask anyway, so creating, editing, or archiving cards always prompts.

### Build from a card (no machine involved)

`.github/workflows/build.yml` is an alternative to running `/card` yourself: it turns an approved card into a PR with no local machine, cloud session, or human present during the build. It runs three times a day on a schedule, and can also be dispatched manually ("Run workflow" on the Actions tab, or `gh workflow run build.yml -f card=<card URL>`) against a specific card.

- **`fetch-card` job:** the only job holding Trello credentials. "Approved" means sitting in **Up Next** and fully templated (not a title-only stub) — the same check `/card` itself makes. A manual dispatch fails outright if its card isn't both; a scheduled run instead walks Up Next in order and skips anything that isn't, silently. It hands the chosen card to `build` as an artifact (`card.json`), never as Trello access.
- **Skipped, not built:** a scheduled run also skips a card that already has an open or merged PR (checked against the live pull list, not GitHub's search index, which lags). A card that's failed `RETRY_CAP` (3) times is skipped too, with a one-time Trello comment flagging it for a human look instead of retrying it forever — a closed, unmerged PR and a run that produced no PR at all (the `flag-no-pr` comment below) each count as one strike toward that cap.
- **Caps:** one card per scheduled run, three runs a day, so at most three cards a day get built automatically. A manual dispatch with a card link ignores all of this and always tries to build that card.
- **Kill switch:** setting the repo variable `BUILD_PAUSED` to `true` (`gh variable set BUILD_PAUSED --body true`) skips every scheduled run instantly; manual dispatch still works while it's set.
- **`build` job:** holds `CLAUDE_CODE_OAUTH_TOKEN` and nothing else secret (no Trello token, no Firebase deploy secret). It follows `/card`'s build, verify, and open-PR steps without stopping for approval (a card being selected is the approval) and stops once the PR is open — it never ships. `--max-turns` and `--allowedTools` cap what it can do; anything outside that list is denied outright, since there's no one present to answer an interactive prompt, and the prompt itself tells the agent to fall back or stop on a denial rather than retry it.
- The PR is opened with the Claude GitHub App's token (via OIDC, `id-token: write`), not the default `GITHUB_TOKEN` — a `GITHUB_TOKEN`-opened PR doesn't trigger other workflows, so this is what lets `ci.yml`'s `preview` job build and comment on the Trello card afterward.
- **Verified, not assumed:** the Claude step can report success internally without ever pushing a branch or opening a PR. A step after it (`verify-pr-opened.mjs`) checks GitHub's live pull list for a PR citing the card and fails the job outright if none exists, writing the result to the job summary either way. A `flag-no-pr` job then comments on the Trello card when that happens, so a run that spent real cost and produced nothing is visible on the card, not just in an Actions run.
- **`claude-run-report.mjs`** (also used by `review.yml`) reads the Claude step's execution file and prints a deduplicated, retry-counted summary of any denied tool calls to the job log and summary — visibility for exactly this kind of failure, without dumping the full transcript.
- A workflow file change on its own branch can't test itself here: the Claude GitHub App's OIDC token exchange refuses to run unless the triggering branch's workflow file is byte-identical to `main`'s, so a PR touching `build.yml`/`review.yml` only really runs once merged.
- Doesn't yet move the card to **Doing** or **Playtest**; that's still manual until a later card adds it.

## PR review

Every PR gets one advisory review comment from Claude, checking the diff against `CLAUDE.md` and the engineering principles, before you look at it yourself. It's defined in `.github/workflows/review.yml`.

- **Setup (one-time):** run `/install-github-app` locally, which installs the Claude GitHub App on this repo and adds the `CLAUDE_CODE_OAUTH_TOKEN` secret. It shares your Pro plan usage limits, the same as a Claude Code session.
- **Cost:** runs once per PR (on `opened`, not on every push), using Sonnet with a 10-turn cap.
- **Re-review:** comment `@claude review` on the PR. Only the repo owner can trigger it this way, since the repo is public.
- Findings are advisory, not a required check, and the reviewer never edits code or the working tree — it only reads the diff and posts a comment.

## Models and usage

Model choices are set in config, so every session, local or cloud, gets them without anyone remembering. The aim is to spend plan usage on Opus only where it pays off: planning, and reviews you switch to it for.

| Where                                                              | Model                           | Why                                                                                                                                                                                    |
| ------------------------------------------------------------------ | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Session default (`"model": "opusplan"` in `.claude/settings.json`) | Sonnet; Opus while in plan mode | Sonnet handles routine coding. `opusplan` is Claude Code's built-in plan/execute split.                                                                                                |
| `/card`'s first turn (`model: opus` in its `SKILL.md`)             | Opus                            | That turn reads the card and code and writes the plan. A skill's `model` covers only the turn that invokes it, so building and "ship it" go back to Sonnet.                            |
| `Explore` subagent (`.claude/agents/explore.md`)                   | Haiku                           | Replaces the built-in Explore, which would otherwise run on the session model. Searching doesn't need a big model.                                                                     |
| PR review (`.github/workflows/review.yml`)                         | Sonnet                          | Cheap enough to run on every PR; `npm run check` fails if a step using `anthropics/claude-code-action` has no `--model` in `claude_args` (`.github/scripts/check-workflow-models.sh`). |
| Triage `draft` job (`.github/workflows/triage.yml`)                | Haiku                           | Routine drafting/classification of a raw wish into the card template — the cheap end of the pipeline by design.                                                                        |

Claude Code has no native way to route individual edits to a lighter model, so they run on the session model. For a one-off switch, such as Opus for a tricky review, use `/model opus`, then `/model opusplan` to go back (`/model default` means the account default, which is Opus).

To check usage:

- `/usage`: plan usage bars, plus a breakdown of what used them (skills, subagents, MCP servers) over the last 24 hours (`d`) or 7 days (`w`). The breakdown only covers this machine.
- `/status`: the current model and account.
- To compare two cards, sum the tokens per model in their transcripts (`~/.claude/projects/<project>/<session>.jsonl`, `message.usage` on each assistant message).

## Trello card comments

If a PR body has a `Card: https://trello.com/c/...` line (`/card` adds it), CI comments on that card twice. After the first successful preview deploy, it posts the PR link and the preview URL. When the PR merges, it posts a link to the merge commit. PRs without a card line are skipped. The script is `.github/scripts/trello-comment.mjs`, run by `ci.yml` (preview) and `trello.yml` (merge). It uses the `TRELLO_API_KEY` and `TRELLO_TOKEN` GitHub secrets.

To create or rotate them:

1. At https://trello.com/power-ups/admin, create a new Power-Up (any name, e.g. `dnd-tracker-ci`, in your workspace), then open its **API key** tab and generate a key.
2. Open this URL with your key filled in and click **Allow**. The page then shows the token:
   `https://trello.com/1/authorize?expiration=never&scope=read,write&response_type=token&name=dnd-tracker-ci&key=<KEY>`
3. In your own terminal, run `gh secret set TRELLO_API_KEY` and `gh secret set TRELLO_TOKEN`. Each command asks for the value; paste it at the prompt.

### One-time setup

Already done for this repo. To redo it (e.g. to rotate the service account), run these on your own machine; both are interactive:

```sh
npx firebase login
npx firebase init hosting:github
```

For `init`: repository `brian-kane/dnd-tracker`; answer No to the build-script and live-deploy questions, and No to overwriting files or installing agent skills. It creates the service account and uploads the secret. Delete the workflow file it generates, since `ci.yml` already handles deploys.
