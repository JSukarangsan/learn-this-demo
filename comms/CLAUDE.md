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

Meeting notes and transcripts. `2026-08-04-cohort-scheduling-review.md`.

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

## Why this isn't in `deliverables/`

A project folder holds what a project needs. Comms cuts across projects — one status
report covers three of them, and one leadership review changes two roadmaps at once.
Filing it under a project means the other two teams never find it.

## Dating

Date-prefix every file: `2026-08-04-<what-it-was>.md`. The date is the meeting, or the
week covered — never the day someone got around to filing it.
