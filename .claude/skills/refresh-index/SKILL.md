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

Hashing is the mechanism because **dating is impossible here** — these sources expose no
`Last-Modified`, no `ETag` and no `Content-Length`. That's why every run before this one
reported `UNKNOWN` forever, and why a confident `CONFIRMED` on a source you can't date was
never available in the first place.

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
