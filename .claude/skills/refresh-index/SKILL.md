---
name: refresh-index
description: Walk index.md, check whether each pointer still resolves and whether the source has changed since it was last confirmed, and report what has drifted. Use when someone asks to refresh the index, check for stale context, or verify the sources of truth are still current.
---

# Refresh the index

`index.md` is the addressing layer — where the sources of truth live and whether a tool can
reach them. It is the part of the layer that **fails silently**: it can be wrong for months
and nothing surfaces the error, because nobody trips over a pointer the way they trip over
a stale status.

So it needs a deliberate check. That's this.

## What to do

For every row in `index.md`:

1. **Does the pointer still resolve?** Follow it. A Drive or Glean row means searching for
   it; a local path means checking the file exists.
2. **Has the thing changed since `Last confirmed`?** If the source exposes a modified date,
   compare. If it doesn't, say so rather than guessing.
3. **Is the "reachable today" column still true?** This is the one that goes stale quietly —
   permissions change, files move, a connector gets turned off.

## What to report

```
CONFIRMED    {row} — unchanged since {date}
DRIFTED      {row} — source modified {date}, last confirmed {date}
UNREACHABLE  {row} — was reachable, now isn't. {what happened}
UNKNOWN      {row} — can't determine. {why}
```

Then propose the edit to `index.md` — updated dates for confirmed rows, and a flag on
drifted ones. **Propose it. Don't apply it.** A human confirms what's canonical.

## The rows that are supposed to say no

Some rows are deliberately unreachable — counsel-only material, anything where the honest
answer is that it stays where it is. **Those are not failures and must not be reported as
drift.** A row that says *canonical, unreachable, and that's correct* is a finished artifact.
Confirm it's still correct and move on.

## What this is not

This is a check you run. It is not the auto-refreshing manifest — that watches sources and
flags drift without being asked, and it does not exist yet. Don't describe this as though
it does.
