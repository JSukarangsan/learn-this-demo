// Resolve every pointer in context-manifest.yaml that declares a `summarize_to`,
// summarize what it finds, and write the result into the repo.
//
// The whole point of the manifest is that this script knows nothing about Learn.this.
// It reads the manifest and does what the manifest says. Adding a source is a manifest
// edit, not a code change.
//
// Deliberately skipped:
//   - refresh: live        — pulled at query time, never cached
//   - reachable: false     — there is nothing to fetch, by design
//   - no summarize_to      — the source is read live or held by a person
//
// Every run appends an entry to team/_generated/refresh-log.md, including the runs that
// refreshed nothing. That log is the only durable answer to "when did this last run",
// and a run that found nothing is exactly the run nobody would otherwise notice.
//
// Usage: node .github/scripts/refresh-context.mjs [--dry-run]

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname } from 'node:path'

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5'
const MAX_SUMMARY_TOKENS = 1400 // ~5k characters. Small on purpose — see below.
const LOG_PATH = 'team/_generated/refresh-log.md'

// `live` is the one `refresh:` value that means "there is no copy". Everything else is
// a cadence, and a cadence on a source with nowhere to write is a mistake worth catching.
const UNCACHED_REFRESH = 'live'

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
// Summarize
// ---------------------------------------------------------------------------
const PROMPT = `You are writing a context file that an AI coding agent will read before
answering questions about this team's work. A person will also read it, but the agent is
the primary audience.

Summarize the source below. Rules:

- Under 5,000 characters. Shorter is better. A context file nobody finishes is worse than
  one that omits something.
- Keep every number, date, name, target and constraint. Those are the reason this file
  exists. Drop the narrative around them.
- Keep anything stated as a rule, a guardrail, or a decision — especially anything phrased
  as what NOT to do, and the reasoning behind it.
- Keep the caveats. "This number moves on cohort mix" is more useful than the number.
- Do not add analysis, recommendations, or anything not in the source.
- If the source contradicts itself, say so rather than resolving it.
- Markdown. Start with a heading. No preamble.`

export async function summarize(text, name) {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('ANTHROPIC_API_KEY is not set')
  const base = process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com'
  const res = await fetch(`${base}/v1/messages`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_SUMMARY_TOKENS,
      system: PROMPT,
      messages: [{ role: 'user', content: `Source: ${name}\n\n${text.slice(0, 180_000)}` }],
    }),
  })
  if (!res.ok) throw new Error(`anthropic ${res.status}: ${(await res.text()).slice(0, 300)}`)
  const json = await res.json()
  return json.content.map((b) => b.text || '').join('').trim()
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

const pad = (s, n) => String(s).padEnd(n)

