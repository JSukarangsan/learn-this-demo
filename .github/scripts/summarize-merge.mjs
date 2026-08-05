/**
 * Turns a merged PR into the Slack message the team actually needs to see.
 *
 * Two things are going on here.
 *
 * The routing table decides *whether* anyone hears about a merge. A notification that
 * fires on every one gets muted in a week, so the folder a change landed in carries
 * that decision — the same mapping the kit's CLAUDE.md files already describe.
 *
 * The detail extractors decide *what* the message says. "A decision landed" is a
 * filing cabinet sound; it tells a reader they have to go look. So each route knows
 * how to read its own file shape out of the diff — a decision's title and status, the
 * bold clause of a new constraint, which sources joined the manifest. That only works
 * because these files have a predictable shape, which is the argument for the shape.
 *
 * No model runs here. Everything below is pulled straight out of the patch, so the
 * message can't hallucinate and can't be slow.
 */

// ---------------------------------------------------------------- reading a patch

/** Lines a patch added, without the leading "+". */
function addedLines(item) {
  return (item.patch ?? '')
    .split('\n')
    .filter((l) => l.startsWith('+') && !l.startsWith('+++'))
    .map((l) => l.slice(1))
}

const addedText = (items) => items.flatMap(addedLines).join('\n')

/** First match of `re` across everything the merge added. */
function firstMatch(items, re) {
  const m = addedText(items).match(re)
  return m ? m[1].trim() : null
}

/** Trim to a length Slack won't wrap into a wall. Breaks on a word. */
function clip(s, max = 120) {
  const t = s.replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  return t.slice(0, t.lastIndexOf(' ', max)).replace(/[,;:.]$/, '') + '…'
}

/**
 * The opening paragraph of prose — skipping headings, metadata and blanks. Markdown
 * hard-wraps, so a single line is usually half a sentence; take the whole paragraph
 * and let clip() decide where to stop.
 */
function firstProse(items) {
  const lines = addedLines(items[0] ?? {}).map((l) => l.trim())
  const start = lines.findIndex(
    (l) => l && !l.startsWith('#') && !/^\w+:\s/.test(l) && !l.startsWith('>') && !l.startsWith('-'),
  )
  if (start === -1) return null
  const para = []
  for (let i = start; i < lines.length && lines[i]; i++) para.push(lines[i])
  return clip(para.join(' '))
}

/**
 * The "why" line under a bullet. Every significant bullet gets one — the label alone
 * ("a constraint changed") still sends the reader off to go and look, which is the
 * errand the notification exists to save them.
 *
 * Italic as well as indented: Slack is inconsistent about preserving leading spaces,
 * so the italics carry the subordination even if the indent collapses.
 */
const under = (s) => {
  if (!s) return ''
  const t = clip(sentence(s), 150)
  return t ? `\n        _${t}_` : ''
}

/** Drop a markdown byline ("Wren, Aug 5.") and start on a capital. */
function sentence(s) {
  const t = s.replace(/^\s*[A-Z][a-z]+,\s+\w+\s+\d+\.\s*/, '').trim()
  return t ? t[0].toUpperCase() + t.slice(1) : ''
}

