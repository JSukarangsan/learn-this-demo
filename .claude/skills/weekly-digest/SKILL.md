---
name: weekly-digest
description: Assemble the weekly team update from the context layer and the Notion backlog — decisions that landed, requirements that moved, and what's blocked — then format it for Slack. Use when someone asks for the weekly update, a status digest, "what changed this week", or a team brief.
---

# Weekly digest

Assemble the update. Don't send it.

The information already exists. It's just scattered — four folders in this repo and one
database outside it. Writing the update takes an hour because of the archaeology, not
because writing is hard.

## Read, in this order

1. **`team/how-we-work.md`** — the cadence, so you know what window you're reporting on.
   Everything below is filtered to that window.

2. **`product/decisions/`** — entries dated inside the window.
   **Only entries with `status: decided`.** A `proposed` entry has not happened. Putting one
   under what shipped is how an agent tells the company something is settled that isn't.
   A newsworthy proposal goes under *Open, not decided* — never anywhere else.

3. **The Notion backlog** — where requirements actually change. This repo does not hold a
   copy of it. See *Reaching Notion* below.

4. **`projects/*/`** — the project `CLAUDE.md` and `brief.md`, for what "done" was supposed
   to mean, so you can say whether the week moved toward it.

5. **`comms/notes/`** — meeting notes and transcripts dated inside the window.
   **Nothing here is canonical.** A thing said in a meeting is not a thing decided, so a
   notes file can never put an item under *Decided*. What it's good for is the opposite:
   a follow-up that was named and never became a decision entry is an *Open, not decided*
   line, and it's usually the one nobody else has noticed.

6. **`comms/status/`** — last week's report, for one purpose only: **what you said was
   moving that hasn't moved since.** Don't lift lines from it. It's a previous run of this
   same skill, so quoting it compounds whatever it got wrong, and anything still true in
   it is still true in the sources you already read.

7. **`team/goals-and-okrs.md`** — what we're supposed to be moving. The update should say
   something about direction, not just list activity.

## Reaching Notion

The backlog is the source of truth for scope. It lives in Notion and is reachable by tool —
`context-manifest.yaml` has the entry. It knows nothing about this repo, and it doesn't need to.

- Query the **Backlog** data source at `collection://b5aa8308-8ec2-4837-9bc3-fe6330e3754b`
  using the Notion MCP `query-data-sources` tool.
- Filter to rows whose **`Last edited`** falls inside the window. Read `Name`,
  `Work Stream`, `Status`, `Owner`, `Release`, and `Depends On`.
- **`Depends On` is where blockers come from.** A row waiting on another team is the
  Blocked section. Nothing else is.
- **`Last edited` is a coarse signal — one bulk edit stamps the whole board.** If most of
  the table falls inside the window, that's a reorganization, not a week of progress. Fall
  back to `Status`: `In build` and `Behind flag` are Moving, `Shipped` needs a decision-log
  entry before you claim it, and `Backlog` or `Cut` only appear if something says they
  changed. Never report sixteen rows as moving.
- **Cross-check what moved against `product/decisions/`.** Scope that changed with no
  decision entry behind it is the most useful line in the whole digest — somebody changed
  their mind and nobody wrote down why. That goes under *Open, not decided*. Doing this
  join is the repo's job; the backlog can't do it.
- If Notion is unreachable, **say so in the digest and continue.** A digest that admits it
  is missing the backlog is fine. One that silently omits it is not.

## Then write it

Format, section order, and voice are in **`references/digest-format.md`**. Read it before
writing a line. Then run `/copy` so the result lands on the clipboard in a shape that
pastes cleanly into Slack.

**Save it to `comms/status/<week-ending>-status-webapp.md`** — same content, before any
hand-editing. That file is a record of what the team was told and when, which is the only
thing it's good for; it is never a source for a later digest. See `comms/CLAUDE.md`.

## Stop and ask a human when

- The decision log and the Notion backlog disagree about what was decided
- Something looks blocked but nothing in either source says so
- The window contains a reversal — those need a person to frame them
