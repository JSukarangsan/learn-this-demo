// Resolve every pointer in context-manifest.yaml, and tell you which cached copies have
// drifted from their sources.
//
// The whole point of the manifest is that this script knows nothing about Learn.this.
// It reads the manifest and does what the manifest says. Adding a source is a manifest
// edit, not a code change.
//
// THIS SCRIPT DOES NOT SUMMARIZE, AND DOES NOT WRITE SUMMARY FILES. It answers one
// question per cached source — did the source change since the copy was generated — and
// leaves the judgment about what to do with that to /refresh-index, which has a model and
// doesn't need a credential to reach one. That split is why there is no ANTHROPIC_API_KEY
// here: the only thing that ever needed it was the summarize call, and that call has moved
// to the skill.
//
// The change signal is a content hash, not a timestamp, and that is not a preference. The
// Google export endpoints these sources use return no Last-Modified, no ETag and no
// Content-Length, so there is nothing to compare a date against — which is why every run
// before this one reported UNKNOWN forever. The bodies are byte-stable, so a SHA-256 of
// the body answers definitively what a date cannot.
//
// Deliberately skipped:
//   - refresh: live        — pulled at query time, never cached
//   - reachable: false     — there is nothing to fetch, by design
//   - no summarize_to      — the source is read live or held by a person
//
// Every run appends an entry to team/_generated/refresh-log.md, including the runs that
// found nothing. That log is the only durable answer to "when did this last run", and a
// run that found nothing is exactly the run nobody would otherwise notice.
//
// Usage: node .github/scripts/refresh-context.mjs [--dry-run]

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { dirname } from 'node:path'

const LOG_PATH = 'team/_generated/refresh-log.md'

// `live` is the one `refresh:` value that means "there is no copy". Everything else is
// a cadence, and a cadence on a source with nowhere to write is a mistake worth catching.
const UNCACHED_REFRESH = 'live'

// The fingerprint the generated file carries in its banner, and the only state this whole
// mechanism keeps. It lives in the file it describes rather than a sidecar: nothing can
// desync from it, and deleting a generated file correctly forces a regenerate.
const FINGERPRINT = /Source fingerprint: sha256:([0-9a-f]{64}) \((\d+) bytes\)/

// ---------------------------------------------------------------------------
// A very small YAML reader. The manifest is a fixed, flat shape that we control,
// so this handles exactly that shape rather than pulling in a dependency.
// ---------------------------------------------------------------------------
export function parseSources(yaml) {
  const lines = yaml.split('\n')
  const start = lines.findIndex((l) => l.trimEnd() === 'sources:')
  if (start === -1) throw new Error('context-manifest.yaml has no `sources:` block')

  const sources = {}
  let name = null
  let key = null

  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i]
    if (/^\S/.test(line) && line.trim()) break // dedented out of `sources:`
    if (!line.trim() || line.trim().startsWith('#')) continue

    const source = line.match(/^ {2}([a-z0-9_]+):\s*$/)
    if (source) {
      name = source[1]
      sources[name] = {}
      key = null
      continue
    }
    if (!name) continue

    const field = line.match(/^ {4}([a-z0-9_]+):\s*(.*)$/)
    if (field) {
      key = field[1]
      let value = field[2].trim()
      if (value === '>' || value === '|') {
        sources[name][key] = '' // folded block; body collected below
        continue
      }
      value = value.replace(/\s+#.*$/, '').trim().replace(/^["']|["']$/g, '')
      sources[name][key] = value === 'true' ? true : value === 'false' ? false : value
      key = null
      continue
    }
    // continuation line of a folded block
    if (key && /^ {6}\S/.test(line)) {
      sources[name][key] = (sources[name][key] + ' ' + line.trim()).trim()
    }
  }
  return sources
}

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------
export async function fetchSource(name, src) {
  if (src.fetch) {
    const res = await fetch(src.fetch, { redirect: 'follow' })
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
    const body = await res.text()
    // A Google export URL returns an HTML sign-in page when the file isn't
    // link-shared. That looks like success to fetch() and like garbage to the
    // model, so catch it here where the error is still legible.
    if (/^\s*<!DOCTYPE html/i.test(body) && /accounts\.google\.com/.test(body)) {
      throw new Error('got a Google sign-in page — the file is not link-shared')
    }
    return body
  }
  throw new Error(`no way to fetch a ${src.type} — it declares no \`fetch:\` URL`)
}

