# Projects

Read on top of `../CLAUDE.md`. One folder per piece of work in flight.

Everything above this folder is true regardless of what we're building this quarter — the
glossary, the constraints, the tokens, who owns what. Everything in here is true of exactly
one project and stops being true when that project ships.

**If you find yourself writing something here that would still be true after this project
ends, it belongs upstairs.** That is the whole rule, and it's the one that keeps a project
folder from slowly becoming a second copy of the team's context.

## The shape

```
<project>/
├── CLAUDE.md                what this is, and what already bit us
├── comms/                   meetings about this project. Raw. Never canonical.
└── deliverables/
    ├── requirements/        what we're building and how we'll know it's done
    ├── research/            evidence. What we learned, and from whom.
    ├── design/              states and flows for this project only
    └── launch/              how it goes out, and what we watch after
```

`deliverables/` is split by **the stage of work that produced the artifact**, not by what
the artifact is. A brief and an acceptance list are different documents that come out of
the same conversation, so they sit together. The reason to organise it this way is that
when something new gets made, the stage it came from is usually obvious and its file type
usually isn't — so the folder tells you where to put it without anyone having to decide.

## Folders appear when there is something to put in them

**Do not scaffold the empty ones.** An empty `launch/` on a project nobody has started
tells a reader — and an agent — that a launch plan exists somewhere and they failed to
find it. Nothing is a better signal than an empty folder pretending.

This means the four projects in here don't look alike, and that's the point. You can read
the state of the work off the tree:

| | State | What exists |
|---|---|---|
| `cohort-scheduling/` | in build | all four stages |
| `enrollment/` | shipped, still learning | requirements and the meeting that found a gap |
| `search-relevance/` | scoped | requirements |
| `video-playback-v2/` | not started | `CLAUDE.md` and an honest list of what nobody has decided |

## `comms/` sits here, not upstairs

A meeting about one project belongs to that project. `../comms/notes/` is for meetings
that span projects, and `../comms/status/` is for what we told people, which is generated.

The rule from `../comms/CLAUDE.md` applies here unchanged and matters more, because the
proximity is misleading: **a note in `cohort-scheduling/comms/` is sitting next to that
project's requirements and it is still not a requirement.** Someone proposing something in
a meeting reads exactly like someone deciding it. If a meeting settled something, the
decision goes in `../product/decisions/` and the note stays here as the transcript that
led to it.

## What a project `CLAUDE.md` is for

Not a summary of the folder — an agent can read the folder. It's for the things that are
true about this project and written down nowhere else: the mistake we already made, the
thing that is settled and keeps getting re-proposed, the constraint that isn't obvious
until you've hit it.

Each one is three or four paragraphs. If yours is getting long, most of it is either a
requirement (`deliverables/requirements/`) or team context (upstairs).