/** Title of a markdown file from its first heading. */
function titleOf(items) {
  return firstMatch(items, /^#\s+(?:\d{4}-\d{2}-\d{2}\s+[—-]\s+)?(.+?)\s*$/m)
}

/** How each manifest `type:` reads in a sentence. */
const TYPE_NOUN = {
  figma: 'a Figma file',
  notion_database: 'a Notion database',
  google_doc: 'a Google Doc',
  google_sheet: 'a Google Sheet',
  github_repo: 'a GitHub repo',
  slack_channel: 'a Slack channel',
  vendor_portal: 'a vendor portal',
  markdown: 'a local file',
  restricted: 'restricted material',
}

// ------------------------------------------------------------- detail extractors
// Each returns a finished bullet string, or null to fall back to the generic line.

function decisionDetail(items) {
  // "# 2026-08-05 — A cohort's timezone is locked at creation"
  const title = firstMatch(items, /^#\s+(?:\d{4}-\d{2}-\d{2}\s+[—-]\s+)?(.+)$/m)
  if (!title) return null
  const status = firstMatch(items, /^status:\s*(\w+)/m) ?? 'decided'
  const gist = firstProse(items)
  const head =
    items.length > 1
      ? `*${title}* — ${status}, plus ${items.length - 1} more`
      : `*${title}* — ${status}`
  return gist ? head + under(gist) : head
}

function constraintDetail(items) {
  // "- **No session time or timezone change inside a started cohort**, same path…"
  const m = addedText(items).match(/-\s+\*\*(.+?)\*\*[,.]?\s*([\s\S]*)/)
  if (!m) return null
  // Everything after the bold clause, up to the blank line, is the reason for it.
  return `Added to the *do not* list: *${clip(m[1])}*` + under(m[2].split(/\n\s*\n/)[0])
}

function designDetail(items) {
  const title = titleOf(items)
  const text = addedText(items)
  const gaps = (text.match(/^\s*✗/gm) ?? []).length
  const done = (text.match(/^\s*✓/gm) ?? []).length
  if (!title && !gaps) return null
  const counts = [done && `${done} designed`, gaps && `${gaps} missing`].filter(Boolean).join(', ')
  const head = counts ? `*${title ?? 'Design context'}* — ${counts}` : `*${title}*`
  // Name the first gap. A count says there's a problem; this says which one.
  const firstGap = (text.match(/^\s*✗\s*(.+)$/m) ?? [])[1]
  return head + under(firstGap && `Top gap: ${firstGap.trim()}`)
}

function manifestDetail(items) {
  const lines = addedLines(items[0] ?? {})
  // New second-level keys under `sources:` are new pointers.
  const keys = lines.map((l) => l.match(/^ {2}([a-z0-9_]+):\s*$/)).filter(Boolean).map((m) => m[1])
  if (!keys.length) {
    // No new source, but reachability flipping is the other thing worth hearing about.
    return lines.some((l) => /^\s*reachable:/.test(l))
      ? "The manifest changed — a source's reachability moved"
      : null
  }
  const head = `New source${keys.length > 1 ? 's' : ''} in the manifest: ${fmtList(keys.map((k) => `\`${k}\``))}`
  // What the pointer actually points at, so the line stands on its own.
  const text = addedText(items)
  const type = (text.match(/^\s*type:\s*(\S+)/m) ?? [])[1]
  const owner = (text.match(/^\s*owner:\s*"?([^"\n]+)"?/m) ?? [])[1]
  const bits = [
    type && (TYPE_NOUN[type] ?? `a ${type.replace(/_/g, ' ')}`),
    owner && `owned by ${owner.trim()}`,
  ].filter(Boolean).join(', ')
  return head + under(bits && `Points at ${bits}.`)
}

/** Project files that aren't the brief — notes, specs, whatever the team filed. */
function projectDetail(items) {
  const named = items.filter((it) => it.patch)
  const title = named.length ? titleOf(named) : null
  if (!title) return null
  const proj = project(named[0].filename).replace(/`/g, '')
  const extra = items.length > 1 ? `, plus ${items.length - 1} more` : ''
  return `*${title}* filed under *${proj}*${extra}` + under(firstProse([named[0]]))
}

function teamDetail(items) {
  if (!titleOf(items)) return null
  return `Stable context changed: ${fmtList(items.map((it) => base(it.filename)))}` +
    under(firstProse([items[0]]))
}

function glossaryDetail(items) {
  const terms = addedLines(items[0] ?? {})
    .map((l) => l.match(/^\*\*(.+?)\*\*\s+—/))
    .filter(Boolean)
    .map((m) => `*${m[1]}*`)
  if (!terms.length) return null
  return `Glossary — ${fmtList(terms)}`
}

