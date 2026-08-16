# Session 2 demo — setup and run of show

Everything here is scaffolding for running the Aug 19 demo. It is not part of the kit, and a
participant browsing this repo has no reason to read it. That's why it's in a dotfolder.

Two slides depend on this branch:

| Slide | What it needs |
|---|---|
| **11** — repo structure walkthrough | the tree, which is now `projects/` not `deliverables/` |
| **17** — turn a task into a skill | a Jira project with the seed data, and `/build-update` **deleted before you start** |

---

## The Jira

**Site:** `summerfriday-team.atlassian.net` · **Project:** *Learn.This Webapp Team*, key
`SCRUM` · free plan, team-managed Scrum.

**Seeded 2026-08-16 over the Atlassian MCP.** `SCRUM-5` through `SCRUM-18`, statuses set,
and `SCRUM-10 is blocked by SCRUM-11` linked. The board is ready.

| Key | | Status |
|---|---|---|
| SCRUM-5 | Set a schedule at cohort creation | In build |
| SCRUM-6 | Edit a schedule before the cohort starts | In build |
| SCRUM-7 | Cohort timezone picker | Behind flag |
| SCRUM-8 | Render session times in the cohort timezone | In build |
| **SCRUM-9** | **External calendar sync** | **Backlog** ← join 3 |
| SCRUM-10 | Vendor SDK upgrade | Blocked, by SCRUM-11 |
| SCRUM-11 | Session-recording regression pass | Backlog |
| SCRUM-12 | Course title normalization | Backlog |
| SCRUM-13 | Mobile enrollment 320px pass | In build |
| **SCRUM-14** | **Timezone model: per cohort or per learner** | **Blocked** ← join 1 |
| **SCRUM-15** | **Offline mode** (Epic) | **In build** ← join 4 |
| SCRUM-16 | Lapsed learner: recordings-expired empty state | Backlog |
| SCRUM-17 | Inline enrollment confirmation | Shipped |
| SCRUM-18 | Catalog search ranking | Backlog |

## Still to do before the session

### 1. Delete the four sample issues

`SCRUM-1` to `SCRUM-4` — *Task 1*, *Task 2*, *Task 3*, *Subtask 2.1*. The Atlassian MCP has
no delete tool, so this is a manual pass in the UI. `seed-jira.mjs reset` can also do it,
but it deletes **everything** in the project including the seed.

### 2. Rename the board columns

*Project settings → Board*, or click a column header. **This is now required, not optional**
— the issues were transitioned into the default statuses, so `SCRUM-10` and `SCRUM-14` are
sitting in a column literally called *To Do* until you rename it.

| Now | Rename to | Why it matters |
|---|---|---|
| Idea | Backlog | Join 3 is an item moving *back into* Backlog |
| To Do | Blocked | The Blocked section reads off this. **Two issues are parked here** |
| In Progress | In build | |
| Testing | Behind flag | |
| Done | Shipped | |

**`Behind flag` and `Shipped` have to stay distinct columns.** The "merged is not shipped"
rule collapses if they're the same, and that rule is one of the more useful things the
skill teaches.

### 3. Optional — change the project key to `LTHIS`

*Project settings → Details*. Issue **numbers** are preserved, so `SCRUM-14` becomes
`LTHIS-14` and nothing else has to change. Worth it because `LTHIS-14` on a screen reads
like a real team's tracker and `SCRUM-14` reads like a template nobody configured.

If you do it, one command re-points every reference in this repo:

```bash
grep -rl 'SCRUM-' --include='*.md' --include='*.csv' . | xargs sed -i '' 's/SCRUM-/LTHIS-/g'
```

### 4. What the seeder is still for

`seed-jira.mjs` needs an API token in `~/.learn-this-jira.env` (outside the repo; `*.env` is
gitignored). It is no longer needed to *create* the board, but **`reset` then `seed` is the
rehearsal recovery** — if a run of the demo leaves the board messy, that is two commands and
about thirty seconds. Worth setting up the token for that alone.

```bash
node .demo/session-2/seed-jira.mjs inspect   # statuses, types, and the mapping
node .demo/session-2/seed-jira.mjs reset     # delete everything in the project
node .demo/session-2/seed-jira.mjs seed      # rebuild from jira-seed.csv
```

### One thing the sandbox cannot do

**Jira Cloud will not let an API client backdate `created` or `updated`.** Every seeded
issue is stamped 2026-08-16. The meaningful date is in the description instead
(`Status last changed: 2026-08-11`).

None of the four joins depend on those dates — they fire off status, issue links, and what
the repo says. But **don't build the spoken version around "this ticket has been stale for
two weeks,"** because the board on screen won't back you up. The line that does hold is
*"the decision landed on Aug 4 and the ticket is still in Blocked."*

### 5. Hide the finished skill

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
| **1 — blocked on something already decided** | `SCRUM-14` sits in Blocked pending a call on whether the timezone is per cohort or per learner. `product/decisions/2026-08-04-timezone-locked-at-creation.md` made that call on Aug 4 and nobody told the ticket. |
| **2 — designed, not tracked** | The Figma file has `desktop-1024 · self-serve · error` (`20:119`) and three 40px mobile nav buttons against a 44 minimum in `design/tokens.json`. Neither has a ticket. Deliberately, `SCRUM-16` *does* cover the lapsed-empty gap, so this reads as a finding rather than a flood. |
| **3 — scope moved, nothing written down** | `SCRUM-9` moved Cut → Backlog on Aug 11. `projects/cohort-scheduling/brief.md` still says "out of scope, settled." The decision log is silent. |
| **4 — a proposal reported as a plan** | `SCRUM-15` offline mode is In build. `product/decisions/2026-07-02-offline-mode.md` is `status: proposed` and Instructor Tools has not agreed. |

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

- [ ] Four sample issues (`SCRUM-1` to `SCRUM-4`) still on the board.
- [ ] Board columns still have Jira's default names, so two issues sit in *To Do* when they
      mean *Blocked*.
- [ ] `/weekly-digest` still reads the Notion backlog. Now that `product_backlog` points at Jira,
      two skills in one repo read two different backlogs, which is exactly the incoherence a
      participant would catch. Either repoint it or retire it before Session 3.
- [ ] The worked example in `references/update-format.md` is written from the seed data but
      has not been run against a live Jira. Verify it before relying on it as the recovery.
