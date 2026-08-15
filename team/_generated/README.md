# Generated context

**Nothing in this folder is hand-written, and nothing in it is canonical.**

Every file here is a summary of a document owned somewhere else — the H2 planning doc, the
ops cohort calendar, the instructor NPS page. `.github/workflows/refresh-context.yml` reads
`../../context-manifest.yaml`, fetches each source that declares a `summarize_to`, summarizes
it, and writes the result here. Then it opens a PR.

## Why summaries and not copies

Because the alternative is worse in both directions. Pasting the whole planning doc in here
puts 40,000 characters of someone else's prose in front of every agent session, most of it
irrelevant. Writing our own version by hand means maintaining a second copy of a document we
don't own, and losing that race the first time the VP edits it.

A summary regenerated from the source is disposable. If it's wrong, you don't fix it — you
fix the prompt or the pointer and run it again.

## Rules

- **Don't edit these files.** The next run overwrites you. Edit the source, or edit the
  manifest entry that points at it.
- **If one of these disagrees with its source, the source wins.** The banner at the top of
  each file says so, for the benefit of an agent that reads only this folder.
- **A PR, not a commit.** The pipeline proposes and a person confirms. Same rule
  `/refresh-index` follows. A bad summary that lands silently becomes the team's context.
- **Not everything upstream belongs here.** `product_ui` is pulled live because visual state
  doesn't survive being described in prose. `contract_terms` is deliberately unreachable.
  `vendor_video_sla` has no API, so a person exports it into `insights/` by hand and that
  export is authoritative. The manifest marks all three, and the pipeline skips them.

## The honest limit

This fetches the Google sources over plain link-shared export URLs, with no credentials at
all. That works because these documents are fiction and deliberately public. **A real
planning doc would not be link-shared**, and inside most companies the Drive MCP and the
Workspace CLI aren't authorised for everyone anyway — so the fetch step is the part of this
that won't transfer as-is. Glean is the route that does. Each affected manifest entry carries
a `reachability_note` saying so.
