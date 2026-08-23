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

## 2026-08-21 — /refresh-index (end-to-end test)

Deliberate round-trip against the live H2 planning doc, to prove the one path the other
checks couldn't reach: a real upstream change producing a proportional edit rather than a
regenerated file.

Changed `82% to 88%` → `82% to 90%` in the source doc, ran the gate, made the edit, then
put the doc back. Three things worth keeping:

**The size didn't change and the gate caught it anyway.** 4338 → 4338 bytes, +0%, because
`88` and `90` are the same length. Every byte-count or content-length heuristic would have
called that unchanged. Only the digest saw it. This is the case that justifies hashing over
any cheaper comparison.

**The edit was one line.** The source moved on exactly one line, and so did
`team/_generated/h2-planning.md` — the `Enrollment completion` row, plus the fingerprint
and the two dates that record when the body was written. A full regenerate would have
reworded all 80 lines and buried a two-character change in the noise.

**It is deterministic.** Reverting the doc returned the fingerprint to
`sha256:45dfc6ba…`, bit for bit the value it held before the test. Same content, same
hash, gate quiet again.

Net change to this repo from the test: none. The doc is back at 88%, the summary is back to
what it was, and `team/goals-and-okrs.md` — which carries the same target by hand and would
have been left silently disagreeing — was never touched.

## 2026-08-21 — /refresh-index

**Mechanism change, not a content check.** Drift is now detected by hashing the source
body, not by comparing dates. Every entry below this one reports `UNKNOWN` for
`h2_planning` and `cohort_calendar` because those sources expose no `Last-Modified`, no
`ETag` and no `Content-Length` — there was never a date to compare `last_confirmed`
against, so `UNKNOWN` was the only state those two could ever reach. The bodies are
byte-stable, so a SHA-256 answers what a timestamp couldn't. Both files now carry the
fingerprint they were generated from, and the two pipeline entries below are the gate's
first two real runs.

**The first of those two is a false positive, and it stays in the log.** It reports
`h2_planning` as `CHANGED`, 4341 → 4324 bytes. The document did not change. The
fingerprint had been backfilled by hand with `curl … | shasum -a 256`, which computes
something different from what the script does: these exports carry a UTF-8 BOM that
`fetch().text()` strips and `curl` doesn't, and the byte count had been taken with
`String.length`, which counts characters — 17 fewer than the real UTF-8 size, because the
doc is full of em-dashes. A fingerprint that was never going to match reads exactly like a
source that keeps changing.

Fixed rather than papered over: sizes are now real byte lengths, and
`refresh-context.mjs --fingerprint` prints the line to paste so nobody computes one by
hand again. Both are covered by tests. Left in the log because the next person to see a
source that "changes" every run needs to find this, and a corrected entry would have hidden
the one worked example of it.

Not re-run today: the phase-1 pointer checks against Jira, Slack and Figma. Nothing in this
change touches them, and the 2026-08-20 entry below still stands — including
`cohort_scheduling_flow`, which has now been `UNREACHABLE` for three consecutive runs and
needs Ines rather than a fourth check.

Proposed edits (not applied):
```diff
  h2_planning:
-   last_confirmed: 2026-08-05
+   last_confirmed: 2026-08-21   # now genuinely checkable — fingerprint matches
  cohort_calendar:
-   last_confirmed: 2026-08-05
+   last_confirmed: 2026-08-21   # same
```

---

## 2026-08-21 — pipeline

`refresh-context.yml`. 7 checked — 2 unchanged, 0 changed, 0 missing, 5 skipped by design.

Unchanged: `h2_planning`, `cohort_calendar`.

Skipped by design: `product_backlog`, `team_chat`, `product_ui`, `cohort_scheduling_flow`, `vendor_video_sla`.

Nothing moved. Every cached copy still matches its source.

## 2026-08-21 — pipeline

`refresh-context.yml`. 7 checked — 1 unchanged, 1 changed, 0 missing, 5 skipped by design.

**CHANGED** — `h2_planning`
4341 → 4324 bytes (-0.4%). sha256 292b7877… → 45dfc6ba….
`team/_generated/h2-planning.md` was generated from the older version — run `/refresh-index` to judge
whether anything the summary asserts is now wrong.

Unchanged: `cohort_calendar`.

Skipped by design: `product_backlog`, `team_chat`, `product_ui`, `cohort_scheduling_flow`, `vendor_video_sla`.

## 2026-08-20 — /refresh-index (regenerate)

