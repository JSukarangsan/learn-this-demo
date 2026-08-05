# Digest format

The shape of the output, and the rules that keep it honest. `SKILL.md` says what to read;
this says what to write.

## The template

```
**Week of {date}**

**Decided**
- {decision} — {one line of why} ({file})

**Moving**
- {project} — {what changed}, {what's next}

**Blocked**
- {what}, {on whom}, {since when}

**Open, not decided**
- {item, and why it isn't settled}
```

## What goes in each section

| Section | Comes from | Goes in only if |
|---|---|---|
| **Decided** | `product/decisions/` | `status: decided` **and** dated inside the window |
| **Moving** | Notion rows edited inside the window, plus `deliverables/*/` | the `Status` or `Release` actually moved — not "work continued" |
| **Blocked** | a Notion row's `Depends On`, or a repo file that **says** it's blocked | a source states the block. Never inferred. |
| **Open, not decided** | `status: proposed` entries, and Notion rows whose scope moved with nothing in the decision log behind it | the reader would otherwise assume it was settled |

**Empty sections get omitted, not filled.** A three-line digest that's true beats a
five-line one with a padded Blocked section.

## Rules

- **House voice from `CLAUDE.md`.** "Learner," never "student" or "user." "Instructor,"
  never "teacher."
- **Say the change, not the narrative.** What is different this week. Not what the team
  worked on.
- **One line per item.** If an item needs a paragraph, it needs its own doc and the digest
  links to it.
- **Numbers use the canonical definition.** If you cite a metric, it's the one in
  `insights/definitions.md`. Don't restate the definition — link the term. Check the
  *what a move signals* line before you call a move good or bad. Most moves here are
  cohort mix.
- **Never infer a blocker.** If no source says something is blocked, Blocked is empty.
  An invented blocker is worse than a short update.
- **Cite where each line came from.** A repo path for repo items, a Notion row title for
  backlog items. The reader needs to be able to go check.
- **Nothing "shipped" until the pre-release checklist passed with the flag still off.**
  That is what `Shipped` means in the backlog and it is what it means here. Merged is not
  shipped.

## The one that's easy to get wrong

A backlog row that moved with no decision entry is **not** a Decided item, and it is not a
Moving item either. It's an *Open, not decided* item, phrased as the gap:

> - External calendar sync moved from Cut back to Backlog. The project brief still says
>   "out of scope, settled" and there's nothing in the decision log. Somebody changed their
>   mind and didn't write it down. (Notion → Backlog, task 7)

That line is the highest-value thing this skill produces. It's the one a human would only
catch by reading both sources side by side, which is exactly what nobody does on a Friday.

## Worked example

Real output, week of Aug 3.

```
**Week of Aug 3**

**Decided**
- A cohort's timezone is locked at creation — one per cohort, never per learner, because
  a live session is a single moment. Prompted by three ops errors last month, all the
  same mistake. (product/decisions/2026-08-04-timezone-locked-at-creation.md)

**Moving**
- Cohort scheduling — schedule entry and pre-start editing are in build; the timezone
  picker is behind a flag. Hand-entered schedules are at 11 a month against 40 in May,
  and the brief's bar is zero for two consecutive weeks. Trending, not done.
  (Backlog 1-4; deliverables/cohort-scheduling/brief.md)
- Mobile enrollment funnel — the 320px pass moved to In build. Funnel target is 82% to
  88% and mobile is where the loss is. (Backlog 15; team/goals-and-okrs.md)
- Course title normalization — owner moved to Instructor Tools. Title storage is their
  content model, so the fix was never ours to make. (Backlog 12)

**Blocked**
- Vendor SDK upgrade, on a session-recording regression pass owned by Instructor Tools.
  Two weeks, still not scheduled. (Backlog 9)

**Open, not decided**
- Calendar export moved from Cut back to Backlog after three instructor requests. The
  brief still says "out of scope, settled" and the decision log has nothing.
  (Backlog 7; deliverables/cohort-scheduling/brief.md)
- Editing a schedule after the cohort starts came up again Tuesday and was left where it
  was. Named as a follow-up, never written up.
  (comms/notes/2026-08-04-cohort-scheduling-review.md)
- Offline mode is still a request, not a plan — Instructor Tools hasn't agreed to the
  content-model change. (product/decisions/2026-07-02-offline-mode.md, status: proposed)
```

Note what isn't there. No "the team continued work on search relevance." No completion-rate
number, because nothing in the window moved it and quoting one would invite a wrong
conclusion. Four sections, eight lines, and every line is checkable.

The last two *Open* items are the ones that justify the skill. Neither exists in a single
source — one is the backlog disagreeing with a brief, the other is a meeting follow-up that
never reached the decision log. Finding them by hand means reading three places at once.
