/**
 * Run: node --test .github/scripts/
 *
 * Covers the two things that can embarrass you live: the message saying the wrong
 * thing, and the POST silently failing. The last test stands up a real HTTP server
 * and posts to it, so the network path is exercised rather than mocked.
 */

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

import { classify, summarizeMerge } from './summarize-merge.mjs'
import { run, postToSlack, listPullRequestFiles } from './notify.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const fixture = (name) => join(HERE, 'fixtures', name)

const PR = {
  number: 42,
  title: 'Enrollment userflow — states matrix',
  url: 'https://github.com/learn-this/webapp-context/pull/42',
  author: 'wren-design',
  branch: 'main',
  repo: 'learn-this/webapp-context',
}

const quiet = () => {}

describe('classify — the routing table', () => {
  test('a decision entry is significant', () => {
    const r = classify('product/decisions/2026-08-06-assigned-learner-pricing.md')
    assert.equal(r.area, 'decision')
    assert.equal(r.significant, true)
  })

  test('the constraints file is significant, other engineering files are not', () => {
    assert.equal(classify('engineering/constraints.md').significant, true)
    assert.equal(classify('engineering/architecture.md').significant, false)
  })

  test('both comms subfolders are routine, and are told apart', () => {
    assert.equal(classify('comms/notes/2026-08-06-review.md').area, 'notes')
    assert.equal(classify('comms/status/2026-08-03-status-webapp.md').area, 'status')
    assert.equal(classify('comms/loose-file.md').area, 'comms')
    for (const p of ['comms/notes/a.md', 'comms/status/b.md', 'comms/loose-file.md']) {
      assert.equal(classify(p).significant, false, `${p} should be routine`)
    }
  })

  test('a project brief is significant but other project files are not', () => {
    assert.equal(classify('deliverables/enrollment-userflow/brief.md').area, 'brief')
    assert.equal(classify('deliverables/enrollment-userflow/notes/raw.md').area, 'project')
    assert.equal(classify('deliverables/enrollment-userflow/notes/raw.md').significant, false)
  })

  test('design context counts wherever it is filed', () => {
    for (const p of [
      'design/tokens.json',
      'deliverables/cohort-scheduling/design/session-list-states.md',
    ]) {
      assert.equal(classify(p).area, 'design', p)
      assert.equal(classify(p).significant, true, p)
    }
  })

  test('team/, index.md, glossary and root CLAUDE.md are all significant', () => {
    for (const p of ['team/charter.md', 'index.md', 'product/glossary.md', 'CLAUDE.md']) {
      assert.equal(classify(p).significant, true, `${p} should be significant`)
    }
  })

  test('an unknown path falls back rather than throwing', () => {
    const r = classify('README.md')
    assert.equal(r.area, 'other')
    assert.equal(r.significant, false)
  })
})

