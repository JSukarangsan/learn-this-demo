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
| `scripts/notify.test.mjs` | 32 tests, no dependencies |

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

## It's written for people who never open the repo

That's the whole audience. So the message carries no filenames, no folder names, and
none of the kit's own vocabulary — no *manifest*, no *brief*, no *merged*. It says what
the team now knows that it didn't yesterday:

> • A new rule about what we must never do: *No session time or timezone change inside a
> cohort that has already started*
>   _Learners hold a calendar invite we generated at enrollment and cannot revoke._

Each bullet also carries the reasoning underneath, pulled from the change itself. **No
model runs** — it's read straight out of the diff, so it can't invent anything and can't
be slow. That only works because these files have a predictable shape, which is somewhere
between a happy accident and the entire argument for the shape.

Override with `NOTIFY_ALWAYS=true` if you want a routine merge to post during a rehearsal.

## Setup — about five minutes, and it needs a browser

This posts through **Learn.this Bot**, the team's Slack app. Merge summaries are the only
thing it does today; `slack-app-manifest.yml` explains what it's scoped for next.

1. **Create the app.** [api.slack.com/apps](https://api.slack.com/apps) → *Create New App*
   → *From an app manifest* → pick the workspace → paste `slack-app-manifest.yml`.
2. **Invite it to the channel.** In Slack: `/invite @Learn.this Bot`. Private channels
   don't appear in the webhook picker until the app is already in them.
3. **Turn on Incoming Webhooks.** *Features → Incoming Webhooks* → toggle *Activate* →
   *Add New Webhook to Workspace* → choose the channel. Copy the URL.
4. **Wire it up and test in one step:**
   ```
   ./.github/setup-slack.sh 'https://hooks.slack.com/services/...'
   ```
   That sets the repo secret and posts one realistic merge summary, so you see it land
   before you trust it. `node .github/scripts/smoke.mjs --dry` renders it locally instead.

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
