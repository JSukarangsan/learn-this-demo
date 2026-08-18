# Session list — states coverage

Generated with `/states-table` against the Figma file after the Aug 4 review, then
checked by hand. Ines, Aug 5.

**Figma** · [Learn.this Webapp](https://www.figma.com/design/YA4IogBXflpPsX5HEAm78o) →
page *Cohort scheduling*. Frames are named `Screen / viewport / state`.

I added **`schedule-changed`** as a fifth condition. It isn't in the default set — the
review spent twenty minutes on what a learner sees when an instructor moves a session,
and we didn't have a screen for it. Both the desktop and 320 variants are drawn.

---

```
Session list — states coverage
3 screens × 2 viewports × 4 learner states × 5 conditions

DESIGNED (11)
  ✓ Session list     · desktop    · default
  ✓ Session list     · mobile-320 · default
  ✓ Session list     · desktop    · schedule-changed      ← new
  ✓ Session list     · mobile-320 · schedule-changed      ← new
  ✓ Session list     · desktop    · empty (nothing scheduled yet)
  ✓ Session detail   · desktop    · default
  ✓ Session detail   · mobile-320 · default
  ✓ Session detail   · desktop    · schedule-changed      ← new
  ✓ Schedule editor  · desktop    · default
  ✓ Schedule editor  · desktop    · error-invalid-time
  ✓ Schedule editor  · mobile-320 · default


MISSING — ranked by what the layer says it costs (6)

  ✗ Session list · lapsed learner · all viewports
  ✗ Session detail · lapsed learner · all viewports
        why it matters: product/glossary.md — lapsed is "the most-forgotten state. They
        still have recordings and still get email, so they land on screens nobody
        designed for them." A lapsed learner following an email link lands on the
        session list of a cohort that ended. Nothing is drawn for that.

  ✗ Session list · mobile-320 · empty
        why it matters: design/CLAUDE.md — "Every screen works at 320px." The empty
        state exists on desktop only.

  ✗ Session list   · loading
  ✗ Session detail · loading
        why it matters: session times resolve against the cohort timezone, which is a
        server round trip. There is no loading design.

  ✗ Schedule editor · mobile-320 · error-invalid-time
        why it matters: the desktop error is drawn, the 320 one isn't, and the error
        copy is long enough that it will not fit.


N/A — forbidden by a written rule (2)
  – Session list · assigned learner · any pricing element
        design/CLAUDE.md — "Assigned learners don't see pricing. Ever."
  – Schedule editor · modal variant
        product/decisions/2026-05-19-no-modals-in-enrollment.md


UNVERIFIED
  – Accessibility. I can read frame names, not contrast or focus order. The
    schedule editor is a time input and almost certainly has a focus-order problem.
    Nothing here should be read as an accessibility pass.
```

---

## Open, for the engineers

The `schedule-changed` screens assume the learner gets told. I don't know whether that's
an in-product banner, an email, or both, and the answer changes what the 320 layout has
to hold. Whoever picks it up — say which and I'll adjust.
