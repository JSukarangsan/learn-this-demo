# 2026-08-04 — A cohort's timezone is locked at creation

status: decided

One timezone per cohort, chosen when the cohort is created, and not editable afterwards.
Every session time in the product renders in it.

Ops entered three schedules wrong last month and all three were the same mistake: an
instructor said "3pm" meaning their own timezone, and ops entered it as the cohort's. The
fix is not a better form. It's that there is exactly one timezone in play and the
instructor picks it while they are still thinking about it.

Considered a per-learner timezone and rejected it. A live session is a single moment; if
two learners see two different times for it, one of them is wrong and neither can tell
which. The cohort is the unit.

Editing the timezone after the cohort starts stays out of scope — that needs the
instructor-confirmation path in `../../engineering/constraints.md`.
