# Design

Read on top of `../CLAUDE.md`.

This folder is two files on purpose, and the split is the point. Half of a design system
is structured data and cannot be written as prose without going wrong within a month.
The other half is judgment and has no schema. So: values in `tokens.json`, judgment here.

## What structure can't hold

- **No modals in enrollment.** We tested it; completion dropped 11 points on mobile.
  Inline, or its own route. See `../product/decisions/2026-05-19-no-modals-in-enrollment.md`.
- **Every screen works at 320px.** Around 40% of learners attend on a phone while doing
  something else. 320 is not an edge case here, it's the second-most-common width.
- **Empty states are written by design, not product.** They're the most-read copy in the
  app — a learner between cohorts sees them more than anything else.
- **Never put a countdown on a live session.** Tried it; instructors hated it and it made
  a two-minute delay feel like a failure.
- **Assigned learners don't see pricing. Ever.** Their org bought the seat. Showing a
  price to someone who can't buy is the single most common complaint from org admins.

## What structure does hold

`tokens.json` — the actual values. Don't describe them here. They'll drift.
