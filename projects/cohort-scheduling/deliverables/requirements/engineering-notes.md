# Cohort scheduling — engineering notes

Wren, Aug 5. Tuesday's follow-up said someone writes this up either way. Doing it, and in
more detail than I said it in the room — the short version came out sounding like a
preference and it isn't one.

## Why "edit before the cohort starts" is a hard line and not a scoping convenience

The brief has *edit before the cohort starts* in scope and editing after it starts out of
scope. That reads like we deferred a feature. We didn't — it's downstream of the
enrollment constraint, and the reason is worth having written down.

Once a cohort starts, learners hold three things we don't control: a calendar invite
generated at enrollment, a payment tied to a specific run, and in about a fifth of cases
an org admin's approval that named the dates. Moving a session invalidates all three.
The calendar invite is the one that bites — it's an `.ics` we already sent, and there is
no path that revokes it.

So a schedule change after start isn't a write to the schedule table. It's a write that
has to fan out to the enrollment service, re-issue invites, and give every affected
learner a decision to make. That's the instructor-confirmation path in
`../../../../engineering/constraints.md`, and **it does not exist yet.** Nobody is building it
this quarter.

## What this means for anything learner-facing

Any screen that shows a learner *this session moved* is a screen that can only appear
after a cohort has started. There is no pre-start version of it — before start, nobody
has been notified of anything, so there is nothing to correct. If such a screen exists,
the flow behind it is the confirmation path, and that's a different project.

## The timezone question from the review

Tobias asked whether we could let them change it later. I said no in the room without
explaining why, which is exactly how a question comes back. So: the same argument applies,
and it's worse. The timezone is baked into every invite we've already sent. Changing it after
start means every learner's calendar is wrong and we can't fix it from our side.
`../../../../product/decisions/2026-08-04-timezone-locked-at-creation.md` has the product reason;
this is the technical one, and they agree.

## Still blocked

Instructor Tools regression pass on the pinned video SDK. Two weeks. Tobias is asking
again Thursday. Unrelated to this project except that it's the same team we'd need for the
confirmation path.