function briefDetail(items) {
  const it = items[0]
  if (!it?.patch) return null
  const added = addedLines(it).filter((l) => l.trim().startsWith('- ')).length
  // A removed bullet is a diff "-" followed by a markdown "-". "---" is a file header.
  const removed = (it.patch.match(/^-(?!--)\s*-\s+\S/gm) ?? []).length
  if (!added && !removed) return null
  const parts = [added && `${added} added`, removed && `${removed} removed`].filter(Boolean)
  return `Scope changed on *${project(it.filename).replace(/`/g, '')}* — ${parts.join(', ')}`
}

// ------------------------------------------------------------------ routing table

/** Most specific pattern first — the first match wins. */
const ROUTES = [
  {
    test: (p) => p.startsWith('product/decisions/'),
    area: 'decision',
    significant: true,
    detail: decisionDetail,
    line: (n) => `${n === 1 ? 'A decision' : `${n} decisions`} landed in \`product/decisions/\``,
  },
  {
    test: (p) => p === 'engineering/constraints.md',
    area: 'constraint',
    significant: true,
    detail: constraintDetail,
    line: () => 'The engineering constraints changed — the *do not* list',
  },
  {
    test: (p) => p === 'insights/definitions.md',
    area: 'metrics',
    significant: true,
    line: () => 'A metric definition changed',
  },
  {
    test: (p) => p === 'product/glossary.md',
    area: 'glossary',
    significant: true,
    detail: glossaryDetail,
    line: () => 'The glossary changed — a term or a learner state',
  },
  {
    test: (p) => p.startsWith('team/'),
    area: 'team',
    significant: true,
    detail: teamDetail,
    line: (n, paths) => `Stable context changed: ${fmtList(paths.map(base))}`,
  },
  {
    test: (p) => /^deliverables\/[^/]+\/brief\.md$/.test(p),
    area: 'brief',
    significant: true,
    detail: briefDetail,
    line: (n, paths) => `${n === 1 ? 'A brief' : `${n} briefs`} changed: ${fmtList(paths.map(project))}`,
  },
  {
    test: (p) => p === 'context-manifest.yaml',
    area: 'manifest',
    significant: true,
    detail: manifestDetail,
    line: () =>
      'The context manifest changed — where a source of truth lives, or whether it is reachable',
  },
  {
    // Design context counts wherever it's filed — the shared folder, or inside a
    // project when it's specific to one. A states matrix is not a project note.
    test: (p) => p.startsWith('design/') || p.includes('/design/'),
    area: 'design',
    significant: true,
    detail: designDetail,
    line: (n, paths) => `Design context changed: ${fmtList(paths.map(base))}`,
  },
  {
    test: (p) => p.startsWith('engineering/'),
    area: 'engineering',
    significant: false,
    line: (n) => `${n} engineering ${plural(n, 'file')} updated`,
  },
  {
    test: (p) => p.startsWith('product/procedures/'),
    area: 'procedure',
    significant: false,
    line: (n) => `${n} ${plural(n, 'procedure')} updated`,
  },
  {
    test: (p) => p.startsWith('deliverables/'),
    area: 'project',
    significant: false,
    detail: projectDetail,
    line: (n, paths) => `${n} ${plural(n, 'file')} under ${fmtList(unique(paths.map(project)))}`,
  },
  {
    test: (p) => p.startsWith('comms/notes/'),
    area: 'notes',
    significant: false,
    line: (n) => `${n} raw ${plural(n, 'note')} filed in \`comms/notes/\` — not canonical`,
  },
  {
    // Generated by /weekly-digest, and the team already read it in this channel.
    test: (p) => p.startsWith('comms/status/'),
    area: 'status',
    significant: false,
    line: (n) => `${n} status ${plural(n, 'report')} archived`,
  },
  {
    test: (p) => p.startsWith('comms/'),
    area: 'comms',
    significant: false,
    line: (n) => `${n} ${plural(n, 'file')} in \`comms/\` — not canonical`,
  },
  {
    test: (p) => p.startsWith('.claude/skills/'),
    area: 'skills',
    significant: false,
    line: (n, paths) => `Skills changed: ${fmtList(unique(paths.map(skill)))}`,
  },
  {
    test: (p) => p === 'CLAUDE.md',
    area: 'routing',
    significant: true,
    line: () => 'The root `CLAUDE.md` changed — the file every session reads first',
  },
]

