---
name: card
description: Work a Trello card end to end — fetch it from the board, plan, build on a branch, open a PR, and merge on "ship it". Use only when the user's message starts with /card, including when /card arrives inside pasted text.
argument-hint: '[card title]'
# Pre-approves the move to Doing in the invoking turn. guard-trello.sh still makes every
# other card write ask.
allowed-tools: mcp__claude_ai_Trello__trelloWriteCard
---

# /card — work one Trello card

Card title (may be empty, or the literal placeholder, meaning none was given):

$ARGUMENTS

Follow CLAUDE.md (autonomy tiers, output rules, definition of done) and `.claude/rules/engineering-principles.md` throughout.

## 1. Get the card

Cards come from the board "DnD Tracker" (https://trello.com/b/3cscGaJR/dnd-tracker, ARI `ari:cloud:trello::board/workspace/65f8a2b470b23cf8bd646950/6ab3e35b7e9b2eaeb388baf0`) through the Trello connector (`mcp__claude_ai_Trello__*` tools). If those tools aren't available, stop and say so; in a cloud session, the Trello connector must be enabled for the session. Don't fall back to pasted card text.

1. List the board's lists (`trelloReadList` list_by_board) and match by name prefix: **Up Next**, **Doing** (its name carries a suffix, "(max 1)"), **Playtest**, **Done**. Read Up Next and Doing (`trelloReadList` get); each gives its cards' ids and names in board order.
2. Find the card:
   - No title given: the first card in Up Next. If Up Next is empty, stop and say so.
   - Title given: search the board (`trelloSearch` search_cards, scoped by `boardIds`). Search also matches descriptions, so pick by name: the result whose name equals the title, ignoring case; otherwise the only one whose name contains it. If none or several match, stop and list the names found. A card in Playtest or Done has already shipped: stop and say so.
3. Read it in full (`trelloReadCard` get, which also gives its `id` for moving) and extract a working card:
   - **Title** ("Subject: outcome"), **label** (exactly one of Feature, Bug, Tooling), and the card link (`https://trello.com/c/<shortLink>`).
   - Feature/Tooling sections: **Goal**, **Done means**, **Out of scope**, **Notes**.
   - Bug sections: **Observed**, **Expected**, **Steps to reproduce**, **Notes**. For bugs, "Done means" is: Expected happens, and a rules test reproduces the bug if the cause is in `src/rules`.
4. Refuse to start, saying exactly why, and change nothing on the board when:
   - The title isn't "Subject: outcome", or the label isn't exactly one of the three.
   - Any section of the label's template is missing or has no text under its heading ("None" counts as text).
   - Doing holds a card other than this one. Name that card, and say `/card <its title>` resumes it.
5. If the card is already in Doing, it's being resumed: don't move it. Otherwise move it to the top of Doing (`trelloWriteCard` move) and say so in one line.

## 2. Understand, then plan

1. Read the relevant code. For bugs, find the root cause before planning a fix.
2. If the card is ambiguous or conflicts with CLAUDE.md, ask before planning.
3. Give a plan of at most 15 lines: the slices you'll build, which "Done means" bullets become Playwright tests, and only the decisions that need the user, each with a default ("I'll do X unless you say otherwise").
4. **Stop and wait for approval.**

## 3. Build

- Before changing anything, branch from up-to-date main: `git switch main && git pull --ff-only && git switch -c <type>/<slug>`.
  - type: as in the commit message (step 5). slug: the subject plus 2–3 key words of the outcome, lowercase kebab-case.
  - Example: "Lawrence: live HP that survives reload" (Feature) → `feat/lawrence-live-hp`.
- Implement in small steps, following the autonomy tiers. Anything in the "ask first" tier needs a yes, even mid-task.
- Never implement anything listed under **Out of scope**. If it seems necessary, stop and ask.
- Each observable **Done means** bullet (something a user can see or do in the browser) gets a Playwright test in `e2e/`, in this PR. Rules edges stay in Vitest.
- Stop at **Done means**. No extras.

## 4. Verify

The Stop hook runs `npm run check` when source changed. Fix any failure it reports; don't stop until it passes or you've explained why it can't.

If the card touches UI or behavior, run `npm run test:e2e` before opening the PR and fix any failure. For UI work, also say what to try in the browser.

## 5. Open the PR

The PR title and body become the squash commit on main, so they follow the commit format in CLAUDE.md exactly. Branch commits are working history.

1. Subject line: `type(subject): outcome`, from the card, at most 72 chars (aim for 50).
   - type: Feature → `feat`, Bug → `fix`, Tooling → `chore` (or `ci`/`build` when the change is only CI or build config).
   - subject: the card title's subject, lowercased; outcome: the title's outcome.
   - Example: card "Lawrence: live HP that survives reload" (Feature) → `feat(lawrence): live HP that survives reload`.
2. `git add` the files you changed (not `-A` blindly), commit with that subject line, then `git push -u origin HEAD`.
3. `gh pr create --base main --title "<subject line>" --body-file <file>`, with the body written to a scratchpad file: bullets describing what changed, wrapped at 72 (continuation lines indented two spaces), a blank line, then the card link. No headings, no Done means, no AI footer.

   ```text
   - Add ...
   - Change ...

   Card: <card link>
   ```

4. Follow-up commits go on the same branch (`git push`). After each push, rewrite the body so it describes the whole change, not just the first commit: `gh api -X PATCH repos/{owner}/{repo}/pulls/<number> -F body=@<file>`. (`gh pr edit` fails on gh 2.46 with a Projects (classic) deprecation error.)

## 6. Summarize

At most 5 bullets: the PR URL, what changed, what to look at or try in the browser (`npm run dev`), and anything uncertain. Show evidence (relevant command output), not "it works".

## 7. Ship (only when the user says "ship it")

1. `gh pr checks --watch`. If a check fails, stop and report it; GitHub won't allow the merge anyway. "No checks reported" right after a push means CI hasn't registered yet — wait and rerun, don't merge.
2. Save the PR body to a scratchpad file (`gh pr view --json body --jq .body`), then `gh pr merge --squash --delete-branch --subject "<PR title>" --body-file <file>`. "Ship it" is approval for this merge; the permission prompt is the one confirmation. `--subject` stops GitHub appending ` (#N)` to the title; passing the body explicitly makes the squash commit match the PR even if the API default differs.
3. `git switch main && git pull --ff-only`, and confirm the squash commit is on main.
4. Move the card to the top of **Playtest** (`trelloWriteCard` move; this asks, since the skill's pre-approval ended with its first turn), and say so. Never move it to **Done**; that's the user's call after real use.

## Gotchas

- **Pushing to main:** never. Main only changes through a merged PR; GitHub rejects direct pushes.
- **Speculative abstractions:** no interface, generic, or config option without a second concrete use today.
- **Class-specific logic:** never branch on class, subclass, or character name. Find the general shape (ResourcePool, Loadout, Statblock) and express the difference as data.
- **Rules logic in components:** any calculation involving HP, slots, resources, rests, or forms belongs in `src/rules` with tests; components only call it.
- **Persisting static definitions:** save live state (current HP, slots spent, active form), not statblocks or other definitions that belong in code/data files.
- **Scope creep:** Done means is the finish line. Note follow-ups as suggested new cards in the summary; don't build them.
- **Verbose output:** plans ≤ 15 lines, summaries ≤ 5 bullets, no unrequested explanations.
