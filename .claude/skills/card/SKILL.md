---
name: card
description: Work a Trello card end to end — read, plan, build, verify, summarize, and ship on request.
disable-model-invocation: true
argument-hint: <pasted Trello card>
---

# /card — work one Trello card

Card input:

$ARGUMENTS

Follow CLAUDE.md (autonomy tiers, output rules, definition of done) and `.claude/rules/engineering-principles.md` throughout.

## 1. Get the card

Source today: the pasted text above. (Later: fetch from Trello and move the card to **Doing**. Only this step changes.)

Extract into a working card:

- **Title** ("Subject: outcome") and **label** (Feature, Bug, or Tooling).
- Feature/Tooling sections: **Goal**, **Done means**, **Out of scope**, **Notes**.
- Bug sections: **Observed**, **Expected**, **Steps to reproduce**, **Notes**. For bugs, "Done means" is: Expected happens, and a rules test reproduces the bug if the cause is in `src/rules`.

If the title, label, or a required section is missing, ask for it.

## 2. Understand, then plan

1. Read the relevant code. For bugs, find the root cause before planning a fix.
2. If the card is ambiguous or conflicts with CLAUDE.md, ask before planning.
3. Give a plan of at most 15 lines: the slices you'll build, and only the decisions that need the user, each with a default ("I'll do X unless you say otherwise").
4. **Stop and wait for approval.**

## 3. Build

- Implement in small steps, following the autonomy tiers. Anything in the "ask first" tier needs a yes, even mid-task.
- Never implement anything listed under **Out of scope**. If it seems necessary, stop and ask.
- Stop at **Done means**. No extras.

## 4. Verify

The Stop hook runs `npm run check` when source changed. Fix any failure it reports; don't stop until it passes or you've explained why it can't. For UI work, say what to try in the browser.

## 5. Summarize

At most 5 bullets: what changed, what to look at or try in the browser (`npm run dev`), and anything uncertain. Show evidence (relevant command output), not "it works". (Later: post this summary as a Trello comment and move the card to **Playtest**.)

## 6. Ship (only when the user says "ship it")

1. Commit message: `type(subject): outcome`, from the card.
   - type: Feature → `feat`, Bug → `fix`, Tooling → `chore` (or `ci`/`build` when the change is only CI or build config).
   - subject: the card title's subject, lowercased; outcome: the title's outcome.
   - Example: card "Lawrence: live HP that survives reload" (Feature) → `feat(lawrence): live HP that survives reload`.
2. `git add` the files you changed (not `-A` blindly), commit, then `git push`. "Ship it" is approval for this push.
3. (Later: move the card to **Done** in Trello.)

## Gotchas

- **Speculative abstractions:** no interface, generic, or config option without a second concrete use today.
- **Class-specific logic:** never branch on class, subclass, or character name. Find the general shape (ResourcePool, Loadout, Statblock) and express the difference as data.
- **Rules logic in components:** any calculation involving HP, slots, resources, rests, or forms belongs in `src/rules` with tests; components only call it.
- **Persisting static definitions:** save live state (current HP, slots spent, active form), not statblocks or other definitions that belong in code/data files.
- **Scope creep:** Done means is the finish line. Note follow-ups as suggested new cards in the summary; don't build them.
- **Verbose output:** plans ≤ 15 lines, summaries ≤ 5 bullets, no unrequested explanations.
