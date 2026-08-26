# Glossary

Product terms. **Metric definitions are in `../insights/definitions.md`** — if a term has
a number attached, it belongs there, not here.

**Half of these terms are not ours.** Instructor Tools owns *assignment* and *course*;
Billing owns *seat*. Their definitions change without telling us, so this file is a copy
we reconcile, not a document we own — see `shared_product_terms` in
`../context-manifest.yaml`. What *is* ours is the last line of each entry: the thing people
on this team get wrong. Keep that when you update one.

**Cohort** — one scheduled run of a course, with a fixed start date and a fixed roster.
A course can have many cohorts. This was not always true; see
`decisions/2026-03-12-multiple-cohorts-per-course.md`.

**Session** — one live meeting inside a cohort. Learners attend; instructors run it.

**Seat** — a purchased entitlement. Orgs buy seats in bulk and assign them later, so a
seat is not a learner and the counts legitimately differ. Billing counts seats. We don't.

**Enrollment** — a learner attached to a cohort. Created by the enrollment service, never
written directly. See `../engineering/constraints.md`.

**Assignment** — instructor-authored work inside a cohort. Owned by Instructor Tools;
we render it and never author it.

**Self-serve vs. assigned** — self-serve learners bought their own seat; assigned learners
were given one by an org admin. They behave differently at almost every step, and most
confusion in this product traces back to someone forgetting the difference.

## Learner states — the canonical list

Every learner-facing screen has to work for all four. This list is the one design and
engineering both work from; if you add a fifth, it goes here first.

| State | What it means | The thing people get wrong |
|---|---|---|
| **Anonymous** | Not signed in. Browsing the catalog. | Sees pricing. Must be able to reach a course page from search. |
| **Self-serve** | Signed in, bought their own seat | The default everyone designs for |
| **Assigned** | Signed in, seat given by an org admin | **Never sees pricing.** Their org bought it. Showing a price to someone who can't buy is the top org-admin complaint. |
| **Lapsed** | Was enrolled, cohort ended, no active seat | Most-forgotten state. They still have recordings and still get email, so they land on screens nobody designed for them. |
