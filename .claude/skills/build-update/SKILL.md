---
name: build-update
description: Assemble the build-phase update for ONE project from the tracked work, the design file, and this repo — what moved, what is blocked, and what is blocked on something this team already settled. Use when someone asks for the build update on a project, a status readout mid-build, "where are we on this", or what is holding the release.
---

# Build update

Assemble the update. Don't send it.

This is not a summary of a board. A board summary is a thing the board can already produce,
and nobody needs a second one. What this produces is the set of statements **no single
source can make**, because each one needs two sources read against each other.

If a run of this skill returns nothing but a tidy list of ticket statuses, it failed. Say so
in the output rather than dressing it up.

## One project. Ask which one before you read anything.

**This skill is scoped to a single project and there is no all-projects mode.** A build
update is a readout on one piece of work mid-build — what is holding *this* release. Run it
across four projects and the four joins below stop working: a blocked ticket and the
decision that settles it are the same project's, and a designed state with no ticket behind
it is only findable against that project's board. Widen the scope and you get four thin
board summaries, which is the one thing this skill exists not to produce.

- **If the invocation named a project** — `/build-update cohort-scheduling`, or the
  surrounding conversation is plainly about one — use it. Don't ask twice.
- **If it didn't, stop and ask.** List what's in `projects/` with its state from
  `projects/CLAUDE.md` and let the person pick. Do not guess from which project is busiest,
  and do not default to the first one alphabetically.
- **If the named project has no `deliverables/requirements/`**, say so and ask whether they
  meant a different one. A project nobody has scoped yet has no "done" to measure against,
  so joins 3 and 4 cannot fire and the update will be misleadingly quiet.

Everything below reads `projects/<project>/` — the one project. Where it says the tracker or
the design file, filter those to that project too.

## Read, in this order

1. **`team/how-we-work.md`** — the reporting window. Everything below is filtered to it.
   Monday to Sunday, not the sprint. Get this wrong and every date in the output is wrong.

2. **`product/decisions/`** — entries dated inside the window.
   **Only `status: decided`.** A `proposed` entry has not happened. Putting one under what
   was decided is how an agent tells the company something is settled that isn't.
   A newsworthy proposal goes under *Open, not decided*, never anywhere else.

3. **The tracked work** — tickets, status, owner, blockers. See *Reaching the tracker* below.

4. **The design file** — every designed state for anything in build. See *Reaching design*.

5. **`projects/<project>/`** — the project `CLAUDE.md`, then
   `deliverables/requirements/` for what "done" was supposed to mean and what was ruled
   out of scope. The brief is the thing the tracker contradicts; `acceptance.md`, where it
   exists, is the thing "Shipped" has to satisfy.

6. **`projects/<project>/comms/`, the files without a `-status` suffix** — meeting notes
   dated inside the window. **Nothing here is canonical.** A thing said in a meeting is not
   a thing decided, so a notes file can never put an item under *Decided*. Its value is the
   reverse: a follow-up that was named and never became a decision entry is an *Open, not
   decided* line, and it is usually the one nobody else has noticed.

7. **`engineering/constraints.md`** and **`insights/definitions.md`** — before you call any
   move good or bad, or quote any number.

8. **`projects/<project>/comms/*-status.md`** — the previous update for *this* project, for
   one purpose only: **what you said was moving that hasn't moved since.** Never lift lines
   from it. It is a previous run of this same skill, so quoting it compounds whatever it got
   wrong. Ignore the status files in other projects' folders; they are a different readout.

## Reaching the tracker

`context-manifest.yaml` → `sources.product_backlog` has the address. It is the source of
truth for scope and it is deliberately not a file in this repo.

- Read the issues over the Jira MCP, **filtered to the project you were asked about** — by
  its label or component, not the whole board. Fields that matter: `key`, `summary`,
  `status`, `labels`, `updated`, and **issue links** — specifically what an issue is
  *blocked by*. A blocker may well sit outside the project; follow the link, then report it
  as an external block rather than pulling that issue's project into the update.