// ---------------------------------------------------------------------------
// Fingerprint
// ---------------------------------------------------------------------------
// Hashed over the decoded body, not the bytes on the wire, because that is what every
// consumer actually sees. `fetch().text()` strips a UTF-8 BOM, and these Google exports
// ship one — so hashing the raw response would fingerprint three bytes nobody reads and
// disagree with this forever. The practical consequence: **a fingerprint must come from
// this function.** `shasum` over a curl'd body computes something different and the gate
// will report CHANGED on every run until someone works out why.
export const sha256 = (text) => createHash('sha256').update(text, 'utf8').digest('hex')

// Bytes, not `String.length`. They differ the moment the source contains an em-dash, and
// a size labelled "bytes" that is really a character count is a small lie that makes a
// diff impossible to reconcile against the file it describes.
export const byteLength = (text) => Buffer.byteLength(text, 'utf8')

// Reads the fingerprint back out of a generated file's banner. Returns null when the file
// doesn't exist (never generated) or carries no fingerprint (generated before this
// mechanism existed) — both mean "can't compare", and both are handled the same way:
// treat it as needing a look rather than guessing it's fine.
export function readFingerprint(path, io = { readFileSync, existsSync }) {
  if (!io.existsSync(path)) return null
  const match = io.readFileSync(path, 'utf8').match(FINGERPRINT)
  if (!match) return null
  return { sha: match[1], bytes: Number(match[2]) }
}

// ---------------------------------------------------------------------------
// The run log
//
// team/_generated/refresh-log.md holds two kinds of entry — a /refresh-index run, which
// a person drives, and a pipeline run, which this writes. Both answer the same question
// and splitting them across two files would split the answer, so they share a file and
// each entry says which one it was.
//
// Newest first, and old entries are never touched. A later run disagreeing with an
// earlier one is the useful part.
// ---------------------------------------------------------------------------
const LOG_HEADER = `# Refresh log

**Derived, not authored.** Newest first. Nothing here is canonical and deleting it costs
nothing except the answer to *when did anyone last check this*, which is the only question
it exists to answer.

Two kinds of entry, both marked in their heading. **pipeline** is
\`.github/workflows/refresh-context.yml\` writing down what it fetched. **/refresh-index**
is a person checking the pointers themselves. They answer the same question from opposite
ends — one proves the fetching still works, the other proves the addresses are still right
— and a run of either without the other leaves half the layer unchecked.

Entries are never edited after the fact. If a later run disagrees with an earlier one, that
disagreement is the useful part.

---
`

const short = (sha) => sha.slice(0, 8)

const delta = (was, now) => {
  const pct = was ? Math.round(((now - was) / was) * 1000) / 10 : 0
  return `${was} → ${now} bytes (${pct >= 0 ? '+' : ''}${pct}%)`
}

