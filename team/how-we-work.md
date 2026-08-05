# Webapp — how we work

> Refresh on process changes. Stable otherwise.

## Cadence

| | Frequency | What |
|---|---|---|
| Standup | Daily, async in `#webapp` | Written, not a meeting |
| **Weekly update** | **Mondays, covering the previous seven days** | **Posted to `#webapp`. This is the reporting window — when anything says "this week," it means Monday to Sunday, not the sprint.** |
| Sprint planning | Every two weeks, Monday | |
| Retro | Every two weeks, Friday | |
| Instructor Tools sync | Weekly | **The only place content-model questions get answered** |
| Half planning | Twice a year | Where `roadmap-and-bets.md` and `goals-and-okrs.md` get rewritten |

## Review bar

- Two approvals for anything touching enrollment or money. One for everything else.
- A PR that changes a decision needs an entry in `../product/decisions/` before it merges.
  This is the rule most likely to be skipped and the one that costs the most when it is.
- `../product/procedures/pre-release-checklist.md` before anything goes behind a flag.

## What "done" means

Behind a flag, checklist passed, flag still off. **Not merged.** This trips up everyone
who joins from a team where merge meant done, and it's why it's the third line of the
root `CLAUDE.md`.

## Channels

| | |
|---|---|
| `#webapp` | Us. Standups, day to day. |
| `#webapp-context` | Where the context-layer bot posts — new decisions, new constraints, PRs waiting on review |
| `#billing` | Triaged Tuesdays. A Thursday message waits. |
| `#growth` | Lifecycle email, anything above the signup |
| `#incidents` | Live session problems go here first, then to Tobias |

## How this folder gets maintained

Everything in `team/` is stable context and changes rarely — quarterly is normal. The
person who owns each file is the person who'd notice it was wrong first: engineering lead
for the review bar, PM for goals and roadmap, whoever ran the last reorg for stakeholders.

The rest of the kit moves on a different clock. `../product/decisions/` grows whenever a
decision lands. Domain files grow **when the model gets something wrong** — that failure is
the trigger, not a hunch that something might be useful later. Adding by anticipation is
what turns a context layer into noise nobody reads.

And deleting is maintenance, not cleanup. Wrong context is worse than missing context:
missing context makes the model ask, wrong context makes it confident.
