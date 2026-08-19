# Refresh log

**Derived, not authored.** Newest first. Nothing here is canonical and deleting it costs
nothing except the answer to *when did anyone last check this*, which is the only question
it exists to answer.

Two kinds of entry, both marked in their heading. **pipeline** is
`.github/workflows/refresh-context.yml` writing down what it fetched. **/refresh-index**
is a person checking the pointers themselves. They answer the same question from opposite
ends — one proves the fetching still works, the other proves the addresses are still right
— and a run of either without the other leaves half the layer unchecked.

Entries are never edited after the fact. If a later run disagrees with an earlier one, that
disagreement is the useful part.

---

## 2026-08-16 — /refresh-index

Seven sources. Every address resolved.

```
CONFIRMED    product_backlog   Jira SCRUM, 18 issues read. jira in available_connections.
CONFIRMED    instructor_nps    Notion page resolves. Last edited 2026-08-05 = last_confirmed.
CONFIRMED    h2_planning       Google Doc resolves. "Learn.this — H2 2026 Planning".
CONFIRMED    cohort_calendar   Google Sheet resolves. Rows through LT-0915.
CONFIRMED    vendor_video_sla  Not reachable, and the workaround happened: the Q3 export
                               is in insights/ and covers the current quarter.
CONFIRMED    contract_terms    Not reachable, deliberate: true. Still correct. Not drift.
DRIFTED      product_ui        Our description of it is behind the file, not the file
                               behind us. See below.
UNKNOWN      product_ui        Cannot be date-checked at all. See below.
```

**Three findings, in the order they matter.**

**1. The refresh pipeline has never run.** `h2_planning`, `cohort_calendar` and
`instructor_nps` each declare a `summarize_to`. All three targets are missing;
`team/_generated/` holds only its README and this file. The workflow is scheduled Mondays
06:00 UTC and has never opened a PR.

This is the one worth acting on, and it is exactly the silent failure the manifest is
supposed to surface. Every pointer resolves, every source is real, and the derived layer
that three entries claim to produce was never built. Nobody would have tripped over it.

A dry run fetched all three sources successfully (4,324 / 1,125 / 21,256 characters). The
fetching half works. What is missing is `ANTHROPIC_API_KEY` in the repo secrets, so the
summarize step has never executed.

**2. `product_ui` drifted, and we already knew.** The manifest says frames are named
`Screen / viewport / state`. `design/states/signed-in-home.md` recorded weeks ago that four
frames use a fourth `condition` segment, and says outright that the manifest line is behind
the file. The generated artifact caught the drift and nothing carried it back here.

**3. `product_ui` cannot be dated.** The Figma tooling returns structure, not a modified
timestamp. Reported `UNKNOWN` rather than a confident `CONFIRMED`, per the rule. Worth
knowing: `refresh: live` on that entry means *always fetched*, not *known current*.

**Proposed, not applied.**

```diff
   product_ui:
-    last_confirmed: 2026-08-05
+    last_confirmed: 2026-08-16
     notes: >
-      Design system and product UI. Frames are named `Screen / viewport / state`.
+      Design system and product UI. Frames are named `Screen / viewport / state`,
+      and some add a fourth `condition` segment. Both parse.

   h2_planning / cohort_calendar / instructor_nps:
-    last_confirmed: 2026-08-05
+    last_confirmed: 2026-08-16
```

The `summarize_to` finding is deliberately left open. The fix is either running the pipeline
or admitting in the manifest that the generated layer does not exist yet, and neither of
those is a `last_confirmed` bump.
