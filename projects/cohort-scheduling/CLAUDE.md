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

- `deliverables/requirements/brief.md` — the spec
- `deliverables/requirements/acceptance.md` — what "done" means, which is not "merged"
- `deliverables/research/ops-error-audit.md` — the three wrong schedules, one by one.
  This is the evidence the brief is built on.
- `comms/2026-07-14-instructor-interview.md` — three instructors, unprocessed.
  The complaints are in here.
- `comms/2026-08-04-cohort-scheduling-review.md` — the review that raised editing after
  start and left it where it was. Named as a follow-up, never written up.
