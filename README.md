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

Both deploys use the build that `check` produced and are defined in `.github/workflows/ci.yml`. The only credential is the `FIREBASE_SERVICE_ACCOUNT_DND_TRACKER_2C66F` GitHub secret.

### One-time setup

Already done for this repo. To redo it (e.g. to rotate the service account), run these on your own machine; both are interactive:

```sh
npx firebase login
npx firebase init hosting:github
```

For `init`: repository `brian-kane/dnd-tracker`; answer No to the build-script and live-deploy questions, and No to overwriting files or installing agent skills. It creates the service account and uploads the secret. Delete the workflow file it generates, since `ci.yml` already handles deploys.
