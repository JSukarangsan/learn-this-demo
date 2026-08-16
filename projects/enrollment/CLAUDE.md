# Project — Enrollment

The path from a course page to a learner being in a cohort. Shipped, and still the place
we find things.

Reads `../../CLAUDE.md` and the domain folders above this. Only what's specific to
enrollment goes here.

## Settled, and it gets re-proposed about twice a year

**No modals.** Not a small one, not a bottom sheet. We tested a modal confirmation and
completion dropped 11 points on mobile; the smaller variants tested worse than inline.
Inline confirmation, or its own route. See
`../../product/decisions/2026-05-19-no-modals-in-enrollment.md`.

It comes back because the modal is faster to build, and it will come back again. The
decision entry is the answer — this file exists so nobody has to go find it first.

## Where self-serve and assigned diverge

They diverge at enrollment and at billing, every time, and enrollment is where it is
easiest to forget. **An assigned learner cannot buy anything**, so any screen in this flow
that shows a price to one is the top org-admin complaint in `../../design/CLAUDE.md`
arriving on a support queue.

Step 3 of `../../product/procedures/pre-release-checklist.md` exists because of this flow.

## Open, and found in a design review rather than in the spec

**Nobody knows what a learner sees when a cohort is full.** The card shows the start date
and the session count; a learner clicks through, reaches the course page, and finds out
there. Ops gets those emails. Raised 2026-08-05 —
`comms/2026-08-05-design-review-signup.md` — and it has not become a decision or a ticket.

That note is a meeting, not a settlement. Nothing in it is decided.
