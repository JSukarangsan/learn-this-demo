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

## Keep it fast

This is team-wide by design — six sources, three services — and that's inherent, not the
part to cut. What makes a run slow is the detours in between. Don't take these:

- **Fetch the tracker in one query, not one ticket at a time.** A single JQL call across
  the whole project, with the fields named in step 3 (`status`, `summary`, `updated`,
  `issuelinks`), covers the whole board. Only pull a single issue's full
  `description`/`comment` for a ticket that's actually a candidate for **Moving**,
  **Blocked**, or **Needs a person** — not for every ticket the query returns.
- **Compute the window's timestamps once, then read the channel directly.**
  `slack_read_channel` with `oldest`/`latest` set to the window's bounds beats guessing
  keywords into `slack_search_*` — a keyword search misses anything that doesn't happen
  to contain the word, and a miss just sends you back to try another one.
- **Check a file's date before opening it.** `comms/` filenames are dated
  (`YYYY-MM-DD-*.md`) — filter by filename first, and open only the ones inside the
  window, plus the single most recent one per project for the previous-digest check in
  step 7. Opening every status file in every project "to be safe" is the biggest single
  source of wasted reads.
- **Take each source at its word for its own step.** Step 3 reads what the tracker says;
  step 4 reads what Slack says. Neither step is an invitation to go verify the other
  against something outside the read list — git history, a PR's actual merge status,
  whatever else it makes you curious about. *The join that matters here* below is a
  **specific** three-way check — Slack vs. tracker vs. decision log — not a general audit
  of whether everything anyone claimed is true.
- **Don't re-derive what a cited file already says.** If `roadmap-and-bets.md` already
  lists something under "what we said no to," that citation is the finding. Tracing how
  it got there is a different task nobody asked for.

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
   roadmap "no" is the sharpest kind of finding here, and this file is the only way to
   catch it.

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
call — you weren't in the room, and the tracker doesn't know it's being ignored. Picking
a side silently is the one mistake to avoid here.

**And report it as people, not systems.** "Jira and Slack disagree" is a sentence about
software. Wren said something, an instructor said something in an interview — that's the
actual finding, and where each of them said it is citation, not the subject. See
*Phrasing Needs a person* in `references/digest-format.md`.

**Before writing a new *Needs a person* row, check the Risk Log for one already open on
the same disagreement.** If it's still unresolved, that's not a new finding — it's the
same finding, still true. Update the existing row's date and say it's still open, rather
than adding a near-duplicate. A tracker with the same conflict logged four times reads as
four problems, not one that's been ignored for a month.

**Same check before writing a *Decided* row: check Key Decisions for one already citing
that same file in `product/decisions/`.** A decision is written once and the file doesn't
change, so if its path is already a row, it was reported in a prior run — skip it, don't
append it again. This can happen even inside a single correctly-scoped window if the run
gets invoked twice, so check regardless of whether the window logic looks right.

**On the window, if this run doesn't fall on the Monday `how-we-work.md` assumes:** say
what window you're using before you read anything, rather than silently guess which
Monday–Sunday span applies. "Running this for the week of {date}, covering {range}" as
the first line back is enough. A silently wrong window is the most common way a run looks
broken when it isn't — every mock content file in this kit is dated to a specific week on
purpose, and the run only finds it if the window actually covers those dates.

## Before you write anything

Show the draft — at minimum every **Needs a person** line — and get it confirmed before
touching any of the four destinations. This isn't optional when there's a disagreement to
report: the job is to surface it, not resolve it, and confirming with a person is how
that actually happens rather than just being a rule on a page. Ask which way to write the
disagreement up, and whether the rest of the draft is right to publish. Proceed to the
writes below only after that comes back.

When reporting results back, keep it to the findings — a status report, not a narration
of how you found them.

## Then write it

Format, section order, and voice are in **`references/digest-format.md`**. Read it before
writing a line.

**Write to four places, from the same run, in this order:**

1. `weeklydigest.md` at the repo root — the record of what this run produced. Overwrite
   it; git history is the archive of prior runs.
2. The Google Doc at `context-manifest.yaml` → `outputs.weekly_digest_doc`. **Replace the
   full content — this Doc is the current digest, not an accumulating log.** Google Docs
   keeps its own version history, so nothing is lost by replacing it; a Doc that grows a
   new dated section every week is unreadable by week six. **`gws docs +write` only
   appends plain text — it cannot do this.** The actual mechanism: `documents.get` to
   find the body's current end index, then `documents.batchUpdate` with a
   `deleteContentRange` covering the whole body followed by `insertText` (add
   `updateTextStyle` / `updateParagraphStyle` requests too if the run should keep the
   original's headers and bold, the way the first version of this doc was formatted).
   Same document ID every time — never create a new Doc, since the ID is already the one
   pointed to by the manifest and linked from every notification posted so far.
3. The tracker at `outputs.weekly_digest_tracker`. **Append, never overwrite.** This one
   *is* the accumulating log — that's the whole point of a tracker, and starting the
   write at row 1 destroys every prior week's rows. Use `gws sheets spreadsheets values
   append` (or the `+append` helper) with `range` set to `"Key Decisions!A1"` or
   `"Risk Log!A1"` so it finds the existing table and adds after the last row, one row per
   **Decided** line onto *Key Decisions*, one row per **Needs a person** and **Blocked**
   line onto *Risk Log*. Same wording as the digest — the tracker is not a second draft.
   `values.update` at a fixed range is how you silently wipe the history; don't use it
   here.
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
