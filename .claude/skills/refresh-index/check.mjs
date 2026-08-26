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
// THE CHANGE SIGNAL DEPENDS ON WHAT THE SOURCE CAN TELL YOU, and there are two answers.
//
//   Fetched directly (`fetch:`)  -> a content hash. The Google export endpoints return no
//   Last-Modified, no ETag and no Content-Length, so there is no date to compare against —
//   which is why every run before fingerprints existed reported UNKNOWN forever. Their
//   bodies are byte-stable, so a SHA-256 answers definitively what a date cannot.
//
//   Reached through a connector (`fetch_via:`) -> the modification time it reports.
//   Verified against Glean on 2026-08-25. Hashing a connector's output would be wrong:
//   Glean returns Tika-rendered HTML carrying parser metadata (a LibreOffice version
//   string among it), every comment on the document with timestamps, and a
//   percentRetrieved that changes with paging. All of that moves without the document
//   moving. The date it reports is the source system's own, and it does not.
//
// Deliberately not fetched:
//   - refresh: live        — pulled at query time, never cached
//   - reachable: false     — there is nothing to fetch, by design
//   - no summarize_to      — the source is read live or held by a person
//
// Usage: node .claude/skills/refresh-index/check.mjs [--fingerprint | --hash]
//        ... | node check.mjs --hash   computes the banner line for content on stdin
//
// ── WHERE THIS FILE COMES FROM ───────────────────────────────────────────────
// CANONICAL COPY:
//   nyt-context-cohort/.claude/skills/stand-up-your-repo/templates/refresh-index/check.mjs
//
// That is the copy that ships to every new team, so it is the original and this is an
// installed instance of it. Fix bugs there, then re-sync here:
//
//   cp <cohort-repo>/.claude/skills/stand-up-your-repo/templates/refresh-index/check.mjs \
//      .claude/skills/refresh-index/check.mjs
//
// check.test.mjs has a test that fails if the two have drifted, when both repos happen to
// be checked out side by side. It skips cleanly when they aren't. Editing this file
// directly is how a fix reaches the demo and never reaches anybody else.
// ─────────────────────────────────────────────────────────────────────────────

import { readFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, dirname, resolve } from 'node:path'

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

