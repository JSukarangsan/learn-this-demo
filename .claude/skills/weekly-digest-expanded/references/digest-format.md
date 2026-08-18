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

**Name the person, not the system.** "Jira says" and "Slack says" are never the subject
of the sentence — Wren said something, Marguerite said something, an instructor said
something in an interview eighteen months ago. Systems don't disagree; people do, at
different times, sometimes without knowing about each other. That's the actual finding,
and it disappears the moment you write "the tracker and the channel are out of sync."

**Lead with the disagreement itself, not where you found it.** Where each side of it
lives — which file, which channel, which date — is citation, and citation goes in
parentheses at the end or in the Evidence column of the tracker. It's real and it has to
be checkable, but it's not the sentence's subject.

> - The team already sounds like it's agreed to build something instructors said, in
>   research, they wouldn't even use. In #webapp on Aug 17, Wren said "I think we just
>   build it," Tobias agreed to scope it this sprint, and Marguerite said she'd tell
>   instructors it's coming — Wren said they'd open the ticket, but nothing exists in
>   SCRUM yet. This was cut for exactly that reason, cited in `roadmap-and-bets.md`.
>   Hold to the roadmap call, or is this a real reversal that needs writing up?
>   (team/roadmap-and-bets.md; Slack #webapp, Aug 17)

Note what that version does that "Jira and Slack disagree" doesn't: a reader who's never
opened the repo still knows exactly what happened and who said it. And note what it still
doesn't do — it doesn't say which answer is right, and it doesn't soften "wouldn't even
use it" into "some hesitation." Quote people at the strength they actually said it.

## Writing to the tracker

The *Key Decisions* and *Risk Log* tabs are the same claims as the digest, in row form —
not a second draft with its own wording. One row per **Decided** line goes to *Key
Decisions* (columns: Date, Decision, Why, Source, Status). One row per **Needs a person**
and **Blocked** line goes to *Risk Log* (columns: Date raised, Risk, Evidence, Status,
Next step). If a line's wording changes between the digest and the tracker, one of them
is wrong — regenerate both from the same run rather than patching either by hand.

## The Slack notification

Not a repost of the digest, and not two lines either — enough that someone can decide
whether to click through without opening anything. One line per new Key Decisions row,
one line per new Risk Log row, in Slack markdown (single `*` for bold, `_` for italic,
`•` for bullets — Slack's syntax, not the digest's).

```
:bar_chart: *Weekly tracker update — week of {date}*

*✅ Key Decisions* _(+{n} this run)_
• {decision}, one line of why
• _(carried)_ {a row already in the tracker from a prior run, if any are relevant}

*🚧 Risk Log* _(+{n} this run)_
• 🚩 *Needs a person* — {what Slack/notes said}, {what the tracker and decision log say},
  and that they disagree. Never the resolution, just the disagreement.
• ⏳ *Blocked* — {what}, {on whom}, {what changed about it this week}

📄 Full digest, formatted → <{Doc link}|Read it here>
```

**🚩 marks a *Needs a person* row and nothing else.** It's the one emoji in here that
means something rather than decorating — if every row got a flag, none of them would.
⏳ is for Blocked, ✅ and 🚧 are section headers, not judgments on individual rows.

Not there: the Sheet link, ticket keys inline in the summary line, or the digest's own
section names used as if the reader already knows them ("Decided", "Needs a person" as
bare words with no context). Someone reading this in Slack hasn't opened the tracker yet.

## Rules

- **Cite every line.** A ticket key for tracker items, a repo path for repo items,
  "Slack #webapp, {date}" for a conversation — so any line here can be traced back to the
  two sources that were actually read against each other.
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
- The team already sounds like it's agreed to build something instructors said, in
  research, they wouldn't even use. In Slack on Aug 17, Wren said "I think we just
  build it," Tobias agreed to scope it this sprint, Marguerite said she'd tell
  instructors it's coming, and Wren said they'd open the ticket — no SCRUM ticket
  exists yet. This was cut for exactly that reason, cited in roadmap-and-bets.md. Hold
  to the roadmap call, or is this a real reversal that needs writing up?
  (team/roadmap-and-bets.md; Slack #webapp, Aug 17)

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

**That first line only exists by reading a Slack conversation against a roadmap file from
a different folder.** It's not in the tracker, which shows no ticket. It's not in the
decision log, which has nothing this week. That cross-read is the point — it's the check
nobody has time to run by hand.
