# Digest format

The shape of the output, and the rules that keep it honest. `SKILL.md` says what to read
and where to write it; this says what to write.

## The template

```
**Week of {date}** (covering {window})

**Needs a person**
- {what Slack/a transcript said} · {what the tracker says} · {what the decision log
  says} — and the question, not the answer. ({sources})

**Blocked**
- {what}, {on whom}, {since when}. ({issue})

**Moving**
- {project} — {what changed}, {what's next}. ({issues}; {file})

**Decided**
- {decision} — {one line of why}. ({file})
```

**Needs a person first, Decided last.** Same inversion as `/build-update` and for the
same reason: this is read by someone deciding what to do about a disagreement, not by
someone catching up on history. The thing they can act on goes at the top.

## What goes in each section

| Section | Comes from | Goes in only if |
|---|---|---|
| **Needs a person** | Slack or a transcript, cross-checked against the tracker and `product/decisions/` / `roadmap-and-bets.md` | all three genuinely disagree — see *the join that matters* in `SKILL.md` |
| **Blocked** | an issue link that says blocked, or a source that states it directly | a source states the block. Never inferred. |
| **Moving** | tracker items whose status actually moved, plus decisions that unblocked them | the status moved, not "work continued" |
| **Decided** | `product/decisions/` | `status: decided` **and** dated inside the window |

**Empty sections get omitted, not filled.** A three-line digest that's true beats a
five-line one with a padded *Needs a person* section — that section is the one most
likely to get padded because it's the one people want to see fire, which is exactly why
it can't be.

## Phrasing *Needs a person*

Name what each source actually said, not a summary that already picked a side.

> - Jira and #webapp disagree about whether "edit a schedule after a cohort starts" is
>   in scope. `team/roadmap-and-bets.md` lists it under "what we said no to" — one
>   instructor interview said they wouldn't even use it. In Slack on Aug 17, the team
>   talked about it like it's already agreed and starting this sprint, and said they'd
>   open a ticket; none exists yet. Report this as Moving, or hold it at Open until Jira
>   or the decision log catches up?

Note what that line does *not* do: it doesn't say which answer is right, and it doesn't
soften "we said no" into "we discussed." Both sources get quoted at the strength they
actually said it.

## Writing to the tracker

The *Key Decisions* and *Risk Log* tabs are the same claims as the digest, in row form —
not a second draft with its own wording. One row per **Decided** line goes to *Key
Decisions* (columns: Date, Decision, Why, Source, Status). One row per **Needs a person**
and **Blocked** line goes to *Risk Log* (columns: Date raised, Risk, Evidence, Status,
Next step). If a line's wording changes between the digest and the tracker, one of them
is wrong — regenerate both from the same run rather than patching either by hand.

## Rules

- **Cite every line.** A ticket key for tracker items, a repo path for repo items,
  "Slack #webapp, {date}" for a conversation. The whole argument for this skill is that
  it read sources against each other and you can go check that it did.
- **A Slack message or a transcript can never produce a Decided line**, no matter how
  settled the conversation sounded. Only `product/decisions/` can.
- **Never infer a blocker.** If nothing states a block, Blocked stays empty.
- **House voice from `CLAUDE.md`.** "Learner," never "student" or "user." "Instructor,"
  never "teacher."
- **One line per item.** An item that needs a paragraph needs its own doc, linked.

## Worked example

Real output, week of Aug 17.

```
**Week of Aug 17** (covering Aug 11–17)

**Needs a person**
- Jira and #webapp disagree about whether "edit a schedule after a cohort starts" is in
  scope. team/roadmap-and-bets.md lists it under "what we said no to" — one instructor
  interview said they wouldn't even use it. In Slack on Aug 17, Wren, Marguerite,
  Tobias, and Priyanka talked about it like it's already agreed and starting this
  sprint; Wren said "I'll open the ticket," but no SCRUM ticket exists yet. Report this
  as Moving — treat Slack as the real signal — or hold it at Open, not decided, until
  Jira or the decision log catches up? (team/roadmap-and-bets.md; Slack #webapp, Aug 17)

**Blocked**
- Vendor SDK upgrade, on a session-recording regression pass owned by Instructor Tools.
  Now has a date — week of Aug 24 — but that's only been said in standup, not written
  into the ticket yet. (SCRUM-10, SCRUM-11; projects/cohort-scheduling/comms/2026-08-13-standup.md)

**Moving**
- Cohort scheduling — pre-start editing (SCRUM-6) cleared review under the new
  one-approval bar. The timezone picker (SCRUM-7, SCRUM-8) is still behind a flag, still
  in build. (SCRUM-6, SCRUM-7, SCRUM-8; product/decisions/2026-08-12-schedule-edit-review-bar.md)

**Decided**
- Pre-start schedule edits need one approval, not two — a pre-start edit doesn't touch
  enrollment or money, so the standard bar applies.
  (product/decisions/2026-08-12-schedule-edit-review-bar.md)
```

**The first line is the one that justifies the skill.** It doesn't exist in the tracker,
which shows no ticket. It doesn't exist in the decision log, which has nothing this week.
It only exists by reading a Slack conversation against a roadmap file from a different
folder — which is exactly what nobody does on a Friday, and the reason the tracker and
the room can disagree for weeks without anyone noticing.
