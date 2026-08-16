# Webapp — roadmap and bets

> H2 2026. Refresh at half planning.
> Individual decisions and their rationale live in `../product/decisions/` — this is the
> shape of the year, not the record of how we got here.

## H2 bets

| Bet | Why | Where it lives |
|---|---|---|
| **Instructor self-scheduling** | Ops enters ~40 schedules a month by hand and gets about three wrong. Each error becomes a support thread with a whole cohort. | `../projects/cohort-scheduling/` |
| **Enrollment on mobile** | The funnel loss is almost entirely mobile, and the modal decision closed off the obvious fix. | not yet scoped |
| **Recorded playback** | The current player is the top complaint from learners who miss a live session. Blocked on a pinned vendor SDK. | `../projects/video-playback-v2/` |
| **Catalog search** | Mostly a titling problem rather than a ranking problem, which changes who has to fix it. | `../projects/search-relevance/` |

## What we said no to, and why

Keeping this list is the point of the file. These come back roughly every planning cycle,
and re-arguing them from scratch each time is the cost this is meant to avoid.

- **Personalized ranking.** Not enough behavioral data to do it well, and a bad personalized
  ranker is worse than a plain one.
- **Offline mode.** We want it. It depends on a content model change that isn't ours.
  Status is *proposed*, not roadmap — see `../product/decisions/2026-07-02-offline-mode.md`.
- **A native mobile app.** The live session is the product and it runs in a browser well
  enough. Revisit only if mobile attendance passes 60%.
- **Editing schedules after a cohort starts.** One instructor would have justified it and
  said themselves they wouldn't use it. See the interview notes in
  `../projects/cohort-scheduling/comms/`.

## Sequencing constraint worth knowing

We can't ship anything material during the two weeks around a cohort start wave — late
August and early January. Support volume triples and everyone is on tickets. Plan launches
for the middle of a cohort, not the edges.
