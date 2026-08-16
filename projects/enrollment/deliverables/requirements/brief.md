# Enrollment — brief

**The change:** a learner goes from a course page to enrolled in a cohort without leaving
the page or meeting a modal.

**Why now:** it shipped in July and the mobile funnel is still the weakest step we have.
The 320px pass is in build — `SCRUM-13`.

**In scope**
- Inline confirmation on the course page. Never a modal, per the May decision.
- Both learner types, with the assigned path never showing a price
- 320 as a first-class width, not a fallback

**Out of scope, settled**
- Modal or bottom-sheet confirmation. Tested, worse, decided.
- Waitlists. See the open question below — a waitlist is one answer to it and choosing an
  answer before we've asked the question is how we got the modal.

**Done when**
All seven steps of `../../../../product/procedures/pre-release-checklist.md` pass with the
flag off, and the mobile funnel holds its target from
`../../../../team/goals-and-okrs.md`. Use the funnel definition in
`../../../../insights/definitions.md`, not a hand-rolled one.

## Open

**What a learner sees when a cohort is full.** Not designed, not decided, and not a
ticket. Raised in the 2026-08-05 design review and left there.

This is written here rather than being quietly dropped because a brief that only lists
what we agreed is a brief that lies about the state of the work.
