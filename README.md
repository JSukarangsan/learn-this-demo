# Webapp team — context repo

The context layer for the team that builds the Learn.this learner-facing web app. It's
what a new person — or an agent — reads to work on this product without asking six
people six questions first.

> **Learn.this is not a real company.** It's an invented cohort-course platform, built as
> a teaching artifact for a context design cohort. Every person, number, decision and
> constraint in this repo is fiction, and nothing here describes any real team or product.

## What's in it

About thirty short files, ordered by how often they change.

```
CLAUDE.md         what this team owns, and what it doesn't. Read first.
context-manifest.yaml   where the sources of truth live — including the ones outside this repo

team/             charter · goals · roadmap · stakeholders · ownership · how we work
product/          decisions with a status · glossary · procedures
engineering/      service boundaries, and the things you must not do
design/           tokens.json, plus the judgment tokens can't hold
insights/         what each metric means, and which source wins
comms/notes/      meetings that span projects — raw input, never edited
comms/status/     status reports we've sent — generated output, disposable

projects/         one folder per piece of work in flight
  cohort-scheduling/            in build — all four stages
    comms/                        meetings about this project
    deliverables/
      requirements/                 brief.md · acceptance.md
      research/                     the evidence the brief is built on
      design/                       states and flows for this project only
      launch/                       how it goes out, and what we watch after
  enrollment/                   shipped, still learning
  search-relevance/             scoped — requirements only
  video-playback-v2/            not started — CLAUDE.md only

.claude/skills/   /build-update · /weekly-digest · /states-table · /refresh-index
```

**The four projects don't look alike, and that's deliberate.** A folder appears when there
is something to put in it, so you can read the state of the work off the tree. See
[`projects/CLAUDE.md`](projects/CLAUDE.md).

**It inherits downward.** Open Claude Code inside `projects/cohort-scheduling/` and it
reads that folder, then `product/`, `engineering/`, `design/`, then the root. Nobody
copies anything between them.

## The one rule that keeps it usable

**Stable and dynamic material never share a file.** `team/` changes quarterly and fails
silently — it can be wrong for months and nothing surfaces it. A project folder changes
weekly and fails loudly. Mixing them is how a stale goal ends up sitting inside a live
brief, and it's the most common way one of these rots.

The same split decides what's worth a notification: see
[`.github/merge-notify.md`](.github/merge-notify.md).

## It holds pointers, not copies

The tracked work is a Jira project. The UI is a Figma file. The ops calendar is in Drive.
None of them are duplicated here — `context-manifest.yaml` carries an entry for each with
its owner, a refresh cadence, whether a tool can reach it today, and when that was last
confirmed.

Three entries say `reachable: false`, and one of those adds `deliberate: true`. A pointer that
records something as authoritative and deliberately out of reach is a finished answer, not
a to-do.

**The manifest does not refresh itself.** Keeping it true is about fifteen minutes a month,
and it's the first thing here to go stale.

## Contributing

Branch, PR, one reviewer. The bar for adding a line: **the model got something wrong, and
this line would have prevented it.** A file that grows by anticipation grows without
limit and stops being read.

Deleting is maintenance, not cleanup. Wrong context is worse than missing context —
missing makes the model ask, wrong makes it confident.
