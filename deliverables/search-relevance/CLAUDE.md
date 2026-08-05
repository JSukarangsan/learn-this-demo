# Project — Search relevance

Catalog search returns bad results for multi-word queries.

## What we already know, so nobody re-derives it

Course titles are instructor-authored and inconsistent — "Intro to X," "X 101," and
"Getting Started with X" are all the same shape and none of them match each other.
The relevance problem is mostly a titling problem.

Instructor Tools owns the content model. Any fix that touches how titles are stored is
a conversation with Marguerite before it's a ticket. See `../../team/ownership.md`.

## Out of scope

Personalized ranking. We don't have the behavioral data to do it well and a bad
personalized ranker is worse than a plain one.
