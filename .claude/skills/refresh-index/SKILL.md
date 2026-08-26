---
name: refresh-index
description: Walk context-manifest.yaml, check whether each pointer still resolves and whether the source has changed since the copy was generated, regenerate what has drifted, and write the run down. Use when someone asks to refresh the manifest or the index, check for stale context, regenerate generated context, or verify the sources of truth are still current.
---

# Refresh the manifest

Check the pointers, regenerate what drifted, log what you did.

`context-manifest.yaml` is the addressing layer — where the sources of truth live and
whether a tool can reach them. It is the part of the layer that **fails silently**: it can
be wrong for months and nothing surfaces the error, because nobody trips over a pointer the
way they trip over a stale status.

So it needs a deliberate check. That's this.

## First, sort each entry into one of two piles

**Does it name a file in this repo?** `summarize_to` or `copy_of_record` means yes.

That answer decides what you're checking. An entry with a copy can be out of date. An
entry without one cannot, because there is nothing here to be out of date. Asking a
pointed-at source whether it has drifted is asking a question it doesn't have.

## The four phases

Each one gates the next, and cost rises with each. **Most runs stop at phase 2** — that is
the design working, not the run being lazy.

### 1. Check every pointer

For **every** entry:

1. **Does `canonical` still resolve?** Follow it. A local path means checking the file
   exists; a Glean-backed entry means searching for it.
2. **Is `reachable` still true?** The field that goes stale quietly. Permissions change,
   files move, a connector gets turned off.
3. **Is the connection it needs still in `available_connections`?** An entry marked
   `reachable: true` whose connection isn't listed is a contradiction, and it's usually
   the manifest that's wrong rather than the connection.

### 2. Fingerprint the cached entries

```sh
node .claude/skills/refresh-index/check.mjs
```

**Yes, shell out — this one is arithmetic, not judgment.** The script fetches each
`summarize_to` source, hashes the body, and compares it against the fingerprint in the
generated file's banner. It reports `UNCHANGED`, `CHANGED`, `MISSING`, `OVERDUE` or
`FAILED` per source.

**It writes nothing.** No summaries, no log entry, no manifest edits — it prints and
exits. Everything written in a run of this skill is written by you, which is what keeps
one run to one log entry, recorded by the thing that actually did the judging.

It also reports two manifest errors worth knowing about: a `refresh:` cadence on a source
that names no file, and a `summarize_to` pointing outside `team/_generated/`.

**`UNCHANGED` means stop.** Don't fetch the source again, don't read it into context, don't
regenerate anything. A byte-identical source means the existing summary is definitionally
still accurate. Reporting that in one line is a complete and good result.

**`UNSTABLE` means the gate cannot work on that source.** Two fetches of the same unedited
document disagreed, so any fingerprint written for it would mismatch on the next run and
report `CHANGED` forever. Usually an export carrying a timestamp, or a search index
normalising differently between reads. Don't write one. Say which source, and that it needs
either a different address or a person on a cadence.

### Sources only a connector can reach

`check.mjs` is a plain Node script with no credentials and no MCP access. A source marked
`fetch_via:` — Glean, or any other connector — is reported as **needing you** rather than
skipped, along with the version the copy was built from, so you can compare.

For each one: **retrieve the document through that connector yourself.** Then record
**the modification time the connector reports**, not a hash of what it returned:

```
Source updated: 2023-10-24T01:04:20Z (via glean)
```

**Do not hash a connector's output, even though `--hash` exists.** Tested against Glean on
2026-08-25, and the payload is not the document — it is Tika-rendered HTML carrying parser
metadata (a LibreOffice build string among it), every comment on the document with its
timestamps, and a `percentRetrieved` that changes when you page. All three move without the
document moving, so a hash would report `CHANGED` for a new comment or a Glean infra
upgrade. The modification time is the source system's own and does not.

`--hash` is for content you fetched **directly** over HTTP, where there is no date to be
had. That is the only case it is right for.

### What a connector's date does and does not prove

