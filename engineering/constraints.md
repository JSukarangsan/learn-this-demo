# Do not

Short and absolute. This file fails differently from everything else in the repo:
every other file failing means an agent knows less and does less. This one failing
means it confidently recommends the dangerous thing.

- **Never write to the `enrollments` table directly.** Everything goes through the
  enrollment service. We tried direct writes in 2025 and it double-enrolled learners
  when a payment retried. The indirection looks unnecessary in the code. It is not.
  Do not "simplify" it.

- **`learners_v2` is canonical. `learners` still populates and looks fine.**
  It's a zombie — the backfill never got turned off. Every query against `learners`
  returns plausible, wrong numbers, which is worse than returning nothing.

- **No enrollment change inside a cohort that has already started** without an
  instructor confirmation step. Refunds are manual and Finance eats the difference.

- **No session time or timezone change inside a cohort that has already started**,
  same path, same reason. Learners hold a calendar invite we generated at enrollment
  and cannot revoke. Moving a session means re-issuing every invite and giving every
  affected learner a decision. **That confirmation path does not exist yet.** Any flow
  that assumes it does is describing a different project — see
  `../deliverables/cohort-scheduling/engineering-notes.md`.

- **Unsubscribe and exit resolve in one click.** No confirmation screen, no "are you
  sure," no exit survey. This is a legal requirement, not a design preference. It will
  look like an easy retention win. It isn't.

- **The vendor video SDK is pinned.** It cannot be upgraded without a full session-recording
  regression pass. An upgrade that looks routine has broken live sessions twice.