- **`updated` is a coarse signal. One bulk edit stamps the whole board.** If most of the
  project falls inside the window, that is a re-organisation, not a week of progress. Fall
  back to `status`: `In build` and `Behind flag` are Moving, `Shipped` needs a decision-log
  entry and a passed checklist before you claim it, and `Backlog` or `Cut` only appear if
  something says they changed.
- **Blocked comes from the issue link, never from your reading of the summary.**
- **Don't report the assignee as the owner.** Who a ticket is assigned to and who will
  actually move it are frequently different people, which is the entire reason
  `team/ownership.md` has a *who actually unblocks a review* column. Take the escalation
  path from that table, not from the tracker.
- If the tracker is unreachable, **say so in the update and continue.** An update that
  admits it is missing the tracker is fine. One that silently omits it is not.

## Reaching design

`context-manifest.yaml` → `sources.product_ui`. Read it over the Figma MCP. Frames are named
`Screen / viewport / state`, sometimes with a fourth `condition` segment. Parse that.

You are looking for one thing only: **states that exist in the design file and have no
ticket behind them** — for this project's screens, not every screen in the file. Don't audit
coverage here. `/states-table` already does that properly, and duplicating it badly is worse
than linking to it.

If a frame's state segment is auth vocabulary rather than glossary vocabulary
(`logged-in` rather than `self-serve`), it is **unclassified** and it does not go in the
update. Say it is unclassified. Never pick.

## The four joins

These are the output. Everything else is context around them.

| | The join | Where it comes from |
|---|---|---|
| **1** | A ticket blocked on something this team already decided | issue link says blocked · `product/decisions/` has a `decided` entry that settles it |
| **2** | A designed state with no ticket behind it | the Figma file has the frame · nothing in the tracker references it |
| **3** | Scope that changed with no decision behind it | the tracker moved an item in or out · the brief still says the opposite · the decision log is silent |
| **4** | A proposal being reported as a plan | tracker has it in build · the decision entry is `status: proposed` |

**Join 1 is the one to lead with.** A team that is blocked on a question it answered two
weeks ago is losing days to a filing problem, and the ticket will never say so — the ticket
was written before the decision existed and nobody went back.

**Join 4 is the one that does damage if you get it wrong.** If a proposal is in build, the
line is *"this is in build and the decision behind it is still `proposed`"*, which is a
question for a person. It is never *"we decided to do offline mode."*

## Then write it

Format, section order, and voice are in **`references/update-format.md`**. Read it before
writing a line. Then run `/copy` so the result lands on the clipboard ready to paste.

**Save it to `projects/<project>/comms/<week-ending>-status.md`** — one file, in the folder
of the project you were asked about, same content before any hand-editing. That file records
what the team was told and when, which is the only thing it is good for. It is never a
source for a later update. See `projects/CLAUDE.md`.

**Never write into another project's folder.** If the update turned up something about a
project you weren't asked about, that is a sentence in the output for a person to act on,
not a file you file on their behalf.

## Rules

- **Cite every line.** An issue key for tracker items, a repo path for repo items, a frame
  id for design items. Every claim has to be checkable in one click, because the whole
  argument for this skill is that it read two things at once and you can verify it did.
- **Never infer a blocker.** If no source states a block, the Blocked section is empty and
  stays empty.
- **Merged is not shipped.** `Shipped` means all seven steps of
  `product/procedures/pre-release-checklist.md` passed with the flag still off. It means
  that in the tracker and it means that here.
- **House voice from `CLAUDE.md`.** "Learner," never "student" or "user." "Instructor,"
  never "teacher."
- **Empty sections get omitted, not filled.** A four-line update that is true beats an
  eight-line one with a padded Blocked section.

## Stop and ask a human when

- The decision log and the tracker disagree about what was decided. Report the disagreement;
  do not resolve it.
- The window contains a reversal. Those need a person to frame them.
- A join fires against something with a named owner outside this team. Say what you found
  and who owns it. Don't write the message to them.
