# index.md — where things actually live

**This is not a source of truth.** It's the addressing layer: where things are and
whether a tool can reach them. Locations and status only. Never content — the moment you
paste content in here there are two copies and no way to tell which one is wrong.

| What | Where | Reachable today? | Last confirmed |
|---|---|---|---|
| Product backlog — scope of record | [Notion — Learn.this Backlog](https://app.notion.com/p/3b3a901bd57d8146a6b6d48f1abdb851) | yes, via Notion MCP | Aug 5 |
| Cohort calendar | Drive → Learn.this → Ops | yes, via Glean | Jul 28 |
| Design system + product UI | [Figma — Learn.this Webapp](https://www.figma.com/design/YA4IogBXflpPsX5HEAm78o) | yes, via MCP | Jul 28 |
| Instructor NPS raw | Drive → Research → 2026 | yes, via Glean | Jul 28 |
| Vendor video SLA | vendor portal, SSO | **no** — export quarterly to `insights/` | Jul 14 |
| Contract terms | Legal, counsel only | **no, and correctly so** | — |

## On the first row

The backlog is the one people expect to find in the repo, and it deliberately isn't there.
Requirements move faster than anyone will hand-copy into markdown, so a copy would be
wrong within a week and nobody would know which version was real. `/weekly-digest` reads
it live over MCP instead. **Context doesn't have to be markdown sitting in this folder —
it has to be findable and reachable, and this row is what makes it both.**

The repo still holds something the backlog doesn't: `product/decisions/` says *why* scope
is what it is. When the backlog moves and no decision entry explains it, that gap is the
finding.

## On that last row

A pointer that says *canonical, unreachable, and that's correct* is a finished artifact,
not a to-do. Some material should stay where it is. Writing down that it exists, that it's
authoritative, and that we are deliberately not making it reachable is the right answer —
and a tool that knows this is better than one that goes looking.

## Freshness

Keeping this true is manual. Someone reads the rows and updates the dates, about fifteen
minutes a month. It is the first thing here that goes stale.
