# Search relevance — brief

**The change:** catalog search returns the right course for a multi-word query.

**Why now:** it is the second-most-common entry point to the catalog and the first one
that fails. Scoped only — nothing is in build.

## The thing that decides the shape of this project

**It is mostly a titling problem, not a ranking problem.** Course titles are
instructor-authored and inconsistent: "Intro to X," "X 101," and "Getting Started with X"
are the same course shape and none of them match each other.

That changes who has to fix it. Title storage is Instructor Tools' content model, so the
fix is a conversation with Marguerite before it is a ticket. See
`../../../../team/ownership.md` — and note that content-model questions get answered in
the weekly sync, not in Slack.

`SCRUM-12` is the normalization work and its owner already moved to Instructor Tools.
`SCRUM-18` is the ranking work and it is behind it.

**In scope**
- Title normalization, if Instructor Tools takes it
- Ranking that assumes normalized titles

**Out of scope**
- **Personalized ranking.** We do not have the behavioral data to do it well, and a bad
  personalized ranker is worse than a plain one — it fails differently for every learner,
  so nobody can reproduce the complaint.
- Search across session content or recordings. Different problem, different index.

## Done when

Not defined, deliberately. **This project does not have an acceptance bar yet because the
scope depends on a decision Instructor Tools has not made.** Writing one now would be
writing it for work we might not own.

Deciding that before the sync is how a brief ends up describing a project that never
happened.