A connector indexes other systems, so everything it tells you is second-hand. Be precise
about which part is trustworthy, because it is not all-or-nothing.

**The date is a real passthrough.** Observed on Glean, 2026-08-25: a document last edited
in 2023 still reports `2023-10-24`, and Glean has certainly re-crawled it many times since.
A crawl timestamp could not stay at 2023. So `updateTime` is the source system's own
modification time, not the index's.

**But two gaps sit between that date and the copy you write**, and only the first is
usually mentioned:

1. **Crawl lag.** The document is edited; the index catches up later. Until it does, the
   date you read is the *previously indexed* modification time.
2. **Metadata and content may not sync together.** The date and the body are two fields of
   the connector's record. If metadata refreshes ahead of content, a source can report a
   fresh edit while still serving the previous crawl's text — a `CHANGED` signal pointing
   at stale content to summarize.

**Neither gap is visible from a single read, and neither has a published number.** Do not
quote one, do not estimate one, and do not let a run imply the lag is small. It varies by
source, by connector load, and by document type. The honest statement is that a connector's
answer is behind the document by an unknown amount.

So: **`fetch_via` is a weaker class of check, not an equivalent one.** It fails in the
dangerous direction — saying a copy is current when it may not be. Three consequences:

- **Never report a `fetch_via` source as confirmed-current.** "Unchanged as far as the
  index knows, source last modified {date}" is the honest phrasing, and the difference
  matters.
- **Anything a team ships against — a compliance rule, a legal constraint, a hard number —
  gets checked against the real document by a person.** Where no connector reaches the
  source directly, which at NYT is every Google document, **that person is the only ground
  truth that exists.** Say so plainly rather than implying the check covered it.
- **If the date moved, re-read before summarizing, and say if the body looks inconsistent
  with it.** A fresh date over apparently unchanged text is gap 2 showing itself, and it is
  worth writing down rather than shrugging at.

### 3. Judge what moved, then write the minimum

Only for what phase 2 flagged `CHANGED` or `MISSING`. Read the current source and the
existing summary, and decide what actually moved. **Format, section order, the banner and
the rewrite rules are in `references/summary-format.md`. Read it before writing a line.**

**You write into `team/_generated/` and nowhere else.** Not `product/`, not
`engineering/`, not `design/`, not `insights/`. Those folders hold what one named person
knows and you do not — what a metric actually means, which constraint bites in practice,
what the design system will not do — and that person is not in the room when this runs. A
generated file there looks finished and is a guess, which is worse than an empty one:
the lead who reads it later has to work out which lines to trust before they can fix
anything, and most will start over. The script fails a manifest entry that tries, and if
one ever gets past it, **stop and say so rather than writing the file.**

`OVERDUE` is not yours to fix either. A `copy_of_record` is hand-exported *because* there
is nothing to fetch, so there is no version of this skill that can rebuild one. Report it,
name the owner from the manifest, and leave it.

The short version, because it is the point of the whole design: **the size of the edit
matches the size of what moved upstream.** A changed target number is a one-line edit, not
a regenerated file. A full regenerate is for a source that was reorganized.

`MISSING` is the exception — nothing to compare against, so it gets a full first pass.

### 4. Write the run down

**Append to `team/_generated/refresh-log.md`, newest entry first.** Same standing as
anything else in that folder: derived, not authored, and safe to delete.

It exists for one reason. The manifest's failure mode is that nobody notices, and *"when did
anyone last check this"* is unanswerable if the check only ever printed to somebody's
terminal. The log turns that into a date you can read.

Head the entry `## {date} — /refresh-index`. **One run, one entry** — you are the only
thing that writes here. Entries dated before 2026-08-23 carry a `— pipeline` label from
when a scheduled workflow also wrote to this file; that workflow is gone and the label is
history, not a pattern to copy.

**Never edit an old entry.** If a later run disagrees with an earlier one, that
disagreement is the useful part — including when the earlier run was wrong. There is a
false positive in here from a mis-computed fingerprint, left deliberately, because the
next person to see a source that "changes" every run needs to find it.