const FALLBACK = {
  area: 'other',
  significant: false,
  line: (n) => `${n} other ${plural(n, 'file')} changed`,
}

const base = (p) => `\`${p.split('/').pop()}\``
const project = (p) => `\`${p.split('/')[1]}\``
const skill = (p) => `\`/${p.split('/')[2]}\``
const plural = (n, word) => (n === 1 ? word : `${word}s`)
const unique = (xs) => [...new Set(xs)]

function fmtList(items) {
  const xs = unique(items)
  if (xs.length <= 2) return xs.join(' and ')
  return `${xs.slice(0, -1).join(', ')}, and ${xs[xs.length - 1]}`
}

/** Which route a single path belongs to. Exported so the tests can pin the table down. */
export function classify(path) {
  return ROUTES.find((r) => r.test(path)) ?? FALLBACK
}

/**
 * @param {object} pr      - { number, title, url, author, branch }
 * @param {Array<string|{filename,patch,status}>} files - paths, or the API's file objects.
 *                           Given plain paths there is no diff to read, so the message
 *                           falls back to the generic per-route line.
 */
export function summarizeMerge(pr, files) {
  const items = []
  const seen = new Set()
  for (const f of files) {
    const it = typeof f === 'string' ? { filename: f } : f
    if (!it?.filename || seen.has(it.filename)) continue
    seen.add(it.filename)
    items.push(it)
  }

  // Group by route, preserving ROUTES order so the message reads most-important-first
  // rather than in whatever order git listed the files.
  const groups = new Map()
  for (const it of items) {
    const route = classify(it.filename)
    if (!groups.has(route)) groups.set(route, [])
    groups.get(route).push(it)
  }
  const ordered = [...ROUTES, FALLBACK].filter((r) => groups.has(r))

  const lines = ordered.map((r) => {
    const group = groups.get(r)
    const paths = group.map((it) => it.filename)
    // Prefer the specific reading of the diff; fall back when there's nothing to read.
    return (r.detail && r.detail(group)) || r.line(group.length, paths, group)
  })

  const areas = ordered.map((r) => r.area)
  const significant = ordered.some((r) => r.significant)
  const paths = items.map((it) => it.filename)

  const only = projectOf(paths)
  const headline = only
    ? `${titleCase(only)} — ${paths.length} ${plural(paths.length, 'file')} merged`
    : `${paths.length} ${plural(paths.length, 'file')} merged`

  return { significant, headline, lines, areas, payload: blocks(pr, headline, lines) }
}

/** The single deliverable a merge is about, if there is exactly one. */
function projectOf(paths) {
  const projects = unique(
    paths.filter((p) => p.startsWith('deliverables/')).map((p) => p.split('/')[1]),
  )
  return projects.length === 1 ? projects[0] : null
}

const titleCase = (slug) => slug.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase())

function blocks(pr, headline, lines) {
  const body = lines.map((l) => `• ${l}`).join('\n')
  const author = pr.author ? ` · ${pr.author}` : ''
  // The fallback text drives the notification and screen readers, so it gets the
  // same content flattened onto one line.
  const flat = lines.map((l) => l.replace(/\s*\n\s*/g, ' — ')).join('; ')

  return {
    text: `${headline} — ${flat}`,
    blocks: [
      { type: 'header', text: { type: 'plain_text', text: headline, emoji: true } },
      { type: 'section', text: { type: 'mrkdwn', text: body } },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `<${pr.url}|#${pr.number} ${pr.title}>${author} · merged into \`${pr.branch}\``,
          },
        ],
      },
    ],
  }
}