// The other kind of provenance, for sources reached through a connector rather than
// fetched directly. Tested against Glean on 2026-08-25: it reports the source system's
// real modification time, and hashing what it returns instead would be actively wrong —
// its payload carries Tika parser metadata (including a LibreOffice version string), every
// comment on the document with timestamps, and a percentRetrieved that changes with paging.
// All three move without the document moving. A date does not.
const UPDATED = /Source updated: (\d{4}-\d{2}-\d{2}(?:T[\d:.]+Z?)?)/

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
// Finding the manifest
//
// Walk up from the working directory rather than demanding the repo root. Running this
// from a subdirectory used to throw a bare ENOENT naming a relative path, which tells a
// first-time reader nothing about what went wrong. Paths inside the manifest resolve
// against the manifest's own directory, not the shell's — otherwise `summarize_to` would
// mean something different depending on where you stood when you ran it.
// ---------------------------------------------------------------------------
export function findManifest(start = process.cwd()) {
  let dir = resolve(start)
  for (;;) {
    const candidate = join(dir, 'context-manifest.yaml')
    if (existsSync(candidate)) return candidate
    const up = dirname(dir)
    if (up === dir) break
    dir = up
  }
  throw new Error(
    `no context-manifest.yaml in ${resolve(start)} or any directory above it. ` +
    'This has to run inside a repo that has one.',
  )
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

// The connector equivalent. Returns the modification time the copy was generated from, so
// the skill can compare it against what the connector reports now.
export function readUpdated(path, io = { readFileSync, existsSync }) {
  if (!io.existsSync(path)) return null
  const match = io.readFileSync(path, 'utf8').match(UPDATED)
  return match ? match[1] : null
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
export async function check({ manifestPath, today } = {}) {
  const manifest = manifestPath ? resolve(manifestPath) : findManifest()
  const root = dirname(manifest)
  const at = (p) => resolve(root, p) // manifest-relative, never cwd-relative
  const sources = parseSources(readFileSync(manifest, 'utf8'))
  const date = today || new Date().toISOString().slice(0, 10)
  const unchanged = []
  const changed = []
  const missing = []
  const skipped = []
  const overdue = []
  const unstable = []
  const manual = []
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
            exists: existsSync(at(src.copy_of_record)),
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
    // A source reachable only through a connector — Glean, an MCP server, anything
    // needing credentials this script does not have. It cannot be fetched here, and
    // saying so is the point: skipping it silently would let a cached copy sit
    // unchecked forever while the report looked clean.
    if (src.fetch_via) {
      manual.push({
        name,
        file: src.summarize_to,
        via: src.fetch_via,
        priorUpdated: readUpdated(at(src.summarize_to)),
      })
      continue
    }
    try {
      const raw = await fetchSource(name, src)
      const nowSha = sha256(raw)
      const nowBytes = byteLength(raw)
      const prior = readFingerprint(at(src.summarize_to))

      if (!prior) {
        // No fingerprint yet, so one is about to be written — and a fingerprint is only
        // worth writing if the source is byte-stable. Fetch a second time and compare.
        // A source that returns different bytes for the same content (an export carrying
        // a timestamp, a search index normalising differently between calls) will report
        // CHANGED on every future run, and somebody will spend a week working out why.
        // One extra request, once per source, converts that into a message today.
        const second = await fetchSource(name, src)
        if (sha256(second) !== nowSha) {
          unstable.push({
            name,
            file: src.summarize_to,
            first: nowSha,
            second: sha256(second),
            firstBytes: nowBytes,
            secondBytes: byteLength(second),
          })
          continue
        }
        missing.push({
          name,
          file: src.summarize_to,
          why: existsSync(at(src.summarize_to)) ? 'carries no fingerprint' : 'does not exist',
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
    manual.length
      ? `Needs the skill to fetch it:\n  ${manual.map((r) => `${r.name} — reachable only via ${r.via}, which this script cannot call. ${r.priorUpdated ? `Copy was generated from the version modified ${r.priorUpdated} — compare that against what ${r.via} reports now.` : 'No recorded version yet — first pass.'} → ${r.file}`).join('\n  ')}`
      : '',
    unstable.length
      ? `Unstable:\n  ${unstable.map((r) => `${r.name} — two fetches disagreed (${r.firstBytes} vs ${r.secondBytes} bytes, ${r.first.slice(0,8)}… vs ${r.second.slice(0,8)}…). No fingerprint written; this source cannot be checked by hash.`).join('\n  ')}`
      : '',
    overdue.length
      ? `\nOverdue:\n  ${overdue.map((r) => `${r.name} — ${r.file} was due ${r.refresh}, last confirmed ${r.lastConfirmed} (${r.days} days ago)${r.exists ? '' : ', and the file is missing entirely'}`).join('\n  ')}`
      : '',
    unchanged.length ? `\nUnchanged:\n  ${unchanged.map((r) => r.name).join('\n  ')}` : '',
    skipped.length ? `\nSkipped, by design:\n  ${skipped.map((r) => `${r.name} — ${r.why}`).join('\n  ')}` : '',
    failed.length ? `\nFailed:\n  ${failed.map((r) => `${r.name} — ${r.why}`).join('\n  ')}` : '',
  ].filter(Boolean).join('\n') || 'Nothing in the manifest declares a summarize_to.'

  return { unchanged, changed, missing, skipped, overdue, unstable, manual, failed, report }
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
  // The agent fetched something itself (over Glean, an MCP server, anywhere this script
  // cannot reach) and needs the banner line for it. Piping through here guarantees the
  // digest is computed exactly the way the gate will later recompute it.
  if (process.argv.includes('--hash')) {
    const chunks = []
    for await (const c of process.stdin) chunks.push(c)
    const text = Buffer.concat(chunks).toString('utf8').replace(/^\uFEFF/, '')
    console.log(`Source fingerprint: sha256:${sha256(text)} (${byteLength(text)} bytes)`)
    process.exit(0)
  }

  if (process.argv.includes('--fingerprint')) {
    let sources
    try {
      sources = parseSources(readFileSync(findManifest(), 'utf8'))
    } catch (err) {
      console.error(err.message)
      process.exit(2)
    }
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

  let result
  try {
    result = await check()
  } catch (err) {
    // A missing manifest is the most likely way this is invoked wrongly, and a raw stack
    // trace teaches nobody anything. Print the sentence and stop.
    console.error(err.message)
    process.exit(2)
  }
  const { failed, unstable, report } = result
  console.log(report)
  // A source that should be reachable and isn't, or that cannot be fingerprinted at all,
  // is the thing worth being told about.
  if (failed.length || unstable.length) process.exit(1)
}
