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

// The beat-6 merge: the conflict resolved, so a decision, a constraint and the brief
// all move together. This is the message the demo is building toward.
const PR = {
  number: 44,
  title: 'Lapsed-learner state: decision + brief update',
  url: 'https://github.com/learn-this/webapp-context/pull/44',
  author: 'marguerite-pm',
  branch: 'main',
}

const FILES = [
  'product/decisions/2026-08-06-lapsed-recording-access.md',
  'engineering/constraints.md',
  'deliverables/enrollment-userflow/brief.md',
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
