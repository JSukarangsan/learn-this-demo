/**
 * Run: node --test .github/scripts/*.test.mjs
 *
 * This pipeline's failure mode is silence. It ran on a schedule for months, produced
 * nothing, and nobody noticed — so these tests are aimed at the two ways that happens:
 * the manifest rule that fails a source it shouldn't, and a run that leaves no trace.
 *
 * The fetch path is exercised against a real local HTTP server rather than mocked, so
 * a change to the fetch step is caught here instead of on a Monday morning.
 */

import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { parseSources, refresh, renderLogEntry, insertLogEntry } from './refresh-context.mjs'

// A manifest shaped like the real one — one cached source, one live pointer, one
// deliberately unreachable, one with a hand-maintained copy. Every skip rule, once.
const manifest = (fetchUrl) => `
team: webapp

sources:
  h2_planning:
    canonical: "https://docs.example/doc"
    type: google_doc
    owner: "VP Product — not this team"
    reachable: true
    fetch: "${fetchUrl}"
    refresh: quarterly
    summarize_to: team/_generated/h2-planning.md
    last_confirmed: 2026-08-05
    notes: >
      Authored a level up. Regenerate rather than editing in place —
      maintaining a second copy of somebody else's document is a race you lose.

  cohort_scheduling_flow:
    canonical: "https://figma.example/file"
    type: figma
    owner: "Ines Okafor (Design)"
    reachable: true # via Figma MCP
    refresh: live
    last_confirmed: 2026-08-05

  product_backlog:
    canonical: "https://jira.example/board"
    type: jira_project
    reachable: true
    last_confirmed: 2026-08-16

  vendor_video_sla:
    canonical: "vendor portal, SSO only — no API"
    type: vendor_portal
    reachable: false
    copy_of_record: insights/vendor-video-sla-2026-q3.md
    refresh: quarterly

  contract_terms:
    canonical: "Legal, counsel only"
    type: restricted
    reachable: false
    deliberate: true

local:
  - product/decisions/
`

describe('parseSources — the manifest reader', () => {
  const sources = parseSources(manifest('https://example.test/doc'))

  test('reads every source and stops at the next top-level key', () => {
    assert.deepEqual(Object.keys(sources), [
      'h2_planning',
      'cohort_scheduling_flow',
      'product_backlog',
      'vendor_video_sla',
      'contract_terms',
    ])
  })

  test('an inline comment is not part of the value', () => {
    // `reachable: true # via Figma MCP` has to come back as the boolean true, not the
    // string "true # via Figma MCP", which is truthy and would silently pass every check.
    assert.equal(sources.cohort_scheduling_flow.reachable, true)
    assert.equal(sources.contract_terms.reachable, false)
    assert.equal(sources.contract_terms.deliberate, true)
  })

  test('a folded block comes back as one line', () => {
    assert.match(sources.h2_planning.notes, /^Authored a level up\..*race you lose\.$/)
  })
})

describe('the cached-or-pointed-at rule', () => {
  let dir

  before(() => {
    dir = mkdtempSync(join(tmpdir(), 'refresh-'))
    process.chdir(dir)
  })

  const setup = (yaml) => {
    writeFileSync(join(dir, 'context-manifest.yaml'), yaml)
    mkdirSync(join(dir, 'team/_generated'), { recursive: true })
  }

  test('`refresh: live` on a pointed-at source is correct, not a failure', async () => {
    // This is the bug that kept the pipeline from ever opening a PR. `live` is the one
    // refresh value that means "there is deliberately no copy" — demanding a path from
    // it inverts what it says, and the exit code it produced killed the PR step.
    setup(manifest('https://127.0.0.1:1/unused'))
    const { failed } = await refresh({ dryRun: true, today: '2026-08-19' })
    assert.equal(
      failed.some((f) => f.name === 'cohort_scheduling_flow'),
      false,
      'a live pointer must not be reported as a manifest error',
    )
  })

  test('a real cadence with nowhere to write still fails', async () => {
    setup(manifest('https://127.0.0.1:1/unused').replace('refresh: live', 'refresh: weekly'))
    const { failed } = await refresh({ dryRun: true, today: '2026-08-19' })
    const f = failed.find((x) => x.name === 'cohort_scheduling_flow')
    assert.ok(f, 'a cadence on a source with no path is somebody assuming a copy exists')
    assert.match(f.why, /names no file in this repo/)
  })

  test('each kind of skip says which kind it is', async () => {
    setup(manifest('https://127.0.0.1:1/unused'))
    const { skipped } = await refresh({ dryRun: true, today: '2026-08-19' })
    const why = Object.fromEntries(skipped.map((s) => [s.name, s.why]))
    assert.match(why.product_backlog, /read the source/)
    assert.match(why.vendor_video_sla, /a person maintains/)
    assert.match(why.contract_terms, /deliberately out of reach/)
    assert.equal(why.cohort_scheduling_flow, 'no copy in this repo, read the source')
  })
})

