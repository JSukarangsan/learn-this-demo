# Build update format

The shape of the output, and the rules that keep it honest. `SKILL.md` says what to read;
this says what to write.

## The template

```
**Build update — week of {date}**

**Needs a person**
- {the join that fired} ({source}, {source})

**Blocked**
- {what}, {on whom}, {since when} ({issue})

**Moving**
- {project} — {what changed}, {what's next} ({issues})

**Decided**
- {decision} — {one line of why} ({file})
```

**Blockers first, decisions last.** This is the inversion from `/weekly-digest`, and it is
deliberate. A weekly update is a record and reads best chronologically. A build update is
read by someone deciding what to do on Monday morning, and the thing they can act on goes at
the top.

## What goes in each section

| Section | Comes from | Goes in only if |
|---|---|---|
| **Needs a person** | the four joins in `SKILL.md` | two sources disagree, or one source knows something the other should have |
| **Blocked** | an issue link that says blocked | a source states the block. Never inferred. |
| **Moving** | issues whose `status` actually moved, plus `projects/*/` | the status moved. Not "work continued." |
| **Decided** | `product/decisions/` | `status: decided` **and** dated inside the window |

## Needs a person — how to phrase each join

**Join 1 — blocked on something already decided.** Name the ticket, the decision, and the
gap in days. The gap is the point.

> - LTHIS-18 is blocked pending a call on the timezone model. That call was made on Aug 4
>   and the ticket has not been touched since Jul 29.
>   (LTHIS-18; product/decisions/2026-08-04-timezone-locked-at-creation.md)

**Join 2 — designed, not tracked.** Name the frame. Do not speculate about why.

> - The self-serve error state on desktop home is designed (`20:119`) and has no ticket.
>   (Figma `01 · Home`; no matching issue in the tracker)

**Join 3 — scope moved, nothing written down.** Phrase it as the gap, not as the move.

> - External calendar sync moved from Cut back to Backlog on Aug 11. The brief still says
>   "out of scope, settled" and the decision log has nothing. Somebody changed their mind
>   and didn't write it down. (LTHIS-7; projects/cohort-scheduling/brief.md)

**Join 4 — proposal in build.** Never state the proposal as the plan.

> - Offline mode is in build and the decision behind it is still `proposed` — Instructor
>   Tools has not agreed to the content-model change it depends on.
>   (LTHIS-21; product/decisions/2026-07-02-offline-mode.md, status: proposed)

## Rules

- **One line per item.** If an item needs a paragraph it needs its own doc, and this links
  to it.
- **Say the change, not the narrative.** What is different. Not what the team worked on.
- **Numbers use the canonical definition** in `insights/definitions.md`. Don't restate the
  definition; name the term. Check the *what a move signals* line before you call a move
  good or bad.
- **Cite where each line came from.** Issue key, repo path, or frame id.
- **If no join fired, say that in one line and stop.** "Nothing this week needed a person —
  four issues moved, one is blocked, and the decision log and the tracker agree." That is a
  good week and a good update. Padding it is how the skill stops being trusted.

## Worked example

What a run over the week of Aug 10 should produce.

```
**Build update — week of Aug 10**

**Needs a person**
- LTHIS-18 is blocked pending a call on the timezone model. That call was made on Aug 4
  and the ticket has not been touched since Jul 29. Two weeks of a build item waiting on
  an answer that exists.
  (LTHIS-18; product/decisions/2026-08-04-timezone-locked-at-creation.md)
- Offline mode is in build and the decision behind it is still `proposed`. Instructor
  Tools has not agreed to the content-model change it depends on.
  (LTHIS-21; product/decisions/2026-07-02-offline-mode.md, status: proposed)
- External calendar sync moved from Cut back to Backlog on Aug 11 after three instructor
  requests. The brief still says "out of scope, settled" and the decision log has nothing.
  (LTHIS-7; projects/cohort-scheduling/brief.md)
- The self-serve error state on desktop home is designed and has no ticket. So is the
  40px mobile nav button, which is under the 44 minimum in tokens.json.
  (Figma `01 · Home` 20:119, 21:7; design/tokens.json)

**Blocked**
- Vendor SDK upgrade, on a session-recording regression pass owned by Instructor Tools.
  Two weeks, still not scheduled. Escalation path is Tobias. (LTHIS-9 blocked by LTHIS-10;
  team/ownership.md)

**Moving**
- Cohort scheduling — schedule entry and pre-start editing are in build, the timezone
  picker is behind a flag. Brief's bar is zero hand-entered schedules for two consecutive
  weeks. Trending, not done. (LTHIS-1 to LTHIS-4; projects/cohort-scheduling/brief.md)
- Mobile enrollment — the 320px pass moved to In build. (LTHIS-15)

**Decided**
- Nothing dated inside this window. The Aug 4 timezone decision is the most recent and it
  is already reported.
```

Note what is not there. No "the team continued work on search relevance." No completion
number, because nothing in the window moved one and quoting it would invite a wrong
conclusion. The Blocked section has one line because one thing is blocked.

**Four of the five lines under *Needs a person* do not exist in any single source.** That is
the whole product. The tracker knows a ticket is blocked. Only this repo knows it shouldn't
be.