export function renderLogEntry({ today, done, skipped, failed, runUrl, dryRun }) {
  const width = Math.max(
    ...[...done, ...skipped, ...failed].map((r) => r.name.length),
    4,
  )
  const rows = [
    ...done.map((r) => `REFRESHED    ${pad(r.name, width)}  → ${r.file} (${r.in} chars in, ${r.out} out)`),
    ...failed.map((r) => `FAILED       ${pad(r.name, width)}  ${r.why}`),
    ...skipped.map((r) => `SKIPPED      ${pad(r.name, width)}  ${r.why}`),
  ]

  const counts = [
    `${done.length} refreshed`,
    `${failed.length} failed`,
    `${skipped.length} skipped by design`,
  ].join(', ')

  const lines = [
    `## ${today} — pipeline${dryRun ? ' (dry run)' : ''}`,
    '',
    `\`refresh-context.yml\`. ${counts}.${runUrl ? ` [Run log](${runUrl}).` : ''}`,
    '',
    '```',
    ...(rows.length ? rows : ['No entry in the manifest declares a summarize_to.']),
    '```',
  ]

  if (failed.length) {
    lines.push(
      '',
      failed.length === 1
        ? 'The failure above is the finding. Nothing else in this run needs reading.'
        : 'The failures above are the finding. Nothing else in this run needs reading.',
    )
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
export async function refresh({ dryRun = false, manifestPath = 'context-manifest.yaml', today, logPath = LOG_PATH } = {}) {
  const sources = parseSources(readFileSync(manifestPath, 'utf8'))
  const date = today || new Date().toISOString().slice(0, 10)
  const done = []
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

  const targets = Object.entries(sources).filter(([, src]) => src.summarize_to && src.reachable !== false)

  // One clear line beats the same missing secret reported once per source — and this is
  // the failure that kept this pipeline from ever producing anything.
  if (targets.length && !dryRun && !process.env.ANTHROPIC_API_KEY) {
    failed.push({ name: 'ANTHROPIC_API_KEY', why: 'not set in the repo secrets, so nothing can be summarized.' })
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
    if (failed.some((f) => f.name === 'ANTHROPIC_API_KEY')) continue
    try {
      const raw = await fetchSource(name, src)
      const summary = dryRun ? '(dry run — not summarized)' : await summarize(raw, name)
      const file = `<!-- Generated from ${src.canonical}
     by .github/workflows/refresh-context.yml on ${date}.
     Do not edit this file. Edit the source, or the manifest entry that points at it. -->

> **Generated file.** Summarized from the ${src.type.replace('_', ' ')} owned by
> ${src.owner || 'unknown'}, on ${date}. Refresh cadence: ${src.refresh || 'unset'}.
> The source is canonical; if this disagrees with it, this is wrong.

${summary}
`
      if (!dryRun) {
        mkdirSync(dirname(src.summarize_to), { recursive: true })
        writeFileSync(src.summarize_to, file)
      }
      done.push({ name, file: src.summarize_to, in: raw.length, out: summary.length })
    } catch (err) {
      failed.push({ name, why: err.message })
    }
  }

  const report = [
    done.length
      ? `Refreshed:\n  ${done.map((r) => `${r.name} → ${r.file} (${r.in} chars in, ${r.out} out)`).join('\n  ')}`
      : 'Refreshed nothing.',
    skipped.length ? `\nSkipped, by design:\n  ${skipped.map((r) => `${r.name} — ${r.why}`).join('\n  ')}` : '',
    failed.length ? `\nFailed:\n  ${failed.map((r) => `${r.name} — ${r.why}`).join('\n  ')}` : '',
  ].filter(Boolean).join('\n')

  // The run log is written even when the run failed outright, and especially then. A
  // pipeline that quietly does nothing for four months is the failure this repo exists
  // to make visible, so the record of the attempt has to survive the attempt.
  const runUrl = process.env.GITHUB_RUN_ID && process.env.GITHUB_REPOSITORY
    ? `${process.env.GITHUB_SERVER_URL || 'https://github.com'}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
    : null

  let logged = false
  if (!dryRun) {
    appendToLog(renderLogEntry({ today: date, done, skipped, failed, runUrl, dryRun }), { path: logPath })
    logged = true
  }

  return { done, skipped, failed, report, logged }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------
const invokedDirectly = process.argv[1] && process.argv[1].endsWith('refresh-context.mjs')

if (invokedDirectly) {
  const dryRun = process.argv.includes('--dry-run')
  const { done, failed, report, logged } = await refresh({ dryRun })

  console.log(report)
  if (logged) console.log(`\nLogged to ${LOG_PATH}.`)

  if (process.env.GITHUB_OUTPUT && existsSync(process.env.GITHUB_OUTPUT)) {
    // Every real run appends to the log, so there is always something to propose. The
    // PR carries the record of the run even when no summary moved — which is the run
    // you most want a person to see.
    writeFileSync(process.env.GITHUB_OUTPUT, `changed=${done.length > 0 || logged}\n`, { flag: 'a' })
  }
  // A source that should be reachable and isn't is the thing worth being told about.
  // The exit code fails the step; it must not decide whether the PR opens, because the
  // sources that did work are still worth proposing and the log entry is still worth
  // keeping. The workflow gates the PR on `changed`, not on this.
  if (failed.length) process.exit(1)
}