## What to report

Open with a one-line count so the result is scannable before anyone reads a word of
detail: `{n} sources checked — {c} confirmed, {u} unchanged, {r} regenerated, {x} unreachable`.

Then one block per entry that did something, in manifest order. Don't hand-align columns —
it looks tidy for one run and turns into whitespace archaeology on the next edit, and it
buys nothing a bold label doesn't already give you:

```
**CONFIRMED** — `{key}`
Resolves, reachable{, no copy to check}.

**UNCHANGED** — `{key}`
Fingerprint matches. Nothing fetched twice, nothing rewritten.

**REGENERATED** — `{key}`
{what moved upstream, named specifically}. {which lines changed, or "full rewrite"}.

**UNREACHABLE** — `{key}`
`reachable: true` claimed, but isn't. {what happened}.

**OVERDUE** — `{key}`
Hand-maintained copy, {n} days past its {cadence} cadence. {owner} rebuilds it; nothing
here can.
```

**Collapse the quiet ones.** Entries that confirmed clean with nothing to say are a single
line listing them, not a block each. The report obeys the same rule as the summaries: don't
write a paragraph to say nothing happened.

Then propose the edit — updated `last_confirmed` on confirmed entries, a corrected
`reachable`, and a flag on drifted ones. **Propose it. Don't apply it.** A human confirms
what's canonical.

## The entries that are supposed to say no

`reachable: false` with `deliberate: true` means counsel-only material, or anything where
the honest answer is that it stays where it is. **Those are not failures and must not be
reported as drift.** An entry that says *canonical, unreachable, and that's correct* is a
finished artifact. Confirm it's still correct and move on.

`reachable: false` *without* `deliberate: true` is a different case. There's a `workaround`,
and what's worth checking is whether the workaround actually happened — an export that was
supposed to land quarterly and didn't is a real finding.

## Leave `local:` alone

Those aren't pointers. They're files this repo owns, so there's no upstream for them to
drift from.

## Stop and ask a human when

- **The same entry comes back `UNREACHABLE` twice running.** One bad run is a blip; two is
  a pointer aimed at something that no longer exists, and a third check won't resolve it.
  Name the owner from the manifest entry and stop.
- **A source's fingerprint changes on every run.** That means the body isn't byte-stable —
  a timestamp in the export, a session token, a reordering server — and the gate cannot work
  on it. Regenerating it every run is worse than not checking it at all. Say so rather than
  letting it churn.
- **A regenerate would drop something the summary asserts and the source no longer
  mentions.** Content vanishing upstream is usually a move, not a deletion, and quietly
  dropping it from the copy is how a team loses a decision nobody meant to reverse.
- **The manifest and the source disagree about ownership.** `owner:` is how anyone knows
  who to ask, and correcting it is a person's call, not a refresh's.

## What this is not

This is a check you run. It is not the auto-refreshing manifest — that watches sources and
flags drift without being asked, and **it does not exist yet.** The comment at the top of
`context-manifest.yaml` says so, and it stays true until it isn't. Don't describe this as
though it does.

`.claude/skills/refresh-index/check.mjs` is not that either, and the difference is the
division of labour rather than a wall. It answers *did the bytes change* —
deterministically, without a model, without a credential — and it can say a pointer failed
to resolve or an export is late. It cannot tell you whether a change matters, cannot decide
between editing a line and rewriting a file, and writes nothing at all. Phase 3 is the part
only a person or an agent can do, and it is why this skill sits on top of the script rather
than beside it.

**And there is no scheduled job.** There was one — a GitHub Action that fetched, summarized
and opened a PR — and it is gone. Nothing about this refreshes on a timer, nothing runs
while nobody is looking, and the honest consequence is that **the layer is only as current
as the last time somebody ran this.** That is the trade: a check a person runs is a check a
person reads, and a PR nobody reviews is worse than a calendar reminder. Don't describe this
as automated.
