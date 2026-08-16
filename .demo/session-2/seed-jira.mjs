#!/usr/bin/env node
/**
 * Seed the Session 2 demo Jira from jira-seed.csv.
 *
 *   node .demo/session-2/seed-jira.mjs inspect   what your site actually has
 *   node .demo/session-2/seed-jira.mjs seed      create the issues
 *   node .demo/session-2/seed-jira.mjs reset     delete everything in the project
 *
 * Credentials come from ~/.learn-this-jira.env, which lives outside this repo on
 * purpose. Never put the token in here, and never commit it.
 *
 *   JIRA_SITE=https://your-site.atlassian.net
 *   JIRA_EMAIL=you@example.com
 *   JIRA_TOKEN=<from id.atlassian.com/manage-profile/security/api-tokens>
 *   JIRA_PROJECT=LTHIS
 */

import { readFileSync, existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ENV_FILE = join(homedir(), '.learn-this-jira.env')

// ── config ────────────────────────────────────────────────────────────────────
function loadEnv() {
  if (existsSync(ENV_FILE)) {
    for (const line of readFileSync(ENV_FILE, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  }
  const missing = ['JIRA_SITE', 'JIRA_EMAIL', 'JIRA_TOKEN'].filter((k) => !process.env[k])
  if (missing.length) {
    console.error(`Missing ${missing.join(', ')}.\nPut them in ${ENV_FILE} — see the header of this file.`)
    process.exit(1)
  }
  return {
    site: process.env.JIRA_SITE.replace(/\/$/, ''),
    auth: 'Basic ' + Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_TOKEN}`).toString('base64'),
    project: process.env.JIRA_PROJECT || 'LTHIS',
  }
}

const CFG = loadEnv()

async function api(path, opts = {}) {
  const res = await fetch(`${CFG.site}/rest/api/3${path}`, {
    ...opts,
    headers: { Authorization: CFG.auth, 'Content-Type': 'application/json', Accept: 'application/json' },
  })
  const text = await res.text()
  let body = null
  try { body = text ? JSON.parse(text) : null } catch { body = text }
  if (!res.ok) {
    const detail = body?.errorMessages?.join('; ') || JSON.stringify(body?.errors || body || '').slice(0, 400)
    throw new Error(`${res.status} ${opts.method || 'GET'} ${path} — ${detail}`)
  }
  return body
}

// ── the seed data. one source of truth, read from the CSV. ────────────────────
function parseCsv(text) {
  const rows = []
  let row = [], field = '', quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++ }
      else if (c === '"') quoted = false
      else field += c
    } else if (c === '"') quoted = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = '' }
    else if (c !== '\r') field += c
  }
  if (field || row.length) { row.push(field); rows.push(row) }
  const head = rows.shift()
  return rows.filter((r) => r.some((v) => v !== '')).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])))
}

const SEED = parseCsv(readFileSync(join(HERE, 'jira-seed.csv'), 'utf8'))

/** Kit vocabulary → whatever the site calls it. Left side is what the skill expects. */
const STATUS_ALIASES = {
  'Backlog':     ['Backlog', 'To Do', 'Idea', 'Open'],
  'In build':    ['In build', 'In Progress', 'In progress'],
  'Behind flag': ['Behind flag', 'Testing', 'In Review', 'Review'],
  'Blocked':     ['Blocked', 'On Hold'],
  'Shipped':     ['Shipped', 'Done', 'Closed'],
  'Cut':         ['Cut', "Won't Do", 'Done'],
}

const adf = (text) => ({
  type: 'doc', version: 1,
  content: text.split('\n').filter(Boolean).map((line) => ({
    type: 'paragraph', content: [{ type: 'text', text: line }],
  })),
})

// ── commands ──────────────────────────────────────────────────────────────────
async function context() {
  const meta = await api(`/issue/createmeta?projectKeys=${CFG.project}&expand=projects.issuetypes`)
  const proj = meta.projects?.[0]
  if (!proj) throw new Error(`Project ${CFG.project} not found. Check JIRA_PROJECT and the key in Jira.`)
  const statuses = await api(`/project/${CFG.project}/statuses`)
  const names = [...new Set(statuses.flatMap((t) => t.statuses.map((s) => s.name)))]
  return { proj, types: proj.issuetypes.map((t) => t.name), statuses: names }
}

async function inspect() {
  const { proj, types, statuses } = await context()
  console.log(`\nProject   ${proj.key} — ${proj.name}`)
  console.log(`Types     ${types.join(', ')}`)
  console.log(`Statuses  ${statuses.join(', ')}\n`)

  const need = [...new Set(SEED.map((r) => r.Status))]
  console.log('Status mapping the seed will use:')
  let gaps = 0
  for (const want of need) {
    const hit = (STATUS_ALIASES[want] || [want]).find((a) => statuses.includes(a))
    if (hit === want) console.log(`  ✓ ${want}`)
    else if (hit) console.log(`  ~ ${want}  →  ${hit}   (rename the column to "${want}" if you want the kit vocabulary)`)
    else { console.log(`  ✗ ${want}  →  NOTHING MATCHES. Add this status or the issue stays in the default one.`); gaps++ }
  }
  const wantTypes = [...new Set(SEED.map((r) => r['Issue Type']))]
  console.log('\nIssue types:')
  for (const t of wantTypes) console.log(`  ${types.includes(t) ? '✓' : '✗'} ${t}`)
  console.log(gaps ? `\n${gaps} status gap(s). Seeding still works; those issues land in the default column.\n` : '\nReady to seed.\n')
}

async function seed() {
  const { types, statuses } = await context()
  const fallbackType = types.includes('Task') ? 'Task' : types[0]
  const created = []

  for (const row of SEED) {
    const type = types.includes(row['Issue Type']) ? row['Issue Type'] : fallbackType
    const body = [
      row.Description,
      row.Labels ? `Area: ${row.Labels}` : '',
      row.Assignee ? `Owner: ${row.Assignee}` : '',
      // Jira Cloud will not let an API client backdate created/updated, so the dates
      // that matter to the demo are stated here instead of faked in the metadata.
      `Status last changed: ${row.Updated}`,
    ].filter(Boolean).join('\n')

    const fields = {
      project: { key: CFG.project },
      summary: row.Summary,
      issuetype: { name: type },
      description: adf(body),
    }
    if (row.Labels) fields.labels = [row.Labels]

    const issue = await api('/issue', { method: 'POST', body: JSON.stringify({ fields }) })
    created.push({ key: issue.key, seedKey: row['Issue key'], row })
    process.stdout.write(`  ${issue.key}  ${row.Summary}\n`)
  }

  // statuses, after creation — a new issue always starts in the first column
  console.log('\nSetting statuses…')
  for (const c of created) {
    const want = c.row.Status
    const target = (STATUS_ALIASES[want] || [want]).find((a) => statuses.includes(a))
    if (!target) { console.log(`  ${c.key}  no status matches "${want}", left as created`); continue }
    const { transitions } = await api(`/issue/${c.key}/transitions`)
    const t = transitions.find((x) => x.to.name === target)
    if (!t) { console.log(`  ${c.key}  no transition to "${target}", left as created`); continue }
    await api(`/issue/${c.key}/transitions`, { method: 'POST', body: JSON.stringify({ transition: { id: t.id } }) })
    console.log(`  ${c.key}  → ${target}${target === want ? '' : `  (wanted "${want}")`}`)
  }

  // the blocked-by link. the Blocked section of the update comes from this and
  // nothing else, so a demo without it shows an empty Blocked section.
  console.log('\nLinking blockers…')
  const bySeed = Object.fromEntries(created.map((c) => [c.seedKey, c.key]))
  for (const c of created) {
    const blocker = c.row['Blocked by']
    if (!blocker) continue
    const from = bySeed[blocker]
    if (!from) { console.log(`  ${c.key}  blocker ${blocker} not in seed`); continue }
    await api('/issueLink', {
      method: 'POST',
      body: JSON.stringify({
        type: { name: 'Blocks' },
        outwardIssue: { key: from },   // from blocks c
        inwardIssue: { key: c.key },   // c is blocked by from
      }),
    })
    console.log(`  ${c.key} is blocked by ${from}`)
  }

  const drift = created.filter((c) => c.key !== c.seedKey)
  if (drift.length) {
    console.log(`\n⚠  Keys do not match the seed. The docs reference ${drift[0].seedKey}; Jira issued ${drift[0].key}.`)
    console.log('   Either reset, set the project key to match, and re-seed — or update the references in')
    console.log('   .claude/skills/build-update/references/update-format.md and .demo/session-2/README.md.')
  }
  console.log(`\nDone. ${created.length} issues.\n`)
}

async function reset() {
  const { issues } = await api(`/search/jql?jql=${encodeURIComponent(`project = ${CFG.project}`)}&maxResults=200&fields=key`)
  if (!issues?.length) return console.log('Nothing to delete.')
  for (const i of issues) {
    await api(`/issue/${i.key}?deleteSubtasks=true`, { method: 'DELETE' })
    console.log(`  deleted ${i.key}`)
  }
  console.log(`\n${issues.length} deleted. Re-run \`seed\` for a clean board.\n`)
}

const cmd = process.argv[2]
const run = { inspect, seed, reset }[cmd]
if (!run) { console.error('Usage: seed-jira.mjs inspect|seed|reset'); process.exit(1) }
run().catch((e) => { console.error(`\n${e.message}\n`); process.exit(1) })
