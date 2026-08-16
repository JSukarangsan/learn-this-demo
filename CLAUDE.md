# Webapp team — Learn.this

**This is one team's repo, not the company's.** We own the learner-facing web
application: catalog, enrollment, the live session experience, and everything a learner
touches between signing up and finishing a cohort. Six people — PM, three engineers, a
designer, a half-time analyst.

Learn.this is a cohort-based course platform. Instructors run scheduled classes; learners
enroll, attend live, submit assignments. Three other teams own the rest of it —
Instructor Tools (course creation and the content model), Growth (everything above
signup), Billing (the org admin console). **Read `team/charter.md` before assuming
something is ours.** Most "can we just…" questions turn out to belong to one of them, and
the boundary is the answer more often than the feature is.

## House rules

- "Learner," never "student" or "user," in anything customer-facing. "Instructor," never "teacher."
- Specs are written as the change, not as a narrative. What's different after this ships.
- "Done" means behind a flag and the release checklist passed. Not merged.

## Before you answer anything about numbers

Read `insights/definitions.md`. "Active learner" has three definitions in this company
and two of them are wrong for our purposes.

## Where to look

- `team/` — our charter, goals, roadmap, stakeholders, who owns what, how we run. Changes rarely.
- `team/_generated/` — summaries of documents other teams own, written by the refresh
  pipeline from `context-manifest.yaml`. **Never edit these; the source wins.**
- `product/` — decisions we've made, our glossary, why the product is the way it is
- `engineering/` — our service boundaries and the things you must not do
- `design/` — tokens, plus the rules that aren't in the tokens
- `insights/` — what our metrics actually mean. Read this before any number.
- `comms/notes/` — meeting notes and transcripts for meetings that **span projects**. A
  meeting about one project is filed with that project. **Raw, and not canonical** — a
  thing said in a meeting is not a thing decided. Check `product/decisions/` before you
  report anything from here as settled.
- `comms/status/` — status reports we've sent. **Derived, not authored** — generated from
  the rest of the repo, so if one disagrees with its source, the source wins.
- `projects/` — one folder per piece of work in flight. Changes daily. Each project holds
  its own `comms/` and a `deliverables/` split by stage of work. See `projects/CLAUDE.md`
  for the shape and the rule that keeps a project folder from becoming a second copy of
  everything above it.

## What isn't ours to hold

Company strategy, the content model, pricing, the billing console. When we need any of
it, `context-manifest.yaml` says where it lives, who owns it, and whether a tool can reach
it — a pointer, not a copy. Maintaining a copy of another team's document is a race you
lose.

The manifest is also where our own out-of-repo sources live: the tracker, the Figma
file, the ops calendar. **Nothing in it refreshes itself** — `/refresh-index` checks the
pointers and proposes edits, and a person confirms them.
