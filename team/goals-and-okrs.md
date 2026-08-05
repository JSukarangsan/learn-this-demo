# Webapp — goals and OKRs

> 2026. Refresh at half planning.
> **Definitions are not repeated here.** Every metric below is defined in
> `../insights/definitions.md`, including which source wins when two disagree.

## What we're trying to move

| Metric | Target | Note |
|---|---|---|
| Completion rate | +4 pts | Segmented. The blended number will move on cohort mix alone. |
| Time to first session | Reduce the *controllable* part | Floor is set by the cohort calendar, not by us |
| Enrollment completion (funnel) | 82% → 88% | Mobile is where the loss is |
| Schedules entered by ops by hand | 40/mo → 0 | The cohort-scheduling project |

## Guardrails — do not let these get worse

| Guardrail | Why it's here |
|---|---|
| Live session reliability | A dropped live session is unrecoverable. There's no "try again later" for a scheduled class with 30 people in it. |
| Refund volume | Every mid-cohort enrollment change is a manual refund and Finance eats the difference |
| 320px | ~40% of live attendance is mobile. A regression here is invisible in our own testing and very visible to learners. |
| Support tickets per cohort | Our cheapest early-warning signal. It moves before any metric does. |

## The thing to understand about our numbers

**Almost every metric we have is dominated by cohort mix rather than by anything we ship.**
One large org cohort can move the company completion number several points on its own.

This is the single most common way someone new draws a wrong conclusion here, and it's why
`../insights/definitions.md` carries a "what a move signals" line on every entry. Read it
before you investigate a number. Most investigations here should end in the first ten
minutes with "it's the calendar."
