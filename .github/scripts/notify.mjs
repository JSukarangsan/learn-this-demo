/**
 * Entry point for the merge notification. Runs inside GitHub Actions.
 *
 * Reads the merged-PR event, asks the API which files it touched, builds the
 * summary, and posts it to Slack — but only when the merge touched something the
 * team needs to hear about. Routine merges are logged and dropped, which is the
 * whole reason anyone leaves the notification switched on.
 *
 * Env:
 *   SLACK_WEBHOOK_URL   required to post. Absent = dry run, payload printed.
 *   NOTIFY_ALWAYS       "true" posts routine merges too. Off by default.
 *   NOTIFY_FILES        comma-separated paths. Skips the API call — for rehearsing offline.
 *   GITHUB_EVENT_PATH   set by Actions.
 *   GITHUB_TOKEN        set by Actions. Used to list the PR's files.
 */

import { readFile } from 'node:fs/promises'
import { summarizeMerge } from './summarize-merge.mjs'

export async function listPullRequestFiles(repo, number, token, fetchImpl = fetch) {
  const files = []
  for (let page = 1; page <= 10; page++) {
    const res = await fetchImpl(
      `https://api.github.com/repos/${repo}/pulls/${number}/files?per_page=100&page=${page}`,
      {
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'X-GitHub-Api-Version': '2022-11-28',
        },
      },
    )
    if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`)
    const batch = await res.json()
    files.push(...batch.map((f) => f.filename))
    if (batch.length < 100) break
  }
  return files
}

export async function postToSlack(webhookUrl, payload, fetchImpl = fetch) {
  const res = await fetchImpl(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const body = await res.text()
  // Incoming webhooks answer with a plain "ok" body, not JSON, and a 200 with a
  // non-ok body still means the message did not land.
  if (!res.ok || body.trim() !== 'ok') {
    throw new Error(`Slack rejected the payload (${res.status}): ${body}`)
  }
  return body
}

export async function run(env = process.env, deps = {}) {
  const { fetchImpl = fetch, log = console.log } = deps

  const event = JSON.parse(await readFile(env.GITHUB_EVENT_PATH, 'utf8'))
  const pull = event.pull_request

  if (!pull?.merged) {
    log('Not a merge. Nothing to say.')
    return { posted: false, reason: 'not-merged' }
  }

  const repo = event.repository.full_name
  const override = env.NOTIFY_FILES?.split(',').map((f) => f.trim()).filter(Boolean)
  const files =
    deps.files ??
    override ??
    (await listPullRequestFiles(repo, pull.number, env.GITHUB_TOKEN, fetchImpl))

  const summary = summarizeMerge(
    {
      number: pull.number,
      title: pull.title,
      url: pull.html_url,
      author: pull.user?.login,
      branch: pull.base?.ref ?? 'main',
      repo,
    },
    files,
  )

  log(`Areas touched: ${summary.areas.join(', ') || 'none'}`)
  log(`Significant: ${summary.significant}`)

  if (!summary.significant && env.NOTIFY_ALWAYS !== 'true') {
    log('Routine merge — not posting. Set NOTIFY_ALWAYS=true to override.')
    return { posted: false, reason: 'routine', summary }
  }

  if (!env.SLACK_WEBHOOK_URL) {
    log('No SLACK_WEBHOOK_URL — dry run. Payload:')
    log(JSON.stringify(summary.payload, null, 2))
    return { posted: false, reason: 'dry-run', summary }
  }

  await postToSlack(env.SLACK_WEBHOOK_URL, summary.payload, fetchImpl)
  log(`Posted: ${summary.headline}`)
  return { posted: true, summary }
}

// Only run when invoked directly, so the tests can import the functions above.
if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  run().catch((err) => {
    console.error(err.message)
    process.exit(1)
  })
}
