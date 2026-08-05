/**
 * Posts one realistic merge summary to a real Slack channel, without needing a PR.
 *
 * Run this the night before the session. It proves the webhook URL is live and shows
 * you exactly what the room will see:
 *
 *   SLACK_WEBHOOK_URL='https://hooks.slack.com/services/...' node .github/scripts/smoke.mjs
 *
 * Add --dry to render it to the terminal instead of posting.
 */

import { summarizeMerge } from './summarize-merge.mjs'
import { postToSlack } from './notify.mjs'

// The closing merge: the conflict settled, so a decision, a constraint and the brief
// all move together. This is the message the demo is building toward.
const PR = {
  number: 3,
  title: 'Schedule editing after start: decision + brief update',
  url: 'https://github.com/JSukarangsan/learn-this-demo/pull/3',
  author: 'wren-kelleher',
  branch: 'main',
}

// Patches shaped like the real thing — the summary is read out of these, so a
// rehearsal without them would exercise a different code path than the Action does.
const added = (lines) => lines.map((l) => '+' + l).join('\n')

const FILES = [
  {
    filename: 'product/decisions/2026-08-05-no-schedule-edit-after-start.md',
    status: 'added',
    patch: added([
      "# 2026-08-05 — A schedule can't be edited after a cohort starts",
      '',
      'status: decided',
      '',
      'Learners hold a calendar invite generated at enrollment that we cannot revoke,',
      'so moving a session means re-issuing every one of them.',
    ]),
  },
  {
    filename: 'engineering/constraints.md',
    status: 'modified',
    patch: added([
      '- **No session time or timezone change inside a cohort that has already started**,',
      '  same path as an enrollment change, same reason.',
    ]),
  },
  {
    filename: 'deliverables/cohort-scheduling/brief.md',
    status: 'modified',
    patch: [
      '+- Editing a schedule after the cohort has started — settled, see the decision log',
      '-- Editing a schedule after the cohort has started — that needs the confirmation path',
    ].join('\n'),
  },
]

const summary = summarizeMerge(PR, FILES)
const dry = process.argv.includes('--dry')
const url = process.env.SLACK_WEBHOOK_URL

console.log(`\n${summary.payload.blocks[0].text.text}`)
console.log(summary.payload.blocks[1].text.text)
console.log(`${summary.payload.blocks[2].elements[0].text}\n`)

if (dry || !url) {
  console.log(dry ? 'Dry run — not posted.' : 'No SLACK_WEBHOOK_URL set — not posted.')
  process.exit(0)
}

await postToSlack(url, summary.payload)
console.log('Posted to Slack.')
