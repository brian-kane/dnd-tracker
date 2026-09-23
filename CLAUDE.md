# D&D Tracker

A personal D&D 5e (2014 rules) companion for tracking a character's **live state during sessions**: HP, temp HP, spell slots, concentration, conditions, companions, forms, item uses, rests. Lore and reference live elsewhere. First user: Bran (Moon druid, companions Gruk and Lawrence); an artificer, bard, and paladin come later, all supported **through data, never class-specific code**. Desktop browsers first, often half-width beside Discord/VTT; phone later without a redesign.

Engineering principles in `.claude/rules/engineering-principles.md` are always in effect.

## Working agreement

- **Proceed without asking:** UI components, styling, tests, internal refactors within a file.
- **Ask first:** data-model types, new dependencies, folder-structure changes, storage format changes, anything touching CLAUDE.md or `.claude/`. For the data model, propose types; the user decides.
- **Plans:** at most 15 lines; list only decisions that need the user, each with a default ("I'll do X unless you say otherwise").
- **Summaries:** at most 5 bullets. Show evidence (relevant command output), never just "it works". No long explanations unless asked. Say in one sentence what each new file is for.
- Keep changes scoped to the task. If something is ambiguous, ask instead of guessing.
- **Definition of done:** `npm run check` passes (typecheck, tests, lint); README and CLAUDE.md are still accurate if behavior or commands changed.
- **Workflow:** work is tracked in Trello. Lists: Parked, Up Next, Doing, Playtest, Done. Labels: Feature, Bug, Tooling. Card titles are "Subject: outcome". Commits are "type(subject): outcome" with a lowercase subject; Feature → `feat`, Bug → `fix`, Tooling → `chore`/`ci`/`build`. Example: `feat(lawrence): live HP that survives reload`. No Co-Authored-By or AI attribution trailers. Use `/card` to work a card.

## Stack (decided — don't propose alternatives)

- Vue 3 Composition API + TypeScript (strict) + Vite. Plain scoped CSS + tokens in `src/styles/tokens.css`; no CSS framework.
- State via Vue reactivity in composables; no Pinia, no router. Vitest for the rules layer only.
- Persistence behind a storage adapter interface (local browser storage for now).
- WSL2 natively, no Docker. Node version pinned in `.node-version`.

## Commands

| Command             | What it does                                                  |
| ------------------- | ------------------------------------------------------------- |
| `npm run dev`       | Vite dev server with hot reload.                              |
| `npm run build`     | Type-check and build for production into `dist/`.             |
| `npm run check`     | Typecheck + tests + lint (no auto-fix). Same as CI and hooks. |
| `npm run typecheck` | `vue-tsc --build`.                                            |
| `npm test`          | Vitest single pass (`npm run test:unit` for watch mode).      |
| `npm run lint`      | oxlint then ESLint, auto-fixing what they can.                |
| `npm run format`    | Prettier on `src/`.                                           |

## Folder structure

- `src/rules/` — pure game-rules functions (state + action → new state) and their Vitest tests.
- `src/model/` — data-model types and schema upgrade functions.
- `src/storage/` — storage adapter interface and implementations.
- `src/components/` — Vue components. `src/styles/` — global design tokens.
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
