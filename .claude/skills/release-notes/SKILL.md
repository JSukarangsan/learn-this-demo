---
name: release-notes
description: Draft release notes for a Learn.this release from the decision log and what's currently behind a flag. Use when someone asks for release notes, a changelog entry, or a "what shipped" summary.
---

# Release notes

Draft the notes. Don't publish them.

## What to read

1. `product/decisions/` — entries since the last release.
   **Only entries with `status: decided`.** A `proposed` entry is not a thing that
   shipped and must never appear in notes.
2. What's behind a flag and now on. "Done" here means behind a flag and the checklist
   passed, so merged-but-off is not shipped.
3. `insights/definitions.md` — if a note mentions a number, use the canonical definition
   from that file. Do not restate the definition in the notes; link the term.

## How to write them

- House voice from `CLAUDE.md`: "learner," never "student" or "user."
- Say the change, not the narrative. What is different for a learner after this ships.
- One line per change. If a change needs a paragraph, it needs its own post.
- No feature names the audience hasn't seen. Internal project names never appear.

## What to leave for a human

- Anything touching payments, refunds, or enrollment mid-cohort. Flag it and stop.
- Anything where the decision log and the flag state disagree. That's a real
  discrepancy and it wants a person, not a guess.