The pipeline run just above failed on the missing `ANTHROPIC_API_KEY` before it fetched
anything. Per the new "Regenerate what's missing or stale" step, stood in for it: fetched
both stale `summarize_to` targets directly and summarized them against the same rules in
`refresh-context.mjs`'s `PROMPT` constant.

```
REFRESHED    h2_planning       → team/_generated/h2-planning.md (4341 chars in, 3781 out)
REFRESHED    cohort_calendar   → team/_generated/cohort-calendar.md (1129 chars in, 1967 out)
```

Both files carry a banner naming `/refresh-index` as the author, not the automated
pipeline — the key still isn't set, and claiming otherwise would be exactly the kind of
silent gap this file exists to catch. `last_confirmed` on both entries is still not
bumped: this closes the "no copy exists" finding, not the "is reachable: true still
true" one, and those stay two separate questions per the skill's own rule.

---

## 2026-08-20 — pipeline

`refresh-context.yml`. 0 refreshed, 1 failed, 5 skipped by design.

```
FAILED       ANTHROPIC_API_KEY       not set in the repo secrets, so nothing can be summarized.
SKIPPED      product_backlog         no copy in this repo, read the source
SKIPPED      team_chat               no copy in this repo, read the source
SKIPPED      product_ui              no copy in this repo, read the source
SKIPPED      cohort_scheduling_flow  no copy in this repo, read the source
SKIPPED      vendor_video_sla        a person maintains insights/vendor-video-sla-2026-q3.md
```

The failure above is the finding. Nothing else in this run needs reading.

## 2026-08-20 — /refresh-index

7 sources checked — 4 confirmed, 0 drifted, 1 unreachable, 2 unknown.

**CONFIRMED** — `product_backlog`
Jira SCRUM resolves ("Learn.This Webapp Team", project id 10000). `jira` in
`available_connections`. Spot-checked recent issues (SCRUM-10 through SCRUM-17) — live.

**CONFIRMED** — `team_chat`
`#demo-learn-this` resolves (private channel, created 2026-08-05, id C0BN16U371T). `slack`
in `available_connections`. Note for next time: this tooling's default channel search is
public-only — a plain search for the name returns nothing unless `private_channel` is
included in scope. Not drift, just a gotcha worth writing down so it doesn't get misread
as UNREACHABLE next run.

**CONFIRMED** — `product_ui`
Figma file resolves. Still one page in the document ("01 · Home", node 8:2), consistent
with the 08-16 correction applied to the manifest notes on 08-19. No modified date exposed
— same limitation as every run.

**UNREACHABLE** — `cohort_scheduling_flow`
`reachable: true` claimed, still isn't. Same finding as 08-19, unchanged: the file has
exactly one page, "01 · Home" — no page or frame named "Cohort scheduling" exists anywhere
in the document. Second consecutive run with this result. Still needs a person (Ines) to
either restore the page or repoint the entry — not something a third check will resolve.

**UNKNOWN** — `h2_planning`
Cached. Doc resolves (307 → 200 on follow), no Last-Modified header exposed.
`summarize_to`'s target (`team/_generated/h2-planning.md`) still does not exist. The
08-19 pipeline fix (`4a2f99b`) hasn't actually run yet — this log carries zero `—
pipeline` entries. Not bumping `last_confirmed`; a resolves-check isn't a copy-match
check with nothing to compare against.

**UNKNOWN** — `cohort_calendar`
Same shape as `h2_planning`: resolves, no date exposed, `team/_generated/cohort-calendar.md`
still missing, same root cause (pipeline hasn't run since the fix).

**CONFIRMED** — `vendor_video_sla`
Deliberately unreachable (no API, SSO only) — correct, unchanged. Workaround on schedule:
`insights/vendor-video-sla-2026-q3.md` covers Q3 2026 through Aug 4; next export due first
week of October.

Proposed edits (not applied):
```diff
  product_backlog:
-   last_confirmed: 2026-08-16
+   last_confirmed: 2026-08-20
  team_chat:
-   last_confirmed: 2026-08-19
+   last_confirmed: 2026-08-20
+   reachability_note: ...append: "channel search defaults to public_channel only; include
+   private_channel in scope or a private channel search returns a false negative."
  product_ui:
-   last_confirmed: 2026-08-16
+   last_confirmed: 2026-08-20
  vendor_video_sla:
-   last_confirmed: 2026-08-04
+   last_confirmed: 2026-08-20
  cohort_scheduling_flow:    # no bump — still broken, second consecutive run
  h2_planning:               # no bump — no copy to check against
  cohort_calendar:           # no bump — no copy to check against
