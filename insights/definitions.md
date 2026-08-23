# Definitions

One entry per term. Every entry names the canonical source **and the rule for when
sources disagree** — a glossary without an arbitration rule is a list of opinions.

**The definitions we arbitrate against belong to other teams.** Billing's and Growth's
each move on their own schedule and neither announces it, which means an arbitration rule
here is only right for as long as their side is what we last read. Reconcile quarterly —
see `external_metric_definitions` in `../context-manifest.yaml`. The rules and the *what a
move signals* notes are ours; nothing upstream produces those.

## Active learner

Canonical: enrolled in a cohort with a session in the next 14 days.
Use this for anything about the app.

Two other definitions exist here. Both real, both wrong for us:

- **Billing** counts anyone with a paid seat — including seats an org bought and never
  assigned. Bigger number. Correct for revenue. Never for engagement.
- **The marketing dashboard** counts anyone who logged in this month. Includes
  instructors. Includes us.

**When they disagree:** this definition wins for anything about the app.
Billing wins for anything with a dollar sign.

**What a move signals:** this number is seasonal. It tracks cohort start dates, not what
we shipped. A drop between cohorts is normal. Check the cohort calendar before you
investigate anything.

## Completion rate

Canonical: learners who attended at least 60% of live sessions in a cohort, divided by
learners enrolled at cohort start. Denominator is fixed at start — late enrollments do
not dilute it.

**When they disagree:** Instructor Tools reports a per-assignment completion that is a
different measure entirely. Neither is wrong; they answer different questions. Say which
one you mean.

**What a move signals:** almost always cohort mix, not product. A single large org cohort
can move the company number several points on its own. Segment before concluding anything.

## Seat utilization

Canonical: assigned seats ÷ purchased seats, per org, at time of asking.

**What a move signals:** this is a customer-success number, not a product one. Low
utilization means an org admin hasn't finished onboarding, and the fix is an email
from their CSM rather than anything we build.

## Time to first session

Canonical: enrollment timestamp → start of the learner's first attended session.

**Careful:** the floor is set by the cohort calendar, not by us. If the next cohort
starts in nine days, nobody's time-to-first-session is under nine days no matter what
we ship. Compare within a cohort, never across.