describe('the run log', () => {
  test('the newest entry goes above the older ones, under the header', () => {
    const existing = ['# Refresh log', '', 'Newest first.', '', '---', '', '## 2026-08-16', '', 'older'].join('\n')
    const out = insertLogEntry(existing, '## 2026-08-19\n\nnewer\n')
    assert.ok(out.indexOf('## 2026-08-19') < out.indexOf('## 2026-08-16'), 'newest first')
    assert.ok(out.indexOf('# Refresh log') < out.indexOf('## 2026-08-19'), 'below the header')
    assert.match(out, /older/, 'and it never edits what was already there')
  })

  test('an entry names the run, the counts and every source', () => {
    const entry = renderLogEntry({
      today: '2026-08-19',
      done: [{ name: 'h2_planning', file: 'team/_generated/h2-planning.md', in: 4324, out: 1866 }],
      failed: [{ name: 'instructor_nps', why: 'NOTION_TOKEN is not set' }],
      skipped: [{ name: 'contract_terms', why: 'deliberately out of reach' }],
      runUrl: 'https://github.com/o/r/actions/runs/1',
    })
    assert.match(entry, /^## 2026-08-19 — pipeline$/m)
    assert.match(entry, /1 refreshed, 1 failed, 1 skipped by design/)
    assert.match(entry, /REFRESHED\s+h2_planning\s+→ team\/_generated\/h2-planning\.md \(4324 chars in, 1866 out\)/)
    assert.match(entry, /FAILED\s+instructor_nps\s+NOTION_TOKEN is not set/)
    assert.match(entry, /actions\/runs\/1/)
  })

  test('a dry run leaves no entry — it did not refresh anything', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'refresh-'))
    process.chdir(dir)
    writeFileSync(join(dir, 'context-manifest.yaml'), manifest('https://127.0.0.1:1/unused'))
    mkdirSync(join(dir, 'team/_generated'), { recursive: true })
    const { logged } = await refresh({ dryRun: true, today: '2026-08-19' })
    assert.equal(logged, false)
    assert.equal(existsSync(join(dir, 'team/_generated/refresh-log.md')), false)
  })
})

describe('a real run, against a real server', () => {
  let server
  let url
  let dir

  before(async () => {
    server = createServer((req, res) => {
      if (req.url === '/doc') {
        res.writeHead(200, { 'content-type': 'text/plain' })
        res.end('H2 2026 planning. Target: 40% of cohorts full at start. Owner: VP Product.')
        return
      }
      if (req.url === '/signin') {
        res.writeHead(200, { 'content-type': 'text/html' })
        res.end('<!DOCTYPE html><html><body><a href="https://accounts.google.com/">Sign in</a></body></html>')
        return
      }
      res.writeHead(404)
      res.end('nope')
    })
    await new Promise((r) => server.listen(0, '127.0.0.1', r))
    url = `http://127.0.0.1:${server.address().port}`
  })

  after(() => server.close())

  const setup = () => {
    dir = mkdtempSync(join(tmpdir(), 'refresh-'))
    process.chdir(dir)
    mkdirSync(join(dir, 'team/_generated'), { recursive: true })
  }

  test('fetches, writes the summary with its banner, and logs the run', async () => {
    setup()
    writeFileSync(join(dir, 'context-manifest.yaml'), manifest(`${url}/doc`))
    process.env.ANTHROPIC_API_KEY = 'test-key'
    process.env.ANTHROPIC_BASE_URL = url // the summarize call 404s; see the next assert

    const { failed, logged } = await refresh({ today: '2026-08-19' })

    // The fetch half worked and the summarize half is what failed — which is exactly
    // what a missing or wrong API key looks like, and it has to land in the log.
    assert.equal(logged, true, 'a failed run is still a run, and still gets written down')
    assert.ok(failed.find((f) => f.name === 'h2_planning'))

    const log = readFileSync(join(dir, 'team/_generated/refresh-log.md'), 'utf8')
    assert.match(log, /## 2026-08-19 — pipeline/)
    assert.match(log, /FAILED\s+h2_planning/)
    delete process.env.ANTHROPIC_BASE_URL
    delete process.env.ANTHROPIC_API_KEY
  })

  test('a Google sign-in page is caught as a failure, not written as content', async () => {
    // fetch() sees 200 OK. The model would see an HTML login page and summarize it.
    setup()
    writeFileSync(join(dir, 'context-manifest.yaml'), manifest(`${url}/signin`))
    const { failed } = await refresh({ dryRun: true, today: '2026-08-19' })
    const f = failed.find((x) => x.name === 'h2_planning')
    assert.ok(f)
    assert.match(f.why, /not link-shared/)
  })

  test('a missing API key is reported once, not once per source', async () => {
    setup()
    writeFileSync(join(dir, 'context-manifest.yaml'), manifest(`${url}/doc`))
    delete process.env.ANTHROPIC_API_KEY
    const { failed, logged } = await refresh({ today: '2026-08-19' })
    assert.equal(failed.filter((f) => /ANTHROPIC_API_KEY/.test(f.name)).length, 1)
    assert.equal(logged, true)
    assert.equal(
      existsSync(join(dir, 'team/_generated/h2-planning.md')),
      false,
      'and nothing gets written from a run that could not summarize',
    )
  })
})
