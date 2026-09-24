# D&D Tracker

A personal D&D 5e (2014 rules) companion for tracking a character's **live state during sessions**: HP, temp HP, spell slots, concentration, conditions, companions, forms, item uses, rests. Lore and reference live elsewhere. First user: Bran (Moon druid, companions Gruk and Lawrence); an artificer, bard, and paladin come later, all supported **through data, never class-specific code**. Desktop browsers first, often half-width beside Discord/VTT; phone later without a redesign.

Engineering principles in `.claude/rules/engineering-principles.md` are always in effect.

## Working agreement

- **Proceed without asking:** UI components, styling, tests, internal refactors within a file.
- **Ask first:** data-model types, new dependencies, folder-structure changes, storage format changes, anything touching CLAUDE.md or `.claude/`. For the data model, propose types; the user decides.
- **Plans:** at most 15 lines; list only decisions that need the user, each with a default ("I'll do X unless you say otherwise").
- **Summaries:** at most 5 bullets. Show evidence (relevant command output), never just "it works". No long explanations unless asked. Say in one sentence what each new file is for.
- Keep changes scoped to the task. If something is ambiguous, ask instead of guessing.
- **Definition of done:** `npm run check` passes (typecheck, tests, lint); `npm run test:e2e` passes when UI or behavior changed; README and CLAUDE.md are still accurate if behavior or commands changed.
- **Acceptance tests:** every observable "Done means" bullet (something a user can see or do in the browser) becomes a Playwright test in `e2e/`, in the same PR. Rules edges stay in Vitest.
- **Workflow:** work is tracked in Trello. Lists: Parked, Up Next, Doing, Playtest, Done. Labels: Feature, Bug, Tooling. Card titles are "Subject: outcome". Use `/card` to work a card.
- **Commit format:** subject line `type(subject): outcome` with a lowercase subject, at most 72 chars (aim for 50); Feature → `feat`, Bug → `fix`, Tooling → `chore`/`ci`/`build`. Then a blank line and a bullet body wrapped at 72 describing what changed. When there's a card, the last line is `Card: <trello link>`. No Co-Authored-By or AI attribution trailers. Example: `chore(agent): infrastructure setup`.
- **Branches and PRs:** one branch per card (`<type>/<slug>`, e.g. `feat/lawrence-live-hp`). Branch commits use the subject format but are working history; the PR title and body are what land on main, as the squash commit's subject and body. So the PR body is in the commit body format, and is updated to describe the whole change whenever more commits are pushed. Main is protected: no direct pushes, and merging needs the CI `check` and `pr-title` checks to pass. "Ship it" squash-merges the PR and deletes the branch.

## Stack (decided — don't propose alternatives)

- Vue 3 Composition API + TypeScript (strict) + Vite. Plain scoped CSS + tokens in `src/styles/tokens.css`; no CSS framework.
- State via Vue reactivity in composables; no Pinia, no router. Vitest for the rules layer only; Playwright (Chromium only) for acceptance tests against the built app.
- Persistence behind a storage adapter interface (local browser storage for now).
- WSL2 natively, no Docker. Node version pinned in `.node-version`.

## Commands

| Command             | What it does                                                               |
| ------------------- | -------------------------------------------------------------------------- |
| `npm run dev`       | Vite dev server with hot reload.                                           |
| `npm run build`     | Type-check and build for production into `dist/`.                          |
| `npm run check`     | Typecheck + tests + lint + hook tests (no auto-fix). Same as CI and hooks. |
| `npm run typecheck` | `vue-tsc --build`.                                                         |
| `npm test`          | Vitest single pass (`npm run test:unit` for watch mode).                   |
| `npm run test:e2e`  | Build, then run Playwright acceptance tests headless (also runs in CI).    |
| `npm run lint`      | oxlint then ESLint, auto-fixing what they can.                             |
| `npm run format`    | Prettier on `src/`.                                                        |

## Folder structure

- `src/rules/` — pure game-rules functions (state + action → new state) and their Vitest tests.
- `src/model/` — data-model types and schema upgrade functions.
- `src/storage/` — storage adapter interface and implementations.
- `src/components/` — Vue components. `src/styles/` — global design tokens.
- `e2e/` — Playwright acceptance tests, one or more per observable "Done means" bullet.
- `scripts/setup.sh` — the one environment definition (Node check, `jq`, `npm ci`, Chromium), run by new machines, CI, and cloud sessions.
- `.claude/` — agent settings, hooks, rules, and the `/card` skill.

## Architecture rules

- **Rules:** pure TS, no Vue/storage/side effects. Damage, healing, temp HP, rests, resource spending, form transform/revert live here, each with Vitest tests.
- **Model:** Character, Statblock (companions _and_ forms), ResourcePool (max, current, refresh trigger), Loadout (selectable option granting stats/abilities), Item.
- **Schema versioning:** every saved record has `schemaVersion`, with an upgrade function per bump.
- **Storage:** async `load` / `save` / `list` adapter so a Firestore adapter can drop in later.
- **No class-specific logic, ever.** If code needs to know "is this a druid", find the general shape.
- **UI:** container queries and relative units; nothing essential hover-only; controls at least `--control-min-size`.

## Parked (don't build yet)

Firestore sync + Firebase Auth/Hosting, vite-plugin-pwa, phone support, Pinia/router, keyboard shortcuts, DM tools, JSON export/import.
