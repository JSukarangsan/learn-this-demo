# Generated context

**Nothing in this folder is hand-written, and nothing in it is canonical.**

Every file here is a summary of a document owned somewhere else — the H2 planning doc and
the ops cohort calendar. `.github/workflows/refresh-context.yml` reads
`../../context-manifest.yaml`, fetches each source that declares a `summarize_to`, summarizes
it, and writes the result here. Then it opens a PR.

## Running it

**The refresh runs locally, not on a schedule.** This repository is public, and a GitHub
Actions secret is readable by anyone who can push a workflow to it — so `ANTHROPIC_API_KEY`
is deliberately not stored here and the Monday cron in
`.github/workflows/refresh-context.yml` is commented out. The key lives in the operator's
own environment instead:

```sh
export ANTHROPIC_API_KEY=...          # your shell only — never committed, never a repo secret
node .github/scripts/refresh-context.mjs --dry-run   # fetch and report, write nothing
node .github/scripts/refresh-context.mjs             # write the summaries and the log entry
```

The dry run is worth doing first: it resolves every pointer and fetches every source
without spending a token, so a broken pointer surfaces before any summarizing happens. The
real run rewrites the files in this folder and appends to `refresh-log.md`; commit the
result as a PR the same way the workflow would have.

The workflow itself still exists and can be triggered by hand
(`gh workflow run refresh-context.yml`), but with no key in the repo it will report
`0 refreshed, 1 failed` and open a PR carrying only the log entry — which is the honest
outcome, not a bug. Re-enabling the cron means first putting a credential here that is safe
to store in a public repo: a scoped key with its own spend limit, or OIDC federation with
no stored secret at all.

## Why summaries and not copies

Because the alternative is worse in both directions. Pasting the whole planning doc in here
puts 40,000 characters of someone else's prose in front of every agent session, most of it
irrelevant. Writing our own version by hand means maintaining a second copy of a document we
don't own, and losing that race the first time the VP edits it.

A summary regenerated from the source is disposable. If it's wrong, you don't fix it — you
fix the prompt or the pointer and run it again.

## The log

`refresh-log.md` is the exception to everything below: it is appended to, never overwritten,
and it is the only file here that survives a run producing nothing. Both halves of the
addressing layer write to it — the pipeline every time it runs, `/refresh-index` every time
a person checks the pointers — and each entry says which.

It is there because the pipeline's failure mode is silence. It was scheduled for Mondays and
produced nothing for months; every pointer resolved, every source was real, and the missing
`ANTHROPIC_API_KEY` meant the summarize step never executed. Nothing surfaced that, because
a workflow that writes no files opens no PR. So the run now writes itself down first and the
PR carries the entry whether or not a summary moved.

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
