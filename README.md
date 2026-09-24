# D&D Tracker

A personal D&D 5e (2014 rules) play companion for tracking a character's live state during sessions: HP, temp HP, spell slots, concentration, conditions, companions, transformation forms, item uses, and rests.

Built with Vue 3, TypeScript, and Vite.

## Time to first commit

On a new machine (Linux or WSL2, Ubuntu-based):

1. Install the Node version in `.node-version` with your version manager, plus `git` and the GitHub CLI; run `gh auth login`.
2. `gh repo clone brian-kane/dnd-tracker && cd dnd-tracker`
3. `scripts/setup.sh` — installs dependencies (`npm ci`), `jq`, and Playwright's Chromium. It uses sudo only when `jq` or Chromium's system libraries are missing, and is safe to re-run.
4. `npm run check && npm run test:e2e` — both should pass.
5. `npm run dev`, then open the URL Vite prints (usually http://localhost:5173).

`scripts/setup.sh` is the one environment definition: CI and Claude Code cloud sessions run it too.

## Cloud sessions (Claude Code on the web)

Work a card from a phone or browser with no local machine involved: a cloud session clones the repo onto an Anthropic-managed VM, runs `/card`, and pushes the branch; CI then builds the preview and comments on the Trello card. The session needs no Trello or Firebase secrets, since CI holds those.

How the VM gets set up:

- The environment's **setup script** runs `scripts/setup.sh` once, as root, and the result is cached for about 7 days. As root, the script also installs the pinned Node (the VM ships Node 22).
- A `SessionStart` hook in `.claude/settings.json` runs the same script at the start of every cloud session (it does nothing locally), so a lockfile or Playwright change since the cache was built is picked up.
- GitHub access goes through the cloud's GitHub proxy, using the Claude GitHub App: `gh` works with no token of your own, and `git push` only reaches the session's working branch.
- `attribution.sessionUrl` is off in `.claude/settings.json`, so commits and PR bodies keep the format in `CLAUDE.md`.

One-time setup, in a browser:

1. Install the Claude GitHub App on this repo only: open https://github.com/apps/claude, click **Configure** (or **Install**), choose your account, select **Only select repositories**, pick `dnd-tracker`, and click **Save**.
2. Open https://claude.ai/code and finish onboarding if asked (connect GitHub; skip `/web-setup`, which uploads a local `gh` token).
3. Click the cloud icon with the environment name, in the row above the message box, then **Add cloud environment**:
   - **Name:** `dnd-tracker`
   - **Network access:** **Custom**. Leave **Also include default list of common package managers** unchecked, and set **Allowed domains** to:
     ```text
     registry.npmjs.org
     nodejs.org
     cdn.playwright.dev
     playwright.download.prss.microsoft.com
     archive.ubuntu.com
     security.ubuntu.com
     ```
     GitHub doesn't need listing; it goes through its own proxy.
   - **Environment variables:** none.
   - **Setup script:**
     ```bash
     #!/bin/bash
     bash /home/user/dnd-tracker/scripts/setup.sh
     ```
     (The setup script runs from `/home/user`, with the repo cloned to `/home/user/dnd-tracker`.)
   - Click **Create environment**.

To work a card: at claude.ai/code (or the **Code** tab of the Claude app), pick the `brian-kane/dnd-tracker` repo, the `main` branch, and the `dnd-tracker` environment, then paste the `/card ...` text as the first message.

## Other commands

```sh
npm run build      # type-check and build for production
npm run check      # typecheck + tests + lint + hook tests (what CI runs)
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

Both deploys use the build that `check` produced and are defined in `.github/workflows/ci.yml`. Their only credential is the `FIREBASE_SERVICE_ACCOUNT_DND_TRACKER_2C66F` GitHub secret.

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
