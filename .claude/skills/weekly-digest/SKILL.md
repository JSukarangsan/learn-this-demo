---
name: weekly-digest
description: Assemble the weekly digest for ONE project from the context layer and the tracked work — decisions that landed, requirements that moved, and what's blocked — then format it for Slack. Use when someone asks for the weekly update on a project, a status digest, "what changed this week", or a team brief.
---

# Weekly digest

Assemble the update, save the record, and post it to Slack.

The information already exists. It's just scattered — a few folders in this repo and a
tracker outside it. Writing the update takes an hour because of the archaeology, not
because writing is hard.

## One project. Ask which one before you read anything.

**This skill is scoped to a single project and there is no all-projects mode.** A digest
that sweeps every folder is four thin project summaries stapled together, and the join that
makes it worth running — tracker scope read against the decision log — only holds inside one
project's boundary.

- **If the invocation named a project** — `/weekly-digest cohort-scheduling`, or the
  surrounding conversation is plainly about one — use it. Don't ask twice.
- **If it didn't, stop and ask before reading anything.** List what's in `projects/` with
  each one's state from `projects/CLAUDE.md` and let the person pick from that list rather
  than typing a path. Do not guess from which project looks busiest, and do not default to
  the first one alphabetically.

Everything below reads `projects/<project>/` — the one project. Where it says the tracker,
filter that to the same project.

## Keep it fast

Most of what's below contributes nothing on a normal week. The project and the window do
the filtering for you — apply both before you read, not after:

- **Filter by filename before you open anything.** Everything dated is date-prefixed
  (`product/decisions/YYYY-MM-DD-*.md`, `projects/*/comms/YYYY-MM-DD-*.md`). List the
  names, keep the ones inside the window, and open only those. On a typical week that is
  one or two files out of seventeen.
- **Never open another project's folder.** The scope is one project; `projects/` has four.
  Three of them are not part of this run at all.
- **One tracker query, not one ticket at a time.** A single JQL call scoped to the project,
  with the fields named in step 3, covers it. Pull an individual issue's description or
  comments only for a ticket already headed for *Moving*, *Blocked*, or *Open, not decided*.
- **Take each source at its word for its own step.** The one cross-check that matters is
  the specific one in step 3 — backlog scope against `product/decisions/`. That is not an
  invitation to go verify either against git history, a PR's merge state, or anything else
  outside this list.
- **One output file.** One project, one share, one status file.

## Read, in this order

1. **`team/how-we-work.md`** — the cadence, so you know what window you're reporting on.
   Everything below is filtered to that window.

2. **`product/decisions/`** — entries dated inside the window. The date is in the
   filename, so list the directory and open only the matches; don't read the log.
   **Only entries with `status: decided`.** A `proposed` entry has not happened. Putting one
   under what shipped is how an agent tells the company something is settled that isn't.
   A newsworthy proposal goes under *Open, not decided* — never anywhere else.

3. **The tracked work** — where requirements actually change. This repo does not hold a
   copy of it. See *Reaching the tracker* below.

4. **`projects/<project>/`** — the project `CLAUDE.md` and
   `deliverables/requirements/brief.md`, for what "done" was supposed to mean, so you can
   say whether the week moved toward it. If the project has no `deliverables/requirements/`,
   say so — nobody has scoped it, so there is no "done" to measure the week against.

5. **`projects/<project>/comms/`, the files without a `-status` suffix** — meeting notes and
   transcripts dated inside the window. Filter on the filename date first; on most weeks
   that leaves nothing to open.
   **Nothing here is canonical.** A thing said in a meeting is not a thing decided, so a
   notes file can never put an item under *Decided*. What it's good for is the opposite:
   a follow-up that was named and never became a decision entry is an *Open, not decided*
   line, and it's usually the one nobody else has noticed.

6. **`projects/<project>/comms/*-status.md`** — the most recent one, and no others, for one
   purpose only: **what you said was moving that hasn't moved since.** Don't lift lines from it. It's a previous run of this
   same skill, so quoting it compounds whatever it got wrong, and anything still true in
   it is still true in the sources you already read.

7. **`team/goals-and-okrs.md`** — what we're supposed to be moving. The update should say
   something about direction, not just list activity.

## Reaching the tracker

`context-manifest.yaml` → `sources.product_backlog` has the address. It is the source of
truth for scope, it is deliberately not a file in this repo, and the arrow points one way:
we know about the tracker, it knows nothing about us.

- Read the issues over the Jira MCP in **one query**, filtered to the project you were asked
  about — by its label or component, not the whole board. Fields that matter: `key`,
  `summary`, `status`, `updated`, and **issue links** — specifically what an issue is
  *blocked by*.
- **Blocked comes from the issue link and nothing else.** A summary that reads like a
  blocker is not one. A blocker may well sit outside the project; follow the link and report
  it as an external block rather than widening the digest to that project.
- **`updated` is a coarse signal — one bulk edit stamps the whole board.** If most of the
  project falls inside the window, that's a re-organisation, not a week of progress. Fall
  back to `status`: `In build` and `Behind flag` are Moving, `Shipped` needs a decision-log
  entry before you claim it, and `Backlog` or `Cut` only appear if something says they
  changed.
- **Cross-check what moved against `product/decisions/`.** Scope that changed with no
  decision entry behind it is the most useful line in the whole digest — somebody changed
  their mind and nobody wrote down why. That goes under *Open, not decided*. Doing this join
  is the repo's job; the tracker can't do it.
- If the tracker is unreachable, **say so in the digest and continue.** A digest that admits
  it is missing the tracker is fine. One that silently omits it is not.

## Then write it

Format, section order, and voice are in **`references/digest-format.md`**. Read it before
writing a line.

**Write to two places, from the same run, in this order:**

1. **`projects/<project>/comms/<week-ending>-status.md`** — same content, before any
   hand-editing. One project, one file; there is no squad-level `comms/`. That file is a
   record of what the team was told and when, which is the only thing it's good for — it
   is never a source for a later digest. See `projects/CLAUDE.md`.
2. **`#webapp`** — `context-manifest.yaml` → `sources.team_chat`. Post the same content,
   converted to Slack markdown per *Posting to Slack* in `references/digest-format.md`.
   This is a real post (`chat:write`), not a copy to the clipboard — check that Slack
   access is actually reachable for this skill in `context-manifest.yaml` →
   `available_connections` before relying on it; if it isn't, say so and stop rather than
   silently only writing the status file.

If the Slack post fails after the status file saved successfully, say so in the chat
response rather than reporting the run as fully done — a digest that's saved but never
reached the team is a partial run, not a finished one.

## Stop and ask a human when

- The decision log and the tracker disagree about what was decided
- Something looks blocked but nothing in either source says so
- The window contains a reversal — those need a person to frame them
