# Cohort scheduling — brief

**The change:** an instructor creating a cohort sets its session schedule in the product.
Today they email it to ops and someone types it in.

**Why now:** ops enters roughly 40 schedules a month by hand and gets about three wrong,
each of which becomes a support thread with every learner in that cohort.

**In scope**
- Set a schedule at cohort creation: dates, times, duration
- Edit before the cohort starts
- The cohort's timezone is chosen once, at creation, and shown everywhere after

**Out of scope, settled**
- Recurring schedules
- External calendar sync
- Editing a schedule after the cohort has started — that needs the instructor-confirmation
  path in `../../engineering/constraints.md` and isn't this project

**Done when**
All seven steps of `../../product/procedures/pre-release-checklist.md` pass with the flag
still off, and ops has entered zero schedules by hand for two consecutive weeks.
