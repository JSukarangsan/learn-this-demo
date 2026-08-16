---
name: refresh-index
description: Walk context-manifest.yaml, check whether each pointer still resolves and whether the source has changed since it was last confirmed, and report what has drifted. Use when someone asks to refresh the manifest or the index, check for stale context, or verify the sources of truth are still current.
---

# Refresh the manifest

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

## What to do

For **every** entry:

1. **Does `canonical` still resolve?** Follow it. A local path means checking the file
   exists; a Glean-backed entry means searching for it.
2. **Is `reachable` still true?** The field that goes stale quietly. Permissions change,
   files move, a connector gets turned off.
3. **Is the connection it needs still in `available_connections`?** An entry marked
   `reachable: true` whose connection isn't listed is a contradiction, and it's usually
   the manifest that's wrong rather than the connection.

For **cached entries only**, one more:

4. **Does the copy still match the source?** If the source exposes a modified date,
   compare it to `last_confirmed`. **If it doesn't, say so rather than guessing** — several
   connectors return content without a timestamp, and a confident `CONFIRMED` on a source
   you can't date is worse than an honest `UNKNOWN`.

**Never ask question 4 of a pointed-at source.** The backlog changed since `last_confirmed`.
So did the design file. That's what they're for, it is not drift, and reporting it as drift
trains people to ignore the report.

## What to report

```
CONFIRMED    {key} — resolves, reachable{, and the copy still matches}
DRIFTED      {key} — cached. source modified {date}, last confirmed {last_confirmed}
UNREACHABLE  {key} — reachable: true, but isn't. {what happened}
UNKNOWN      {key} — cached, and can't be dated. {which connector, and what it withholds}
```

Say which pile each entry was in when it isn't obvious. "Resolves, reachable, no copy to
check" is a complete and good result for a pointed-at source, and it should read like one
rather than like something was skipped.

Then propose the edit — updated `last_confirmed` on confirmed entries, a corrected
`reachable`, and a flag on drifted ones. **Propose it. Don't apply it.** A human confirms
what's canonical.

## Then write the run down

**Append the report to `team/_generated/refresh-log.md`, newest entry first.** Same standing
as anything else in that folder: derived, not authored, and safe to delete.

It exists for one reason. The manifest's failure mode is that nobody notices, and *"when did
anyone last check this"* is unanswerable if the check only ever printed to somebody's
terminal. The log turns that into a date you can read.

Each entry is the date, one line per source, and the proposed edits as a diff. Keep it terse;
this is a record that the check ran and what it saw, not a document anyone reads for pleasure.

**Never edit an old entry.** If a later run disagrees with an earlier one, that disagreement
is the useful part.

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

## What this is not

This is a check you run. It is not the auto-refreshing manifest — that watches sources and
flags drift without being asked, and **it does not exist yet.** The comment at the top of
`context-manifest.yaml` says so, and it stays true until it isn't. Don't describe this as
though it does.
