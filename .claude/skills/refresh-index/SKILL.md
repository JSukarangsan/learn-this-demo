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

## What to do

For every entry under `sources:`:

1. **Does `canonical` still resolve?** Follow it. A `drive://` or Glean-backed entry means
   searching for it; a local path means checking the file exists.
2. **Has the source changed since `last_confirmed`?** If it exposes a modified date,
   compare. If it doesn't, say so rather than guessing.
3. **Is `reachable` still true?** This is the field that goes stale quietly — permissions
   change, files move, a connector gets turned off.
4. **Is the connection it needs still in `available_connections`?** An entry marked
   `reachable: true` whose connection isn't listed is a contradiction, and it's usually the
   manifest that's wrong rather than the connection.

## What to report

```
CONFIRMED    {key} — unchanged since {last_confirmed}
DRIFTED      {key} — source modified {date}, last confirmed {last_confirmed}
UNREACHABLE  {key} — reachable: true, but isn't. {what happened}
UNKNOWN      {key} — can't determine. {why}
```

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

## What this is not

This is a check you run. It is not the auto-refreshing manifest — that watches sources and
flags drift without being asked, and **it does not exist yet.** The comment at the top of
`context-manifest.yaml` says so, and it stays true until it isn't. Don't describe this as
though it does.
