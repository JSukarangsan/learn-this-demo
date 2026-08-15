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
// Usage: node .github/scripts/refresh-context.mjs [--dry-run]

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname } from 'node:path'

const DRY = process.argv.includes('--dry-run')
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5'
const MAX_SUMMARY_TOKENS = 1400 // ~5k characters. Small on purpose — see below.

// ---------------------------------------------------------------------------
// A very small YAML reader. The manifest is a fixed, flat shape that we control,
// so this handles exactly that shape rather than pulling in a dependency.
// ---------------------------------------------------------------------------
function parseSources(yaml) {
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
async function fetchSource(name, src) {
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
  if (src.type === 'notion_page' || src.type === 'notion_database') {
    const token = process.env.NOTION_TOKEN
    if (!token) throw new Error('NOTION_TOKEN is not set')
    const id = (src.canonical.match(/([0-9a-f]{32})/) || [])[1]
    if (!id) throw new Error(`no page id in ${src.canonical}`)
    const res = await fetch(`https://api.notion.com/v1/blocks/${id}/children?page_size=100`, {
      headers: { Authorization: `Bearer ${token}`, 'Notion-Version': '2022-06-28' },
    })
    if (!res.ok) throw new Error(`notion ${res.status}`)
    const json = await res.json()
    return JSON.stringify(json.results, null, 1)
  }
  throw new Error(`no way to fetch a ${src.type}`)
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

async function summarize(text, name) {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('ANTHROPIC_API_KEY is not set')
  const res = await fetch('https://api.anthropic.com/v1/messages', {
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
// Run
// ---------------------------------------------------------------------------
const manifest = readFileSync('context-manifest.yaml', 'utf8')
const sources = parseSources(manifest)
const today = new Date().toISOString().slice(0, 10)
const done = []
const skipped = []
const failed = []

for (const [name, src] of Object.entries(sources)) {
  if (!src.summarize_to) {
    skipped.push(`${name} — no summarize_to (${src.refresh === 'live' ? 'read live' : 'held by a person'})`)
    continue
  }
  if (src.reachable === false) {
    skipped.push(`${name} — reachable: false, and that is deliberate`)
    continue
  }
  try {
    const raw = await fetchSource(name, src)
    const summary = DRY ? '(dry run — not summarized)' : await summarize(raw, name)
    const file = `<!-- Generated from ${src.canonical}
     by .github/workflows/refresh-context.yml on ${today}.
     Do not edit this file. Edit the source, or the manifest entry that points at it. -->

> **Generated file.** Summarized from the ${src.type.replace('_', ' ')} owned by
> ${src.owner || 'unknown'}, on ${today}. Refresh cadence: ${src.refresh || 'unset'}.
> The source is canonical; if this disagrees with it, this is wrong.

${summary}
`
    if (!DRY) {
      mkdirSync(dirname(src.summarize_to), { recursive: true })
      writeFileSync(src.summarize_to, file)
    }
    done.push(`${name} → ${src.summarize_to} (${raw.length} chars in, ${summary.length} out)`)
  } catch (err) {
    failed.push(`${name} — ${err.message}`)
  }
}

const report = [
  done.length ? `Refreshed:\n  ${done.join('\n  ')}` : 'Refreshed nothing.',
  skipped.length ? `\nSkipped, by design:\n  ${skipped.join('\n  ')}` : '',
  failed.length ? `\nFailed:\n  ${failed.join('\n  ')}` : '',
].filter(Boolean).join('\n')

console.log(report)
if (process.env.GITHUB_OUTPUT && existsSync(process.env.GITHUB_OUTPUT)) {
  writeFileSync(process.env.GITHUB_OUTPUT, `changed=${done.length > 0}\n`, { flag: 'a' })
}
// A source that should be reachable and isn't is the thing worth being told about.
if (failed.length) process.exit(1)
