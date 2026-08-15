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

### 1. Stand up the Jira project — 20 minutes

Free Jira Cloud allows 10 users, which is nine more than this needs.

1. Create a site at `atlassian.com/software/jira/free`. Any personal address.
2. New project → **Team-managed** → **Software** → name it *Learn.this Webapp*, key **LTHIS**.
3. The seed uses six statuses. A team-managed project ships with three, so add the missing
   ones under *Project settings → Board → Columns*:

   | Column | Maps to |
   |---|---|
   | Backlog | To Do |
   | In build | In Progress |
   | Behind flag | In Progress |
   | Blocked | In Progress |
   | Shipped | Done |
   | Cut | Done |

   **`Behind flag` and `Shipped` have to be distinct.** The whole "merged is not shipped"
   rule in the update format collapses if they're the same column, and that rule is one of
   the more useful things the skill teaches.

4. Import `jira-seed.csv` — *Project settings → Import*. Map `Issue key` so the keys are
   preserved. `LTHIS-18`, `LTHIS-7` and `LTHIS-21` are referenced by number in the worked
   example, so they need to land on those keys.
5. One manual step the CSV can't do: link **LTHIS-9 → is blocked by → LTHIS-10**. The
   Blocked section of the update comes from that link and nothing else, so without it the
   demo shows an empty Blocked section.
6. Connect the Jira MCP and confirm you can read the project.
7. Fill in the two `TODO` fields in `context-manifest.yaml` → `sources.product_backlog`
   (site URL and project key) and flip `reachable` to `true`.

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
| **1 — blocked on something already decided** | `LTHIS-18` is Blocked pending a call on the timezone model, last touched Jul 29. `product/decisions/2026-08-04-timezone-locked-at-creation.md` made that call on Aug 4. Two weeks of a build item waiting on an answer that exists. |
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

- [ ] Jira instance not created yet. The manifest entry is scaffolded with `reachable: false`
      and two `TODO` fields.
- [ ] `/weekly-digest` still reads the Notion backlog. Once `product_backlog` points at Jira,
      two skills in one repo read two different backlogs, which is exactly the incoherence a
      participant would catch. Either repoint it or retire it before Session 3.
- [ ] The worked example in `references/update-format.md` is written from the seed data but
      has not been run against a live Jira. Verify it before relying on it as the recovery.
