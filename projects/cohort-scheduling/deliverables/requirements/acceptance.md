# Cohort scheduling — acceptance

What has to be true before this is done. `brief.md` says what we're building; this says
how we'll know it worked.

**Done is not merged.** All seven steps of `../../../../product/procedures/pre-release-checklist.md`
pass with the flag still off, and ops has entered zero schedules by hand for two
consecutive weeks. The second half is the one that actually matters and the one most
likely to get quietly dropped, because it can't be checked on the day the code lands.

## Functional

- [ ] An instructor sets dates, times and duration during cohort creation, in one pass,
      without leaving the flow.
- [ ] The cohort's timezone is chosen at creation and is not editable afterwards.
      See `../../../../product/decisions/2026-08-04-timezone-locked-at-creation.md`.
- [ ] Every surface that renders a session time renders it in the cohort's timezone.
      Not the learner's, not the browser's.
- [ ] A schedule can be edited any time before the cohort starts, and not after.

## The measure

Ops enters roughly 40 schedules a month by hand and gets about three wrong. The bar is
**zero hand-entered schedules for two consecutive weeks**, not a reduction.

A reduction is not the same result. If ops still has to check every schedule, we have
moved the work rather than removed it, and the support threads that motivated this project
come from the ones nobody checked. Hand-entered schedules dropped from 40 in May to 11 in
July and that is trending, not done.

## What we are deliberately not measuring

**Time to create a cohort.** It will go up, because the instructor is now doing work ops
used to do. That is the trade and it is fine. Anyone who reports that number as a
regression has read the metric without reading this file.

## Not acceptance criteria, and here's why

- *"No support tickets about wrong schedules."* We can't attribute a ticket to a cause
  cleanly enough for it to be a gate, and a criterion nobody can adjudicate becomes a
  criterion someone waives.
- *"Instructors like it."* Real, and it belongs in `../research/`. A satisfaction read
  taken in the first fortnight measures novelty.
