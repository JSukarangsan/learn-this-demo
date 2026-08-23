// Resolve every pointer in context-manifest.yaml, and tell you which cached copies have
// drifted from their sources.
//
// The whole point of the manifest is that this script knows nothing about Learn.this.
// It reads the manifest and does what the manifest says. Adding a source is a manifest
// edit, not a code change.
//
// THIS SCRIPT WRITES NOTHING. It is the deterministic half of /refresh-index — the part
// that is arithmetic rather than judgment, and that shouldn't cost a model call to do.
// It fetches, hashes, compares, and prints. Deciding what a change means, rewriting a
// summary, and recording the run are the skill's job, and the skill is the only thing
// that writes into this repo. One writer, one log entry per run.
//
// There is no CI wrapper and no scheduled job. This is run by a person, or by the skill
// on a person's behalf. That is also why there is no credential anywhere in here: the
// only thing that ever needed one was summarizing, and summarizing belongs to whoever
// invoked the skill.
//
// The change signal is a content hash, not a timestamp, and that is not a preference. The
// Google export endpoints these sources use return no Last-Modified, no ETag and no
// Content-Length, so there is nothing to compare a date against — which is why every run
// before fingerprints existed reported UNKNOWN forever. The bodies are byte-stable, so a
// SHA-256 of the body answers definitively what a date cannot.
//
// Deliberately not fetched:
//   - refresh: live        — pulled at query time, never cached
//   - reachable: false     — there is nothing to fetch, by design
//   - no summarize_to      — the source is read live or held by a person
//
// Usage: node .github/scripts/check.mjs [--fingerprint]

import { readFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'

// `live` is the one `refresh:` value that means "there is no copy". Everything else is
// a cadence, and a cadence on a source with nowhere to write is a mistake worth catching.
const UNCACHED_REFRESH = 'live'

// Generated summaries live here and nowhere else. See GENERATED_ROOT's use below for why
// this is enforced rather than merely documented.
const GENERATED_ROOT = 'team/_generated/'

// The fingerprint the generated file carries in its banner, and the only state this whole
// mechanism keeps. It lives in the file it describes rather than a sidecar: nothing can
// desync from it, and deleting a generated file correctly forces a regenerate.
const FINGERPRINT = /Source fingerprint: sha256:([0-9a-f]{64}) \((\d+) bytes\)/

// How long a person-maintained copy may go unconfirmed before the export is overdue.
// `as-needed` has no schedule, so it can never be late.
const CADENCE_DAYS = { weekly: 7, monthly: 31, quarterly: 92, annual: 366 }

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
// Is a hand-maintained export overdue?
//
// The only thing that can be checked about a copy_of_record. There is no upstream to
// reach — that is why a person exports it — so the question is not whether the copy
// matches, it is whether the export that was promised actually happened. An export that
// was supposed to land quarterly and didn't is a real finding, and it is the entire
// reason to write the entry this way instead of giving up on the source.
// ---------------------------------------------------------------------------
export function overdueBy(refresh, lastConfirmed, today) {
  const window = CADENCE_DAYS[refresh]
  if (!window || !lastConfirmed) return null // no schedule, or nothing to measure from
  const days = Math.floor((Date.parse(today) - Date.parse(lastConfirmed)) / 86_400_000)
  if (Number.isNaN(days) || days <= window) return null
  return { days, window }
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------
export async function check({ manifestPath = 'context-manifest.yaml', today } = {}) {
  const sources = parseSources(readFileSync(manifestPath, 'utf8'))
  const date = today || new Date().toISOString().slice(0, 10)
  const unchanged = []
  const changed = []
  const missing = []
  const skipped = []
  const overdue = []
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
    // Generated summaries only ever land in team/_generated/. A summarize_to pointing at
    // a discipline folder would have /refresh-index rewriting insights/definitions.md or
    // engineering/constraints.md on every drift — files whose knowledge belongs to a
    // named person who is not in the room when the skill runs. Guessed content there is
    // worse than an empty file, because the lead who reads it later has to work out which
    // lines to trust before they can fix it.
    if (src.summarize_to && !src.summarize_to.startsWith(GENERATED_ROOT)) {
      failed.push({
        name,
        why: `writes to \`${src.summarize_to}\`, outside \`${GENERATED_ROOT}\`. Generated summaries only go there — a discipline folder is filled with its lead, never by a refresh.`,
      })
    }
  }

  for (const [name, src] of Object.entries(sources)) {
    if (!src.summarize_to) {
      if (src.copy_of_record) {
        const late = overdueBy(src.refresh, src.last_confirmed, date)
        if (late) {
          overdue.push({
            name,
            file: src.copy_of_record,
            refresh: src.refresh,
            lastConfirmed: src.last_confirmed,
            ...late,
            exists: existsSync(src.copy_of_record),
          })
          continue
        }
        skipped.push({ name, why: `a person maintains ${src.copy_of_record}` })
        continue
      }
      skipped.push({
        name,
        why: src.deliberate ? 'deliberately out of reach' : 'no copy in this repo, read the source',
      })
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

  const pct = (was, now) => (was ? Math.round(((now - was) / was) * 1000) / 10 : 0)
  const report = [
    changed.length
      ? `Changed:\n  ${changed.map((r) => `${r.name} — ${r.wasBytes} → ${r.nowBytes} bytes (${pct(r.wasBytes, r.nowBytes) >= 0 ? '+' : ''}${pct(r.wasBytes, r.nowBytes)}%), sha256 ${r.wasSha.slice(0, 8)}… → ${r.nowSha.slice(0, 8)}… → ${r.file}`).join('\n  ')}`
      : '',
    missing.length
      ? `\nMissing:\n  ${missing.map((r) => `${r.name} — ${r.file} ${r.why}. Source is ${r.nowBytes} bytes, sha256 ${r.nowSha.slice(0, 8)}…`).join('\n  ')}`
      : '',
    overdue.length
      ? `\nOverdue:\n  ${overdue.map((r) => `${r.name} — ${r.file} was due ${r.refresh}, last confirmed ${r.lastConfirmed} (${r.days} days ago)${r.exists ? '' : ', and the file is missing entirely'}`).join('\n  ')}`
      : '',
    unchanged.length ? `\nUnchanged:\n  ${unchanged.map((r) => r.name).join('\n  ')}` : '',
    skipped.length ? `\nSkipped, by design:\n  ${skipped.map((r) => `${r.name} — ${r.why}`).join('\n  ')}` : '',
    failed.length ? `\nFailed:\n  ${failed.map((r) => `${r.name} — ${r.why}`).join('\n  ')}` : '',
  ].filter(Boolean).join('\n') || 'Nothing in the manifest declares a summarize_to.'

  return { unchanged, changed, missing, skipped, overdue, failed, report }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------
const invokedDirectly = process.argv[1] && process.argv[1].endsWith('check.mjs')

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

  const { failed, report } = await check()
  console.log(report)
  // A source that should be reachable and isn't is the thing worth being told about.
  if (failed.length) process.exit(1)
}
