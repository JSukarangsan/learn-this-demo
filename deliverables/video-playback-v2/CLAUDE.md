# Project — Video playback v2

Replacing the recorded-session player. Not started; scoping only.

## Before anyone proposes anything

The vendor SDK is pinned and cannot be upgraded without a full session-recording
regression pass. See `../../engineering/constraints.md`. Two previous "routine" upgrades
broke live sessions. Any plan that starts with "upgrade the SDK" needs that pass costed in.

## Open, genuinely undecided

Whether recordings stay with the vendor or move to our own storage. Cost model differs
by roughly an order of magnitude in both directions depending on retention, and nobody
has done the arithmetic yet.