```

---

## 2026-08-19 — /refresh-index

Seven sources (down from the prior run's seven — `instructor_nps` and `contract_terms`
were retired from the manifest on 2026-08-19, so this run checks `product_backlog`,
`team_chat`, `product_ui`, `cohort_scheduling_flow`, `h2_planning`, `cohort_calendar`,
`vendor_video_sla`).

```
CONFIRMED    product_backlog        Jira SCRUM resolves ("Learn.This Webapp Team",
                                     project id 10000). jira in available_connections.
CONFIRMED    team_chat               #demo-learn-this resolves (private channel,
                                     created 2026-08-05). slack in available_connections.
CONFIRMED    product_ui              Figma file resolves. Frame names confirmed in both
                                     shapes the notes now describe: three-segment
                                     (`Home / desktop / logged-out`) and four-segment with
                                     a condition (`Home / desktop / logged-out / sold-out`).
                                     The 08-16 correction holds.
UNREACHABLE  cohort_scheduling_flow  reachable: true claimed, but isn't. The file has
                                     exactly one page — `01 · Home` (node 8:2). No page
                                     or frame named "Cohort scheduling" exists anywhere
                                     in the document; searched the full metadata tree for
                                     "cohort" and "schedul" and found only copy text
                                     ("Live cohorts...", "Nothing scheduled") inside Home
                                     frames, not a distinct flow. Either the page was
                                     removed/renamed in Figma, or this entry was never
                                     pointed at a real page. Not a naming nuance — a
                                     person needs to check with Ines.
UNKNOWN      h2_planning             Cached. Doc still resolves (fetch redirects 307,
                                     200 on follow), but the export endpoint exposes no
                                     Last-Modified header — same limitation product_ui
                                     already carries, undocumented here. Separately, and
                                     more importantly: summarize_to's target,
                                     team/_generated/h2-planning.md, still does not exist.
                                     Same open finding as 08-16 — the pipeline has not run
                                     since. Not bumping last_confirmed, per that run's
                                     rule: a resolves-check isn't a copy-match check when
                                     there is no copy to check.
UNKNOWN      cohort_calendar         Same as h2_planning: resolves, no date exposed,
                                     team/_generated/cohort-calendar.md still missing.
CONFIRMED    vendor_video_sla        Not reachable, deliberately (no API, SSO only). The
                                     workaround happened and is on schedule:
                                     insights/vendor-video-sla-2026-q3.md covers Q3
                                     2026, explicitly partial "through Aug 4," next export
                                     "first week of October." Nothing due yet.
```

**Three findings, in the order they matter.**

**1. `cohort_scheduling_flow` is broken, not just stale.** This is new since 08-16 — that
run didn't check it (it wasn't in the seven it listed) or it passed unremarked; either way
it fails today. `/states-table` reads this entry to resolve one Figma page, and the page
isn't there. Worth a message to Ines before anyone runs that skill against it.

**2. The `summarize_to` gap from 08-16 is still open.** `h2_planning` and
`cohort_calendar` still have no file under `team/_generated/`. Three weeks since the
prior check flagged it as "the one worth acting on." Still no `ANTHROPIC_API_KEY` in repo
secrets, still no pipeline run — nothing in `refresh-log.md` shows a `— pipeline` entry
since this log started. Repeating the 08-16 recommendation: either run the pipeline by
hand (`node .github/scripts/refresh-context.mjs`) or edit the manifest to admit the
generated layer doesn't exist yet.

**3. `product_ui`'s 08-16 correction held.** The frame-naming note (three-segment and
four-segment forms) matches what's actually in the file today. Confirms the prior fix,
nothing more to do there.

**Proposed, not applied.**

```diff
   product_backlog:
-    last_confirmed: 2026-08-16
+    last_confirmed: 2026-08-19

   product_ui:
-    last_confirmed: 2026-08-16
+    last_confirmed: 2026-08-19

   cohort_scheduling_flow:
-    reachable: true # via Figma MCP
+    reachable: false # page "Cohort scheduling" does not exist in the file — checked 2026-08-19
     last_confirmed: 2026-08-05
+    # last_confirmed intentionally not bumped — this is the date it was last known good,
+    # not the date it was last checked.
```

`h2_planning` / `cohort_calendar`: no diff proposed. Same reasoning as 08-16 — the
`summarize_to` gap isn't a `last_confirmed` question, it's a pipeline question.
`vendor_video_sla`: no diff proposed — `last_confirmed` already matches the export's own
"through Aug 4" date; nothing new happened to confirm.

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
