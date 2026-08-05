# The merge notification

Slide 19, beat 4: *"Merging fires a summary into the channel — and `/weekly-digest` writes itself."*

When a PR merges into `main`, a GitHub Action reads which files it touched, writes a
plain-language summary, and posts it to `#learnthis-webapp-team`. People who never open
the repo still hear what landed.

| | |
|---|---|
| `workflows/merge-notify.yml` | the trigger — merged PRs into `main` only |
| `scripts/summarize-merge.mjs` | the routing table and the message. **This is the file worth reading.** |
| `scripts/notify.mjs` | fetches the PR's file list, decides whether to post, posts |
| `scripts/notify.test.mjs` | 24 tests, no dependencies |

## It stays quiet on purpose

A notification that fires on every merge gets muted inside a week, so the folder a change
landed in decides whether anyone hears about it.

**Posts** · a decision entry · `engineering/constraints.md` · a metric definition ·
the glossary · anything in `team/` · a project `brief.md` · `context-manifest.yaml` · `design/` ·
the root `CLAUDE.md`

**Stays quiet** · raw notes in `comms/notes/` · archived reports in `comms/status/`, which
the team already read in this channel · notes inside a project folder · skill edits ·
procedures

That split is the same one the kit's `CLAUDE.md` files already describe — which is the
point to make out loud when this fires. The channel is readable because the folder
structure carries meaning.

Override with `NOTIFY_ALWAYS=true` if you want a routine merge to post during a rehearsal.

## Setup — about five minutes, and it needs a browser

1. **Create the Slack app.** [api.slack.com/apps](https://api.slack.com/apps) → *Create New
   App* → *From scratch*. Name it `Learn.this Repo`, pick the demo workspace.
2. **Turn on Incoming Webhooks.** *Features → Incoming Webhooks* → toggle *Activate* →
   *Add New Webhook to Workspace* → choose `#learnthis-webapp-team`. Copy the URL.
3. **Add it to the repo.** `gh secret set SLACK_WEBHOOK_URL --repo <owner>/<repo>`, paste
   the URL. (Or *Settings → Secrets and variables → Actions*.)
4. **Fire a test message** before you trust it:
   ```
   SLACK_WEBHOOK_URL='https://hooks.slack.com/services/...' \
     node .github/scripts/smoke.mjs
   ```
   That posts one realistic merge summary to the channel without needing a PR.

## Running the tests

```
node --test .github/scripts/notify.test.mjs
```

No `npm install`. Node 22+, standard library only — the integration test stands up a real
HTTP server and posts to it, so the network path is exercised rather than mocked.

## Dry run against a real event

```
GITHUB_EVENT_PATH=.github/scripts/fixtures/pr-merged-designer.json \
NOTIFY_FILES='product/decisions/2026-08-06-x.md,deliverables/enrollment-userflow/brief.md' \
  node .github/scripts/notify.mjs
```

With no `SLACK_WEBHOOK_URL` set it prints the payload instead of posting. `NOTIFY_FILES`
supplies the file list so it runs offline — drop it inside Actions, where the API answers.