// One block per source that did something; everything quiet collapses to a single line.
// The log obeys the same rule as the summaries it tracks: don't write a paragraph to say
// nothing happened.
export function renderLogEntry({ today, unchanged, changed, missing, skipped, failed, runUrl, dryRun }) {
  const counts = [
    `${unchanged.length} unchanged`,
    `${changed.length} changed`,
    `${missing.length} missing`,
    `${skipped.length} skipped by design`,
    ...(failed.length ? [`${failed.length} failed`] : []),
  ].join(', ')

  const total = unchanged.length + changed.length + missing.length + skipped.length + failed.length

  const lines = [
    `## ${today} — pipeline${dryRun ? ' (dry run)' : ''}`,
    '',
    `\`refresh-context.yml\`. ${total} checked — ${counts}.${runUrl ? ` [Run log](${runUrl}).` : ''}`,
  ]

  for (const r of failed) {
    lines.push('', `**FAILED** — \`${r.name}\``, r.why)
  }

  for (const r of changed) {
    lines.push(
      '',
      `**CHANGED** — \`${r.name}\``,
      `${delta(r.wasBytes, r.nowBytes)}. sha256 ${short(r.wasSha)}… → ${short(r.nowSha)}….`,
      `\`${r.file}\` was generated from the older version — run \`/refresh-index\` to judge`,
      'whether anything the summary asserts is now wrong.',
    )
  }

  for (const r of missing) {
    lines.push(
      '',
      `**MISSING** — \`${r.name}\``,
      `\`${r.file}\` ${r.why}. Nothing to compare against, so this needs a first pass from`,
      `\`/refresh-index\`. Source is ${r.nowBytes} bytes, sha256 ${short(r.nowSha)}….`,
    )
  }

  if (unchanged.length) {
    lines.push('', `Unchanged: ${unchanged.map((r) => `\`${r.name}\``).join(', ')}.`)
  }
  if (skipped.length) {
    lines.push('', `Skipped by design: ${skipped.map((r) => `\`${r.name}\``).join(', ')}.`)
  }
  if (!changed.length && !missing.length && !failed.length) {
    lines.push('', 'Nothing moved. Every cached copy still matches its source.')
  }

  return lines.join('\n') + '\n'
}

// Insert below the header rule, so the newest entry is the first one you read.
export function insertLogEntry(existing, entry) {
  const lines = existing.split('\n')
  const rule = lines.findIndex((l, i) => i > 0 && l.trim() === '---')
  if (rule === -1) return existing.replace(/\s*$/, '\n') + '\n' + entry
  const head = lines.slice(0, rule + 1).join('\n')
  const tail = lines.slice(rule + 1).join('\n').replace(/^\n+/, '')
  return `${head}\n\n${entry}\n${tail}`
}

export function appendToLog(entry, { path = LOG_PATH, io = { readFileSync, writeFileSync, existsSync, mkdirSync } } = {}) {
  const existing = io.existsSync(path) ? io.readFileSync(path, 'utf8') : LOG_HEADER
  io.mkdirSync(dirname(path), { recursive: true })
  io.writeFileSync(path, insertLogEntry(existing, entry))
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------
export async function check({ dryRun = false, manifestPath = 'context-manifest.yaml', today, logPath = LOG_PATH } = {}) {
  const sources = parseSources(readFileSync(manifestPath, 'utf8'))
  const date = today || new Date().toISOString().slice(0, 10)
  const unchanged = []
  const changed = []
  const missing = []
  const skipped = []
  const failed = []

  // The manifest's one rule, made executable. An entry either names a file in this repo
  // or it doesn't, and a `refresh:` cadence only means something on the ones that do.
  // Catching this here rather than in review is the point: a cadence on a pointed-at
  // source is somebody assuming a copy exists, and the copy is what they'll go looking
  // for. `refresh: live` is the exception and not a mistake — it is the value that says
  // there is deliberately no copy, so requiring a path from it inverts what it means.
  for (const [name, src] of Object.entries(sources)) {
    const cached = src.summarize_to || src.copy_of_record
    if (src.refresh && src.refresh !== UNCACHED_REFRESH && !cached) {
      failed.push({
        name,
        why: `has \`refresh: ${src.refresh}\` but names no file in this repo. Either give it a path, or say \`refresh: live\`.`,
      })
    }
  }

  for (const [name, src] of Object.entries(sources)) {
    if (!src.summarize_to) {
      const why = src.copy_of_record
        ? `a person maintains ${src.copy_of_record}`
        : src.deliberate
          ? 'deliberately out of reach'
          : 'no copy in this repo, read the source'
      skipped.push({ name, why })
      continue
    }
    if (src.reachable === false) {
      skipped.push({ name, why: 'reachable: false, and that is deliberate' })
      continue
    }
    try {
      const raw = await fetchSource(name, src)
      const nowSha = sha256(raw)
      const nowBytes = byteLength(raw)
      const prior = readFingerprint(src.summarize_to)

      if (!prior) {
        missing.push({
          name,
          file: src.summarize_to,
          why: existsSync(src.summarize_to) ? 'carries no fingerprint' : 'does not exist',
          nowSha,
          nowBytes,
        })
      } else if (prior.sha === nowSha) {
        // The whole point. Byte-identical source means the copy is definitionally still
        // accurate, so nothing reads it, nothing summarizes it and nothing writes.
        unchanged.push({ name, file: src.summarize_to, sha: nowSha, bytes: nowBytes })
      } else {
        changed.push({
          name,
          file: src.summarize_to,
          wasSha: prior.sha,
          nowSha,
          wasBytes: prior.bytes,
          nowBytes,
        })
      }
    } catch (err) {
      failed.push({ name, why: err.message })
    }
  }

  const report = [
    changed.length
      ? `Changed:\n  ${changed.map((r) => `${r.name} — ${delta(r.wasBytes, r.nowBytes)} → ${r.file}`).join('\n  ')}`
      : '',
    missing.length
      ? `\nMissing:\n  ${missing.map((r) => `${r.name} — ${r.file} ${r.why}`).join('\n  ')}`
      : '',
    unchanged.length ? `\nUnchanged:\n  ${unchanged.map((r) => r.name).join('\n  ')}` : '',
    skipped.length ? `\nSkipped, by design:\n  ${skipped.map((r) => `${r.name} — ${r.why}`).join('\n  ')}` : '',
    failed.length ? `\nFailed:\n  ${failed.map((r) => `${r.name} — ${r.why}`).join('\n  ')}` : '',
  ].filter(Boolean).join('\n') || 'Nothing in the manifest declares a summarize_to.'

  // The run log is written even when the run failed outright, and especially then. A
  // pipeline that quietly does nothing for four months is the failure this repo exists
  // to make visible, so the record of the attempt has to survive the attempt.
  const runUrl = process.env.GITHUB_RUN_ID && process.env.GITHUB_REPOSITORY
    ? `${process.env.GITHUB_SERVER_URL || 'https://github.com'}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
    : null

  let logged = false
  if (!dryRun) {
    appendToLog(renderLogEntry({ today: date, unchanged, changed, missing, skipped, failed, runUrl, dryRun }), { path: logPath })
    logged = true
  }

  return { unchanged, changed, missing, skipped, failed, report, logged }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------
const invokedDirectly = process.argv[1] && process.argv[1].endsWith('refresh-context.mjs')

if (invokedDirectly) {
  // `--fingerprint` exists so nobody ever computes one by hand. The obvious move —
  // `curl … | shasum -a 256` — produces a different digest than this script does (BOM,
  // decoding), and a fingerprint written from it never matches, so the gate reports
  // CHANGED forever and regenerates every run. That is precisely the churn this whole
  // mechanism exists to prevent, so the only supported way to get one is to ask for it.
  if (process.argv.includes('--fingerprint')) {
    const sources = parseSources(readFileSync('context-manifest.yaml', 'utf8'))
    for (const [name, src] of Object.entries(sources)) {
      if (!src.summarize_to || src.reachable === false) continue
      try {
        const raw = await fetchSource(name, src)
        console.log(`${name}\n  Source fingerprint: sha256:${sha256(raw)} (${byteLength(raw)} bytes)\n  → ${src.summarize_to}`)
      } catch (err) {
        console.log(`${name}\n  FAILED — ${err.message}`)
      }
    }
    process.exit(0)
  }

  const dryRun = process.argv.includes('--dry-run')
  const { changed, missing, failed, report, logged } = await check({ dryRun })

  console.log(report)
  if (logged) console.log(`\nLogged to ${LOG_PATH}.`)

  if (process.env.GITHUB_OUTPUT && existsSync(process.env.GITHUB_OUTPUT)) {
    // Only propose a PR when something actually moved. This used to be hardcoded true —
    // every run opened a PR carrying nothing but its own log entry, which is the noise
    // this whole change exists to stop.
    const actionable = changed.length > 0 || missing.length > 0
    writeFileSync(process.env.GITHUB_OUTPUT, `changed=${actionable}\n`, { flag: 'a' })
  }
  // A source that should be reachable and isn't is the thing worth being told about.
  // The exit code fails the step; it must not decide whether the PR opens, because the
  // sources that did resolve are still worth proposing and the log entry is still worth
  // keeping. The workflow gates the PR on `changed`, not on this.
  if (failed.length) process.exit(1)
}
