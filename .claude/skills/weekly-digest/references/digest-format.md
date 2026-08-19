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
| **Moving** | tracker issues updated inside the window, plus `projects/<project>/` | the `status` actually moved — not "work continued" |
| **Blocked** | an issue's *blocked by* link, or a repo file that **says** it's blocked | a source states the block. Never inferred. |
| **Open, not decided** | `status: proposed` entries, and tracker issues whose scope moved with nothing in the decision log behind it | the reader would otherwise assume it was settled |

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
- **Cite where each line came from.** A repo path for repo items, a ticket key for tracked
  items. The reader needs to be able to go check.
- **Nothing "shipped" until the pre-release checklist passed with the flag still off.**
  That is what `Shipped` means in the backlog and it is what it means here. Merged is not
  shipped.

## The one that's easy to get wrong

A tracked issue that moved with no decision entry is **not** a Decided item, and it is not a
Moving item either. It's an *Open, not decided* item, phrased as the gap:

> - External calendar sync moved from Cut back to Backlog. The project brief still says
>   "out of scope, settled" and there's nothing in the decision log. Somebody changed their
>   mind and didn't write it down. (SCRUM-9)

That line is the highest-value thing this skill produces. It's the one a human would only
catch by reading both sources side by side, which is exactly what nobody does on a Friday.

## Worked example

Real output, week of Aug 10, for `cohort-scheduling`.

```
**Week of Aug 10** — cohort scheduling

**Decided**
- Pre-start schedule edits need one approval, not two — a pre-start edit touches neither
  enrollment nor money, so the standard review bar applies.
  (product/decisions/2026-08-12-schedule-edit-review-bar.md)

**Moving**
- Pre-start editing (SCRUM-6) cleared review under the new bar and is still in build.
  Schedule entry (SCRUM-5) and cohort-timezone rendering (SCRUM-8) moved with it. The
  timezone picker (SCRUM-7) is still behind a flag — not shipped.
  (SCRUM-5, SCRUM-6, SCRUM-7, SCRUM-8)

**Blocked**
- The timezone model — per cohort or per learner — is waiting on a product call and hasn't
  been touched since Jul 29. (SCRUM-14)

**Open, not decided**
- External calendar sync moved from Cut back to Backlog after three instructor requests.
  The brief still says "out of scope, settled" and the decision log has nothing.
  (SCRUM-9; projects/cohort-scheduling/deliverables/requirements/brief.md)
- Editing a schedule *after* a cohort starts is still unscoped. The Aug 12 decision says
  explicitly that it doesn't touch that question, and the roadmap has it as a no.
  (product/decisions/2026-08-12-schedule-edit-review-bar.md; team/roadmap-and-bets.md)
```

Note what isn't there. Nothing about enrollment, search relevance, or the vendor SDK —
those are other projects' tickets and other projects' digests, even where they turned up in
this project's `comms/`. No completion-rate number, because nothing in the window moved it
and quoting one would invite a wrong conclusion. Four sections, five lines, every line
checkable against a ticket key or a repo path.

The two *Open* items are the ones that justify the skill. Neither exists in a single source
— one is the tracker disagreeing with a brief, the other is a boundary the decision log
draws and the tracker has no way to represent. Finding them by hand means reading both at
once, which is exactly what nobody does on a Friday.
