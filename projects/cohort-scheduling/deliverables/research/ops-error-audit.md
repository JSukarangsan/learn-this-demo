# Ops schedule-error audit — July 2026

**Derived from a person, not a system.** Priyanka pulled every schedule ops entered by
hand in July and flagged the ones that had to be corrected after the cohort was live.
40 schedules, 3 corrections. This is the evidence behind `../requirements/brief.md`.

## The three

All three were the same mistake, which is the finding.

**Cohort 1184 — Lisbon instructor, Denver client.** Instructor emailed "sessions at 3pm."
Ops entered 15:00 and the cohort read it in the cohort's timezone, which was Denver.
Instructor meant Lisbon. Seven hours out. Caught when four learners joined an empty room.

**Cohort 1207 — instructor in London, cohort in London.** Instructor wrote "3pm BST."
Ops entered 15:00 UTC. One hour out for six weeks; nobody reported it because everyone
adjusted and assumed the calendar was right.

**Cohort 1219 — same shape as 1184.** Instructor in Berlin, cohort assigned to a US org.
Nine hours out. Caught before the first session because the instructor happened to look at
the learner-facing page.

## What it says

The error is never arithmetic. In all three, ops typed exactly the number they were given.
**The failure is that "3pm" is ambiguous in an email and nobody notices which timezone the
person meant until a session is empty.**

That rules out the obvious fixes. A better form for ops doesn't help, because ops entered
the number correctly. A validation warning doesn't help, because there's nothing invalid
about 15:00. Asking ops to confirm the timezone moves the guess from the instructor to
someone with less information.

The fix has to put the timezone question in front of the person who knows the answer,
while they still have it in their head. That is why the timezone is chosen at cohort
creation by the instructor, and it is the reasoning behind
`../../../../product/decisions/2026-08-04-timezone-locked-at-creation.md`.

## The honest limits

**Three is a small number.** It supports "this is one recurring failure mode" and it does
not support any rate we might quote. Nobody should build a projection on three incidents.

**Only corrections that were caught are in here.** Cohort 1207 ran wrong for six weeks and
surfaced by accident. There is no way to count the ones that ran an hour out and everybody
silently absorbed, so the real number is higher than three by an unknown amount.

**June and earlier weren't audited.** July was picked because that's what Priyanka had to
hand, not because anything about July was representative.
