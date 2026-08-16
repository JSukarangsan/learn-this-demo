# Session 2 demo — setup and run of show

Everything here is scaffolding for running the Aug 19 demo. It is not part of the kit, and a
participant browsing this repo has no reason to read it. That's why it's in a dotfolder.

Two slides depend on this branch:

| Slide | What it needs |
|---|---|
| **11** — repo structure walkthrough | the tree, which is now `projects/` not `deliverables/` |
| **17** — turn a task into a skill | a Jira project with the seed data, and `/build-update` **deleted before you start** |

---

## Before the session

### 1. Fix two things in the Jira UI — 5 minutes

The site already exists (*Learn.This Webapp Team*, free plan, team-managed Scrum).

**Change the project key from `SCRUM` to `LTHIS`.** *Project settings → Details → Key*.
Existing issues renumber, which is fine — the two sample tasks get deleted anyway. Do this
before seeding, because `LTHIS-18` on screen reads like a real team's tracker and
`SCRUM-18` reads like a template nobody configured. The worked example in
`update-format.md` also cites those keys.

**Rename the board columns to the kit vocabulary.** *Project settings → Board*, or click a
column header on the board. The seeder works without this — it maps `In build` onto
`In Progress` and so on — but the names are on screen during the demo and two of them are
load-bearing:

| Now | Rename to | Why it matters |
|---|---|---|
| Idea | Backlog | Join 3 is an item moving *back into* Backlog |
| To Do | Blocked | The Blocked section reads off this |
| In Progress | In build | |
| Testing | Behind flag | |
| Done | Shipped | |

**`Behind flag` and `Shipped` have to stay distinct columns.** The "merged is not shipped"
rule collapses if they're the same, and that rule is one of the more useful things the
skill teaches.

Then delete the two sample tasks, or let `reset` do it.

### 2. Seed it — 2 minutes

Create an API token at `id.atlassian.com/manage-profile/security/api-tokens`, then put it
in `~/.learn-this-jira.env`. **That file lives outside the repo on purpose** and `*.env` is
gitignored:

```
JIRA_SITE=https://<your-site>.atlassian.net
JIRA_EMAIL=<the address you signed up with>
JIRA_TOKEN=<the token>
JIRA_PROJECT=LTHIS
```

```bash
node .demo/session-2/seed-jira.mjs inspect   # what your site actually has, and the mapping
node .demo/session-2/seed-jira.mjs seed      # 14 issues, statuses, and the blocker link
node .demo/session-2/seed-jira.mjs reset     # wipe it and start over
```

`inspect` first. It prints your real issue types and statuses and shows exactly which of
them each seed status will land on, so you find out about a gap before the board is full of
issues in the wrong column.

**`reset` then `seed` is the rehearsal recovery.** If a run of the demo leaves the board
messy, that's two commands and about thirty seconds.

### 3. Point the manifest at it

Fill in the two `TODO` fields in `context-manifest.yaml` → `sources.product_backlog` (site
URL and project key) and flip `reachable` to `true`. Then connect the Jira MCP in Claude
and confirm you can read the project.

### One thing the sandbox cannot do

**Jira Cloud will not let an API client backdate `created` or `updated`.** Every seeded
issue is stamped today. The seeder puts the meaningful date in the description instead
(`Status last changed: 2026-08-11`).

None of the four joins depend on those dates — they fire off status, issue links, and what
the repo says. But **don't build the spoken version around "this ticket has been stale for
two weeks,"** because the board on screen won't back you up. The line that does hold is
*"the decision landed on Aug 4 and the ticket is still in Blocked."*

### 2. Hide the finished skill

`/build-update` is committed on this branch **as the safety net, not as the starting state.**
You are building it live on slide 17. Before you present:

```bash
git stash push .claude/skills/build-update    # and `git stash pop` if the live build stalls
```

Rehearse the recovery once. Knowing you can be back in twenty seconds is what lets you take
the risk in front of the room.

---

## What the seed data is engineered to do

Fourteen issues, and the interesting ones are there to make a specific join fire. Every one
of these needs two sources read against each other, which is the entire argument of the
session.

| Join | Fires because |
|---|---|
| **1 — blocked on something already decided** | `LTHIS-18` sits in Blocked pending a call on whether the timezone is per cohort or per learner. `product/decisions/2026-08-04-timezone-locked-at-creation.md` made that call on Aug 4 and nobody told the ticket. |
| **2 — designed, not tracked** | The Figma file has `desktop-1024 · self-serve · error` (`20:119`) and three 40px mobile nav buttons against a 44 minimum in `design/tokens.json`. Neither has a ticket. Deliberately, `LTHIS-23` *does* cover the lapsed-empty gap, so this reads as a finding rather than a flood. |
| **3 — scope moved, nothing written down** | `LTHIS-7` moved Cut → Backlog on Aug 11. `projects/cohort-scheduling/brief.md` still says "out of scope, settled." The decision log is silent. |
| **4 — a proposal reported as a plan** | `LTHIS-21` offline mode is In build. `product/decisions/2026-07-02-offline-mode.md` is `status: proposed` and Instructor Tools has not agreed. |

The reporting window is **Aug 10–16** — Monday to Sunday, per `team/how-we-work.md`. Nothing
was decided inside it, which is the honest answer and worth saying out loud: the Decided
section comes back empty and the update is better for it.

---

## Run of show — slide 17

Roughly seven minutes. The digest is the payload; the skill being born is the lesson.

| | Beat | Say |
|---|---|---|
| 1 | Connect Jira and Figma | Two connectors, both on the list from ten minutes ago |
| 2 | Open `context-manifest.yaml`, then `product/decisions/` | This is the part that isn't in either connector |
| 3 | Prompt it in plain language | *"Write me the build update for the week of Aug 10."* Nothing clever |
| 4 | Read the output | It will miss at least one join on the first pass. **Let it.** That's the beat |
| 5 | Fix the prompt, run again | Name the join it missed. Watch it pick it up |
| 6 | "Save that as a skill" | |
| 7 | Open `SKILL.md` | A description that decides when it fires, a body, a reference file beside it |
| 8 | Run it by name | |

**Do not skip beat 4.** A demo where the first prompt produces the perfect answer teaches
that this is magic, and everyone who tries it on Wednesday finds out it isn't. The refine
loop is the transferable part.

**Say the honest thing about the Jira:** it's a personal sandbox instance, not NYT's. The
connector is the same, the data is invented, and the joins are what matter.

---

## Known gaps

- [ ] Project key still `SCRUM`. Change it before seeding, or the docs cite keys that don't
      exist. The seeder warns if they drift.
- [ ] Manifest still has `reachable: false` and two `TODO` fields.
- [ ] `/weekly-digest` still reads the Notion backlog. Once `product_backlog` points at Jira,
      two skills in one repo read two different backlogs, which is exactly the incoherence a
      participant would catch. Either repoint it or retire it before Session 3.
- [ ] The worked example in `references/update-format.md` is written from the seed data but
      has not been run against a live Jira. Verify it before relying on it as the recovery.