describe('summarizeMerge — the message', () => {
  test("the designer's PR reads as design plus a project, and is significant", () => {
    const s = summarizeMerge(PR, [
      'design/enrollment-states.md',
      'deliverables/enrollment-userflow/brief.md',
      'deliverables/enrollment-userflow/notes/2026-08-06-review.md',
    ])

    assert.equal(s.significant, true)
    assert.match(s.headline, /^Enrollment userflow — 3 files merged$/)
    assert.deepEqual(s.areas, ['brief', 'design', 'project'])
    assert.ok(
      s.lines.some((l) => l.includes('Design context changed')),
      `expected a design line, got ${JSON.stringify(s.lines)}`,
    )
  })

  test('lines come out most-important-first, not in the order git listed them', () => {
    const s = summarizeMerge(PR, [
      'comms/notes/2026-08-06-review.md',
      'engineering/constraints.md',
      'product/decisions/2026-08-06-x.md',
    ])
    assert.deepEqual(s.areas, ['decision', 'constraint', 'notes'])
  })

  test('a comms-only merge is routine', () => {
    const s = summarizeMerge(PR, ['comms/notes/2026-08-06-enrollment-review.md'])
    assert.equal(s.significant, false)
    assert.equal(s.lines[0], '1 raw note filed in `comms/notes/` — not canonical')
  })

  test('singular and plural both read correctly', () => {
    const one = summarizeMerge(PR, ['product/decisions/a.md'])
    const two = summarizeMerge(PR, ['product/decisions/a.md', 'product/decisions/b.md'])
    assert.equal(one.lines[0], 'A decision landed in `product/decisions/`')
    assert.equal(two.lines[0], '2 decisions landed in `product/decisions/`')
    assert.match(one.headline, /1 file merged/)
  })

  test('the headline only names a project when exactly one is touched', () => {
    const two = summarizeMerge(PR, [
      'deliverables/enrollment-userflow/brief.md',
      'deliverables/search-relevance/brief.md',
    ])
    assert.equal(two.headline, '2 files merged')
  })

  test('duplicate paths are counted once', () => {
    const s = summarizeMerge(PR, ['team/charter.md', 'team/charter.md'])
    assert.match(s.headline, /1 file merged/)
  })

  test('the payload is valid Block Kit with a text fallback and a working link', () => {
    const { payload } = summarizeMerge(PR, ['product/decisions/2026-08-06-x.md'])

    assert.equal(typeof payload.text, 'string')
    assert.ok(payload.text.length > 0, 'text fallback drives the notification and must be set')
    assert.deepEqual(
      payload.blocks.map((b) => b.type),
      ['header', 'section', 'context'],
    )
    // Slack truncates plain_text headers at 150 chars and rejects longer ones.
    assert.ok(payload.blocks[0].text.text.length <= 150)
    assert.match(payload.blocks[2].elements[0].text, /<https:\/\/github\.com\/.+\|#42 .+>/)
    assert.match(payload.blocks[2].elements[0].text, /wren-design/)
    assert.ok(JSON.stringify(payload).length < 3000, 'well under the 40kb webhook limit')
  })
})

describe('run — the decision to post', () => {
  test('an unmerged close posts nothing', async () => {
    const res = await run(
      { GITHUB_EVENT_PATH: fixture('pr-closed-unmerged.json') },
      { log: quiet, files: ['team/charter.md'] },
    )
    assert.deepEqual(res, { posted: false, reason: 'not-merged' })
  })

  test('a routine merge posts nothing even with a webhook configured', async () => {
    const res = await run(
      {
        GITHUB_EVENT_PATH: fixture('pr-merged-notes.json'),
        SLACK_WEBHOOK_URL: 'https://hooks.slack.test/should-not-be-called',
      },
      {
        log: quiet,
        files: ['comms/notes/2026-08-06-enrollment-review.md'],
        fetchImpl: () => assert.fail('should not have posted a routine merge'),
      },
    )
    assert.equal(res.posted, false)
    assert.equal(res.reason, 'routine')
  })

  test('NOTIFY_ALWAYS overrides the routine filter', async () => {
    let called = false
    await run(
      {
        GITHUB_EVENT_PATH: fixture('pr-merged-notes.json'),
        SLACK_WEBHOOK_URL: 'https://hooks.slack.test/x',
        NOTIFY_ALWAYS: 'true',
      },
      {
        log: quiet,
        files: ['comms/notes/2026-08-06-enrollment-review.md'],
        fetchImpl: async () => {
          called = true
          return { ok: true, status: 200, text: async () => 'ok' }
        },
      },
    )
    assert.equal(called, true)
  })

  test('NOTIFY_FILES lets a dry run work with no network', async () => {
    const res = await run(
      {
        GITHUB_EVENT_PATH: fixture('pr-merged-designer.json'),
        NOTIFY_FILES: 'team/charter.md, deliverables/enrollment-userflow/brief.md',
      },
      { log: quiet, fetchImpl: () => assert.fail('should not have called the API') },
    )
    assert.equal(res.reason, 'dry-run')
    assert.deepEqual(res.summary.areas, ['team', 'brief'])
  })

  test('no webhook configured is a dry run, not a crash', async () => {
    const res = await run(
      { GITHUB_EVENT_PATH: fixture('pr-merged-designer.json') },
      { log: quiet, files: ['product/decisions/2026-08-06-x.md'] },
    )
    assert.equal(res.reason, 'dry-run')
    assert.ok(res.summary.payload.blocks.length === 3)
  })

  test('a Slack error fails the job loudly instead of passing silently', async () => {
    await assert.rejects(
      () =>
        run(
          {
            GITHUB_EVENT_PATH: fixture('pr-merged-designer.json'),
            SLACK_WEBHOOK_URL: 'https://hooks.slack.test/dead',
          },
          {
            log: quiet,
            files: ['team/charter.md'],
            fetchImpl: async () => ({
              ok: false,
              status: 404,
              text: async () => 'no_service',
            }),
          },
        ),
      /Slack rejected the payload \(404\): no_service/,
    )
  })

  test('a 200 with a non-ok body still counts as a failure', async () => {
    await assert.rejects(
      () =>
        postToSlack(
          'https://hooks.slack.test/x',
          { text: 'hi' },
          async () => ({ ok: true, status: 200, text: async () => 'invalid_payload' }),
        ),
      /invalid_payload/,
    )
  })
})

describe('listPullRequestFiles', () => {
  test('follows pagination until a short page comes back', async () => {
    const pages = [
      Array.from({ length: 100 }, (_, i) => ({ filename: `a/${i}.md` })),
      [{ filename: 'team/charter.md' }],
    ]
    let call = 0
    const files = await listPullRequestFiles('o/r', 1, 'tok', async () => ({
      ok: true,
      status: 200,
      json: async () => pages[call++],
      text: async () => '',
    }))
    assert.equal(files.length, 101)
    assert.equal(call, 2)
  })

  test('an API error surfaces rather than yielding an empty file list', async () => {
    await assert.rejects(
      () =>
        listPullRequestFiles('o/r', 1, 'tok', async () => ({
          ok: false,
          status: 403,
          text: async () => 'rate limited',
        })),
      /GitHub API 403/,
    )
  })
})

describe('integration — a real POST over the wire', () => {
  test('the payload Slack would receive is the payload we built', async () => {
    let received
    const server = createServer((req, res) => {
      let body = ''
      req.on('data', (c) => (body += c))
      req.on('end', () => {
        received = { headers: req.headers, method: req.method, body: JSON.parse(body) }
        res.writeHead(200, { 'Content-Type': 'text/plain' })
        res.end('ok')
      })
    })

    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
    const url = `http://127.0.0.1:${server.address().port}/services/TEST`

    try {
      const res = await run(
        { GITHUB_EVENT_PATH: fixture('pr-merged-designer.json'), SLACK_WEBHOOK_URL: url },
        {
          log: quiet,
          files: [
            'deliverables/enrollment-userflow/brief.md',
            'design/enrollment-states.md',
            'engineering/constraints.md',
          ],
        },
      )
      assert.equal(res.posted, true)
    } finally {
      server.close()
    }

    assert.equal(received.method, 'POST')
    assert.equal(received.headers['content-type'], 'application/json')
    assert.equal(received.body.blocks[0].text.text, 'Enrollment userflow — 3 files merged')
    assert.match(received.body.blocks[1].text.text, /The engineering constraints changed/)
    assert.match(received.body.blocks[1].text.text, /A brief changed/)
  })
})
