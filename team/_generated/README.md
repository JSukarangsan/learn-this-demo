# Generated context

**Nothing in this folder is hand-written, and nothing in it is canonical.**

Every file here is a summary of a document owned somewhere else — the H2 planning doc and
the ops cohort calendar. **`/refresh-index` writes them, a person runs it, and nothing
here happens on a schedule.**

There is a helper, and it is worth knowing what it is not.
**`.github/scripts/refresh-context.mjs` decides whether anything needs doing.** It reads
`../../context-manifest.yaml`, fetches each source that declares a `summarize_to`, hashes
the body, and compares that against the fingerprint in the generated file's banner, then
reports `UNCHANGED`, `CHANGED`, `MISSING`, `OVERDUE` or `FAILED`. It is arithmetic, not
judgment — **it calls no model and writes nothing at all.**

**`/refresh-index` does the rest.** When the checker says a source moved, the skill reads
it, works out whether anything the summary asserts is now wrong, writes the smallest change
that makes the file true again — often one line, not a regenerated file — and records the
run in `refresh-log.md`. One writer, one entry per run.

## Running it

```sh
node .github/scripts/refresh-context.mjs               # compare and report; writes nothing
node .github/scripts/refresh-context.mjs --fingerprint # print the banner line to paste
```

Or just run `/refresh-index`, which does the above and then acts on it.

**No credential, anywhere.** The checker doesn't call a model, and `/refresh-index` runs
inside a session that already is one. `ANTHROPIC_API_KEY` used to be required and is now
referenced nowhere.

**Never write a fingerprint by hand.** Use `--fingerprint`. `curl … | shasum -a 256`
computes a different digest — these exports carry a UTF-8 BOM that `fetch().text()` strips
— and a fingerprint that can't match makes the source look like it changes on every run.
That has happened once here; see the 2026-08-21 entry in `refresh-log.md`.

## There is no scheduled job, and that is the trade

There was one: a GitHub Action that fetched, summarized and opened a PR. It is gone, along
with its credential. What replaced it is a person running a skill.

The cost is real and worth saying rather than hiding: **this folder is only as current as
the last entry in `refresh-log.md`.** Nothing will notice drift while nobody is looking.
The bet is that a check somebody runs is a check somebody reads, and that a weekly PR
nobody reviews was never actually keeping anything current — it was just making the
staleness harder to see.

## Why summaries and not copies

Because the alternative is worse in both directions. Pasting the whole planning doc in here
puts 40,000 characters of someone else's prose in front of every agent session, most of it
irrelevant. Writing our own version by hand means maintaining a second copy of a document we
don't own, and losing that race the first time the VP edits it.

A summary regenerated from the source is disposable. If it's wrong, you don't fix it — you
fix the pointer, or the rules in
`.claude/skills/refresh-index/references/summary-format.md`, and run it again.

## The log

`refresh-log.md` is the exception to everything below: it is appended to, never overwritten,
and it is the only file here that survives a run producing nothing. `/refresh-index` writes
it, once per run.

It exists because this whole mechanism fails silently. The old scheduled version proved it
the hard way: it ran for months, every pointer resolved, every source was real, and a
missing credential meant the summarize step never once executed. Nothing surfaced that,
because a workflow that writes no files opens no PR. So every run writes itself down,
including — especially — the runs that find nothing.

That failure mode did not go away when the schedule did. It moved: the way this gets stale
now is that nobody runs it. Same answer, same file. **The date on the newest entry is the
honest measure of how current this folder is.**

## Rules

- **Don't edit these files.** The next run overwrites you. Edit the source, or edit the
  manifest entry that points at it.
- **If one of these disagrees with its source, the source wins.** The banner at the top of
  each file says so, for the benefit of an agent that reads only this folder.
- **Generated summaries live here and nowhere else.** A `summarize_to` aimed at `insights/`
  or `engineering/` is a manifest error and the checker fails it. Those folders hold what a
  named person knows and a refresh does not, and a guessed file there is worse than an empty
  one.
- **Nothing lands unreviewed.** The skill proposes the edit in a session a person is
  watching; a bad summary that lands silently becomes the team's context.
- **Not everything upstream belongs here.** `product_ui` is pulled live because visual state
  doesn't survive being described in prose. `vendor_video_sla` has no API, so a person
  exports it into `insights/` by hand and that export is authoritative — what the checker
  can say about that one is only whether the export is overdue. The manifest marks both.

## The honest limit

This fetches the Google sources over plain link-shared export URLs, with no credentials at
all. That works because these documents are fiction and deliberately public. **A real
planning doc would not be link-shared**, and inside most companies the Drive MCP and the
Workspace CLI aren't authorised for everyone anyway — so the fetch step is the part of this
that won't transfer as-is. Glean is the route that does. Each affected manifest entry carries
a `reachability_note` saying so.
