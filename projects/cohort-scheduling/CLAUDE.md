# Project — Cohort scheduling

Let instructors set a session schedule when they create a cohort, instead of emailing
it to us.

Reads `../../CLAUDE.md` and the four domain folders above this. Only what's specific to
this project goes here.

## The thing that keeps biting us

Timezones are per-cohort, not per-learner. An instructor in Lisbon running a cohort for
a company in Denver sets the schedule in Denver time. We got this backwards in the first
draft and the fix touched nine files.

## Out of scope, and it's settled

Recurring schedules. Calendar sync. Both requested, both deferred — see
`../../product/decisions/`.

## Where the real material is

- `brief.md` — the spec
- `notes/2026-07-14-instructor-interview.md` — three instructors, unprocessed.
  The complaints are in here.
