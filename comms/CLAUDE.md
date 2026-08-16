# Comms

Read on top of `../CLAUDE.md`. **The unprocessed layer.** Nothing in here is canonical,
and the two subfolders aren't canonical for opposite reasons.

```
notes/    what was said. Input. Written by a person, never edited after the fact.
status/   what we told people. Output. Generated from the repo, and disposable.
```

Keeping them apart matters more than it looks. A raw transcript and a status report read
alike to a model — both are prose, both are dated, both describe the project. But one is
evidence and the other has already been filtered through somebody's judgment about what
mattered that week. Cite them the same way and you end up quoting a summary of a summary.

## `notes/`

Meeting notes and transcripts, for meetings that span projects. Currently empty — every
meeting we've filed so far belonged to one project and lives with it. The folder stays
because the *distinction* it draws against `status/` is the point, not because it has
files in it.

- **Raw is the point. Do not clean these up.** A tidied transcript has already thrown away
  the half-sentence that turns out to matter three weeks later.
- Nothing here is a decision. Someone proposing something in a meeting reads exactly like
  someone deciding it, and this is the folder most likely to make a model confidently
  wrong. If a meeting settled something, the decision goes in `../product/decisions/` and
  this folder keeps the transcript that led to it.
- When you cite anything from here, **say it came from a meeting and name the date** — and
  check `../product/decisions/` before you report it as settled.

## `status/`

Weekly updates and status reports, mostly written by `/weekly-digest` and lightly edited
before they go out. `2026-08-03-status-webapp.md`.

- **These are derived, not authored.** Every line came from somewhere else in the repo — a
  decision entry, a project folder, the backlog. If a status report and its source
  disagree, the source is right and the report is stale.
- **Regenerate rather than patch.** Fixing a wrong line here fixes one document. Fixing
  the file it came from fixes every future report too.
- They're kept because they're a record of what the team was told and when, which is
  genuinely useful when somebody says *nobody mentioned this*. They are not kept because
  they're true.

## What's here, and what's one level down

**A meeting about one project is filed with that project**, in
`../projects/<project>/comms/`. This folder is for the rest: meetings that span projects,
leadership reviews that change two roadmaps at once, anything where filing it under one
project means the other two never find it.

`status/` always stays here. One status report covers every project, so it belongs to
none of them.

The split is about **where someone would look**, not about who was in the room. A design
review of the signup flow is enrollment's, even though three teams attended. The July
instructor interviews are cohort scheduling's, even though what they said touches search.

**The rules above apply identically down there, and matter more.** A note sitting in
`projects/cohort-scheduling/comms/` is next to that project's requirements and is still
not a requirement. Proximity to a spec is not authority.

## Dating

Date-prefix every file: `2026-08-04-<what-it-was>.md`. The date is the meeting, or the
week covered — never the day someone got around to filing it.
