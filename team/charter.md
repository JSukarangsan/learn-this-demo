# Webapp — charter

> Last refreshed: 2026-07. Reviewed at half planning.
> Source: H2 planning doc — see `../index.md` for where it lives.

## What this team is for

We own the learner-facing web application: catalog, enrollment, the live session
experience, and everything a learner touches between signing up and finishing a cohort.

Six people. PM, three engineers, a designer, an analyst. The analyst is shared with Growth
at roughly half time, which is a real constraint on how much measurement we can carry.

## What we are not

- **Not the authoring experience.** Instructor Tools owns course creation and the content
  model. We render what they define. Almost every "can we just…" question about course
  structure is a conversation with them, not a ticket for us.
- **Not acquisition.** Growth owns everything above the signup. We start at the catalog.
- **Not the admin console.** Org admins buying and assigning seats is Billing's surface.
  We inherit the consequences of it, which is why so much of our complexity is the
  self-serve-vs-assigned split.

Naming those three boundaries out loud is most of what this file is for. New people spend
their first month rediscovering them.

## The business, briefly

Two-sided. Instructors bring an audience; learners pay for access. Revenue is split
between individual seats bought self-serve and bulk seats bought by organizations, and
the org half is growing faster.

That mix shift matters more to us than it sounds. Org-assigned learners didn't choose the
course, are less motivated, and complete at meaningfully lower rates. As the mix shifts,
our completion numbers get worse without anything about the product getting worse. Segment
before you conclude anything — see `../insights/definitions.md`.

## The pressure we're under

Cohort-based learning is a crowded market and the differentiator is completion, not
catalog size. Anyone can host video. What's hard is people actually finishing, and
that's where the live-session model earns its cost.

The standing threat is that an org renews, looks at utilization, and finds half the seats
they bought were never assigned. That's not a product failure but it reads like one at
renewal, which is why seat utilization sits on our dashboard even though the fix is a CSM
email rather than anything we build.
