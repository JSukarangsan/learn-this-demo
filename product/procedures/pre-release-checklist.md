# Pre-release checklist

A thing you **run**, not reference material you read. Stop when you reach the end.

This exists so someone who isn't on Webapp can do the first pass. If you need us to
walk you through it, the checklist has a gap — tell us which step.

1. **Flag is off in production.** Confirm in the dashboard, not from the PR.
2. **320px.** Open the flow at 320 wide. If anything is cut off, stop here.
3. **Both learner types.** Walk it as a self-serve learner and as an org-assigned learner.
   They diverge at enrollment and at billing, every time.
4. **Timezone.** Set your machine to a timezone that isn't the cohort's and walk the
   schedule screens. This is where it breaks. See `../../deliverables/cohort-scheduling/`.
5. **Unsubscribe and exit paths still resolve in one click.** No new interstitials.
   See `../../engineering/constraints.md`.
6. **Empty and error states have real copy.** Not lorem, not the default string.
7. **No new direct writes to `enrollments`.** Grep the diff.

Done means all seven pass and the flag is still off. Not that it's merged.
