# Cohort scheduling — rollout

How it goes out, and what we watch after. Not started; the timezone picker is still behind
a flag and `../requirements/acceptance.md` has open boxes.

## Order

**1. Flag on for internal cohorts only.** We run cohorts for our own onboarding. If the
timezone handling is wrong, it's wrong for us first.

**2. Flag on for instructors who already schedule through ops correctly.** Priyanka can
name them. This is deliberately the easy cohort — we are testing the flow, not the edge
cases, and a first week full of edge cases tells us nothing about either.

**3. Everyone, ops path still available.** Both paths live simultaneously for at least two
weeks.

**4. Ops path off.** Only after two consecutive weeks at zero hand-entered schedules. This
is the acceptance bar and it is also the last reversible moment, so it gets its own step
rather than being folded into step 3.

## What we watch, and what it would mean

| | Signal | If it moves |
|---|---|---|
| Hand-entered schedules per week | should go to zero | Flat means instructors are starting the flow and giving up. Look at where, not at whether |
| Schedule corrections after a cohort goes live | should go to zero | **A correction after launch is worse than before.** Before, ops made the mistake; now the instructor did, and they have less recourse |
| Time to create a cohort | **will go up. That is the trade** | See `../requirements/acceptance.md`. Do not report this as a regression |

Every number here uses `../../../../insights/definitions.md`. Check the *what a move
signals* line before calling any of these good or bad.

## Rollback

The flag turns it off and the ops path is still live through step 3, so rollback is one
toggle until step 4. **After step 4 it is not**, because instructors will have set
schedules that ops never saw and turning the feature off doesn't unset them. Step 4 is the
one-way door and that is the entire reason it's a separate step.

## Not doing

**No announcement email before step 3.** Telling every instructor about a flow two dozen
of them can reach generates support load about access, which is the least useful kind.

**No migration of existing cohorts.** A cohort that already has a hand-entered schedule
keeps it. Its timezone was never explicitly chosen, so migrating it means guessing, and
guessing the timezone is the exact failure this project exists to remove.
