---
name: card
description: Work a Trello card end to end — read, plan, build on a branch, open a PR, and merge on "ship it". Use only when the user's message starts with /card, including when /card arrives inside pasted text.
argument-hint: <pasted Trello card>
---

# /card — work one Trello card

Card input:

$ARGUMENTS

Follow CLAUDE.md (autonomy tiers, output rules, definition of done) and `.claude/rules/engineering-principles.md` throughout.

## 1. Get the card

Source today: the pasted text above. If it's empty, the editor may have split a long paste off from the command — use the card pasted in the same user message. (Later: fetch from Trello and move the card to **Doing**. Only this step changes.)

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

- Before changing anything, branch from up-to-date main: `git switch main && git pull --ff-only && git switch -c <type>/<slug>`.
  - type: as in the commit message (step 5). slug: the subject plus 2–3 key words of the outcome, lowercase kebab-case.
  - Example: "Lawrence: live HP that survives reload" (Feature) → `feat/lawrence-live-hp`.
- Implement in small steps, following the autonomy tiers. Anything in the "ask first" tier needs a yes, even mid-task.
- Never implement anything listed under **Out of scope**. If it seems necessary, stop and ask.
- Stop at **Done means**. No extras.

## 4. Verify

The Stop hook runs `npm run check` when source changed. Fix any failure it reports; don't stop until it passes or you've explained why it can't. For UI work, say what to try in the browser.

## 5. Open the PR

1. Commit message: `type(subject): outcome`, from the card.
   - type: Feature → `feat`, Bug → `fix`, Tooling → `chore` (or `ci`/`build` when the change is only CI or build config).
   - subject: the card title's subject, lowercased; outcome: the title's outcome.
   - Example: card "Lawrence: live HP that survives reload" (Feature) → `feat(lawrence): live HP that survives reload`.
2. `git add` the files you changed (not `-A` blindly), commit, then `git push -u origin HEAD`.
3. `gh pr create --base main --title "<commit message>" --body-file <file>`, with the body written to a scratchpad file:

   ```markdown
   Card: <card link>

   ## Done means

   - <each Done means item, verbatim>
   ```

   If the card has no link, ask for it. Follow-up fixes after review are new commits on the same branch, pushed the same way.

## 6. Summarize

At most 5 bullets: the PR URL, what changed, what to look at or try in the browser (`npm run dev`), and anything uncertain. Show evidence (relevant command output), not "it works". (Later: post this summary as a Trello comment and move the card to **Playtest**.)

## 7. Ship (only when the user says "ship it")

1. `gh pr checks --watch`. If a check fails, stop and report it; GitHub won't allow the merge anyway.
2. `gh pr merge --squash --delete-branch`. "Ship it" is approval for this merge; the permission prompt is the one confirmation. The squash commit takes the PR title.
3. `git switch main && git pull --ff-only`, and confirm the squash commit is on main.
4. (Later: move the card to **Done** in Trello.)

## Gotchas

- **Pushing to main:** never. Main only changes through a merged PR; GitHub rejects direct pushes.
- **Speculative abstractions:** no interface, generic, or config option without a second concrete use today.
- **Class-specific logic:** never branch on class, subclass, or character name. Find the general shape (ResourcePool, Loadout, Statblock) and express the difference as data.
- **Rules logic in components:** any calculation involving HP, slots, resources, rests, or forms belongs in `src/rules` with tests; components only call it.
- **Persisting static definitions:** save live state (current HP, slots spent, active form), not statblocks or other definitions that belong in code/data files.
- **Scope creep:** Done means is the finish line. Note follow-ups as suggested new cards in the summary; don't build them.
- **Verbose output:** plans ≤ 15 lines, summaries ≤ 5 bullets, no unrequested explanations.
