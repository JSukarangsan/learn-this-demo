# Generated context

**Nothing in this folder is hand-written, and nothing in it is canonical.**

Every file here is a summary of a document owned somewhere else — the H2 planning doc and
the ops cohort calendar. Two halves produce them, and the split is worth understanding
before you run either.

**`.github/scripts/refresh-context.mjs` decides whether anything needs doing.** It reads
`../../context-manifest.yaml`, fetches each source that declares a `summarize_to`, hashes
the body, and compares that against the fingerprint in the generated file's banner. It
reports `UNCHANGED`, `CHANGED`, `MISSING` or `FAILED`, writes its own log entry, and opens
a PR when something actually moved. **It cannot summarize and never writes a file here.**

**`/refresh-index` does the part that needs judgment.** When the script says a source
moved, the skill reads it, works out whether anything the summary asserts is now wrong,
and writes the smallest change that makes the file true again — often one line, not a
regenerated file.

## Running it

```sh
node .github/scripts/refresh-context.mjs --dry-run     # compare, report, write nothing
node .github/scripts/refresh-context.mjs               # compare and append the log entry
node .github/scripts/refresh-context.mjs --fingerprint # print the banner line to paste
```

**No credential, for either half.** The script doesn't call a model, and `/refresh-index`
runs inside a session that already is one. `ANTHROPIC_API_KEY` used to be required and is
now referenced nowhere.

**Never write a fingerprint by hand.** Use `--fingerprint`. `curl … | shasum -a 256`
computes a different digest — these exports carry a UTF-8 BOM that `fetch().text()` strips
— and a fingerprint that can't match makes the source look like it changes on every run.
That has happened once here; see the 2026-08-21 entry in `refresh-log.md`.

The Monday cron in `.github/workflows/refresh-context.yml` is still commented out, but the
reason it was disabled is gone: it was off because a key couldn't be stored in a public
repo, and there is no longer a key. What's left is a question about noise — a weekly run
that finds nothing still opens a PR carrying its log entry. Decide that before uncommenting.

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
and it is the only file here that survives a run producing nothing. Both halves of the
addressing layer write to it — the pipeline every time it runs, `/refresh-index` every time
a person checks the pointers — and each entry says which.

It is there because the pipeline's failure mode is silence. It was scheduled for Mondays and
produced nothing for months; every pointer resolved, every source was real, and the missing
`ANTHROPIC_API_KEY` meant the summarize step never executed. Nothing surfaced that, because
a workflow that writes no files opens no PR. So every run writes itself down, including the
runs that find nothing.

**A PR now opens only when something actually moved** — `changed` used to be hardcoded true,
which meant every run proposed a PR carrying nothing but its own log entry. That is the
noise the fingerprint exists to stop, and it is the open question hanging over re-enabling
the cron: a quiet scheduled run still writes a log entry that nothing then commits.

## Rules

- **Don't edit these files.** The next run overwrites you. Edit the source, or edit the
  manifest entry that points at it.
- **If one of these disagrees with its source, the source wins.** The banner at the top of
  each file says so, for the benefit of an agent that reads only this folder.
- **A PR, not a commit.** The pipeline proposes and a person confirms. Same rule
  `/refresh-index` follows. A bad summary that lands silently becomes the team's context.
- **Not everything upstream belongs here.** `product_ui` is pulled live because visual state
  doesn't survive being described in prose. `vendor_video_sla` has no API, so a person
  exports it into `insights/` by hand and that export is authoritative. The manifest marks
  both, and the pipeline skips them.

## The honest limit

This fetches the Google sources over plain link-shared export URLs, with no credentials at
all. That works because these documents are fiction and deliberately public. **A real
planning doc would not be link-shared**, and inside most companies the Drive MCP and the
Workspace CLI aren't authorised for everyone anyway — so the fetch step is the part of this
that won't transfer as-is. Glean is the route that does. Each affected manifest entry carries
a `reachability_note` saying so.
