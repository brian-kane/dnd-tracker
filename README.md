# D&D Tracker

A personal D&D 5e (2014 rules) play companion for tracking a character's live state during sessions: HP, temp HP, spell slots, concentration, conditions, companions, transformation forms, item uses, and rests.

Built with Vue 3, TypeScript, and Vite.

## Setup

Requires the Node version in `.node-version`.

```sh
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

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

Before the first `npm run test:e2e`, install Chromium and its system libraries once (uses sudo):

```sh
npx playwright install --with-deps chromium
```

## Hosting

The app is hosted on Firebase Hosting (project `dnd-tracker-2c66f`, free Spark plan) at https://dnd-tracker-2c66f.web.app.

- **PR previews:** after CI's `check` job passes, every PR from this repo is deployed to a preview channel, and the URL is posted as a comment on the PR. Previews expire after 7 days.
- **Live:** merging to main deploys to the live site.

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
