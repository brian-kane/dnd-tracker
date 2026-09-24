# Engineering principles (The Pragmatic Programmer, applied here)

Always in effect. Each item is something you can check in a diff.

## DRY — one place per piece of knowledge

- Game rules (damage, healing, temp HP, rests, resource spending, forms) live only in `src/rules/`. Components and composables call them; they never re-implement a calculation, however small.
- Each creature's stats (Bran, Gruk, Lawrence, each wild shape form) are defined once, as data. Never repeat a statblock or a number from it elsewhere.
- Before writing a helper, search for an existing one. If you're about to copy-paste logic, extract it instead.

## ETC — easier to change

- Keep parts replaceable behind small interfaces where a swap is already planned (storage adapter → Firestore).
- No speculative abstractions: no interface, generic, or config option without a second concrete use today. Build for today's need.

## Orthogonality

- Dependency direction: components → composables → rules/storage → model. `src/rules` imports only `src/model`; `src/model` imports nothing from the app. Enforced by lint (`eslint.config.ts`'s `layerBoundary`), not just review.
- A change in one layer should not force edits in another. If it does, say so in the plan and why.

## Fail fast

- Validate at boundaries: data loaded from storage (check `schemaVersion`, run upgrades, reject malformed records) and user input.
- Throw on impossible states (e.g. negative max HP, spending a slot that doesn't exist). Never clamp silently to hide a bug.
- Never swallow errors: no empty `catch`, no `catch` that only logs and continues unless the summary names it.

## Design by contract

- Express preconditions in types first (narrow unions, readonly inputs, no `any`), then in explicit checks.
- Rules tests cover the edges: zero, max, overflow (damage beyond temp HP, healing past max), and invalid input throwing.

## Tracer bullets and small steps

- Build thin end-to-end slices (rule → state → UI → storage) that work, then widen. Don't build a layer in full before anything uses it.
- Small diffs, one concern each. Verify each step (typecheck/tests/browser) before the next. Don't outrun your headlights.

## No broken windows

- Don't leave known problems: failing checks, lint disables, `TODO`s, dead code. Fix them, or name them in the summary.

## Don't program by coincidence

- Understand why code works before calling it done. No trial-and-error fixes: state the root cause of a bug before changing code.
- Don't add `as` casts, `!` assertions, or `@ts-expect-error` to make errors disappear; fix the types.

## Docs

- Comments explain why, not what. Keep README and CLAUDE.md accurate when commands or behavior change.
- Never create planning docs, roadmaps, backlogs, audit reports, or summary markdown files. Backlog lives in Trello; decisions live in commit messages.
