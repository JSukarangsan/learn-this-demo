---
name: weekly-digest-expanded
description: Assemble the team-wide weekly digest from the tracker, the decision log, meeting notes, and #webapp — including the disagreements between what got said and what got decided — then write it to the shared Doc and the Key Decisions / Risk Log tracker. Use when someone asks for the weekly digest, "what happened this week", or a version of the update that includes what Slack has been saying.
---

# Weekly digest — expanded

Assemble the update. Write it three places: `weeklydigest.md` in this repo, the shared
Google Doc, and the Key Decisions / Risk Log tracker. All three come from the same run —
never hand-edit one after the fact without regenerating the other two.

This is not `/build-update`. That skill is scoped to one project, in build, read against
the tracker and the design file. This one is team-wide, and it adds the one source that
never makes it into a ticket: what the team actually said to each other. A ticket records
that something is Backlog. It does not record that four people in Slack already agreed to
build it.

If a run of this skill returns a clean digest with nothing under *Needs a person*, that's
a fine week — say so and stop. Padding that section to look thorough is worse than an
honest four lines.

## Read, in this order

1. **`team/how-we-work.md`** — the reporting window. Monday to Sunday, not the sprint.
   Everything below is filtered to it. Get this wrong and every date downstream is wrong.

2. **`product/decisions/`** — entries dated inside the window.
   **Only `status: decided`.** A `proposed` entry has not happened, and putting one under
   what was decided is how an agent tells the company something is settled that isn't.

3. **The tracker** — `context-manifest.yaml` → `sources.product_backlog`. Read live over
   the Jira MCP. Fields that matter: `key`, `summary`, `status`, `updated`, and issue
   links — specifically what a ticket is *blocked by*. Blocked comes from the link, never
   from your reading of the summary. If `updated` stamps most of the board at once,
   that's a reorganization, not a week of progress — fall back to `status`.

4. **`#webapp`** — `context-manifest.yaml` → `sources.team_chat`. Read the channel over
   the Slack MCP, filtered to the window. **A message here is evidence of what was said,
   never of what was decided.** Its only job is the opposite of the tracker's: catching a
   moment where the room agreed on something and nobody wrote it anywhere that counts.
   If nothing in the window contradicts or gets ahead of a tracked or decided item, this
   source contributes nothing, and that's fine — most weeks it should.

5. **Meeting notes** — `comms/` files without a `-status` suffix, dated inside the
   window. Same rule as Slack: raw, not canonical, good for one thing — a follow-up that
   was named out loud and never became a decision entry.

6. **`team/goals-and-okrs.md`** and **`team/roadmap-and-bets.md`** — what the team is
   trying to move, and what it already said no to and why. A Slack thread that reopens a
   roadmap "no" is the sharpest thing this skill can find, and it only knows to look
   because this file exists.

7. **The previous digest** — `weeklydigest.md`'s prior version, or the last dated status
   in a project's `comms/`, for one purpose only: what you said was moving that hasn't
   moved since. Never lift lines from it; regenerate, don't patch.

## The join that matters here

**A conversation that treats something as settled when the tracker and the decision log
don't agree it is.** Three sources have to disagree for this to fire: Slack (or a
transcript) shows people acting like it's decided; the tracker has no ticket, or an
untouched one; and `product/decisions/` and `roadmap-and-bets.md` have nothing, or say
no. All three, or it doesn't go under *Needs a person* — two sources agreeing and one
being silent is just an update, not a conflict.

**Report the disagreement. Do not resolve it.** Naming which side is right is a person's
call — you weren't in the room, the tracker doesn't know it's being ignored, and picking
a side is the one mistake this skill exists to avoid making silently.

**And report it as people, not systems.** "Jira and Slack disagree" is a sentence about
software. Wren said something, an instructor said something in an interview — that's the
actual finding, and where each of them said it is citation, not the subject. See
*Phrasing Needs a person* in `references/digest-format.md`.

## Then write it

Format, section order, and voice are in **`references/digest-format.md`**. Read it before
writing a line.

**Write to four places, from the same run, in this order:**

1. `weeklydigest.md` at the repo root — the record of what this run produced.
2. The Google Doc at `context-manifest.yaml` → `outputs.weekly_digest_doc`, as the
   formatted version people actually read. Full content, not a summary of the file.
3. The tracker at `outputs.weekly_digest_tracker` — one row per **Decided** line onto the
   *Key Decisions* tab, one row per **Needs a person** and **Blocked** line onto the
   *Risk Log* tab. Same source, same wording as the digest — the tracker is not a second
   draft.
4. **`#webapp`** — a notification that the tracker changed this week, once step 3 has
   actually succeeded, never before. One line per new row in each tab, Slack-formatted
   (bold, bullets, emoji used to mean something, not to decorate), in plain language —
   no filenames, no skill vocabulary, same audience rule as the merge-notify bot in
   `.github/merge-notify.md`. **Link to the Google Doc, not the Sheet.** The Doc is what
   people are meant to read; the Sheet is the tracker behind it, and linking straight to
   a spreadsheet is how you get someone editing a cell instead of reading the update.
   Format is in `references/digest-format.md`.

Update `outputs.*.last_written` in the manifest after writing. If any of the four writes
fails, say so in the chat response — a digest that silently only wrote some of the four
places is worse than one that admits it's partial. In particular: **never send the Slack
notification if the tracker write failed.** A notification announcing an update that
didn't happen is worse than no notification.

## Stop and ask a human when

- Slack, a transcript, the tracker, and the decision log don't all point the same
  direction on something — see *the join that matters here*. Report what each source
  says and ask which way to write it. Do not guess.
- Slack or a transcript reopens something `roadmap-and-bets.md` lists as a settled no.
  Say what the original no was based on, not just that one exists.
- The window contains a reversal of a previous digest. Those need a person to frame them.
