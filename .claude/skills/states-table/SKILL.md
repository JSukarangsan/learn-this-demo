---
name: states-table
description: Work out every state a screen or flow owes — user state, viewport, and condition — by reading the Figma file and the context layer, then report what's designed and what's missing. Use when a designer asks what states they need, for a states audit, an accessibility and states check, or coverage on a flow.
---

# States table

Design's version of a context artifact is not a prose file. It's a **matrix**, and a matrix
is the shape markdown is worst at — to answer one question you'd have to read all of it.

So don't write it down. Generate it on demand. That's this skill.

## Read

**The required axes come from the context layer, not from you.** Never invent a state.

| Axis | Where it comes from |
|---|---|
| **Learner state** | `product/glossary.md` → *Learner states — the canonical list*. Four: anonymous, self-serve, assigned, lapsed. |
| **Viewport** | `design/tokens.json` → `breakpoint`. `min` is 320 and it is not an edge case — check `design/CLAUDE.md` for why. |
| **Condition** | default · empty · loading · error. Plus any condition named in the project brief. |
| **Accessibility** | `design/CLAUDE.md` and any rule in `team/` — these are requirements on every cell, not a column |
| **Design rules that kill cells** | `design/CLAUDE.md` — e.g. *no modals in enrollment*, *assigned learners never see pricing*. A cell that a rule forbids is **N/A**, not missing. |

**What's designed** comes from the Figma file in `index.md` → *Design system + product UI*.
Read it via the Figma MCP. Frames are named `Screen / viewport / state` — parse that.

**The state segment often won't be a canonical learner state, and that is a finding.**
Design files drift toward auth vocabulary — `logged-out`, `logged-in` — while the glossary
is written in entitlement vocabulary. Handle it like this:

| Frame says | Do |
|---|---|
| a name in `glossary.md` | use it |
| a name that maps to exactly one canonical state (`logged-out` → **anonymous**) | map it, and say in the report that you did |
| a name that could be more than one (`logged-in` → self-serve **or** assigned) | **unclassified.** Don't pick. Report the frame, the ambiguity, and what would disambiguate it |

Never silently resolve an ambiguous frame. A designer reading "self-serve is covered" when
the frame was called `logged-in` will believe it, and the assigned case is the one that
carries the pricing rule.

## Produce

```
{Flow} — states coverage

DESIGNED ({n})
  ✓ {screen} · {viewport} · {learner state} · {condition}

MISSING ({n})
  ✗ {screen} · {viewport} · {learner state} · {condition}
      why it matters: {pull the reason from the layer, don't invent one}

N/A ({n})
  – {cell} — {the rule that forbids it, and where it's written}

ACCESSIBILITY — unverified on all {n} designed frames
  Nothing in the Figma file records contrast, focus order, or labels.
  This is a gap in the file, not in this report.
```

## Rules

- **Every "missing" cell needs a reason from the layer.** If you can't find one, list it as
  missing without a reason rather than inventing a rationale. Made-up justification is worse
  than a bare list — a designer will check.
- **Rank missing cells by the layer's own evidence.** A state the design file says is
  most-forgotten, or one a constraint touches, outranks a theoretical combination.
- **Don't propose designs.** This returns coverage. What to do about it is the designer's call.
- **Be honest about accessibility.** You can read layer names and structure; you cannot read
  contrast or focus order from frames. Say that rather than implying a pass.

## Stop and ask when

- The Figma file has frames whose names don't parse — report them as unclassified rather
  than guessing which state they represent
- A learner state in the glossary has no designed frame anywhere in the flow. That's usually
  a scoping question, not an oversight.
