# D&D Tracker

A personal D&D 5e (2014 rules) play companion for tracking a character's **live state during sessions**: HP, temp HP, spell slots, concentration, conditions, companions, transformation forms, item uses, and rests. Reference material and lore live elsewhere; this app only handles state that changes mid-session.

**Users:** first is Bran, a Forest Gnome Circle of the Moon druid (level 5, soon 6) with companions Gruk (orc warrior) and Lawrence (turtle familiar). Later: an artificer, a College of Epic Poetry bard, and a paladin. All of them must be supported **through data, never class-specific code**.

**Platform:** desktop/laptop browsers, often in a half-width window beside Discord or a VTT. Phone support is a future nice-to-have that must not require a redesign.

## Working agreement (read first)

- **Ask first** before changing data-model types, adding dependencies, changing the folder structure, or introducing new abstractions.
- Keep changes small and scoped to the one task asked for. No bonus features, no "while I was here" refactors.
- Prefer boring, readable code over clever code. Every file must be understandable without help.
- When you create a new file, say in one sentence what it's for.
- Do not create planning docs, roadmaps, backlogs, audit reports, or summary markdown files. The backlog lives in Trello; decisions live in commit messages.
- Finish every task with a short plain-language summary: what changed, what to look at, and anything you weren't sure about.
- If something is ambiguous, ask instead of guessing.

## Stack (decided — don't propose alternatives)

- Vue 3 Composition API + TypeScript (strict) + Vite
- Plain scoped CSS in components + global design tokens (CSS custom properties in `src/styles/tokens.css`). No CSS framework.
- State via Vue's built-in reactivity in composables. No Pinia, no router.
- Vitest, for the rules layer only.
- Persistence behind a storage adapter interface. Now: local browser storage.
- Development in WSL2, natively. No Docker, no dev container. Node version pinned in `.node-version`.

## Commands

| Command             | What it does                                                     |
| ------------------- | ---------------------------------------------------------------- |
| `npm run dev`       | Start the Vite dev server with hot reload.                       |
| `npm run build`     | Type-check with `vue-tsc` and build for production into `dist/`. |
| `npm run test:unit` | Run Vitest in watch mode (`npx vitest run` for a single pass).   |
| `npm run lint`      | Run oxlint then ESLint, auto-fixing what they can.               |
| `npm run format`    | Format `src/` with Prettier.                                     |

## Folder structure

- `src/rules/` — pure game-rules functions (state + action → new state) and their Vitest tests.
- `src/model/` — TypeScript types for the data model and schema upgrade functions.
- `src/storage/` — the storage adapter interface and its implementations.
- `src/components/` — Vue components.
- `src/styles/` — global CSS: design tokens only for now.

## Architecture rules

- **Rules layer (`src/rules`):** pure TypeScript — no Vue, no storage, no side effects. Functions take state plus an action and return new state. Every rules function has Vitest tests. Damage, healing, temp HP, rests, resource spending, and form transform/revert all live here.
- **Model (`src/model`):** core concepts are Character, Statblock (for companions _and_ transformation forms), ResourcePool (max + current + refresh trigger: spell slots, wild shape uses, Second Wind, Bardic Inspiration, etc.), Loadout (a selectable option granting stats/abilities, e.g. wild shape forms, artificer infusions), and Item. **The user decides the data model: propose types, never finalize them yourself.**
- **Schema versioning:** every saved record carries a `schemaVersion` number from day one, with an upgrade function per version bump.
- **Storage (`src/storage`):** an adapter interface with async (Promise-based) `load` / `save` / `list`, even though the local adapter could be synchronous, so a Firestore adapter can drop in later without changing callers. JSON export/import of a character comes later.
- **No class-specific logic, ever.** If code needs to know "is this a paladin/druid", stop and find the general shape instead.
- **UI (`src/components`):** desktop-first but phone-possible: use container queries and relative units, never make essential info hover-only (always clickable too), keep buttons comfortably sized (`--control-min-size`).

## Parked for later (don't build yet)

- Firestore sync (offline cache) + Firebase Auth (Google sign-in) + Firebase Hosting
- vite-plugin-pwa
- Phone support
- Pinia / router
- Keyboard shortcuts
- DM tools
